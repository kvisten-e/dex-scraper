import { useState, useEffect, useContext, useRef } from "react"
import * as web3 from '@solana/web3.js';
import { SystemProgram, SystemInstruction, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { GlobalContext } from './GlobalContext.jsx';
import { SavedContext } from "./SavedWalletContext.jsx";

export default function pumpTokens({
  minValueProp,
  maxValueProp,
  decimalerProp,
  transactionsAmountProp,
  maxTransactionsInWalletProp,
  dexChoiceProp,
  triggerAction,
  allDex,
  allDexArr,
  amountInclude,
  listenerMode,
  alertSound,
  telegramUsernameId,
  telegramToggle,
  listening,
  stopScanToggle,
  clearToggle,
  maxTransactionsToggleProp,
  decimalsTypeProp,
}) {
  const { params } = useContext(GlobalContext);
  const { signal } = useContext(GlobalContext);
  const [loading, setLoading] = useState(false);
  const isMountedRef = useRef(false);
  const [result, setResult] = useState([]);
  const [minValue, setMinValue] = useState(0);
  const [maxValue, setMaxValue] = useState(0);
  const [decimaler, setDecimaler] = useState(0);
  const [transactionsAmount, setTransactionsAmount] = useState(0);
  const [wallet, setWallet] = useState("");
  const [allDexBool, setAllDexBool] = useState();
  const [allDexArrFetch, setAllDexBoolFetch] = useState([]);
  const [maxTransactionsInWallet, setMaxTransactionsInWallet] = useState(0);
  const [maxTransactionsToggle, setMaxTransactionsToggle] = useState(true);
  const [buttonClickCounter, setButtonClickCounter] = useState(0);
  const [completedDexes, setCompletedDexes] = useState(0);
  const [totalWalltes, setTotalWallets] = useState(0);
  const { processSnipe, setProcessSnipe } = useContext(GlobalContext);
  const [processStepOne, setProcessStepOne] = useState(1);
  const [signatureAmount, setSignatureAmount] = useState(0);
  const [logs, setLogs] = useState([]);
  const [ws, setWs] = useState([]);
  const [alertSoundToggle, setAlertSoundToggle] = useState(true);
  const prevLogsLengthRef = useRef(logs.length);
  const [triggerActionProp, setTriggerActionProp] = useState(0);
  const { defaultWallets, savedWallets } = useContext(SavedContext);
  const [isOpen, setIsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const totalPages = Math.ceil(logs.length / itemsPerPage);
  const [liveConnectionWallets, setLiveConnectionWallets] = useState([]);
  const [decimalsType, setDecimalsType] = useState();
  const toggleList = () => {
    setIsOpen(!isOpen);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  useEffect(() => {
    setLogs([]);
  }, [clearToggle]);

  useEffect(() => {
    console.log("stopScanToggle: ", stopScanToggle);
    console.log("Listeing mode: ", listening);
    if (stopScanToggle && !listening) {
      if (ws) {
        ws.forEach((websocket) => websocket.close());
        setWs([]);
      }
    }
  }, [listening]);

  useEffect(() => {
    if (triggerAction) {
      async function main() {
        setLogs([]);
        setResult([]);
        setSignatureAmount(0);
        setProcessStepOne(0);
        setProcessSnipe([
          {
            step: "1. Get transactions from wallet/dex",
            completed: 0,
          },
          { step: "2. Find eligible transactions", completed: 0 },
        ]);
        if (!listenerMode) {
          setLoading(true);
          let result;
          if (!allDexBool) {
            result = await snipare(
              minValue,
              maxValue,
              decimaler,
              wallet,
              maxTransactionsInWallet,
              maxTransactionsToggle,
              transactionsAmount,
              decimalsType
            );
          } else {
            result = await snipare(
              minValue,
              maxValue,
              decimaler,
              allDexArrFetch,
              maxTransactionsInWallet,
              maxTransactionsToggle,
              transactionsAmount,
              decimalsType
            );
          }
          let formatedResult = removeDuplicates(result);
          formatedResult = formatedResult.filter(
            (element) => element !== undefined
          );

          if (parseFloat(amountInclude) > 0) {
            console.log("formatedResult: ", formatedResult);
            formatedResult = formatedResult.filter((obj) =>
              containsSubstring(obj.amount.toString(), amountInclude.toString())
            );
          }
          console.log("Result: ", formatedResult);
          setLoading(false);
          if (formatedResult) {
            setResult(formatedResult);
          }
        } else {
          if (!allDexBool) {
            startScan([wallet]);
          } else {
            const wallets = allDexArrFetch.map((item) => item.address);
            startScan(wallets);
          }
        }
      }
      if (listening && !loading) {
        main();
      }
      async function snipare(
        minValueNew,
        maxValueNew,
        decimalerNew,
        walletNew,
        maxTransactionsInWalletNew,
        maxTransactionsToggleNew,
        transactionsAmount,
        decimalType
      ) {
        const rotateRPC = createRPCRotator();
        const loops = parseInt(transactionsAmount) / 1000;
        let signatureValue = [];

        if (typeof walletNew === "object") {
          setTotalWallets(walletNew.length);
          for (let wallet of walletNew) {
            const transactions = await getTransactionsNew(
              wallet.address,
              loops
            );

            const newSignatureValue = await getSignatureValue(
              wallet.address,
              transactions,
              minValueNew,
              maxValueNew,
              decimalerNew,
              wallet.name,
              decimalType
            );
            let index = walletNew.indexOf(wallet) + 1;
            setCompletedDexes(index);
            signatureValue = signatureValue.concat(newSignatureValue);
          }
        } else {
          const transactions = await getTransactionsNew(wallet, loops);
          signatureValue = await getSignatureValue(
            walletNew,
            transactions,
            minValueNew,
            maxValueNew,
            decimalerNew,
            null,
            decimalType
          );
        }

        console.log("signatureValue: ", signatureValue);

        if (signatureValue.length > 0) {
          setSignatureAmount(signatureValue.length);
          const promises = signatureValue.map(async (eachWallet, i) => {
            const result = await getWalletTransactions(eachWallet.wallet);
            if (maxTransactionsToggleNew === false) {
              return signatureValue;
            }
            if (result.length <= maxTransactionsInWalletNew) {
              return eachWallet;
            }
            return null;
          });

          const results = await Promise.all(promises);
          return results.map((eachWallet) => {
            if (eachWallet !== null) {
              return eachWallet;
            }
          });
        }

        async function getWalletTransactions(wallet) {
          let attempts = 4;
          while (attempts > 0) {
            try {
              const signatures = await rotateRPC().getSignaturesForAddress(
                getPublickey(wallet),
                { commitment: "finalized" }
              );
              if (signatures) {
                setProcessStepOne(
                  (prevProcessStepOne) => prevProcessStepOne + 1
                );
                return signatures;
              }
              return [];
            } catch {
              console.log("Error on fetching for wallet: ", wallet);
              attempts--;
            }
          }
          return [];
        }

        async function getSignatureValue(
          wallet,
          list,
          min_amount,
          max_amount,
          decimaler,
          dex,
          decimalType
        ) {
          let confirmedTransactionList = [];
          let id = 1;

          let compareDecimals;

          switch (decimalType) {
            case "Max":
              compareDecimals = (deci, decimaler) => deci <= decimaler;
              break;
            case "Min":
              compareDecimals = (deci, decimaler) => deci >= decimaler;
              break;
            case "Strict":
              compareDecimals = (deci, decimaler) => deci == decimaler;
              break;
            default:
              throw new Error("Invalid decimal type");
          }

          try {
            const BATCH_SIZE = 20;
            for (let i = 0; i < list.length; i += BATCH_SIZE) {
              const batch = list.slice(i, i + BATCH_SIZE);
              const batchPromises = batch.map((signature) =>
                delay(10).then(async () =>
                  rotateRPC()
                    .getParsedTransaction(signature, {
                      commitment: "finalized",
                      maxSupportedTransactionVersion: 0,
                    })
                    .catch((error) => {
                      console.log(error);
                      return null;
                    })
                )
              );

              const results = await Promise.all(batchPromises);
              for (const transactionDetails of results) {
                if (transactionDetails) {
                  for (const instruction of transactionDetails.transaction
                    .message.instructions) {
                    if (
                      instruction.programId.toBase58() ===
                        SystemProgram.programId.toBase58() &&
                      wallet.includes(instruction.parsed.info.source)
                    ) {
                      if (
                        instruction.parsed &&
                        instruction.parsed.type === "transfer"
                      ) {
                        const transferAmount =
                          instruction.parsed.info.lamports / LAMPORTS_PER_SOL;
                        const deci = countDecimals(transferAmount);
                        if (
                          transferAmount >= min_amount &&
                          transferAmount <= max_amount &&
                          compareDecimals(deci, decimaler)
                        ) {
                          const time = getFormattedDate(
                            transactionDetails.blockTime
                          );
                          confirmedTransactionList.push({
                            wallet: instruction.parsed.info.destination,
                            amount: transferAmount,
                            time: time,
                            dex: dex,
                          });
                        }
                      }
                    }
                  }
                }
              }
            }
          } catch (error) {
            console.log(error);
          }
          return confirmedTransactionList;
        }

        async function getTransactionsNew(wallet, loops) {
          let signatures = [];
          let lastSignature = "";
          let response;
          for (let i = 1; i <= loops; i++) {
            if (i > 1) {
              console.log("Inne: " , i)
              response = await rotateRPC().getSignaturesForAddress(
                getPublickey(wallet),
                { before: lastSignature }
              );
            } else {
              response = await rotateRPC().getSignaturesForAddress(
                getPublickey(wallet)
              );
            }

            if (response && response.length > 0) {
              console.log("Response: ", response)
              signatures = signatures.concat(response);
              lastSignature = response[response.length - 1].signature;
            } else {
              console.log("No transactions found in loop: ", i);
            }
            let statusCompleted = (i / loops) * 100;
            setProcessSnipe((prevProcess) =>
              prevProcess.map((step, idx) => ({
                ...step,
                completed: idx === 0 ? statusCompleted : step.completed,
              }))
            );
          }
          console.log("signatures amount:", signatures.length);
          signatures = signatures.map((signature) => signature.signature);
          return signatures;
        }

        async function getTransactions(wallet) {
          let listTransactions = [];

          let signature = await rotateRPC().getSignaturesForAddress(
            getPublickey(wallet),
            { limit: 1000, commitment: "finalized" }
          );
          if (signature.length > 0) {
            try {
              listTransactions = signature.map(
                (signature) => signature.signature
              );
            } catch (error) {
              console.log("signatures list failed ", error);
            }
          }
          return listTransactions;
        }

        function getPublickey(wallet) {
          const publicKeyGet = new web3.PublicKey(wallet);
          return publicKeyGet;
        }

        function createRPCRotator() {
                const RPCs = [
                  import.meta.env.VITE_RPC_1,
                  import.meta.env.VITE_RPC_2,
                  import.meta.env.VITE_RPC_3,
                  import.meta.env.VITE_RPC_4,
                  import.meta.env.VITE_RPC_5,
                  import.meta.env.VITE_RPC_6,
                  import.meta.env.VITE_RPC_7,
                  import.meta.env.VITE_RPC_8,
                  import.meta.env.VITE_RPC_9,
                  import.meta.env.VITE_RPC_10,
                  import.meta.env.VITE_RPC_11,
                  import.meta.env.VITE_RPC_12,
                  import.meta.env.VITE_RPC_13,
                  import.meta.env.VITE_RPC_14,
                  import.meta.env.VITE_RPC_15,
                  import.meta.env.VITE_RPC_16,
                  import.meta.env.VITE_RPC_17,
                  import.meta.env.VITE_RPC_18,
                  import.meta.env.VITE_RPC_19,
                  import.meta.env.VITE_RPC_20,
                  import.meta.env.VITE_RPC_21,
                ];
          return function () {
            RPCs.push(RPCs.shift());
            return new web3.Connection(RPCs[0], "confirmed");
          };
        }

        function getFormattedDate(timestamp) {
          var a = new Date(timestamp * 1000);
          var months = [
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Oct",
            "Nov",
            "Dec",
          ];
          var year = a.getFullYear();
          var month = months[a.getMonth()];
          var date = a.getDate();
          var hour = String(a.getHours()).padStart(2, "0");
          var min = String(a.getMinutes()).padStart(2, "0");
          var sec = String(a.getSeconds()).padStart(2, "0");
          var time =
            hour +
            ":" +
            min +
            ":" +
            sec +
            " - " +
            date +
            " " +
            month +
            " " +
            year;
          return time;
        }

        function delay(ms) {
          return new Promise((resolve) => setTimeout(resolve, ms));
        }

        function countDecimals(value) {
          if (Math.floor(value) === value) return 0;

          let valueAsString = value.toString();
          if (valueAsString.includes(",")) {
            valueAsString = valueAsString.replace(",", ".");
          }

          if (valueAsString.includes(".")) {
            return valueAsString.split(".")[1].length;
          }

          return 0;
        }
      }

      function removeDuplicates(array) {
        const uniqueObjects = new Set();
        return array.filter((item) => {
          const serializedItem = JSON.stringify(item);
          if (!uniqueObjects.has(serializedItem)) {
            uniqueObjects.add(serializedItem);
            return true;
          }
          return false;
        });
      }

      function containsSubstring(amount, search) {
        return amount.includes(search);
      }
    }
  }, [buttonClickCounter]);

  useEffect(() => {
    console.log(processStepOne, "/", signatureAmount);
    let statusCompleted = (processStepOne / signatureAmount) * 100; // Note: i+1 to reflect the current step
    setProcessSnipe((prevProcess) =>
      prevProcess.map((step, idx) => ({
        ...step,
        completed: idx === 1 ? statusCompleted : step.completed,
      }))
    );
  }, [processStepOne]);

  useEffect(() => {
    setMinValue(minValueProp);
    setMaxValue(maxValueProp);
    setDecimaler(decimalerProp);
    setTransactionsAmount(transactionsAmountProp);
    setWallet(dexChoiceProp);
    setMaxTransactionsInWallet(maxTransactionsInWalletProp);
    setMaxTransactionsToggle(maxTransactionsToggleProp);
    setAllDexBool(allDex);
    setAllDexBoolFetch(allDexArr);
    setButtonClickCounter((prev) => prev + 1);
    setTriggerActionProp(triggerAction);
    setDecimalsType(decimalsTypeProp);
  }, [triggerAction]);

  useEffect(() => {
    setAlertSoundToggle(alertSound);
  }, [alertSound]);

  useEffect(() => {
    if (logs.length > prevLogsLengthRef.current) {
      if (telegramToggle && telegramUsernameId.length !== 0) {
        const obj = logs[0];
        for (let eachId of telegramUsernameId) {
          sendMessageToTelegram(
            `💸*${obj.dex} - ${obj.amount} SOL*\n\nWallet: ${obj.wallet}\nTime: ${obj.time}\nAmount: ${obj.amount}\nDEX: ${obj.dex}\n\nhttps://solscan.io/account/${obj.wallet}`,
            eachId
          );
        }
      }

      if (alertSoundToggle && listening) {
        playAudio();
      }
    }

    prevLogsLengthRef.current = logs.length;
  }, [logs]);

  useEffect(() => {
    setAllDexBool(false);
    setTotalWallets(0);
    setCompletedDexes(0);
    setLoading(false);
    setTriggerActionProp(0);
    setLogs([]);
    setResult([]);
    setSignatureAmount(0);
    setProcessStepOne(0);
    setProcessSnipe([
      {
        step: "1. Get transactions from wallet/dex",
        completed: 0,
      },
      { step: "2. Find eligible transactions", completed: 0 },
    ]);
  }, [listenerMode]);

  const startScan = async (wallets) => {
    const createWebSocket = (wallet, index) => {
      let websocket;
      let timerId = 0;
      let reconnectInterval = 5000; // 5 seconds
      let keepAliveInterval = 20000; // 20 seconds

      const connect = () => {

        websocket = new WebSocket(import.meta.env.VITE_HELIUS_WSS);

        const keepAlive = () => {
          if (websocket.readyState === WebSocket.OPEN) {
            websocket.send("");
          }
          timerId = setTimeout(keepAlive, keepAliveInterval);
        };

        const cancelKeepAlive = () => {
          if (timerId) {
            clearTimeout(timerId);
          }
        };

        websocket.onopen = () => {
          console.log(`WebSocket connection open for wallet ${wallet}`);
          setLiveConnectionWallets((prevWallets) => [...prevWallets, wallet]);
          const subscribeMessage = JSON.stringify({
            jsonrpc: "2.0",
            id: index + 1,
            method: "logsSubscribe",
            params: [
              {
                mentions: [wallet],
              },
              {
                commitment: "confirmed",
              },
            ],
          });
          websocket.send(subscribeMessage);
          keepAlive(); // Start keep-alive mechanism
        };

        websocket.onmessage = async (event) => {
          const response = JSON.parse(event.data);
          if (response.method === "logsNotification") {
            let result = await snipareListener(
              minValue,
              maxValue,
              decimaler,
              maxTransactionsInWallet,
              maxTransactionsToggle,
              response.params.result.value.signature,
              [wallet],
              decimalsType
            );
            if (parseFloat(amountInclude) > 0) {
              result = result.filter((obj) =>
                containsSubstring(
                  obj.amount.toString(),
                  amountInclude.toString()
                )
              );
            }
            setLogs((prevLogs) => [...result, ...prevLogs]);
          }
        };

        function containsSubstring(amount, search) {
          return amount.includes(search);
        }

        websocket.onclose = () => {
          setLiveConnectionWallets((prevWallets) =>
            prevWallets.filter((w) => w !== wallet)
          );
          console.log(`WebSocket connection closed for wallet ${wallet}`);
          cancelKeepAlive(); // Cancel keep-alive mechanism
          reconnectWallet(wallet);
        };

        websocket.onerror = (error) => {
          console.log("WebSocket error for wallet", wallet, " - ", error);
          websocket.close();
        };
      };

      connect();

      function reconnectWallet(wallet) {
        console.log("Listeing mf!; ", listening);
        if (listening) {
          console.log(
            `Reconnecting WebSocket for wallet ${wallet} in ${
              reconnectInterval / 1000
            } seconds...`
          );
          setTimeout(connect, reconnectInterval);
        }
      }

      return websocket;
    };

    const websockets = wallets.map((wallet, index) =>
      createWebSocket(wallet, index)
    );
    setWs((prevWebsockets) => [...prevWebsockets, ...websockets]);
  };

  useEffect(() => {
    console.log(
      "Live changed: ",
      liveConnectionWallets,
      " - ",
      liveConnectionWallets.length
    );
    console.log("Ws: ", ws, " - ", ws.length);
    console.log("Listening useeffect: ", listening);
  }, [liveConnectionWallets]);

  const sendMessageToTelegram = async (message, id) => {
    const url = `https://api.telegram.org/bot${
      import.meta.env.VITE_TELEGRAM_BOT
    }/sendMessage`;
    const payload = {
      chat_id: id,
      text: message,
      parse_mode: "Markdown",
    };

    try {
      // Using fetch
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        console.log("Message sent successfully");
      } else {
        console.error("Failed to send message");
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  async function snipareListener(
    minValueNew,
    maxValueNew,
    decimalerNew,
    maxTransactionsInWalletNew,
    maxTransactionsToggleNew,
    signature,
    wallet,
    decimalType
  ) {
    const rotateRPC = createRPCRotator();

    let signatureValue = [];
    signatureValue = await getSignatureValueListener(
      wallet,
      signature,
      minValueNew,
      maxValueNew,
      decimalerNew,
      decimalType
    );

    if (signatureValue.length > 0) {
      setSignatureAmount(signatureValue.length);
      const result = await getWalletTransactions(signatureValue[0].wallet);
      if (maxTransactionsToggleNew === false) {
        return signatureValue;
      }

      if (result.length <= maxTransactionsInWalletNew) {
        return signatureValue;
      }
    }
    return [];

    async function getWalletTransactions(wallet) {
      let attempts = 4;
      while (attempts > 0) {
        try {
          const signatures = await rotateRPC().getSignaturesForAddress(
            getPublickey(wallet),
            { commitment: "finalized" }
          );
          if (signatures) {
            return signatures;
          }
          return [];
        } catch {
          console.log("Error on fetching for wallet: ", wallet);
          attempts--;
        }
      }
      return [];
    }

    async function getSignatureValueListener(
      wallet,
      signature,
      min_amount,
      max_amount,
      decimaler,
      decimalType
    ) {
      let confirmedTransactionList = [];
      try {
        let transactionDetails = null;
        let retries = 3;

        for (let attempt = 0; attempt < retries; attempt++) {
          try {
            transactionDetails = await rotateRPC().getParsedTransaction(
              signature,
              {
                commitment: "confirmed",
                maxSupportedTransactionVersion: 0,
              }
            );

            if (transactionDetails !== null) {
              break;
            }
          } catch (error) {
            if (attempt === retries - 1) {
              throw error;
            }
          }

          await new Promise((resolve) => setTimeout(resolve, 1000)); 
        }

        if (transactionDetails === null) {
          throw new Error(
            "Failed to fetch transaction details after 3 attempts"
          );
        }


          
        if (transactionDetails) {

          for (const instruction of transactionDetails.transaction.message
            .instructions) {
            
            let compareDecimals;

            switch (decimalType) {
              case "Max":
                compareDecimals = (deci, decimaler) => deci <= decimaler;
                break;
              case "Min":
                compareDecimals = (deci, decimaler) => deci >= decimaler;
                break;
              case "Strict":
                compareDecimals = (deci, decimaler) => deci == decimaler;
                break;
              default:
                throw new Error("Invalid decimal type");
            }            
            
            if (
              instruction.programId.toBase58() ===
                SystemProgram.programId.toBase58() &&
              wallet.includes(instruction.parsed.info.source)
            ) {
              if (
                instruction.parsed &&
                instruction.parsed.type === "transfer"
              ) {
                const transferAmount =
                  instruction.parsed.info.lamports / LAMPORTS_PER_SOL;
                const deci = countDecimals(transferAmount);
                if (
                  transferAmount >= min_amount &&
                  transferAmount <= max_amount &&
                  compareDecimals(deci, decimaler)
                ) {
                  const time = getFormattedDate(transactionDetails.blockTime);
                  confirmedTransactionList.push({
                    wallet: instruction.parsed.info.destination,
                    amount: transferAmount,
                    time: time,
                    dex: findNameByAddress(instruction.parsed.info.source),
                  });
                }
              }
            }
          }
        }
      } catch (error) {
        console.log(error);
      }
      return confirmedTransactionList;
    }

    function getPublickey(wallet) {
      const publicKeyGet = new web3.PublicKey(wallet);
      return publicKeyGet;
    }

    function createRPCRotator() {
      const RPCs = [
        import.meta.env.VITE_RPC_1,
        import.meta.env.VITE_RPC_2,
        import.meta.env.VITE_RPC_3,
        import.meta.env.VITE_RPC_4,
      ];
      return function () {
        RPCs.push(RPCs.shift());
        return new web3.Connection(RPCs[0], "confirmed");
      };
    }

    function getFormattedDate(timestamp) {
      var a = new Date(timestamp * 1000);
      var months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      var year = a.getFullYear();
      var month = months[a.getMonth()];
      var date = a.getDate();
      var hour = String(a.getHours()).padStart(2, "0");
      var min = String(a.getMinutes()).padStart(2, "0");
      var sec = String(a.getSeconds()).padStart(2, "0");
      var time =
        hour + ":" + min + ":" + sec + " - " + date + " " + month + " " + year;
      return time;
    }

    function countDecimals(value) {
      if (Math.floor(value) === value) return 0;

      let valueAsString = value.toString();
      if (valueAsString.includes(",")) {
        valueAsString = valueAsString.replace(",", ".");
      }

      if (valueAsString.includes(".")) {
        return valueAsString.split(".")[1].length;
      }

      return 0;
    }



  }

  function findNameByAddress(address) {
    const mergedArrays = defaultWallets.concat(savedWallets);
    console.log("mergedArrays: ", mergedArrays);
    for (let item of mergedArrays) {
      if (item.address.trim() === address.trim()) {
        return item.name;
      }
    }
    return address;
  }

  function playAudio() {
    const audio = new Audio("/alert-2354.mp3");

    audio.addEventListener("ended", () => {});

    audio.play().catch((error) => {
      console.error("Error playing audio:", error);
    });
  }

  function getRandomWss() {
    const randomNumber = Math.floor(Math.random() * 10) + 1;
    const viteString = `VITE_RPC_${randomNumber}`;
    const wss = import.meta.env[viteString];
    return wss;
  }

  const styles = {
    listContainer: {
      margin: "10px 0",
    },
    header: {
      cursor: "pointer",
      fontWeight: "bold",
      padding: "5px",
      backgroundColor: "#f2f2f2",
      border: "1px solid #ddd",
    },
    values: {
      padding: 0,
      margin: 0,
    },
    listItem: {
      listStyleType: "none",
      padding: "5px",
      borderBottom: "1px solid #ddd",
    },
  };

  return (
    <>
      {!listenerMode ? (
        <div className="found-tokens">
          {allDexBool ? (
            <p>
              Dexes loaded: {completedDexes} / {totalWalltes}
            </p>
          ) : (
            <></>
          )}
          {loading && <div className="skeleton-loader">Loading...</div>}
          {!loading && result.length > 0
            ? result.map((obj, index) => (
                <section key={index} style={{ borderBottom: "2px solid #000" }}>
                  <h5>{obj.time}</h5>
                  {obj.dex !== null ? <p>Dex: {obj.dex}</p> : <></>}
                  <p>
                    Wallet:{" "}
                    <a
                      href={
                        "https://solscan.io/account/" +
                        obj.wallet +
                        "#solTransfers"
                      }
                      target="_blank"
                    >
                      {" "}
                      {obj.wallet}
                    </a>
                  </p>
                  <p>Amount: {obj.amount}</p>
                </section>
              ))
            : !loading &&
              !result.length > 0 &&
              triggerActionProp !== 0 && <p>No Wallets found</p>}
        </div>
      ) : (
        <div className="found-tokens">
          {ws.length > 0 ? (
            <div style={styles.listContainer}>
              {allDexBool ? (
                <div style={styles.header} onClick={toggleList}>
                  Connections: {liveConnectionWallets.length} /{" "}
                  {allDexArrFetch.length} 🟢
                </div>
              ) : (
                <div style={styles.header} onClick={toggleList}>
                  Connections: {liveConnectionWallets.length} / 1 🟢
                </div>
              )}
              {isOpen && (
                <ul style={styles.values}>
                  {liveConnectionWallets.map((item, index) => (
                    <li key={index} style={styles.listItem}>
                      Dex: {findNameByAddress(item)}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            <>
              {allDexBool ? (
                <div style={styles.header} onClick={toggleList}>
                  Connections: {ws.length} / {allDexArrFetch.length} 🔴
                </div>
              ) : (
                <div style={styles.header} onClick={toggleList}>
                  Connections: {ws.length} / 1 🔴
                </div>
              )}
            </>
          )}
          {/* Pagination controls */}
          {logs.length > itemsPerPage && (
            <div
              style={{
                marginTop: "10px",
                marginBottom: "10px",
                display: "flex",
                justifyContent: "center",
              }}
            >
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous Page
              </button>
              <span style={{ margin: "0 10px" }}>
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next Page
              </button>
            </div>
          )}
          {logs
            .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
            .map((obj, index) => (
              <section key={index} style={{ borderBottom: "2px solid #000" }}>
                <h5>{obj.time}</h5>
                {obj.dex !== null ? <p>Dex: {obj.dex}</p> : null}
                <p>
                  Wallet:{" "}
                  <a
                    href={
                      "https://solscan.io/account/" +
                      obj.wallet +
                      "#solTransfers"
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {obj.wallet}
                  </a>
                </p>
                <p>Amount: {obj.amount}</p>
              </section>
            ))}
        </div>
      )}
    </>
  );
}

