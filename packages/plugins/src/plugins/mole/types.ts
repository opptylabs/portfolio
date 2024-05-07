export type VaultInfoObject = {
  value: {
    type: string;
    fields: VaultInfo;
  };
};

export type VaultInfo = {
  decimals: number;
  type: string;
};

export type Vault = {
  baseDecimals: number;
  baseToken: string;
  baseTokenPerIbToken: number;
};

export type UserInfo = {
  value: {
    fields: {
      amount: number;
    }
    type: string;
  }
};
