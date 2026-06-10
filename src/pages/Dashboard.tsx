import { Box, Card, CardContent, Grid, Typography, CircularProgress, Alert } from '@mui/material';
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from 'recharts';
import { useFetch } from '../hooks/useFetch';
import { chartColors } from '../theme';
import type { DashboardSummary } from '../api/types';

interface Trends {
  http: { day: string; up: number; down: number; warn: number; avg_ms: number | null }[];
  ssl: { day: string }[];
  alerts: { day: string; type: string; n: number }[];
}

function StatCard({ label, value, color }: { label: string; value: React.ReactNode; color?: string }) {
  return (
    <Card>
      <CardContent>
        <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</Typography>
        <Typography variant="h4" sx={{ mt: 1, color }}>{value}</Typography>
      </CardContent>
    </Card>
  );
}

export function Dashboard() {
  const { data: s, loading, error } = useFetch<DashboardSummary>('/dashboard/summary');
  const { data: trends } = useFetch<Trends>('/dashboard/trends?days=14');

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}><CircularProgress /></Box>;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!s) return null;

  const cards: { label: string; value: React.ReactNode; color?: string }[] = [
    { label: 'Domains', value: s.totals.domains },
    { label: 'Subdomains', value: s.totals.subdomains },
    { label: 'Monitored', value: s.totals.monitored },
    { label: 'Up', value: s.health.up, color: '#22c55e' },
    { label: 'Down', value: s.health.down, color: s.health.down ? '#ef4444' : undefined },
    { label: 'Warnings', value: s.health.warn, color: s.health.warn ? '#f59e0b' : undefined },
    { label: 'SSL expiring', value: s.sslExpiringSoon, color: s.sslExpiringSoon ? '#f59e0b' : undefined },
    { label: 'DNS issues', value: s.dnsIssues, color: s.dnsIssues ? '#ef4444' : undefined },
    { label: 'Open alerts', value: s.openAlerts, color: s.openAlerts ? '#ef4444' : undefined },
    { label: 'Avg response', value: s.avgResponseMs != null ? `${s.avgResponseMs} ms` : '—' },
    { label: 'Uptime 24h', value: s.uptimePct != null ? `${s.uptimePct}%` : '—', color: '#22c55e' },
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Dashboard</Typography>
      <Grid container spacing={2}>
        {cards.map((c) => (
          <Grid item xs={6} sm={4} md={3} lg={2} key={c.label}>
            <StatCard {...c} />
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2} sx={{ mt: 1 }}>
        <Grid item xs={12} md={6}>
          <Card><CardContent>
            <Typography variant="h6" gutterBottom>HTTP status trend (14d)</Typography>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={trends?.http ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                <XAxis dataKey="day" stroke={chartColors.axis} fontSize={11} />
                <YAxis stroke={chartColors.axis} fontSize={11} allowDecimals={false} />
                <Tooltip contentStyle={{ background: chartColors.tooltipBg, border: `1px solid ${chartColors.tooltipBorder}`, borderRadius: 8 }} />
                <Legend />
                <Bar dataKey="up" stackId="a" fill={chartColors.up} />
                <Bar dataKey="warn" stackId="a" fill={chartColors.warn} />
                <Bar dataKey="down" stackId="a" fill={chartColors.down} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent></Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card><CardContent>
            <Typography variant="h6" gutterBottom>Avg response time (14d)</Typography>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={trends?.http ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                <XAxis dataKey="day" stroke={chartColors.axis} fontSize={11} />
                <YAxis stroke={chartColors.axis} fontSize={11} />
                <Tooltip contentStyle={{ background: chartColors.tooltipBg, border: `1px solid ${chartColors.tooltipBorder}`, borderRadius: 8 }} />
                <Line type="monotone" dataKey="avg_ms" stroke={chartColors.primary} strokeWidth={2} dot={false} name="avg ms" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent></Card>
        </Grid>
      </Grid>
    </Box>
  );
}
