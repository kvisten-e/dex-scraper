import { useState, useEffect } from "react"

export default function PresentData(params) {

  const [data, setData] = useState([])


  useEffect(() => {

    const incomingData = params.dataString
    const sortedDataByPrice = incomingData.sort((p1, p2) => (p1.amount < p2.amount) ? 1 : (p1.amount > p2.amount) ? -1 : 0)

    setData(sortedDataByPrice)
  },[])

  console.log(data)

  
  return <>

    <div className="found-transactions">
      {
        data.map((obj, index) => <section>
          <h4>{index + 1}. {obj.wallet} received: &nbsp;{obj.amount} sol</h4>
          <ul>
            {obj.walletSentOut.map(foundWallets => <div>
              <p>{obj.wallet.substring(0,4)} sent out {foundWallets.amount} to: </p>
              <ul>
                {foundWallets.wallets.map(eachWallet => <li>{eachWallet}</li>)}
              </ul>
            </div>)}
          </ul>
        </section>)
      }
    </div>
  </>
}