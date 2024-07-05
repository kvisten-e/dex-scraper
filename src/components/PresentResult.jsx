import { useState, useEffect, useContext, useRef } from "react"
import * as web3 from '@solana/web3.js';
import { SystemProgram, SystemInstruction, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { GlobalContext } from './GlobalContext.jsx';
import transactionData from "./transactionData.js"
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


export default function PresentResult(props) {

  const [sortedData, setSortedData] = useState([])
  const { process, setProcess, switchButton, setSwitchButton } = useContext(GlobalContext)
  
  const [wallet, setWallet] = useState([])
  const { params } = useContext(GlobalContext)
  const { signal } = useContext(GlobalContext)
  const [loading, setLoading] = useState(true);
  const isMountedRef = useRef(false);
  const [finishedResult, setfinishedResult] = useState([])

  const notify = (err) => toast.error(err, {
                    position: "bottom-right",
                    autoClose: 3000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    theme: "dark",
                    });


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
                      let signatureFetch = await rotateRPC().getSignaturesForAddress(getPublickey(eachWallet), { limit: Number(params[0].total_tx), commitment: "finalized" });
                      signatures = signatures.concat(signatureFetch)
                      
                      let statusCompleted = (count++ / wallet.length) * 100;
                      setProcess(prevProcess => prevProcess.map((step, index) => ({
                        ...step,
                        completed: index === 0 ? statusCompleted : step.completed
                      })));                      
                    }
                  }

                  if (signatures.length > 0) {
                    let listTransactions = []
                    try {
                      listTransactions = signatures.map(signature => signature.signature);
                      console.log("List transactions: ", listTransactions);
                    } catch (error) {
                      notify(error.message)
                      console.log("signatures list failed ", error)
                    }                      

                      const confirmedTransactions = await checkSolAmountTransaction(wallet, listTransactions, Number(params[1].min_tx_value), Number(params[2].max_tx_value));
                      console.log("ConfirmedTransactionList: ", confirmedTransactions);
                    
                      let count = 1
                      const transactionPromises = confirmedTransactions.map((obj, index) =>
                        delay(index * 200).then(async () => {

                          const checkForTransactions = await findTransactionsFromWallet(obj.wallet, params[3].min_eq_tx, params[5].min_eq_value_tx, params[6].total_min_tx)
                          let statusCompleted = (count++ / confirmedTransactions.length) * 100;
                          setProcess(prevProcess => prevProcess.map((step, idx) => ({
                            ...step,
                            completed: idx === 2 ? statusCompleted : step.completed
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
                  notify(error.message)
                  console.error('Error fetching signatures:', error);
                }
                return filteredResults;
              }

              async function getWalletTransactions(wallet, min_eq_tx, min_eq_value_tx, slot) {
                let success = false
                let attempts = 1
                while (!success && attempts <= 4) {
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
                  } catch (error) {
                    notify(error.message)
                    console.log("Fetch failed on wallet:", wallet, ".. trying again on attempt: ", attempts)
                    attempts++
                  }                  
                }
                console.log("Failed to fetch on wallet:", wallet, " .. skipping")
                return []
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

              async function checkSolAmountTransaction(wallet, list, min_amount, max_amount) {
                let confirmedTransactionList = [];
                let id = 1
                try {
                  const BATCH_SIZE = 20;
                  for (let i = 0; i < list.length; i += BATCH_SIZE) {
                    if (signal.aborted) {
                      confirmedTransactionList = [];
                      return confirmedTransactionList;
                    }

                    let statusCompleted = ((i + BATCH_SIZE) / list.length) * 100;
                    setProcess(prevProcess => prevProcess.map((step, idx) => ({
                      ...step,
                      completed: idx === 1 ? statusCompleted : step.completed
                    })));

                    const batch = list.slice(i, i + BATCH_SIZE);
                    const batchPromises = batch.map(signature =>
                      delay(10).then(async () =>
                        rotateRPC().getParsedTransaction(signature, { commitment: 'finalized', maxSupportedTransactionVersion : 0})
                          .catch(error => {
                            notify(error.message)
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
                              if (transferAmount >= min_amount && transferAmount <= max_amount) {
                                confirmedTransactionList.push({ "id": id++ ,"wallet": instruction.parsed.info.destination, "amount": transferAmount, "slot": transactionDetails.slot });
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                } catch (error) {
                  notify(error.message)
                  console.log(error);
                }
                return confirmedTransactionList;
              }


              async function findTransactionsFromWallet(wallet, min_eq_tx, min_eq_value_tx, total_min_tx) {
                const publicKeySearch = getPublickey(wallet);

                let retriesFirst = 5; 
                while (retriesFirst > 0) {
                  try {
                    const signatures = await rotateRPC().getSignaturesForAddress(publicKeySearch, { limit: Number(total_min_tx) });

                    if (signatures.length > 0) {
                    const listTransactions = signatures.map(signature => signature.signature);
                    let transactions = [];
                    for (let signature of listTransactions) {
                    if (signal.aborted) {
                    return transactions;
                    }

                    let retries = 5; 
                    let success = false;
                    let transactionDetails;
                    while (!success && retries > 0) {
                    try {
                    transactionDetails = await rotateRPC().getParsedTransaction(signature, { commitment: 'finalized', maxSupportedTransactionVersion: 0 });
                    success = true; 
                    } catch (error) {
                    notify(error.message)
                    console.log(`Retrying due to error: ${error.message}. Retries left: ${retries - 1}`);
                    retries--;
                    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for 1 second before retrying
                    }
                    }

                    if (success && transactionDetails) {
                    for (const instruction of transactionDetails.transaction.message.instructions) {
                    if (instruction.programId.toBase58() === SystemProgram.programId.toBase58() && instruction.parsed.info.source == wallet) {
                    if (instruction.parsed && instruction.parsed.type === 'transfer') {
                    const transferAmount = instruction.parsed.info.lamports / LAMPORTS_PER_SOL;
                    if (transferAmount >= min_eq_value_tx) {
                    transactions.push({ "wallet": instruction.parsed.info.destination, "amount": transferAmount });
                    }
                    }
                    }
                    }
                    } else {
                    return []
                    }
                    }

                    let amountToWallets = {};
                    transactions.forEach(({ wallet, amount }) => {
                    if (!amountToWallets[amount]) {
                    amountToWallets[amount] = [];
                    }
                    amountToWallets[amount].push(wallet);
                    });

                    let filteredAmountToWallets = Object.keys(amountToWallets).reduce((acc, amount) => {
                    if (amountToWallets[amount].length >= Number(min_eq_tx)) {
                    acc[amount] = amountToWallets[amount];
                    }
                    return acc;
                    }, {});
                    const findTransactionsFromWallet = Object.entries(filteredAmountToWallets).map(([amount, wallets]) => ({
                    amount: Number(amount),
                    wallets
                    }));

                    const allEqual = arr => arr.every(val => val === arr[0]);

                    const filterOutAllEqualWallets = findTransactionsFromWallet.filter(obj => !allEqual(obj.wallets))
                    return filterOutAllEqualWallets
                    }                    
                  } catch (error) {
                    notify(error.message)
                    console.log(error)
                    console.log("Retries left: ", --retriesFirst)
                  }
                }
                return []
              }

              return jsonString
            }

            const result = await main()

            return result
          }
          const result = await fetchData()
          setfinishedResult(result)
          success = true
        } catch (error) {
          notify(error.message)
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
    if (ready.length === 3 && ready !== null) {
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
        <ToastContainer
        position="bottom-right"
        autoClose={3000}
        limit={1}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
        />
    </div>

  </>
}