import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  AppBar, Box, Button, CssBaseline, Divider, Drawer, List, ListItemButton, ListItemIcon,
  ListItemText, Stack, Toolbar, Typography, Snackbar, Alert as MuiAlert, Menu, MenuItem,
} from '@mui/material';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import DashboardIcon from '@mui/icons-material/Dashboard';
import LanguageIcon from '@mui/icons-material/Language';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import ApiIcon from '@mui/icons-material/Api';
import BusinessIcon from '@mui/icons-material/Business';
import NotificationsIcon from '@mui/icons-material/Notifications';
import ListAltIcon from '@mui/icons-material/ListAlt';
import LockIcon from '@mui/icons-material/Lock';
import RouterIcon from '@mui/icons-material/Router';
import AssessmentIcon from '@mui/icons-material/Assessment';
import SettingsIcon from '@mui/icons-material/Settings';
import PeopleIcon from '@mui/icons-material/People';
import HistoryIcon from '@mui/icons-material/History';
import { useAuth } from '../auth/AuthContext';
import { api, apiError } from '../api/client';
import type { ReactNode } from 'react';

const drawerWidth = 230;

interface NavItem { to: string; label: string; icon: ReactNode; perm?: string }
const NAV: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: <DashboardIcon /> },
  { to: '/domains', label: 'Domains', icon: <LanguageIcon /> },
  { to: '/domain-expiry', label: 'Domain Expiry', icon: <EventBusyIcon /> },
  { to: '/apis', label: 'API Endpoints', icon: <ApiIcon />, perm: 'apis:read' },
  { to: '/registrars', label: 'Registrars', icon: <BusinessIcon />, perm: 'registrars:read' },
  { to: '/alerts', label: 'Alerts', icon: <NotificationsIcon /> },
  { to: '/logs', label: 'Monitoring Logs', icon: <ListAltIcon /> },
  { to: '/ssl', label: 'SSL', icon: <LockIcon /> },
  { to: '/network', label: 'Network', icon: <RouterIcon /> },
  { to: '/reports', label: 'Reports', icon: <AssessmentIcon /> },
  { to: '/settings', label: 'Settings', icon: <SettingsIcon />, perm: 'settings:read' },
  { to: '/users', label: 'Users', icon: <PeopleIcon />, perm: 'users:read' },
  { to: '/audit', label: 'Audit Log', icon: <HistoryIcon />, perm: 'audit:read' },
];

export function Layout({ children }: { children: ReactNode }) {
  const { user, logout, can } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [scanning, setScanning] = useState<'domains' | 'apis' | null>(null);
  const [toast, setToast] = useState<{ msg: string; sev: 'success' | 'error' } | null>(null);
  const [accountMenu, setAccountMenu] = useState<null | HTMLElement>(null);

  const runScan = async (scope: 'domains' | 'apis') => {
    if (scanning) return;
    setScanning(scope);
    try {
      const res = await api.post(`/monitoring/run?scope=${scope}`);
      const what = scope === 'apis' ? 'API endpoint' : 'domain target';
      setToast({ msg: `Scanned ${res.data.checked} ${what}(s) — ${res.data.down} down, ${res.data.warn} warnings`, sev: res.data.down ? 'error' : 'success' });
    } catch (err) {
      setToast({ msg: apiError(err), sev: 'error' });
    } finally {
      setScanning(null);
    }
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar position="fixed" sx={{ zIndex: (t) => t.zIndex.drawer + 1 }} color="default">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>📡 Domain Monitor</Typography>
          {can('monitoring:run') && (
            <Stack direction="row" spacing={1} sx={{ mr: 2 }}>
              <Button startIcon={<LanguageIcon />} onClick={() => runScan('domains')} disabled={!!scanning} variant="contained">
                {scanning === 'domains' ? 'Scanning…' : 'Scan domains'}
              </Button>
              <Button startIcon={<ApiIcon />} onClick={() => runScan('apis')} disabled={!!scanning} variant="outlined">
                {scanning === 'apis' ? 'Scanning…' : 'Scan APIs'}
              </Button>
            </Stack>
          )}
          <Button color="inherit" startIcon={<AccountCircleIcon />} onClick={(e) => setAccountMenu(e.currentTarget)}>
            {user?.name || user?.email} ({user?.role})
          </Button>
          <Menu anchorEl={accountMenu} open={!!accountMenu} onClose={() => setAccountMenu(null)}>
            <MenuItem onClick={() => { setAccountMenu(null); navigate('/change-password'); }}>Change password</MenuItem>
            <Divider />
            <MenuItem onClick={() => { setAccountMenu(null); logout(); navigate('/login'); }}>Logout</MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Drawer variant="permanent" sx={{ width: drawerWidth, flexShrink: 0, [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' } }}>
        <Toolbar />
        <Box sx={{ overflow: 'auto' }}>
          <List>
            {NAV.filter((n) => !n.perm || can(n.perm)).map((n) => (
              <ListItemButton key={n.to} component={Link} to={n.to} selected={location.pathname === n.to}>
                <ListItemIcon>{n.icon}</ListItemIcon>
                <ListItemText primary={n.label} />
              </ListItemButton>
            ))}
          </List>
          <Divider />
        </Box>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8, minHeight: '100vh' }}>
        {children}
      </Box>

      <Snackbar open={!!toast} autoHideDuration={5000} onClose={() => setToast(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        {toast ? <MuiAlert severity={toast.sev} onClose={() => setToast(null)}>{toast.msg}</MuiAlert> : undefined}
      </Snackbar>
    </Box>
  );
}
