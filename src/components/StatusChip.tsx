import Chip from '@mui/material/Chip';
import { statusColor } from '../theme';

export function StatusChip({ status }: { status: string }) {
  return <Chip size="small" label={status} color={statusColor[status] ?? 'default'} variant="outlined" />;
}

const SEV: Record<string, 'info' | 'warning' | 'error'> = { info: 'info', warning: 'warning', critical: 'error' };

export function SeverityChip({ severity }: { severity: string }) {
  return <Chip size="small" label={severity} color={SEV[severity] ?? 'default'} />;
}
