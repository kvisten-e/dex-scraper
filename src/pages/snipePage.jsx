import { useParams } from 'react-router-dom';
import { useEffect, useState, useRef, useContext } from 'react';
import { GlobalContext } from '../components/GlobalContext.jsx';
import Snipe from '../components/snipe.jsx'
import { csvParse } from 'd3-dsv';
import { SavedContext } from "../components/SavedWalletContext.jsx";
import ProgressBar from 'react-bootstrap/ProgressBar';


export default function snipeCreator() {
  
  const [minValue, setMinValue] = useState(() => localStorage.getItem('minValue') || '60')
  const [maxValue, setMaxValue] = useState(() => localStorage.getItem('maxValue') || '80')
  const [decimaler, setDecimaler] = useState(() => localStorage.getItem('decimaler') || '50')
  const [amountInclude, setAmountInclude] = useState();
  const [inputWallet, setInputWallet] = useState('')
  const [transactionsAmount, settransactionsAmount] = useState(() => localStorage.getItem('transactionsAmount') || '1000')
  const [maxTransactionsInWallet, setMaxTransactionsInWallet] = useState(() => localStorage.getItem('maxTransactionsInWallet') || '10')
  const [dexChoice, setDexChoice] = useState('5tzFkiKscXHK5ZXCGbXZxdw7gTjjD1mBwuoFbhUvuAi9');
  const [csvData, setCsvData] = useState([])
  const { savedWallets, defaultWallets } = useContext(SavedContext)
  const [allDex, setAllDex] = useState(false)
  const { processSnipe, setProcessSnipe } = useContext(GlobalContext)
  const [listenerMode, setListenerMode] = useState(false);
  const [alertSound, setAlertSound] = useState(true)
  const [telegramToggle, setTelegramToggle] = useState(false)
  const [telegramUsername, setTelegramUsername] = useState(() => localStorage.getItem('telegramUsername') || '')
  const [telegramUsernameIds, setTelegramUsernameIds] = useState([])
  const [telegramLoading, setTelegramLoading] = useState(false)
  const [telegramData, setTelegramData] = useState([])
  const [telegramUsers, setTelegramUsers] = useState([])
  const fetchInitiated = useRef(false);
  const [listening, setListeing] = useState(false);
  const [stopScanToggle, setStopScanToggle] = useState(false)
  const [clearToggle, setClearToggle] = useState(0);
  const [maxTransactionsToggle, setMaxTransactionsToggle] = useState(true)
  const [decimalsType, setDecimalsType] = useState(() => localStorage.getItem('decimalType') || 'Max')

const decimalsTypeArr = [
  { address: "Max", name: "Max" },
  { address: "Min", name: "Min" },
  { address: "Strict", name: "Strict" },
];

  useEffect(() => {
    fetch("http://127.0.0.1:3000/data")
      .then((response) => response.json())
      .then((data) => setTelegramData(data))
      .catch((error) => console.error("Error fetching data:", error));
  }, [telegramUsername]);


  const [triggerCount, setTriggerCount] = useState(0);

  const amounts = [1000,2000,3000,4000,5000,6000,7000,8000,9000,10000,20000,30000,40000,50000,60000,70000,80000,90000,100000]

  useEffect(() => {

    setProcessSnipe([
      { step: "1. Get transactions from wallet/dex", completed: 0 },
      { step: "2. Find eligible transactions", completed: 0 },
    ])
    
    fetch('./src/assets/dex.csv')
      .then(response => response.text())
      .then(csvText => {
        let parsedData = csvParse(csvText, d => ({
          name: d.dex.trim(),
          address: d.address.trim()
        }));
        if (savedWallets.length > 0) {
          parsedData = parsedData.concat(savedWallets)          
        }
        setCsvData(parsedData);
      })
      .catch(error => console.error('Error reading the CSV file:', error));
  }, []);

  useEffect(() => {
    localStorage.setItem('minValue', minValue);
    localStorage.setItem('maxValue', maxValue);
    localStorage.setItem('decimaler', decimaler);
    localStorage.setItem("telegramUsername", telegramUsername);
    localStorage.setItem('transactionsAmount', transactionsAmount);
    localStorage.setItem('maxTransactionsInWallet', maxTransactionsInWallet);
    localStorage.setItem("decimalType", decimalsType);
  }, [minValue, maxValue, decimaler, transactionsAmount, maxTransactionsInWallet, telegramUsername, decimalsType])


  useEffect(() => {

    async function fetchTelegramData() {
      try {
        const arr = telegramUsername.split(" ")
        const length = arr.length
        const tempArrIds = []
        console.log("arr: ", arr);
        console.log("length: ", length)
        console.log("tempArrIds", tempArrIds);
          for (let eachUsername of arr) {
          const matchedUpdate = telegramData.find(
            (update) => update.username === eachUsername.toLowerCase()
          );
          console.log(matchedUpdate);
            if (matchedUpdate) {
              tempArrIds.push(matchedUpdate.userID);
            // setTelegramUsernameId(...telegramUsernameId, matchedUpdate.userID);
          }
        }
        if (tempArrIds.length === length) {
          setTelegramUsernameIds(tempArrIds);
        } else {
          setTelegramUsernameIds([])
        }

      } catch (error) {
        console.log("Error: ", error)
        setTelegramUsernameIds([]);
      }
      setTelegramLoading(false);
    }
    if (telegramToggle) {
      console.log("telegramData: ", telegramData);
      setTelegramLoading(true);
      fetchTelegramData();
    }
  }, [telegramUsername, telegramToggle]);



  const handleCheckboxChange = (event) => {
    setListenerMode(event.target.checked);
  };

  const handleChangeAlertSound = (event) => {
    setAlertSound(event.target.checked);
  };

  const handleChangeMaxTransactionToggle = (event) => {
    setMaxTransactionsToggle(event.target.checked);
  };

  const handleTelegram = (event) => {
    setTelegramToggle(event.target.checked);
  };

  const changeMinValue = (e) => {
    setMinValue(Number(e.target.value));
  }
  const changeMaxValue = (e) => {
    setMaxValue(Number(e.target.value)); 
  }

  const changeDecimaler = (e) => {
    setDecimaler(Number(e.target.value));  
  }

  const changeAmountInclude= (e) => {
    setAmountInclude(e.target.value);
  };

  const changeMaxTransaction = (e) => {
    setMaxTransactionsInWallet(Number(e.target.value)); 
  }

  const stopScan = () => {
    setStopScanToggle(true)
    setListeing(false)
  };

  const clearScan = () => {
    setClearToggle((prev) => prev + 1); 
  };

  const handleChangeDex = (e) => {
    const trimmedValue = e.target.value.trim();
    setDexChoice(trimmedValue);
  }
  const handleChangedecimalsType = (e) => {
     setDecimalsType(e.target.value.trim());
   }; 


  const checkAddress = (valueButton) => {
    const base58Chars = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
    let wallet = valueButton

    const walletLength = 44
    if (wallet.length !== walletLength) {
      return true;
    }
    for (let i = 0; i < wallet.length; i++) {
      if (!base58Chars.includes(wallet[i])) {
        return true;
      }
    }
    return false
  }  

  const handleChangeAmount = (e) => {
    const trimmedValue = e.target.value.trim();
    settransactionsAmount(trimmedValue);
  }  

  const handleSnipeTrigger = () => {
    if (telegramToggle && telegramUsernameIds.length === 0 || telegramLoading === true) {
      return
    } else {
      setStopScanToggle(false)
      setListeing(true)
    }

    if (inputWallet === '') {
      setAllDex(false)
      setTriggerCount(prev => prev + 1);  
      return  
    } else {
      if (!checkAddress(inputWallet)) {
        console.log("Confirmed wallet")
        console.log("inputWallet: ", inputWallet)
        setDexChoice(inputWallet)
        setAllDex(false)
        setTriggerCount(prev => prev + 1);         
      } else {
        console.log("Wrong wallet")
      }      
    }
  } 

  const handleSnipeTriggerAll = () => {  
    if (telegramToggle && telegramUsernameIds.length === 0 && telegramLoading === true) {
      return
    } else {
      setStopScanToggle(false);
      setListeing(true)      
    }

    setAllDex(true)  
    setTriggerCount(prev => prev + 1); 
  }
  
  function findNameByAddress(address) {
    const mergedArrays = defaultWallets.concat(savedWallets);
    for (let item of mergedArrays) {
      if (item.address.trim() === address.trim()) {
        return item.name;
      }
    }
    return address;
  }

  return (
    <>
      <div id="main-pump">
        <div id="first-pump">
          <h1>Snipe Creator</h1>
          <label style={{ width: "60%", borderBottom: "2px solid black" }}>
            <h4>Listener Mode</h4>
            <input
              type="checkbox"
              checked={listenerMode}
              onChange={handleCheckboxChange}
              style={{ width: "20px", height: "20px" }}
            />
          </label>
          <div>
            <h4>Min value</h4>
            <input type="number" value={minValue} onChange={changeMinValue} />
          </div>
          <div>
            <h4>Max value</h4>
            <input type="number" value={maxValue} onChange={changeMaxValue} />
          </div>
          <div>
            <h4>SOL decimals</h4>
            <input type="number" value={decimaler} onChange={changeDecimaler} />
            <select value={decimalsType} onChange={handleChangedecimalsType}>
              {decimalsTypeArr.map((option, index) => (
                <option key={index} value={option.address}>
                  {option.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <h4>Amount include (example: .03)</h4>
            <input
              type="text"
              value={amountInclude}
              onChange={changeAmountInclude}
            />
          </div>
          <div>
            <h4>Max transactions in wallet</h4>
            <input
              type="checkbox"
              checked={maxTransactionsToggle}
              onChange={handleChangeMaxTransactionToggle}
              style={{ width: "20px", height: "20px" }}
            />
            {maxTransactionsToggle ? (
              <input
                type="number"
                value={maxTransactionsInWallet}
                onChange={changeMaxTransaction}
              />
            ) : (
              <></>
            )}
          </div>
          <div>
            <h4>Select DEX</h4>
            <select value={dexChoice} onChange={handleChangeDex}>
              {csvData.map((option, index) => (
                <option key={index} value={option.address}>
                  {option.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <input
              type="search"
              id="walletAddy"
              value={inputWallet}
              placeholder="Input a wallet address"
              onChange={(e) => setInputWallet(e.target.value)}
            />
          </div>
          {!listenerMode ? (
            <div>
              <div>
                <h4>Select total transactions</h4>
                <select
                  value={transactionsAmount}
                  onChange={handleChangeAmount}
                >
                  {amounts.map((amount, index) => (
                    <option key={index} value={amount}>
                      {amount}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginTop: "20px" }}>
                <button onClick={handleSnipeTrigger}>Search for wallets</button>
                <button onClick={handleSnipeTriggerAll}>
                  Search for wallet on all
                </button>
              </div>

              <div className="show-process-bars">
                {processSnipe.map((key, index) => (
                  <div key={index} className="key">
                    <p>{key.step}</p>
                    <ProgressBar
                      animated
                      now={key.completed}
                      max={100}
                      variant="success"
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <label style={{ marginTop: "20px" }}>
                  <h4>Alert sound</h4>
                  <input
                    type="checkbox"
                    checked={alertSound}
                    onChange={handleChangeAlertSound}
                    style={{ width: "20px", height: "20px" }}
                  />
                </label>
                <label style={{ marginTop: "20px" }}>
                  <h4>Telegram Messages</h4>
                  <input
                    type="checkbox"
                    checked={telegramToggle}
                    onChange={handleTelegram}
                    style={{ width: "20px", height: "20px" }}
                  />
                </label>
                {telegramToggle ? (
                  <div style={{ display: "flex" }}>
                    <input
                      type="search"
                      id="telegramUserame"
                      value={telegramUsername}
                      placeholder="Telegram username"
                      onChange={(e) => setTelegramUsername(e.target.value)}
                    />
                    <span className="status-icon">
                      {telegramLoading === false &&
                        telegramUsernameIds.length === 0 &&
                        telegramUsername === "" && <></>}
                      {telegramLoading === true && (
                        <div className="loader"></div>
                      )}
                      {telegramLoading === false &&
                        telegramUsernameIds.length !== 0 && (
                          <span className="checkmark">✔️</span>
                        )}
                      {telegramLoading === false &&
                        telegramUsernameIds.length === 0 &&
                        telegramUsername !== "" && (
                          <span className="crossmark">❌</span>
                        )}
                    </span>
                  </div>
                ) : (
                  <></>
                )}
              </div>
              <div style={{ marginTop: "20px" }}>
                <button onClick={handleSnipeTrigger}>
                  Listen on {findNameByAddress(dexChoice)}
                </button>
                <button onClick={handleSnipeTriggerAll}>
                  Listen on all dexes
                </button>
              </div>
              {listening ? (
                <>
                  <div
                    style={{
                      marginBottom: "10px",
                      display: "flex",
                      justifyContent: "center",
                    }}
                  >
                    <button onClick={stopScan}>Stop</button>
                    <button onClick={clearScan}>Clear</button>
                  </div>
                </>
              ) : null}
            </>
          )}
        </div>
        <div id="seconds-pump">
          <Snipe
            minValueProp={minValue}
            maxValueProp={maxValue}
            decimalerProp={decimaler}
            transactionsAmountProp={transactionsAmount}
            maxTransactionsInWalletProp={maxTransactionsInWallet}
            maxTransactionsToggle={maxTransactionsToggle}
            dexChoiceProp={dexChoice}
            triggerAction={triggerCount}
            allDex={allDex}
            allDexArr={csvData}
            listenerMode={listenerMode}
            amountInclude={amountInclude}
            alertSound={alertSound}
            telegramUsernameId={telegramUsernameIds}
            telegramToggle={telegramToggle}
            listening={listening}
            stopScanToggle={stopScanToggle}
            clearToggle={clearToggle}
            decimalsTypeProp={decimalsType}
          />
        </div>
      </div>
    </>
  );
}

