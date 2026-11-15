import { useEffect, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import LinearProgress from '@mui/material/LinearProgress';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { getBudget, intervalLabels, setTransactionExcluded } from '../api/budgets';
import type { Budget, BudgetDetail, BudgetTransaction } from '../api/budgets';
import { formatDate, formatMoney } from '../utils/format';

type Props = {
  budget: Budget;
  onSummaryChange: (budget: Budget) => void;
  onBusyChange: (busy: boolean) => void;
};

const treatments = {
  COUNTED: 'Counted', HIDDEN: 'Hidden', MONEY_IN: 'Money in', OTHER_CURRENCY: 'Other currency', ZERO_AMOUNT: 'Zero amount',
};
const PAGE_SIZE = 25;

export default function BudgetDetailPanel({ budget, onSummaryChange, onBusyChange }: Props) {
  const [detail, setDetail] = useState<BudgetDetail | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [view, setView] = useState('counted');
  const [page, setPage] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    getBudget(budget.id, controller.signal)
      .then(data => { if (!controller.signal.aborted) { setDetail(data); onSummaryChange(data.budget); } })
      .catch(error => {
        if (!controller.signal.aborted) setError(error instanceof Error ? error.message : 'Could not load this budget.');
      })
      .finally(() => { if (!controller.signal.aborted) setIsLoading(false); });
    return () => controller.abort();
  }, [budget.id, onSummaryChange]);

  async function toggleExcluded(transaction: BudgetTransaction) {
    if (savingId !== null) return;
    setSavingId(transaction.id);
    onBusyChange(true);
    setError('');
    try {
      const updated = await setTransactionExcluded(budget.id, transaction.id, !transaction.excluded);
      setDetail(updated);
      onSummaryChange(updated.budget);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Could not change this transaction.');
    } finally {
      setSavingId(null);
      onBusyChange(false);
    }
  }

  const summary = detail?.budget ?? budget;
  const query = search.trim().toLocaleLowerCase();
  const rows = (detail?.transactions ?? []).filter(transaction =>
    (view === 'all' || (view === 'hidden' ? transaction.excluded : transaction.treatment === 'COUNTED'))
    && (!query || `${transaction.merchantName ?? 'Bank transaction'} ${transaction.accountName}`.toLocaleLowerCase().includes(query)),
  );
  const currentPage = Math.min(page, Math.max(0, Math.ceil(rows.length / PAGE_SIZE) - 1));
  const progress = summary.amount > 0 ? Math.min(100, Math.max(0, summary.spent / summary.amount * 100)) : 0;
  const overBudget = summary.remaining < 0;

  return (
    <Stack spacing={3}>
      <Box>
        <Typography component="h2" variant="h5">{summary.name}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {intervalLabels[summary.interval]} · {formatDate(summary.periodStart)}–{formatDate(summary.periodEnd)} · {summary.timeZone}
        </Typography>
      </Box>
      {error && <Alert severity="error">{error} Reload budgets to try again.</Alert>}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2 }}>
        {[
          { label: 'Spending limit', value: summary.amount, color: 'text.primary' },
          { label: 'Spent this period', value: summary.spent, color: 'text.primary' },
          { label: overBudget ? 'Over budget' : 'Remaining', value: Math.abs(summary.remaining), color: overBudget ? 'error.main' : 'success.main' },
        ].map(item => (
          <Paper key={item.label} variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="body2" color="text.secondary">{item.label}</Typography>
            <Typography variant="h4" sx={{ mt: 1, color: item.color, fontVariantNumeric: 'tabular-nums', overflowWrap: 'anywhere' }}>
              {formatMoney(item.value, summary.currencyCode)}
            </Typography>
          </Paper>
        ))}
      </Box>
      <Box>
        <LinearProgress variant="determinate" value={progress} color={overBudget ? 'error' : 'success'}
          aria-label="Budget used" sx={{ height: 8, borderRadius: 1 }} />
        <Stack direction="row" spacing={1} useFlexGap sx={{ mt: 2, flexWrap: 'wrap' }}>
          {summary.accounts.map(account => <Chip key={account.id} size="small" variant="outlined"
            label={`${account.institutionName ?? 'Linked bank'} · ${account.name}${account.mask ? ` •••• ${account.mask}` : ''}${account.active ? '' : ' (inactive)'}`} />)}
          {summary.accounts.length === 0 && <Typography variant="body2" color="text.secondary">Edit this budget to select accounts.</Typography>}
        </Stack>
      </Box>
      <Alert severity="info">
        Only posted money out is counted. Incoming money does not increase your budget.
        Hide transfers or card payments if they would count the same spending twice.
      </Alert>
      <Paper component="section" variant="outlined" aria-label="Budget transactions" aria-busy={isLoading || savingId !== null}
        sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ p: 3, bgcolor: 'action.hover' }}>
          <TextField label="Search transactions" type="search" size="small" fullWidth value={search}
            onChange={event => { setSearch(event.target.value); setPage(0); }} />
          <TextField select label="Show" size="small" value={view} sx={{ minWidth: 200 }}
            onChange={event => { setView(event.target.value); setPage(0); }}>
            <MenuItem value="counted">Counted transactions</MenuItem>
            <MenuItem value="hidden">Hidden ({summary.excludedTransactionCount})</MenuItem>
            <MenuItem value="all">All posted transactions</MenuItem>
          </TextField>
        </Stack>
        {isLoading ? <Box sx={{ p: 3 }}><Typography role="status" color="text.secondary">Loading posted transactions…</Typography></Box>
          : detail && rows.length === 0 ? (
            <Stack spacing={1} sx={{ p: 5, textAlign: 'center' }}>
              <Typography variant="h6">{view === 'hidden' ? 'No hidden transactions' : 'No matching transactions'}</Typography>
              <Typography color="text.secondary">Try another view or search. Only the current budget period is shown.</Typography>
            </Stack>
          ) : detail && (
            <>
              <TableContainer role="region" aria-label="Budget transactions table" tabIndex={0}>
                <Table aria-label="Posted transactions in this budget" sx={{ minWidth: 720 }}>
                  <TableHead><TableRow>
                    <TableCell sortDirection="desc">Date</TableCell><TableCell>Merchant</TableCell><TableCell>Account</TableCell>
                    <TableCell>Budget treatment</TableCell><TableCell align="right">Amount</TableCell><TableCell align="right">Action</TableCell>
                  </TableRow></TableHead>
                  <TableBody>
                    {rows.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE).map(transaction => (
                      <TableRow key={transaction.id} hover>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(transaction.date)}</TableCell>
                        <TableCell component="th" scope="row" sx={{ maxWidth: 240, overflowWrap: 'anywhere' }}>
                          {transaction.merchantName?.trim() || 'Bank transaction'}
                        </TableCell>
                        <TableCell>{transaction.accountName}</TableCell>
                        <TableCell><Chip size="small" variant="outlined" label={treatments[transaction.treatment]}
                          color={transaction.treatment === 'COUNTED' ? 'success' : 'default'} /></TableCell>
                        <TableCell align="right" sx={{ whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
                          {transaction.amount < 0 ? '+' : transaction.amount > 0 ? '−' : ''}{formatMoney(Math.abs(transaction.amount), transaction.currencyCode)}
                        </TableCell>
                        <TableCell align="right">
                          <Button size="small" color={transaction.excluded ? 'success' : 'inherit'}
                            disabled={savingId !== null} onClick={() => void toggleExcluded(transaction)}
                            aria-label={`${transaction.excluded ? 'Restore' : 'Hide'} ${transaction.merchantName?.trim() || 'bank transaction'} on ${formatDate(transaction.date)} from ${transaction.accountName}`}>
                            {savingId === transaction.id ? 'Saving…' : transaction.excluded ? 'Restore' : 'Hide'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination component="div" count={rows.length} page={currentPage} rowsPerPage={PAGE_SIZE}
                rowsPerPageOptions={[PAGE_SIZE]} onPageChange={(_, next) => setPage(next)} />
            </>
          )}
      </Paper>
    </Stack>
  );
}
