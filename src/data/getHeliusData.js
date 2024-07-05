import fs from "fs"

const url = "https://api.helius.xyz/v0/transactions/?api-key=214a5e1f-bfc9-4e59-a1ce-f96533457125";

const parseTransaction = async () => {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      transactions: ["4cSywbWbDmvZKLza5gAUYCKWs9nhuBEMxX17jRKbdK9WPHpqNh89MfgtpQ4PyttP4E8ScVjKPZ2zR3cdQqrQabaG"],
    }),
  });

  const data = await response.json();

  fs.writeFile('buySellRaydium.json', JSON.stringify(data, null, 2), (err) => {
    if (err) throw err;
    console.log('Data has been saved to data.json');
  });
   console.log("parsed transaction: ", data);
};

parseTransaction();