import { Box, Button, Card, MenuItem, Stack, Table, TableBody, TableCell, TableHead, TableRow, TablePagination, TextField, Typography, Alert as MuiAlert, CircularProgress, Chip } from '@mui/material';
import { useState } from 'react';
import { usePagedFetch } from '../hooks/usePagedFetch';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { SeverityChip } from '../components/StatusChip';
import type { Alert } from '../api/types';

export function Alerts() {
  const { can } = useAuth();
  const [severity, setSeverity] = useState('');
  const [state, setState] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const extraQuery = new URLSearchParams({
    ...(severity ? { severity } : {}),
    ...(state ? { resolved: state === 'resolved' ? 'true' : 'false' } : {}),
    ...(from ? { from } : {}),
    ...(to ? { to } : {}),
  }).toString();
  const { items, data, initialLoading, error, reload, paginationProps } = usePagedFetch<Alert>('/alerts', { rowsPerPage: 50, extraQuery });
  const open = (data as { open?: number } | null)?.open ?? 0;

  const resolve = async (id: number) => { await api.post(`/alerts/${id}/resolve`); reload(); };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Alerts {data ? <Chip label={`${open} open`} color={open ? 'error' : 'success'} size="small" /> : null}</Typography>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={2} useFlexGap flexWrap="wrap">
        <TextField select size="small" label="Severity" value={severity} onChange={(e) => setSeverity(e.target.value)} sx={{ minWidth: 160 }}>
          <MenuItem value="">All severities</MenuItem>
          <MenuItem value="critical">Critical</MenuItem>
          <MenuItem value="warning">Warning</MenuItem>
          <MenuItem value="info">Info</MenuItem>
        </TextField>
        <TextField select size="small" label="State" value={state} onChange={(e) => setState(e.target.value)} sx={{ minWidth: 160 }}>
          <MenuItem value="">All states</MenuItem>
          <MenuItem value="open">Open</MenuItem>
          <MenuItem value="resolved">Resolved</MenuItem>
        </TextField>
        <TextField type="date" size="small" label="From" value={from} onChange={(e) => setFrom(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ minWidth: 150 }} />
        <TextField type="date" size="small" label="To" value={to} onChange={(e) => setTo(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ minWidth: 150 }} />
      </Stack>

      {error && <MuiAlert severity="error">{error}</MuiAlert>}
      {initialLoading ? <CircularProgress /> : (
        <Card>
          <Table size="small">
            <TableHead><TableRow><TableCell>Target</TableCell><TableCell>Severity</TableCell><TableCell>Type</TableCell><TableCell>Message</TableCell><TableCell>State</TableCell><TableCell>Created</TableCell><TableCell align="right" /></TableRow></TableHead>
            <TableBody>
              {items.map((a) => (
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
              {items.length === 0 && <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>No alerts 🎉</TableCell></TableRow>}
            </TableBody>
          </Table>
          <TablePagination {...paginationProps} />
        </Card>
      )}
    </Box>
  );
}
