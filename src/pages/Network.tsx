import { useState } from 'react';
import {
  Box, Button, Card, Chip, Stack, Table, TableBody, TableCell, TableHead, TableRow,
  Typography, Alert, CircularProgress,
} from '@mui/material';
import RouterIcon from '@mui/icons-material/Router';
import { useFetch } from '../hooks/useFetch';
import { api, apiError } from '../api/client';
import { useAuth } from '../auth/AuthContext';

interface NetRow {
  id: number; target_label: string; check_kind: 'ping' | 'tcp'; port: number | null;
  reachable: number; latency_ms: number | null; packet_loss: number | null; message: string | null; created_at: string;
}

export function Network() {
  const { can } = useAuth();
  const { data, loading, error, reload } = useFetch<{ items: NetRow[] }>('/network/logs?limit=300');
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

      {msg && <Alert severity="info" sx={{ mb: 2 }} onClose={() => setMsg(null)}>{msg}</Alert>}
      {error && <Alert severity="error">{error}</Alert>}
      {loading ? <CircularProgress /> : (
        <Card>
          <Table size="small">
            <TableHead><TableRow><TableCell>Target</TableCell><TableCell>Kind</TableCell><TableCell>Port</TableCell><TableCell>Reachable</TableCell><TableCell>Latency</TableCell><TableCell>Packet loss</TableCell><TableCell>Message</TableCell><TableCell>Time</TableCell></TableRow></TableHead>
            <TableBody>
              {data?.items.map((n) => (
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
              {data?.items.length === 0 && <TableRow><TableCell colSpan={8} align="center" sx={{ py: 4, color: 'text.secondary' }}>No network checks yet — click "Run network scan".</TableCell></TableRow>}
            </TableBody>
          </Table>
        </Card>
      )}
    </Box>
  );
}
