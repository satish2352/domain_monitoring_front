import { useState } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import {
  Box, Button, Card, CardContent, Chip, Grid, IconButton, Stack,
  Table, TableBody, TableCell, TableHead, TableRow, Typography, Alert, CircularProgress, Link, Divider,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useFetch } from '../hooks/useFetch';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { StatusChip } from '../components/StatusChip';
import { AddSubdomainsDialog } from '../components/AddSubdomainsDialog';
import type { DomainDetail as DD, DnsRecord } from '../api/types';

export function DomainDetail() {
  const { id } = useParams();
  const { can } = useAuth();
  const { data, loading, error, reload } = useFetch<DD>(`/domains/${id}`);
  const dns = useFetch<{ records: DnsRecord[]; history: any[] }>(`/domains/${id}/dns`);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const delSub = async (sid: number) => { if (confirm('Delete subdomain?')) { await api.delete(`/subdomains/${sid}`); reload(); } };
  const scan = async () => { setBusy(true); try { await api.post(`/monitoring/run/${id}`); reload(); dns.reload(); } finally { setBusy(false); } };
  const [subBusy, setSubBusy] = useState<number | null>(null);
  const scanSub = async (sid: number) => { setSubBusy(sid); try { await api.post(`/monitoring/run/subdomain/${sid}`); reload(); } finally { setSubBusy(null); } };

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!data) return null;

  return (
    <Box>
      <Link component={RouterLink} to="/domains" variant="body2">← Back to domains</Link>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mt={1} mb={2}>
        <Typography variant="h4">{data.domain_name} <StatusChip status={data.status} /></Typography>
        {can('monitoring:run') && <Button startIcon={<RefreshIcon />} variant="contained" onClick={scan} disabled={busy}>{busy ? 'Scanning…' : 'Scan now'}</Button>}
      </Stack>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Card><CardContent>
            <Typography variant="h6" gutterBottom>Details</Typography>
            <Typography variant="body2">Host: {data.host_address || '—'}</Typography>
            <Typography variant="body2">Provider: {data.provider || '—'}</Typography>
            <Typography variant="body2">Registrar: {data.registrar || '—'}</Typography>
            <Typography variant="body2">Domain expiry: {data.domain_expiry || '—'}</Typography>
            <Typography variant="body2">SSL expiry: {data.ssl_expiry ? new Date(data.ssl_expiry).toLocaleString() : '—'}</Typography>
            <Typography variant="body2">Last checked: {data.last_checked ? new Date(data.last_checked).toLocaleString() : '—'}</Typography>
            {data.notes && <Typography variant="body2" color="text.secondary" mt={1}>{data.notes}</Typography>}
          </CardContent></Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card><CardContent>
            <Typography variant="h6" gutterBottom>DNS records</Typography>
            {dns.data?.records.length ? (
              <Stack spacing={0.5}>
                {dns.data.records.map((r, i) => (
                  <Box key={i} sx={{ display: 'flex', gap: 1 }}>
                    <Chip label={r.record_type} size="small" color="primary" variant="outlined" sx={{ minWidth: 64 }} />
                    <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>{r.value}</Typography>
                  </Box>
                ))}
              </Stack>
            ) : <Typography variant="body2" color="text.secondary">No DNS snapshot yet — run a scan.</Typography>}
            {dns.data?.history && dns.data.history.length > 0 && (
              <>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle2">Recent changes</Typography>
                {dns.data.history.slice(0, 8).map((h, i) => (
                  <Typography key={i} variant="caption" display="block" color={h.change === 'added' ? 'success.main' : 'error.main'}>
                    {h.change === 'added' ? '+' : '−'} {h.record_type} {h.value} ({new Date(h.changed_at).toLocaleString()})
                  </Typography>
                ))}
              </>
            )}
          </CardContent></Card>
        </Grid>
      </Grid>

      <Card sx={{ mt: 2 }}><CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography variant="h6">Subdomains</Typography>
          {can('domains:write') && <Button size="small" startIcon={<AddIcon />} onClick={() => setOpen(true)}>Add subdomains</Button>}
        </Stack>
        <Table size="small">
          <TableHead><TableRow><TableCell>Name</TableCell><TableCell>Status</TableCell><TableCell>Response</TableCell><TableCell>SSL expiry</TableCell><TableCell>Monitored</TableCell><TableCell align="right" /></TableRow></TableHead>
          <TableBody>
            {data.subdomains.map((s) => (
              <TableRow key={s.id} hover>
                <TableCell>{s.name}</TableCell>
                <TableCell><StatusChip status={s.last_status} /></TableCell>
                <TableCell>{s.last_response_ms != null ? `${s.last_response_ms} ms` : '—'}</TableCell>
                <TableCell>{s.ssl_expiry ? new Date(s.ssl_expiry).toLocaleDateString() : '—'}</TableCell>
                <TableCell>{s.monitoring_enabled ? 'Yes' : 'No'}</TableCell>
                <TableCell align="right">
                  {can('monitoring:run') && <IconButton size="small" title="Scan subdomain" disabled={subBusy === s.id} onClick={() => scanSub(s.id)}><RefreshIcon fontSize="small" /></IconButton>}
                  {can('domains:delete') && <IconButton size="small" color="error" onClick={() => delSub(s.id)}><DeleteIcon fontSize="small" /></IconButton>}
                </TableCell>
              </TableRow>
            ))}
            {data.subdomains.length === 0 && <TableRow><TableCell colSpan={6} align="center" sx={{ color: 'text.secondary', py: 3 }}>No subdomains.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </CardContent></Card>

      <AddSubdomainsDialog
        open={open}
        domainId={Number(id)}
        domainName={data.domain_name}
        onClose={() => setOpen(false)}
        onAdded={() => { reload(); }}
      />
    </Box>
  );
}
