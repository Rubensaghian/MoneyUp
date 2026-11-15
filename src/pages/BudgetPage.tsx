import { useCallback, useEffect, useState } from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { Link as RouterLink } from 'react-router-dom';
import { getAccounts } from '../api/accounts';
import type { BankConnection } from '../api/accounts';
import { deleteBudget, getBudgets } from '../api/budgets';
import type { Budget } from '../api/budgets';
import BudgetDetailPanel from '../components/BudgetDetailPanel';
import BudgetFormDialog from '../components/BudgetFormDialog';

export default function BudgetPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [connections, setConnections] = useState<BankConnection[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadVersion, setReloadVersion] = useState(0);
  const [detailVersion, setDetailVersion] = useState(0);
  const [editing, setEditing] = useState<Budget | 'create' | null>(null);
  const [deleting, setDeleting] = useState<Budget | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isChangingTransaction, setIsChangingTransaction] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([getBudgets(controller.signal), getAccounts(controller.signal)])
      .then(([savedBudgets, savedConnections]) => {
        if (controller.signal.aborted) return;
        setBudgets(savedBudgets);
        setConnections(savedConnections);
        setSelectedId(previous => savedBudgets.some(budget => budget.id === previous) ? previous : savedBudgets[0]?.id ?? null);
      })
      .catch(error => {
        if (!controller.signal.aborted) setError(error instanceof Error ? error.message : 'Could not load budgets.');
      })
      .finally(() => { if (!controller.signal.aborted) setIsLoading(false); });
    return () => controller.abort();
  }, [reloadVersion]);

  const updateSummary = useCallback((updated: Budget) => {
    setBudgets(previous => previous.map(budget => budget.id === updated.id ? updated : budget));
  }, []);

  function reloadBudgets() {
    setError('');
    setIsLoading(true);
    setReloadVersion(previous => previous + 1);
  }

  function handleSaved(saved: Budget) {
    setBudgets(previous => [...previous.filter(budget => budget.id !== saved.id), saved]
      .sort((first, second) => first.name.localeCompare(second.name)));
    setSelectedId(saved.id);
    setDetailVersion(previous => previous + 1);
    setEditing(null);
    setError('');
  }

  async function handleDelete() {
    if (!deleting || isDeleting) return;
    setIsDeleting(true);
    setError('');
    try {
      await deleteBudget(deleting.id);
      const remaining = budgets.filter(budget => budget.id !== deleting.id);
      setBudgets(remaining);
      setSelectedId(previous => previous === deleting.id ? remaining[0]?.id ?? null : previous);
      setDeleting(null);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Could not delete the budget.');
      setDeleting(null);
    } finally {
      setIsDeleting(false);
    }
  }

  const selected = budgets.find(budget => budget.id === selectedId);
  const hasAccounts = connections.some(connection => connection.accounts.length > 0);
  const busy = isLoading || isDeleting || isChangingTransaction;

  return (
    <Container component="main" maxWidth="lg" sx={{ my: { xs: 4, sm: 6 }, pb: 5 }}>
      <Stack component="header" direction={{ xs: 'column', sm: 'row' }} spacing={2}
        sx={{ mb: 3, alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between' }}>
        <Stack spacing={0.5}>
          <Typography component="h1" variant="h4" sx={{ fontWeight: 600 }}>Budgets</Typography>
          <Typography color="text.secondary">Set a limit and choose which accounts count toward it.</Typography>
        </Stack>
        <Stack direction="row" spacing={1}>
          <Button onClick={reloadBudgets} disabled={busy}>Reload budgets</Button>
          <Button variant="contained" color="success" disabled={busy || !hasAccounts} onClick={() => setEditing('create')}>Create budget</Button>
        </Stack>
      </Stack>
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error} Try reloading budgets.</Alert>}
      {isLoading && <Typography role="status" color="text.secondary" sx={{ mb: 3 }}>Loading your budgets…</Typography>}
      {!isLoading && !error && budgets.length === 0 && (
        <Paper variant="outlined" sx={{ p: { xs: 3, sm: 7 }, borderRadius: 3, textAlign: 'center' }}>
          <Typography component="h2" variant="h5" sx={{ mb: 1 }}>Your first budget starts here</Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            {hasAccounts ? 'Choose a spending limit and the accounts you want to include.' : 'Connect a bank account, then create a budget for its posted transactions.'}
          </Typography>
          {hasAccounts ? <Button variant="contained" color="success" onClick={() => setEditing('create')}>Create a budget</Button>
            : <Button component={RouterLink} to="/accounts" variant="contained" color="success">Connect a bank</Button>}
        </Paper>
      )}
      {selected && (
        <Stack spacing={3}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: { sm: 'center' } }}>
            <TextField select label="Budget" value={selected.id} disabled={busy} fullWidth sx={{ maxWidth: 420 }}
              onChange={event => setSelectedId(event.target.value)}>
              {budgets.map(budget => <MenuItem key={budget.id} value={budget.id}>{budget.name}</MenuItem>)}
            </TextField>
            <Stack direction="row" spacing={1}>
              <Button disabled={busy} onClick={() => setEditing(selected)}>Edit budget</Button>
              <Button color="error" disabled={busy} onClick={() => setDeleting(selected)}>Delete budget</Button>
            </Stack>
          </Stack>
          <BudgetDetailPanel key={`${selected.id}-${reloadVersion}-${detailVersion}`} budget={selected}
            onSummaryChange={updateSummary} onBusyChange={setIsChangingTransaction} />
        </Stack>
      )}
      {editing !== null && <BudgetFormDialog budget={editing === 'create' ? null : editing} connections={connections}
        onClose={() => setEditing(null)} onSaved={handleSaved} />}
      <Dialog open={deleting !== null} onClose={() => { if (!isDeleting) setDeleting(null); }} aria-labelledby="delete-budget-title">
        <DialogTitle id="delete-budget-title">Delete {deleting?.name}?</DialogTitle>
        <DialogContent><DialogContentText>This removes the budget and its hidden-transaction choices. Your bank accounts and transactions stay saved.</DialogContentText></DialogContent>
        <DialogActions>
          <Button disabled={isDeleting} onClick={() => setDeleting(null)}>Cancel</Button>
          <Button color="error" loading={isDeleting} onClick={() => void handleDelete()}>Delete budget</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
