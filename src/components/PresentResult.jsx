import { useState, useEffect, useContext, useRef } from "react"
import * as web3 from '@solana/web3.js';
import { SystemProgram, SystemInstruction, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { GlobalContext } from './GlobalContext.jsx';
import transactionData from "./transactionData.js"
import { type } from "os";


export default function PresentResult(props) {

  const [sortedData, setSortedData] = useState([])
  const { process, setProcess, switchButton, setSwitchButton } = useContext(GlobalContext)
  
  const [wallet, setWallet] = useState([])
  const { params } = useContext(GlobalContext)
  const { signal } = useContext(GlobalContext)
  const [loading, setLoading] = useState(true);
  const isMountedRef = useRef(false);
  const [finishedResult, setfinishedResult] = useState([])


  useEffect(() => {
    if (typeof props.wallet === 'string') {
      setWallet([props.wallet])
    } else if (typeof props.wallet === 'object') {
      setWallet(props.wallet)
    }
  },[signal])

  useEffect(() => {

    async function loadCT() {
      setLoading(true)
      let success = false
      while (!success) {
        try {
          const fetchData = async () => {
            if (!isMountedRef.current) {
              isMountedRef.current = true;
              return;
            }

            async function main() {

              function createRPCRotator() {
                const RPCs = [
                  import.meta.env.VITE_RPC_3, import.meta.env.VITE_RPC_4
                ];
                return function () {
                  RPCs.push(RPCs.shift())
                  return new web3.Connection(RPCs[0], 'confirmed');
                }
              }

              const rotateRPC = createRPCRotator();
              const jsonString = await fetchMainWalletTransactions()

              function delay(ms) {
                return new Promise(resolve => setTimeout(resolve, ms));
              }

              function getPublickey(wallet) {
                const publicKeyGet = new web3.PublicKey(wallet);
                return publicKeyGet
              }

              async function fetchMainWalletTransactions() {
                if (!isMountedRef.current) {
                  isMountedRef.current = true;
                  return;
                }

                let filteredResults = [];
                let confirmedTransactions = []
                try {
                  let signatures = []
                  if (wallet.length === 1) {
                    signatures = await rotateRPC().getSignaturesForAddress(getPublickey(wallet[0]), { limit: Number(params[0].total_tx), commitment: "finalized" });
                   
                    setProcess(prevProcess => prevProcess.map((step, index) => ({
                      ...step,
                      completed: index === 0 ? 100 : step.completed
                    })));

                  } else {
                    let count = 1
                    
                    for (let eachWallet of wallet) {
                      console.log("Dex: ", eachWallet)
                      const data = new transactionData(eachWallet)

                      let attempts = 1;
                      while (attempts <= 3) {
                        try {
                          const listTransactions = await getDexTransactions(eachWallet)
                          console.log("listTransactions: ", listTransactions)
                          if (listTransactions.length > 0) {
                            attempts = 4
                            for (const transaction of listTransactions) {
                              const formatedTransaction = data.formatDexTransaction(transaction, Number(params[1].min_tx_value), Number(params[2].max_tx_value))
                              if (formatedTransaction) {
                              confirmedTransactions.push(formatedTransaction)                                
                              }
                            }                        
                          }                          
                        } catch {
                          console.log("Something went wrong with fetch transactions for wallet: ", eachWallet, " - Attempt: ", attempts, "/3")
                          attempts++
                        }
                      }
                      console.log("confirmedTransactions: ", confirmedTransactions)

                      let statusCompleted = (count++ / wallet.length) * 100;
                      setProcess(prevProcess => prevProcess.map((step, index) => ({
                        ...step,
                        completed: index === 0 ? statusCompleted : step.completed
                      })));                      
                    }
                  }

                  if (confirmedTransactions.length > 0) {
                    console.log("ConfirmedTransactionList: ", confirmedTransactions);
                  
                    let count = 1
                    const transactionPromises = confirmedTransactions.map((obj, index) =>
                      delay(index * 200).then(async () => {

                        const checkForTransactions = await getWalletTransactions(obj.wallet, params[3].min_eq_tx, params[5].min_eq_value_tx, obj.slot)
                        let statusCompleted = (count++ / confirmedTransactions.length) * 100;

                        setProcess(prevProcess => prevProcess.map((step, idx) => ({
                          ...step,
                          completed: idx === 1 ? statusCompleted : step.completed
                        })));

                        const wallets = checkForTransactions.map(transaction => transaction.wallets);
                        if (wallets.length > 0 && wallets.length === new Set(wallets).size) {
                          return { "wallet": obj.wallet, "amount": obj.amount, "walletSentOut": checkForTransactions };
                        }
                        return null;
                      })
                    );

                    const allTransactionsResults = await Promise.all(transactionPromises);
                    filteredResults = allTransactionsResults.filter(result => result !== null);                      
                  }  
                  
                } catch (error) {
                  console.error('Error fetching signatures:', error);
                }
                return filteredResults;
              }

              async function getDexTransactions(wallet){
                const totalTx = Number(params[0].total_tx)
                let success = false
                while (!success) {
                  try {
                    const publicKeySearch = getPublickey(wallet);
                    const apiKey = import.meta.env.VITE_API_KEY
                    const url = `https://api.helius.xyz/v0/addresses/${publicKeySearch}/transactions?api-key=${apiKey}&limit=${totalTx}&type=TRANSFER`
                    const response = await fetch(url);
                    if (!response.ok) throw new Error("Failed to fetch data");
                    const data = await response.json();
                    console.log("Data: ", data)
                    success = true
                    return data                 
                  } catch {
                    console.log("Fetch failed on dex: ",wallet," ..trying again")
                  }                  
                }                
              }

              async function getWalletTransactions(wallet, min_eq_tx, min_eq_value_tx, slot) {
                let success = false
                while (!success) {
                  try {
                    const publicKeySearch = getPublickey(wallet);
                    const apiKey = import.meta.env.VITE_API_KEY
                    const url = `https://api.helius.xyz/v0/addresses/${publicKeySearch}/transactions?api-key=${apiKey}&limit=80&type=TRANSFER`
                    const response = await fetch(url);
                    if (!response.ok) throw new Error("Failed to fetch data");
                    const data = await response.json();

                    const transactionDataData = new transactionData(wallet)
                    let formatedResult = []

                    for (const obj of data) {
                      const result = transactionDataData.formatData(obj, slot)
                      if (result) {
                        formatedResult.push(result)    
                      }
                    }

                    const groupedData = groupByAmount(formatedResult);
                    const filterGroupedData = groupedData.filter(obj => obj.wallets.length >= min_eq_tx && obj.amount >= min_eq_value_tx) 
                    success = true
                    return filterGroupedData                    
                  } catch {
                    console.log("Fetch failed on wallet:",wallet,".. trying again")
                  }                  
                }
              }              
              function groupByAmount(data) {
                const grouped = data.reduce((acc, { To, Amount }) => {
                  if (!acc[Amount]) {
                    acc[Amount] = { amount: Amount, wallets: new Set() };
                  }
                  acc[Amount].wallets.add(To);
                  return acc;
                }, {});

                return Object.values(grouped).map(({ amount, wallets }) => ({
                  amount: amount,
                  wallets: Array.from(wallets)
                }));
              }

              return jsonString
            }

            const result = await main()

            return result
          }
          const result = await fetchData()
          setfinishedResult(result)
          success = true
        } catch {
          setProcess([])
          console.log("Failed to fetch, starting again...")
        }
      }

    }



    if (!switchButton.checked) {
      loadCT()      
    }

  }, [wallet])

  useEffect(() => {
    let ready = process.filter(step => step.completed >= 100)
    if (ready.length === 2 && ready !== null) {
      const sortedDataByPrice = finishedResult.sort((p1, p2) => (p1.amount < p2.amount) ? 1 : (p1.amount > p2.amount) ? -1 : 0)
      console.log("Result: ", sortedDataByPrice)

      setSortedData(sortedDataByPrice)
      setLoading(false)
      ready = []
    }
  })

  return <>
    <div className="found-transactions">
      {loading ? <p></p> : sortedData && sortedData.length > 0 ?
        !switchButton.checked ? sortedData.map((obj, index) => <section>
          <h4><a href={"https://solscan.io/account/" + obj.wallet + "#solTransfers"} target="_blank"> {index + 1}. {obj.wallet} received: {obj.amount} sol</a></h4>
          <ul>
            {obj.walletSentOut.map(foundWallets => <div>
              <p>{obj.wallet.substring(0, 4)} sent out {foundWallets.amount} to: </p>
              <ul>
                {foundWallets.wallets.map(eachWallet => <li><a href={"https://solscan.io/account/" + eachWallet + "#solTransfers"} target="_blank">{eachWallet}</a></li>)}
              </ul>
            </div>)}
          </ul>
        </section>) : <p>Hej</p>
        : <p>No Transactions found</p>}
    </div>
  </>
}