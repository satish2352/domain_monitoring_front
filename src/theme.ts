import { createTheme } from '@mui/material/styles';

// Light, professional palette — cool slate neutrals with an indigo accent.
export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#4f46e5', light: '#6366f1', dark: '#4338ca' },
    secondary: { main: '#0ea5e9' },
    success: { main: '#16a34a' },
    warning: { main: '#d97706' },
    error: { main: '#dc2626' },
    info: { main: '#2563eb' },
    background: { default: '#f4f6fb', paper: '#ffffff' },
    text: { primary: '#1e293b', secondary: '#64748b' },
    divider: '#e2e8f0',
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: 'Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif',
    h4: { fontWeight: 700, letterSpacing: '-0.02em' },
    h5: { fontWeight: 700, letterSpacing: '-0.01em' },
    h6: { fontWeight: 600 },
    subtitle1: { fontWeight: 600 },
    button: { fontWeight: 600 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { backgroundColor: '#f4f6fb' },
        // Slimmer, softer scrollbars to match the lighter look.
        '*::-webkit-scrollbar': { width: 10, height: 10 },
        '*::-webkit-scrollbar-thumb': { backgroundColor: '#cbd5e1', borderRadius: 8 },
        '*::-webkit-scrollbar-thumb:hover': { backgroundColor: '#94a3b8' },
      },
    },
    MuiAppBar: {
      defaultProps: { elevation: 0, color: 'inherit' },
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',
          color: '#1e293b',
          borderBottom: '1px solid #e2e8f0',
          backdropFilter: 'saturate(180%) blur(6px)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: { backgroundColor: '#ffffff', borderRight: '1px solid #e2e8f0' },
      },
    },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          border: '1px solid #e8edf3',
          borderRadius: 14,
          boxShadow: '0 1px 2px rgba(15,23,42,0.04), 0 1px 3px rgba(15,23,42,0.06)',
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: { root: { borderRadius: 10, textTransform: 'none' } },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          marginInline: 8,
          '&.Mui-selected': {
            backgroundColor: 'rgba(79,70,229,0.10)',
            '&:hover': { backgroundColor: 'rgba(79,70,229,0.16)' },
          },
        },
      },
    },
    MuiChip: { styleOverrides: { root: { fontWeight: 500 } } },
    MuiTooltip: {
      styleOverrides: {
        tooltip: { backgroundColor: '#1e293b', fontSize: 12 },
        arrow: { color: '#1e293b' },
      },
    },
  },
});

// Chart palette — readable on the light background.
export const chartColors = {
  grid: '#e2e8f0',
  axis: '#64748b',
  tooltipBg: '#ffffff',
  tooltipBorder: '#e2e8f0',
  primary: '#4f46e5',
  up: '#16a34a',
  warn: '#d97706',
  down: '#dc2626',
};

export const statusColor: Record<string, 'success' | 'error' | 'warning' | 'default'> = {
  up: 'success',
  down: 'error',
  warn: 'warning',
  unknown: 'default',
};
