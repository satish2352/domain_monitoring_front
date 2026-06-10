import { useState } from 'react';
import {
  Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Typography,
} from '@mui/material';
import { api, apiError } from '../api/client';
import { SubdomainRowsEditor, emptyRow, rowsToItems, type SubRow } from './SubdomainRowsEditor';

export function AddSubdomainsDialog({
  open, domainId, domainName, onClose, onAdded,
}: {
  open: boolean;
  domainId: number;
  domainName?: string;
  onClose: () => void;
  onAdded: (count: number, skipped: string[]) => void;
}) {
  const [rows, setRows] = useState<SubRow[]>([emptyRow()]);
  const [monitoring, setMonitoring] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const reset = () => { setRows([emptyRow()]); setMonitoring(true); setError(null); };

  const save = async () => {
    setError(null);
    const items = rowsToItems(rows, monitoring);
    if (items.length === 0) { setError('Enter at least one subdomain name'); return; }
    setBusy(true);
    try {
      const res = await api.post(`/domains/${domainId}/subdomains/bulk`, { items });
      onAdded(res.data.count, res.data.skipped ?? []);
      reset();
      onClose();
    } catch (err) {
      setError(apiError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Add subdomains{domainName ? ` to ${domainName}` : ''}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" mb={1}>
          Add one or more subdomains. Each is monitored with the same HTTP / DNS / SSL checks as the main domain.
        </Typography>
        <Stack spacing={1.5} mt={1}>
          <SubdomainRowsEditor rows={rows} setRows={setRows} monitoring={monitoring} setMonitoring={setMonitoring} />
          {error && <Alert severity="error">{error}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={save} disabled={busy}>{busy ? 'Adding…' : 'Add subdomains'}</Button>
      </DialogActions>
    </Dialog>
  );
}
