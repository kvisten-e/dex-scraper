import { useState, useEffect, useContext, useRef } from "react"
import * as web3 from '@solana/web3.js';
import { SystemProgram, SystemInstruction, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { GlobalContext } from './GlobalContext.jsx';

export default function pumpTokens({ minValueProp, maxValueProp, decimalerProp, maxTransactionsInWalletProp, dexChoiceProp, triggerAction, allDex, allDexArr }) {

  const { params } = useContext(GlobalContext)
  const { signal } = useContext(GlobalContext)
  const [loading, setLoading] = useState(false);
  const isMountedRef = useRef(false);
  const [result, setResult] = useState([])
  const [minValue, setMinValue] = useState(0)
  const [maxValue, setMaxValue] = useState(0)
  const [decimaler, setDecimaler] = useState(0)
  const [wallet, setWallet] = useState('')
  const [allDexBool, setAllDexBool] = useState()
  const [allDexArrFetch, setAllDexBoolFetch] = useState([])
  const [maxTransactionsInWallet, setMaxTransactionsInWallet] = useState(0)
  const [resultList, setResultList] = useState([])
  const [buttonClickCounter, setButtonClickCounter] = useState(0)
  const [completedDexes, setCompletedDexes] = useState(0)
  const [totalWalltes, setTotalWallets] = useState(0)
  useEffect(() => {
    if (triggerAction) {
      async function main() {
        setLoading(true); 
        if (!allDexBool) {
          await snipare(minValue, maxValue, decimaler, wallet, maxTransactionsInWallet)          
        } else {
          await snipare(minValue, maxValue, decimaler, allDexArrFetch, maxTransactionsInWallet) 
        }
        console.log("Result: ", resultList)
        
        resultList.sort((a, b) => {
          const dateA = new Date(a.time);
          const dateB = new Date(b.time);
          return dateB - dateA;
        });   
        
        setLoading(false)
        if (resultList) {
          setResultList([])
          setResult(resultList)      
        }  
      }
      main()

      async function snipare(minValueNew, maxValueNew, decimalerNew, walletNew, maxTransactionsInWalletNew ) {

        const rotateRPC = createRPCRotator();
        
        let signatureValue = [];
        if (typeof walletNew === 'object') {

          setTotalWallets(walletNew.length)
          for (let wallet of walletNew) {
            const transactions = await getTransactions(wallet.address)
            const newSignatureValue = await getSignatureValue(wallet.address, transactions, minValueNew, maxValueNew, decimalerNew, wallet.name)
            let index = walletNew.indexOf(wallet) + 1
            setCompletedDexes(index)
            signatureValue = signatureValue.concat(newSignatureValue)
          }  

        } else {
        const transactions = await getTransactions(wallet)
        signatureValue = await getSignatureValue(walletNew, transactions, minValueNew, maxValueNew, decimalerNew, null)
        }

        console.log("signatureValue: ", signatureValue)          
        if (signatureValue.length > 0) {
          const promises = signatureValue.map(async (eachWallet) => {
            const result = await getWalletTransactions(eachWallet.wallet);
            if (result.length <= maxTransactionsInWalletNew) {
              return eachWallet;
            }
            return null;
          });

          const results = await Promise.all(promises);
          results.forEach((eachWallet) => {
            if (eachWallet !== null) {
              resultList.push(eachWallet);
            }
          });
        }


        async function getWalletTransactions(wallet) {
          let attempts = 4
          while (attempts > 0) {
            try {
              const signatures = await rotateRPC().getSignaturesForAddress(getPublickey(wallet), { commitment: "finalized" });
            if (signatures) {
              return signatures
            }
              return []                
            } catch {
              console.log("Error on fetching for wallet: ", wallet)
              attempts--
            }             
          }
          return []

          }

          async function getSignatureValue(wallet, list, min_amount, max_amount, decimaler, dex) {
          let confirmedTransactionList = [];
          let id = 1
          try {
              const BATCH_SIZE = 20;
              for (let i = 0; i < list.length; i += BATCH_SIZE) {

              const batch = list.slice(i, i + BATCH_SIZE);
              const batchPromises = batch.map(signature =>
                  delay(10).then(async () =>
                  rotateRPC().getParsedTransaction(signature, { commitment: 'finalized', maxSupportedTransactionVersion : 0})
                      .catch(error => {
                      console.log(error);
                      return null;
                      })
                  )
              );

              const results = await Promise.all(batchPromises);
              for (const transactionDetails of results) {
                  if (transactionDetails) {
                      for (const instruction of transactionDetails.transaction.message.instructions) {
                          if (instruction.programId.toBase58() === SystemProgram.programId.toBase58() && wallet.includes(instruction.parsed.info.source)) {
                          if (instruction.parsed && instruction.parsed.type === 'transfer') {
                              const transferAmount = instruction.parsed.info.lamports / LAMPORTS_PER_SOL;
                              const deci = countDecimals(transferAmount)
                            if (transferAmount >= min_amount && transferAmount <= max_amount && deci <= decimaler) {
                              const time = getFormattedDate(transactionDetails.blockTime)
                              confirmedTransactionList.push({"wallet": instruction.parsed.info.destination, "amount": transferAmount, "time": time, "dex": dex});
                              }
                          }
                          }
                      }
                  }
              }
              }
          } catch (error) {
              console.log(error);
          }
          return confirmedTransactionList;
          }

          async function getTransactions(wallet) {
              let listTransactions = []

              let signature = await rotateRPC().getSignaturesForAddress(getPublickey(wallet), { limit: 1000, commitment: "finalized" });
              if (signature.length > 0) {
                  try {
                      listTransactions = signature.map(signature => signature.signature);
                  } catch (error) {
                      console.log("signatures list failed ", error)
                  }
              }
              return listTransactions
          }

          function getPublickey(wallet) {
          const publicKeyGet = new web3.PublicKey(wallet);
          return publicKeyGet
          }

          function createRPCRotator() {
          const RPCs = [
              import.meta.env.VITE_RPC_3, import.meta.env.VITE_RPC_4
          ];
          return function () {
              RPCs.push(RPCs.shift())
              return new web3.Connection(RPCs[0], 'confirmed');
          }

        }
        
        function getFormattedDate(timestamp) {
          var a = new Date(timestamp * 1000);
          var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
          var year = a.getFullYear();
          var month = months[a.getMonth()];
          var date = a.getDate();
          var hour = String(a.getHours()).padStart(2, '0');
          var min = String(a.getMinutes()).padStart(2, '0');
          var sec = String(a.getSeconds()).padStart(2, '0');
          var time = hour + ':' + min + ':' + sec + ' - ' + date + ' ' + month + ' ' + year;
          return time;
        }
          
          function delay(ms) {
          return new Promise(resolve => setTimeout(resolve, ms));
          }
          
          function countDecimals(value) {
              if (Math.floor(value) === value) return 0;

              let valueAsString = value.toString();
              if (valueAsString.includes(',')) {
                  valueAsString = valueAsString.replace(',', '.');
              }
              
              if (valueAsString.includes('.')) {
                  return valueAsString.split('.')[1].length;
              }
              
              return 0;
          }    

      }

    }
  }, [buttonClickCounter]);


  useEffect(() => {
    
    console.log({ 'minValue': minValueProp, 'maxValue': maxValueProp, 'decimaler': decimalerProp, 'maxTransactionsInWallet': maxTransactionsInWalletProp, 'dexChoiceProp': dexChoiceProp, "triggerAction": triggerAction, "allDex": allDex, "allDexArr": allDexArr})
    setMinValue(minValueProp)
    setMaxValue(maxValueProp)
    setDecimaler(decimalerProp)
    setWallet(dexChoiceProp)
    setMaxTransactionsInWallet(maxTransactionsInWalletProp)
    setAllDexBool(allDex)
    setAllDexBoolFetch(allDexArr)
    setButtonClickCounter(prev => prev + 1)
  },[triggerAction])

  return(
    <>
      <div className="found-tokens">
        {allDexBool ? <p>Dexes loaded: {completedDexes} / {totalWalltes}</p> : <></>}
        {loading && (
          <div className="skeleton-loader">Loading...</div>
        )}
        {!loading && result.length > 0 ? (
          result.map((obj, index) => (
            <section key={index} style={{ borderBottom: "2px solid #000" }}>
              <h5>{obj.time}</h5>
              {obj.dex !==null ? <p>Dex: {obj.dex}</p> : <></>}
              <p>Wallet: <a href={"https://solscan.io/account/" + obj.wallet + "#solTransfers"} target="_blank"> {obj.wallet}</a></p>
              <p>Amount: {obj.amount}</p>
             
            </section>
          ))
        ) : (
          !loading && !result.length > 0 && triggerAction !== 0 &&  <p>No Wallets found</p>
        )}
      </div>  
    </>
  );
}

