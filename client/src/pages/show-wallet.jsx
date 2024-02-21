import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { main, stepCompleted } from '../components/fetchDataWallet.js';
import PresentData from '../components/presentData.jsx';
import Skeleton from 'react-loading-skeleton';

function ShowWallet() {
  const { address } = useParams();
  const getParams = new URLSearchParams(document.location.search);
  const [data, setDataChain] = useState(null);
  const [stepCompletedarr, setStepCompletedarr] = useState([]);
  const [loading, setLoading] = useState(true); // Track loading state

  useEffect(() => {
    async function loadData() {
      setLoading(true); // Begin loading
      try {
        const paramsData = [
          { "total_tx": getParams.get("total_tx") },
          { "min_tx_value": getParams.get("min_tx_value") },
          { "min_eq_tx": getParams.get("min_eq_tx") },
          { "min_eq_value_tx": getParams.get("min_eq_value_tx") },
          { "total_min_tx": getParams.get("total_min_tx") },
        ];

        const dataChain = await main(address, paramsData);
        setDataChain(typeof dataChain !== 'undefined' ? dataChain : []);
      } catch (error) {
        console.error("Failed to fetch data", error);
        setDataChain([]);
      } finally {
        setLoading(false); // End loading
      }
    }

    loadData();
  }, [address]);

  useEffect(() => {
    // This will not automatically update when stepCompleted changes outside of this component
    setStepCompletedarr(stepCompleted);
    console.log()
  }); // Consider adding dependencies that trigger this effect

  return (
    <>
      <div className="show-wallet-main">
        {/* Your existing JSX structure */}
        <div className="found-wallets">
          <h3>Antal hittade wallets: {data ? data.length : <Skeleton />}</h3>
          <p>Completed: {JSON.stringify(stepCompletedarr)}</p> {/* Change here to stringify */}
        </div>
        <div className="data-skeleton-loader">
          {loading ? <Skeleton count={5} /> : data && data.length > 0 ? <PresentData dataString={data} /> : <p>No Transactions found</p>}
        </div>
      </div>
    </>
  );
}

export default ShowWallet;
