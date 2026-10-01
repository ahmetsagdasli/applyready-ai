import { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Button,
  Stack,
  Alert,
  Chip,
  Divider,
} from '@mui/material';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import BoltRoundedIcon from '@mui/icons-material/BoltRounded';

import { useAuth } from '../context/AuthContext.jsx';
import {
  createCheckoutSession,
  createPortalSession,
  getBillingMe,
} from '../api/billingApi.js';
import { brand } from '../theme/theme.js';

const PRO_PRICE = '₺199';

const FREE_FEATURES = [
  '3 başvuru / ay',
  'CV + ön yazı + LinkedIn önerileri',
  'PDF / DOCX indirme',
];

const PRO_FEATURES = [
  '100 başvuru / ay',
  'CV + ön yazı + LinkedIn önerileri',
  'PDF / DOCX indirme',
  'Kayıtlı başvuru geçmişi',
];

function FeatureList({ items }) {
  return (
    <Stack spacing={1.1} sx={{ my: 2.5 }}>
      {items.map((f) => (
        <Stack key={f} direction="row" spacing={1} alignItems="center">
          <CheckCircleRoundedIcon sx={{ color: 'primary.main', fontSize: 18 }} />
          <Typography variant="body2" color="text.secondary">{f}</Typography>
        </Stack>
      ))}
    </Stack>
  );
}

function PlanCard({ title, price, caption, features, highlighted, current, children }) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: { xs: 2.5, md: 3 },
        height: '100%',
        borderRadius: '8px',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: highlighted ? 'rgba(94,234,212,0.08)' : brand.surface,
        borderColor: highlighted ? 'rgba(94,234,212,0.42)' : 'divider',
        boxShadow: highlighted ? '0 28px 70px rgba(0,0,0,0.32)' : 'none',
      }}
    >
      {highlighted && (
        <Chip
          icon={<BoltRoundedIcon sx={{ fontSize: 16 }} />}
          label="Önerilen"
          color="primary"
          size="small"
          sx={{ position: 'absolute', top: 16, right: 16, color: '#061016' }}
        />
      )}
      <Stack direction="row" alignItems="center" spacing={1} sx={{ pr: highlighted ? 12 : 0 }}>
        <Typography variant="h5">{title}</Typography>
        {current && <Chip label="Mevcut" color={highlighted ? 'success' : 'primary'} size="small" />}
      </Stack>
      <Typography color="text.secondary" sx={{ mt: 1, minHeight: 44, lineHeight: 1.6 }}>
        {caption}
      </Typography>
      <Typography variant="h3" sx={{ mt: 2, fontSize: { xs: 34, md: 42 } }}>
        {price}{' '}
        <Typography component="span" variant="body2" color="text.secondary">
          / ay
        </Typography>
      </Typography>
      <Divider sx={{ my: 2 }} />
      <FeatureList items={features} />
      <Box sx={{ flexGrow: 1 }} />
      {children}
    </Paper>
  );
}

export default function Pricing() {
  const { user, getToken } = useAuth();

  const [currentPlan, setCurrentPlan] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      getBillingMe(getToken())
        .then((data) => setCurrentPlan(data.plan))
        .catch(() => setCurrentPlan(null));
    }
  }, [user, getToken]);

  async function handleUpgrade() {
    setError('');
    setLoading(true);
    try {
      await createCheckoutSession(getToken(), 'pro');
    } catch (err) {
      setError(err.response?.data?.message || 'Ödeme sayfası açılamadı. Tekrar deneyin.');
      setLoading(false);
    }
  }

  async function handleManage() {
    setError('');
    setLoading(true);
    try {
      await createPortalSession(getToken());
    } catch (err) {
      setError(
        err.response?.data?.message || 'Abonelik yönetim sayfası açılamadı. Tekrar deneyin.'
      );
      setLoading(false);
    }
  }

  const isFree = currentPlan === 'free';
  const isPro = currentPlan === 'pro';

  return (
    <Box
      sx={{
        flexGrow: 1,
        py: { xs: 6, md: 9 },
        background:
          'linear-gradient(180deg, rgba(11,15,23,1) 0%, rgba(15,23,42,1) 50%, rgba(11,15,23,1) 100%)',
      }}
    >
      <Container maxWidth="lg" sx={{ px: { xs: 2, md: 4 } }}>
        <Box sx={{ maxWidth: 780, mx: 'auto', textAlign: 'center', mb: { xs: 4, md: 5 } }}>
          <Chip
            icon={<AutoAwesomeRoundedIcon sx={{ fontSize: 16 }} />}
            label="Basit, iptal edilebilir abonelik"
            variant="outlined"
            sx={{ mb: 2, borderColor: 'rgba(94,234,212,0.28)', color: 'primary.main' }}
          />
          <Typography variant="h2" component="h1" sx={{ fontSize: { xs: 36, md: 56 } }}>
            Başvuru hacmine göre plan seçin
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 1.5, lineHeight: 1.75 }}>
            Ücretsiz başlayın, daha yoğun başvuru dönemlerinde Pro’ya geçin. Taahhüt yok,
            aboneliği dilediğiniz an yönetebilirsiniz.
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3} alignItems="stretch">
          <Grid item xs={12} md={6}>
            <PlanCard
              title="Free"
              price="₺0"
              caption="Ayda birkaç hedefli başvuru hazırlayan kullanıcılar için başlangıç alanı."
              features={FREE_FEATURES}
              current={isFree}
            >
              {!user ? (
                <Button variant="outlined" fullWidth size="large" component={RouterLink} to="/register">
                  Ücretsiz Başla
                </Button>
              ) : (
                <Button variant="outlined" fullWidth size="large" disabled>
                  {isFree ? 'Mevcut planınız' : 'Free'}
                </Button>
              )}
            </PlanCard>
          </Grid>

          <Grid item xs={12} md={6}>
            <PlanCard
              title="Pro"
              price={PRO_PRICE}
              caption="Yoğun başvuru sürecinde skor takibi ve geçmiş yönetimi isteyenler için."
              features={PRO_FEATURES}
              highlighted
              current={isPro}
            >
              {!user ? (
                <Button variant="contained" fullWidth size="large" component={RouterLink} to="/register">
                  Pro’ya Geç
                </Button>
              ) : isPro ? (
                <Button variant="outlined" fullWidth size="large" onClick={handleManage} disabled={loading}>
                  {loading ? 'Açılıyor...' : 'Aboneliği Yönet'}
                </Button>
              ) : (
                <Button variant="contained" fullWidth size="large" onClick={handleUpgrade} disabled={loading}>
                  {loading ? 'Yönlendiriliyor...' : 'Pro’ya Geç'}
                </Button>
              )}
            </PlanCard>
          </Grid>
        </Grid>

        <Typography variant="body2" align="center" color="text.secondary" sx={{ mt: 3 }}>
          Ödemeler Stripe üzerinden güvenle alınır. Aboneliğinizi istediğiniz an iptal edebilirsiniz.
        </Typography>
      </Container>
    </Box>
  );
}
