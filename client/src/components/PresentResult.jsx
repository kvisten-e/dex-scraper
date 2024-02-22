import { useState, useEffect, useContext, useRef } from "react"
import * as web3 from '@solana/web3.js';
import { SystemProgram, SystemInstruction, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { GlobalContext } from './GlobalContext.jsx';


export default function PresentResult() {


  const [data, setData] = useState([])
  const { process, setProcess } = useContext(GlobalContext)
  const { wallet } = useContext(GlobalContext)
  const { params, setParams } = useContext(GlobalContext)
  const { signal } = useContext(GlobalContext)
  const [loading, setLoading] = useState(true);
  const isMountedRef = useRef(false);
  const [startFetch, setStartFetch] = useState(false)


  useEffect(() => {

      const fetchData = async () => {
        if (!isMountedRef.current) {
          isMountedRef.current = true;
          return;
        }

        async function main() {

          function createRPCRotator() {
            const RPCs = [
              "https://mainnet.helius-rpc.com/?api-key=3676f470-afe6-4e70-8966-3d096f4053ba",
              "https://mainnet.helius-rpc.com/?api-key=ab19f7c7-c836-4bbc-ae73-74ea4eb2c9f8"
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
            let data = []
            try {
              const signatures = await rotateRPC().getSignaturesForAddress(getPublickey(wallet), { limit: Number(params[0].total_tx), commitment: "finalized" });
              if (signatures.length > 0) {
                const listTransactions = signatures.map(signature => {
                  return signature.signature
                })
                console.log("List transactions: ", listTransactions)

                setProcess(prevProcess => prevProcess.map((step, index) => ({
                  ...step,
                  completed: index === 0 ? 100 : step.completed
                })));

                const confirmedTransactions = await checkSolAmountTransaction(wallet, listTransactions, Number(params[1].min_tx_value), Number(params[2].max_tx_value))
                console.log("ConfirmedTransactionList: ", confirmedTransactions)

                let count = 1;
                for (let obj of confirmedTransactions) {
                  if (signal.aborted) {
                    return
                  }
                  console.log("confirmedTransactions length: ", confirmedTransactions.length)
                  let statusCompleted = (count / confirmedTransactions.length) * 100
                  setProcess(prevProcess => prevProcess.map((step, index) => ({
                    ...step,
                    completed: index === 2 ? statusCompleted : step.completed
                  })));
                
                  count += 1

                  const checkForTransactions = await findTransactionsFromWallet(obj.wallet, params[3].min_eq_tx, params[4].min_eq_value_tx, params[5].total_min_tx)
                  const wallets = checkForTransactions.map(transaction => transaction.wallets);

                  if (wallets.length > 0 && wallets.length === new Set(wallets).size) {
                    data.push({ "wallet": obj.wallet, "amount": obj.amount, "walletSentOut": checkForTransactions })
                  }
                }
              }
            } catch (error) {
              console.error('Error fetching signatures:', error);
            }
            return data
          }

          async function checkSolAmountTransaction(wallet, list, min_amount, max_amount) {
            let confirmedTransactionList = []
            try {
              let count = 0
              for (let signature of list) {
                if (signal.aborted) {
                  confirmedTransactionList = []
                  return confirmedTransactionList
                }
                await delay(10);
                count++
                setProcess(prevProcess => prevProcess.map((step, index) => ({
                  ...step,
                  completed: index === 1 ? (count / list.length) * 100 : step.completed
                })));

                const transactionDetails = await rotateRPC().getParsedTransaction(signature, { commitment: 'confirmed', maxSupportedTransactionVersion: 0 });
                if (transactionDetails) {
                  for (const instruction of transactionDetails.transaction.message.instructions) {

                    if (instruction.programId.toBase58() === SystemProgram.programId.toBase58() && instruction.parsed.info.source == wallet) {
                      if (instruction.parsed && instruction.parsed.type === 'transfer') {
                        const transferAmount = instruction.parsed.info.lamports / LAMPORTS_PER_SOL;
                        if (max_amount >= transferAmount >= min_amount) {
                          confirmedTransactionList.push({ "wallet": instruction.parsed.info.destination, "amount": transferAmount })
                        }

                      }
                    }

                  }
                }
              }
            } catch (error) {
              console.log(error)
            }
            return confirmedTransactionList
          }

          async function findTransactionsFromWallet(wallet, min_eq_tx, min_eq_value_tx, total_min_tx) {
            const publicKeySearch = getPublickey(wallet)
            try {
              const signatures = await rotateRPC().getSignaturesForAddress(publicKeySearch, { limit: Number(total_min_tx) });
              if (signatures.length > 0) {
                const listTransactions = signatures.map(signature => {
                  return signature.signature
                })
                let transactions = []
                for (let signature of listTransactions) {

                  if (signal.aborted) {
                    transactions = []
                    return transactions
                  }
                  const transactionDetails = await rotateRPC().getParsedTransaction(signature, { commitment: 'confirmed', maxSupportedTransactionVersion: 0 },);
                  if (transactionDetails) {
                    for (const instruction of transactionDetails.transaction.message.instructions) {

                      if (instruction.programId.toBase58() === SystemProgram.programId.toBase58() && instruction.parsed.info.source == wallet) {
                        if (instruction.parsed && instruction.parsed.type === 'transfer') {
                          const transferAmount = instruction.parsed.info.lamports / LAMPORTS_PER_SOL;
                          if (transferAmount >= min_eq_value_tx) {
                            transactions.push({ "wallet": instruction.parsed.info.destination, "amount": transferAmount })
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
                console.log("FindTransactionsFromWallet: ", findTransactionsFromWallet)
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

        if (startFetch) {
          const sortedDataByPrice = result.sort((p1, p2) => (p1.amount < p2.amount) ? 1 : (p1.amount > p2.amount) ? -1 : 0)
          setData(sortedDataByPrice)
          setLoading(false)
        }
    }
    setStartFetch(true)     
    fetchData()
  }, [signal])

    
  return <>
      <div className="found-transactions">
        {loading ? <p></p> : data && data.length > 0 ?
          data.map((obj, index) => <section>
            <h4><a href={"https://solscan.io/account/" + obj.wallet + "#solTransfers"} target="_blank"> {index + 1}. {obj.wallet} received: {obj.amount} sol</a></h4>
            <ul>
              {obj.walletSentOut.map(foundWallets => <div>
                <p>{obj.wallet.substring(0, 4)} sent out {foundWallets.amount} to: </p>
                <ul>
                  {foundWallets.wallets.map(eachWallet => <li><a href={"https://solscan.io/account/"+eachWallet+"#solTransfers"} target="_blank">{eachWallet}</a></li>)}
                </ul>
              </div>)}
            </ul>
          </section>)
          : <p>No Transactions found</p>}
      </div>
  </>
}