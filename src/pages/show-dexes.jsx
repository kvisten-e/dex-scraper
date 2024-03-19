import { useParams } from 'react-router-dom';
import { useEffect, useState, useRef, useContext } from 'react';
import { GlobalContext } from '../components/GlobalContext.jsx';
import PresentResult from '../components/PresentResult.jsx';
import ProgressBar from 'react-bootstrap/ProgressBar';
import { SavedContext } from '../components/SavedWalletContext.jsx';




export default function ShowDexes() {
  const getParams = new URLSearchParams(document.location.search);
  const { process, setProcess } = useContext(GlobalContext)
  const { defaultWallets } = useContext(SavedContext)
  const { setParams } = useContext(GlobalContext)
  const { setSignal } = useContext(GlobalContext)
  const [status, setStatus] = useState("")
  const [wallets, setWallets] = useState([])
  const { switchButton, setSwitchButton } = useContext(GlobalContext)
  const [totalTransactions, setTotalTransactions] = useState(0)


  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;
    setSignal(signal)

    const paramsDataCT = [
      { "total_tx": getParams.get("total_tx") },
      { "min_tx_value": getParams.get("min_tx_value") },
      { "max_tx_value": getParams.get("max_tx_value") },
      { "min_eq_tx": getParams.get("min_eq_tx") },
      { "tot_tra_wallet": getParams.get("tot_tra_wallet") },      
      { "min_eq_value_tx": getParams.get("min_eq_value_tx") },
      { "total_min_tx": getParams.get("total_min_tx") },
    ];

    setTotalTransactions(getParams.get("total_wallet_tx"))

    const paramsDataTS = [
      { "total_tx": getParams.get("total_tx") },
      { "min_tx_value": getParams.get("min_tx_value") },
      { "max_tx_value": getParams.get("max_tx_value") },
      { "max_dec_value": getParams.get("max_dec_value") },
      { "total_wallet_tx": getParams.get("total_wallet_tx") },
      { "procent_sent_sol": getParams.get("procent_sent_sol") },
    ];

    setProcess([
      { step: "1. Get transactions", completed: 0 },
      { step: "2. Find all spl-transfer of SOL", completed: 0 },
      { step: `3. Sort out wallets with more than ${getParams.get("tot_tra_wallet") } transactions`, completed: 0 },
      { step: "4. Get wallets that have distributed SOL ", completed: 0 }
    ])


    let arrayWallets = defaultWallets.map(obj => {
      return obj.address.trim()
    })

    if (!switchButton.checked) {
      setParams(paramsDataCT)
    } else {
      setParams(paramsDataTS)
    }
    setWallets(arrayWallets)

    return () => {
      console.log("Avbruten")
      controller.abort();
    };
  }, [defaultWallets]);

  useEffect(() => {
    const allCompleted = process.every(obj => obj.completed === 100);
    setStatus(allCompleted ? "Completed" : "Ongoing");
  }, [process]); 


  return (
    <>
      <div className="show-wallet-main">
        <div className="show-wallet-header">
          <div className="show-wallet-address">
            <h3>Address:</h3>
            <div className='d-flex gap-2 align-items-end justify-content-center flex-wrap' style={{height: "100%", fontSize:"140%", fontWeight: "bold"}} >
              {defaultWallets.map(obj => <p>{obj.name}, </p>)}
            </div>
          </div>
          <div className="show-wallet-transactions">
            <h3>Transactions:</h3>
            <h3>1-{Number(getParams.get("total_tx")) * wallets.length} ({getParams.get("total_tx")} on each dex)</h3>
          </div>
          <div className="show-process">
            <div className='status-text'>
              <h3>Progress: </h3>
              {status === 'Completed' ?
                <h3 style={{ color: 'rgba(14, 248, 41, 0.87)' }}>{status}</h3> :
                <h3 style={{ color: 'rgba(255, 255, 255, 0.87)' }}>{status}</h3>
              }
            </div>
            <div className='show-process-bars'>
              {process.map((key, index) => (
                <div key={index} className='key'>
                  <p>{key.step}</p>
                  <ProgressBar animated now={key.completed} max={100} variant='success' />
                </div>
              ))}
            </div>

          </div>          
        </div>
        <div className="data-skeleton-loader">
          {<PresentResult wallet={wallets}/>}
        </div>
      </div>
    </>
  );
}

