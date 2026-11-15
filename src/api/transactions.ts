import { getJson } from './client';

export type Transaction = {
  id: string;
  amount: number;
  currencyCode: string | null;
  merchantName: string | null;
  date: string;
  pending: boolean;
};

export type AccountTransactions = {
  accountId: string;
  name: string;
  subtype: string | null;
  transactions: Transaction[];
};

export function getTransactions(signal?: AbortSignal): Promise<AccountTransactions[]> {
  return getJson<AccountTransactions[]>('/api/transactions', signal);
}
