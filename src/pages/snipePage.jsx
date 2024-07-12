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
  const [telegramUsernameId, setTelegramUsernameId] = useState('')
  const [telegramLoading, setTelegramLoading] = useState(false)
  const [telegramData, setTelegramData] = useState([])
  const fetchInitiated = useRef(false);
  

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
  }, [minValue, maxValue, decimaler, transactionsAmount, maxTransactionsInWallet, telegramUsername])

  useEffect(() => {
    async function fetchTelegramData() {
      const response = await fetch(
        `https://api.telegram.org/bot${
          import.meta.env.VITE_TELEGRAM_BOT
        }/getUpdates`
      );
      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      setTelegramData(data.result);
    }

    if (!fetchInitiated.current) {
      fetchInitiated.current = true;
      fetchTelegramData();
    }
  }, []);

  useEffect(() => {
    async function fetchTelegramData() {
      try {
        const matchedUpdate = telegramData.find(
          (update) =>
            update.message.from.username ===
            telegramUsername.toLowerCase()
        );
        if (matchedUpdate) {
          setTelegramUsernameId(matchedUpdate.message.from.id);
        } else {
          setTelegramUsernameId("");
        }
      } catch (error) {
        console.log("Error: ", error)
        setTelegramUsernameId("");
      }
      setTelegramLoading(false);
    }
    if (telegramToggle) {
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

  const handleChangeDex = (e) => {
    const trimmedValue = e.target.value.trim();
    setDexChoice(trimmedValue);
  }


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
    if (telegramToggle && telegramUsernameId === '' || telegramLoading === true) {

      return
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
    if (telegramToggle && telegramUsernameId === "" && telegramLoading === true) {
      return
    }

    setAllDex(true)  
    setTriggerCount(prev => prev + 1); 
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
              type="number"
              value={maxTransactionsInWallet}
              onChange={changeMaxTransaction}
            />
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
                        telegramUsernameId === "" &&
                        telegramUsername === "" && <></>}
                      {telegramLoading === true && (
                        <div className="loader"></div>
                      )}
                      {telegramLoading === false &&
                        telegramUsernameId !== "" && (
                          <span className="checkmark">✔️</span>
                        )}
                      {telegramLoading === false &&
                        telegramUsernameId === "" &&
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
                <button onClick={handleSnipeTrigger}>Listen on wallet</button>
                <button onClick={handleSnipeTriggerAll}>
                  Listen on all wallets
                </button>
              </div>
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
            dexChoiceProp={dexChoice}
            triggerAction={triggerCount}
            allDex={allDex}
            allDexArr={csvData}
            listenerMode={listenerMode}
            amountInclude={amountInclude}
            alertSound={alertSound}
            telegramUsernameId={telegramUsernameId}
            telegramToggle={telegramToggle}
          />
        </div>
      </div>
    </>
  );
}


