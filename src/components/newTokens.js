import { gql, GraphQLClient } from "graphql-request";
import fs from 'fs'

// Hämta de senaste tokenens
const endpoint = `https://programs.shyft.to/v0/graphql/?api_key=bRFrAOqVwRJLCu4I`;
const graphQLClient = new GraphQLClient(endpoint, {
  method: `POST`,
  jsonSerializer: {
    parse: JSON.parse,
    stringify: JSON.stringify,
  },
});

function queryLpsBetween(start, end) {
  const query = gql`
    query MyQuery {
      Raydium_LiquidityPoolv4(
        where: {poolOpenTime: {_gte: ${start}}, _and: {poolOpenTime: {_lte: ${end}}}}
        order_by: {lpReserve: desc}
      ) {
        _updatedAt
        amountWaveRatio
        baseDecimal
        baseLotSize
        baseMint
        baseNeedTakePnl
        baseTotalPnl
        baseVault
        depth
        lpMint
        lpReserve
        lpVault
        marketId
        marketProgramId
        maxOrder
        maxPriceMultiplier
        minPriceMultiplier
        minSeparateDenominator
        minSeparateNumerator
        minSize
        nonce
        openOrders
        orderbookToInitTime
        owner
        pnlDenominator
        pnlNumerator
        poolOpenTime
        punishCoinAmount
        punishPcAmount
        quoteDecimal
        quoteLotSize
        quoteMint
        quoteNeedTakePnl
        quoteTotalPnl
        quoteVault
        resetFlag
        state
        status
        swapBase2QuoteFee
        swapBaseInAmount
        swapBaseOutAmount
        swapFeeDenominator
        swapFeeNumerator
        swapQuote2BaseFee
        swapQuoteInAmount
        swapQuoteOutAmount
        systemDecimalValue
        targetOrders
        tradeFeeDenominator
        tradeFeeNumerator
        volMaxCutRatio
        withdrawQueue
      }
    }`;

  graphQLClient.request(query).then(console.log);
}

//queryLpsBetween(1720250073, 1720253673);

// -------------------------------------------------------------------------------------------------------------------------------------------


// Hämta token meta data: info, freeze, mutable data
const url = "https://api.helius.xyz/v0/token-metadata?api-key=214a5e1f-bfc9-4e59-a1ce-f96533457125";
const getTokenMetadata = async (token) => {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      mintAccounts: token,
      includeOffChain: true,
      disableCache: false,
    }),
  });

  const data = await response.json();
  console.log("metadata: ", data);

  fs.writeFile('metadata.json', JSON.stringify(data, null, 2), (err) => {
    if (err) {
      console.error('Error writing to file', err);
    } else {
      console.log('Metadata saved to metadata.json');
    }
  });

};
//getTokenMetadata(['36T7gUgiDuvkMDsmUHyDRWEyfcQPHUmhtaAtY6WbGXR3', '9P1MU8huiMShDRLgpxzjfHnDqdnhSMswsFA8XiviVTyG']);


// -------------------------------------------------------------------------------------------------------------------------------------------

//Hitta om tokenet bränt LP / ruggat LP / eller har den orörd
//(1 transaktion = orörd, senaste transaktionen = bruned / rugged)
// Ruggad lpmint token: https://solscan.io/token/5Gumbuc3Eic5fUeApF5DQCGRUH7DWCFs4A8m54ocixnf
// Rugged transaction = 5fGgJNzuenGGBxURqrnbCwFNxhaB2rwQdw8Xcd1H4UA6VoKoXtzUUEdfCBqT4vW5mmuji1QEyMG8XuxcR9NLoc3h (type = WITHDRAW_LIQUIDITY)

// Ruggad lpmint token: https://solscan.io/token/5isyQyeXR4KRy9vWCnXZLVPf68cVQ86M88bcGYpWoEVp
// Burned transaction = 2sZL8NJfPuxYX62zrV43w8DMG91KdqqHuzDptGGJXz9z4Zgvq1mRc3FYC7QWk32Lm5agK1wdQ1k9vcpELLQj8qJV (type = BURN)

const parseLpMintTransaction = async (txs) => {
  const urlLpMintTransactionData = "https://api.helius.xyz/v0/transactions/?api-key=214a5e1f-bfc9-4e59-a1ce-f96533457125";
  const response = await fetch(urlLpMintTransactionData, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      transactions: txs,
    }),
  });

  const data = await response.json();
  console.log("parsed transaction: ", data);

  fs.writeFile('txData.json', JSON.stringify(data, null, 2), (err) => {
    if (err) {
      console.error('Error writing to file', err);
    } else {
      console.log('Metadata saved to metadata.json');
    }
  });  

};

// parseLpMintTransaction(['5psCWvMz5Ro87Wt19vjMqSMCkYaZBPTqWE22Z1SGWEXtbws1WjiaNnefGksRizg6ofEFRS52jDGxBpdSKiPByCYV']);



// -------------------------------------------------------------------------------------------------------------------------------------------

// Hämta pool information - Hämta ut nuvarnade MC och max MC för senaste månaden.
const fetchPoolInfo = async (lpmint) => {
  const response = await fetch("https://api-v3.raydium.io/pools/info/lps?lps=" + lpmint)
  const data = await response.json()
  console.log("Pool information: ", data.data[0].month.priceMax * 9999122396599);
  fs.writeFile('poolInfo.json', JSON.stringify(data, null, 2), (err) => {
    if (err) {
      console.error('Error writing to file', err);
    } else {
      console.log('Metadata saved to metadata.json');
    }
  });  
}
// fetchPoolInfo("5isyQyeXR4KRy9vWCnXZLVPf68cVQ86M88bcGYpWoEVp")

const fetchPoolInfoNew = async (marketId) => {
  const response = await fetch("https://api.geckoterminal.com/api/v2/networks/solana/pools/" + marketId)
  const data = await response.json()
  fs.writeFile('poolInfo.json', JSON.stringify(data, null, 2), (err) => {
    if (err) {
      console.error('Error writing to file', err);
    } else {
      console.log('Metadata saved to metadata.json');
    }
  });
}
// fetchPoolInfoNew("64vp73QNzZomfJ7hk2r8pdQSA2kPZs6qjchAm1M91JB")





const getTokenMetadataNew = async (token) => {
  const urlMetadata = `https://api.helius.xyz/v0/token-metadata?api-key=214a5e1f-bfc9-4e59-a1ce-f96533457125`
  const response = await fetch(urlMetadata, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      mintAccounts: token,
      includeOffChain: true,
      disableCache: false,
    }),
  });

  const data = await response.json();
  console.log("metadata: ", data);

  fs.writeFile('metadata.json', JSON.stringify(data, null, 2), (err) => {
    if (err) {
      console.error('Error writing to file', err);
    } else {
      console.log('Metadata saved to metadata.json');
    }
  });

};

// getTokenMetadataNew(['B5KscWYwRi3p7H6nqcfN9ZgcWKE5fTupKUhAAzfgu71z'])




async function getHistoricData(token) {
  const options = { method: 'GET', headers: { 'X-API-KEY': '3a8c49ca44074f158af9a4009bb95e3b' } };
  let tokenValueData = {
    currentValue: 0,
    maxValue: 0
  };
  let data;

  try {
    const response = await fetch(`https://public-api.birdeye.so/defi/history_price?address=${token}&address_type=token&type=1H&time_from=1000000000&time_to=1720381217`, options);
    const jsonResponse = await response.json();
    data = jsonResponse.data.items;
    const highestValueObject = data.reduce((max, obj) => obj.value > max.value ? obj : max, data[0]);
    tokenValueData.currentValue = data[data.length - 1].value
    tokenValueData.maxValue = highestValueObject.value
  } catch (err) {
    console.error(err);
  }

  return tokenValueData;
}

const data = await getHistoricData('AVWsE5PJv3oZPzmurvD6cSwvS1x7bPhj1nFz2LMHFxoK')
console.log("Data: ", data)

999800234

0.0001352229134615297