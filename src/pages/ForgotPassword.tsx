import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, Button, Card, CardContent, Link, Stack, TextField, Typography, Alert } from '@mui/material';
import { api, apiError } from '../api/client';

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await api.post('/auth/forgot-password', { email });
      setDone(true);
    } catch (err) {
      setError(apiError(err));
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Card sx={{ width: 380 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Reset your password</Typography>
          {done ? (
            <Alert severity="success">If that email exists, a reset link has been sent. Check your inbox (or the server console if SMTP is disabled).</Alert>
          ) : (
            <form onSubmit={submit}>
              <Stack spacing={2} mt={1}>
                <Typography variant="body2" color="text.secondary">Enter your email and we'll send a reset link.</Typography>
                <TextField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required fullWidth />
                {error && <Alert severity="error">{error}</Alert>}
                <Button type="submit" variant="contained" fullWidth>Send reset link</Button>
              </Stack>
            </form>
          )}
          <Box mt={2}><Link component={RouterLink} to="/login" variant="body2">Back to sign in</Link></Box>
        </CardContent>
      </Card>
    </Box>
  );
}
