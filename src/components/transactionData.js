

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
  formatDexTransaction(obj, min_tx_value, max_tx_value) {
    try {
      console.log("Börjar formatDexTransaction, obj: ", obj)
      const tranferAmount = obj.nativeTransfers[0].amount / 1000000000
      console.log("min_tx_value: ", min_tx_value)
      console.log("max_tx_value: ", max_tx_value)
      if (this.wallet === obj.feePayer && obj.nativeTransfers.length > 0 && obj.source === "SYSTEM_PROGRAM" && min_tx_value < tranferAmount && max_tx_value > tranferAmount) {
        const data = {
          "wallet": obj.nativeTransfers[0].toUserAccount,
          "amount": tranferAmount,
          "slot": obj.slot
        }

        return data
    }       
    } catch{
      return undefined
    }

   
  }

}

/*  "wallet": instruction.parsed.info.destination, "amount": transferAmount, "slot": transactionDetails.slot  */

