

export default class transactionData{
  constructor(wallet) {
    this.wallet = wallet
  }

  formatData(obj, slot) {

    if (this.wallet === obj.feePayer && obj.nativeTransfers.length > 0 && obj.source === "SYSTEM_PROGRAM" && obj.slot >= slot) {
      const data = {
        "From": this.wallet,
        "To": obj.nativeTransfers[0].toUserAccount,
        "Amount": obj.nativeTransfers[0].amount / 1000000000
      }

      return data
    }
  }

  formatDexTransaction(obj) {
    if (this.wallet === obj.feePayer && obj.nativeTransfers.length > 0 && obj.source === "SYSTEM_PROGRAM") {
      const data = {
        "wallet": obj.nativeTransfers[0].toUserAccount,
        "amount": obj.nativeTransfers[0].amount / 1000000000,
        "slot": obj.slot
      }

      return data
    }    
  }

}

/*  "wallet": instruction.parsed.info.destination, "amount": transferAmount, "slot": transactionDetails.slot  */

