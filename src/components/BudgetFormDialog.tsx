import { useState } from 'react';
import type { FormEvent } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormGroup from '@mui/material/FormGroup';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import type { BankConnection } from '../api/accounts';
import { createBudget, intervalLabels, updateBudget } from '../api/budgets';
import type { Budget, BudgetAccount, BudgetInterval } from '../api/budgets';

type Props = {
  budget: Budget | null;
  connections: BankConnection[];
  onClose: () => void;
  onSaved: (budget: Budget) => void;
};

export default function BudgetFormDialog({ budget, connections, onClose, onSaved }: Props) {
  const [name, setName] = useState(budget?.name ?? '');
  const [amount, setAmount] = useState(budget ? String(budget.amount) : '');
  const [interval, setInterval] = useState<BudgetInterval>(budget?.interval ?? 'MONTHLY');
  const [currency, setCurrency] = useState(budget?.currencyCode ?? 'USD');
  const [accountIds, setAccountIds] = useState(budget?.accounts.map(account => account.id) ?? []);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const available = new Map<string, BudgetAccount>();
  // Keep already-selected inactive accounts visible when editing an existing budget.
  budget?.accounts.forEach(account => available.set(account.id, account));
  connections.forEach(connection => connection.accounts.forEach(account => available.set(account.id, {
    id: account.id, name: account.name, mask: account.mask, currencyCode: account.currencyCode,
    institutionName: connection.institutionName, active: true,
  })));

  function toggleAccount(id: string) {
    setAccountIds(previous => previous.includes(id) ? previous.filter(accountId => accountId !== id) : [...previous, id]);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaving) return;
    const limit = Number(amount);
    if (!name.trim() || !Number.isFinite(limit) || limit <= 0 || accountIds.length === 0) {
      setError('Enter a name, a positive spending limit, and select at least one account.');
      return;
    }
    setError('');
    setIsSaving(true);
    const input = { name: name.trim(), amount: limit, interval, currencyCode: currency, accountIds };
    try {
      const saved = budget ? await updateBudget(budget.id, input) : await createBudget(input);
      onSaved(saved);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Could not save the budget.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog open onClose={() => { if (!isSaving) onClose(); }} maxWidth="sm" fullWidth aria-labelledby="budget-form-title">
      <Box component="form" onSubmit={handleSubmit}>
        <DialogTitle id="budget-form-title">{budget ? 'Edit budget' : 'Create a budget'}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={3} sx={{ pt: 1 }}>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField label="Budget name" value={name} onChange={event => setName(event.target.value)}
              required fullWidth autoFocus disabled={isSaving} slotProps={{ htmlInput: { maxLength: 120 } }} />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField label="Spending limit" type="number" value={amount} required fullWidth disabled={isSaving}
                onChange={event => setAmount(event.target.value)} slotProps={{ htmlInput: { min: 0.0001, step: 'any' } }} />
              <TextField label="Currency" value={currency} required disabled={isSaving} sx={{ minWidth: 120 }}
                onChange={event => { setCurrency(event.target.value.toUpperCase()); setAccountIds([]); }}
                slotProps={{ htmlInput: { maxLength: 3, pattern: '[A-Z]{3}' } }} />
            </Stack>
            <TextField select label="Resets" value={interval} disabled={isSaving}
              onChange={event => setInterval(event.target.value as BudgetInterval)}>
              {Object.entries(intervalLabels).map(([value, label]) => <MenuItem key={value} value={value}>{label}</MenuItem>)}
            </TextField>
            <Box component="fieldset" sx={{ border: 0, p: 0, m: 0, minWidth: 0 }}>
              <Typography component="legend" variant="subtitle1" sx={{ mb: 0.5 }}>Accounts in this budget</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Choose one or more accounts in {currency || 'the same currency'}.
              </Typography>
              {available.size === 0 && <Alert severity="info">Connect a bank account before creating a budget.</Alert>}
              <FormGroup>
                {[...available.values()].map(account => (
                  <FormControlLabel key={account.id}
                    disabled={isSaving || account.currencyCode !== currency || (!account.active && !budget?.accounts.some(a => a.id === account.id))}
                    control={<Checkbox color="success" checked={accountIds.includes(account.id)} onChange={() => toggleAccount(account.id)} />}
                    label={<Box sx={{ py: 0.5 }}>
                      <Typography variant="body2">{account.name}{account.mask ? ` •••• ${account.mask}` : ''}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {account.institutionName ?? 'Linked bank'} · {account.currencyCode ?? 'Currency unavailable'}{account.active ? '' : ' · Inactive'}
                      </Typography>
                    </Box>} />
                ))}
              </FormGroup>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose} disabled={isSaving}>Cancel</Button>
          <Button type="submit" variant="contained" color="success" loading={isSaving} disabled={available.size === 0}>
            {budget ? 'Save changes' : 'Create budget'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
