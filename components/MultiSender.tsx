'use client';

import { FC, useState, useEffect, useMemo } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import {
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  Connection,
  TransactionMessage,
  VersionedTransaction,
  ComputeBudgetProgram,
} from '@solana/web3.js';
import {
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddressSync,
  createTransferInstruction,
  getAccount,
  getMint,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import Image from 'next/image';

interface Recipient {
  address: string;
  amount: string;
}

interface TokenInfo {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
  balance?: number;
}

// Devnet token list
const DEVNET_TOKENS: TokenInfo[] = [
  {
    address: "So11111111111111111111111111111111111111112",
    symbol: "SOL",
    name: "Solana",
    decimals: 9,
    logoURI: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png"
  },
  {
    address: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
    symbol: "USDC",
    name: "USD Coin (Devnet)",
    decimals: 6,
    logoURI: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png"
  },
  {
    address: "3vxj94fSd3jrhaGAwaEKGDPEwn5Yqs81Ay3GAGgqQxcZ",
    symbol: "SRM",
    name: "Serum (Devnet)",
    decimals: 6,
    logoURI: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/SRMuApVNdxXokk5GT7XD5cUUgXMBCoAz2LHeuAoKWRt/logo.png"
  },
  {
    address: "BLwTnYKqf7u4qjgZrrsKeNs2EzWkMLqVCu6j8iHyrNA3",
    symbol: "BTC",
    name: "Bitcoin (Devnet)",
    decimals: 8,
    logoURI: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/9n4nbM75f5Ui33ZbPYXn59EwSgE8CGsHtAeTH5YFeJ9E/logo.png"
  },
  {
    address: "CtMyWsrUtAwXWiGr9WjHT5fC3p3fgV8cyGpLTo2LJzG1",
    symbol: "ETH",
    name: "Ethereum (Devnet)",
    decimals: 8,
    logoURI: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs/logo.png"
  }
];

export const MultiSender: FC = () => {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();

  const [recipients, setRecipients] = useState<Recipient[]>([{ address: '', amount: '' }]);
  const [selectedToken, setSelectedToken] = useState<TokenInfo | null>(null);
  const [customTokenAddress, setCustomTokenAddress] = useState<string>('');
  const [customTokenInfo, setCustomTokenInfo] = useState<TokenInfo | null>(null);
  const [isLoadingCustomToken, setIsLoadingCustomToken] = useState<boolean>(false);
  const [customTokenError, setCustomTokenError] = useState<string>('');
  const [isSendingSol, setIsSendingSol] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [status, setStatus] = useState<string>('');
  const [txSignature, setTxSignature] = useState<string>('');
  const [solBalance, setSolBalance] = useState<number>(0);
  const [tokenBalances, setTokenBalances] = useState<Map<string, number>>(new Map());
  const [showTokenSelector, setShowTokenSelector] = useState<boolean>(false);
  const [userTokens, setUserTokens] = useState<TokenInfo[]>([]);

  // Combine default tokens with user-added tokens
  const allTokens = useMemo(() => {
    return [...DEVNET_TOKENS, ...userTokens];
  }, [userTokens]);

  // Fetch SOL balance when wallet connects
  useEffect(() => {
    const fetchSolBalance = async () => {
      if (!publicKey) {
        setSolBalance(0);
        return;
      }

      try {
        const balance = await connection.getBalance(publicKey);
        setSolBalance(balance / LAMPORTS_PER_SOL);
      } catch (error) {
        console.error('Error fetching SOL balance:', error);
      }
    };

    fetchSolBalance();
    const intervalId = setInterval(fetchSolBalance, 20000); // Refresh every 20 seconds

    return () => clearInterval(intervalId);
  }, [publicKey, connection, txSignature]);

  // Fetch token balances when wallet connects or token changes
  useEffect(() => {
    const fetchTokenBalances = async () => {
      if (!publicKey) {
        setTokenBalances(new Map());
        return;
      }

      const balances = new Map<string, number>();

      for (const token of allTokens) {
        if (token.symbol === 'SOL') continue; // Skip SOL as it's handled separately

        try {
          const tokenMint = new PublicKey(token.address);
          const tokenAccount = getAssociatedTokenAddressSync(tokenMint, publicKey);
          
          try {
            const accountInfo = await getAccount(connection, tokenAccount);
            const amount = Number(accountInfo.amount);
            balances.set(token.address, amount / Math.pow(10, token.decimals));
          } catch (error) {
            // Token account doesn't exist or other error
            balances.set(token.address, 0);
          }
        } catch (error) {
          console.error(`Error fetching balance for ${token.symbol}:`, error);
        }
      }

      setTokenBalances(balances);
    };

    fetchTokenBalances();
    const intervalId = setInterval(fetchTokenBalances, 30000); // Refresh every 30 seconds

    return () => clearInterval(intervalId);
  }, [publicKey, connection, txSignature, allTokens]);

  // Handle token selection
  const handleTokenSelect = (token: TokenInfo) => {
    setSelectedToken(token);
    setShowTokenSelector(false);
    
    // If it's not SOL, switch to token mode
    if (token.symbol !== 'SOL') {
      setIsSendingSol(false);
    } else {
      setIsSendingSol(true);
    }
  };

  // Add a custom token
  const addCustomToken = async () => {
    if (!customTokenAddress) {
      setCustomTokenError('Please enter a token address');
      return;
    }

    setIsLoadingCustomToken(true);
    setCustomTokenError('');

    try {
      // Validate the address is a valid public key
      const tokenMint = new PublicKey(customTokenAddress);
      
      // Check if token already exists in our lists
      const existingToken = allTokens.find(t => t.address === customTokenAddress);
      if (existingToken) {
        setCustomTokenError('Token already added');
        setIsLoadingCustomToken(false);
        return;
      }

      // Fetch token info from blockchain
      const mintInfo = await getMint(connection, tokenMint);
      
      // Create token info
      const newToken: TokenInfo = {
        address: customTokenAddress,
        symbol: `SPL Token`,
        name: `Custom SPL Token (${customTokenAddress.slice(0, 4)}...${customTokenAddress.slice(-4)})`,
        decimals: mintInfo.decimals,
        logoURI: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png" // Default logo
      };

      // Add to user tokens
      setUserTokens(prev => [...prev, newToken]);
      
      // Select the new token
      setSelectedToken(newToken);
      setIsSendingSol(false);
      setCustomTokenAddress('');
      setCustomTokenInfo(newToken);
      
    } catch (error) {
      console.error('Error adding custom token:', error);
      setCustomTokenError('Invalid token address or token not found');
    } finally {
      setIsLoadingCustomToken(false);
    }
  };

  const addRecipient = () => {
    setRecipients([...recipients, { address: '', amount: '' }]);
  };

  const removeRecipient = (index: number) => {
    const newRecipients = [...recipients];
    newRecipients.splice(index, 1);
    setRecipients(newRecipients);
  };

  const updateRecipient = (index: number, field: 'address' | 'amount', value: string) => {
    const newRecipients = [...recipients];
    newRecipients[index][field] = value;
    setRecipients(newRecipients);
  };

  const validateInputs = (): boolean => {
    // Check if wallet is connected
    if (!publicKey) {
      setStatus('Please connect your wallet first');
      return false;
    }
    
    // Check if we have at least one recipient
    if (recipients.length === 0) {
      setStatus('Please add at least one recipient');
      return false;
    }
    
    // Check if all recipients have valid addresses and amounts
    for (const recipient of recipients) {
      if (!recipient.address || !recipient.amount) {
        setStatus('Please fill in all recipient addresses and amounts');
        return false;
      }
      
      try {
        new PublicKey(recipient.address);
      } catch (error) {
        setStatus(`Invalid address: ${recipient.address}`);
        return false;
      }
      
      const amount = parseFloat(recipient.amount);
      if (isNaN(amount) || amount <= 0) {
        setStatus('All amounts must be positive numbers');
        return false;
      }
    }
    
    // If sending tokens, validate token selection
    if (!isSendingSol && !selectedToken) {
      setStatus('Please select a token');
      return false;
    }
    
    return true;
  };

  // Simulate transaction to check if it would succeed
  const simulateTransaction = async (transaction: Transaction): Promise<boolean> => {
    try {
      setIsSimulating(true);
      
      // Get the latest blockhash
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;
      
      // Simulate the transaction
      const simulationResult = await connection.simulateTransaction(transaction);
      
      if (simulationResult.value.err) {
        console.error('Simulation error:', simulationResult.value.err);
        
        // Check if the error is related to insufficient balance
        const errorMessage = JSON.stringify(simulationResult.value.err);
        if (errorMessage.includes('insufficient funds') || errorMessage.includes('0x1')) {
          setStatus('Wallet unable to complete the simulation. Please check your balance.');
          return false;
        }
        
        setStatus(`Simulation error: ${JSON.stringify(simulationResult.value.err)}`);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error simulating transaction:', error);
      setStatus(`Error during simulation: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    } finally {
      setIsSimulating(false);
    }
  };

  const sendSol = async () => {
    if (!validateInputs() || !publicKey) return;

    try {
      setIsLoading(true);
      setStatus('Creating transaction...');
      setTxSignature('');

      const transaction = new Transaction();
      
      // Add a compute budget instruction to increase the compute limit
      transaction.add(
        ComputeBudgetProgram.setComputeUnitLimit({
          units: 1000000 // Increase compute units
        })
      );

      // Add transfer instructions for each recipient
      for (const recipient of recipients) {
        const recipientPubkey = new PublicKey(recipient.address);
        const lamports = parseFloat(recipient.amount) * LAMPORTS_PER_SOL;

        transaction.add(
          SystemProgram.transfer({
            fromPubkey: publicKey,
            toPubkey: recipientPubkey,
            lamports,
          })
        );
      }

      // Simulate the transaction first
      const simulationSuccess = await simulateTransaction(transaction);
      if (!simulationSuccess) {
        setIsLoading(false);
        return;
      }

      setStatus('Sending transaction...');
      
      // Get the latest blockhash
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;
      
      // Send the transaction
      const signature = await sendTransaction(transaction, connection, {
        skipPreflight: false, // Enable preflight checks
        preflightCommitment: 'confirmed',
        maxRetries: 3
      });
      
      setTxSignature(signature);

      // Wait for confirmation
      setStatus('Confirming transaction...');
      const confirmation = await connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight
      }, 'confirmed');
      
      if (confirmation.value.err) {
        throw new Error(`Transaction failed to confirm: ${confirmation.value.err.toString()}`);
      }

      setStatus('Transaction confirmed!');
      console.log('Transaction signature:', signature);

    } catch (error) {
      console.error('Error sending SOL:', error);
      
      // Handle specific error messages
      let errorMessage = error instanceof Error ? error.message : String(error);
      
      if (errorMessage.includes('insufficient funds') || errorMessage.includes('0x1')) {
        errorMessage = 'Wallet unable to complete the simulation. Please check your balance.';
      } else if (errorMessage.includes('Transaction simulation failed')) {
        errorMessage = 'Transaction simulation failed. Please try again with different parameters.';
      } else if (errorMessage.includes('User rejected')) {
        errorMessage = 'Transaction was rejected by the user.';
      }
      
      setStatus(`Error: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const sendTokens = async () => {
    if (!validateInputs() || !publicKey || !selectedToken) return;

    try {
      setIsLoading(true);
      setStatus('Creating token transaction...');
      setTxSignature('');

      const tokenPublicKey = new PublicKey(selectedToken.address);
      const transaction = new Transaction();
      
      // Add a compute budget instruction to increase the compute limit
      transaction.add(
        ComputeBudgetProgram.setComputeUnitLimit({
          units: 1000000 // Increase compute units
        })
      );

      // Find the sender's associated token account
      const senderTokenAccount = getAssociatedTokenAddressSync(
        tokenPublicKey,
        publicKey
      );

      // Add transfer instructions for each recipient
      for (const recipient of recipients) {
        const recipientPubkey = new PublicKey(recipient.address);

        // Find or create the recipient's associated token account
        const recipientTokenAccount = getAssociatedTokenAddressSync(
          tokenPublicKey,
          recipientPubkey
        );

        // Check if recipient token account exists
        const recipientAccountInfo = await connection.getAccountInfo(recipientTokenAccount);

        // If recipient token account doesn't exist, create it
        if (!recipientAccountInfo) {
          transaction.add(
            createAssociatedTokenAccountInstruction(
              publicKey,
              recipientTokenAccount,
              recipientPubkey,
              tokenPublicKey
            )
          );
        }

        const decimals = selectedToken.decimals;
        const amount = parseFloat(recipient.amount) * Math.pow(10, decimals);

        // Add transfer instruction
        transaction.add(
          createTransferInstruction(
            senderTokenAccount,
            recipientTokenAccount,
            publicKey,
            Math.floor(amount)
          )
        );
      }

      // Simulate the transaction first
      const simulationSuccess = await simulateTransaction(transaction);
      if (!simulationSuccess) {
        setIsLoading(false);
        return;
      }

      setStatus('Sending token transaction...');
      
      // Get the latest blockhash
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;
      
      // Send the transaction
      const signature = await sendTransaction(transaction, connection, {
        skipPreflight: false, // Enable preflight checks
        preflightCommitment: 'confirmed',
        maxRetries: 3
      });
      
      setTxSignature(signature);

      // Wait for confirmation
      setStatus('Confirming transaction...');
      const confirmation = await connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight
      }, 'confirmed');
      
      if (confirmation.value.err) {
        throw new Error(`Transaction failed to confirm: ${confirmation.value.err.toString()}`);
      }

      setStatus('Transaction confirmed!');
      console.log('Token transaction signature:', signature);

    } catch (error) {
      console.error('Error sending tokens:', error);
      
      // Handle specific error messages
      let errorMessage = error instanceof Error ? error.message : String(error);
      
      if (errorMessage.includes('insufficient funds') || errorMessage.includes('0x1')) {
        errorMessage = 'Wallet unable to complete the simulation. Please check your balance.';
      } else if (errorMessage.includes('Transaction simulation failed')) {
        errorMessage = 'Transaction simulation failed. Please try again with different parameters.';
      } else if (errorMessage.includes('User rejected')) {
        errorMessage = 'Transaction was rejected by the user.';
      }
      
      setStatus(`Error: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Get the current token balance
  const getCurrentBalance = () => {
    if (isSendingSol) {
      return solBalance;
    } else if (selectedToken) {
      return tokenBalances.get(selectedToken.address) || 0;
    }
    return 0;
  };

  // Get the current token symbol
  const getCurrentSymbol = () => {
    if (isSendingSol) {
      return 'SOL';
    } else if (selectedToken) {
      return selectedToken.symbol;
    }
    return '';
  };

  // Format number with limited decimal places
  const formatNumber = (num: number): string => {
    if (num === 0) return '0';
    if (num < 0.001) return '< 0.001';
    return num.toLocaleString(undefined, { maximumFractionDigits: 6 });
  };

  return (
    <div className="w-full max-w-xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Multi-Send</h2>
        
        {publicKey && (
          <div className="text-right">
            <div className="text-sm text-gray-500 dark:text-gray-400">Your Balance</div>
            <div className="font-medium text-lg">
              {formatNumber(getCurrentBalance())} {getCurrentSymbol()}
            </div>
          </div>
        )}
      </div>

      <div className="mb-6">
        <div className="relative">
          <button
            onClick={() => setShowTokenSelector(!showTokenSelector)}
            className="w-full flex items-center justify-between p-3 border rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
          >
            <div className="flex items-center">
              {selectedToken?.logoURI ? (
                <div className="w-6 h-6 mr-2 rounded-full overflow-hidden bg-white">
                  <img 
                    src={selectedToken.logoURI} 
                    alt={selectedToken.symbol}
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : (
                <div className="w-6 h-6 mr-2 rounded-full bg-purple-100 flex items-center justify-center">
                  <span className="text-xs font-bold text-purple-600">
                    {isSendingSol ? 'SOL' : '?'}
                  </span>
                </div>
              )}
              <span className="font-medium">
                {selectedToken ? selectedToken.symbol : 'SOL'}
              </span>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>

          {showTokenSelector && (
            <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {allTokens.map((token) => (
                <button
                  key={token.address}
                  className="w-full flex items-center p-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  onClick={() => handleTokenSelect(token)}
                >
                  <div className="w-6 h-6 mr-2 rounded-full overflow-hidden bg-white">
                    {token.logoURI && (
                      <img 
                        src={token.logoURI} 
                        alt={token.symbol}
                        className="w-full h-full object-contain"
                      />
                    )}
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="font-medium">{token.symbol}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{token.name}</span>
                  </div>
                  <div className="ml-auto text-sm">
                    {token.symbol === 'SOL' 
                      ? formatNumber(solBalance)
                      : formatNumber(tokenBalances.get(token.address) || 0)
                    }
                  </div>
                </button>
              ))}
              
              <div className="p-3 border-t border-gray-200 dark:border-gray-700">
                <div className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Add Custom Token</div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="flex-grow p-2 text-sm border rounded dark:bg-gray-700 dark:border-gray-600"
                    placeholder="Enter SPL token address"
                    value={customTokenAddress}
                    onChange={(e) => setCustomTokenAddress(e.target.value)}
                  />
                  <button
                    className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:opacity-50"
                    onClick={addCustomToken}
                    disabled={isLoadingCustomToken || !customTokenAddress}
                  >
                    {isLoadingCustomToken ? 'Loading...' : 'Add'}
                  </button>
                </div>
                {customTokenError && (
                  <p className="text-xs text-red-500 mt-1">{customTokenError}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-medium mb-3 text-gray-800 dark:text-white">Recipients</h3>
        
        <div className="space-y-3">
          {recipients.map((recipient, index) => (
            <div key={index} className="flex gap-2 items-center">
              <div className="flex-grow">
                <input
                  type="text"
                  className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Recipient address"
                  value={recipient.address}
                  onChange={(e) => updateRecipient(index, 'address', e.target.value)}
                />
              </div>
              <div className="w-28">
                <input
                  type="text"
                  className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Amount"
                  value={recipient.amount}
                  onChange={(e) => updateRecipient(index, 'amount', e.target.value)}
                />
              </div>
              <button
                className="p-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                onClick={() => removeRecipient(index)}
                disabled={recipients.length === 1}
                aria-label="Remove recipient"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          ))}
        </div>
        
        <button
          className="mt-3 py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center"
          onClick={addRecipient}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Add Recipient
        </button>
      </div>

      <button
        className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-lg shadow-md"
        onClick={isSendingSol ? sendSol : sendTokens}
        disabled={isLoading || isSimulating || !publicKey}
      >
        {isLoading || isSimulating ? (
          <div className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {isSimulating ? 'Simulating...' : 'Processing...'}
          </div>
        ) : (
          `Send ${isSendingSol ? 'SOL' : selectedToken?.symbol || 'Tokens'}`
        )}
      </button>

      {status && (
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
          <p className="text-sm">{status}</p>
          
          {txSignature && (
            <div className="mt-2">
              <a 
                href={`https://explorer.solana.com/tx/${txSignature}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 text-sm flex items-center"
              >
                View on Solana Explorer
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                  <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                </svg>
              </a>
              <a 
                href={`https://solscan.io/tx/${txSignature}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 text-sm flex items-center mt-1"
              >
                View on Solscan
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                  <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                </svg>
              </a>
            </div>
          )}
        </div>
      )}
      
      <div className="mt-6 text-xs text-gray-500 dark:text-gray-400">
        <p>Note: This app is connected to Solana Devnet. Make sure your wallet is set to Devnet.</p>
        <p className="mt-1">Need Devnet tokens? Use the <a href="https://solfaucet.com/" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">Solana Faucet</a>.</p>
      </div>
    </div>
  );
};