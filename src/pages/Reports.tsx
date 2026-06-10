import { useState } from 'react';
import {
  Box, Button, Card, CardContent, MenuItem, Stack, TextField, Typography, Table, TableBody,
  TableCell, TableHead, TableRow, Alert, CircularProgress, Grid,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import { api, apiError, tokenStore } from '../api/client';
import { useFetch } from '../hooks/useFetch';

type Period = 'daily' | 'weekly' | 'monthly';

interface ReportData {
  summary: { domains: number; subdomains: number; up: number; down: number; warn: number; openAlerts: number; avgResponseMs: number | null; uptimePct: number | null };
  rows: { target: string; type: string; status: string; uptimePct: number | null; avgResponseMs: number | null; downtimeEvents: number; sslDays: number | null; domainExpiryDays: number | null }[];
}

export function Reports() {
  const [period, setPeriod] = useState<Period>('daily');
  const { data, loading, error } = useFetch<ReportData>(`/reports?period=${period}`, [period]);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const download = async (format: 'csv' | 'excel' | 'pdf') => {
    setDownloadError(null);
    try {
      const res = await api.get(`/reports/download?period=${period}&format=${format}`, {
        responseType: 'blob',
        headers: { Authorization: `Bearer ${tokenStore.access}` },
      });
      const url = URL.createObjectURL(res.data as Blob);
      const a = document.createElement('a');
      const ext = format === 'excel' ? 'xlsx' : format;
      a.href = url;
      a.download = `report-${period}.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setDownloadError(apiError(err));
    }
  };

  const s = data?.summary;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Reports</Typography>
      <Stack direction="row" spacing={2} alignItems="center" mb={2}>
        <TextField select label="Period" value={period} onChange={(e) => setPeriod(e.target.value as Period)} size="small" sx={{ width: 160 }}>
          <MenuItem value="daily">Daily (24h)</MenuItem>
          <MenuItem value="weekly">Weekly (7d)</MenuItem>
          <MenuItem value="monthly">Monthly (30d)</MenuItem>
        </TextField>
        <Button startIcon={<DownloadIcon />} variant="outlined" onClick={() => download('csv')}>CSV</Button>
        <Button startIcon={<DownloadIcon />} variant="outlined" onClick={() => download('excel')}>Excel</Button>
        <Button startIcon={<DownloadIcon />} variant="outlined" onClick={() => download('pdf')}>PDF</Button>
      </Stack>
      {downloadError && <Alert severity="error" sx={{ mb: 2 }}>{downloadError}</Alert>}
      {error && <Alert severity="error">{error}</Alert>}

      {s && (
        <Grid container spacing={2} mb={2}>
          {[
            ['Domains', s.domains], ['Subdomains', s.subdomains], ['Up', s.up], ['Down', s.down],
            ['Warnings', s.warn], ['Open alerts', s.openAlerts],
            ['Avg response', s.avgResponseMs != null ? `${s.avgResponseMs} ms` : '—'],
            ['Uptime', s.uptimePct != null ? `${s.uptimePct}%` : '—'],
          ].map(([label, val]) => (
            <Grid item xs={6} sm={3} key={String(label)}>
              <Card><CardContent>
                <Typography variant="caption" color="text.secondary">{label}</Typography>
                <Typography variant="h5">{val}</Typography>
              </CardContent></Card>
            </Grid>
          ))}
        </Grid>
      )}

      {loading ? <CircularProgress /> : (
        <Card>
          <Table size="small">
            <TableHead><TableRow><TableCell>Target</TableCell><TableCell>Type</TableCell><TableCell>Status</TableCell><TableCell>Uptime %</TableCell><TableCell>Avg ms</TableCell><TableCell>Downtime events</TableCell><TableCell>SSL days</TableCell><TableCell>Domain expiry days</TableCell></TableRow></TableHead>
            <TableBody>
              {data?.rows.map((r, i) => (
                <TableRow key={i} hover>
                  <TableCell>{r.target}</TableCell><TableCell>{r.type}</TableCell><TableCell>{r.status}</TableCell>
                  <TableCell>{r.uptimePct ?? '—'}</TableCell><TableCell>{r.avgResponseMs ?? '—'}</TableCell>
                  <TableCell>{r.downtimeEvents}</TableCell><TableCell>{r.sslDays ?? '—'}</TableCell><TableCell>{r.domainExpiryDays ?? '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </Box>
  );
}
