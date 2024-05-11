import * as web3 from '@solana/web3.js';
import { SystemProgram, SystemInstruction, LAMPORTS_PER_SOL } from '@solana/web3.js';

const amountTokens = 1000
const maxTimeSecondsToKOTH = 900

const mockResult = [
      {
    signature: '3AE8ABLs4HQHq1NpPSnye5N5q2nLq2EpBMmon898gsPbNQCxCqgiUayFDxRKApoHNe9KwtmR6EvBheQso4tEUFQk',
    sol_amount: 150000001,
    token_amount: 672776524984,
    is_buy: true,
    user: '96Hf7V8z1wtvNuZF2fv2qSjZEtLbKWCxjPydEEpT6K6e',
    timestamp: 1715382067,
    mint: '9f5dMRhsndgwBuGoAxp7nUAoFwPJuUnQCLjp8qecx1ds',
    virtual_sol_reserves: 84792059672,
    virtual_token_reserves: 379634605152590,
    tx_index: 1,
    name: 'Museum Of Hats',
    symbol: 'MOHA',
    description: 'Museum with all Hats https://twitter.com/Muzeumofhats https://t.me/muzeumofhats',
    image_uri: 'https://cf-ipfs.com/ipfs/QmefGW6WdBwPt3WDz1cKg8xp2hzkx7Ehv3ydATYPhPa68j',
    metadata_uri: 'https://cf-ipfs.com/ipfs/QmSE4xdJBj3v867oFwytQ8Wf3yS6r91e49w67w5DXHGKUY',
    twitter: null,
    telegram: null,
    bonding_curve: 'A9zXsDT6yNNbyX1d6iwuhPoRNG7L5DHsJD2GN5e8Wvzx',
    associated_bonding_curve: 'FyV9DdFtnpMpMyet8mvGapBTUqCxngHSNEV4A9rdXYG9',
    creator: 'GkxhfxfpghkEfDpEKu9yzfMFUDXR9fmTWcLKwnZtw7gU',
    created_timestamp: 1715380168124,
    raydium_pool: null,
    complete: false,
    total_supply: 1000000000000000,
    website: null,
    show_name: true,
    king_of_the_hill_timestamp: 1715380233633,
    market_cap: 222.562231891,
    reply_count: 47,
    last_reply: 1715382066313,
    nsfw: false,
    market_id: null,
    inverted: null,
    username: 'sharinpack',
    profile_image: null,
    creator_username: 'Muzeum',
    creator_profile_image: null,
    usd_market_cap: 32440.67092043216
  },
  {
    signature: '39Tv7W8SjfWhznEHsCx9my8CmJeCJadwTLRPx8mH2mHd5zMSWFvat38UpLCRZVnnuQWqGC4eGNwfmWzAMfgZ9Aox',
    sol_amount: 100000001,
    token_amount: 1609182340554,
    is_buy: true,
    user: 'B223WN5Zrs5M26FsQttgeE3NeH5L967j8CqdhHbkKBtH',
    timestamp: 1715382067,
    mint: '8rncFw8CpzCXjHTeubzXEowhAQ42asPUmgLgmUxvkUoc',
    virtual_sol_reserves: 44775801416,
    virtual_token_reserves: 718915106870725,
    tx_index: 1,
    name: 'Tophat Cat',
    symbol: 'TOPCAT',
    description: 'Meow meow my good fellow! A fine aristocat like yourself needs an aristocat token!',
    image_uri: 'https://cf-ipfs.com/ipfs/QmY2uEUnXXBdvT3Q6FjhWH32uiauhspkdMgza4MEH7k8JP',
    metadata_uri: 'https://cf-ipfs.com/ipfs/QmfGWyqdmPJacaBAWtssCJ88Gk9oF56NsdDNxyRqaWsFVH',
    twitter: 'https://twitter.com/TopHatCatSOL',
    telegram: 'https://t.me/tophatcatonsolana',
    bonding_curve: 'FiwhPt6PJsxQN53WcwSMMTVpNVBddXVtWr4psKNyAy7Y',
    associated_bonding_curve: '3d88DXuw3g5jvuSBhwCJTG62UPUnG1Q8UQ5rzMae99YN',
    creator: 'Fhgktnf8Tzehj2ekJUfn5awtoxQDrwp4sqQoz7UNgpLz',
    created_timestamp: 1715380710092,
    raydium_pool: null,
    complete: false,
    total_supply: 1000000000000000,
    website: 'https://tophatcat.fun/',
    show_name: true,
    king_of_the_hill_timestamp: 1715381287533,
    market_cap: 62.00457373,
    reply_count: 27,
    last_reply: 1715381949917,
    nsfw: false,
    market_id: null,
    inverted: null,
    creator_username: null,
    creator_profile_image: null,
    usd_market_cap: 9037.786666884798
  },
  {
    signature: '5zG9UWZQv778YJ9MDpAVxdXV29d2jUtW1pYujKJBVUCaS7eR7834cwyYn6vMszvneJPDXhy2VPLYRinyc3b3G2YX',
    sol_amount: 176145050,
    token_amount: 3593081000000,
    is_buy: true,
    user: 'HPebSUSRP4WY4owyE4PK7YDVQ4STT68iH1Nf8iyzoJ8t',
    timestamp: 1715382066,
    mint: 'gXqbALET9r5wJXQhbZNQir64bJY3WnmgUKsZvus11zK',
    virtual_sol_reserves: 39813014606,
    virtual_token_reserves: 808529580630204,
    tx_index: 1,
    name: 'Mitaty',
    symbol: 'MITATY',
    description: 'Top Tard �',
    image_uri: 'https://cf-ipfs.com/ipfs/QmY3JdU1XASEdkdo4783JHJSxU2gi4RRpJA7U1eXHFX2mt',
    metadata_uri: 'https://cf-ipfs.com/ipfs/QmQPzXrAMxp5uiG9KLVGNvZDQ6TyBgpdstUvcD4gMFoCqB',
    twitter: 'https://twitter.com/MitatySol',
    telegram: 'https://t.me/MitatySol',
    bonding_curve: '2wKTsS2Hcw5KrqisdxEMDfXxTMQCGtyQ8YZLbixxYukt',
    associated_bonding_curve: '5KvGGNfDEhtmEpyysMfZvjm36NvixpJaUaw58MZ5BQSH',
    creator: '7rqhhbp1LGHRiTWb6gfY5NRhbL8Aw2oU6Spv9724sxU',
    created_timestamp: 1715382041061,
    raydium_pool: null,
    complete: false,
    total_supply: 1000000000000000,
    website: 'https://www.mitaty.vip/',
    show_name: true,
    king_of_the_hill_timestamp: null,
    market_cap: 48.806505998,
    reply_count: 0,
    last_reply: null,
    nsfw: false,
    market_id: null,
    inverted: null,
    creator_username: 'MITATY',
    creator_profile_image: 'https://cf-ipfs.com/ipfs/QmX7sCCNXDRkBHEXsQ3Ne8JkHFEkCrUJU78gxCnbySEZjH',
    usd_market_cap: 7114.036314268479
  },
  {
    signature: '3ftWqMxxzFfrc7XsrDhr2gMsL6T8msNVN6UdwrQ9sN3PejAFeqhkWEUdDPnBHNgRgp8Q4FDiBQ5heLU6JaRS5rYu',
    sol_amount: 10000000,
    token_amount: 84774562124,
    is_buy: true,
    user: '5s37jeaifXTLbGFLDmAe1277eSdGeoha5DVJtKjAcc7u',
    timestamp: 1715382066,
    mint: 'GXgXeBfeTXqN96Z3KGwuscjPQRKJSi3nz5CAnXDnP9Q2',
    virtual_sol_reserves: 61625854069,
    virtual_token_reserves: 522345704862853,
    tx_index: 1,
    name: 'Trump Cat',
    symbol: 'TRUMPCAT',
    description: 'Make Ameowrica Great Again! Tg:https://t.me/trumpcat_sol X: https://twitter.com/trumpcatonsol_ Web: https://trumpcatsol.com/',
    image_uri: 'https://cf-ipfs.com/ipfs/QmdXzWYgGxq1n1h2VVAgAxHbWq3MWJ6qv29qpxmSik8UfP',
    metadata_uri: 'https://cf-ipfs.com/ipfs/Qmby6CV7GNyxvsAuntVi1RxAEt3NDM51W8xuPmxqTevACq',
    twitter: 'https://twitter.com/trumpcatonsol_',
    telegram: 'https://t.me/trumpcat_sol',
    bonding_curve: 'EKoyWSAgPvPiboGyCQqrzDaJeDtypZQqNa51yPPe5yyh',
    associated_bonding_curve: '6TxRQ22rXU6c55XCvPu7iKT18ZsNoRugfbWjjjr27RXb',
    creator: 'CN8rX4qEvHpredtnVsG8hvDKvMxEG9uVxobh3HhinWvb',
    created_timestamp: 1715376568533,
    raydium_pool: null,
    complete: false,
    total_supply: 1000000000000000,
    website: 'https://trumpcatsol.com/',
    show_name: true,
    king_of_the_hill_timestamp: null,
    market_cap: 117.940772017,
    reply_count: 12,
    last_reply: 1715381359062,
    nsfw: false,
    market_id: null,
    inverted: null,
    creator_username: null,
    creator_profile_image: null,
    usd_market_cap: 17191.04692919792
  },
  {
    signature: '5mVnDvg3eV9TxcndrbeJsWTPDL6E3jrWiPXdHdwnSW3RgP52JNRWk1oj9vnAuUBbdjaaV97kMBHCGUkPEs43SvS5',
    sol_amount: 1187578008,
    token_amount: 32449596773180,
    is_buy: false,
    user: '9CWuALNvyFn1vfkm7QdvTYu1U9HGywGyrSg6PtPKhsJA',
    timestamp: 1715382066,
    mint: 'bM23MUvbnpDbzaPP3QD7vAtaEdRmrxFWFcCQcBgEu1i',
    virtual_sol_reserves: 33734478800,
    virtual_token_reserves: 954216610254050,
    tx_index: 1,
    name: 'DUMPY',
    symbol: 'DUMPY ',
    description: 'Real Cake That Cottage Cheese That Homecookin A Big Ol Caboose Ahhhh',
    image_uri: 'https://cf-ipfs.com/ipfs/QmQ7D9WewvnzmZ4x3TBPuB9QhUJyr8NB8MCacwD71g4mfA',
    metadata_uri: 'https://cf-ipfs.com/ipfs/QmV5NvVXuRszXihdnma7PXiq1bg7ktreowLd2rnxhUfzZ1',
    twitter: null,
    telegram: null,
    bonding_curve: '88FTRP5NnBTBJKYazEBqZU69B134bf8mQ6CeVxRFuRJk',
    associated_bonding_curve: 'GMDXkY5MAn4KJA2vLixwJS34vCQbMb5aR8H7GDjAVriY',
    creator: '6BivF5uBxxigJ79ae4VUMoZRvu7cfyKW8RcnomFaLPn7',
    created_timestamp: 1715381348901,
    raydium_pool: null,
    complete: false,
    total_supply: 1000000000000000,
    website: null,
    show_name: true,
    king_of_the_hill_timestamp: null,
    market_cap: 37.885991033,
    reply_count: 1,
    last_reply: 1715381534276,
    nsfw: false,
    market_id: null,
    inverted: null,
    username: 'billywalsh',
    profile_image: null,
    creator_username: 'hi62728',
    creator_profile_image: null,
    usd_market_cap: 5522.26205297008
  },
  {
    signature: '4QVgHyQ3qCnN97ZYVSUqyhHwDspifJVWwYEuZsTKRJ1bzqWeMMVLgrxSHruUJQy5eZbZjx4mrKW86FccsHojgvAQ',
    sol_amount: 196039603,
    token_amount: 2143015310195,
    is_buy: true,
    user: 'GNxeu7jZ5PPqkuq5ZdKpUUW1cUvvZsc2Kark4ZEBHRQs',
    timestamp: 1715382065,
    mint: 'BoBxCU5VPhxh3FVWLiM3VVPV6hUrufXvHwY8Hhuj3gYU',
    virtual_sol_reserves: 54363102247,
    virtual_token_reserves: 592129563506672,
    tx_index: 1,
    name: 'GayMysterio',
    symbol: 'MYSTERIO',
    description: 'Gay $MYSTERIO, the gayest wrestlemania wrestler of all time will come and shag solana in the bum. Buy $MYSTERIO. DEX PREPAID.',
    image_uri: 'https://cf-ipfs.com/ipfs/QmevvNcae7jRRML7rk5ZnmczQzjPH5o4z3bm9nczQwHc1e',
    metadata_uri: 'https://cf-ipfs.com/ipfs/QmZg2DCuQxns69PzTRsksr6oeHMuaSA5376pQdvoH86xYZ',
    twitter: 'https://twitter.com/GayMysterio_SOL',
    telegram: 'https://t.me/+Tl4H672cEfk0NDhk',
    bonding_curve: 'A9MuejLKiG5mQPcCxQWLyvbQV3rdwEjTsZuoMDrXxVBM',
    associated_bonding_curve: '5U2Wqr49cAFoagp9396GrRsanfb12vTEF9QBcE4KNZXW',
    creator: 'FYdzdsArAEPZmPNqqtbP9cqTBtr2nhVAZYMTpzt6ZtRH',
    created_timestamp: 1715381908945,
    raydium_pool: null,
    complete: true,
    total_supply: 1000000000000000,
    website: 'https://gaymysterio.xyz/',
    show_name: true,
    king_of_the_hill_timestamp: null,
    market_cap: 91.148514292,
    reply_count: 5,
    last_reply: 1715382029149,
    nsfw: false,
    market_id: null,
    inverted: null,
    username: 'bagboy',
    profile_image: null,
    creator_username: 'Mysterioo',
    creator_profile_image: null,
    usd_market_cap: 13285.80744320192
  },
  {
    signature: '42yYmgpdKugMXbrH1HKeDa9ijdq66Eis64EZiqvXWhp6GBxqWZLJd6Kq4Bvx6LPJvtUvkMERxeMZW2Erw8VJuxuG',
    sol_amount: 504101249,
    token_amount: 11794753687319,
    is_buy: false,
    user: 'BeN9RQpEG2L5yRJtDdNNDJHSAaHzT4wepzujuE8tJfRY',
    timestamp: 1715382065,
    mint: 'BA21YUhVXeikEkTxRzM7gS2uoJo2ahS2UkPK2GPY4HT',
    virtual_sol_reserves: 36840351927,
    virtual_token_reserves: 873770155581015,
    tx_index: 1,
    name: 'BIRD WIF ARMS',
    symbol: 'BWIF',
    description: 'WE ARE MIGRATING TO RAYDIUM!!!!!! JOIN THE FLOCK. INFINITE MEMES.',
    image_uri: 'https://cf-ipfs.com/ipfs/QmadaM4wAZmCiNosro8Py5hnnFuMdCsCdtz3wHpMVPuiZA',
    metadata_uri: 'https://cf-ipfs.com/ipfs/QmRJcHNXmgchLVWPZ2j6DPT4sFK6GfAxShqiUaxDnAsTBp',
    twitter: 'https://twitter.com/birdwifarms',
    telegram: 'https://t.me/birdwifportal',
    bonding_curve: '7MZ4aAUm794RbfKCgZE9tJvQXRwzpoUb4ozyPrjjEkRd',
    associated_bonding_curve: '5DMCM1QdRHB8yVNyhR1zPwoK2aPrZyfEweMoz6GCDEfy',
    creator: '4Zztcr1EDUnCSFn4rWwVoZwAk3HfcZWf11kTJWaEgNvy',
    created_timestamp: 1715366775336,
    raydium_pool: null,
    complete: false,
    total_supply: 1000000000000000,
    website: null,
    show_name: true,
    king_of_the_hill_timestamp: null,
    market_cap: 43.324267831,
    reply_count: 19,
    last_reply: 1715377887864,
    nsfw: false,
    market_id: null,
    inverted: null,
    creator_username: 'birb',
    creator_profile_image: 'https://cf-ipfs.com/ipfs/QmadaM4wAZmCiNosro8Py5hnnFuMdCsCdtz3wHpMVPuiZA',
    usd_market_cap: 6314.945279046559
    }
]

const mockCompleted = [
{
    signature: '3AE8ABLs4HQHq1NpPSnye5N5q2nLq2EpBMmon898gsPbNQCxCqgiUayFDxRKApoHNe9KwtmR6EvBheQso4tEUFQk',
    sol_amount: 150000001,
    token_amount: 672776524984,
    is_buy: true,
    user: '96Hf7V8z1wtvNuZF2fv2qSjZEtLbKWCxjPydEEpT6K6e',
    timestamp: 1715382067,
    mint: '9f5dMRhsndgwBuGoAxp7nUAoFwPJuUnQCLjp8qecx1ds',
    virtual_sol_reserves: 84792059672,
    virtual_token_reserves: 379634605152590,
    tx_index: 1,
    name: 'Museum Of Hats',
    symbol: 'MOHA',
    description: 'Museum with all Hats https://twitter.com/Muzeumofhats https://t.me/muzeumofhats',
    image_uri: 'https://cf-ipfs.com/ipfs/QmefGW6WdBwPt3WDz1cKg8xp2hzkx7Ehv3ydATYPhPa68j',
    metadata_uri: 'https://cf-ipfs.com/ipfs/QmSE4xdJBj3v867oFwytQ8Wf3yS6r91e49w67w5DXHGKUY',
    twitter: null,
    telegram: null,
    bonding_curve: 'A9zXsDT6yNNbyX1d6iwuhPoRNG7L5DHsJD2GN5e8Wvzx',
    associated_bonding_curve: 'FyV9DdFtnpMpMyet8mvGapBTUqCxngHSNEV4A9rdXYG9',
    creator: 'GkxhfxfpghkEfDpEKu9yzfMFUDXR9fmTWcLKwnZtw7gU',
    created_timestamp: 1715380168124,
    raydium_pool: null,
    complete: false,
    total_supply: 1000000000000000,
    website: null,
    show_name: true,
    king_of_the_hill_timestamp: 1715380233633,
    market_cap: 222.562231891,
    reply_count: 47,
    last_reply: 1715382066313,
    nsfw: false,
    market_id: null,
    inverted: null,
    username: 'sharinpack',
    profile_image: null,
    creator_username: 'Muzeum',
    creator_profile_image: null,
    usd_market_cap: 32440.67092043216
  },
]

async function pumpare() {
    let tokens = []
     
    const result = await getTokens(amountTokens)

    const filteredResult = filterOnlyRaydiumTokens(result)

    const filterSlowKoth = filterOutSlowKoth(filteredResult, maxTimeSecondsToKOTH)
    const rotateRPC = createRPCRotator();

    if (filterSlowKoth.length > 0) {

        //console.log("filterSlowKoth: ", filterSlowKoth)
        for (let token of filterSlowKoth) {
            // Få tag på startDeposit
            const transactions = await getWalletTransactions(token.creator)
            const createdAmount = await getFirstDeposit(transactions, token.created_timestamp, token.creator)
            if (createdAmount != null) {
                //console.log("createdAmount: ", createdAmount)
            }

            let createdTimestampInSeconds = Math.floor(token.created_timestamp / 1000);
            let KothTimestampInSeconds = Math.floor(token.king_of_the_hill_timestamp / 1000);
            let calcDifferenceSeconds = KothTimestampInSeconds - createdTimestampInSeconds

            //Få tag på antal transaktioner innan Raydium

            const totTransactionsAmount = await totTransactions(token.bonding_curve)

            const tokenDetails = {
                creator: token.creator,
                token: token.mint,
                startDeposit: createdAmount[0].amount,           
                timeToKOTH: `${calcDifferenceSeconds} seconds`,       
                transactions: totTransactionsAmount
            }
            
            tokens.push(tokenDetails)
        }    
    } else {
        console.log("FilterSlowKoth is empty")
    
    }

    async function totTransactions(bonding_curve) {
        const signatures = await rotateRPC().getSignaturesForAddress(getPublickey(bonding_curve), {commitment: "finalized"});
        //console.log("Signatures amount: ", signatures)
        const filterErrSignatures = signatures.filter(signature => signature.err == null)
        return filterErrSignatures.length
    }

    async function getTokens(amount) {

        let correctAmount = amount % 50
        if (correctAmount != 0) {
            amount = amount - correctAmount
        }
        const apiLoops = amount / 50

        let resultArray = []
        for (let i = 0; i < apiLoops; i++){
            try {
                let amount = 50 * i
                const response = await fetch(`https://client-api-2-74b1891ee9f9.herokuapp.com/coins?offset=${amount}&limit=50&sort=last_trade_timestamp&order=DESC&includeNsfw=false`) 
                const data = await response.json()
                if (data) {
                    for (let token of data) {
                        resultArray.push(token)
                    }                
                }                
            } catch {
                console.log("Api error on step: ", i)
                i--
            }
        }
        return resultArray
    }

    function filterOnlyRaydiumTokens(arr) {
        const filteredArray = arr.filter(token => token.complete == true)
        return filteredArray
    }

    function filterOutSlowKoth(arr, maxSec) {

        const filteredArray = arr.filter(token => {
            let createdTimestampInSeconds = Math.floor(token.created_timestamp / 1000);
            let KothTimestampInSeconds = Math.floor(token.king_of_the_hill_timestamp / 1000);
            let calcDifferenceSeconds = KothTimestampInSeconds - createdTimestampInSeconds
            if (calcDifferenceSeconds <= maxSec) {
                return token  
            }
        })
        return filteredArray
    }

    async function getWalletTransactions(wallet) {
        const signatures = await rotateRPC().getSignaturesForAddress(getPublickey(wallet), { limit: 500, commitment: "finalized" });
        if (signatures) {
            return signatures
        }
        return []

    }

    async function getFirstDeposit(arr, timestamp, wallet) {
        let transactions = []
        let createdTimestampInSeconds = Math.floor(timestamp / 1000);
        for (let transaction of arr) {
            let different = createdTimestampInSeconds - transaction.blockTime
            if (different < 3 && different > -3) {
                transactions.push(transaction)
            }
        }
        if (transactions.length > 0) {
            let transactionData = []
            for (let transaction of transactions) {

                const url = "https://api.helius.xyz/v0/transactions/?api-key=214a5e1f-bfc9-4e59-a1ce-f96533457125";

                const parseTransaction = async () => {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                    'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                    transactions: [transaction.signature],
                    }),
                });

                const data = await response.json();
                return data
                };

                const result = await parseTransaction();

                //Hitta mottagaren till creators sol
                let receiverWallet = ''
                for (let tokenTransfer of result[0].tokenTransfers) {
                    if (tokenTransfer.toUserAccount == wallet) {
                        receiverWallet = tokenTransfer.fromUserAccount
                    }
                }
                //Hitta hur mycket SOL creator skickar till receiverWallet
                let creatorSentAmount = 0
                for (let nativeTransfer of result[0].nativeTransfers) {
                    if (nativeTransfer.fromUserAccount == wallet && nativeTransfer.toUserAccount == receiverWallet) {
                        creatorSentAmount = nativeTransfer.amount / LAMPORTS_PER_SOL
                        transactionData.push({'FromCreator': wallet, 'toWallet': receiverWallet, 'amount': creatorSentAmount})
                    }
                }
            }
            //Slå ihop amount om creator skickat ut mer sol till samma wallet

            if (transactionData.length > 1) {
                let amount = 0
                let creator = ''
                let receiverWallet = ''
                for (let obj of transactionData) {
                    creator = obj.FromCreator
                    receiverWallet = obj.toWallet
                    amount += obj.amount
                }
                transactionData = []
                transactionData.push({'FromCreator': creator, 'toWallet': receiverWallet, 'amount': Math.floor(amount)})
            } 
            return transactionData
            
        }
        return null
    }

    function getPublickey(wallet) {
    const publicKeyGet = new web3.PublicKey(wallet);
    return publicKeyGet
    }

    function createRPCRotator() {
    const RPCs = [
        'https://mainnet.helius-rpc.com/?api-key=214a5e1f-bfc9-4e59-a1ce-f96533457125', 'https://mainnet.helius-rpc.com/?api-key=048c7f8e-9afc-4608-b1c3-0bf54990561f'
    ];
    return function () {
        RPCs.push(RPCs.shift())
        return new web3.Connection(RPCs[0], 'confirmed');
    }
    }

    return tokens
}
const result = await pumpare()

console.log("Finnished result: ", result)


