import { useState, useEffect } from 'react';
import { useNavigate, Navigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
} from '@mui/material';

import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { exportAccountData, deleteAppData, deleteAccount } from '../api/accountApi.js';
import { getBillingMe, createPortalSession } from '../api/billingApi.js';

function isDeleteConfirmed(text) {
  const v = String(text).trim().toLocaleUpperCase('tr');
  return v === 'SİL' || v === 'SIL';
}

export default function AccountSettings() {
  const { user, loading: authLoading, getToken, signOut } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [billing, setBilling] = useState(null);

  const [appDataDialog, setAppDataDialog] = useState(false);
  const [accountDialog, setAccountDialog] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  useEffect(() => {
    if (user) {
      getBillingMe(getToken())
        .then((data) => setBilling(data))
        .catch(() => setBilling(null));
    }
  }, [user, getToken]);

  function resetMessages() {
    setError('');
    setInfo('');
  }

  async function handleManageSubscription() {
    resetMessages();
    setBusy(true);
    try {
      await createPortalSession(getToken());
    } catch (err) {
      setError(
        err.response?.data?.message || 'Abonelik yönetim sayfası açılamadı. Tekrar deneyin.'
      );
      setBusy(false);
    }
  }

  async function handleExport() {
    resetMessages();
    setBusy(true);
    try {
      await exportAccountData(getToken());
      toast.success('Verileriniz JSON dosyası olarak indirildi.');
    } catch (err) {
      setError(err.response?.data?.message || 'Veri indirme başarısız.');
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteAppData() {
    resetMessages();
    setBusy(true);
    try {
      const res = await deleteAppData(getToken());
      setAppDataDialog(false);
      setInfo(`${res.deletedApplications} başvuru silindi. Hesabınız açık kalmaya devam ediyor.`);
    } catch (err) {
      setError(err.response?.data?.message || 'Silme işlemi başarısız.');
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteAccount() {
    resetMessages();
    setBusy(true);
    try {
      await deleteAccount(getToken());
      await signOut();
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Hesap silme başarısız. Lütfen tekrar deneyin.');
      setBusy(false);
    }
  }

  if (authLoading) {
    return (
      <Box sx={{ py: 6, textAlign: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }
  if (!user) return <Navigate to="/login" replace />;

  return (
    <Box
      sx={{
        py: { xs: 4, md: 6 },
        minHeight: '100%',
        background: 'linear-gradient(180deg, #0b0f17 0%, #111827 48%, #0b0f17 100%)',
      }}
    >
      <Container maxWidth="md" sx={{ px: { xs: 2, md: 4 } }}>
        <Typography variant="h3" gutterBottom sx={{ fontSize: { xs: 32, md: 44 } }}>
          Ayarlar
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Hesabınızı, aboneliğinizi ve kişisel verilerinizi buradan yönetin.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {info && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {info}
          </Alert>
        )}

        <Paper variant="outlined" sx={{ p: 3, mb: 3, borderRadius: '8px' }}>
          <Typography variant="h6" gutterBottom>
            Hesap Bilgisi
          </Typography>
          <Typography variant="body2" color="text.secondary">
            E-posta: {user.email}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            CV ve başvuru verileriniz kişisel veri içerebilir. Buradan verilerinizi
            indirebilir veya silebilirsiniz.
          </Typography>
        </Paper>

        <Paper variant="outlined" sx={{ p: 3, mb: 3, borderRadius: '8px' }}>
          <Typography variant="h6" gutterBottom>
            Abonelik
          </Typography>
          {billing ? (
            <>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Mevcut plan: <strong>{billing.plan}</strong>
                {billing.monthlyLimit !== null
                  ? ` (${billing.monthlyLimit} başvuru / ay)`
                  : ' (sınırsız)'}
              </Typography>
              {billing.plan === 'pro' ? (
                <Button variant="outlined" onClick={handleManageSubscription} disabled={busy}>
                  Aboneliği Yönet
                </Button>
              ) : billing.monthlyLimit === null ? (
                <Typography variant="body2" color="text.secondary">
                  Geliştirici/Test planı.
                </Typography>
              ) : (
                <Button variant="contained" component={RouterLink} to="/pricing" disabled={busy}>
                  Planı Yükselt
                </Button>
              )}
            </>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Plan bilgisi yükleniyor...
            </Typography>
          )}
        </Paper>

        <Paper variant="outlined" sx={{ p: 3, mb: 3, borderRadius: '8px' }}>
          <Typography variant="h6" gutterBottom>
            Verilerimi İndir
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Profil ve tüm başvuru verilerinizi JSON dosyası olarak indirin.
          </Typography>
          <Button variant="outlined" onClick={handleExport} disabled={busy}>
            Verilerimi JSON Olarak İndir
          </Button>
        </Paper>

        <Paper variant="outlined" sx={{ p: 3, mb: 3, borderRadius: '8px' }}>
          <Typography variant="h6" gutterBottom>
            Uygulama Verilerimi Sil
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Bu işlem kayıtlı başvurularınızı siler. Hesabınız açık kalır.
          </Typography>
          <Button
            variant="outlined"
            color="warning"
            onClick={() => {
              resetMessages();
              setAppDataDialog(true);
            }}
            disabled={busy}
          >
            Başvuru Verilerimi Sil
          </Button>
        </Paper>

        <Paper
          variant="outlined"
          sx={{ p: 3, borderRadius: '8px', borderColor: 'error.light', bgcolor: 'rgba(251, 113, 133, 0.08)' }}
        >
          <Typography variant="overline" sx={{ color: 'error.main', fontWeight: 700, letterSpacing: '0.08em' }}>
            Tehlikeli bölge
          </Typography>
          <Typography variant="h6" gutterBottom color="error">
            Hesabımı Sil
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Bu işlem hesabınızı ve uygulama verilerinizi silmeyi dener. Geri alınamaz.
          </Typography>
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              resetMessages();
              setConfirmText('');
              setAccountDialog(true);
            }}
            disabled={busy}
          >
            Hesabımı Sil
          </Button>
        </Paper>
      </Container>

      <Dialog open={appDataDialog} onClose={() => setAppDataDialog(false)}>
        <DialogTitle>Başvuru verilerini sil</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Bu işlem geri alınamaz. Tüm kayıtlı başvurularınız silinecek. Devam etmek
            istiyor musunuz?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAppDataDialog(false)} disabled={busy}>
            Vazgeç
          </Button>
          <Button color="warning" variant="contained" onClick={handleDeleteAppData} disabled={busy}>
            Evet, Sil
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={accountDialog} onClose={() => setAccountDialog(false)}>
        <DialogTitle>Hesabı sil</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Bu işlem geri alınamaz. Onaylamak için aşağıya büyük harflerle{' '}
            <strong>SİL</strong> yazın.
          </DialogContentText>
          <TextField
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="SİL"
            fullWidth
            autoFocus
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAccountDialog(false)} disabled={busy}>
            Vazgeç
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleDeleteAccount}
            disabled={busy || !isDeleteConfirmed(confirmText)}
          >
            Hesabımı Kalıcı Sil
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
