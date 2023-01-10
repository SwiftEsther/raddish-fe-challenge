import Head from 'next/head'
import '@rainbow-me/rainbowkit/styles.css';
import {
  getDefaultWallets,
  RainbowKitProvider,
  ConnectButton
} from '@rainbow-me/rainbowkit';
import { configureChains, createClient, goerli, WagmiConfig } from 'wagmi';
import { getAccount } from '@wagmi/core';
import { mainnet, localhost } from 'wagmi/chains';
import { alchemyProvider } from 'wagmi/providers/alchemy';
import { publicProvider } from 'wagmi/providers/public';
import { BigNumber, ethers } from 'ethers';
import { useEffect, useState } from 'react';
import { ChainId, ReserveDataHumanized, UiPoolDataProvider,WalletBalanceProvider } from '@aave/contract-helpers';

const { chains, provider } = configureChains(
  [localhost, goerli, mainnet],
  [
    alchemyProvider({ apiKey: process.env.ALCHEMY_ID || '' }),
    publicProvider()
  ]
);

const { connectors } = getDefaultWallets({
  appName: 'Radish FE Challenge App',
  chains
});

const wagmiClient = createClient({
  autoConnect: true,
  connectors,
  provider
})

const account = getAccount();

const alcProvider = new ethers.providers.AlchemyProvider('goerli', process.env.ALCHEMY_ID)

const uiPoolDataProviderAddress = '0xC576539371a2f425545B7BF4eb2a14Eee1944a1C'.toLowerCase();
const poolAddressProvider = '0xc4dCB5126a3AfEd129BC3668Ea19285A9f56D15D'.toLowerCase();
const walletBalanceProviderAddress = '0x75CC0f0E3764be7594772D08EEBc322970CbB3a9'.toLowerCase();

const poolDataProviderContract = new UiPoolDataProvider({
  uiPoolDataProviderAddress,
  provider: alcProvider,
  chainId: ChainId.goerli
});

const walletBalanceProviderContract = new WalletBalanceProvider({
  walletBalanceProviderAddress,
  provider: alcProvider
});

export default function Home() {
  const [poolReserve, setPoolReserve] = useState<ReserveDataHumanized[]>([]);
  const [userBalances, setUserBalances] = useState<BigNumber[]>([])

  useEffect(() => {
    getReserve();
    getWalletBalances();
  }, []);

  const getReserve = async() => {
      await poolDataProviderContract.getReservesHumanized({lendingPoolAddressProvider: poolAddressProvider})
      .then((reserve => {
        setPoolReserve(reserve.reservesData);
      }))
      .catch((error) => console.log('Error loading reserve', error));
  }

  const getWalletBalances = async() => {
    const balances = await walletBalanceProviderContract.getUserWalletBalancesForLendingPoolProvider(`${account.address}`, poolAddressProvider);
    setUserBalances(balances[1]);
  }

  return (
    <WagmiConfig client={wagmiClient}>
      <RainbowKitProvider chains={chains} initialChain={mainnet}>
          <Head>
            <title>Radish Frontend Challenge</title>
            <meta name="description" content="Generated by create next app" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <link rel="icon" href="/favicon.ico" />
          </Head>
          <div className='container mx-auto py-10'>
            <ConnectButton />
            <div className='rounded-lg w-1/2 mt-10'>
              <table className="table-auto">
                <thead className='border-b-2 border-b-black'>
                  <tr>
                    <th className='px-4 mb-4'>Assets</th>
                    <th className='px-4 mb-4'>Wallet Balance</th>
                    <th className='px-4 mb-4'></th>
                  </tr>
                </thead>
                <tbody>
                  {poolReserve.map((data, index) => 
                    <tr key={data.id} className='h-12'>
                      <td className='px-4'>{data.name}</td>
                      <td className='px-4'>{Number(userBalances[index])}</td>
                      <td className='px-4'>
                        <button className='bg-black text-white rounded-md py-2 px-4'>Supply</button>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
      </RainbowKitProvider>
    </WagmiConfig>
  )
}
