import { useState } from 'react';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import { Box, TextField, Button, Stack, Alert } from '@mui/material';

import { useAuth } from '../context/AuthContext.jsx';
import AuthLayout from '../components/AuthLayout.jsx';
import PasswordField from '../components/PasswordField.jsx';

export default function Register() {
  const { signUp, supabaseEnabled } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  // Misafir akışından gelindiyse kayıttan sonra oraya dön.
  const next = location.state?.next || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setInfo('');
    if (password !== confirm) {
      setError('Şifreler eşleşmiyor.');
      return;
    }
    setLoading(true);
    try {
      const { data, error: signUpError } = await signUp(email, password);
      if (signUpError) setError(signUpError.message);
      else if (data?.session) navigate(next);
      else
        setInfo(
          'Kayıt başarılı. E-posta onayı gerekiyorsa gelen kutunuzu kontrol edin, ardından giriş yapın.'
        );
    } catch (err) {
      setError(err.message || 'Kayıt yapılamadı.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Hesap oluşturun"
      subtitle="Birkaç saniyede kaydolun, başvurularınızı kaydedin ve yönetin."
      footer={<>Zaten hesabınız var mı? <RouterLink to="/login">Giriş Yap</RouterLink></>}
    >
      {!supabaseEnabled && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Supabase yapılandırılmamış. Kayıt devre dışı; kayıtsız kullanabilirsiniz.
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
            autoComplete="new-password"
            helperText="En az 6 karakter"
          />
          <PasswordField
            label="Şifre (tekrar)"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            autoComplete="new-password"
            error={Boolean(confirm) && confirm !== password}
            helperText={Boolean(confirm) && confirm !== password ? 'Şifreler eşleşmiyor' : ' '}
          />
          {error && <Alert severity="error">{error}</Alert>}
          {info && <Alert severity="success">{info}</Alert>}
          <Button type="submit" variant="contained" size="large" disabled={loading}>
            {loading ? 'Kaydediliyor...' : 'Kayıt Ol'}
          </Button>
        </Stack>
      </Box>
    </AuthLayout>
  );
}
