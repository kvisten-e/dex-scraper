import { useState, useEffect } from "react"


function Settings() {

  const [totalTransactions, setTotalTransactions] = useState('1000')
  const [miniumumTransactionValue, setMinumumTransactionValue] = useState('10')
  const [minimumEqualTransactions, setMinimumEqualTransactions] = useState('3')
  const [minimumValueEqualTransactions, setMinimumValueEqualTransactions] = useState('1')
  const [settingsParam, setSettingsParam] = useState([]);
  

  useEffect(() => {
    setSettingsParam([
      { total_tx: totalTransactions },
      { min_tx_value: miniumumTransactionValue },
      { min_eq_tx: minimumEqualTransactions },
      { min_eq_value_tx: minimumValueEqualTransactions }
    ]);
  }, [totalTransactions, miniumumTransactionValue, minimumEqualTransactions, minimumValueEqualTransactions]);
  

  return (
    <div id="settings-body">
      <div id="settings-main">
        <div id="settings-main-head">
          <h2>Search settings</h2>
        </div>
        <div id="settings-main-content">
          <div>
            <h3>Total amount of transactions to fetch</h3>
            <input type ="search" id="test" value={totalTransactions} placeholder="Ex. 1000" onChange={(e)=> setTotalTransactions(e.target.value)}/>
          </div>
          <div>
            <h3>Minimum value of each fetched transaktion</h3>
            <input type="search" value={miniumumTransactionValue} placeholder="Ex. 10" onChange={(e) => setMinumumTransactionValue(e.target.value)} />
          </div>
          <div>
            <h3>Amount of equal sent transaction from each found wallets</h3>
            <input type="search" value={minimumEqualTransactions} placeholder="Ex. 3" onChange={(e) => setMinimumEqualTransactions(e.target.value)} />
          </div>
          <div>
            <h3>Minimum value of each equal transaction out</h3>
            <input type="search" value={minimumValueEqualTransactions} placeholder="Ex. 1" onChange={(e) => setMinimumValueEqualTransactions(e.target.value)} />
          </div>        
        </div>
      </div>
    </div>
  )
}


export { Settings };

