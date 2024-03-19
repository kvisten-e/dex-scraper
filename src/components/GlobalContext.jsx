import { createContext, useState } from "react";

const GlobalContext = createContext()

function GlobalProvider({children}) {
  const [process, setProcess] = useState([])
  const [wallet, setWallet] = useState([])
  const [params, setParams] = useState({})
  const [signal, setSignal] = useState({})
  const [stepStatus, setStepStatus] = useState([0, 0, 0, 0])
  const [switchButton, setSwitchButton] = useState({ checked: false })

  return <GlobalContext.Provider
    value={{
      process,
      setProcess,
      wallet,
      setWallet,
      params,
      setParams,
      signal,
      setSignal,
      stepStatus,
      setStepStatus,
      switchButton,
      setSwitchButton
    }}>
    {children}
  </GlobalContext.Provider>

}

export {GlobalProvider, GlobalContext}


