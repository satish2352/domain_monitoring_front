import { Box, Card, Table, TableBody, TableCell, TableHead, TableRow, Typography, Alert, CircularProgress } from '@mui/material';
import { useFetch } from '../hooks/useFetch';
import { StatusChip } from '../components/StatusChip';
import type { MonitoringLog } from '../api/types';

export function Logs() {
  const { data, loading, error } = useFetch<{ items: MonitoringLog[] }>('/monitoring/logs?limit=300');
  return (
    <Box>
      <Typography variant="h4" gutterBottom>Monitoring Logs</Typography>
      {error && <Alert severity="error">{error}</Alert>}
      {loading ? <CircularProgress /> : (
        <Card>
          <Table size="small">
            <TableHead><TableRow><TableCell>Target</TableCell><TableCell>Check</TableCell><TableCell>Status</TableCell><TableCell>Code</TableCell><TableCell>Response</TableCell><TableCell>Message</TableCell><TableCell>Time</TableCell></TableRow></TableHead>
            <TableBody>
              {data?.items.map((l) => (
                <TableRow key={l.id} hover>
                  <TableCell>{l.target_label}</TableCell>
                  <TableCell>{l.check_type}</TableCell>
                  <TableCell><StatusChip status={l.status} /></TableCell>
                  <TableCell>{l.status_code ?? '—'}</TableCell>
                  <TableCell>{l.response_ms != null ? `${l.response_ms} ms` : '—'}</TableCell>
                  <TableCell sx={{ maxWidth: 360 }}>{l.message}</TableCell>
                  <TableCell>{new Date(l.created_at).toLocaleString()}</TableCell>
                </TableRow>
              ))}
              {data?.items.length === 0 && <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>No logs yet. Run a scan.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </Card>
      )}
    </Box>
  );
}
