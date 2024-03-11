async function fetchMainWalletTransactions() {
  let filteredResults = [];
  try {
    const signatures = await rotateRPC().getSignaturesForAddress(getPublickey(wallet), { limit: Number(params[0].total_tx), commitment: "finalized" });
    if (signatures.length > 0) {
      const listTransactions = signatures.map(signature => signature.signature);
      console.log("List transactions: ", listTransactions);

      setProcess(prevProcess => prevProcess.map((step, index) => ({
        ...step,
        completed: index === 0 ? 100 : step.completed
      })));

      const confirmedTransactions = await checkSolAmountTransaction(wallet, listTransactions, Number(params[1].min_tx_value), Number(params[2].max_tx_value));
      console.log("ConfirmedTransactionList: ", confirmedTransactions);

      // Modify this part to include delay
      const transactionPromises = confirmedTransactions.map((obj, index) =>
        delay(index * 500).then(() =>
          findTransactionsFromWallet(obj.wallet, params[3].min_eq_tx, params[4].min_eq_value_tx, params[5].total_min_tx).then(checkForTransactions => {
            const wallets = checkForTransactions.map(transaction => transaction.wallets);
            if (wallets.length > 0 && wallets.length === new Set(wallets).size) {
              return { "wallet": obj.wallet, "amount": obj.amount, "walletSentOut": checkForTransactions };
            }
            return null;
          }).catch(error => {
            console.error('Error in findTransactionsFromWallet:', error);
            return null; // Return null or appropriate value in case of error
          })
        )
      );

      const allTransactionsResults = await Promise.all(transactionPromises);
      filteredResults = allTransactionsResults.filter(result => result !== null);
    }
  } catch (error) {
    console.error('Error fetching signatures:', error);
  }
  return filteredResults;
}