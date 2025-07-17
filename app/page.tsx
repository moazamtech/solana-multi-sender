'use client';

import Image from "next/image";
import { WalletConnect } from "../components/WalletConnect";
import { MultiSender } from "../components/MultiSender";

export default function Home() {
  return (
    <div className="font-sans min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-5xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <header className="flex flex-col items-center mb-12">
          <div className="flex items-center mb-6">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-3 rounded-full mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white">Solana Multi-Sender</h1>
          </div>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 text-center max-w-2xl">
            Send SOL and tokens to multiple addresses in a single transaction
          </p>
          <WalletConnect />
        </header>
        
        <main className="flex flex-col items-center">
          <div className="w-full">
            <MultiSender />
          </div>
          
          <div className="mt-16 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 max-w-3xl w-full">
            <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">How to use</h2>
            <ol className="space-y-4">
              <li className="flex">
                <div className="flex-shrink-0 h-8 w-8 flex items-center justify-center rounded-full bg-purple-100 text-purple-600 font-bold mr-3">1</div>
                <div>
                  <p className="text-gray-700 dark:text-gray-300">Connect your Phantom or Solflare wallet using the button above</p>
                </div>
              </li>
              <li className="flex">
                <div className="flex-shrink-0 h-8 w-8 flex items-center justify-center rounded-full bg-purple-100 text-purple-600 font-bold mr-3">2</div>
                <div>
                  <p className="text-gray-700 dark:text-gray-300">Select a token from the dropdown menu (SOL, built-in tokens, or add your own custom SPL token)</p>
                </div>
              </li>
              <li className="flex">
                <div className="flex-shrink-0 h-8 w-8 flex items-center justify-center rounded-full bg-purple-100 text-purple-600 font-bold mr-3">3</div>
                <div>
                  <p className="text-gray-700 dark:text-gray-300">Add recipient addresses and amounts</p>
                </div>
              </li>
              <li className="flex">
                <div className="flex-shrink-0 h-8 w-8 flex items-center justify-center rounded-full bg-purple-100 text-purple-600 font-bold mr-3">4</div>
                <div>
                  <p className="text-gray-700 dark:text-gray-300">Click "Send" to execute the transaction</p>
                </div>
              </li>
              <li className="flex">
                <div className="flex-shrink-0 h-8 w-8 flex items-center justify-center rounded-full bg-purple-100 text-purple-600 font-bold mr-3">5</div>
                <div>
                  <p className="text-gray-700 dark:text-gray-300">View transaction details on Solana Explorer or Solscan</p>
                </div>
              </li>
            </ol>
            
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300">Note</h3>
                  <div className="mt-2 text-sm text-blue-700 dark:text-blue-200">
                    <p>This app is connected to Solana Devnet. Make sure your wallet is set to Devnet.</p>
                    <p className="mt-1">Need Devnet tokens? Use the <a href="https://solfaucet.com/" target="_blank" rel="noopener noreferrer" className="font-medium underline">Solana Faucet</a>.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
        
        <footer className="mt-16 border-t border-gray-200 dark:border-gray-700 pt-8 flex flex-col items-center">
          <div className="flex items-center gap-2 mb-4">
            <Image
              src="/next.svg"
              alt="Next.js logo"
              width={80}
              height={20}
              className="dark:invert"
            />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Powered by Solana Blockchain | {new Date().getFullYear()}
          </p>
        </footer>
      </div>
    </div>
  );
}