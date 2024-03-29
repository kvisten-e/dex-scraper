import { useState, useEffect, useContext, useRef } from "react"
import * as web3 from '@solana/web3.js';
import { SystemProgram, SystemInstruction, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { GlobalContext } from './GlobalContext.jsx';
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
                      console.log("signatures list failed ", error)
                    }                      

                      const confirmedTransactions = await checkSolAmountTransaction(wallet, listTransactions, Number(params[1].min_tx_value), Number(params[2].max_tx_value));
                      console.log("ConfirmedTransactionList: ", confirmedTransactions);
                    
/*                     const transactionsListFilteredLength = await getWalletTotalTransactions(confirmedTransactions, Number(params[4].tot_tra_wallet))
                      console.log("TransactionsListFilteredLength: ", transactionsListFilteredLength) */
                    
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
                  console.error('Error fetching signatures:', error);
                }
                return filteredResults;
              }

              async function getWalletTotalTransactions(list, amount) {
                let confirmedTransactionList = []
                try {
                  const BATCH_SIZE = 40;
                  for (let i = 0; i < list.length; i += BATCH_SIZE) {
                    if (signal.aborted) {
                      confirmedTransactionList = [];
                      return confirmedTransactionList;
                    }

                    let statusCompleted = ((i + BATCH_SIZE) / list.length) * 100;
                    setProcess(prevProcess => prevProcess.map((step, idx) => ({
                      ...step,
                      completed: idx === 2 ? statusCompleted : step.completed
                    })));

                    const batch = list.slice(i, i + BATCH_SIZE);
                    const batchPromises = batch.map(obj =>
                      delay(10).then(async () => {
                        const amountTransactions = await rotateRPC().getSignaturesForAddress(getPublickey(obj.wallet), { commitment: "finalized" })
                        if (amountTransactions.length <= amount) {
                          return obj;
                        }
                      })
                    );


                    let retries = 3;
                    let success = false;
                    let allTransactions;
                    while (!success && retries > 0) {
                      try {
                        allTransactions = await Promise.all(batchPromises);
                        success = true;
                      } catch (error) {
                        console.log(`Retrying due to error: ${error.message}. Retries left: ${retries - 1}`);
                        retries--;
                        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for 1 second before retrying
                      }
                    }

                    allTransactions = allTransactions.filter(tx => tx !== undefined);
                    confirmedTransactionList = confirmedTransactionList.concat(allTransactions)
                  }
                } catch (error) {
                }

                return confirmedTransactionList
              }              


              async function checkSolAmountTransaction(wallet, list, min_amount, max_amount) {
                let confirmedTransactionList = [];
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
                                confirmedTransactionList.push({ "wallet": instruction.parsed.info.destination, "amount": transferAmount });
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


              async function findTransactionsFromWallet(wallet, min_eq_tx, min_eq_value_tx, total_min_tx) {
                const publicKeySearch = getPublickey(wallet);
                try {
                  const signatures = await rotateRPC().getSignaturesForAddress(publicKeySearch, { limit: Number(total_min_tx) });
                  if (signatures.length > 0) {
                    const listTransactions = signatures.map(signature => signature.signature);
                    let transactions = [];
                    for (let signature of listTransactions) {
                      if (signal.aborted) {
                        transactions = [];
                        return transactions;
                      }

                      let retries = 3; 
                      let success = false;
                      let transactionDetails;
                      while (!success && retries > 0) {
                        try {
                          transactionDetails = await rotateRPC().getParsedTransaction(signature, { commitment: 'finalized', maxSupportedTransactionVersion: 0 });
                          success = true; 
                        } catch (error) {
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
                  console.log(error)
                }
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

    async function loadTS() {
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
                    const listTransactions = signatures.map(signature => signature.signature);
                    console.log("List transactions: ", listTransactions);
                    const confirmedTransactions = await checkSolAmountTransaction(wallet, listTransactions, Number(params[1].min_tx_value), Number(params[2].max_tx_value), Number(params[3].max_dec_value));
                    console.log("ConfirmedTransactionList: ", confirmedTransactions);

                    const transactionsListFilteredLength = await getWalletTotalTransactions(confirmedTransactions, Number(params[4].total_wallet_tx))
                    console.log("transactionsListFilteredLength: ", transactionsListFilteredLength)

                    
                    filteredResults = transactionsListFilteredLength.filter(result => result !== null);
                  }

                } catch (error) {
                  console.error('Error fetching signatures:', error);
                }
                return filteredResults;
              }


              async function checkSolAmountTransaction(wallet, list, min_amount, max_amount, max_dec_value) {
                let confirmedTransactionList = [];
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
                        rotateRPC().getParsedTransaction(signature, { commitment: 'confirmed', maxSupportedTransactionVersion: 0 })
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
                              let decimalsTransfer = 0
                              try {
                                decimalsTransfer = transferAmount.toString().split(".")[1].length
                              } catch {
                              }

                              if (transferAmount >= min_amount && transferAmount <= max_amount && decimalsTransfer <= max_dec_value) {
                                confirmedTransactionList.push({ "wallet": instruction.parsed.info.destination, "amount": transferAmount });
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

              async function getWalletTotalTransactions(list, amount) {
                const transactionsPromises = list.map(async obj => {
                  const amountTransactions = await rotateRPC().getSignaturesForAddress(getPublickey(obj.wallet), { commitment: "finalized" });
                  if (amountTransactions.length <= amount) {
                    return obj;
                  }
                });

                const allTransactions = await Promise.all(transactionsPromises);
                const confirmedTransactionsFiltered = allTransactions.filter(tx => tx !== undefined);
                return confirmedTransactionsFiltered;
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
    } else {
      loadTS()
    }

  }, [wallet])

  useEffect(() => {
    let ready = process.filter(step => step.completed === 100)
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
    </div>
  </>
}