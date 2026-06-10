import { useEffect, useState } from 'react';
import {
  Box, Button, Card, CardContent, FormControlLabel, Grid, MenuItem, Stack, Switch,
  TextField, Typography, Alert, CircularProgress,
} from '@mui/material';
import { api, apiError } from '../api/client';

interface SettingsResponse {
  'alert.to': string; 'alert.from': string;
  'smtp.host': string; 'smtp.port': string; 'smtp.secure': string; 'smtp.user': string; 'smtp.pass': string;
  emailEnabled: boolean;
  scheduler: { interval: string; summary_cron: string; enabled: boolean; last_run_at: string | null };
  intervalPresets: string[];
}

export function Settings() {
  const [data, setData] = useState<SettingsResponse | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [sched, setSched] = useState({ interval: '15m', summary_cron: '0 8 * * *', enabled: true });
  const [msg, setMsg] = useState<{ sev: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get<SettingsResponse>('/settings');
      setData(res.data);
      setForm({
        'alert.to': res.data['alert.to'], 'alert.from': res.data['alert.from'],
        'smtp.host': res.data['smtp.host'], 'smtp.port': res.data['smtp.port'],
        'smtp.secure': res.data['smtp.secure'], 'smtp.user': res.data['smtp.user'], 'smtp.pass': res.data['smtp.pass'],
      });
      setSched({ interval: res.data.scheduler.interval, summary_cron: res.data.scheduler.summary_cron, enabled: res.data.scheduler.enabled });
    } catch (err) {
      setMsg({ sev: 'error', text: apiError(err) });
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const saveSettings = async () => {
    try { await api.put('/settings', form); setMsg({ sev: 'success', text: 'Settings saved' }); load(); }
    catch (err) { setMsg({ sev: 'error', text: apiError(err) }); }
  };
  const saveScheduler = async () => {
    try { await api.put('/settings/scheduler', sched); setMsg({ sev: 'success', text: 'Scheduler updated' }); load(); }
    catch (err) { setMsg({ sev: 'error', text: apiError(err) }); }
  };
  const testEmail = async () => {
    try { const r = await api.post('/settings/test-email'); setMsg({ sev: r.data.sent ? 'success' : 'error', text: r.data.sent ? 'Test email sent' : 'Email disabled — logged to console' }); }
    catch (err) { setMsg({ sev: 'error', text: apiError(err) }); }
  };

  if (loading || !data) return <CircularProgress />;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Settings</Typography>
      {msg && <Alert severity={msg.sev} sx={{ mb: 2 }} onClose={() => setMsg(null)}>{msg.text}</Alert>}
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Card><CardContent>
            <Typography variant="h6" gutterBottom>Scheduler</Typography>
            <Stack spacing={2}>
              <TextField select label="Monitoring interval" value={sched.interval} onChange={(e) => setSched({ ...sched, interval: e.target.value })}>
                {data.intervalPresets.map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                {!data.intervalPresets.includes(sched.interval) && <MenuItem value={sched.interval}>{sched.interval} (custom)</MenuItem>}
              </TextField>
              <TextField label="Daily summary cron" value={sched.summary_cron} onChange={(e) => setSched({ ...sched, summary_cron: e.target.value })} />
              <FormControlLabel control={<Switch checked={sched.enabled} onChange={(e) => setSched({ ...sched, enabled: e.target.checked })} />} label="Scheduler enabled" />
              <Typography variant="caption" color="text.secondary">Last run: {data.scheduler.last_run_at ? new Date(data.scheduler.last_run_at).toLocaleString() : 'never'}</Typography>
              <Button variant="contained" onClick={saveScheduler}>Save scheduler</Button>
            </Stack>
          </CardContent></Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card><CardContent>
            <Typography variant="h6" gutterBottom>Email & Alerts {data.emailEnabled ? '(enabled)' : '(disabled — logs to console)'}</Typography>
            <Stack spacing={2}>
              <TextField label="Alert recipient (To)" value={form['alert.to']} onChange={(e) => setForm({ ...form, 'alert.to': e.target.value })} />
              <TextField label="Alert sender (From)" value={form['alert.from']} onChange={(e) => setForm({ ...form, 'alert.from': e.target.value })} />
              <Stack direction="row" spacing={2}>
                <TextField label="SMTP host" value={form['smtp.host']} onChange={(e) => setForm({ ...form, 'smtp.host': e.target.value })} fullWidth />
                <TextField label="Port" value={form['smtp.port']} onChange={(e) => setForm({ ...form, 'smtp.port': e.target.value })} sx={{ width: 110 }} />
              </Stack>
              <FormControlLabel control={<Switch checked={form['smtp.secure'] === 'true'} onChange={(e) => setForm({ ...form, 'smtp.secure': e.target.checked ? 'true' : 'false' })} />} label="Use TLS (secure)" />
              <TextField label="SMTP user" value={form['smtp.user']} onChange={(e) => setForm({ ...form, 'smtp.user': e.target.value })} />
              <TextField label="SMTP password" type="password" value={form['smtp.pass']} onChange={(e) => setForm({ ...form, 'smtp.pass': e.target.value })} placeholder="(unchanged)" />
              <Stack direction="row" spacing={2}>
                <Button variant="contained" onClick={saveSettings}>Save</Button>
                <Button variant="outlined" onClick={testEmail}>Send test email</Button>
              </Stack>
            </Stack>
          </CardContent></Card>
        </Grid>
      </Grid>
    </Box>
  );
}
