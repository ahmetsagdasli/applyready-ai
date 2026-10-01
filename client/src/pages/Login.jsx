import { useState } from 'react';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import { Box, Typography, TextField, Button, Stack, Alert } from '@mui/material';

import { useAuth } from '../context/AuthContext.jsx';
import AuthLayout from '../components/AuthLayout.jsx';
import PasswordField from '../components/PasswordField.jsx';

export default function Login() {
  const { signIn, supabaseEnabled } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  // Misafir akışından (örn. /app/new) gelindiyse girişten sonra oraya dön.
  const next = location.state?.next || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { error: signInError } = await signIn(email, password);
      if (signInError) setError(signInError.message);
      else navigate(next);
    } catch (err) {
      setError(err.message || 'Giriş yapılamadı.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Tekrar hoş geldiniz"
      subtitle="Hesabınıza giriş yapın ve kaldığınız yerden devam edin."
      footer={<>Hesabınız yok mu? <RouterLink to="/register" state={{ next }}>Kayıt Ol</RouterLink></>}
    >
      {!supabaseEnabled && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Supabase yapılandırılmamış. Giriş devre dışı; kayıtsız kullanabilirsiniz.
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit}>
        <Stack spacing={2}>
          <TextField
            label="E-posta"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            fullWidth
            autoComplete="email"
          />
          <PasswordField
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
          {error && <Alert severity="error">{error}</Alert>}
          <Button type="submit" variant="contained" size="large" disabled={loading}>
            {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
          </Button>
        </Stack>
      </Box>

      <Typography variant="body2" align="center" sx={{ mt: 2 }}>
        <RouterLink to="/forgot-password">Şifremi unuttum</RouterLink>
      </Typography>
    </AuthLayout>
  );
}
