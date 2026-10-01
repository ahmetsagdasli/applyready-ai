import { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, Container, Paper, Typography, Button, Alert, Stack } from '@mui/material';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';

import { useAuth } from '../context/AuthContext.jsx';
import { getBillingMe } from '../api/billingApi.js';

export default function BillingSuccess() {
  const { user, getToken } = useAuth();
  const [plan, setPlan] = useState(null);

  useEffect(() => {
    if (!user) return undefined;
    const timer = setTimeout(() => {
      getBillingMe(getToken())
        .then((data) => setPlan(data.plan))
        .catch(() => setPlan(null));
    }, 2000);
    return () => clearTimeout(timer);
  }, [user, getToken]);

  return (
    <Box
      sx={{
        flexGrow: 1,
        display: 'flex',
        alignItems: 'center',
        py: { xs: 6, md: 8 },
        background: 'linear-gradient(180deg, #0b0f17 0%, #111827 100%)',
      }}
    >
      <Container maxWidth="sm">
        <Paper variant="outlined" sx={{ p: { xs: 4, md: 5 }, textAlign: 'center', borderRadius: '8px' }}>
          <Box
            sx={{
              width: 72,
              height: 72,
              mx: 'auto',
              mb: 2.5,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'rgba(46, 125, 50, 0.10)',
              color: 'success.main',
            }}
          >
            <CheckCircleRoundedIcon sx={{ fontSize: 40 }} />
          </Box>
          <Typography variant="h4" gutterBottom>
            Ödeme başarılı
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3, maxWidth: 380, mx: 'auto' }}>
            Planınız birkaç saniye içinde güncellenecek. Aboneliğinizi dilediğiniz zaman
            Ayarlar sayfasından yönetebilirsiniz.
          </Typography>

          {plan === 'pro' && (
            <Alert severity="success" sx={{ mb: 3, justifyContent: 'center' }}>
              Planınız <strong>Pro</strong> olarak güncellendi.
            </Alert>
          )}

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="center">
            <Button component={RouterLink} to="/dashboard" variant="contained" size="large">
              Dashboard'a Git
            </Button>
            <Button component={RouterLink} to="/app/new" variant="outlined" size="large">
              Yeni Başvuru Hazırla
            </Button>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}
