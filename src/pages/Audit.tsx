import { Box, Card, MenuItem, Stack, Table, TableBody, TableCell, TableHead, TableRow, TablePagination, TextField, Typography, Alert, CircularProgress } from '@mui/material';
import { useState } from 'react';
import { usePagedFetch } from '../hooks/usePagedFetch';

interface AuditRow {
  id: number; user_email: string | null; action: string; module: string; entity: string | null; ip: string | null; created_at: string;
}

const MODULES = ['auth', 'settings', 'scheduler', 'monitoring', 'domains', 'subdomains', 'alerts', 'registrars', 'users'];

export function Audit() {
  const [module, setModule] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const extraQuery = new URLSearchParams({
    ...(module ? { module } : {}),
    ...(from ? { from } : {}),
    ...(to ? { to } : {}),
  }).toString();
  const { items, initialLoading, error, paginationProps } = usePagedFetch<AuditRow>('/audit', { rowsPerPage: 50, extraQuery });
  return (
    <Box>
      <Typography variant="h4" gutterBottom>Audit Log</Typography>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={2} useFlexGap flexWrap="wrap">
        <TextField select size="small" label="Module" value={module} onChange={(e) => setModule(e.target.value)} sx={{ minWidth: 180 }}>
          <MenuItem value="">All modules</MenuItem>
          {MODULES.map((m) => <MenuItem key={m} value={m}>{m}</MenuItem>)}
        </TextField>
        <TextField type="date" size="small" label="From" value={from} onChange={(e) => setFrom(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ minWidth: 150 }} />
        <TextField type="date" size="small" label="To" value={to} onChange={(e) => setTo(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ minWidth: 150 }} />
      </Stack>

      {error && <Alert severity="error">{error}</Alert>}
      {initialLoading ? <CircularProgress /> : (
        <Card>
          <Table size="small">
            <TableHead><TableRow><TableCell>Time</TableCell><TableCell>User</TableCell><TableCell>Action</TableCell><TableCell>Module</TableCell><TableCell>Entity</TableCell><TableCell>IP</TableCell></TableRow></TableHead>
            <TableBody>
              {items.map((a) => (
                <TableRow key={a.id} hover>
                  <TableCell>{new Date(a.created_at).toLocaleString()}</TableCell>
                  <TableCell>{a.user_email || '—'}</TableCell>
                  <TableCell>{a.action}</TableCell>
                  <TableCell>{a.module}</TableCell>
                  <TableCell>{a.entity || '—'}</TableCell>
                  <TableCell>{a.ip || '—'}</TableCell>
                </TableRow>
              ))}
              {items.length === 0 && <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>No audit entries yet.</TableCell></TableRow>}
            </TableBody>
          </Table>
          <TablePagination {...paginationProps} />
        </Card>
      )}
    </Box>
  );
}
