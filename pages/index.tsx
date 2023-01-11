import Head from 'next/head'
import '@rainbow-me/rainbowkit/styles.css';
import {
  getDefaultWallets,
  RainbowKitProvider,
  ConnectButton
} from '@rainbow-me/rainbowkit';
import { configureChains, createClient, goerli, WagmiConfig } from 'wagmi';
import { getAccount } from '@wagmi/core';
import { mainnet, localhost, polygonMumbai } from 'wagmi/chains';
import { alchemyProvider } from 'wagmi/providers/alchemy';
import { publicProvider } from 'wagmi/providers/public';
import { BigNumber } from 'ethers';
import { useEffect, useState } from 'react';
import { ChainId, PoolBaseCurrencyHumanized, ReserveDataHumanized, UiPoolDataProvider,UserReserveDataHumanized,WalletBalanceProvider } from '@aave/contract-helpers';
import { FormatReserveUSDResponse, formatReserves, formatUserSummary } from '@aave/math-utils';
import { computeAPY, computeUSDEquivalentOfAToken, getProvider, handleAddToken, mapAddressesToTokenName } from '../utils/helpers';
import dayjs from 'dayjs';

const currentTimestamp = dayjs().unix();
const { chains, provider } = configureChains(
  [localhost, goerli, mainnet, polygonMumbai],
  [
    alchemyProvider({ apiKey: process.env.NEXT_PUBLIC_ALCHEMY_ID || '' }),
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

const alcProvider = getProvider('maticmum'); // polygon is the same thing as matic

const uiPoolDataProviderAddress = '0x74E3445f239f9915D57715Efb810f67b2a7E5758'.toLowerCase();
const poolAddressProvider = '0x5343b5bA672Ae99d627A1C87866b8E53F47Db2E6'.toLowerCase();
const walletBalanceProviderAddress = '0x78baC31Ed73c115EB7067d1AfE75eC7B4e16Df9e'.toLowerCase();

const poolDataProviderContract = new UiPoolDataProvider({
  uiPoolDataProviderAddress,
  provider: alcProvider,
  chainId: ChainId.mumbai
});

const walletBalanceProviderContract = new WalletBalanceProvider({
  walletBalanceProviderAddress,
  provider: alcProvider
});

const hanldeClick = async() => {
  await alcProvider.send("eth_accounts", []);
  const signer = alcProvider.getSigner();
  // console.log("Account:", await signer.getAddress());
}

export default function Home() {
  const [poolReserve, setPoolReserve] = useState<ReserveDataHumanized[]>([]);
  const [baseCurrencyData, setBaseCurrencyData] = useState<PoolBaseCurrencyHumanized>();
  const [formattedPoolReserves, setFormattedPoolReserves] = useState<(ReserveDataHumanized & FormatReserveUSDResponse)[]>([]);
  const [userBalances, setUserBalances] = useState<BigNumber[]>([]);
  const [userPoolReserve, setUserPoolReserve] = useState<UserReserveDataHumanized[]>([]);
  const [userSummary, setUserSummary] = useState<(ReserveDataHumanized & FormatReserveUSDResponse) | any>();
  const [tokenMap, setTokenMap] = useState<any>({});

  useEffect(() => {
    getReserve();
    getWalletBalances();
  }, []);

  useEffect(() => {
    getUserReserve();
  }, [formattedPoolReserves, baseCurrencyData]);

  const getReserve = async() => {
      await poolDataProviderContract.getReservesHumanized({lendingPoolAddressProvider: poolAddressProvider})
      .then((reserve => {
        setPoolReserve(reserve.reservesData);
        setBaseCurrencyData(reserve.baseCurrencyData);
        const formattedArray = formatReserves({
          reserves: reserve.reservesData,
          currentTimestamp,
          marketReferenceCurrencyDecimals:
            reserve.baseCurrencyData.marketReferenceCurrencyDecimals,
          marketReferencePriceInUsd: reserve.baseCurrencyData.marketReferenceCurrencyPriceInUsd,
        });
        setFormattedPoolReserves(formattedArray)
        setTokenMap(mapAddressesToTokenName(reserve.reservesData));
      }))
      .catch((error) => console.log('Error loading reserve', error));
  }

  const getUserReserve = async() => {
    await poolDataProviderContract.getUserReservesHumanized({lendingPoolAddressProvider: poolAddressProvider, user: `0x${getAccount().address?.substring(2)}`})
    .then((reserve => {
      setUserPoolReserve(reserve.userReserves);
      const summary = formatUserSummary({
        currentTimestamp,
        marketReferencePriceInUsd: baseCurrencyData?.marketReferenceCurrencyPriceInUsd || '',
        marketReferenceCurrencyDecimals:
          baseCurrencyData?.marketReferenceCurrencyDecimals || 0,
        userReserves: reserve.userReserves,
        formattedReserves: formattedPoolReserves,
        userEmodeCategoryId: reserve.userEmodeCategoryId,
      });
      setUserSummary(summary)
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
            <div className='flex justify-between'>
              <div className='rounded-lg w-1/2 mt-10'>
                <h2 className='mb-10'>Pools</h2>
                <table className="table-auto">
                  <thead className='border-b-2 border-b-black'>
                    <tr>
                      <th className='px-4 mb-4'>Assets</th>
                      <th className='px-4 mb-4'>Wallet Balance</th>
                      <th className='px-4 mb-4'>APY</th>
                      <th className='px-4 mb-4'></th>
                    </tr>
                  </thead>
                  <tbody>
                    {poolReserve.map((data, index) => 
                      <tr key={data.id} className='h-12'>
                        <td className='px-4'>{data.name}</td>
                        <td className='px-4'>{Number(userBalances[index] || 0)}</td>
                        <td className='px-4'>{computeAPY(data.liquidityRate).toFixed(2)}%</td>
                        <td className='px-4'>
                          <button className='bg-black text-white rounded-md py-2 px-4 disabled:opacity-50' disabled={Number(userBalances[index] || 0) <= 0} onClick={() => hanldeClick()}>Supply</button>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className='rounded-lg w-1/2 my-10'>
                <h2 className='mb-10'>My Supplies</h2>
                <table className="table-auto">
                  <thead className='border-b-2 border-b-black'>
                    <tr>
                      <th className='px-4 mb-4'>Assets</th>
                      <th className='px-4 mb-4'>aToken Balance</th>
                      <th className='px-4 mb-4'>USD value</th>
                      <th className='px-4 mb-4'></th>
                    </tr>
                  </thead>
                  <tbody>
                    {userSummary?.userReservesData.map((data:any) => 
                      <tr key={data.id} className='h-12'>
                        <td className='px-4'>{data.reserve.name}</td>
                        <td className='px-4'>{Number(data.scaledATokenBalance || 0)}</td>
                        <td className='px-4'>${computeUSDEquivalentOfAToken(data.reserve.priceInUSD, data.scaledATokenBalance)}</td>
                        <td className='px-4'>
                          <button className='bg-black text-white rounded-md py-2 px-4 disabled:opacity-50' disabled={Number(data.scaledATokenBalance || 0) <= 0} onClick={() => handleAddToken(tokenMap[data.underlyingAsset].aTokenAddress, `a${tokenMap[data.underlyingAsset].symbol}`)}>Add aToken</button>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
      </RainbowKitProvider>
    </WagmiConfig>
  )
}
