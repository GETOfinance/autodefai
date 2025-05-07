"use client";

import React, { createContext, useState, useEffect } from 'react';

// Define Open Campus Codex network
const OPEN_CAMPUS_CODEX = {
  id: 656476,
  name: "Open Campus Codex",
  chainId: "0xA02BC", // 656476 in hex
  rpcUrl: "https://rpc.open-campus-codex.gelato.digital",
  nativeCurrency: {
    name: "EDU",
    symbol: "EDU",
    decimals: 18,
  },
  blockExplorerUrl: "https://opencampus-codex.blockscout.com",
};

// Create a React context for wallet connection status

export const WalletContext = createContext({
  isConnected: false,
  address: '',
  chainId: 0,
  connect: async () => {},
  disconnect: () => {},
});

export function AppKit({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState('');
  const [chainId, setChainId] = useState(0);

  // Function to check if MetaMask is installed
  const isMetaMaskInstalled = () => {
    // @ts-ignore
    return typeof window !== 'undefined' && window.ethereum !== undefined;
  };

  // Function to connect to wallet
  const connect = async () => {
    try {
      if (!isMetaMaskInstalled()) {
        console.error('MetaMask is not installed');
        alert('Please install MetaMask to use this feature');
        window.open('https://metamask.io/download/', '_blank');
        return;
      }

      console.log('Requesting accounts...');

      try {
        // @ts-ignore
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts',
          params: []
        });

        console.log('Accounts received:', accounts);

        if (accounts && accounts.length > 0) {
          setAddress(accounts[0]);
          setIsConnected(true);

          // @ts-ignore
          const chainIdHex = await window.ethereum.request({ method: 'eth_chainId' });
          const currentChainId = parseInt(chainIdHex, 16);
          setChainId(currentChainId);

          console.log('Current chain ID:', currentChainId);

          // Only switch if not already on Open Campus Codex
          if (currentChainId !== 656476) {
            console.log('Switching to Open Campus Codex...');

            try {
              // @ts-ignore
              await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: '0xA02BC' }], // 656476 in hex
              });

              console.log('Successfully switched to Open Campus Codex');
            } catch (switchError: any) {
              console.log('Error switching chain:', switchError);

              // This error code indicates that the chain has not been added to MetaMask
              if (switchError.code === 4902) {
                console.log('Open Campus Codex not found, adding network...');

                try {
                  // @ts-ignore
                  await window.ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [
                      {
                        chainId: '0xA02BC', // 656476 in hex
                        chainName: 'Open Campus Codex',
                        nativeCurrency: {
                          name: 'EDU',
                          symbol: 'EDU',
                          decimals: 18
                        },
                        rpcUrls: ['https://rpc.open-campus-codex.gelato.digital'],
                        blockExplorerUrls: ['https://opencampus-codex.blockscout.com']
                      }
                    ],
                  });

                  console.log('Open Campus Codex added successfully');
                } catch (addError) {
                  console.error('Error adding Open Campus Codex network:', addError);
                }
              } else {
                console.error('Error switching to Open Campus Codex:', switchError);
              }
            }
          }
        } else {
          console.error('No accounts found or user rejected');
        }
      } catch (accountsError) {
        console.error('Error requesting accounts:', accountsError);
        if (accountsError.code === 4001) {
          // User rejected request
          alert('Please connect to MetaMask to use this feature');
        }
      }
    } catch (error) {
      console.error('Error connecting to wallet:', error);
      alert('Error connecting to wallet. Please make sure MetaMask is installed and unlocked.');
    }
  };

  // Function to disconnect from wallet
  const disconnect = () => {
    setIsConnected(false);
    setAddress('');
  };

  // Listen for account changes
  useEffect(() => {
    // Only run in browser environment
    if (typeof window === 'undefined') return;

    const setupListeners = () => {
      // @ts-ignore
      if (window.ethereum) {
        console.log('Setting up MetaMask event listeners');

        // Check if already connected
        const checkConnection = async () => {
          try {
            // @ts-ignore
            const accounts = await window.ethereum.request({ method: 'eth_accounts' });
            if (accounts && accounts.length > 0) {
              console.log('Found connected account:', accounts[0]);
              setAddress(accounts[0]);
              setIsConnected(true);

              // @ts-ignore
              const chainIdHex = await window.ethereum.request({ method: 'eth_chainId' });
              const currentChainId = parseInt(chainIdHex, 16);
              setChainId(currentChainId);
              console.log('Current chain ID:', currentChainId);
            }
          } catch (error) {
            console.error('Error checking connection:', error);
          }
        };

        checkConnection();

        // Setup event listeners
        // @ts-ignore
        const handleAccountsChanged = (accounts) => {
          console.log('Accounts changed:', accounts);
          if (accounts && accounts.length > 0) {
            setAddress(accounts[0]);
            setIsConnected(true);
          } else {
            setIsConnected(false);
            setAddress('');
          }
        };

        // @ts-ignore
        const handleChainChanged = (chainIdHex) => {
          console.log('Chain changed:', chainIdHex);
          const newChainId = parseInt(chainIdHex, 16);
          setChainId(newChainId);

          // Alert user if they're not on Open Campus Codex
          if (newChainId !== 656476) {
            console.log('Not on Open Campus Codex');
          }
        };

        // @ts-ignore
        window.ethereum.on('accountsChanged', handleAccountsChanged);
        // @ts-ignore
        window.ethereum.on('chainChanged', handleChainChanged);

        // Return cleanup function
        return () => {
          console.log('Cleaning up MetaMask event listeners');
          // @ts-ignore
          if (window.ethereum) {
            // @ts-ignore
            window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
            // @ts-ignore
            window.ethereum.removeListener('chainChanged', handleChainChanged);
          }
        };
      }
    };

    const cleanup = setupListeners();
    return cleanup;
  }, []);

  return (
    <WalletContext.Provider value={{ isConnected, address, chainId, connect, disconnect }}>
      {children}
    </WalletContext.Provider>
  );
}
