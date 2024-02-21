import * as web3 from '@solana/web3.js';
import { SystemProgram, SystemInstruction, LAMPORTS_PER_SOL } from '@solana/web3.js';

let stepCompleted = []

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

async function main(wallet, params, { signal }) {
  const quicknode = "https://nameless-misty-dinghy.solana-mainnet.quiknode.pro/90d509b42b4d4c41ee745f1d1aba3ae791c81729/"
  const pikaRPC = "https://beta-va2.pikanode.io/"
  const newRPC = "https://mainnet.helius-rpc.com/?api-key=3676f470-afe6-4e70-8966-3d096f4053ba"
  const rpcUrl = 'https://rpc.hellomoon.io/';
  const mainnetrpc = "web3.clusterApiUrl('mainnet-beta')"
  //const connection = new web3.Connection(newRPC, 'confirmed');
  const jsonString = await fetchMainWalletTransactions()


  function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async function fetchMainWalletTransactions() {
    let data = []
    try {
      const signatures = await rotateRPC().getSignaturesForAddress(getPublickey(wallet), { limit: Number(params[0].total_tx), commitment: "finalized" });
      if (signatures.length > 0) {
        stepCompleted.push({ step1: true })
        const listTransactions = signatures.map(signature => {
          return signature.signature
        })
        console.log("List transactions: ", listTransactions)

        const confirmedTransactions = await checkSolAmountTransaction(wallet, listTransactions, Number(params[1].min_tx_value))
        stepCompleted.push({ step2: true })
        console.log("ConfirmedTransactionList: ", confirmedTransactions)

        for (let obj of confirmedTransactions) {
          const checkForTransactions = await findTransactionsFromWallet(obj.wallet, params[2].min_eq_tx, params[3].min_eq_value_tx, params[4].total_min_tx)
          const wallets = checkForTransactions.map(transaction => transaction.wallets);
          console.log(obj.wallet, " = ", wallets)

          if (wallets.length > 0 && wallets.length === new Set(wallets).size) {
            data.push({ "wallet": obj.wallet, "amount": obj.amount, "walletSentOut": checkForTransactions })
          }
        }
        stepCompleted.push({ step3: true })
      } else {
        stepCompleted.push({ error: false })
      }
    } catch (error) {
      console.error('Error fetching signatures:', error);
    }
    console.log("Data: ", data)
    return data

  }

  async function checkSolAmountTransaction(wallet, list, amount) {
    let confirmedTransactionList = []
    try {
      let count = 0
      for (let signature of list) {
        console.log("signal.aborted: ", signal.aborted)
        if (signal.aborted) {
          confirmedTransactionList = []
          return confirmedTransactionList
        }
        await delay(10);
        console.log("CheckSolAmountTransaction: ", count++)
        const transactionDetails = await rotateRPC().getParsedTransaction(signature, { commitment: 'confirmed', maxSupportedTransactionVersion: 0 });
        if (transactionDetails) {
          for (const instruction of transactionDetails.transaction.message.instructions) {

            if (instruction.programId.toBase58() === SystemProgram.programId.toBase58() && instruction.parsed.info.source == wallet) {
              if (instruction.parsed && instruction.parsed.type === 'transfer') {
                const transferAmount = instruction.parsed.info.lamports / LAMPORTS_PER_SOL;
                if (transferAmount >= amount) {
                  //console.log(`Found SOL transfer: ${transferAmount} SOL - Destination: ${instruction.parsed.info.destination}`);
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
        let count = 0
        for (let signature of listTransactions) {
          
          if (signal.aborted) {
            transactions = []
            return transactions
          }
          await delay(10);
          console.log("FindTransactionsFromWallet: ", count++)
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
          if (amountToWallets[amount].length >= 3) {
            acc[amount] = amountToWallets[amount];
          }
          return acc;
        }, {});
        const findTransactionsFromWallet = Object.entries(filteredAmountToWallets).map(([amount, wallets]) => ({
          amount: Number(amount),
          wallets
        }));
        console.log("FindTransactionsFromWallet: ", findTransactionsFromWallet)
        return findTransactionsFromWallet
      }
    } catch (error) {
      console.log(error)
    }
  }



  return jsonString
}



function getPublickey(wallet) {
  const publicKeyGet = new web3.PublicKey(wallet);
  return publicKeyGet
}

export { main, stepCompleted }

/* main("5tzFkiKscXHK5ZXCGbXZxdw7gTjjD1mBwuoFbhUvuAi9", [
  { total_tx: "1000" },
  { min_tx_value: "2" },
  { min_eq_tx: "2" },
  { min_eq_value_tx: "0.01" },
  { total_min_tx: "40"}
]) */