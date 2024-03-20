import React, { useEffect, useState, useContext, Component } from "react";
import { useNavigate } from "react-router-dom";
import { IoSettingsSharp } from "react-icons/io5";
import { csvParse } from 'd3-dsv';
import { SavedContext } from "../components/SavedWalletContext.jsx";
import { GlobalContext } from "../components/GlobalContext.jsx";
import Badge from 'react-bootstrap/Badge';
import Switch from "react-switch";


function Homepage(param) {
  const { savedWallets, defaultWallets } = useContext(SavedContext)
  const {switchButton, setSwitchButton } = useContext(GlobalContext)
  const [address, setAddress] = useState("");
  const [latestSearch, setLatestSearch] = useState(() => {
    const savedSearches = localStorage.getItem("latestSearches");
    return savedSearches ? JSON.parse(savedSearches) : [];
  });
  const [settings, setSettings] = useState(false)
  const [hereId, setHereId] = useState('input-wallet')

  const [totalTransactionsCT, setTotalTransactionsCT] = useState(() => localStorage.getItem('totalTransactionsCT') || '500');
  const [miniumumTransactionValueCT, setMinumumTransactionValueCT] = useState(() => localStorage.getItem('miniumumTransactionValueCT') || '3');
  const [maximumTransactionValueCT, setMaximumTransactionValueCT] = useState(() => localStorage.getItem('maximumTransactionValueCT') || '20');
  const [minimumEqualTransactionsCT, setMinimumEqualTransactionsCT] = useState(() => localStorage.getItem('minimumEqualTransactionsCT') || '3');
  const [totalWalletInWallet, setTotalWalletInWallet] = useState(() => localStorage.getItem('totalWalletInWallet') || '80');

  const [minimumValueEqualTransactionsCT, setMinimumValueEqualTransactionsCT] = useState(() => localStorage.getItem('minimumValueEqualTransactionsCT') || '0.4');
  const [totalMinimumTransactionsCT, setTotalMinimumTransactionsCT] = useState(() => localStorage.getItem('totalMinimumTransactionsCT') || '25')
  
  const [totalTransactionsTS, setTotalTransactionsTS] = useState(() => localStorage.getItem('totalTransactionsTS') || '800');
  const [miniumumTransactionValueTS, setMinumumTransactionValueTS] = useState(() => localStorage.getItem('miniumumTransactionValueTS') || '10');
  const [maximumTransactionValueTS, setMaximumTransactionValueTS] = useState(() => localStorage.getItem('maximumTransactionValueTS') || '70');
  const [maximumDecimalsTS, setMaximumDecimalsTS] = useState(() => localStorage.getItem('maximumDecimalsTS') || '2');
  const [totalWalletTransactionsTS, setTotalWalletTransactionsTS] = useState(() => localStorage.getItem('totalWalletTransactionsTS') || '10');
  const [procentSentSol, setProcentSentSol] = useState(() => localStorage.getItem('procentSentSol') || '70');

  
  
  const [settingsParamCT, setSettingsParamCT] = useState({});
  const [settingsParamTS, setSettingsParamTS] = useState({});

  const [csvData, setCsvData] = useState([])
  const navigate = useNavigate();

  useEffect(() => {
    const newSettingsParamCT = {
      total_tx: totalTransactionsCT,
      min_tx_value: miniumumTransactionValueCT,
      max_tx_value: maximumTransactionValueCT,
      min_eq_tx: minimumEqualTransactionsCT,
      tot_tra_wallet: totalWalletInWallet,
      min_eq_value_tx: minimumValueEqualTransactionsCT,
      total_min_tx: totalMinimumTransactionsCT
    };
    setSettingsParamCT(newSettingsParamCT);


    localStorage.setItem('totalTransactionsCT', totalTransactionsCT);
    localStorage.setItem('miniumumTransactionValueCT', miniumumTransactionValueCT);
    localStorage.setItem('maximumTransactionValueCT', maximumTransactionValueCT);
    localStorage.setItem('minimumEqualTransactionsCT', minimumEqualTransactionsCT);
    localStorage.setItem('totalWalletInWallet', totalWalletInWallet);
    localStorage.setItem('minimumValueEqualTransactionsCT', minimumValueEqualTransactionsCT);
    localStorage.setItem('totalMinimumTransactionsCT', totalMinimumTransactionsCT)
  }, [totalTransactionsCT, miniumumTransactionValueCT, maximumTransactionValueCT, minimumEqualTransactionsCT, minimumValueEqualTransactionsCT, totalMinimumTransactionsCT]);


  useEffect(() => {
    const newSettingsParamTS = {
      total_tx: totalTransactionsTS,
      min_tx_value: miniumumTransactionValueTS,
      max_tx_value: maximumTransactionValueTS,
      max_dec_value: maximumDecimalsTS,
      total_wallet_tx: totalWalletTransactionsTS,
      procent_sent_sol: procentSentSol,
    };
    setSettingsParamTS(newSettingsParamTS);


    localStorage.setItem('totalTransactionsTS', totalTransactionsTS);
    localStorage.setItem('miniumumTransactionValueTS', miniumumTransactionValueTS);
    localStorage.setItem('maximumTransactionValueTS', maximumTransactionValueTS);
    localStorage.setItem('maximumDecimalsTS', maximumDecimalsTS);
    localStorage.setItem('totalWalletTransactionsTS', totalWalletTransactionsTS);
    localStorage.setItem('procentSentSol', procentSentSol);

  }, [totalTransactionsTS, miniumumTransactionValueTS, maximumTransactionValueTS, maximumDecimalsTS, totalWalletTransactionsTS, procentSentSol]);



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


  function handleChange(checked) {
    setSwitchButton({ checked });
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
    const paramStr = switchButton.checked ? settingsParamTS : settingsParamCT;
    const params = new URLSearchParams(paramStr);


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

  const handleSearchAll = () => {

    const paramStr = switchButton.checked ? settingsParamTS : settingsParamCT;
    const params = new URLSearchParams(paramStr);

    setTimeout(() => {
      navigate(`/all-dexes?${params.toString()}`);
    }, 10);

  }

  return (
    <>
      <div id="main-page">
        <label className="d-flex justify-content-center gap-3">
          <p style={{color:"white"}}>Copy trader</p>
          <Switch onChange={handleChange} checked={switchButton.checked} offColor={"#646cff"} uncheckedIcon={false} checkedIcon={false} />
          <p style={{ color: "white" }}>Snipe tokens</p>
        </label>  
        {!switchButton.checked ? <div id="search-bar" style={{ border: "3px solid #646cff"}}>
          <IoSettingsSharp id="settings-icon" style={settings ? { color: "#646cff" } : { color: "white" }} onClick={() => setSettings(settings ? false : true)} />
          {settings && <div id="settings">
            <div id="settings-body">
              <div id="settings-main">
                <div id="settings-main-head" className="mb-3">
                  <h2>Search settings - Copy Trader</h2>
                </div>
                <div id="settings-main-content">
                  <div>
                    <h4>Total amount of transactions to fetch</h4>
                    <input type="search" id="test" value={totalTransactionsCT} placeholder="Max. 1000" onChange={(e) => setTotalTransactionsCT(e.target.value)} />
                  </div>
                  <div>
                    <h4>Value of each fetched transaktion</h4>
                    <div>
                      <input type="search" value={miniumumTransactionValueCT} placeholder="Ex. 3" onChange={(e) => setMinumumTransactionValueCT(e.target.value)} />
                      <input type="search" value={maximumTransactionValueCT} placeholder="Ex. 20" onChange={(e) => setMaximumTransactionValueCT(e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <h4>Total transactions in found wallet from dex</h4>
                    <input type="search" value={totalWalletInWallet} placeholder="Ex. 3" onChange={(e) => setTotalWalletInWallet(e.target.value)} />
                  </div>
                  <div>
                    <h4>Amount of equal sent transaction from each found wallets</h4>
                    <input type="search" value={minimumEqualTransactionsCT} placeholder="Ex. 80" onChange={(e) => setTotalWalletInWallet(e.target.value)} />
                  </div>
                  <div>
                    <h4>Minimum value of each equal transaction out</h4>
                    <input type="search" value={minimumValueEqualTransactionsCT} placeholder="Ex. 1" onChange={(e) => setMinimumValueEqualTransactionsCT(e.target.value)} />
                  </div>
                  <div>
                    <h4>Total transaction for each receiving wallet</h4>
                    <input type="search" value={totalMinimumTransactionsCT} placeholder="Ex. 50" onChange={(e) => setTotalMinimumTransactionsCT(e.target.value)} />
                  </div>
                </div>
              </div>
            </div>
          </div>}
          <div id="search-func">
            <h2 className="mt-2">Copy trader</h2>
            <h3>Enter dex wallet</h3>
            <input type="search" value={address} id={hereId} placeholder="Enter A Solana address" onChange={(e) => setAddress(e.target.value)}/>
            <button id="button-search" style={{backgroundColor: "#646cff", borderColor: "#646cff"}} onClick={() => { handleSearch() }}>Scrape wallet</button>
            <button id="button-search-all" onClick={() => { handleSearchAll() }}>Scrape ALL wallets</button>
          </div>
          <div id="saved-wallets-homepage">
            {defaultWallets.map(obj => <Badge bg="secondary" onClick={() => { handleSearch(obj.address.trim()) }}>{obj.name}</Badge>)}
            {savedWallets.map(obj => <Badge bg="" style={{ backgroundColor: "#646cff" }} onClick={() => { handleSearch(obj.address.trim()) }}>{obj.name}</Badge>)}
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
          :
          <div id="search-bar" style={{ border: "3px solid #080" }}>
            <IoSettingsSharp id="settings-icon" style={settings ? { color: "#646cff" } : { color: "white" }} onClick={() => setSettings(settings ? false : true)} />
            {settings && <div id="settings">
              <div id="settings-body">
                <div id="settings-main">
                  <div id="settings-main-head" className="mb-3">
                    <h2>Search settings - Snipe tokens</h2>
                  </div>
                  <div id="settings-main-content">
                    <div>
                      <h4>Total amount of transactions to fetch</h4>
                      <input type="search" id="test" value={totalTransactionsTS} placeholder="Max. 1000" onChange={(e) => setTotalTransactionsTS(e.target.value)} />
                    </div>
                    <div>
                      <h4>Value of each fetched transaktion</h4>
                      <div>
                        <input type="search" value={miniumumTransactionValueTS} placeholder="Ex. 10" onChange={(e) => setMinumumTransactionValueTS(e.target.value)} />
                        <input type="search" value={maximumTransactionValueTS} placeholder="Ex. 70" onChange={(e) => setMaximumTransactionValueTS(e.target.value)} />
                      </div>
                    </div>
                    <div>
                      <h4>Amount of deciamls of SOL sent out</h4>
                      <input type="search" value={maximumDecimalsTS} placeholder="Ex. 2" onChange={(e) => setMaximumDecimalsTS(e.target.value)} />
                    </div>                    
                    <div>
                      <h4>Total transaction in wallet</h4>
                      <input type="search" value={minimumEqualTransactionsCT} placeholder="Ex. 10" onChange={(e) => setTotalWalletTransactionsTS(e.target.value)} />
                    </div>
                    <div>
                      <h4>% Procent of sent out SOL</h4>
                      <input type="search" value={procentSentSol} placeholder="Ex. 70" onChange={(e) => setProcentSentSol(e.target.value)} />
                    </div>

                  </div>
                </div>
              </div>
            </div>}
            <div id="search-func">
              <h2 className="mt-2">Token sniper</h2>
              <h3>Enter dex wallet</h3>
              <input type="search" value={address} id={hereId} placeholder="Enter A Solana address" onChange={(e) => setAddress(e.target.value)} />
              <button id="button-search" style={{ backgroundColor: "#080", borderColor: "#080" }}  onClick={() => { handleSearch() }}>Scrape wallet</button>
              <button id="button-search-all" onClick={() => { handleSearchAll() }}>Scrape ALL wallets</button>
            </div>
            <div id="saved-wallets-homepage">
              {defaultWallets.map(obj => <Badge bg="secondary" onClick={() => { handleSearch(obj.address.trim()) }}>{obj.name}</Badge>)}
              {savedWallets.map(obj => <Badge bg="" style={{ backgroundColor: "#080" }} onClick={() => { handleSearch(obj.address.trim()) }}>{obj.name}</Badge>)}
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
          </div>}

      </div>
    </>
  );
}


export default Homepage;


