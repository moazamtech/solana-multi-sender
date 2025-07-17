'use client';

import { FC } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

export const WalletConnect: FC = () => {
  const { publicKey } = useWallet();

  return (
    <div className="flex flex-col items-center gap-4">
      <WalletMultiButton className="wallet-button" />
      {publicKey && (
        <p className="text-sm font-mono">
          Connected: {publicKey.toString().slice(0, 6)}...{publicKey.toString().slice(-6)}
        </p>
      )}
    </div>
  );
};