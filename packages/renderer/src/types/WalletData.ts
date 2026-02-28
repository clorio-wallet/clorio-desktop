export interface IWalletData {
  type?: string;
  address: string;
  id: number;
  ledger: boolean;
  ledgerAccount: number;
  mnemonic: boolean;
  accountNumber?: number;
  isAuthenticated?: boolean;
}
