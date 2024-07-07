import { useState, useEffect, useContext, useRef } from "react";
import * as web3 from "@solana/web3.js";
import {
  SystemProgram,
  SystemInstruction,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import { GlobalContext } from "./GlobalContext.jsx";
import { gql, GraphQLClient } from "graphql-request";
import { ToastContainer, toast } from "react-toastify";
import twitterLogo from "../assets/twitter.png"; 
import telegramLogo from "../assets/telegram.png"; 
import websiteLogo from "../assets/web.png";
import checkIcon from "../assets/accept.png"; 
import crossIcon from "../assets/delete.png";
import ownerLogo from "../assets/chief-executive-officer.png";
import ds from "../assets/ds.png"
import pump from "../assets/pump.jpg"

export default function Tokens({ days, minStartlp, minTotalMc, minCurrentMc, triggerAction }) {
  const { params } = useContext(GlobalContext);
  const { signal } = useContext(GlobalContext);
  const [loading, setLoading] = useState(false);
  const isMountedRef = useRef(false);
  const [result, setResult] = useState([]);
  const [maxTimeDays, setMaxDays] = useState(0);

  useEffect(() => {
    function createRPCRotator() {
      const RPCs = [import.meta.env.VITE_RPC_3, import.meta.env.VITE_RPC_4];
      return function () {
        RPCs.push(RPCs.shift());
        return new web3.Connection(RPCs[0], "confirmed");
      };
    }

    const notify = (err) =>
      toast.error(err, {
        position: "bottom-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
      });

    if (triggerAction) {
      const convertDaysToSeconds = (days) => {
        return days * 86400;
      };
      const rotateRPC = createRPCRotator();
      function getPublickey(wallet) {
        const publicKeyGet = new web3.PublicKey(wallet);
        return publicKeyGet;
      }

      async function main() {
        setLoading(true);
        const unixTimestamp = Math.floor(Date.now() / 1000);
        let fetchTokens = await queryLpsBetween(
          unixTimestamp - convertDaysToSeconds(days),
          unixTimestamp
        );

        const result = [];
        fetchTokens = fetchTokens.slice(0, 150);

        for (let eachToken of fetchTokens) {
          // console.log("eachtoken: ", eachToken)
          let attempts = 4;
          let tokenObject = {
            baseMint: "Not fetched",
            lpMint: "Not fetched",
            supply: 0,
            owner: "Not fetched",
            name: "Not fetched",
            symbol: "Not fetched",
            imageUrl: "Not fetched",
            telegram: "Not fetched",
            twitter: "Not fetched",
            website: "Not fetched",
            isMutable: false,
            isFreezeable: false,
            mintAuthorityOn: false,
            lpBurned: false,
            currentMc: -1,
            currentValue: -1,
            maxMc: -1,
            maxValue: -1,
            startValueLp: -1,
            m5: "Not fetched",
            h1: "Not fetched",
            h6: "Not fetched",
            h24: "Not fetched",
            pool_created_at: "Not fetched",
          };

          while (attempts > 0) {
            try {
              tokenObject.baseMint = eachToken.baseMint;
              tokenObject.lpMint = eachToken.lpMint;
              const tokendata = await getTokenMetadata([eachToken.baseMint]);
              tokenObject.name = tokendata.onChainMetadata.metadata.data.name;
              tokenObject.symbol =
                tokendata.onChainMetadata.metadata.data.symbol;
              tokenObject.telegram =
                tokendata.offChainMetadata.metadata.extensions?.telegram ?? "";
              tokenObject.twitter =
                tokendata.offChainMetadata.metadata.extensions?.twitter ?? "";
              tokenObject.website =
                tokendata.offChainMetadata.metadata.extensions?.website ?? "";
              tokenObject.isMutable =
                tokendata.onChainMetadata.metadata.isMutable;
              tokenObject.isFreezeable =
                tokendata.onChainAccountInfo.accountInfo.data.parsed.info.freezeAuthority;
              tokenObject.mintAuthorityOn =
                tokendata.onChainAccountInfo.accountInfo.data.parsed.info.mintAuthority;

              const transactions = await getTokenTransactions(eachToken.lpMint);
              const txs = transactions.map((tx) => tx.signature);
              const lpStatus = await parseLpMintTransaction(txs);
              if (lpStatus.length > 1) {
                if (lpStatus[lpStatus.length - 2].type === "BURN") {
                  tokenObject.lpBurned = true;
                } else if (
                  lpStatus[lpStatus.length - 2].type === "WITHDRAW_LIQUIDITY"
                ) {
                  tokenObject.lpBurned = "Rugged";
                }
              } else {
                tokenObject.lpBurned = false;
              }
              if (lpStatus[lpStatus.length - 1].type === "CREATE_POOL") {
                tokenObject.startValueLp =
                  lpStatus[lpStatus.length - 1].tokenTransfers[1].tokenAmount;
                
                if (lpStatus[lpStatus.length - 1].feePayer === "39azUYFWPz3VHgKCf3VChUwbpURdCHRxjWVowf5jUJjg") {
                  tokenObject.owner = "https://pump.fun/" + tokenObject.baseMint;
                } else {
                  tokenObject.owner = lpStatus[lpStatus.length - 1].feePayer;                  
                }
              } else {
                tokenObject.startValueLp = "Failed to fetch";
              }

              let poolDataNotNull = false;
              let poolInfo;
              while (!poolDataNotNull) {
                poolInfo = await fetchPoolInfo(eachToken.lpMint);
                if (poolInfo.data !== null) {

                  poolDataNotNull = true;
                  tokenObject.imageUrl = poolInfo.data[0].mintA.logoURI;
                } else {
                  console.log("Pooldata is null");
                }
              }

              const pool = poolInfo.data[0].id;
              const poolData = await fetchPoolInfoNew(pool);
              tokenObject.m5 =
                poolData.data.attributes.price_change_percentage.m5;
              tokenObject.h1 =
                poolData.data.attributes.price_change_percentage.h1;
              tokenObject.h6 =
                poolData.data.attributes.price_change_percentage.h6;
              tokenObject.h24 =
                poolData.data.attributes.price_change_percentage.h24;
              tokenObject.pool_created_at =
                poolData.data.attributes.pool_created_at;

              const tokenSupply = await getTokenSupply(tokenObject.baseMint);
              tokenObject.supply = tokenSupply;

              const data = await getHistoricData(tokenObject.baseMint);
              tokenObject.currentValue = data.currentValue;
              tokenObject.currentMc = data.currentValue * tokenSupply;
              tokenObject.maxMc = data.maxValue * tokenSupply;
              tokenObject.maxValue = data.maxValue;

              attempts = 0; // Exit loop on success
            } catch (err) {
              attempts--;
              console.log("Error: ", err);
              notify(
                `Failed to process token: ${eachToken} - ${err} - Attempts left: ${attempts}`
              );
            }
          }
          result.push(tokenObject);
        }
        console.log("Results: ", result)
        const filteredResult = filterTokens(result, minStartlp, minTotalMc);
        console.log("filteredResult: ", filteredResult);
        setLoading(false);
        setResult(filteredResult);
      }
      main();

      function filterTokens(tokens, startValueLpCriteria, maxMcCriteria) {
        return tokens.filter((token) => {
          return (
            token.startValueLp >= startValueLpCriteria &&
            token.maxMc >= maxMcCriteria * 1000 &&
            token.lpBurned === true &&
            token.currentMc >= minCurrentMc * 1000
          );
        });
      }


      const fetchPoolInfoNew = async (pool) => {
        const response = await fetch(
          "https://api.geckoterminal.com/api/v2/networks/solana/pools/" + pool
        );
        const data = await response.json();
        return data;
      };

      // Hämta de senaste tokenens
      async function queryLpsBetween(start, end) {
        const endpoint = `https://programs.shyft.to/v0/graphql/?api_key=${
          import.meta.env.VITE_SHYFT_API
        }`;
        const graphQLClient = new GraphQLClient(endpoint, {
          method: `POST`,
          jsonSerializer: {
            parse: JSON.parse,
            stringify: JSON.stringify,
          },
        });

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

        try {
          const response = await graphQLClient.request(query);
          return response.Raydium_LiquidityPoolv4;
        } catch (error) {
          console.error("Error querying liquidity pools:", error);
          throw error;
        }
      }
      // Hämta tokens metadata
      const getTokenMetadata = async (token) => {
        const urlMetadata = `https://api.helius.xyz/v0/token-metadata?api-key=${
          import.meta.env.VITE_HELIUS_API
        }`;
        const response = await fetch(urlMetadata, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            mintAccounts: token,
            includeOffChain: true,
            disableCache: false,
          }),
        });
        const data = await response.json();
        return data[0];
        /*         fs.writeFile('metadata.json', JSON.stringify(data, null, 2), (err) => {
            if (err) {
            console.error('Error writing to file', err);
            } else {
            console.log('Metadata saved to metadata.json');
            }
        }); */
      };

      const getTokenTransactions = async (address) => {
        const response = await rotateRPC().getConfirmedSignaturesForAddress2(
          getPublickey(address)
        );
        return response;
      };
      //Hitta om tokenet bränt LP / ruggat LP / eller har den orörd
      const parseLpMintTransaction = async (txs) => {
        const urlLpMintTransactionData =
          "https://api.helius.xyz/v0/transactions/?api-key=214a5e1f-bfc9-4e59-a1ce-f96533457125";
        const response = await fetch(urlLpMintTransactionData, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            transactions: txs,
          }),
        });

        const data = await response.json();
        return data;
      };
      // Hämta pool information - Hämta ut nuvarnade MC och max MC för senaste månaden.
      const fetchPoolInfo = async (lpmint) => {
        try {
          const response = await fetch(
            "https://api-v3.raydium.io/pools/info/lps?lps=" + lpmint
          );
          const data = await response.json();
          return data;
        } catch (err) {
          console.log("Erro fetching pool: ", err);
        }
      };

      async function getHistoricData(token) {
        const options = {
          method: "GET",
          headers: { "X-API-KEY": "3a8c49ca44074f158af9a4009bb95e3b" },
        };
        let tokenValueData = {
          currentValue: 0,
          maxValue: 0,
        };
        let data;

        let attempts = 3; // Number of retry attempts

        while (attempts > 0) {
          try {
            const response = await fetch(
              `https://public-api.birdeye.so/defi/history_price?address=${token}&address_type=token&type=1H&time_from=1000000000&time_to=1720381217`,
              options
            );
            const jsonResponse = await response.json();
            data = jsonResponse.data.items;

            // Check if data is undefined or empty
            if (!data || data.length === 0) {
              throw new Error("Data is undefined or empty");
            }

            const highestValueObject = data.reduce(
              (max, obj) => (obj.value > max.value ? obj : max),
              data[0]
            );
            tokenValueData.currentValue = data[data.length - 1].value;
            tokenValueData.maxValue = highestValueObject.value;

            // Exit loop if data fetching was successful
            break;
          } catch (err) {
            console.error("`Attempt", 4 - attempts, "failed:", err);
            attempts--;
          }
        }

        return tokenValueData;
      }

      async function getTokenSupply(token) {
        const response = await rotateRPC().getTokenSupply(getPublickey(token));
        return parseInt(response.value.uiAmountString);
      }
    }
  }, [triggerAction, days]);

  /*   useEffect(() => {
    setLoading(true);
    setResult([
      {
        baseMint: "FeKDnwLPMRoUqLofveWmU9Zc8J8mjfQUwKUa142xCqGN",
        lpMint: "7vxiGjxtfae6aEjvfCSP79SVHEgANA2Tr8QwmNp3HSYX",
        supply: 826184220,
        owner: "CGsqR7CTqTwbmAUTPnfg9Bj9GLJgkrUD9rhjh3vHEYvh",
        name: "Cotton Mouth",
        symbol: "Cotton",
        imageUrl:
          "https://img-v1.raydium.io/icon/So11111111111111111111111111111111111111112.png",
        telegram: "www.telegram.se",
        twitter: "",
        website: "",
        isMutable: true,
        isFreezeable: "",
        mintAuthorityOn: "",
        lpBurned: true,
        currentMc: 15486.881953243255,
        currentValue: 0.000018745071109253642,
        maxMc: 664264.0564326143,
        maxValue: 0.0008040144562826609,
        startValueLp: 250.43278517,
        m5: "0.9",
        h1: "1.89",
        h6: "2.16",
        h24: "-85.1",
        pool_created_at: "2024-07-07T02:41:11Z",
      },
      {
        baseMint: "FeKDnwLPMRoUqLofveWmU9Zc8J8mjfQUwKUa142xCqGN",
        lpMint: "7vxiGjxtfae6aEjvfCSP79SVHEgANA2Tr8QwmNp3HSYX",
        supply: 826184220,
        owner: "CGsqR7CTqTwbmAUTPnfg9Bj9GLJgkrUD9rhjh3vHEYvh",
        name: "Cotton Mouth",
        symbol: "Cotton",
        imageUrl:
          "https://img-v1.raydium.io/icon/So11111111111111111111111111111111111111112.png",
        telegram: "www.telegram.com/hej",
        twitter: "https://x.com/",
        website: "www.hej.se",
        isMutable: false,
        isFreezeable: "hejhejhej",
        mintAuthorityOn: "",
        lpBurned: true,
        currentMc: 15486.881953243255,
        currentValue: 0.000018745071109253642,
        maxMc: 664264.0564326143,
        maxValue: 0.0008040144562826609,
        startValueLp: 250.43278517,
        m5: "0.9",
        h1: "1.89",
        h6: "2.16",
        h24: "-85.1",
        pool_created_at: "2024-07-07T02:41:11Z",
      },
    ]);
    setLoading(false);
  }, []); */

  useEffect(() => {
    setMaxDays(days);
  }, [signal]);

  const getStyleForValue = (value) => ({
    color: parseFloat(value) > 0 ? "green" : "red",
    fontWeight: "bold",
  });

  const roundValue = (value, decimals) => {
    return parseFloat(value).toFixed(decimals);
  };

  const renderAuthCell = (value) => {
    if (value) {
      return (
        <span className="auth-cell" style={{ color: "red" }}>
          <img src={crossIcon} alt="No" className="auth-icon" /> Yes
        </span>
      );
    }
    return (
      <span className="auth-cell" style={{ color: "green" }}>
        <img src={checkIcon} alt="Yes" className="auth-icon" /> No
      </span>
    );
  };

  return (
    <div className="token-table">
      <table>
        <thead className="token-columns">
          <tr>
            <th>#</th>
            <th>Logo</th>
            <th>DS</th>
            <th>Name</th>
            <th>Symbol</th>
            <th>5M</th>
            <th>1H</th>
            <th>6H</th>
            <th>24H</th>
            <th>MKT CAP</th>
            <th>MAX MKT CAP</th>
            <th>Start LP</th>
            <th>Freeze Auth</th>
            <th>Mint Auth</th>
            <th>Mutable</th>
            <th>Created</th>
            <th>Owner</th>
            <th>Socials</th>
          </tr>
        </thead>
        <tbody>
          {loading && <div className="skeleton-loader">Loading...</div>}
          {!loading && result.length > 0
            ? result.map((token, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>
                    <img
                      src={token.imageUrl}
                      alt={token.name}
                      className="token-logo"
                    />
                  </td>
                  <td>
                    <a
                      href={`https://dexscreener.com/solana/${token.baseMint}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <img src={ds} alt="Owner" className="owner-logo" />
                    </a>
                  </td>
                  <td>{token.name}</td>
                  <td>{token.symbol}</td>
                  <td style={getStyleForValue(token.m5)}>{token.m5}</td>
                  <td style={getStyleForValue(token.h1)}>{token.h1}</td>
                  <td style={getStyleForValue(token.h6)}>{token.h6}</td>
                  <td style={getStyleForValue(token.h24)}>{token.h24}</td>
                  <td>{roundValue(token.currentMc, 0)}</td>
                  <td>{roundValue(token.maxMc, 0)}</td>
                  <td>{roundValue(token.startValueLp, 0)}</td>
                  <td>{renderAuthCell(token.isFreezeable)}</td>
                  <td>{renderAuthCell(token.mintAuthorityOn)}</td>
                  <td>{renderAuthCell(token.isMutable)}</td>
                  <td>{new Date(token.pool_created_at).toLocaleString()}</td>
                  <td>
                    {token.owner.startsWith("https://") ? (
                      <a
                        href={token.owner}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <img
                          src={pump}
                          alt="Owner"
                          className="owner-logo"
                        />
                      </a>
                    ) : (
                      <a
                        href={`https://solscan.io/account/${token.owner}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <img
                          src={ownerLogo}
                          alt="Owner"
                          className="owner-logo"
                        />
                      </a>
                    )}
                  </td>
                  <td className="socials">
                    {token.website && (
                      <a
                        href={token.website}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <img
                          src={websiteLogo}
                          alt="Website"
                          className="social-logo"
                        />
                      </a>
                    )}
                    {token.twitter && (
                      <a
                        href={token.twitter}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <img
                          src={twitterLogo}
                          alt="Twitter"
                          className="social-logo"
                        />
                      </a>
                    )}
                    {token.telegram && (
                      <a
                        href={token.telegram}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <img
                          src={telegramLogo}
                          alt="Telegram"
                          className="social-logo"
                        />
                      </a>
                    )}
                  </td>
                </tr>
              ))
            : !loading && !result && <p>No Tokens found</p>}
        </tbody>
      </table>
    </div>
  );
};



