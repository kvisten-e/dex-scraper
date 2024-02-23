import { createContext, useEffect, useState } from "react";
import { csvParse } from 'd3-dsv';

const SavedContext = createContext()

function SavedWalletProvider({children}) {
  const [savedWallets, setSavedWallets] = useState(() => {
    const savedSearches = localStorage.getItem("savedWallets");
    return savedSearches ? JSON.parse(savedSearches) : [];
  })
  const [defaultWallets, setDefaultWallets] = useState([])

    const checkAddress = (addresInput) => {
    const base58Chars = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
    const walletLength = 44
      if (addresInput.length === walletLength) {
      for (let i = 0; i < addresInput.length; i++) {
        if (!base58Chars.includes(addresInput[i])) {
          return false;
        }
        }
        return true;
    }
    return false
  }

  function addToSavedWallet(obj) {
    if (obj.name !== '' && checkAddress(obj.address)) {
      let newAddressExist = savedWallets.find(listObj => listObj.address === obj.address)
      if (!newAddressExist) {
        setSavedWallets([...savedWallets, obj])
      } else {
        console.log("Denna address finns redan inlagd")
      }     
    }

  }

  useEffect(() => {
    localStorage.setItem("savedWallets", JSON.stringify(savedWallets));
  }, [savedWallets]);

  useEffect(() => {
    async function fetchDefaultWallets() {
      try {
        const response = await fetch('./src/assets/dex.csv');
        const csvText = await response.text();
        const parsedData = csvParse(csvText, d => ({
          name: d.dex,
          address: d.address
        }));
        setDefaultWallets(parsedData);
      } catch (error) {
        console.error('Error reading the CSV file:', error);
      }
    }
    fetchDefaultWallets();
  }, []);

  return <SavedContext.Provider 
    value={{ savedWallets, addToSavedWallet, defaultWallets }}>
    {children}
  </ SavedContext.Provider>
}

export {SavedWalletProvider, SavedContext}