

const allDexArrFetch = ["red"]
const liveConnectionWallets = []

const closedWebsocketWallet = allDexArrFetch.filter(value => !liveConnectionWallets.includes(value));


console.log("closedWebsocketWallet: ", closedWebsocketWallet)