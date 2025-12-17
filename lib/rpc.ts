import { ethers } from 'ethers';

/**
 * Base Mainnet public RPC
 */
const RPC_URL = 'https://mainnet.base.org';

/**
 * Netrum token contract (Base)
 */
export const NPT_TOKEN_ADDRESS =
  '0xB8c2CE84F831175136cebBFD48CE4BAb9c7a6424';

/**
 * Minimal ERC20 ABI
 * ONLY what we реально используем
 */
const ERC20_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
];

/**
 * Shared provider (singleton)
 */
const provider = new ethers.JsonRpcProvider(RPC_URL);

/**
 * Token contract instance
 */
const tokenContract = new ethers.Contract(
  NPT_TOKEN_ADDRESS,
  ERC20_ABI,
  provider
);

/**
 * Get ERC20 token balance for wallet
 * This value MUST match MetaMask
 */
export async function getTokenBalance(wallet: string): Promise<{
  symbol: string;
  balance: number;
  rawBalance: string;
  decimals: number;
}> {
  if (!wallet) {
    throw new Error('Wallet address is required');
  }

  const [rawBalance, decimals, symbol] = await Promise.all([
    tokenContract.balanceOf(wallet),
    tokenContract.decimals(),
    tokenContract.symbol(),
  ]);

  const balance =
    Number(rawBalance) / Math.pow(10, Number(decimals));

  return {
    symbol,
    balance,
    rawBalance: rawBalance.toString(),
    decimals: Number(decimals),
  };
}
