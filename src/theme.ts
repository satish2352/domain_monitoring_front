import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#3b82f6' },
    success: { main: '#22c55e' },
    warning: { main: '#f59e0b' },
    error: { main: '#ef4444' },
    background: { default: '#0f172a', paper: '#1e293b' },
  },
  shape: { borderRadius: 10 },
  typography: { fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif' },
  components: {
    MuiCard: { styleOverrides: { root: { border: '1px solid #334155' } } },
    MuiButton: { defaultProps: { disableElevation: true } },
  },
});

export const statusColor: Record<string, 'success' | 'error' | 'warning' | 'default'> = {
  up: 'success',
  down: 'error',
  warn: 'warning',
  unknown: 'default',
};
