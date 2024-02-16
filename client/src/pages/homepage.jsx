import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function Homepage(param) {
  console.log("testing: ", param.settingsParam)
  const [address, setAddress] = useState("");
  const [latestSearch, setLatestSearch] = useState(() => {
    const savedSearches = localStorage.getItem("latestSearches");
    return savedSearches ? JSON.parse(savedSearches) : [];
  });
  const [hereId, setHereId] = useState('input-wallet')

  const navigate = useNavigate();

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

  const handleSearch = (valueButton) => {
    console.log("körd")
    console.log("address: ", address)
    if (address == "" && valueButton == null) {
      setHereId('input-wallet-wrong');
      setTimeout(() => {
        setHereId('input-wallet');
      }, 1000);
      return
    }
    const params = new URLSearchParams({
      param1: '1000',
      param2: '5',
      param3: '2',
      param4: '3'
    });
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

export default Homepage;
