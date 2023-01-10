import BN from 'bn.js';
import { ethers } from 'ethers';

const RAY = Math.pow(10, 27);
const SECONDS_PER_YEAR = 31536000;

export const computeAPY = (liquidityRate) => {
    const bnLiquidityRate = new BN(liquidityRate);
    const bnRay = new BN("10").pow(new BN("27"));
    const depositAPR = (liquidityRate/10**27);
    const depositAPY = ((1 + (depositAPR.toString() / SECONDS_PER_YEAR)) ** SECONDS_PER_YEAR) - 1;
    console.log({bnRay: bnRay.toString(), bnLiquidityRate: bnLiquidityRate.toString(), liquidityRate:liquidityRate, depositAPR:depositAPR, depositAPY:depositAPY*100});
    return depositAPY*100;
}

export const getProvider = (network) => {
    const provider = new ethers.providers.AlchemyProvider(network, process.env.ALCHEMY_ID);
    return provider;
}
