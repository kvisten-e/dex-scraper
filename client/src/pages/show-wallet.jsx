import { useParams } from 'react-router-dom';
import { useEffect, useState, useRef, useContext } from 'react';
import { GlobalContext } from '../components/GlobalContext.jsx';
import PresentResult from '../components/PresentResult.jsx';


function ShowWallet() {
  const { address } = useParams();
  const getParams = new URLSearchParams(document.location.search);
  const { process, setProcess } = useContext(GlobalContext)
  const { wallet, setWallet } = useContext(GlobalContext)
  const { params, setParams } = useContext(GlobalContext)
  const { signal, setSignal } = useContext(GlobalContext)
  const {stepStatus} = useContext(GlobalContext)

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;
    setSignal(signal)

    const paramsData = [
      { "total_tx": getParams.get("total_tx") },
      { "min_tx_value": getParams.get("min_tx_value") },
      { "min_eq_tx": getParams.get("min_eq_tx") },
      { "min_eq_value_tx": getParams.get("min_eq_value_tx") },
      { "total_min_tx": getParams.get("total_min_tx") },
    ];

    setProcess([
      { step: "Get transactions", completed: 0 },
      { step: "Find all spl-transfer of SOL", completed: 0 },
      { step: "Find wallets that have distributed sol ", completed: 0 }
    ])

    setParams(paramsData)
    setWallet(address)


    return () => {
      console.log("Avbruten")
      controller.abort();
    };
  }, []);

console.log("Process: ", process)

  return (
    <>
      <div className="show-wallet-main">
        <div className="show-wallet-header">
          <div className="show-wallet-address">
            <h3>Address:</h3>
            <h3>{wallet}</h3>
          </div>
          <div className="show-wallet-transactions">
            <h3>Transactions:</h3>
            <h3>1-{getParams.get("total_tx")}</h3>
          </div>
          <div className="show-process">
            <h3>Process:</h3>
            {process.map((key, index) => (
              <div key={index}>
                <p>{key.step}: {key.completed}</p>
              </div>
            ))}
          </div>          
        </div>
        <div className="found-wallets">
          <h3>Antal hittade wallets: </h3>
        </div>
        <div className="data-skeleton-loader">
          {<PresentResult />}
        </div>
      </div>
    </>
  );
}

export default ShowWallet;
