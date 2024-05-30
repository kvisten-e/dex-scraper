import { BrowserRouter, Route, Routes, useParams } from "react-router-dom"
import Nav from "./Nav.jsx"
import Homepage from "../pages/homepage.jsx"
import ShowWallet from "../pages/show-wallet.jsx"
import Nomatch from "../pages/Nomatch.jsx"
import { GlobalProvider } from "./GlobalContext.jsx"
import SavedWallets from "../pages/saveWallets.jsx"
import { SavedWalletProvider } from "./SavedWalletContext.jsx"
import ShowDexes from "../pages/show-dexes.jsx"
import Pump from "../pages/pumpPage.jsx"
import Snipe from "../pages/snipePage.jsx"
import AudioButton from "./playbutton.jsx";


function Router() {
  return (
    <GlobalProvider>
      <BrowserRouter>
      <AudioButton url="/pump.mp3"/>
        
        <Nav />
        <SavedWalletProvider>
          <Routes>
            <Route path="/" element={<Homepage />} />
            <Route path="/saved-wallets" element={<SavedWallets />} />
            <Route path="/pump" element={<Pump />} />
            <Route path="/snipe" element={<Snipe />} />
            <Route exact path="/address/:address" element={<ShowWallet />} />
            <Route exact path="/all-dexes" element={<ShowDexes />} />
            <Route path="*" element={<Nomatch/>}/>
          </Routes>
        </SavedWalletProvider>
      </BrowserRouter>
    </GlobalProvider>
  )

}

export default Router