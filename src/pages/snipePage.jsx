import { useParams } from 'react-router-dom';
import { useEffect, useState, useRef, useContext } from 'react';
import { GlobalContext } from '../components/GlobalContext.jsx';
import Snipe from '../components/snipe.jsx'
import { csvParse } from 'd3-dsv';
import { SavedContext } from "../components/SavedWalletContext.jsx";

export default function snipeCreator() {
  
  const [minValue, setMinValue] = useState(() => localStorage.getItem('minValue') || '60')
  const [maxValue, setMaxValue] = useState(() => localStorage.getItem('maxValue') || '80')
  const [decimaler, setDecimaler] = useState(() => localStorage.getItem('decimaler') || '50')
  const [maxTransactionsInWallet, setMaxTransactionsInWallet] = useState(() => localStorage.getItem('maxTransactionsInWallet') || '10')
  const [dexChoice, setDexChoice] = useState('5tzFkiKscXHK5ZXCGbXZxdw7gTjjD1mBwuoFbhUvuAi9');
  const [csvData, setCsvData] = useState([])
  const { savedWallets, defaultWallets } = useContext(SavedContext)
  const[allDex, setAllDex] = useState(false)

  const [triggerCount, setTriggerCount] = useState(0);

  useEffect(() => {
    
    fetch('./src/assets/dex.csv')
      .then(response => response.text())
      .then(csvText => {
        let parsedData = csvParse(csvText, d => ({
          name: d.dex.trim(),
          address: d.address.trim()
        }));
        console.log(savedWallets)
        parsedData = parsedData.concat(savedWallets)

        console.log(parsedData)
        setCsvData(parsedData);
      })
      .catch(error => console.error('Error reading the CSV file:', error));
  }, []);


  useEffect(() => {
    localStorage.setItem('minValue', minValue);
    localStorage.setItem('maxValue', maxValue);
    localStorage.setItem('decimaler', decimaler);
    localStorage.setItem('maxTransactionsInWallet', maxTransactionsInWallet);
  }, [minValue, maxValue, decimaler, maxTransactionsInWallet])

  const changeMinValue = (e) => {
    setMinValue(Number(e.target.value));
  }
  const changeMaxValue = (e) => {
    setMaxValue(Number(e.target.value)); 
  }

  const changeDecimaler = (e) => {
    setDecimaler(Number(e.target.value));  
  }

  const changeMaxTransaction = (e) => {
    setMaxTransactionsInWallet(Number(e.target.value)); 
  }

  const handleChangeDex = (e) => {
    const trimmedValue = e.target.value.trim();
    setDexChoice(trimmedValue);
  }


  const handleSnipeTrigger = () => {
    setAllDex(false)
    setTriggerCount(prev => prev + 1); 
  } 
  const handleSnipeTriggerAll = () => {  
    setAllDex(true)  
    setTriggerCount(prev => prev + 1); 
  } 

  return (
    <>
      <div id="main-pump">
        <div id="first-pump">
          <h1>Snipe Creator</h1>
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
            <h4>Max transactions in wallet</h4>
            <input type="number" value={maxTransactionsInWallet} onChange={changeMaxTransaction} />
          </div>       
          <div>
            <h4>Select DEX</h4>
            <select value={dexChoice} onChange={handleChangeDex}>
              {csvData.map((option, index) => (
                <option key={index} value={option.address}>{option.name}</option>
              ))}
            </select>
          </div>           
          <button onClick={handleSnipeTrigger}>Search for wallets</button>
          <button onClick={handleSnipeTriggerAll}>Search for wallet on all</button>
        </div>
        <div id="seconds-pump">
          <Snipe minValueProp={minValue} maxValueProp={maxValue} decimalerProp={decimaler} maxTransactionsInWalletProp={maxTransactionsInWallet} dexChoiceProp={dexChoice} triggerAction={triggerCount} allDex={allDex} allDexArr={csvData} />
        </div>
      </div>
    </>
  );
}