import { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { Box, Button, Card, CardContent, Link, Stack, TextField, Typography, Alert } from '@mui/material';
import { useAuth } from '../auth/AuthContext';
import { apiError } from '../api/client';

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(apiError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Card sx={{ width: 380 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>📡 Domain Monitor</Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>Sign in to your admin panel</Typography>
          <form onSubmit={submit}>
            <Stack spacing={2} mt={2}>
              <TextField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required fullWidth autoComplete="username" />
              <TextField label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required fullWidth autoComplete="current-password" />
              {error && <Alert severity="error">{error}</Alert>}
              <Button type="submit" variant="contained" disabled={busy} fullWidth>{busy ? 'Signing in…' : 'Sign in'}</Button>
              <Link component={RouterLink} to="/forgot-password" variant="body2">Forgot password?</Link>
            </Stack>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}
