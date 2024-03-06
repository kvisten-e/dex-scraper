function rotateRPC() {
  const RPC1 = "https://mainnet.helius-rpc.com/?api-key=3676f470-afe6-4e70-8966-3d096f4053ba"
  const RPC2 = "https://mainnet.helius-rpc.com/?api-key=ab19f7c7-c836-4bbc-ae73-74ea4eb2c9f8"
  const allRPCs = [RPC1, RPC2]

  const connection = allRPCs.pop(allRPCs)
  return connection
}
for (let i = 0; i < 10; i++){
  let connection = rotateRPC()
  console.log(connection)
}


