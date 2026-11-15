import { deleteJson, getJson, postJson, putJson } from './client';

export type BudgetInterval = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';

export type BudgetAccount = {
  id: string;
  name: string;
  institutionName: string | null;
  mask: string | null;
  currencyCode: string | null;
  active: boolean;
};

export type Budget = {
  id: string;
  name: string;
  interval: BudgetInterval;
  amount: number;
  currencyCode: string;
  periodStart: string;
  periodEnd: string;
  timeZone: string;
  spent: number;
  remaining: number;
  excludedTransactionCount: number;
  accounts: BudgetAccount[];
};

export type BudgetInput = {
  name: string;
  interval: BudgetInterval;
  amount: number;
  currencyCode: string;
  accountIds: string[];
};

export type BudgetTransaction = {
  id: string;
  accountId: string;
  accountName: string;
  merchantName: string | null;
  date: string;
  amount: number;
  currencyCode: string | null;
  excluded: boolean;
  treatment: 'COUNTED' | 'HIDDEN' | 'MONEY_IN' | 'OTHER_CURRENCY' | 'ZERO_AMOUNT';
};

export type BudgetDetail = { budget: Budget; transactions: BudgetTransaction[] };

export const intervalLabels: Record<BudgetInterval, string> = {
  DAILY: 'Daily', WEEKLY: 'Weekly', MONTHLY: 'Monthly', YEARLY: 'Yearly',
};

export function getBudgets(signal?: AbortSignal): Promise<Budget[]> {
  return getJson<Budget[]>('/api/budgets', signal);
}

export function getBudget(id: string, signal?: AbortSignal): Promise<BudgetDetail> {
  return getJson<BudgetDetail>(`/api/budgets/${id}`, signal);
}

export function createBudget(input: BudgetInput): Promise<Budget> {
  return postJson<Budget>('/api/budgets', input);
}

export function updateBudget(id: string, input: BudgetInput): Promise<Budget> {
  return putJson<Budget>(`/api/budgets/${id}`, input);
}

export function deleteBudget(id: string): Promise<void> {
  return deleteJson(`/api/budgets/${id}`);
}

export function setTransactionExcluded(budgetId: string, transactionId: string, excluded: boolean): Promise<BudgetDetail> {
  return putJson<BudgetDetail>(`/api/budgets/${budgetId}/transactions/${transactionId}/exclusion`, { excluded });
}
