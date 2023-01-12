import { getAccount, getContract, fetchSigner } from '@wagmi/core';
import BN from 'bn.js';
import { BigNumber, ethers } from 'ethers';
import { erc20ABI } from 'wagmi';

const RAY = Math.pow(10, 27);
const SECONDS_PER_YEAR = 31536000;

const uiPoolDataProviderAddress = '0x7006e5a16E449123a3F26920746d03337ff37340'.toLowerCase();
const poolAddress = '0x794a61358D6845594F94dc1DB02A252b5b4814aD'.toLowerCase();
const walletBalanceProviderAddress = '0xBc790382B3686abffE4be14A030A96aC6154023a'.toLowerCase();
// const signer = await fetchSigner();

export const computeAPY = (liquidityRate) => {
    const bnLiquidityRate = new BN(liquidityRate);
    const bnRay = new BN("10").pow(new BN("27"));
    const depositAPR = (liquidityRate/10**27);
    const depositAPY = ((1 + (depositAPR.toString() / SECONDS_PER_YEAR)) ** SECONDS_PER_YEAR) - 1;
    return depositAPY*100;
}

export const deposit = async({etherAmount, tokenAddress}) => {
    const amountinWei = ethers.utils.parseEther(etherAmount).toString();

    // try {
      // Approve the LendingPoolCore address with the DAI contract
    //   const tokenContract = fetchContract();
    const tokenContract = getContract({
        address: tokenAddress,
        abi: erc20ABI,
    })
    // await fetchSigner().then(res => console.log(res))
      console.log(tokenContract)
      await tokenContract.methods
        .approve(poolAddress, amountinWei)
        .send({ from: getAccount().address })
        .catch((e) => {
          throw Error(`Error approving DAI allowance: ${e.message}`)
        })

      // Make the deposit transaction via LendingPool contract
    //   const lpAddress = await getLendingPoolAddress()
    //   const lpContract = new web3.eth.Contract(LendingPoolABI, lpAddress)
    //   await lpContract.methods
    //     .deposit(daiAddress, daiAmountinWei, referralCode)
    //     .send({ from: myAddress })
    //     .catch((e) => {
    //       throw Error(`Error depositing to the LendingPool contract: ${e.message}`)
    //     })
    // } catch (e) {
    //   alert(e.message)
    //   console.log(e.message)
    // }
  }

export const fetchContract = ({address}) => {
    return getContract({
        address: address,
        abi: erc20ABI,
    })
}

export const getProvider = (network) => {
    const provider = new ethers.providers.AlchemyProvider(network, process.env.NEXT_PUBLIC_ALCHEMY_ID);
    return provider;
}

export const getEthProvider = () => {
  const ethProvider = new ethers.providers.Web3Provider(window.ethereum);
  return ethProvider;
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

    try {
      const wasAdded = await window.ethereum?.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20',
          options: {
            address: tokenAddress,
            symbol: tokenSymbol,
            decimals: tokenDecimals,
            image: "",
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

export const computeUSDEquivalentOfAToken = (reserveAssetPriceInUSD, aTokenBalance) => {
  return (reserveAssetPriceInUSD * aTokenBalance).toFixed(2)
}

export const submitTransaction = async(provider, tx) => {
  const extendedTxData = await tx.tx();
  const { from, ...txData } = extendedTxData;
  const signer = provider.getSigner(from);
  const txResponse = await signer.sendTransaction({
    ...txData,
    value: txData.value ? BigNumber.from(txData.value) : undefined,
  });
  console.log(txResponse);
}
