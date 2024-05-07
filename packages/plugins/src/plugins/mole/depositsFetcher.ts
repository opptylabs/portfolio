import {
  formatMoveTokenAddress,
  getUsdValueSum,
  NetworkId,
  PortfolioLiquidity, TokenPrice
} from '@sonarwatch/portfolio-core';
import { Cache } from '../../Cache';
import { Fetcher, FetcherExecutor } from '../../Fetcher';
import {
  magicCoin,
  platformId,
  stackedSavingsParentIds,
  suiIncentiveUserType,
  vaultsKey,
  vaultsPrefix
} from './constants';
import { getClientSui } from '../../utils/clients';
import { parseTypeString } from '../../utils/aptos';
import tokenPriceToAssetTokens from '../../utils/misc/tokenPriceToAssetTokens';
import { UserInfo, Vault } from './types';
import { getDynamicFieldObject } from '../../utils/sui/getDynamicFieldObject';

const executor: FetcherExecutor = async (owner: string, cache: Cache) => {
  const client = getClientSui();

  const [vaults, coinsBalances, stackedSavings] = await Promise.all([
    cache.getItem<Vault[]>(vaultsKey, {
      prefix: vaultsPrefix,
      networkId: NetworkId.sui,
    }),
    client.getAllBalances({ owner }),
    Promise.all(stackedSavingsParentIds.map((stackedSavingsParentId) => getDynamicFieldObject<UserInfo>(client, {
      parentId: stackedSavingsParentId,
      name: {
        type: suiIncentiveUserType,
        value: { address: owner, is_object: false },
      },
    })))
  ])

  if (!vaults) return [];

  const vaultsMap: Map<string, Vault> = new Map();
  vaults.forEach((vault) => {
    if (!vault) return;
    vaultsMap.set(vault.baseToken, vault);
  });

  const liquidities: PortfolioLiquidity[] = [];

  const coinsTypes: string[] = [];
  const balances = [];

  for (let i = 0; i < coinsBalances.length; i++) {
    const coinBalance = coinsBalances[i];
    const amountRaw = Number(coinBalance.totalBalance);
    if (amountRaw === 0) continue;

    if (!coinBalance.coinType.includes(magicCoin)) continue;

    const { keys: parsedType } = parseTypeString(coinBalance.coinType);

    if (!parsedType) continue;

    if (!coinsTypes.includes(parsedType[0].type))
      coinsTypes.push(parsedType[0].type);

    balances.push({
      type: parsedType[0].type,
      amountRaw,
      stacked: false,
    })
  }

  for (let i = 0; i < stackedSavings.length; i++) {
    const stackedSaving = stackedSavings[i];
    if (!stackedSaving.data?.content?.fields) continue;
    const amountRaw = Number(stackedSaving.data.content.fields.value.fields.amount);
    if (amountRaw === 0) continue;

    if (!stackedSaving.data?.content?.type.includes(magicCoin)) continue;

    const parsedTypeString = parseTypeString(stackedSaving.data?.content?.type);
    if (!parsedTypeString.keys) continue;
    const { keys: parsedSubType } = parseTypeString(parsedTypeString.keys[1].type);
    if (!parsedSubType) continue;
    const { keys: parsedSubSubType } = parseTypeString(parsedSubType[0].type);
    if (!parsedSubSubType) continue;

    if (!coinsTypes.includes(parsedSubSubType[0].type))
      coinsTypes.push(parsedSubSubType[0].type);

    balances.push({
      type: parsedSubSubType[0].type,
      amountRaw,
      stacked: true,
    })
  }

  const tokensPrices = await cache.getTokenPrices(coinsTypes, NetworkId.sui);
  const tokenPricesMap: Map<string, TokenPrice> = new Map();
  tokensPrices.forEach((tp) => {
    if (!tp) return;
    tokenPricesMap.set(tp.address, tp);
  });

  for (let i = 0; i < balances.length; i++) {
    const coinBalance = balances[i];

    const tokenPrice = tokenPricesMap.get(formatMoveTokenAddress(coinBalance.type));
    if (!tokenPrice) continue;

    const vault = vaultsMap.get(coinBalance.type);
    if (!vault) continue;

    const assets = tokenPriceToAssetTokens(
      coinBalance.type,
      Number(coinBalance.amountRaw) / (10 ** tokenPrice.decimals) * vault.baseTokenPerIbToken,
      NetworkId.sui,
      tokenPrice
    );

    const value = getUsdValueSum(assets.map((asset) => asset.value));

    liquidities.push({
      assets,
      assetsValue: value,
      rewardAssets: [],
      rewardAssetsValue: null,
      value,
      yields: [],
    });
  }

  if (liquidities.length === 0) return [];

  return [
    {
      type: 'liquidity',
      data: { liquidities },
      label: 'Deposit',
      networkId: NetworkId.sui,
      platformId,
      value: getUsdValueSum(liquidities.map((liq) => liq.value)),
    },
  ];
};

const fetcher: Fetcher = {
  id: `${platformId}-deposits`,
  networkId: NetworkId.sui,
  executor,
};

export default fetcher;
