import { Button, FormControlLabel, IconButton, Stack, Switch, TextField } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

export interface SubRow { name: string; url: string }

export const emptyRow = (): SubRow => ({ name: '', url: '' });

/** Convert editor rows into API items, dropping blank rows. */
export function rowsToItems(rows: SubRow[], monitoring: boolean) {
  return rows
    .map((r) => ({ name: r.name.trim(), url: r.url.trim() || undefined, monitoring_enabled: monitoring }))
    .filter((r) => r.name);
}

export function SubdomainRowsEditor({
  rows, setRows, monitoring, setMonitoring,
}: {
  rows: SubRow[];
  setRows: (rows: SubRow[]) => void;
  monitoring: boolean;
  setMonitoring: (v: boolean) => void;
}) {
  const update = (i: number, patch: Partial<SubRow>) => setRows(rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const addRow = () => setRows([...rows, emptyRow()]);
  const removeRow = (i: number) => setRows(rows.length > 1 ? rows.filter((_, idx) => idx !== i) : [emptyRow()]);

  return (
    <Stack spacing={1.5}>
      {rows.map((r, i) => (
        <Stack direction="row" spacing={1} key={i} alignItems="center">
          <TextField label="Label" placeholder="www" value={r.name} onChange={(e) => update(i, { name: e.target.value })} size="small" sx={{ width: 150 }} />
          <TextField label="Explicit URL (optional)" placeholder="https://www.example.com" value={r.url} onChange={(e) => update(i, { url: e.target.value })} size="small" fullWidth />
          <IconButton size="small" onClick={() => removeRow(i)} disabled={rows.length === 1}><DeleteIcon fontSize="small" /></IconButton>
        </Stack>
      ))}
      <Button startIcon={<AddIcon />} onClick={addRow} size="small" sx={{ alignSelf: 'flex-start' }}>Add another subdomain</Button>
      <FormControlLabel control={<Switch checked={monitoring} onChange={(e) => setMonitoring(e.target.checked)} />} label="Monitoring enabled (applies to all)" />
    </Stack>
  );
}
