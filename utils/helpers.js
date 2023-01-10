import { getAccount, getContract, fetchSigner } from '@wagmi/core';
import BN from 'bn.js';
import { BigNumber, ethers } from 'ethers';
import { erc20ABI } from 'wagmi';

const RAY = Math.pow(10, 27);
const SECONDS_PER_YEAR = 31536000;

export const computeAPY = (liquidityRate) => {
    const bnLiquidityRate = new BN(liquidityRate);
    const bnRay = new BN("10").pow(new BN("27"));
    const depositAPR = (liquidityRate/10**27);
    const depositAPY = ((1 + (depositAPR.toString() / SECONDS_PER_YEAR)) ** SECONDS_PER_YEAR) - 1;
    return depositAPY*100;
}

export const fetchContract = ({address}) => {
    return getContract({
        address: address,
        abi: erc20ABI,
    })
}

export const getProvider = (network) => {
    const provider = new ethers.providers.AlchemyProvider(network, process.env.ALCHEMY_ID);
    return provider;
}

export const mapBalances = (balances) => {
    let balancesMap = {};
    balances[0].map((address, index) => {
        balancesMap[address]= Number(balances[1][index])
    })
    return balancesMap;
}

export const mapAddressesToTokenName = (poolReserve) => {
    let tokenMap = {};
    poolReserve.map(asset => {
        tokenMap[asset.underlyingAsset]= {name: asset.name, symbol: asset.symbol, aTokenAddress: asset.aTokenAddress}
    })
    return tokenMap;
}

export const handleAddToken = async(tokenAddress, tokenSymbol) => {
    const tokenDecimals = 18;
    const tokenImage = 'http://placekitten.com/200/300';

    try {
      const wasAdded = await window.ethereum?.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20',
          options: {
            address: tokenAddress,
            symbol: tokenSymbol,
            decimals: tokenDecimals,
            image: tokenImage,
          },
        },
      });

      if (wasAdded) {
        alert('Thanks for your interest!');
      } else {
        alert('Token wasn\'t added to wallet!');
      }
    } catch (error) {
      console.log(error);
    }
  }
