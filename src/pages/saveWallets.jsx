import { useState, useEffect, useContext } from "react";
import { csvParse } from 'd3-dsv';
import { SavedContext } from "../components/SavedWalletContext.jsx";


export default function SavedWallets(){

  const { savedWallets, addToSavedWallet, defaultWallets } = useContext(SavedContext)
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')



  const changeName = (e) => {
    setName(e.target.value)
  }
  const changeAddress = (e) => {
    setAddress(e.target.value)
  }


  return <>
    <div id="save-wallet-page">
      <h2>Saved Wallets</h2>
      <div>
        <div>
          <p>Namn: </p>
          <input type="text" value={name} onChange={changeName} placeholder="Enter a name for address" />
        </div>
        <div>
          <p>Address: </p>
          <input type="text" value={address} onChange={changeAddress} placeholder="Enter a solana address"/>
        </div>
      </div>
      <button onClick={()=> addToSavedWallet({"name": name, "address": address})}>Spara wallet</button>
      <div className="saved-wallets">
        <div className="default-wallets">
          <h3>Default wallets</h3>
          <ul>
            {defaultWallets.map(eachAddress => <li key={eachAddress.name}>{eachAddress.name}: {eachAddress.address}</li>)}
          </ul>
        </div>
        <div className="my-saved-wallets">
          <h3>My saved wallets</h3>
          {savedWallets.map(eachSavedAddres => <li key={eachSavedAddres.name}>{eachSavedAddres.name}: {eachSavedAddres.address}</li>)}
        </div>
      </div>
    </div>
  </>
}