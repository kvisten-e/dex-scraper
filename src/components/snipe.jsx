import { useState, useEffect, useContext, useRef } from "react"
import * as web3 from '@solana/web3.js';
import { SystemProgram, SystemInstruction, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { GlobalContext } from './GlobalContext.jsx';

export default function pumpTokens({ minValueProp, maxValueProp, decimalerProp, maxTransactionsInWalletProp, dexChoiceProp, triggerAction }) {

  const { params } = useContext(GlobalContext)
  const { signal } = useContext(GlobalContext)
  const [loading, setLoading] = useState(false);
  const isMountedRef = useRef(false);
  const [result, setResult] = useState([])
  const [minValue, setMinValue] = useState(0)
  const [maxValue, setMaxValue] = useState(0)
  const [decimaler, setDecimaler] = useState(0)
  const [wallet, setWallet] = useState('')
  const [maxTransactionsInWallet, setMaxTransactionsInWallet] = useState(0)
  const [resultList, setResultList] = useState([])
  const [buttonClickCounter, setButtonClickCounter] = useState(0)

  useEffect(() => {
    if (triggerAction) {
      async function main() {
        setLoading(true); 
        await snipare(minValue, maxValue, decimaler, wallet, maxTransactionsInWallet)
        console.log("Result: ", resultList)
        setLoading(false)
        if (resultList) {
          setResultList([])
          setResult(resultList)      
        }  
      }
      main()

      async function snipare(minValueNew, maxValueNew, decimalerNew, walletNew, maxTransactionsInWalletNew ) {

          const rotateRPC = createRPCRotator();
          const transactions = await getTransactions(wallet)
          const signatureValue = await getSignatureValue(walletNew, transactions, minValueNew, maxValueNew, decimalerNew)
          console.log("signatureValue: ", signatureValue)
          if (signatureValue.length > 0) {
              for (let eachWallet of signatureValue) {
                const result = await getWalletTransactions(eachWallet.wallet)
                console.log("Result length: ", result.length)
                if (result.length <= maxTransactionsInWalletNew) {
                      console.log("Lägger till: ", eachWallet)
                      resultList.push(eachWallet)
                  }
            }
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

          async function getSignatureValue(wallet, list, min_amount, max_amount, decimaler) {
          let confirmedTransactionList = [];
          let id = 1
          try {
              const BATCH_SIZE = 20;
              for (let i = 0; i < list.length; i += BATCH_SIZE) {
      /*         if (signal.aborted) {
                  confirmedTransactionList = [];
                  return confirmedTransactionList;
              } */

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
                              confirmedTransactionList.push({"wallet": instruction.parsed.info.destination, "amount": transferAmount});
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
    
    console.log({ 'minValue': minValueProp, 'maxValue': maxValueProp, 'decimaler': decimalerProp, 'maxTransactionsInWallet': maxTransactionsInWalletProp, 'dexChoiceProp': dexChoiceProp, "triggerAction": triggerAction})
    setMinValue(minValueProp)
    setMaxValue(maxValueProp)
    setDecimaler(decimalerProp)
    setWallet(dexChoiceProp)
    setMaxTransactionsInWallet(maxTransactionsInWalletProp)
    setButtonClickCounter(prev => prev + 1)
  },[triggerAction])

  return(
    <>
      <div className="found-tokens">
        {loading && (
          <div className="skeleton-loader">Loading...</div>
        )}
        {!loading && result.length > 0 ? (
          result.map((obj, index) => (
            <section key={index}>
              <p>Wallet: {obj.wallet}</p>
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