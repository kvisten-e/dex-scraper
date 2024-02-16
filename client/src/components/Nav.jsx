import { Link } from "react-router-dom"

function Nav() {
  
  return (
    <nav>
      <Link to="/">Scrape dex</Link>
      <Link to="/settings">Settings</Link>
      <Link to="/saved-wallets">Save wallets</Link>
    </nav>
  )

}

export default Nav