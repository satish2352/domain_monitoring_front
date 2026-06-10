import { useState } from 'react';
import {
  Box, Button, Card, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Stack,
  Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography, Alert, CircularProgress, Link,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useFetch } from '../hooks/useFetch';
import { api, apiError } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import type { Registrar } from '../api/types';

const blank = { name: '', website: '', notes: '' };

export function Registrars() {
  const { can } = useAuth();
  const { data, loading, error, reload } = useFetch<{ items: Registrar[] }>('/registrars');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Registrar | null>(null);
  const [form, setForm] = useState(blank);
  const [formError, setFormError] = useState<string | null>(null);
  const canWrite = can('registrars:write');

  const openCreate = () => { setEditing(null); setForm(blank); setFormError(null); setOpen(true); };
  const openEdit = (r: Registrar) => { setEditing(r); setForm({ name: r.name, website: r.website ?? '', notes: r.notes ?? '' }); setFormError(null); setOpen(true); };

  const save = async () => {
    setFormError(null);
    try {
      if (editing) await api.put(`/registrars/${editing.id}`, form);
      else await api.post('/registrars', form);
      setOpen(false); reload();
    } catch (err) { setFormError(apiError(err)); }
  };
  const remove = async (r: Registrar) => {
    if (!confirm(`Delete registrar "${r.name}"?`)) return;
    try { await api.delete(`/registrars/${r.id}`); reload(); }
    catch (err) { alert(apiError(err)); }
  };

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
        <Typography variant="h4">Registrars</Typography>
        {canWrite && <Button startIcon={<AddIcon />} variant="contained" onClick={openCreate}>Add registrar</Button>}
      </Stack>
      <Typography variant="body2" color="text.secondary" mb={2}>
        Master list of domain registrars. These options populate the Registrar dropdown when adding or editing a domain.
      </Typography>

      {error && <Alert severity="error">{error}</Alert>}
      {loading ? <CircularProgress /> : (
        <Card>
          <Table size="small">
            <TableHead><TableRow><TableCell>Name</TableCell><TableCell>Website</TableCell><TableCell>Notes</TableCell><TableCell align="right" /></TableRow></TableHead>
            <TableBody>
              {data?.items.map((r) => (
                <TableRow key={r.id} hover>
                  <TableCell><b>{r.name}</b></TableCell>
                  <TableCell>{r.website ? <Link href={r.website} target="_blank" rel="noreferrer">{r.website}</Link> : '—'}</TableCell>
                  <TableCell>{r.notes || '—'}</TableCell>
                  <TableCell align="right">
                    {canWrite && <IconButton size="small" onClick={() => openEdit(r)}><EditIcon fontSize="small" /></IconButton>}
                    {canWrite && <IconButton size="small" color="error" onClick={() => remove(r)}><DeleteIcon fontSize="small" /></IconButton>}
                  </TableCell>
                </TableRow>
              ))}
              {data?.items.length === 0 && <TableRow><TableCell colSpan={4} align="center" sx={{ py: 4, color: 'text.secondary' }}>No registrars yet.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </Card>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>{editing ? 'Edit registrar' : 'Add registrar'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required fullWidth />
            <TextField label="Website" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="https://…" fullWidth />
            <TextField label="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} multiline rows={2} fullWidth />
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
