import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from 'url';
import * as web3 from '@solana/web3.js';


const token = "6k3fjxxNQh1dKZzpNQK3dNFrCErDkHzGjMWYyrdzpump";
const farm = [
  "8CtoWqgipje1Faik1tjyBwiE5vqp6L3DUvtzAsez8gBU",
  "4oz9ipyK1ihLncsdVKCbkJ5LCyJ7LwJTyjKeYC1WKV4U",
  "7uJn9UFdx6JkK6PtWGFVDSvYcjf5jQT7xKzY2nmDYzvn",
  "477mnLX2PTBftTzM2FtUvh5nxbEfp9oyYjNQLmNH3TW7",
  "GmZ98Lt1Hu1dLz6jKrfkstJP8J4qVuSgf4CFN284Vx2P",
  "9tFEzeckXZaKWMWVkAv72iYJkUqX69wybUmsqBdY1sg1"
];

async function main() {
  await getTokenData(token);
  await loadFarmData(farm);
  // await clearSession()

}

async function getTokenData(token) {
  let status = false;
  let sessionObject = await sessionData();
  do {
    const response = await fetch(`https://frontend-api.pump.fun/coins/${token}`);
    const data = await response.json();
    if (data) {
      status = true;
      const tokenData = {
        "ca:": data.mint,
        "name": data.name,
        "symbol": data.symbol,
        "supply": data.total_supply,
        "imageUrl": data.image_uri,
        "bondingCurve": data.bonding_curve
      };
      sessionObject.session.token = tokenData;
      await saveSessionData(sessionObject);
    }
  } while (!status);
}

async function loadFarmData() {
  let sessionObject = await sessionData();
  let totalTokenAmount = 0
  let totalSolAmount = 0
  let totalWalletsFarm = 0
  let wallets = []

  for (let wallet of farm) {
    const solBalance = await getSolBalance(wallet)
    const tokenBalance = await getTokenBlance(wallet, token)
    totalTokenAmount += tokenBalance
    totalSolAmount += solBalance
    totalWalletsFarm += 1

    wallets.push({
      "address": wallet,
      "sol": solBalance,
      "tokenAmount": tokenBalance
    })
  }
  /*   console.log("wallets: ", wallets)
    console.log("totalTokenAmount: ", totalTokenAmount)
    console.log("totalSolAmount: ", totalSolAmount)
    console.log("totalWalletsFarm: ", totalWalletsFarm) */

  const farmData = {
    "totalTokenAmount:": totalTokenAmount,
    "totalSolAmount": totalSolAmount,
    "totalWalletsFarm": totalWalletsFarm,
    "wallets": wallets,
    "newWallets": []
  };

  sessionObject.session.farm = farmData;
  await saveSessionData(sessionObject);

}

async function sessionData() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const filePath = path.join(__dirname, '../../data/session.json');

  try {
    const data = await fs.readFile(filePath, 'utf8');
    const jsonData = JSON.parse(data);
    return jsonData;
  } catch (err) {
    console.error("Error reading session data:", err);
    return null;
  }
}

async function saveSessionData(obj) {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const filePath = path.join(__dirname, '../../data/session.json');

  try {
    await fs.writeFile(filePath, JSON.stringify(obj, null, 2));
  } catch (err) {
    console.error("Error saving session data:", err);
  }
}

async function clearSession() {
  const clearedSession = {
    "session": {
      "status": 1,
      "token": {
        "ca:": "",
        "name": "",
        "symbol": "",
        "supply": 0,
        "imageUrl": "",
        "bondingCurve": ""
      },
      "farm": {
        "totalTokenAmount": 0,
        "totalSolAmount": 0,
        "totalWalletsFarm": 0,
        "wallets": [
          {
            "address": "",
            "sol": 0,
            "tokenAmount": 0
          }
        ]
      }
    }
  }
  await saveSessionData(clearedSession);
}


async function getSolBalance(wallet) {

  let status = false
  do {
    try {
      const walletDecoded = getPublickey(wallet)
      const connection = new web3.Connection("https://mainnet.helius-rpc.com/?api-key=048c7f8e-9afc-4608-b1c3-0bf54990561f", 'confirmed')

      const walletSolBlance = await connection.getBalance(walletDecoded)
      if (!walletSolBlance) {
        console.log('WalletData could not be fetch sol balance');
        return null;
      }
      status = true
      return walletSolBlance

    } catch (err) {
      console.log("Failed to get SOL balance for wallet: " + wallet)
    }
  } while (!status)

}

function getPublickey(wallet) {
  const publicKeyGet = new web3.PublicKey(wallet);
  return publicKeyGet
}

async function getTokenBlance(wallet, token) {
  let status = false
  do {
    try {
      const response = await fetch("https://mainnet.helius-rpc.com/?api-key=048c7f8e-9afc-4608-b1c3-0bf54990561f", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 'my-id',
          method: 'getAssetsByOwner',
          params: {
            ownerAddress: wallet,
            page: 1, // Starts at 1
            limit: 1000,
            displayOptions: {
              showFungible: true //return both fungible and non-fungible tokens
            }
          },
        }),
      });
      const { result } = await response.json();
      const walletTokenData = result.items;

      for (let eachWallet of walletTokenData) {
        if (eachWallet.id === token) {
          status = true
          return eachWallet.token_info.balance
        }
      }
      return 0;
    } catch (err) {
      console.log("Failed to fetch token balance for wallet: " + wallet)
    }
  } while (!status)
}

main();
