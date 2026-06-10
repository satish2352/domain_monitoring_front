import { Box, Card, Table, TableBody, TableCell, TableHead, TableRow, Typography, Alert, CircularProgress } from '@mui/material';
import { useFetch } from '../hooks/useFetch';

interface AuditRow {
  id: number; user_email: string | null; action: string; module: string; entity: string | null; ip: string | null; created_at: string;
}

export function Audit() {
  const { data, loading, error } = useFetch<{ items: AuditRow[] }>('/audit?limit=300');
  return (
    <Box>
      <Typography variant="h4" gutterBottom>Audit Log</Typography>
      {error && <Alert severity="error">{error}</Alert>}
      {loading ? <CircularProgress /> : (
        <Card>
          <Table size="small">
            <TableHead><TableRow><TableCell>Time</TableCell><TableCell>User</TableCell><TableCell>Action</TableCell><TableCell>Module</TableCell><TableCell>Entity</TableCell><TableCell>IP</TableCell></TableRow></TableHead>
            <TableBody>
              {data?.items.map((a) => (
                <TableRow key={a.id} hover>
                  <TableCell>{new Date(a.created_at).toLocaleString()}</TableCell>
                  <TableCell>{a.user_email || '—'}</TableCell>
                  <TableCell>{a.action}</TableCell>
                  <TableCell>{a.module}</TableCell>
                  <TableCell>{a.entity || '—'}</TableCell>
                  <TableCell>{a.ip || '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </Box>
  );
}
