import WebSocket from 'ws';

const ws = new WebSocket('wss://pumpportal.fun/api/data');

ws.on('open', function open() {
  // Subscribing to trades made by accounts
  let payload = {
      method: "subscribeAccountTrade",
      keys: ["E7CaDzECPzftEPTtdbjrUGP4yThofKCqBpu9u4X2MaFh"] // array of accounts to watch
    }
  ws.send(JSON.stringify(payload));
});

ws.on('message', function message(data) {
  console.log(JSON.parse(data));
});