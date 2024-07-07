import { Link, useNavigate  } from "react-router-dom"

function Nav() {
  const navigate = useNavigate();
  const handleNavigate = (path) => {
    navigate(path, { replace: true, state: { needRefresh: true } });
    window.location.reload(false);
  };

  
  return (
    <nav>
      <button id="button-nav" onClick={() => handleNavigate("/")}>Scrape dex</button>
      <button id="button-nav" onClick={() => handleNavigate("/pump")}>Pump tokens</button>
      <button id="button-nav" onClick={() => handleNavigate("/snipe")}>Snipe Creator</button>
      <button id="button-nav" onClick={() => handleNavigate("/find-tokens")}>Find tokens</button>
      <button id="button-nav" onClick={() => handleNavigate("/saved-wallets")}>Save wallets</button>
    </nav>
  );

  

}

export default Nav