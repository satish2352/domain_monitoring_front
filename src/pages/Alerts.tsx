import { Box, Button, Card, Table, TableBody, TableCell, TableHead, TableRow, Typography, Alert as MuiAlert, CircularProgress, Chip } from '@mui/material';
import { useFetch } from '../hooks/useFetch';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { SeverityChip } from '../components/StatusChip';
import type { Alert } from '../api/types';

export function Alerts() {
  const { can } = useAuth();
  const { data, loading, error, reload } = useFetch<{ items: Alert[]; open: number }>('/alerts?limit=200');

  const resolve = async (id: number) => { await api.post(`/alerts/${id}/resolve`); reload(); };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Alerts {data ? <Chip label={`${data.open} open`} color={data.open ? 'error' : 'success'} size="small" /> : null}</Typography>
      {error && <MuiAlert severity="error">{error}</MuiAlert>}
      {loading ? <CircularProgress /> : (
        <Card>
          <Table size="small">
            <TableHead><TableRow><TableCell>Target</TableCell><TableCell>Severity</TableCell><TableCell>Type</TableCell><TableCell>Message</TableCell><TableCell>State</TableCell><TableCell>Created</TableCell><TableCell align="right" /></TableRow></TableHead>
            <TableBody>
              {data?.items.map((a) => (
                <TableRow key={a.id} hover>
                  <TableCell>{a.target_label}</TableCell>
                  <TableCell><SeverityChip severity={a.severity} /></TableCell>
                  <TableCell>{a.type}</TableCell>
                  <TableCell>{a.message}</TableCell>
                  <TableCell><Chip size="small" label={a.resolved ? 'resolved' : 'open'} color={a.resolved ? 'success' : 'error'} variant="outlined" /></TableCell>
                  <TableCell>{new Date(a.created_at).toLocaleString()}</TableCell>
                  <TableCell align="right">{!a.resolved && can('alerts:write') && <Button size="small" onClick={() => resolve(a.id)}>Resolve</Button>}</TableCell>
                </TableRow>
              ))}
              {data?.items.length === 0 && <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>No alerts 🎉</TableCell></TableRow>}
            </TableBody>
          </Table>
        </Card>
      )}
    </Box>
  );
}
