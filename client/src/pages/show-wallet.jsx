import { useParams } from 'react-router-dom';

function ShowWallet() {
  
  const { address } = useParams();

  return (
    <>
      <h1>Address: {address}</h1>
    </>
  )
}

export default ShowWallet