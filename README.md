# Solana Multi-Sender

A powerful and user-friendly web application built with Next.js 15 that enables users to send SOL and SPL tokens to multiple recipients in a single transaction on the Solana blockchain.

![Solana Multi-Sender](https://img.shields.io/badge/Solana-Multi--Sender-9945FF?style=for-the-badge&logo=solana&logoColor=white)

## 🌟 Features

- **Multi-Recipient Transfers**: Send SOL or SPL tokens to multiple wallet addresses simultaneously
- **Wallet Integration**: Seamless connection with Phantom and Solflare wallets
- **Custom Token Support**: Add and send any SPL token by providing the token mint address
- **Built-in Token Library**: Pre-loaded with popular SPL tokens for easy selection
- **Transaction Tracking**: Direct links to view transactions on Solana Explorer and Solscan
- **Devnet Support**: Connected to Solana Devnet for safe testing and development
- **Responsive Design**: Beautiful, mobile-friendly interface built with Tailwind CSS
- **Type Safety**: Full TypeScript implementation for better development experience

## 🚀 Live Demo

Visit the live application: [https://solana-transection.vercel.app/](https://solana-transection.vercel.app/)

## 🛠️ Tech Stack

- **Framework**: Next.js 15
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Blockchain**: Solana Web3.js
- **Wallet Integration**: Solana Wallet Adapter
- **Deployment**: Vercel

## 📋 Prerequisites

Before running this project, make sure you have:

- Node.js 18+ installed
- A Solana wallet (Phantom or Solflare) configured for Devnet
- Devnet SOL tokens (get them from [Solana Faucet](https://solfaucet.com/))

## ⚡ Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/moazamtech/solana-multi-sender.git
   cd solana-multi-sender

2.   pnpm install
3.   pnpm run dev

Set up environment variables
bashcp .env.example .env.local
Add your environment variables:
envNEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_SOLANA_NETWORK=devnet

Open your browser
Navigate to http://localhost:3000

🔧 How to Use

Connect Wallet: Click the wallet connection button and select your preferred wallet (Phantom or Solflare)
Select Token: Choose from the dropdown menu:

SOL (native Solana token)
Pre-loaded SPL tokens
Add custom SPL token by entering the mint address


Add Recipients: Enter recipient wallet addresses and the amount to send to each
Execute Transaction: Click "Send" to create and execute the multi-send transaction
Track Transaction: View your transaction details on Solana Explorer or Solscan

🔒 Security Features

Devnet Only: Application is configured for Solana Devnet to prevent accidental mainnet transactions
Wallet Verification: Transactions require wallet approval before execution
Input Validation: All addresses and amounts are validated before processing
Error Handling: Comprehensive error handling for failed transactions

🤝 Contributing
Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

Fork the project
Create your feature branch (git checkout -b feature/AmazingFeature)
Commit your changes (git commit -m 'Add some AmazingFeature')
Push to the branch (git push origin feature/AmazingFeature)
Open a Pull Request

📝 License
This project is open source and available under the MIT License.
⚠️ Disclaimer
This application is currently configured for Solana Devnet only. Do not use with mainnet tokens without proper testing and security audits. Always verify recipient addresses before sending transactions.
🙏 Acknowledgments

Solana Web3.js for blockchain interaction
Solana Wallet Adapter for wallet integration
Next.js for the amazing React framework
Tailwind CSS for the utility-first CSS framework

📞 Support
If you have any questions or need help, please open an issue on GitHub or contact @moazamtech.

Made with ❤️ by moazamtech
