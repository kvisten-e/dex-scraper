# Dex-Scraper (BETA)

## Disclaimer
The code has been written in an exploratory and experimental phase without having undergone refinement. Please consider it as such.

## Overview
The Solana Token Discovery Tool is a cutting-edge React application designed to automate the exploration and identification of potentially lucrative tokens soon to be traded on the Solana blockchain. By scraping decentralized and centralized exchanges (DEX/CEX) for wallet addresses that have received Solana (SOL), this tool meticulously tracks these wallets. It further investigates each discovered wallet to determine if they have distributed Solana to other wallets, providing an early insight into new tokens poised for trading.

## Key Features

- **Exchange Scraper**: Automatically scrapes both DEXes and CEXes for wallets that have recently received Solana transactions.
- **Wallet Tracker**: Monitors the activity of these wallets, including whether they have sent Solana to other addresses.
- **Token Discovery**: Helps in identifying new tokens that might soon be listed on the Solana blockchain, potentially before they become widely known.
- **Early Access**: Aims to provide users with an early entry point into trading new tokens, possibly leading to advantageous investment opportunities.

## Technology Stack

- **React**: For building a dynamic and responsive front-end user interface.
- **Solana Web3.js**: Utilized for blockchain interactions and wallet transactions.
- **Node.js & Express**: For backend services, including exchange scraping and data processing.

## Project Status

This project is currently in development. Significant progress has been made, but several key components are still under construction. Contributions, suggestions, and feedback are highly welcome as we work towards completing this innovative tool.

## Getting Started

(Note: These steps will be updated as the project progresses.)

1. Ensure you have Node.js and npm installed on your system.
2. Clone the repository to your local machine.
3. Navigate to the project directory and install the dependencies with `npm install`.
4. Set up a .env file with your RPCS ex. VITE_RPC_3 = "" & VITE_RPC_4 = ""
5. Start the development server with `npm run dev`.
