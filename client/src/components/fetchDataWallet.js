import * as web3 from '@solana/web3.js';
import * as fs from 'fs';
import { SystemProgram, SystemInstruction , LAMPORTS_PER_SOL } from '@solana/web3.js';


export async function main(wallet, params) {
  const rpcUrl = 'https://rpc.hellomoon.io/';
  const mainnetrpc = "web3.clusterApiUrl('mainnet-beta')"
  const connection = new web3.Connection(rpcUrl, 'confirmed');
  const publicKey = new web3.PublicKey(wallet);
  
  async function fetchMainWalletTransactions() {
    try {
      const signatures = await connection.getSignaturesForAddress(publicKey, { limit: Number(params[0].total_tx) });
      if (signatures.length > 0) {
        const listTransactions = signatures.map(signature => {
          
        return signature.signature
        })

        const confirmedTransactions = await checkSolAmountTransaction(wallet, listTransactions, Number(params[1].min_tx_value))
        console.log(confirmedTransactions)

      }
    } catch (error) {
      console.error('Error fetching signatures:', error);
    }
  }

  async function checkSolAmountTransaction(wallet, list, amount) {
    let confirmedTransactionList = []
    try {
      let confirmedTransaction = []
      for (let signature of list) {
        const transactionDetails = await connection.getParsedTransaction(signature, { commitment: 'confirmed' });
        if (transactionDetails) {
          for (const instruction of transactionDetails.transaction.message.instructions) {

            if (instruction.programId.toBase58() === SystemProgram.programId.toBase58() && instruction.parsed.info.source == wallet) {
                if (instruction.parsed && instruction.parsed.type === 'transfer') {
                  const transferAmount = instruction.parsed.info.lamports / LAMPORTS_PER_SOL;
                  if (transferAmount >= amount){
                    //console.log(`Found SOL transfer: ${transferAmount} SOL - Destination: ${instruction.parsed.info.destination}`);
                    confirmedTransactionList.push(instruction.parsed.info.destination)
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

  fetchMainWalletTransactions()
  return
}

function pushObjToJson(key, value) {
  const jsonFile = "mockdata.json"

  try {

    let data = {}

    if (fs.existsSync(jsonFile)) {
      const fileContent = fs.readFileSync(jsonFile, 'utf8');
      data = fileContent ? JSON.parse(fileContent) : [];
    }

    const newObj = {};
    newObj[key] = value;
    data.push(newObj);

    // Write the updated array back to the file
    fs.writeFileSync(jsonFile, JSON.stringify(data, null, 2));
  
  } catch (error) {
    console.error("Failed to push data to JSON", error);
  }
}


main("E7CaDzECPzftEPTtdbjrUGP4yThofKCqBpu9u4X2MaFh", [
  { total_tx: "3" },
  { min_tx_value: "1" },
  { min_eq_tx: "3" },
  { min_eq_value_tx: "1" },
])