import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { BankConnection } from '../api/accounts';
import { formatMoney } from '../utils/format';

type Props = { connection: BankConnection; number: number };

export default function BankConnectionCard({ connection, number }: Props) {
  const institutionName = connection.institutionName?.trim();
  const heading = institutionName || `Bank connection ${number}`;
  const initials = institutionName
    ? institutionName.split(/\s+/).slice(0, 2).map(word => word[0]).join('').toUpperCase()
    : String(number);
  const headingId = `connection-${connection.id}-heading`;

  return (
    <Card component="section" variant="outlined" aria-labelledby={headingId} sx={{ borderRadius: 3 }}>
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', rowGap: 2 }}>
          <Stack direction="row" spacing={2} sx={{ alignItems: 'center', minWidth: 0, flex: 1 }}>
            <Avatar variant="rounded" sx={{ bgcolor: 'success.main', width: 48, height: 48 }}>{initials}</Avatar>
            <Box sx={{ minWidth: 0 }}>
              {institutionName && <Typography variant="overline" color="text.secondary">Bank connection {number}</Typography>}
              <Typography component="h2" variant="h6" id={headingId} sx={{ overflowWrap: 'anywhere' }}>{heading}</Typography>
              <Typography variant="caption" color="text.secondary">
                {connection.accountsLastFetchedAt
                  ? `Details retrieved ${new Date(connection.accountsLastFetchedAt).toLocaleString()}`
                  : 'Account details have not been retrieved yet'}
              </Typography>
            </Box>
          </Stack>
          <Chip label={`${connection.accounts.length} ${connection.accounts.length === 1 ? 'account' : 'accounts'}`} size="small" variant="outlined" />
        </Stack>
        {!institutionName && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Bank name unavailable. Refresh accounts to retrieve the latest details.
          </Typography>
        )}
      </CardContent>
      <Divider />
      <CardContent sx={{ p: { xs: 2, sm: 3 }, bgcolor: 'action.hover' }}>
        {connection.accounts.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            {connection.accountsLastFetchedAt
              ? 'No active accounts were returned for this connection.'
              : 'Your bank is linked. Refresh accounts to load its account details.'}
          </Typography>
        ) : (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(3, minmax(0, 1fr))' }, gap: 2 }}>
            {connection.accounts.map(account => (
              <Paper component="article" key={account.id} variant="outlined" sx={{ p: 2.5, borderRadius: 2, minWidth: 0 }}>
                <Stack spacing={2} sx={{ height: '100%' }}>
                  <Box>
                    <Typography component="h3" variant="subtitle1" sx={{ fontWeight: 600, overflowWrap: 'anywhere' }}>
                      {account.name}
                    </Typography>
                    <Stack direction="row" spacing={1} useFlexGap sx={{ alignItems: 'center', flexWrap: 'wrap', mt: 0.5 }}>
                      {account.mask && <Typography variant="body2" color="text.secondary">•••• {account.mask}</Typography>}
                      {(account.subtype || account.type) && <Chip size="small"
                        label={(account.subtype || account.type)?.replaceAll('_', ' ')} sx={{ textTransform: 'capitalize' }} />}
                    </Stack>
                    {account.officialName && account.officialName !== account.name && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, overflowWrap: 'anywhere' }}>
                        {account.officialName}
                      </Typography>
                    )}
                  </Box>
                  <Box sx={{ flexGrow: 1 }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary">Current balance</Typography>
                    <Typography variant="h5" sx={{ mt: 0.5, fontVariantNumeric: 'tabular-nums', overflowWrap: 'anywhere' }}>
                      {account.currentBalance === null ? 'Unavailable' : formatMoney(account.currentBalance, account.currencyCode)}
                    </Typography>
                    {account.availableBalance !== null && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        {account.type === 'credit' ? 'Available credit' : 'Available balance'}: {formatMoney(account.availableBalance, account.currencyCode)}
                      </Typography>
                    )}
                  </Box>
                </Stack>
              </Paper>
            ))}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
