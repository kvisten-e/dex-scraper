import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { IoSettingsSharp } from "react-icons/io5";

function Homepage(param) {
  const [address, setAddress] = useState("");
  const [latestSearch, setLatestSearch] = useState(() => {
    const savedSearches = localStorage.getItem("latestSearches");
    return savedSearches ? JSON.parse(savedSearches) : [];
  });
  const [settings, setSettings] = useState(false)
  const [hereId, setHereId] = useState('input-wallet')

  const [totalTransactions, setTotalTransactions] = useState(() => localStorage.getItem('totalTransactions') || '1000');
  const [miniumumTransactionValue, setMinumumTransactionValue] = useState(() => localStorage.getItem('miniumumTransactionValue') || '10');
  const [minimumEqualTransactions, setMinimumEqualTransactions] = useState(() => localStorage.getItem('minimumEqualTransactions') || '3');
  const [minimumValueEqualTransactions, setMinimumValueEqualTransactions] = useState(() => localStorage.getItem('minimumValueEqualTransactions') || '1');
  const [settingsParam, setSettingsParam] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const newSettingsParam = {
      total_tx: totalTransactions,
      min_tx_value: miniumumTransactionValue,
      min_eq_tx: minimumEqualTransactions,
      min_eq_value_tx: minimumValueEqualTransactions
    };

    setSettingsParam(newSettingsParam);

    localStorage.setItem('totalTransactions', totalTransactions);
    localStorage.setItem('miniumumTransactionValue', miniumumTransactionValue);
    localStorage.setItem('minimumEqualTransactions', minimumEqualTransactions);
    localStorage.setItem('minimumValueEqualTransactions', minimumValueEqualTransactions);
  }, [totalTransactions, miniumumTransactionValue, minimumEqualTransactions, minimumValueEqualTransactions]);

  useEffect(() => {
    localStorage.setItem("latestSearches", JSON.stringify(latestSearch));
  }, [latestSearch]);

  useEffect(() => {
    const keyEnter = event => {
      console.log('User pressed: ', event.key);
      if (event.key === 'Enter') {
        event.preventDefault();
        console.log("trigged")
        handleSearch()
      }
    }
    document.addEventListener('keydown', keyEnter);

    return () => {
      document.removeEventListener('keydown', keyEnter);
    };
  }, [address])
  

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

  const handleSearch = (valueButton) => {
    const walletToCheck = valueButton || address
    console.log(walletToCheck)
    if (!walletToCheck || checkAddress(valueButton)) {
      console.log("inne")
      setHereId('input-wallet-wrong');
      setTimeout(() => {
        setHereId('input-wallet');
      }, 1000);
      return
    }
    const params = new URLSearchParams(settingsParam);

    if (valueButton == null) {
      setLatestSearch(prevSearches => {
        let updatedSearches = [...prevSearches, address];

        if (updatedSearches.length > 5) {
          updatedSearches = updatedSearches.slice(-5);
        }

        localStorage.setItem("latestSearches", JSON.stringify(updatedSearches));
        return updatedSearches;
      });

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
                    <input type="search" id="test" value={totalTransactions} placeholder="Ex. 1000" onChange={(e) => setTotalTransactions(e.target.value)} />
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
                    <button onClick={() => { handleSearch(search) }}>{search}</button>
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
