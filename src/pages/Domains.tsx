import { Fragment, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Autocomplete, Box, Button, Card, Collapse, Dialog, DialogActions, DialogContent, DialogTitle, Divider, FormControlLabel,
  IconButton, Stack, Switch, Table, TableBody, TableCell, TableHead, TableRow, TextField,
  Typography, Alert, CircularProgress, Tooltip, Chip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import { useFetch } from '../hooks/useFetch';
import { api, apiError } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { StatusChip } from '../components/StatusChip';
import { AddSubdomainsDialog } from '../components/AddSubdomainsDialog';
import { SubdomainRowsEditor, emptyRow, rowsToItems, type SubRow } from '../components/SubdomainRowsEditor';
import type { Domain, Registrar, Subdomain } from '../api/types';

const blank = { domain_name: '', host_address: '', provider: '', registrar: '', domain_expiry: '', dkim_selectors: '', notes: '', monitoring_enabled: true };

export function Domains() {
  const { can } = useAuth();
  const navigate = useNavigate();
  const { data, loading, error, reload } = useFetch<{ items: Domain[] }>('/domains?limit=500');
  const registrars = useFetch<{ items: Registrar[] }>('/registrars');
  const registrarNames = (registrars.data?.items ?? []).map((r) => r.name);

  // domain dialog
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Domain | null>(null);
  const [form, setForm] = useState(blank);
  const [formError, setFormError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  // subdomains entered inline while creating a domain
  const [newSubRows, setNewSubRows] = useState<SubRow[]>([emptyRow()]);
  const [newSubMonitoring, setNewSubMonitoring] = useState(true);

  // grouping / subdomains
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [subs, setSubs] = useState<Record<number, Subdomain[] | 'loading'>>({});
  const [subBusy, setSubBusy] = useState<number | null>(null);
  const [addSubFor, setAddSubFor] = useState<Domain | null>(null);

  const loadSubs = async (domainId: number) => {
    setSubs((s) => ({ ...s, [domainId]: 'loading' }));
    const res = await api.get<{ items: Subdomain[] }>(`/domains/${domainId}/subdomains`);
    setSubs((s) => ({ ...s, [domainId]: res.data.items }));
  };
  const toggle = (domainId: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(domainId)) next.delete(domainId);
      else { next.add(domainId); if (!subs[domainId]) loadSubs(domainId); }
      return next;
    });
  };

  const openCreate = () => {
    setEditing(null); setForm(blank); setFormError(null);
    setNewSubRows([emptyRow()]); setNewSubMonitoring(true);
    setOpen(true);
  };
  const openEdit = (d: Domain) => {
    setEditing(d);
    setForm({ domain_name: d.domain_name, host_address: d.host_address ?? '', provider: d.provider ?? '', registrar: d.registrar ?? '', domain_expiry: d.domain_expiry ?? '', dkim_selectors: d.dkim_selectors ?? '', notes: d.notes ?? '', monitoring_enabled: d.monitoring_enabled });
    setFormError(null); setOpen(true);
  };
  // If the chosen registrar isn't in the master yet, add it (master stays the source of truth).
  const ensureRegistrar = async () => {
    const name = form.registrar.trim();
    if (name && !registrarNames.includes(name)) {
      try { await api.post('/registrars', { name }); await registrars.reload(); } catch { /* 403/409 — keep name as text */ }
    }
  };

  const save = async () => {
    setFormError(null);
    try {
      await ensureRegistrar();
      if (editing) {
        await api.put(`/domains/${editing.id}`, form);
      } else {
        const subdomains = rowsToItems(newSubRows, newSubMonitoring);
        await api.post('/domains', { ...form, ...(subdomains.length ? { subdomains } : {}) });
      }
      setOpen(false); reload();
    } catch (err) { setFormError(apiError(err)); }
  };
  const scan = async (d: Domain) => {
    setBusyId(d.id);
    try { await api.post(`/monitoring/run/${d.id}`); reload(); if (expanded.has(d.id)) loadSubs(d.id); }
    finally { setBusyId(null); }
  };
  const remove = async (d: Domain) => {
    if (!confirm(`Delete ${d.domain_name} and its subdomains?`)) return;
    await api.delete(`/domains/${d.id}`); reload();
  };
  const scanSub = async (s: Subdomain) => {
    setSubBusy(s.id);
    try { await api.post(`/monitoring/run/subdomain/${s.id}`); await loadSubs(s.domain_id); }
    finally { setSubBusy(null); }
  };
  const delSub = async (s: Subdomain) => { if (confirm(`Delete subdomain ${s.name}?`)) { await api.delete(`/subdomains/${s.id}`); loadSubs(s.domain_id); } };

  const colSpan = 8;

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4">Domains</Typography>
        {can('domains:write') && <Button startIcon={<AddIcon />} variant="contained" onClick={openCreate}>Add domain</Button>}
      </Stack>
      <Typography variant="body2" color="text.secondary" mb={2}>Expand a domain to see its subdomains grouped underneath.</Typography>

      {error && <Alert severity="error">{error}</Alert>}
      {loading ? <CircularProgress /> : (
        <Card>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell width={40} />
                <TableCell>Domain</TableCell><TableCell>Status</TableCell><TableCell>Response</TableCell>
                <TableCell>SSL expiry</TableCell><TableCell>Monitored</TableCell><TableCell>Last checked</TableCell><TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data?.items.map((d) => {
                const isOpen = expanded.has(d.id);
                const rowSubs = subs[d.id];
                return (
                  <Fragment key={d.id}>
                    <TableRow hover>
                      <TableCell>
                        <IconButton size="small" onClick={() => toggle(d.id)} aria-label="expand">
                          {isOpen ? <KeyboardArrowDownIcon /> : <KeyboardArrowRightIcon />}
                        </IconButton>
                      </TableCell>
                      <TableCell><b>{d.domain_name}</b>{d.host_address && <Typography variant="caption" display="block" color="text.secondary">{d.host_address}</Typography>}</TableCell>
                      <TableCell><StatusChip status={d.status} /></TableCell>
                      <TableCell>{d.last_response_ms != null ? `${d.last_response_ms} ms` : '—'}</TableCell>
                      <TableCell>{d.ssl_expiry ? new Date(d.ssl_expiry).toLocaleDateString() : '—'}</TableCell>
                      <TableCell>{d.monitoring_enabled ? 'Yes' : 'No'}</TableCell>
                      <TableCell>{d.last_checked ? new Date(d.last_checked).toLocaleString() : '—'}</TableCell>
                      <TableCell align="right">
                        <Tooltip title="Details"><IconButton size="small" onClick={() => navigate(`/domains/${d.id}`)}><VisibilityIcon fontSize="small" /></IconButton></Tooltip>
                        {can('domains:write') && <Tooltip title="Add subdomains"><IconButton size="small" onClick={() => setAddSubFor(d)}><AccountTreeIcon fontSize="small" /></IconButton></Tooltip>}
                        {can('monitoring:run') && <Tooltip title="Scan domain + subdomains"><span><IconButton size="small" disabled={busyId === d.id} onClick={() => scan(d)}><RefreshIcon fontSize="small" /></IconButton></span></Tooltip>}
                        {can('domains:write') && <Tooltip title="Edit"><IconButton size="small" onClick={() => openEdit(d)}><EditIcon fontSize="small" /></IconButton></Tooltip>}
                        {can('domains:delete') && <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => remove(d)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell colSpan={colSpan} sx={{ py: 0, borderBottom: isOpen ? undefined : 'none' }}>
                        <Collapse in={isOpen} timeout="auto" unmountOnExit>
                          <Box sx={{ m: 1, ml: 5 }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                              <Typography variant="subtitle2">
                                Subdomains {Array.isArray(rowSubs) ? <Chip size="small" label={rowSubs.length} sx={{ ml: 0.5 }} /> : null}
                              </Typography>
                              {can('domains:write') && <Button size="small" startIcon={<AddIcon />} onClick={() => setAddSubFor(d)}>Add subdomains</Button>}
                            </Stack>
                            {rowSubs === 'loading' || rowSubs === undefined ? <CircularProgress size={20} /> : rowSubs.length === 0 ? (
                              <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>No subdomains. Use "Add subdomains" to add one or more.</Typography>
                            ) : (
                              <Table size="small">
                                <TableHead><TableRow><TableCell>Subdomain</TableCell><TableCell>Status</TableCell><TableCell>Response</TableCell><TableCell>SSL expiry</TableCell><TableCell>Monitored</TableCell><TableCell align="right" /></TableRow></TableHead>
                                <TableBody>
                                  {rowSubs.map((s) => (
                                    <TableRow key={s.id} hover>
                                      <TableCell>↳ {s.name}</TableCell>
                                      <TableCell><StatusChip status={s.last_status} /></TableCell>
                                      <TableCell>{s.last_response_ms != null ? `${s.last_response_ms} ms` : '—'}</TableCell>
                                      <TableCell>{s.ssl_expiry ? new Date(s.ssl_expiry).toLocaleDateString() : '—'}</TableCell>
                                      <TableCell>{s.monitoring_enabled ? 'Yes' : 'No'}</TableCell>
                                      <TableCell align="right">
                                        {can('monitoring:run') && <Tooltip title="Scan subdomain"><span><IconButton size="small" disabled={subBusy === s.id} onClick={() => scanSub(s)}><RefreshIcon fontSize="small" /></IconButton></span></Tooltip>}
                                        {can('domains:delete') && <IconButton size="small" color="error" onClick={() => delSub(s)}><DeleteIcon fontSize="small" /></IconButton>}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            )}
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </Fragment>
                );
              })}
              {data?.items.length === 0 && <TableRow><TableCell colSpan={colSpan} align="center" sx={{ py: 4, color: 'text.secondary' }}>No domains yet. Add one to start monitoring.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Domain create/edit dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editing ? 'Edit domain' : 'Add domain'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField label="Domain name" value={form.domain_name} onChange={(e) => setForm({ ...form, domain_name: e.target.value })} placeholder="example.com" required fullWidth disabled={!!editing} />
            <TextField label="Host address / IP" value={form.host_address} onChange={(e) => setForm({ ...form, host_address: e.target.value })} fullWidth />
            <Stack direction="row" spacing={2}>
              <TextField label="Provider" value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })} fullWidth />
              <Autocomplete
                freeSolo
                fullWidth
                options={registrarNames}
                value={form.registrar}
                onInputChange={(_, v) => setForm({ ...form, registrar: v })}
                renderInput={(params) => (
                  <TextField {...params} label="Registrar" placeholder="Select from master or type to add"
                    helperText="Choose from the registrar master — new names are added to it" />
                )}
              />
            </Stack>
            <Stack direction="row" spacing={2}>
              <TextField label="Domain expiry" value={form.domain_expiry} onChange={(e) => setForm({ ...form, domain_expiry: e.target.value })} placeholder="2026-12-31" fullWidth />
              <TextField label="DKIM selectors" value={form.dkim_selectors} onChange={(e) => setForm({ ...form, dkim_selectors: e.target.value })} placeholder="default,google" fullWidth />
            </Stack>
            <TextField label="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} multiline rows={2} fullWidth />
            <FormControlLabel control={<Switch checked={form.monitoring_enabled} onChange={(e) => setForm({ ...form, monitoring_enabled: e.target.checked })} />} label="Monitoring enabled" />
            {!editing && (
              <>
                <Divider textAlign="left"><Typography variant="caption" color="text.secondary">Subdomains (optional)</Typography></Divider>
                <SubdomainRowsEditor rows={newSubRows} setRows={setNewSubRows} monitoring={newSubMonitoring} setMonitoring={setNewSubMonitoring} />
              </>
            )}
            {formError && <Alert severity="error">{formError}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={save}>{editing ? 'Save' : 'Create'}</Button>
        </DialogActions>
      </Dialog>

      {/* Bulk add subdomains */}
      {addSubFor && (
        <AddSubdomainsDialog
          open={!!addSubFor}
          domainId={addSubFor.id}
          domainName={addSubFor.domain_name}
          onClose={() => setAddSubFor(null)}
          onAdded={(_count, _skipped) => { const id = addSubFor.id; setExpanded((p) => new Set(p).add(id)); loadSubs(id); }}
        />
      )}
    </Box>
  );
}
