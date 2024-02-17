import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';

function ShowWallet() {

  const { address } = useParams();
  const getParams = new URLSearchParams(document.location.search)
  const [data, setData] = useState({})
  const [params, setParams] = useState([])



  useEffect(() => {
    async function load() {
      const response = await fetch('/mockdata.json')
      const data = await response.json()
      setData(data.foundWallets)
    }
    load()

    const params = [
      { "total_tx": getParams.get("total_tx") },
      { "min_tx_value": getParams.get("min_tx_value") },
      { "min_eq_tx": getParams.get("min_eq_tx") },
      { "min_eq_value_tx": getParams.get("min_eq_value_tx") },
    ]
    setParams(params)
  }, [])

  console.log("data: ", data)

  return (
    <>
      <h1>Address: {address}</h1>
      {Object.keys(data).map(([key, value]) => {
        <section>
          <p>Wallet: {key}</p>
        </section>
      })}
    </>
  )
}

export default ShowWallet