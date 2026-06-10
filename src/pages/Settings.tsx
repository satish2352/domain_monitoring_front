import { useEffect, useState } from 'react';
import {
  Autocomplete, Avatar, Box, Button, Card, CardContent, CardHeader, Chip, Divider,
  FormControlLabel, Grid, MenuItem, Stack, Switch, TextField, Typography, Alert, CircularProgress,
} from '@mui/material';
import ScheduleIcon from '@mui/icons-material/Schedule';
import LanguageIcon from '@mui/icons-material/Language';
import ApiIcon from '@mui/icons-material/Api';
import SendIcon from '@mui/icons-material/Send';
import SaveIcon from '@mui/icons-material/Save';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloudOffIcon from '@mui/icons-material/CloudOff';
import type { ReactNode } from 'react';
import { api, apiError } from '../api/client';

interface SettingsResponse {
  'alert.to': string; 'alert.from': string;
  'smtp.host': string; 'smtp.port': string; 'smtp.secure': string; 'smtp.user': string; 'smtp.pass': string;
  'api.alert.to': string; 'api.alert.from': string;
  'api.smtp.host': string; 'api.smtp.port': string; 'api.smtp.secure': string; 'api.smtp.user': string; 'api.smtp.pass': string;
  emailEnabled: boolean;
  apiEmailEnabled: boolean;
  scheduler: { interval: string; summary_cron: string; api_report_cron: string; enabled: boolean; last_run_at: string | null };
  intervalPresets: string[];
}

const EMAIL_KEYS = ['alert.to', 'alert.from', 'smtp.host', 'smtp.port', 'smtp.secure', 'smtp.user', 'smtp.pass'] as const;

const API_REPORT_PRESETS = [
  { value: '*/15 * * * *', label: 'Every 15 minutes' },
  { value: '*/30 * * * *', label: 'Every 30 minutes' },
  { value: '0 * * * *', label: 'Every hour' },
  { value: '0 */6 * * *', label: 'Every 6 hours' },
];

function ChannelStatus({ enabled }: { enabled: boolean }) {
  return enabled
    ? <Chip size="small" color="success" variant="outlined" icon={<CheckCircleIcon />} label="Active" />
    : <Chip size="small" color="default" variant="outlined" icon={<CloudOffIcon />} label="Logs to console" />;
}

/** Left-aligned caption divider used to group fields inside a card. */
function GroupLabel({ children }: { children: ReactNode }) {
  return (
    <Divider textAlign="left" sx={{ '&::before': { width: 0 } }}>
      <Typography variant="overline" color="text.secondary">{children}</Typography>
    </Divider>
  );
}

/** Chip-based multi-recipient field backed by a comma-separated string. */
function RecipientsField({ value, onChange, label, helper, placeholder }: {
  value: string; onChange: (v: string) => void; label: string; helper?: string; placeholder?: string;
}) {
  const [input, setInput] = useState('');
  const recipients = value.split(',').map((s) => s.trim()).filter(Boolean);
  const commit = (vals: string[]) => onChange([...new Set(vals.map((s) => s.trim()).filter(Boolean))].join(', '));
  return (
    <Autocomplete
      multiple
      freeSolo
      size="small"
      options={[]}
      value={recipients}
      inputValue={input}
      onChange={(_, vals) => { commit(vals as string[]); setInput(''); }}
      onInputChange={(_, v, reason) => {
        if (reason === 'reset') return; // value committed via onChange
        if (v.includes(',')) {
          const parts = v.split(',');
          const tail = parts.pop() ?? '';
          commit([...recipients, ...parts]);
          setInput(tail);
        } else {
          setInput(v);
        }
      }}
      renderTags={(vals, getTagProps) =>
        vals.map((option, index) => <Chip size="small" color="primary" variant="outlined" label={option} {...getTagProps({ index })} key={option} />)
      }
      renderInput={(params) => <TextField {...params} label={label} placeholder={placeholder} helperText={helper} />}
    />
  );
}

/** Email + SMTP settings for one alert channel. `prefix` namespaces the form keys ('' or 'api.'). */
function EmailChannelCard({ title, subtitle, icon, color, enabled, prefix, inherit, form, setForm, onSave, onTest }: {
  title: string; subtitle: string; icon: ReactNode; color: string; enabled: boolean; prefix: string; inherit?: boolean;
  form: Record<string, string>; setForm: (f: Record<string, string>) => void;
  onSave: () => void; onTest: () => void;
}) {
  const k = (key: string) => `${prefix}${key}`;
  const set = (key: string, v: string) => setForm({ ...form, [k(key)]: v });
  const ph = inherit ? '(inherit domain)' : undefined;
  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardHeader
        avatar={<Avatar sx={{ bgcolor: color }}>{icon}</Avatar>}
        title={<Typography variant="subtitle1" fontWeight={600}>{title}</Typography>}
        subheader={subtitle}
        action={<Box sx={{ pt: 1, pr: 1 }}><ChannelStatus enabled={enabled} /></Box>}
      />
      <Divider />
      <CardContent sx={{ flexGrow: 1 }}>
        <Stack spacing={2.5}>
          <Stack spacing={2}>
            <GroupLabel>Recipients</GroupLabel>
            <RecipientsField
              label="Alert recipients (To)"
              value={form[k('alert.to')] || ''}
              onChange={(v) => set('alert.to', v)}
              placeholder="Add an email and press Enter"
              helper={inherit
                ? 'Blank = inherit domain recipients. Press Enter or comma to add.'
                : 'Type an email and press Enter or comma to add'}
            />
            <TextField size="small" label="Alert sender (From)" value={form[k('alert.from')] || ''} onChange={(e) => set('alert.from', e.target.value)} placeholder={ph} fullWidth />
          </Stack>

          <Stack spacing={2}>
            <GroupLabel>SMTP server</GroupLabel>
            <Stack direction="row" spacing={2}>
              <TextField size="small" label="Host" value={form[k('smtp.host')] || ''} onChange={(e) => set('smtp.host', e.target.value)} fullWidth placeholder={ph} />
              <TextField size="small" label="Port" value={form[k('smtp.port')] || ''} onChange={(e) => set('smtp.port', e.target.value)} sx={{ width: 100 }} placeholder={ph} />
            </Stack>
            <Stack direction="row" spacing={2}>
              <TextField size="small" label="Username" value={form[k('smtp.user')] || ''} onChange={(e) => set('smtp.user', e.target.value)} fullWidth placeholder={ph} />
              <TextField size="small" label="Password" type="password" value={form[k('smtp.pass')] || ''} onChange={(e) => set('smtp.pass', e.target.value)} fullWidth placeholder={inherit ? '(inherit / unchanged)' : '(unchanged)'} />
            </Stack>
            <FormControlLabel control={<Switch checked={form[k('smtp.secure')] === 'true'} onChange={(e) => set('smtp.secure', e.target.checked ? 'true' : 'false')} />} label="Use TLS / SSL (secure)" />
            {inherit && <Typography variant="caption" color="text.secondary">Any field left blank inherits the Domain channel settings.</Typography>}
          </Stack>
        </Stack>
      </CardContent>
      <Divider />
      <Box sx={{ p: 2, display: 'flex', gap: 1.5 }}>
        <Button variant="contained" startIcon={<SaveIcon />} onClick={onSave}>Save</Button>
        <Button variant="outlined" startIcon={<SendIcon />} onClick={onTest}>Send test email</Button>
      </Box>
    </Card>
  );
}

export function Settings() {
  const [data, setData] = useState<SettingsResponse | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [sched, setSched] = useState({ interval: '15m', summary_cron: '0 8 * * *', api_report_cron: '*/30 * * * *', enabled: true });
  const [msg, setMsg] = useState<{ sev: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get<SettingsResponse>('/settings');
      setData(res.data);
      const next: Record<string, string> = {};
      for (const key of EMAIL_KEYS) {
        next[key] = res.data[key];
        next[`api.${key}`] = res.data[`api.${key}` as keyof SettingsResponse] as string;
      }
      setForm(next);
      setSched({ interval: res.data.scheduler.interval, summary_cron: res.data.scheduler.summary_cron, api_report_cron: res.data.scheduler.api_report_cron, enabled: res.data.scheduler.enabled });
    } catch (err) {
      setMsg({ sev: 'error', text: apiError(err) });
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const saveSettings = async () => {
    try { await api.put('/settings', form); setMsg({ sev: 'success', text: 'Email settings saved' }); load(); }
    catch (err) { setMsg({ sev: 'error', text: apiError(err) }); }
  };
  const saveScheduler = async () => {
    try { await api.put('/settings/scheduler', sched); setMsg({ sev: 'success', text: 'Schedule updated' }); load(); }
    catch (err) { setMsg({ sev: 'error', text: apiError(err) }); }
  };
  const testEmail = async (channel: 'domain' | 'api') => {
    try {
      const r = await api.post('/settings/test-email', { channel });
      setMsg({ sev: r.data.sent ? 'success' : 'error', text: r.data.sent ? `Test email sent (${channel})` : `Email disabled for ${channel} — logged to console` });
    } catch (err) { setMsg({ sev: 'error', text: apiError(err) }); }
  };

  if (loading || !data) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}><CircularProgress /></Box>;

  const lastRun = data.scheduler.last_run_at ? new Date(data.scheduler.last_run_at).toLocaleString() : 'never';

  return (
    <Box sx={{ maxWidth: 1100 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4">Settings</Typography>
        <Typography variant="body2" color="text.secondary">Configure monitoring cadence and how alerts are delivered.</Typography>
      </Box>

      {msg && <Alert severity={msg.sev} sx={{ mb: 3 }} onClose={() => setMsg(null)}>{msg.text}</Alert>}

      {/* Monitoring schedule — full width */}
      <Card sx={{ mb: 3 }}>
        <CardHeader
          avatar={<Avatar sx={{ bgcolor: '#0ea5e9' }}><ScheduleIcon /></Avatar>}
          title={<Typography variant="subtitle1" fontWeight={600}>Monitoring Schedule</Typography>}
          subheader="How often targets are scanned and reports are sent"
        />
        <Divider />
        <CardContent>
          <Grid container spacing={2} alignItems="flex-start">
            <Grid item xs={12} sm={6} md={3}>
              <TextField select size="small" fullWidth label="Monitoring interval" value={sched.interval} onChange={(e) => setSched({ ...sched, interval: e.target.value })}>
                {data.intervalPresets.map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                {!data.intervalPresets.includes(sched.interval) && <MenuItem value={sched.interval}>{sched.interval} (custom)</MenuItem>}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField size="small" fullWidth label="Daily summary cron" value={sched.summary_cron} onChange={(e) => setSched({ ...sched, summary_cron: e.target.value })} helperText="When the daily summary is emailed" />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField select size="small" fullWidth label="API failure report" value={sched.api_report_cron} onChange={(e) => setSched({ ...sched, api_report_cron: e.target.value })} helperText="Repeats while an API is failing">
                {API_REPORT_PRESETS.map((p) => <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>)}
                {!API_REPORT_PRESETS.some((p) => p.value === sched.api_report_cron) && <MenuItem value={sched.api_report_cron}>{sched.api_report_cron} (custom)</MenuItem>}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControlLabel sx={{ mt: 0.5 }} control={<Switch checked={sched.enabled} onChange={(e) => setSched({ ...sched, enabled: e.target.checked })} />} label="Scheduler enabled" />
              <Typography variant="caption" color="text.secondary" display="block">Last run: {lastRun}</Typography>
            </Grid>
          </Grid>
        </CardContent>
        <Divider />
        <Box sx={{ p: 2 }}>
          <Button variant="contained" startIcon={<SaveIcon />} onClick={saveScheduler}>Save schedule</Button>
        </Box>
      </Card>

      {/* Alert delivery — two channels side by side */}
      <Typography variant="overline" color="text.secondary">Alert delivery</Typography>
      <Grid container spacing={3} sx={{ mt: 0 }}>
        <Grid item xs={12} md={6}>
          <EmailChannelCard
            title="Domain Alerts"
            subtitle="Domains, subdomains, SSL, DNS, expiry & daily summary"
            icon={<LanguageIcon />}
            color="#3b82f6"
            enabled={data.emailEnabled}
            prefix=""
            form={form}
            setForm={setForm}
            onSave={saveSettings}
            onTest={() => testEmail('domain')}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <EmailChannelCard
            title="API Endpoint Alerts"
            subtitle="API checks & the recurring API failure report"
            icon={<ApiIcon />}
            color="#8b5cf6"
            enabled={data.apiEmailEnabled}
            prefix="api."
            inherit
            form={form}
            setForm={setForm}
            onSave={saveSettings}
            onTest={() => testEmail('api')}
          />
        </Grid>
      </Grid>
    </Box>
  );
}
