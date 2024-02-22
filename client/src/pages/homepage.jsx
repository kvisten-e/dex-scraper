import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { IoSettingsSharp } from "react-icons/io5";
import { csvParse } from 'd3-dsv';


function Homepage(param) {
  const [address, setAddress] = useState("");
  const [latestSearch, setLatestSearch] = useState(() => {
    const savedSearches = localStorage.getItem("latestSearches");
    console.log(savedSearches)
    return savedSearches ? JSON.parse(savedSearches) : [];
  });
  const [settings, setSettings] = useState(false)
  const [hereId, setHereId] = useState('input-wallet')

  const [totalTransactions, setTotalTransactions] = useState(() => localStorage.getItem('totalTransactions') || '500');
  const [miniumumTransactionValue, setMinumumTransactionValue] = useState(() => localStorage.getItem('miniumumTransactionValue') || '3');
  const [maximumTransactionValue, setMaximumTransactionValue] = useState(() => localStorage.getItem('maximumTransactionValue') || '20');
  const [minimumEqualTransactions, setMinimumEqualTransactions] = useState(() => localStorage.getItem('minimumEqualTransactions') || '3');
  const [minimumValueEqualTransactions, setMinimumValueEqualTransactions] = useState(() => localStorage.getItem('minimumValueEqualTransactions') || '0.4');
  const [totalMinimumTransactions, setTotalMinimumTransactions] = useState(() => localStorage.getItem('totalMinimumTransactions') || '25')
  const [settingsParam, setSettingsParam] = useState({});
  const [csvData, setCsvData] = useState([])
  const navigate = useNavigate();

  useEffect(() => {
    const newSettingsParam = {
      total_tx: totalTransactions,
      min_tx_value: miniumumTransactionValue,
      max_tx_value: maximumTransactionValue,
      min_eq_tx: minimumEqualTransactions,
      min_eq_value_tx: minimumValueEqualTransactions,
      total_min_tx: totalMinimumTransactions
    };

    setSettingsParam(newSettingsParam);

    localStorage.setItem('totalTransactions', totalTransactions);
    localStorage.setItem('miniumumTransactionValue', miniumumTransactionValue);
    localStorage.setItem('maximumTransactionValue', maximumTransactionValue);
    localStorage.setItem('minimumEqualTransactions', minimumEqualTransactions);
    localStorage.setItem('minimumValueEqualTransactions', minimumValueEqualTransactions);
    localStorage.setItem('totalMinimumTransactions', totalMinimumTransactions)
  }, [totalTransactions, miniumumTransactionValue, maximumTransactionValue, minimumEqualTransactions, minimumValueEqualTransactions, totalMinimumTransactions]);

  useEffect(() => {
    localStorage.setItem("latestSearches", JSON.stringify(latestSearch));
  }, [latestSearch]);

  useEffect(() => {
    const keyEnter = event => {
      if (event.key === 'Enter') {
        event.preventDefault();
        handleSearch()
      }
    }
    document.addEventListener('keydown', keyEnter);

    return () => {
      document.removeEventListener('keydown', keyEnter);
    };
  }, [address])
  
  useEffect(() => {
    fetch('./src/assets/dex.csv')
      .then(response => response.text())
      .then(csvText => {
        const parsedData = csvParse(csvText, d => ({
          dex: d.dex,
          address: d.address
        }));
        setCsvData(parsedData);
      })
      .catch(error => console.error('Error reading the CSV file:', error));
  }, []);
  

  const checkAddress = (valueButton) => {
    const base58Chars = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
    let wallet = ""
    if (valueButton == null) {
      wallet = address
    } else {
      wallet = valueButton
    }

    const walletLength = 44
    if (wallet.length !== walletLength) {
      return true;
    }
    for (let i = 0; i < wallet.length; i++) {
      if (!base58Chars.includes(wallet[i])) {
        return true;
      }
    }
    return false
  }

  const handleSearchName = (search) => {
    const matchingEntry = csvData.find(entry => entry.address.trim() == search.trim());
    if (matchingEntry) {
      return matchingEntry.dex
    } else {
      return search
    }
  }

  const handleSearch = (valueButton) => {
    const walletToCheck = valueButton || address
    if (!walletToCheck || checkAddress(valueButton)) {
      setHereId('input-wallet-wrong');
      setTimeout(() => {
        setHereId('input-wallet');
      }, 1000);
      return
    }
    const params = new URLSearchParams(settingsParam);

    if (valueButton == null) {
      if (!latestSearch.includes(address)) {
        setLatestSearch(prevSearches => {
          let updatedSearches = [...prevSearches, address];

          if (updatedSearches.length > 5) {
            updatedSearches = updatedSearches.slice(-5);
          }

          localStorage.setItem("latestSearches", JSON.stringify(updatedSearches));
          return updatedSearches;
        });        
      }

      setAddress('');

      setTimeout(() => {
        navigate(`/address/${address}?${params.toString()}`);
      }, 10);
    } else {
      setTimeout(() => {
        navigate(`/address/${valueButton}?${params.toString()}`);
      }, 10)
    }
  }


  return (
    <>
      <div id="main-page">
        <div id="search-bar">
          <IoSettingsSharp id="settings-icon" style={settings ? { color: "#646cff" } : { color: "white" }} onClick={()=> setSettings(settings ? false : true)}/>
          {settings && <div id="settings">
            <div id="settings-body">
              <div id="settings-main">
                <div id="settings-main-head">
                  <h2>Search settings</h2>
                </div>
                <div id="settings-main-content">
                  <div>
                    <h3>Total amount of transactions to fetch</h3>
                    <input type="search" id="test" value={totalTransactions} placeholder="Max. 1000" onChange={(e) => setTotalTransactions(e.target.value)} />
                  </div>
                  <div>
                    <h3>Value of each fetched transaktion</h3>
                    <div>
                      <input type="search" value={miniumumTransactionValue} placeholder="Ex. 3" onChange={(e) => setMinumumTransactionValue(e.target.value)} />
                      <input type="search" value={maximumTransactionValue} placeholder="Ex. 20" onChange={(e) => setMaximumTransactionValue(e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <h3>Amount of equal sent transaction from each found wallets</h3>
                    <input type="search" value={minimumEqualTransactions} placeholder="Ex. 3" onChange={(e) => setMinimumEqualTransactions(e.target.value)} />
                  </div>
                  <div>
                    <h3>Minimum value of each equal transaction out</h3>
                    <input type="search" value={minimumValueEqualTransactions} placeholder="Ex. 1" onChange={(e) => setMinimumValueEqualTransactions(e.target.value)} />
                  </div>
                  <div>
                    <h3>Total transaction for each receiving wallet</h3>
                    <input type="search" value={totalMinimumTransactions} placeholder="Ex. 50" onChange={(e) => setTotalMinimumTransactions(e.target.value)} />
                  </div>
                </div>
              </div>
            </div>
          </div>}
          <div id="search-func">
            <h2>Enter dex wallet</h2>
            <input type="search" value={address} id={hereId} placeholder="Enter A Solana address" onChange={(e) => setAddress(e.target.value)} />
            <button id="button-search" onClick={() => { handleSearch() }}>Scrape wallet</button>
          </div>

          <div id="area-latest-search">
            <h3>Latest search</h3>
            <div id="latest-search">
              <ul id="list-latest-search">
                {latestSearch.map((search, index) => (
                  <p key={index}>
                    <button onClick={() => { handleSearch(search) }}>{handleSearchName(search)}</button>
                  </p>
                )).reverse()}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}


function checkAddress(wallet) {
  
  return false
}

export default Homepage;


