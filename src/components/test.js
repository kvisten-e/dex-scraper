import * as web3 from '@solana/web3.js';
import { SystemProgram, SystemInstruction, LAMPORTS_PER_SOL } from '@solana/web3.js';

async function snipare(props) {

    const decimaler = 2
    const minValue = 60
    const maxValue = 90
    const maxTransactionsInWallet = 3
    const wallet = "5tzFkiKscXHK5ZXCGbXZxdw7gTjjD1mBwuoFbhUvuAi9"

    const rotateRPC = createRPCRotator();
    const transactions = await getTransactions(wallet)
    //console.log("Transactions: ", transactions)

    const signatureValue = await getSignatureValue(wallet, transactions, minValue, maxValue, decimaler)
    //console.log("SignatureValue: ", signatureValue)
    
    if (signatureValue.length > 0) {
        let filteredList = []
        for (let eachWallet of signatureValue) {
            const result = await getWalletTransactions(eachWallet.wallet)
            
            if (result.length <= maxTransactionsInWallet) {
                filteredList.push(eachWallet)
            }
        }
        return filteredList
    }

    return []


    async function getWalletTransactions(wallet) {
        const signatures = await rotateRPC().getSignaturesForAddress(getPublickey(wallet), { commitment: "finalized" });
        if (signatures) {
            return signatures
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
        'https://mainnet.helius-rpc.com/?api-key=048c7f8e-9afc-4608-b1c3-0bf54990561f', 'https://mainnet.helius-rpc.com/?api-key=214a5e1f-bfc9-4e59-a1ce-f96533457125'
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
        
const result = await snipare()
console.log("Result: ", result)

