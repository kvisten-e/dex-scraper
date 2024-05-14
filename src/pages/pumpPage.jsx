import { useParams } from 'react-router-dom';
import { useEffect, useState, useRef, useContext } from 'react';
import { GlobalContext } from '../components/GlobalContext.jsx';
import Pump from '../components/pump.jsx'

export default function pumpTokens() {
  
  const [seconds, setSeconds] = useState(900)
  const [triggerPump, setTriggerPump] = useState(0);

  const changeSeconds = (e) => {
    setSeconds(e.target.value)
  }
  const handlePumpTrigger = () => {
    setTriggerPump(prev => prev + 1); 
  };  

  return (
    <>
      <div id="main-pump">
        <div id="first-pump">
          <h1>Pump tokens</h1>
          <div>
            <h3>Seconds to reach Raydium</h3>
            <input type="number" value={seconds} onChange={changeSeconds} />
          </div>
          <button onClick={handlePumpTrigger}>Search for tokens</button>
        </div>
        <div id="seconds-pump">
          <Pump seconds={seconds} triggerAction={triggerPump} />
        </div>
      </div>
    </>
  );
}