import { getJson, postJson } from './client';

export type BankAccount = {
  id: string;
  name: string;
  officialName: string | null;
  mask: string | null;
  type: string | null;
  subtype: string | null;
  currentBalance: number | null;
  availableBalance: number | null;
  currencyCode: string | null;
};

export type BankConnection = {
  id: string;
  institutionName: string | null;
  accountsLastFetchedAt: string | null;
  accounts: BankAccount[];
};

export function getAccounts(signal?: AbortSignal): Promise<BankConnection[]> {
  return getJson<BankConnection[]>('/api/accounts', signal);
}

export function refreshAccounts(): Promise<BankConnection[]> {
  return postJson<BankConnection[]>('/api/accounts/refresh');
}
