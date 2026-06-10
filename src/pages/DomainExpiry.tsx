import { useMemo, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box, Card, Chip, Link, Table, TableBody, TableCell, TableHead, TableRow,
  ToggleButton, ToggleButtonGroup, Typography, Alert, CircularProgress,
} from '@mui/material';
import { useFetch } from '../hooks/useFetch';

interface ExpiryRow {
  id: number;
  domain_name: string;
  registrar: string | null;
  provider: string | null;
  host_address: string | null;
  domain_expiry: string | null;
  monitoring_enabled: boolean;
  days_remaining: number;
}

type Filter = '8' | '15' | '30' | 'expired' | 'all';

function daysChip(d: number) {
  const color: 'error' | 'warning' | 'info' | 'success' =
    d < 0 ? 'error' : d <= 8 ? 'error' : d <= 15 ? 'warning' : d <= 30 ? 'info' : 'success';
  const label = d < 0 ? `expired ${-d}d ago` : `${d} days`;
  return <Chip size="small" color={color} label={label} />;
}

export function DomainExpiry() {
  const [filter, setFilter] = useState<Filter>('30');

  // Build query: day-window filters pass withinDays; "expired" passes withinDays=0; "all" none.
  const query = useMemo(() => {
    if (filter === 'all') return '/domains/expiry';
    if (filter === 'expired') return '/domains/expiry?withinDays=0';
    return `/domains/expiry?withinDays=${filter}`;
  }, [filter]);

  const { data, loading, error } = useFetch<{ items: ExpiryRow[]; total: number }>(query, [query]);

  // "Expired" filter: only already-expired domains.
  const rows = useMemo(() => {
    const items = data?.items ?? [];
    return filter === 'expired' ? items.filter((d) => d.days_remaining < 0) : items;
  }, [data, filter]);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Domain Expiry</Typography>
      <Typography variant="body2" color="text.secondary" mb={2}>
        Domains by registration-expiry window. Email alerts are sent automatically as a domain
        approaches expiry (default 30/15/8/7 days) — set each domain's expiry date on the Domains page.
      </Typography>

      <ToggleButtonGroup
        exclusive value={filter} size="small" sx={{ mb: 2 }}
        onChange={(_, v) => v && setFilter(v)}
      >
        <ToggleButton value="8">Next 8 days</ToggleButton>
        <ToggleButton value="15">Next 15 days</ToggleButton>
        <ToggleButton value="30">Next 30 days</ToggleButton>
        <ToggleButton value="expired">Expired</ToggleButton>
        <ToggleButton value="all">All</ToggleButton>
      </ToggleButtonGroup>

      {error && <Alert severity="error">{error}</Alert>}
      {loading ? <CircularProgress /> : (
        <Card>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Domain</TableCell><TableCell>Days remaining</TableCell><TableCell>Expiry date</TableCell>
                <TableCell>Registrar</TableCell><TableCell>Provider</TableCell><TableCell>Host</TableCell><TableCell>Monitored</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((d) => (
                <TableRow key={d.id} hover>
                  <TableCell><Link component={RouterLink} to={`/domains/${d.id}`}>{d.domain_name}</Link></TableCell>
                  <TableCell>{daysChip(d.days_remaining)}</TableCell>
                  <TableCell>{d.domain_expiry ? new Date(d.domain_expiry).toLocaleDateString() : '—'}</TableCell>
                  <TableCell>{d.registrar || '—'}</TableCell>
                  <TableCell>{d.provider || '—'}</TableCell>
                  <TableCell>{d.host_address || '—'}</TableCell>
                  <TableCell>{d.monitoring_enabled ? 'Yes' : 'No'}</TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && (
                <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                  No domains match this window. Add expiry dates on the Domains page.
                </TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      )}
    </Box>
  );
}
