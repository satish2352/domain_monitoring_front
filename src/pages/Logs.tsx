import { Box, Card, MenuItem, Stack, Table, TableBody, TableCell, TableHead, TableRow, TablePagination, TextField, Typography, Alert, CircularProgress } from '@mui/material';
import { useState } from 'react';
import { usePagedFetch } from '../hooks/usePagedFetch';
import { StatusChip } from '../components/StatusChip';
import type { MonitoringLog } from '../api/types';

export function Logs() {
  const [checkType, setCheckType] = useState('');
  const [status, setStatus] = useState('');
  const [targetType, setTargetType] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const extraQuery = new URLSearchParams({
    ...(checkType ? { check_type: checkType } : {}),
    ...(status ? { status } : {}),
    ...(targetType ? { target_type: targetType } : {}),
    ...(from ? { from } : {}),
    ...(to ? { to } : {}),
  }).toString();
  const { items, initialLoading, error, paginationProps } = usePagedFetch<MonitoringLog>('/monitoring/logs', { rowsPerPage: 50, extraQuery });
  return (
    <Box>
      <Typography variant="h4" gutterBottom>Monitoring Logs</Typography>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={2} useFlexGap flexWrap="wrap">
        <TextField select size="small" label="Check type" value={checkType} onChange={(e) => setCheckType(e.target.value)} sx={{ minWidth: 150 }}>
          <MenuItem value="">All checks</MenuItem>
          <MenuItem value="http">HTTP</MenuItem>
          <MenuItem value="dns">DNS</MenuItem>
          <MenuItem value="ssl">SSL</MenuItem>
          <MenuItem value="network">Network</MenuItem>
          <MenuItem value="api">API</MenuItem>
        </TextField>
        <TextField select size="small" label="Status" value={status} onChange={(e) => setStatus(e.target.value)} sx={{ minWidth: 140 }}>
          <MenuItem value="">All statuses</MenuItem>
          <MenuItem value="up">Up</MenuItem>
          <MenuItem value="down">Down</MenuItem>
          <MenuItem value="warn">Warning</MenuItem>
        </TextField>
        <TextField select size="small" label="Target type" value={targetType} onChange={(e) => setTargetType(e.target.value)} sx={{ minWidth: 150 }}>
          <MenuItem value="">All targets</MenuItem>
          <MenuItem value="domain">Domain</MenuItem>
          <MenuItem value="subdomain">Subdomain</MenuItem>
          <MenuItem value="api">API</MenuItem>
        </TextField>
        <TextField type="date" size="small" label="From" value={from} onChange={(e) => setFrom(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ minWidth: 150 }} />
        <TextField type="date" size="small" label="To" value={to} onChange={(e) => setTo(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ minWidth: 150 }} />
      </Stack>

      {error && <Alert severity="error">{error}</Alert>}
      {initialLoading ? <CircularProgress /> : (
        <Card>
          <Table size="small">
            <TableHead><TableRow><TableCell>Target</TableCell><TableCell>Check</TableCell><TableCell>Status</TableCell><TableCell>Code</TableCell><TableCell>Response</TableCell><TableCell>Message</TableCell><TableCell>Time</TableCell></TableRow></TableHead>
            <TableBody>
              {items.map((l) => (
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
              {items.length === 0 && <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>No logs yet. Run a scan.</TableCell></TableRow>}
            </TableBody>
          </Table>
          <TablePagination {...paginationProps} />
        </Card>
      )}
    </Box>
  );
}
