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

                //console.log("filterSlowKoth: ", filterSlowKoth)
                for (let token of filterSlowKoth) {
                    // Få tag på startDeposit
                    const transactions = await getWalletTransactions(token.creator)
                    const createdAmount = await getFirstDeposit(transactions, token.created_timestamp, token.creator)
                    let amount
                    if (createdAmount == null) {
                        amount = null
                    } else {
                        amount = createdAmount[0].amount
                    }

                    let createdTimestampInSeconds = Math.floor(token.created_timestamp / 1000);
                    let KothTimestampInSeconds = Math.floor(token.king_of_the_hill_timestamp / 1000);
                    let calcDifferenceSeconds = KothTimestampInSeconds - createdTimestampInSeconds

                    //Få tag på antal transaktioner innan Raydium

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
                const signatures = await rotateRPC().getSignaturesForAddress(getPublickey(bonding_curve), {commitment: "finalized"});
                //console.log("Signatures amount: ", signatures)
                const filterErrSignatures = signatures.filter(signature => signature.err == null)
                return filterErrSignatures.length
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
                const signatures = await rotateRPC().getSignaturesForAddress(getPublickey(wallet), { limit: 500, commitment: "finalized" });
                if (signatures) {
                    return signatures
                }
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

            return tokens
        }
        const result = await pumpare()
        setLoading(false)
        if (result) {
/*           const mockResult =  [
      {
        creator: 'CfuhTSy6aCD7w76Cqj6nRZgWdHfvXjHQWGECuTkAWV1u',
        token: 'Ccqmy1VmTbY4JDtKS8JJJkU1UFXF9ATfsKe45gdmiHjS',
        startDeposit: 35,
        timeToKOTH: '36 seconds',
        transactions: 20
      },
      {
        creator: '9inxarN6qbmdy8bC4cRzL42ML4oTybsvHET1FS6RV2Dk',
        token: '3HKbgJGQ9Vej5ubSGcZN34tVPK8NUS1N3Rk2wyWq1x84',
        startDeposit: 85,
        timeToKOTH: '11 seconds',
        transactions: 2
      },
      {
        creator: '6T4WDcarh7JDyiYVsi9TK9pVxgok8C3RBhc9Huz3LZpc',
        token: 'E4yoWMfzZSWyd9cEfUXqvzTmrYP9gZpopxzu9zqRs7Mh',
        startDeposit: null,
        timeToKOTH: '103 seconds',
        transactions: 303
      },
      {
        creator: 'ptdsUAMnBdtMPV2ER6uPeuAcNecxxB471dB9w6XyM8R',
        token: '9SPAmYbAUYZhooNzinJ9ZRq7X96evBYuJafqa4rgWeMk',
        startDeposit: 3,
        timeToKOTH: '112 seconds',
        transactions: 119
      },
      {
        creator: 'DGuAXsjE8Gw23i4gXusupnWuxZcvXUUYGu63GgowMMey',
        token: 'HoUEyYv6ReBYavqVLxXRe2xvXCNuypZ1VWFjVnG8WysM',
        startDeposit: 2,
        timeToKOTH: '477 seconds',
        transactions: 229
      },
      {
        creator: '9xahDJteG61pwPGZ3mduzvYUCKhgwSg2XccipcyRQmsX',
        token: '6BJZwGEAJcyynwoSRcneFSo5ZgXC4kyoXb5U8PiMGpvb',
        startDeposit: 0,
        timeToKOTH: '796 seconds',
        transactions: 130
      },
      {
        creator: 'HgFxtzHfSGhFhuRYkmocBLf4jdfnb9Uc61XSodz8qsxC',
        token: '4PDEMcrh6oSwpRpcnsYVVnXphH7QZaQDd5jRDyvDRMwZ',
        startDeposit: 2,
        timeToKOTH: '426 seconds',
        transactions: 929
      },
      {
        creator: 'Cq7SBUPVMqKB5L8SbPSqP4i17WRZEowLvSm4TTinRG8q',
        token: '4Uz7bc2BaSrYRQfhDzcWqMQJG9N8G15pEB1rSHgwyxCv',
        startDeposit: 2,
        timeToKOTH: '183 seconds',
        transactions: 204
      }
          ] */
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
              <h4>{obj.creator}</h4>
              <p>Token: {obj.token}</p>
              <p>Start Deposit: {obj.startDeposit}</p>
              <p>Time to KOTH: {obj.timeToKOTH}</p>
              <p>Transactions: {obj.transactions}</p>
            </section>
          ))
        ) : (
          !loading && !result && <p>No Tokens found</p>
        )}
      </div>  
    </>
  );
}