import { useState } from 'react';
import {
  Box, Button, Card, Chip, MenuItem, Stack, Table, TableBody, TableCell, TableHead, TableRow, TablePagination,
  TextField, Typography, Alert, CircularProgress,
} from '@mui/material';
import RouterIcon from '@mui/icons-material/Router';
import { usePagedFetch } from '../hooks/usePagedFetch';
import { api, apiError } from '../api/client';
import { useAuth } from '../auth/AuthContext';

interface NetRow {
  id: number; target_label: string; check_kind: 'ping' | 'tcp'; port: number | null;
  reachable: number; latency_ms: number | null; packet_loss: number | null; message: string | null; created_at: string;
}

export function Network() {
  const { can } = useAuth();
  const [targetType, setTargetType] = useState('');
  const [checkKind, setCheckKind] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const extraQuery = new URLSearchParams({
    ...(targetType ? { target_type: targetType } : {}),
    ...(checkKind ? { check_kind: checkKind } : {}),
    ...(from ? { from } : {}),
    ...(to ? { to } : {}),
  }).toString();
  const { items, initialLoading, error, reload, paginationProps } = usePagedFetch<NetRow>('/network/logs', { rowsPerPage: 50, extraQuery });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const runNetworkScan = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const res = await api.post('/monitoring/run?network=true');
      setMsg(`Network scan complete — checked ${res.data.checked} target(s).`);
      reload();
    } catch (err) {
      setMsg(apiError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
        <Typography variant="h4">Network Monitoring</Typography>
        {can('monitoring:run') && (
          <Button variant="contained" startIcon={<RouterIcon />} onClick={runNetworkScan} disabled={busy}>
            {busy ? 'Running…' : 'Run network scan'}
          </Button>
        )}
      </Stack>
      <Typography variant="body2" color="text.secondary" mb={2}>
        Ping (ICMP) and TCP port checks for every monitored target. Run a network scan to populate this
        (it is heavier than the regular scan, so it is on-demand).
      </Typography>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={2} useFlexGap flexWrap="wrap">
        <TextField select size="small" label="Target type" value={targetType} onChange={(e) => setTargetType(e.target.value)} sx={{ minWidth: 150 }}>
          <MenuItem value="">All targets</MenuItem>
          <MenuItem value="domain">Domain</MenuItem>
          <MenuItem value="subdomain">Subdomain</MenuItem>
          <MenuItem value="api">API</MenuItem>
        </TextField>
        <TextField select size="small" label="Check kind" value={checkKind} onChange={(e) => setCheckKind(e.target.value)} sx={{ minWidth: 140 }}>
          <MenuItem value="">All kinds</MenuItem>
          <MenuItem value="ping">Ping</MenuItem>
          <MenuItem value="tcp">TCP</MenuItem>
        </TextField>
        <TextField type="date" size="small" label="From" value={from} onChange={(e) => setFrom(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ minWidth: 150 }} />
        <TextField type="date" size="small" label="To" value={to} onChange={(e) => setTo(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ minWidth: 150 }} />
      </Stack>

      {msg && <Alert severity="info" sx={{ mb: 2 }} onClose={() => setMsg(null)}>{msg}</Alert>}
      {error && <Alert severity="error">{error}</Alert>}
      {initialLoading ? <CircularProgress /> : (
        <Card>
          <Table size="small">
            <TableHead><TableRow><TableCell>Target</TableCell><TableCell>Kind</TableCell><TableCell>Port</TableCell><TableCell>Reachable</TableCell><TableCell>Latency</TableCell><TableCell>Packet loss</TableCell><TableCell>Message</TableCell><TableCell>Time</TableCell></TableRow></TableHead>
            <TableBody>
              {items.map((n) => (
                <TableRow key={n.id} hover>
                  <TableCell>{n.target_label}</TableCell>
                  <TableCell>{n.check_kind}</TableCell>
                  <TableCell>{n.port ?? '—'}</TableCell>
                  <TableCell><Chip size="small" label={n.reachable ? 'yes' : 'no'} color={n.reachable ? 'success' : 'error'} variant="outlined" /></TableCell>
                  <TableCell>{n.latency_ms != null ? `${n.latency_ms} ms` : '—'}</TableCell>
                  <TableCell>{n.packet_loss != null ? `${n.packet_loss}%` : '—'}</TableCell>
                  <TableCell>{n.message}</TableCell>
                  <TableCell>{new Date(n.created_at).toLocaleString()}</TableCell>
                </TableRow>
              ))}
              {items.length === 0 && <TableRow><TableCell colSpan={8} align="center" sx={{ py: 4, color: 'text.secondary' }}>No network checks yet — click "Run network scan".</TableCell></TableRow>}
            </TableBody>
          </Table>
          <TablePagination {...paginationProps} />
        </Card>
      )}
    </Box>
  );
}
