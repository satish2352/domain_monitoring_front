import { useState } from 'react';
import {
  Box, Button, Card, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel,
  IconButton, MenuItem, Stack, Switch, Table, TableBody, TableCell, TableHead, TableRow, TablePagination, TextField,
  Typography, Alert, CircularProgress, Tooltip, Chip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { usePagedFetch } from '../hooks/usePagedFetch';
import { useDebounced } from '../hooks/useDebounced';
import { api, apiError } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { StatusChip } from '../components/StatusChip';
import type { ApiEndpoint, HttpMethod } from '../api/types';

const METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];

const blank = {
  name: '', method: 'GET' as HttpMethod, url: '', headers: '', body: '',
  expected_status: '', expected_body: '', timeout_ms: '', notes: '', monitoring_enabled: true,
};
type Form = typeof blank;

export function Apis() {
  const { can } = useAuth();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const debouncedQ = useDebounced(q);
  const extraQuery = new URLSearchParams({ ...(debouncedQ ? { q: debouncedQ } : {}), ...(status ? { status } : {}) }).toString();
  const { items, initialLoading, error, reload, paginationProps } = usePagedFetch<ApiEndpoint>('/api-endpoints', { rowsPerPage: 25, extraQuery });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ApiEndpoint | null>(null);
  const [form, setForm] = useState<Form>(blank);
  const [formError, setFormError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const openCreate = () => { setEditing(null); setForm(blank); setFormError(null); setOpen(true); };
  const openEdit = (e: ApiEndpoint) => {
    setEditing(e);
    setForm({
      name: e.name, method: e.method, url: e.url, headers: e.headers ?? '', body: e.body ?? '',
      expected_status: e.expected_status != null ? String(e.expected_status) : '',
      expected_body: e.expected_body ?? '',
      timeout_ms: e.timeout_ms != null ? String(e.timeout_ms) : '',
      notes: e.notes ?? '', monitoring_enabled: e.monitoring_enabled,
    });
    setFormError(null); setOpen(true);
  };

  const save = async () => {
    setFormError(null);
    const payload = {
      name: form.name,
      method: form.method,
      url: form.url,
      headers: form.headers.trim() || undefined,
      body: form.body.trim() || undefined,
      expected_status: form.expected_status.trim() ? Number(form.expected_status) : null,
      expected_body: form.expected_body.trim() || undefined,
      timeout_ms: form.timeout_ms.trim() ? Number(form.timeout_ms) : null,
      notes: form.notes.trim() || undefined,
      monitoring_enabled: form.monitoring_enabled,
    };
    try {
      if (editing) await api.put(`/api-endpoints/${editing.id}`, payload);
      else await api.post('/api-endpoints', payload);
      setOpen(false); reload();
    } catch (err) { setFormError(apiError(err)); }
  };

  const run = async (e: ApiEndpoint) => {
    setBusyId(e.id);
    try { await api.post(`/api-endpoints/${e.id}/run`); reload(); }
    finally { setBusyId(null); }
  };
  const remove = async (e: ApiEndpoint) => {
    if (!confirm(`Delete API monitor "${e.name}"?`)) return;
    await api.delete(`/api-endpoints/${e.id}`); reload();
  };

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4">API Endpoints</Typography>
        {can('apis:write') && <Button startIcon={<AddIcon />} variant="contained" onClick={openCreate}>Add API endpoint</Button>}
      </Stack>
      <Typography variant="body2" color="text.secondary" mb={2}>
        Monitor REST/HTTP endpoints (GET, POST, …). An endpoint is healthy when it returns the expected
        status code (and, if set, the response body contains the expected text). Failures raise alerts and
        emails just like domains.
      </Typography>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={2}>
        <TextField size="small" label="Search name / URL" value={q} onChange={(e) => setQ(e.target.value)} sx={{ minWidth: 260 }} />
        <TextField select size="small" label="Status" value={status} onChange={(e) => setStatus(e.target.value)} sx={{ minWidth: 160 }}>
          <MenuItem value="">All statuses</MenuItem>
          <MenuItem value="up">Up</MenuItem>
          <MenuItem value="down">Down</MenuItem>
          <MenuItem value="warn">Warning</MenuItem>
          <MenuItem value="unknown">Unknown</MenuItem>
        </TextField>
      </Stack>

      {error && <Alert severity="error">{error}</Alert>}
      {initialLoading ? <CircularProgress /> : (
        <Card>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell><TableCell>Method</TableCell><TableCell>URL</TableCell>
                <TableCell>Status</TableCell><TableCell>Code</TableCell><TableCell>Response</TableCell>
                <TableCell>Monitored</TableCell><TableCell>Last checked</TableCell><TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((e) => (
                <TableRow key={e.id} hover>
                  <TableCell><b>{e.name}</b></TableCell>
                  <TableCell><Chip size="small" label={e.method} /></TableCell>
                  <TableCell sx={{ maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <Tooltip title={e.url}><span>{e.url}</span></Tooltip>
                  </TableCell>
                  <TableCell><StatusChip status={e.status} /></TableCell>
                  <TableCell>{e.last_status_code ?? '—'}</TableCell>
                  <TableCell>{e.last_response_ms != null ? `${e.last_response_ms} ms` : '—'}</TableCell>
                  <TableCell>{e.monitoring_enabled ? 'Yes' : 'No'}</TableCell>
                  <TableCell>{e.last_checked ? new Date(e.last_checked).toLocaleString() : '—'}</TableCell>
                  <TableCell align="right">
                    {can('apis:write') && <Tooltip title="Check now"><span><IconButton size="small" disabled={busyId === e.id} onClick={() => run(e)}><RefreshIcon fontSize="small" /></IconButton></span></Tooltip>}
                    {can('apis:write') && <Tooltip title="Edit"><IconButton size="small" onClick={() => openEdit(e)}><EditIcon fontSize="small" /></IconButton></Tooltip>}
                    {can('apis:delete') && <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => remove(e)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>}
                  </TableCell>
                </TableRow>
              ))}
              {items.length === 0 && <TableRow><TableCell colSpan={9} align="center" sx={{ py: 4, color: 'text.secondary' }}>No API endpoints yet. Add one to start monitoring.</TableCell></TableRow>}
            </TableBody>
          </Table>
          <TablePagination {...paginationProps} />
        </Card>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editing ? 'Edit API endpoint' : 'Add API endpoint'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Orders API — health" required fullWidth />
            <Stack direction="row" spacing={2}>
              <TextField select label="Method" value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value as HttpMethod })} sx={{ width: 160 }}>
                {METHODS.map((m) => <MenuItem key={m} value={m}>{m}</MenuItem>)}
              </TextField>
              <TextField label="URL" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://api.example.com/health" required fullWidth />
            </Stack>
            <Stack direction="row" spacing={2}>
              <TextField label="Expected status" value={form.expected_status} onChange={(e) => setForm({ ...form, expected_status: e.target.value })} placeholder="200 (blank = any 2xx/3xx)" fullWidth />
              <TextField label="Timeout (ms)" value={form.timeout_ms} onChange={(e) => setForm({ ...form, timeout_ms: e.target.value })} placeholder="10000" fullWidth />
            </Stack>
            <TextField label="Expected body contains" value={form.expected_body} onChange={(e) => setForm({ ...form, expected_body: e.target.value })} placeholder='e.g. "ok" or "status":"healthy"' fullWidth />
            <TextField label="Request headers (JSON)" value={form.headers} onChange={(e) => setForm({ ...form, headers: e.target.value })} placeholder='{"Authorization":"Bearer …"}' multiline rows={2} fullWidth />
            <TextField label="Request body" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} placeholder='{"ping":true}' multiline rows={2} fullWidth helperText="Sent for POST/PUT/PATCH/DELETE" />
            <TextField label="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} multiline rows={2} fullWidth />
            <FormControlLabel control={<Switch checked={form.monitoring_enabled} onChange={(e) => setForm({ ...form, monitoring_enabled: e.target.checked })} />} label="Monitoring enabled" />
            {formError && <Alert severity="error">{formError}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={save}>{editing ? 'Save' : 'Create'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
