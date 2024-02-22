import { BrowserRouter, Route, Routes, useParams } from "react-router-dom"
import Nav from "./Nav.jsx"
import Homepage from "../pages/homepage.jsx"
import ShowWallet from "../pages/show-wallet.jsx"
import Nomatch from "../pages/Nomatch.jsx"
import { GlobalProvider } from "./GlobalContext.jsx"

function Router() {
  return (
    <GlobalProvider>
      <BrowserRouter>
        <Nav />
        <Routes>
          <Route path="/" element={<Homepage />} />
          <Route path="/saved-wallets" element={''} />
          <Route exact path="/address/:address" element={<ShowWallet />} />
          <Route path="*" element={<Nomatch/>}/>
        </Routes>
      </BrowserRouter>
    </GlobalProvider>
  )

}

export default Router