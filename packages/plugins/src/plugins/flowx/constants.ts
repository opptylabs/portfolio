import { Platform } from '@sonarwatch/portfolio-core';

export const platformId = 'flowx';
export const platform: Platform = {
  id: platformId,
  name: 'FlowX Finance',
  image: 'https://sonar.watch/img/platforms/flowx.png',
  defiLlamaId: 'flowx-finance',
  website: 'https://flowx.finance',
  twitter: 'https://twitter.com/FlowX_finance',
};

export const flxMint = '0x6dae8ca14311574fdfe555524ea48558e3d1360d1607d1c7f98af867e3b7976c::flx::FLX';
export const xflxMint = '0x65ed6d4e666fcbc1afcd9d4b1d6d4af7def3eeeeaa663f5bebae8101112290f6::xflx::XFLX';

export const flowxPackage = '0x943535499ac300765aa930072470e0b515cfd7eebcaa5c43762665eaad9cc6f2';
export const flowxFactory = '0xba153169476e8c3114962261d1edc70de5ad9781b83cc617ecc8c1923191cae0';
export const pairsOwner = '0xd15e209f5a250d6055c264975fee57ec09bf9d6acdda3b5f866f76023d1563e6';
export const poolsOwner = '0x5c38d069b2f208b0894078465a31b5beb425104894f3237195c90666a82753a2';

export const poolsPrefix = `${platformId}-pools`;
export const poolsKey = `pools`;