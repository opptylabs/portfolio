import {
  NetworkId,
  NetworkIdType,
  TokenPrice,
  TokenPriceSource,
  aptosNativeAddress,
  coingeckoSourceId,
  formatTokenAddress,
  seiNativeAddress,
  solanaNativeAddress,
  solanaNativeWrappedAddress,
  suiNativeAddress,
} from '@sonarwatch/portfolio-core';
import { walletTokensPlatform } from '../../plugins/tokens/constants';
import getSourceWeight from './getSourceWeight';

export const defaultAcceptedPairs = new Map<NetworkIdType, string[]>([
  [
    NetworkId.sei,
    [
      seiNativeAddress,
      'ibc/ED07A3391A112B175915CD8FAF43A2DA8E4790EDE12566649D0C2F97716B8518', // OSMO
      'factory/sei189adguawugk3e55zn63z8r9ll29xrjwca636ra7v7gxuzn98sxyqwzt47l/Hq4tuDzhRBnxw3tFA5n6M52NVMVcC19XggbyDiJKCD6H', // USDCet
    ].map((a) => formatTokenAddress(a, NetworkId.sei)),
  ],
  [
    NetworkId.solana,
    [
      solanaNativeAddress,
      solanaNativeWrappedAddress,
      'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
      'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', // USDT
    ].map((a) => formatTokenAddress(a, NetworkId.solana)),
  ],
  [
    NetworkId.aptos,
    [
      aptosNativeAddress,
      '0x5e156f1207d0ebfa19a9eeff00d62a282278fb8719f4fab3a586a0a2c0fffbea::coin::T', // USDCet
      '0x6f986d146e4a90b828d8c12c14b6f4e003fdff11a8eecceceb63744363eaac01::mod_coin::MOD', // MOD (Move Dollar)
    ].map((a) => formatTokenAddress(a, NetworkId.aptos)),
  ],
  [
    NetworkId.sui,
    [
      suiNativeAddress,
      '0x2::sui::SUI',
      '0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN', // USDCet
      '0xc060006111016b8a020ad5b33834984a437aaa7d3c74c18e09a95d48aceab08c::coin::COIN', // USDCet
    ].map((a) => formatTokenAddress(a, NetworkId.sui)),
  ],
]);

export type PoolUnderlying = {
  address: string;
  reserveAmount: number;
  decimals: number;
  weight: number;
  tokenPrice?: TokenPrice;
};

type KnownPoolUnderlying = PoolUnderlying & {
  price: number;
};

export type GetLpUnderlyingTokenSourceParams = {
  networkId: NetworkIdType;
  sourceId: string;
  poolUnderlyings: PoolUnderlying[];
  platformId?: string;
  acceptedPairs?: string[];
  minReserveValue?: number;
};

export function getLpUnderlyingTokenSource(
  params: GetLpUnderlyingTokenSourceParams
) {
  let { platformId, acceptedPairs, minReserveValue } = params;
  const { networkId, poolUnderlyings, sourceId } = params;
  if (!platformId) platformId = walletTokensPlatform.id;
  if (!acceptedPairs) acceptedPairs = defaultAcceptedPairs.get(networkId);
  if (acceptedPairs === undefined) return [];
  if (acceptedPairs.length === 0) return [];
  if (!minReserveValue) minReserveValue = 2500;

  // Verify underlyings weights
  const totalWeight = poolUnderlyings.reduce(
    (partialSum, p) => partialSum + p.weight,
    0
  );
  if (totalWeight > 1.01)
    throw new Error(`Weights are greater than 1: ${totalWeight}`);
  if (totalWeight < 0.99)
    throw new Error(`Weights are smaller than 1: ${totalWeight}`);

  let knownUnderlaying: KnownPoolUnderlying | undefined;
  const fAddresses = poolUnderlyings.map((u) =>
    formatTokenAddress(u.address, networkId)
  );

  let knownReserveValue: number | undefined;
  for (let i = 0; i < poolUnderlyings.length; i++) {
    const u = poolUnderlyings[i];
    if (!u.tokenPrice) continue;
    if (!acceptedPairs.includes(fAddresses[i])) continue;
    const reserveValue = u.tokenPrice.price * u.reserveAmount;
    if (
      knownUnderlaying &&
      knownReserveValue &&
      knownReserveValue > reserveValue
    )
      continue;

    knownUnderlaying = u as KnownPoolUnderlying;
    knownReserveValue = reserveValue;
  }
  if (!knownUnderlaying || !knownReserveValue) return [];
  if (knownReserveValue < minReserveValue) return [];

  const knownUnderlayingAddress = formatTokenAddress(
    knownUnderlaying.address,
    networkId
  );
  const sources: TokenPriceSource[] = [];
  for (let i = 0; i < poolUnderlyings.length; i++) {
    const u = poolUnderlyings[i];
    if (knownUnderlayingAddress === fAddresses[i]) continue;
    if (acceptedPairs.includes(fAddresses[i])) continue;
    if (
      u.tokenPrice &&
      u.tokenPrice.sources.some((s) => s.id === coingeckoSourceId)
    )
      continue;

    const price =
      ((u.weight / knownUnderlaying.weight) * knownReserveValue) /
      u.reserveAmount;

    const source: TokenPriceSource = {
      id: sourceId,
      networkId,
      platformId: walletTokensPlatform.id,
      address: fAddresses[i],
      decimals: u.decimals,
      price,
      weight: getSourceWeight(knownReserveValue),
      timestamp: Date.now(),
    };
    sources.push(source);
  }

  return sources;
}
