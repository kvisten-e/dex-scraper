import { useState, useEffect, useContext, useRef } from "react"
import * as web3 from '@solana/web3.js';
import { SystemProgram, SystemInstruction, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { GlobalContext } from './GlobalContext.jsx';

export default function pumpTokens(props) {

  const { params } = useContext(GlobalContext)
  const { signal } = useContext(GlobalContext)
  const [loading, setLoading] = useState(true);
  const isMountedRef = useRef(false);
  const [result, setResult] = useState([])



  useEffect(() => {
    async function main() {
      
    }
    const result = main()
    if (result) {
      setLoading(false)
      setResult(result)      
    }

  },[])

  return <>
    <div className="found-tokens">
      {loading ? <p></p> : result && result.length > 0 ?
        result.map((obj, index) => <section>
          <h4><a href={"https://solscan.io/account/" + obj.wallet + "#solTransfers"} target="_blank"> {index + 1}. {obj.wallet} received: {obj.amount} sol</a></h4>
          <ul>
            {obj.walletSentOut.map(foundWallets => <div>
              <p>{obj.wallet.substring(0, 4)} sent out {foundWallets.amount} to: </p>
              <ul>
                {foundWallets.wallets.map(eachWallet => <li><a href={"https://solscan.io/account/" + eachWallet + "#solTransfers"} target="_blank">{eachWallet}</a></li>)}
              </ul>
            </div>)}
          </ul>
        </section>)
        : <p>No Transactions found</p>}
    </div>  
  
  
  </>
}