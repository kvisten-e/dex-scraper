import { useState, useEffect, useContext, useRef } from "react"
import * as web3 from '@solana/web3.js';
import { SystemProgram, SystemInstruction, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { GlobalContext } from './GlobalContext.jsx';

export default function pumpTokens({ minValueProp, maxValueProp, decimalerProp, transactionsAmountProp, maxTransactionsInWalletProp, dexChoiceProp, triggerAction, allDex, allDexArr, amountInclude, listenerMode, alertSound }) {

  const { params } = useContext(GlobalContext)
  const { signal } = useContext(GlobalContext)
  const [loading, setLoading] = useState(false);
  const isMountedRef = useRef(false);
  const [result, setResult] = useState([])
  const [minValue, setMinValue] = useState(0)
  const [maxValue, setMaxValue] = useState(0)
  const [decimaler, setDecimaler] = useState(0)
  const [transactionsAmount, setTransactionsAmount] = useState(0)
  const [wallet, setWallet] = useState('')
  const [allDexBool, setAllDexBool] = useState()
  const [allDexArrFetch, setAllDexBoolFetch] = useState([])
  const [maxTransactionsInWallet, setMaxTransactionsInWallet] = useState(0)
  const [resultList, setResultList] = useState([])
  const [buttonClickCounter, setButtonClickCounter] = useState(0)
  const [completedDexes, setCompletedDexes] = useState(0)
  const [totalWalltes, setTotalWallets] = useState(0)
  const { processSnipe, setProcessSnipe } = useContext(GlobalContext) 
  const [processStepOne, setProcessStepOne] = useState(1)
  const [signatureAmount, setSignatureAmount] = useState(0)
  const [logs, setLogs] = useState([]);
  const [ws, setWs] = useState(null);
  const [listening, setListeing] = useState(false)
  const [alertSoundToggle, setAlertSoundToggle] = useState(true)
  const prevLogsLengthRef = useRef(logs.length);
  const [triggerActionProp, setTriggerActionProp] = useState(0)


  useEffect(() => {
    if (triggerAction) {
      async function main() {
        setLogs([]);
        setResult([])
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
              transactionsAmount
            );
          } else {
            result = await snipare(
              minValue,
              maxValue,
              decimaler,
              allDexArrFetch,
              maxTransactionsInWallet,
              transactionsAmount
            );
          }
          let formatedResult = removeDuplicates(result);

          if (parseFloat(amountInclude) > 0) {
            formatedResult = formatedResult.filter((obj) =>
              containsSubstring(
                obj.amount.toString(),
                amountInclude.toString()
              )
            );
          }
          console.log("Result: ", formatedResult);
          setLoading(false);
          if (formatedResult) {
            setResultList([]);
            setResult(formatedResult);
          } 
        } else {
          setListeing(true)
          if (!allDexBool) {
            // startScan([wallet])
            startScan([wallet]);
          } else {
            const wallets = allDexArrFetch.map((item) => item.address);
            startScan(wallets);
          }
        }
        

      }
      if (!listening && !loading) {
        main();
      } 
      async function snipare(minValueNew, maxValueNew, decimalerNew, walletNew, maxTransactionsInWalletNew, transactionsAmount ) {

        const rotateRPC = createRPCRotator();
        
        const loops = parseInt(transactionsAmount) / 1000
        let signatureValue = [];
        if (typeof walletNew === 'object') {

          setTotalWallets(walletNew.length)
          for (let wallet of walletNew) {
            const transactions = await getTransactionsNew(wallet.address, loops)        

            const newSignatureValue = await getSignatureValue(wallet.address, transactions, minValueNew, maxValueNew, decimalerNew, wallet.name)
            let index = walletNew.indexOf(wallet) + 1
            setCompletedDexes(index)
            signatureValue = signatureValue.concat(newSignatureValue)
          }  

        } else {
          console.log("Här1: ")
          const transactions = await getTransactionsNew(wallet, loops)
          console.log("Här2: ", transactions)

          signatureValue = await getSignatureValue(walletNew, transactions, minValueNew, maxValueNew, decimalerNew, null)
        }

        console.log("signatureValue: ", signatureValue)  
        
        if (signatureValue.length > 0) {
          setSignatureAmount(signatureValue.length)
          const promises = signatureValue.map(async (eachWallet, i) => {
            const result = await getWalletTransactions(eachWallet.wallet);
            if (result.length <= maxTransactionsInWalletNew) {
              return eachWallet;
            }
            return null;
          });

          const results = await Promise.all(promises);
          return results.map(eachWallet => {
            if (eachWallet !== null) {
              return eachWallet
            }
          })
        } 

        async function getWalletTransactions(wallet) {
          let attempts = 4
          while (attempts > 0) {
            try {
              const signatures = await rotateRPC().getSignaturesForAddress(getPublickey(wallet), { commitment: "finalized" });
              if (signatures) {
              setProcessStepOne(prevProcessStepOne => prevProcessStepOne + 1);
              return signatures
            }
              return []                
            } catch {
              console.log("Error on fetching for wallet: ", wallet)
              attempts--
            }             
          }
          return []

          }

          async function getSignatureValue(wallet, list, min_amount, max_amount, decimaler, dex) {
          let confirmedTransactionList = [];
          let id = 1
          try {
              const BATCH_SIZE = 20;
              for (let i = 0; i < list.length; i += BATCH_SIZE) {

              const batch = list.slice(i, i + BATCH_SIZE);
              const batchPromises = batch.map(signature =>
                  delay(10).then(async () =>
                  rotateRPC().getParsedTransaction(signature, { commitment: 'finalized', maxSupportedTransactionVersion : 0})
                      .catch(error => {
                      console.log(error);
                      return null;
                      })
                  )
              );

              const results = await Promise.all(batchPromises);
              for (const transactionDetails of results) {
                  if (transactionDetails) {
                      for (const instruction of transactionDetails.transaction.message.instructions) {
                          if (instruction.programId.toBase58() === SystemProgram.programId.toBase58() && wallet.includes(instruction.parsed.info.source)) {
                          if (instruction.parsed && instruction.parsed.type === 'transfer') {
                              const transferAmount = instruction.parsed.info.lamports / LAMPORTS_PER_SOL;
                              const deci = countDecimals(transferAmount)
                            if (transferAmount >= min_amount && transferAmount <= max_amount && deci <= decimaler) {
                              const time = getFormattedDate(transactionDetails.blockTime)
                              confirmedTransactionList.push({"wallet": instruction.parsed.info.destination, "amount": transferAmount, "time": time, "dex": dex});
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

            let signatures = []
            let lastSignature = ''
            let response;
            for (let i = 1; i <= loops; i++){
              if (i > 1) {

                response = await rotateRPC().getConfirmedSignaturesForAddress2(getPublickey(wallet), { before: lastSignature });
              } else {
                response = await rotateRPC().getConfirmedSignaturesForAddress2(getPublickey(wallet));
              }

              if (response && response.length > 0) {
                signatures = signatures.concat(response);
                console.log(signatures)
                console.log(response[response.length - 1])
                lastSignature = response[response.length - 1].signature;

              } else {
                console.log("No transactions found in loop: ", i);
              } 
              let statusCompleted = (i / loops) * 100;
              setProcessSnipe(prevProcess => prevProcess.map((step, idx) => ({
                ...step,
                completed: idx === 0 ? statusCompleted : step.completed
              })));              

            }
            console.log("signatures amount:", signatures.length)
            signatures = signatures.map(signature => signature.signature);
            return signatures
          }        
        
          async function getTransactions(wallet) {
              let listTransactions = []

              let signature = await rotateRPC().getSignaturesForAddress(getPublickey(wallet), { limit: 1000, commitment: "finalized" });
              if (signature.length > 0) {
                  try {
                      listTransactions = signature.map(signature => signature.signature);
                  } catch (error) {
                      console.log("signatures list failed ", error)
                  }
              }
              return listTransactions
          }

          function getPublickey(wallet) {
          const publicKeyGet = new web3.PublicKey(wallet);
          return publicKeyGet
          }

          function createRPCRotator() {
          const RPCs = [
              import.meta.env.VITE_RPC_3, import.meta.env.VITE_RPC_4
          ];
          return function () {
              RPCs.push(RPCs.shift())
              return new web3.Connection(RPCs[0], 'confirmed');
          }

        }
        
        function getFormattedDate(timestamp) {
          var a = new Date(timestamp * 1000);
          var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
          var year = a.getFullYear();
          var month = months[a.getMonth()];
          var date = a.getDate();
          var hour = String(a.getHours()).padStart(2, '0');
          var min = String(a.getMinutes()).padStart(2, '0');
          var sec = String(a.getSeconds()).padStart(2, '0');
          var time = hour + ':' + min + ':' + sec + ' - ' + date + ' ' + month + ' ' + year;
          return time;
        }
          
          function delay(ms) {
          return new Promise(resolve => setTimeout(resolve, ms));
          }
          
          function countDecimals(value) {
              if (Math.floor(value) === value) return 0;

              let valueAsString = value.toString();
              if (valueAsString.includes(',')) {
                  valueAsString = valueAsString.replace(',', '.');
              }
              
              if (valueAsString.includes('.')) {
                  return valueAsString.split('.')[1].length;
              }
              
              return 0;
          }    

      }

      function removeDuplicates(array) {
        const uniqueObjects = new Set();
        return array.filter(item => {
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
      console.log(processStepOne , "/", signatureAmount)
      let statusCompleted = (processStepOne / signatureAmount) * 100; // Note: i+1 to reflect the current step
      setProcessSnipe(prevProcess => prevProcess.map((step, idx) => ({
        ...step,
        completed: idx === 1 ? statusCompleted : step.completed
      })));    
    },[processStepOne])


    useEffect(() => {
      
      console.log({ 'minValue': minValueProp, 'maxValue': maxValueProp, 'decimaler': decimalerProp, 'transactionsAmount': transactionsAmountProp, 'maxTransactionsInWallet': maxTransactionsInWalletProp, 'dexChoiceProp': dexChoiceProp, "triggerAction": triggerAction, "allDex": allDex, "allDexArr": allDexArr})
      setMinValue(minValueProp)
      setMaxValue(maxValueProp)
      setDecimaler(decimalerProp)
      setTransactionsAmount(transactionsAmountProp)
      setWallet(dexChoiceProp)
      setMaxTransactionsInWallet(maxTransactionsInWalletProp)
      setAllDexBool(allDex)
      setAllDexBoolFetch(allDexArr)
      setButtonClickCounter(prev => prev + 1)
      setTriggerActionProp(triggerAction);
    }, [triggerAction])
  
    useEffect(() => {
      setAlertSoundToggle(alertSound);

    }, [alertSound]);
  
  useEffect(() => {

    if (logs.length > prevLogsLengthRef.current) {
      if (alertSoundToggle && listening) {
        playAudio();
      }
    }

    prevLogsLengthRef.current = logs.length;
  }, [logs]);

  useEffect(() => {
    setListeing(false)
    stopScan()
    setTriggerActionProp(0)
  },[listenerMode])
  
  const startScan = async (wallets) => {
    const websockets = wallets.map((wallet, index) => {
      const websocket = new WebSocket(
        "wss://mainnet.helius-rpc.com/?api-key=4bf6803d-1fc0-4157-9f60-904fc8a1765e"
      );

      websocket.onopen = () => {
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
      };

      websocket.onmessage = async (event) => {
        console.log("event: ", event);
        const response = JSON.parse(event.data);
        if (response.method === "logsNotification") {
          console.log("Signature: ", response);
          let result = await snipareListener(
            minValue,
            maxValue,
            decimaler,
            maxTransactionsInWallet,
            response.params.result.value.signature,
            [wallet]
          );
          console.log("Logs: ", result);
          if (parseFloat(amountInclude) > 0) {
            result = result.filter((obj) =>
              containsSubstring(obj.amount.toString(), amountInclude.toString())
            );
          }
          setLogs((prevLogs) => [...result, ...prevLogs]);
        }
      };

      function containsSubstring(amount, search) {
        return amount.includes(search);
      };

      websocket.onclose = () => {
        console.log(`WebSocket connection closed for wallet ${wallet}`);
      };

      return websocket;
    });

    setWs(websockets);

    
  };

  const stopScan = () => {
    setListeing(false);
    if (ws) {
      ws.forEach((websocket) => websocket.close());
      setWs(null);
    }
  };

  const clearScan = () => {
    setLogs([])
  }; 


  
  
    async function snipareListener(
      minValueNew,
      maxValueNew,
      decimalerNew,
      maxTransactionsInWalletNew,
      signature,
      wallets
    ) {
      const rotateRPC = createRPCRotator();

      let signatureValue = [];
      console.log("Startar - Wallets:  ", wallets, " - ", "Signature: ", signature)
      signatureValue = await getSignatureValueListener(
        wallets,
        signature,
        minValueNew,
        maxValueNew,
        decimalerNew,
        null
      );

      console.log("signatureValue: ", signatureValue);

      if (signatureValue.length > 0) {
        console.log("Inne1")
        setSignatureAmount(signatureValue.length);
        const result = await getWalletTransactions(signatureValue[0].wallet);
        console.log("Inne1: ", result);
        if (result.length <= maxTransactionsInWalletNew) {
        console.log("Inne2: ", signatureValue[0]);
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

      async function getSignatureValue(
        wallet,
        list,
        min_amount,
        max_amount,
        decimaler,
        dex
      ) {
        let confirmedTransactionList = [];
        let id = 1;
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
                        deci <= decimaler
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

      async function getSignatureValueListener(
        wallet,
        signature,
        min_amount,
        max_amount,
        decimaler,
        dex
      ) {
        let confirmedTransactionList = [];
        try {

          let transactionDetails = null;
          let retries = 3;

          for (let attempt = 0; attempt < retries; attempt++) {
            try {
              transactionDetails = await rotateRPC().getParsedTransaction(signature, {
                commitment: "confirmed",
                maxSupportedTransactionVersion: 0,
              });

              if (transactionDetails !== null) {
                break; // Exit loop if transactionDetails is successfully fetched
              }
            } catch (error) {
              if (attempt === retries - 1) {
                throw error; // Throw error if this was the last attempt
              }
            }

            // Optionally, you can add a delay between retries
            await new Promise((resolve) => setTimeout(resolve, 1000)); // 1-second delay
          }

          if (transactionDetails === null) {
            throw new Error("Failed to fetch transaction details after 3 attempts");
          }


          console.log("TransactionsDetails: ", transactionDetails)
          if (transactionDetails) {
            for (const instruction of transactionDetails.transaction.message
              .instructions) {
              if (
                instruction.programId.toBase58() ===
                  SystemProgram.programId.toBase58() &&
                wallet.includes(instruction.parsed.info.source)
              ) {
                console.log("Här1")
                if (
                  instruction.parsed &&
                  instruction.parsed.type === "transfer"
                ) {
                  console.log("Här2");
                  const transferAmount =
                    instruction.parsed.info.lamports / LAMPORTS_PER_SOL;
                  const deci = countDecimals(transferAmount);
                  if (
                    transferAmount >= min_amount &&
                    transferAmount <= max_amount &&
                    deci <= decimaler
                  ) {
                  console.log("Här3");
                    const time = getFormattedDate(
                      transactionDetails.blockTime
                    );
                    confirmedTransactionList.push({
                      wallet: instruction.parsed.info.destination,
                      amount: transferAmount,
                      time: time,
                      dex: instruction.parsed.info.source,
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

      async function getTransactionsNew(wallet, loops) {
        let signatures = [];
        let lastSignature = "";
        let response;
        for (let i = 1; i <= loops; i++) {
          if (i > 1) {
            response = await rotateRPC().getConfirmedSignaturesForAddress2(
              getPublickey(wallet),
              { before: lastSignature }
            );
          } else {
            response = await rotateRPC().getConfirmedSignaturesForAddress2(
              getPublickey(wallet)
            );
          }

          if (response && response.length > 0) {
            signatures = signatures.concat(response);
            console.log(signatures);
            console.log(response[response.length - 1]);
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
        const RPCs = [import.meta.env.VITE_RPC_3, import.meta.env.VITE_RPC_4];
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

    function playAudio() {
      const audio = new Audio("/alert-2354.mp3");

      audio.addEventListener("ended", () => {
      });

      audio.play().catch((error) => {
        console.error("Error playing audio:", error);
      });
    }
  
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
          {listening ? (
            <>
              <div style={{marginBottom: "10px", display: "flex", justifyContent: "center"}}>
                <button onClick={stopScan}>Stop</button>
                <button onClick={clearScan}>Clear</button>
              </div>
            </>
          ) : (
            <></>
          )}
          {logs.map((obj, index) => (
            <section key={index} style={{ borderBottom: "2px solid #000" }}>
              <h5>{obj.time}</h5>
              {obj.dex !== null ? <p>Dex: {obj.dex}</p> : <></>}
              <p>
                Wallet:{" "}
                <a
                  href={
                    "https://solscan.io/account/" + obj.wallet + "#solTransfers"
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

