import { useState } from 'react';
import { Link as RouterLink, useSearchParams, useNavigate } from 'react-router-dom';
import { Box, Button, Card, CardContent, Link, Stack, TextField, Typography, Alert } from '@mui/material';
import { api, apiError } from '../api/client';

export function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token') || '';
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await api.post('/auth/reset-password', { token, password });
      setDone(true);
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setError(apiError(err));
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Card sx={{ width: 380 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Choose a new password</Typography>
          {!token && <Alert severity="warning">Missing reset token in the URL.</Alert>}
          {done ? (
            <Alert severity="success">Password updated. Redirecting to sign in…</Alert>
          ) : (
            <form onSubmit={submit}>
              <Stack spacing={2} mt={1}>
                <TextField label="New password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required fullWidth helperText="At least 8 characters" />
                {error && <Alert severity="error">{error}</Alert>}
                <Button type="submit" variant="contained" fullWidth disabled={!token}>Update password</Button>
              </Stack>
            </form>
          )}
          <Box mt={2}><Link component={RouterLink} to="/login" variant="body2">Back to sign in</Link></Box>
        </CardContent>
      </Card>
    </Box>
  );
}
