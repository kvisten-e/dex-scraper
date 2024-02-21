import { useParams } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { main, stepCompleted } from '../components/fetchDataWallet.js';
import PresentData from '../components/presentData.jsx';
import Skeleton from 'react-loading-skeleton';

function ShowWallet() {
  const { address } = useParams();
  const getParams = new URLSearchParams(document.location.search);
  const [data, setDataChain] = useState(null);
  const [stepCompletedarr, setStepCompletedarr] = useState([]);
  const [loading, setLoading] = useState(true); 
  const isMountedRef = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    const paramsData = [
      { "total_tx": getParams.get("total_tx") },
      { "min_tx_value": getParams.get("min_tx_value") },
      { "min_eq_tx": getParams.get("min_eq_tx") },
      { "min_eq_value_tx": getParams.get("min_eq_value_tx") },
      { "total_min_tx": getParams.get("total_min_tx") },
    ];

    const loadData = async () => {
      if (!isMountedRef.current) {
        // If it's the first render, don't fetch data
        isMountedRef.current = true; // Mark as mounted for subsequent renders
        return;
      }      
      setLoading(true); 
      try {
        console.log("Start data fetch")
        const dataChain = await main(address, paramsData, { signal });
        console.log("Datachain: ", dataChain)
        if (typeof dataChain !== 'undefined') {
          console.log("Ändrar 'loading' till false")
          setDataChain(dataChain)
          setLoading(false);
        } else {
          setDataChain([])  
        }

      } catch (error) {
        console.error("Failed to fetch data", error);
        setDataChain([]);
      }
    }
    console.log("Loading: ", loading)
    loadData();

    return () => {
      console.log("Avbruten")
      controller.abort();
    };
  }, [address]);


  return (
    <>
      <div className="show-wallet-main">
        {/* Your existing JSX structure */}
        <div className="found-wallets">
          <h3>Antal hittade wallets: {data ? data.length : <Skeleton />}</h3>
          <p>Completed: {JSON.stringify(stepCompletedarr)}</p> {/* Change here to stringify */}
        </div>
        <div className="data-skeleton-loader">
          {loading ? <Skeleton variant="rectangular" width={210} height={118} /> : data && data.length > 0 ? <PresentData dataString={data} /> : <p>No Transactions found</p>}
        </div>
      </div>
    </>
  );
}

export default ShowWallet;
