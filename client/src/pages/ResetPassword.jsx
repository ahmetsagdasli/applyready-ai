import { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { Box, Button, Stack, Alert } from '@mui/material';

import { useAuth } from '../context/AuthContext.jsx';
import AuthLayout from '../components/AuthLayout.jsx';
import PasswordField from '../components/PasswordField.jsx';

export default function ResetPassword() {
  const { updatePassword, supabaseEnabled } = useAuth();
  const navigate = useNavigate();

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
      const { error: updateError } = await updatePassword(password);
      if (updateError) {
        setError(updateError.message);
      } else {
        setInfo('Şifreniz güncellendi. Giriş ekranına yönlendiriliyorsunuz...');
        setTimeout(() => navigate('/login'), 1500);
      }
    } catch (err) {
      setError(err.message || 'Şifre güncellenemedi.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Yeni şifre belirleyin"
      subtitle="Hesabınız için yeni bir şifre oluşturun."
      footer={<RouterLink to="/login">Giriş ekranına dön</RouterLink>}
    >
      {!supabaseEnabled && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Supabase yapılandırılmamış. Şifre güncelleme devre dışı.
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit}>
        <Stack spacing={2}>
          <PasswordField
            label="Yeni şifre"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
            helperText="En az 6 karakter"
          />
          <PasswordField
            label="Yeni şifre (tekrar)"
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
            {loading ? 'Güncelleniyor...' : 'Şifreyi Güncelle'}
          </Button>
        </Stack>
      </Box>
    </AuthLayout>
  );
}
