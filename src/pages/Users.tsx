import { useState } from 'react';
import {
  Box, Button, Card, Chip, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem,
  Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography, Alert, CircularProgress,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useFetch } from '../hooks/useFetch';
import { api, apiError } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import type { User } from '../api/types';

export function Users() {
  const { user, can } = useAuth();
  const { data, loading, error, reload } = useFetch<{ items: User[] }>('/users');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ email: '', name: '', role: 'viewer', password: '' });
  const [formError, setFormError] = useState<string | null>(null);

  const create = async () => {
    setFormError(null);
    try { await api.post('/users', form); setOpen(false); setForm({ email: '', name: '', role: 'viewer', password: '' }); reload(); }
    catch (err) { setFormError(apiError(err)); }
  };
  const toggle = async (u: User) => { await api.put(`/users/${u.id}/active`, { is_active: !u.is_active }); reload(); };
  const changeRole = async (u: User, role: string) => { await api.put(`/users/${u.id}/role`, { role }); reload(); };

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4">Users</Typography>
        {can('users:write') && <Button startIcon={<AddIcon />} variant="contained" onClick={() => setOpen(true)}>Add user</Button>}
      </Stack>
      {error && <Alert severity="error">{error}</Alert>}
      {loading ? <CircularProgress /> : (
        <Card>
          <Table size="small">
            <TableHead><TableRow><TableCell>Email</TableCell><TableCell>Name</TableCell><TableCell>Role</TableCell><TableCell>Status</TableCell><TableCell>Last login</TableCell><TableCell align="right" /></TableRow></TableHead>
            <TableBody>
              {data?.items.map((u) => (
                <TableRow key={u.id} hover>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>{u.name}</TableCell>
                  <TableCell>
                    {u.id === user?.id ? <Chip size="small" label={u.role} color="primary" /> : (
                      <TextField select size="small" value={u.role} onChange={(e) => changeRole(u, e.target.value)} variant="standard" sx={{ minWidth: 120 }}>
                        <MenuItem value="viewer">viewer</MenuItem>
                        <MenuItem value="admin">admin</MenuItem>
                        <MenuItem value="super_admin">super_admin</MenuItem>
                      </TextField>
                    )}
                  </TableCell>
                  <TableCell><Chip size="small" label={u.is_active ? 'active' : 'disabled'} color={u.is_active ? 'success' : 'error'} variant="outlined" /></TableCell>
                  <TableCell>{u.last_login_at ? new Date(u.last_login_at).toLocaleString() : '—'}</TableCell>
                  <TableCell align="right">{u.id !== user?.id && can('users:write') && <Button size="small" onClick={() => toggle(u)}>{u.is_active ? 'Disable' : 'Enable'}</Button>}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Add user</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required fullWidth />
            <TextField label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} fullWidth />
            <TextField select label="Role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} fullWidth>
              <MenuItem value="viewer">viewer</MenuItem>
              <MenuItem value="admin">admin</MenuItem>
              <MenuItem value="super_admin">super_admin</MenuItem>
            </TextField>
            <TextField label="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required fullWidth helperText="At least 8 characters" />
            {formError && <Alert severity="error">{formError}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions><Button onClick={() => setOpen(false)}>Cancel</Button><Button variant="contained" onClick={create}>Create</Button></DialogActions>
      </Dialog>
    </Box>
  );
}
