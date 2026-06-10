import { Box, Card, Chip, Table, TableBody, TableCell, TableHead, TableRow, Typography, Alert, CircularProgress } from '@mui/material';
import { useFetch } from '../hooks/useFetch';

interface SslRow {
  id: number; target_label: string; valid: number; issuer: string | null;
  days_remaining: number | null; valid_to: string | null; message: string | null;
}

function daysColor(d: number | null): 'error' | 'warning' | 'success' | 'default' {
  if (d == null) return 'default';
  if (d <= 7) return 'error';
  if (d <= 30) return 'warning';
  return 'success';
}

export function Ssl() {
  const { data, loading, error } = useFetch<{ items: SslRow[] }>('/ssl');
  return (
    <Box>
      <Typography variant="h4" gutterBottom>SSL Certificates</Typography>
      {error && <Alert severity="error">{error}</Alert>}
      {loading ? <CircularProgress /> : (
        <Card>
          <Table size="small">
            <TableHead><TableRow><TableCell>Target</TableCell><TableCell>Valid</TableCell><TableCell>Issuer</TableCell><TableCell>Days remaining</TableCell><TableCell>Expires</TableCell><TableCell>Message</TableCell></TableRow></TableHead>
            <TableBody>
              {data?.items.map((s) => (
                <TableRow key={s.id} hover>
                  <TableCell>{s.target_label}</TableCell>
                  <TableCell><Chip size="small" label={s.valid ? 'valid' : 'invalid'} color={s.valid ? 'success' : 'error'} variant="outlined" /></TableCell>
                  <TableCell>{s.issuer || '—'}</TableCell>
                  <TableCell><Chip size="small" label={s.days_remaining ?? '—'} color={daysColor(s.days_remaining)} /></TableCell>
                  <TableCell>{s.valid_to ? new Date(s.valid_to).toLocaleDateString() : '—'}</TableCell>
                  <TableCell>{s.message}</TableCell>
                </TableRow>
              ))}
              {data?.items.length === 0 && <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>No SSL data yet. Run a scan over HTTPS targets.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </Card>
      )}
    </Box>
  );
}
