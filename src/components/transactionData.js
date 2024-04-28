

export default class transactionData{
  constructor(wallet) {
    this.wallet = wallet
  }

  formatData(obj) {
    if (this.wallet === obj.feePayer && obj.nativeTransfers.length > 0 && obj.source === "SYSTEM_PROGRAM") {
      const data = {
        "From": this.wallet,
        "To": obj.nativeTransfers[0].toUserAccount,
        "Amount": obj.nativeTransfers[0].amount / 1000000000
      }

      return data
    }
  }
}

