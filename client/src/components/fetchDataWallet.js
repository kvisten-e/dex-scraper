import * as web3 from '@solana/web3.js';
import { SystemProgram, SystemInstruction , LAMPORTS_PER_SOL } from '@solana/web3.js';


export async function main(wallet, params) {
  console.log("params:", params)
  const newRPC ="https://mainnet.helius-rpc.com/?api-key=3676f470-afe6-4e70-8966-3d096f4053ba"
  const rpcUrl = 'https://rpc.hellomoon.io/';
  const mainnetrpc = "web3.clusterApiUrl('mainnet-beta')"
  const connection = new web3.Connection(newRPC, 'confirmed');

  const jsonString = fetchMainWalletTransactions()

  
  async function fetchMainWalletTransactions() {
    let data = []
    try {
      const signatures = await connection.getSignaturesForAddress(getPublickey(wallet), { limit: Number(params[0].total_tx) });
      if (signatures.length > 0) {
        const listTransactions = signatures.map(signature => {
          
        return signature.signature
        })

        const confirmedTransactions = await checkSolAmountTransaction(wallet, listTransactions, Number(params[1].min_tx_value))
/*         let confirmedTransactions = [
          { wallet: '9LUQNhziZQHQNc7xBkTuGU7skcG4FDgeYfZGbHgPQ7TL', amount: 1 },
          { wallet: 'EPRa9Bn99CpEBB4wS4dQCnssV3z1VyZnq6WGzob2Mket', amount: 1 }
        ]; */

        for (let obj of confirmedTransactions) {
          const checkForTransactions = await findTransactionsFromWallet(obj.wallet, params[2].min_eq_tx, params[3].min_eq_value_tx, params[4].total_min_tx) 
          data.push({ "wallet": obj.wallet, "amount": obj.amount, "walletSentOut": checkForTransactions })
        }
      }
    } catch (error) {
      console.error('Error fetching signatures:', error);
    }
    console.log(JSON.stringify(data, null, 2));

  }

  async function checkSolAmountTransaction(wallet, list, amount) {
    let confirmedTransactionList = []
    try {
      for (let signature of list) {
        const transactionDetails = await connection.getParsedTransaction(signature, { commitment: 'confirmed', maxSupportedTransactionVersion: 0 });
        if (transactionDetails) {
          for (const instruction of transactionDetails.transaction.message.instructions) {

            if (instruction.programId.toBase58() === SystemProgram.programId.toBase58() && instruction.parsed.info.source == wallet) {
                if (instruction.parsed && instruction.parsed.type === 'transfer') {
                  const transferAmount = instruction.parsed.info.lamports / LAMPORTS_PER_SOL;
                  if (transferAmount >= amount){
                    //console.log(`Found SOL transfer: ${transferAmount} SOL - Destination: ${instruction.parsed.info.destination}`);
                    confirmedTransactionList.push({ "wallet": instruction.parsed.info.destination, "amount": transferAmount })
                  }

                }
              }              

          }
        }
      }
    } catch (error){
      console.log(error)
    }
    return confirmedTransactionList
  }

  async function findTransactionsFromWallet(wallet, min_eq_tx, min_eq_value_tx, total_min_tx) {
    const publicKeySearch = getPublickey(wallet)
    try {
      const signatures = await connection.getSignaturesForAddress(publicKeySearch, { limit: Number(total_min_tx) });
      if (signatures.length > 0) {
        const listTransactions = signatures.map(signature => {
          return signature.signature
        })
        let transactions = []
        for (let signature of listTransactions) {
          const transactionDetails = await connection.getParsedTransaction(signature, { commitment: 'confirmed', maxSupportedTransactionVersion: 0 }, );
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
        const confirmedTransactionList = Object.entries(filteredAmountToWallets).map(([amount, wallets]) => ({
          amount: Number(amount),
          wallets
        }));        
        return confirmedTransactionList
      }
    } catch (error){
      console.log(error)
    }
  }

  return jsonString
}

function getPublickey(wallet) {
  const publicKeyGet = new web3.PublicKey(wallet);
  return publicKeyGet
}



/* main("5tzFkiKscXHK5ZXCGbXZxdw7gTjjD1mBwuoFbhUvuAi9", [
  { total_tx: "1000" },
  { min_tx_value: "2" },
  { min_eq_tx: "2" },
  { min_eq_value_tx: "0.01" },
  { total_min_tx: "40"}
]) */