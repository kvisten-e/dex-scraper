import { BrowserRouter, Route, Routes, useParams } from "react-router-dom"
import Nav from "./Nav.jsx"
import Homepage from "../pages/homepage.jsx"
import ShowWallet from "../pages/show-wallet.jsx"
import Nomatch from "../pages/Nomatch.jsx"
import { Settings } from "../pages/settings.jsx"
function Router() {
  const test = "hej"
  return (
    <BrowserRouter>
      <Nav />
      <Routes>
        <Route path="/" element={<Homepage settingsParam = {test} />} />
        <Route path="/settings" element={<Settings/>} />
        <Route path="/saved-wallets" element={''} />
        <Route exact path="/address/:address" element={<ShowWallet />} />
        <Route path="*" element={<Nomatch/>}/>
      </Routes>
    </BrowserRouter>
  )

}

export default Router