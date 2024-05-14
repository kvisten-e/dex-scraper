import { useState, useEffect, useContext, useRef } from "react"
import * as web3 from '@solana/web3.js';
import { SystemProgram, SystemInstruction, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { GlobalContext } from './GlobalContext.jsx';

export default function pumpTokens({ seconds, triggerAction }) {

  const { params } = useContext(GlobalContext)
  const { signal } = useContext(GlobalContext)
  const [loading, setLoading] = useState(false);
  const isMountedRef = useRef(false);
  const [result, setResult] = useState([])
  const [maxTimeSecondsToKOTH, setMaxTimeSecondsToKOTH] = useState(0)

  useEffect(() => {
    if (triggerAction) {
      async function main() {
        setLoading(true); 
        async function pumpare() {
            let tokens = []
            
            const result = await getTokens(1000)

            const filteredResult = filterOnlyRaydiumTokens(result)

            const filterSlowKoth = filterOutSlowKoth(filteredResult, maxTimeSecondsToKOTH)
            const rotateRPC = createRPCRotator();

            if (filterSlowKoth.length > 0) {

                //Filtrera ut identiska rader
                const removedDuplicates = removeDuplicates(filterSlowKoth); 
                
                console.log("FilterSlowKoth: ", removedDuplicates)
                for (let token of filterSlowKoth) {
                    // Få tag på startDeposit
                    const transactions = await getWalletTransactions(token.creator)
                    const createdAmount = await getFirstDeposit(transactions, token.created_timestamp, token.creator)
                    let amount
                    if (createdAmount == null || createdAmount == '') {
                        amount = 'Failed to fetch'
                    } else {
                        amount = createdAmount[0].amount
                    }

                    let createdTimestampInSeconds = Math.floor(token.created_timestamp / 1000);
                    let KothTimestampInSeconds = Math.floor(token.king_of_the_hill_timestamp / 1000);
                    let calcDifferenceSeconds = KothTimestampInSeconds - createdTimestampInSeconds

                    const totTransactionsAmount = await totTransactions(token.bonding_curve)

                    const tokenDetails = {
                        creator: token.creator,
                        token: token.mint,
                        startDeposit: amount,           
                        timeToKOTH: `${calcDifferenceSeconds} seconds`,       
                        transactions: totTransactionsAmount
                    }
                    
                    tokens.push(tokenDetails)
                }    
            } else {
                console.log("FilterSlowKoth is empty")
            
            }

            async function totTransactions(bonding_curve) {
                let retriesFirst = 5;
                while (retriesFirst > 0) {
                    try {
                        const signatures = await rotateRPC().getSignaturesForAddress(getPublickey(bonding_curve), { commitment: "finalized" });

                        const filterErrSignatures = signatures.filter(signature => signature.err == null)
                        return filterErrSignatures.length
                    }
                    catch (error)
                    {
                    console.log(error)
                    console.log("Retries left: ", --retriesFirst)
                    }
                }   
                return 'Failed to fetch'
            }

            async function getTokens(amount) {

                let correctAmount = amount % 50
                if (correctAmount != 0) {
                    amount = amount - correctAmount
                }
                const apiLoops = amount / 50

                let resultArray = []
                for (let i = 0; i < apiLoops; i++){
                    try {
                        let amount = 50 * i
                        const response = await fetch(`https://client-api-2-74b1891ee9f9.herokuapp.com/coins?offset=${amount}&limit=50&sort=last_trade_timestamp&order=DESC&includeNsfw=false`) 
                        const data = await response.json()
                        if (data) {
                            for (let token of data) {
                                resultArray.push(token)
                            }                
                        }                
                    } catch {
                        console.log("Api error on step: ", i)
                        i--
                    }
                }
                return resultArray
            }

            function filterOnlyRaydiumTokens(arr) {
                const filteredArray = arr.filter(token => token.complete == true)
                return filteredArray
            }

            function filterOutSlowKoth(arr, maxSec) {

                const filteredArray = arr.filter(token => {
                    let createdTimestampInSeconds = Math.floor(token.created_timestamp / 1000);
                    let KothTimestampInSeconds = Math.floor(token.king_of_the_hill_timestamp / 1000);
                    let calcDifferenceSeconds = KothTimestampInSeconds - createdTimestampInSeconds
                    if (calcDifferenceSeconds <= maxSec) {
                        return token  
                    }
                })
                return filteredArray
            }

            async function getWalletTransactions(wallet) {
                let retriesFirst = 5;
                while (retriesFirst > 0) {
                    try {
                        const signatures = await rotateRPC().getSignaturesForAddress(getPublickey(wallet), { limit: 500, commitment: "finalized" });
                        if (signatures) {
                            return signatures
                        }
                        return []  
                    }
                    catch (error)
                    {
                    console.log(error)
                    console.log("Retries left: ", --retriesFirst)
                    }
                }
                console.log("Skipping wallet: ", wallet)
                return []  
            }

            async function getFirstDeposit(arr, timestamp, wallet) {
                let transactions = []
                let createdTimestampInSeconds = Math.floor(timestamp / 1000);
                for (let transaction of arr) {
                    let different = createdTimestampInSeconds - transaction.blockTime
                    if (different < 3 && different > -3) {
                        transactions.push(transaction)
                    }
                }
                if (transactions.length > 0) {
                    let transactionData = []
                    for (let transaction of transactions) {

                        const url = "https://api.helius.xyz/v0/transactions/?api-key=214a5e1f-bfc9-4e59-a1ce-f96533457125";

                        const parseTransaction = async () => {
                        const response = await fetch(url, {
                            method: 'POST',
                            headers: {
                            'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                            transactions: [transaction.signature],
                            }),
                        });

                        const data = await response.json();
                        return data
                        };

                        const result = await parseTransaction();

                        //Hitta mottagaren till creators sol
                        let receiverWallet = ''
                        for (let tokenTransfer of result[0].tokenTransfers) {
                            if (tokenTransfer.toUserAccount == wallet) {
                                receiverWallet = tokenTransfer.fromUserAccount
                            }
                        }
                        //Hitta hur mycket SOL creator skickar till receiverWallet
                        let creatorSentAmount = 0
                        for (let nativeTransfer of result[0].nativeTransfers) {
                            if (nativeTransfer.fromUserAccount == wallet && nativeTransfer.toUserAccount == receiverWallet) {
                                creatorSentAmount = nativeTransfer.amount / LAMPORTS_PER_SOL
                                transactionData.push({'FromCreator': wallet, 'toWallet': receiverWallet, 'amount': creatorSentAmount})
                            }
                        }
                    }
                    //Slå ihop amount om creator skickat ut mer sol till samma wallet

                    if (transactionData.length > 1) {
                        let amount = 0
                        let creator = ''
                        let receiverWallet = ''
                        for (let obj of transactionData) {
                            creator = obj.FromCreator
                            receiverWallet = obj.toWallet
                            amount += obj.amount
                        }
                        transactionData = []
                        transactionData.push({'FromCreator': creator, 'toWallet': receiverWallet, 'amount': Math.floor(amount)})
                    } 
                    return transactionData
                    
                }
                return null
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

            function removeDuplicates(arr) {

                let jsonObject = arr.map(JSON.stringify);
                let uniqueSet = new Set(jsonObject);
                let uniqueArray = Array.from(uniqueSet).map(JSON.parse);

                return uniqueArray
            }
                     
            const filterDup = removeDuplicates(tokens)
            return filterDup
        }
        const result = await pumpare()
        setLoading(false)
        if (result) {
          setResult(result)      
        }  
      }
      main()
    }
  }, [triggerAction, seconds]);


  useEffect(() => {
    setMaxTimeSecondsToKOTH(seconds)
  },[signal])

  return(
    <>
      <div className="found-tokens">
        {loading && (
          <div className="skeleton-loader">Loading...</div>
        )}
        {!loading && result.length > 0 ? (
          result.map((obj, index) => (
            <section key={index}>
              <h4><a href={"https://solscan.io/account/" + obj.creator + "#solTransfers"} target="_blank"> {index + 1}. {obj.creator}</a></h4>
              <p>Token: <a href={"https://pump.fun/" + obj.token} target="_blank"> {obj.token}</a></p>
              <p>Start Deposit: {obj.startDeposit}</p>
              <p>Time to KOTH: {obj.timeToKOTH}</p>
              <p>Transactions: {obj.transactions}</p>
              <iframe src={"https://dexscreener.com/solana/"+obj.token+"?embed=1&theme=dark&trades=0&info=0"} style={{ height: '400px', width: '99%' }}></iframe>  
            </section>
          ))
        ) : (
          !loading && !result && <p>No Tokens found</p>
        )}
      </div>  
    </>
  );
}