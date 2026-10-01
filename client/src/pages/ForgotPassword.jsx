import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, TextField, Button, Stack, Alert } from '@mui/material';

import { useAuth } from '../context/AuthContext.jsx';
import AuthLayout from '../components/AuthLayout.jsx';

export default function ForgotPassword() {
  const { resetPassword, supabaseEnabled } = useAuth();

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);
    try {
      const { error: resetError } = await resetPassword(email);
      if (resetError) setError(resetError.message);
      else
        setInfo(
          'Şifre sıfırlama bağlantısı e-postanıza gönderildi. Gelen kutunuzu kontrol edin.'
        );
    } catch (err) {
      setError(err.message || 'İşlem tamamlanamadı.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Şifrenizi mi unuttunuz?"
      subtitle="E-posta adresinizi girin, size şifre sıfırlama bağlantısı gönderelim."
      footer={<RouterLink to="/login">Giriş ekranına dön</RouterLink>}
    >
      {!supabaseEnabled && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Supabase yapılandırılmamış. Şifre sıfırlama devre dışı.
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
          {error && <Alert severity="error">{error}</Alert>}
          {info && <Alert severity="success">{info}</Alert>}
          <Button type="submit" variant="contained" size="large" disabled={loading}>
            {loading ? 'Gönderiliyor...' : 'Sıfırlama Bağlantısı Gönder'}
          </Button>
        </Stack>
      </Box>
    </AuthLayout>
  );
}
