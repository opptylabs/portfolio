import { NetworkId } from '@sonarwatch/portfolio-core';
import { Cache } from '../../Cache';
import { Job, JobExecutor } from '../../Job';
import {
  platformId,
  vaultInfosParentId,
  vaultsKey,
  vaultsPrefix
} from './constants';
import { getClientSui } from '../../utils/clients';
import { getDynamicFields } from '../../utils/sui/getDynamicFields';
import { multiGetObjects } from '../../utils/sui/multiGetObjects';
import { Vault, VaultInfoObject } from './types';
import { parseTypeString } from '../../utils/aptos';

const executor: JobExecutor = async (cache: Cache) => {
  const client = getClientSui();

  // vault infos
  const vaultsTableFields = await getDynamicFields(client, vaultInfosParentId)
  if (vaultsTableFields.length === 0) return;

  const vaultInfoIds = vaultsTableFields.map((f) => f.objectId);
  if (!vaultInfoIds.length) return;

  const vaultInfoObjects = await multiGetObjects<VaultInfoObject>(client, vaultInfoIds, {
    showContent: true,
  });

  const vaults: Vault[] = [];

  vaultInfoObjects.forEach((vaultInfoObject) => {
    if (!vaultInfoObject.data?.content?.fields.value.fields) return;
    const fields = vaultInfoObject?.data?.content?.fields.value.fields;

    const { keys: parsedType } = parseTypeString(vaultInfoObject?.data?.content.fields.value.type);
    if (!parsedType) return;

    vaults.push({
      baseDecimals: fields.decimals,
      baseToken: parsedType[0].type,
      baseTokenPerIbToken: 1, // TODO calculate right value
    });
  })

  await cache.setItem(vaultsKey, vaults, {
    prefix: vaultsPrefix,
    networkId: NetworkId.sui,
  });
};

const job: Job = {
  id: `${platformId}-vaults`,
  executor,
  label: 'normal',
};
export default job;
