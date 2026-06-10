import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  AppBar, Box, Button, CssBaseline, Divider, Drawer, IconButton, List, ListItemButton, ListItemIcon,
  ListItemText, Stack, Toolbar, Tooltip, Typography, Snackbar, Alert as MuiAlert, Menu, MenuItem,
  useMediaQuery, useTheme,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
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

const drawerWidth = 240;

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
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const compactScan = useMediaQuery(theme.breakpoints.down('lg')); // icon-only scan buttons on tighter screens
  const [mobileOpen, setMobileOpen] = useState(false);
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

  const ScanControls = () => {
    if (compactScan) {
      return (
        <Stack direction="row" spacing={0.5}>
          <Tooltip title="Scan domains">
            <span><IconButton color="primary" onClick={() => runScan('domains')} disabled={!!scanning}><LanguageIcon /></IconButton></span>
          </Tooltip>
          <Tooltip title="Scan API endpoints">
            <span><IconButton color="secondary" onClick={() => runScan('apis')} disabled={!!scanning}><ApiIcon /></IconButton></span>
          </Tooltip>
        </Stack>
      );
    }
    return (
      <Stack direction="row" spacing={1}>
        <Button size="small" startIcon={<LanguageIcon />} onClick={() => runScan('domains')} disabled={!!scanning} variant="contained">
          {scanning === 'domains' ? 'Scanning…' : 'Scan domains'}
        </Button>
        <Button size="small" startIcon={<ApiIcon />} onClick={() => runScan('apis')} disabled={!!scanning} variant="outlined">
          {scanning === 'apis' ? 'Scanning…' : 'Scan APIs'}
        </Button>
      </Stack>
    );
  };

  const drawerContent = (
    <>
      <Toolbar sx={{ gap: 1 }}>
        <Typography variant="h6" noWrap sx={{ fontWeight: 700 }}>📡 PULSE</Typography>
      </Toolbar>
      <Divider />
      <Box sx={{ overflow: 'auto', py: 1 }}>
        <List>
          {NAV.filter((n) => !n.perm || can(n.perm)).map((n) => (
            <ListItemButton
              key={n.to}
              component={Link}
              to={n.to}
              selected={location.pathname === n.to}
              onClick={() => { if (!isDesktop) setMobileOpen(false); }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>{n.icon}</ListItemIcon>
              <ListItemText primary={n.label} primaryTypographyProps={{ fontSize: 14, fontWeight: 500 }} />
            </ListItemButton>
          ))}
        </List>
      </Box>
    </>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar position="fixed" sx={{ zIndex: (t) => t.zIndex.drawer + 1 }}>
        <Toolbar sx={{ gap: 1 }}>
          {!isDesktop && (
            <IconButton edge="start" onClick={() => setMobileOpen(true)} aria-label="open navigation">
              <MenuIcon />
            </IconButton>
          )}
          <Typography variant="h6" noWrap sx={{ flexGrow: 1, fontWeight: 700, fontSize: { xs: 16, sm: 20 } }}>
            {isDesktop ? 'PULSE' : '📡 PULSE'}
          </Typography>

          {can('monitoring:run') && <ScanControls />}

          {isDesktop ? (
            <Button color="inherit" startIcon={<AccountCircleIcon />} onClick={(e) => setAccountMenu(e.currentTarget)} sx={{ ml: 1, textTransform: 'none' }}>
              {user?.name || user?.email} ({user?.role})
            </Button>
          ) : (
            <IconButton color="inherit" onClick={(e) => setAccountMenu(e.currentTarget)} aria-label="account menu">
              <AccountCircleIcon />
            </IconButton>
          )}
          <Menu anchorEl={accountMenu} open={!!accountMenu} onClose={() => setAccountMenu(null)}>
            {!isDesktop && (
              <MenuItem disabled sx={{ opacity: '1 !important', display: 'block' }}>
                <Typography variant="body2" fontWeight={600}>{user?.name || user?.email}</Typography>
                <Typography variant="caption" color="text.secondary">{user?.role}</Typography>
              </MenuItem>
            )}
            {!isDesktop && <Divider />}
            <MenuItem onClick={() => { setAccountMenu(null); navigate('/change-password'); }}>Change password</MenuItem>
            <Divider />
            <MenuItem onClick={() => { setAccountMenu(null); logout(); navigate('/login'); }}>Logout</MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }} aria-label="navigation">
        {/* Mobile: temporary overlay drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box' } }}
        >
          {drawerContent}
        </Drawer>
        {/* Desktop: permanent drawer */}
        <Drawer
          variant="permanent"
          open
          sx={{ display: { xs: 'none', md: 'block' }, '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box' } }}
        >
          {drawerContent}
        </Drawer>
      </Box>

      <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, sm: 3 }, mt: 8, width: { md: `calc(100% - ${drawerWidth}px)` }, minHeight: '100vh' }}>
        {children}
      </Box>

      <Snackbar open={!!toast} autoHideDuration={5000} onClose={() => setToast(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        {toast ? <MuiAlert severity={toast.sev} variant="filled" onClose={() => setToast(null)}>{toast.msg}</MuiAlert> : undefined}
      </Snackbar>
    </Box>
  );
}
