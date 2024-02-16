import { BrowserRouter, Route, Routes, useParams } from "react-router-dom"
import Nav from "./Nav.jsx"
import Homepage from "../pages/homepage.jsx"
import ShowWallet from "../pages/show-wallet.jsx"
import Nomatch from "../pages/Nomatch.jsx"

function Router() {
  const test = "hej"
  return (
    <BrowserRouter>
      <Nav />
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/saved-wallets" element={''} />
        <Route exact path="/address/:address" element={<ShowWallet />} />
        <Route path="*" element={<Nomatch/>}/>
      </Routes>
    </BrowserRouter>
  )

}

export default Router