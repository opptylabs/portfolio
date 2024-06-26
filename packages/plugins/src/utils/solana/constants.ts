import { PublicKey } from '@solana/web3.js';
import BigNumber from 'bignumber.js';

export const solanaTokenPid = new PublicKey(
  'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'
);
export const solanaToken2022Pid = new PublicKey(
  'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb'
);
export const associatedTokenProgramId = new PublicKey(
  'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL'
);

export const usdcSolanaMint = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
export const usdcSolanaDecimals = 6;
export const usdcSolanaFactor = new BigNumber(10 ** 6);
