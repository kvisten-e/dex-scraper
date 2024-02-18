import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { main } from '../components/fetchDataWallet.js';

function ShowWallet() {

  const { address } = useParams();
  const getParams = new URLSearchParams(document.location.search)
  const [params, setParams] = useState([])
  const [data] = useState([])


  useEffect(() => {

    const paramsData = [
      { "total_tx": getParams.get("total_tx") },
      { "min_tx_value": getParams.get("min_tx_value") },
      { "min_eq_tx": getParams.get("min_eq_tx") },
      { "min_eq_value_tx": getParams.get("min_eq_value_tx") },
      { "total_min_tx": getParams.get("total_min_tx") },

    ]
    setParams(paramsData)

    const dataChain = main(address, paramsData)
    console.log(dataChain)

  }, [])


  return (
    <>
      <h1>Address: {address}</h1>

    </>
  )
}

export default ShowWallet