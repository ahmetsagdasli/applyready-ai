import { useEffect, useState, useCallback, useMemo } from 'react';
import { Link as RouterLink, Navigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  CircularProgress,
  Stack,
  Grid,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  LinearProgress,
  TextField,
  InputAdornment,
  MenuItem,
  Avatar,
  Divider,
} from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded';
import InsightsRoundedIcon from '@mui/icons-material/InsightsRounded';
import BoltRoundedIcon from '@mui/icons-material/BoltRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import WorkOutlineRoundedIcon from '@mui/icons-material/WorkOutlineRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import SpaceDashboardRoundedIcon from '@mui/icons-material/SpaceDashboardRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import ArrowUpwardRoundedIcon from '@mui/icons-material/ArrowUpwardRounded';

import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { listApplications, deleteApplication } from '../api/applicationApi.js';
import { getUsageSummary } from '../api/usageApi.js';
import { createPortalSession } from '../api/billingApi.js';
import { brand } from '../theme/theme.js';
import { getScoreMeta, SCORE_THRESHOLDS } from '../utils/score.js';

function formatDate(value) {
  if (!value) return '-';
  try {
    return new Date(value).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return value;
  }
}

function KpiCard({ icon: Icon, label, value, hint, tone = 'primary' }) {
  const colorMap = {
    primary: 'primary.main',
    amber: 'secondary.main',
    green: 'success.main',
  };
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2.2,
        borderRadius: '8px',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        bgcolor: 'rgba(255,255,255,0.045)',
      }}
    >
      <Stack direction="row" spacing={1.6} alignItems="flex-start">
        <Box
          sx={{
            width: 42,
            height: 42,
            borderRadius: '8px',
            flexShrink: 0,
            display: 'grid',
            placeItems: 'center',
            bgcolor: 'rgba(255,255,255,0.06)',
            color: colorMap[tone],
          }}
        >
          <Icon />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h4" sx={{ fontSize: { xs: 28, md: 32 }, lineHeight: 1, color: 'text.primary' }}>
            {value}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.8 }}>
            {label}
          </Typography>
          {hint && (
            <Typography variant="caption" color="text.secondary">
              {hint}
            </Typography>
          )}
        </Box>
      </Stack>
    </Paper>
  );
}

function DashboardSideRail({ user }) {
  const initial = (user?.email || '?').charAt(0).toUpperCase();
  return (
    <Box
      component="aside"
      sx={{
        display: { xs: 'none', lg: 'flex' },
        flexDirection: 'column',
        width: 248,
        p: 2,
        borderRight: '1px solid',
        borderColor: 'divider',
        bgcolor: 'rgba(9,13,20,0.76)',
        minHeight: 'calc(100vh - 72px)',
      }}
    >
      <Stack spacing={0.75}>
        <Button
          component={RouterLink}
          to="/dashboard"
          startIcon={<SpaceDashboardRoundedIcon />}
          sx={{
            justifyContent: 'flex-start',
            color: 'primary.main',
            bgcolor: 'rgba(94,234,212,0.1)',
            border: '1px solid rgba(94,234,212,0.2)',
          }}
        >
          Başvurular
        </Button>
        <Button component={RouterLink} to="/app/new" startIcon={<AddRoundedIcon />} sx={{ justifyContent: 'flex-start', color: 'text.secondary' }}>
          Yeni paket
        </Button>
        <Button component={RouterLink} to="/settings" startIcon={<SettingsRoundedIcon />} sx={{ justifyContent: 'flex-start', color: 'text.secondary' }}>
          Ayarlar
        </Button>
      </Stack>

      <Box sx={{ mt: 'auto' }}>
        <Divider sx={{ mb: 2 }} />
        <Stack direction="row" spacing={1.2} alignItems="center">
          <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.main', color: '#061016', fontWeight: 800 }}>
            {initial}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="caption" color="text.secondary">
              Aktif hesap
            </Typography>
            <Typography variant="body2" fontWeight={700} noWrap>
              {user.email}
            </Typography>
          </Box>
        </Stack>
      </Box>
    </Box>
  );
}

export default function Dashboard() {
  const { user, loading: authLoading, getToken } = useAuth();
  const toast = useToast();

  const [apps, setApps] = useState([]);
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [portalLoading, setPortalLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [query, setQuery] = useState('');
  const [scoreFilter, setScoreFilter] = useState('all');

  const load = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      const [data, usageData] = await Promise.all([
        listApplications(getToken()),
        getUsageSummary(getToken()).catch(() => null),
      ]);
      setApps(data);
      setUsage(usageData);
    } catch (err) {
      setError(err.response?.data?.message || 'Başvurular yüklenirken hata oluştu.');
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    if (user) load();
  }, [user, load]);

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteApplication(deleteTarget.id, getToken());
      setApps((prev) => prev.filter((a) => a.id !== deleteTarget.id));
      setDeleteTarget(null);
      toast.success('Başvuru silindi.');
    } catch (err) {
      setError(err.response?.data?.message || 'Silme işlemi başarısız.');
    } finally {
      setDeleting(false);
    }
  }

  async function handleManageSubscription() {
    setError('');
    setPortalLoading(true);
    try {
      await createPortalSession(getToken());
    } catch (err) {
      setError(err.response?.data?.message || 'Abonelik yönetim sayfası açılamadı. Tekrar deneyin.');
      setPortalLoading(false);
    }
  }

  const scored = apps.map((a) => Number(a.atsScore)).filter((n) => Number.isFinite(n));
  const avgScore = scored.length ? Math.round(scored.reduce((s, n) => s + n, 0) / scored.length) : null;
  const strongApps = scored.filter((n) => n >= SCORE_THRESHOLDS.strong).length;

  const filteredApps = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('tr-TR');
    return apps.filter((app) => {
      const score = Number(app.atsScore);
      const matchesQuery =
        !normalized ||
        [app.targetPosition, app.style, app.language]
          .filter(Boolean)
          .some((v) => String(v).toLocaleLowerCase('tr-TR').includes(normalized));
      const matchesScore =
        scoreFilter === 'all' ||
        (scoreFilter === 'strong' && Number.isFinite(score) && score >= SCORE_THRESHOLDS.strong) ||
        (scoreFilter === 'review' && (!Number.isFinite(score) || score < SCORE_THRESHOLDS.strong));
      return matchesQuery && matchesScore;
    });
  }, [apps, query, scoreFilter]);

  if (authLoading) {
    return (
      <Box sx={{ py: 8, textAlign: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }
  if (!user) return <Navigate to="/login" replace />;

  return (
    <Box sx={{ minHeight: '100%', display: 'flex', bgcolor: 'background.default' }}>
      <DashboardSideRail user={user} />

      <Box component="section" sx={{ flex: 1, minWidth: 0, p: { xs: 2, md: 4 } }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'stretch', md: 'flex-start' }}
          spacing={2.5}
          sx={{ mb: 3 }}
        >
          <Box>
            <Chip
              icon={<AutoAwesomeRoundedIcon sx={{ fontSize: 16 }} />}
              label="Başvuru operasyon merkezi"
              variant="outlined"
              sx={{ mb: 1.5, borderColor: 'rgba(94,234,212,0.28)', color: 'primary.main' }}
            />
            <Typography variant="h3" component="h1" sx={{ fontSize: { xs: 32, md: 44 } }}>
              Başvurularım
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mt: 1, maxWidth: 650, lineHeight: 1.7 }}>
              Üretilen CV, ön yazı ve LinkedIn paketlerini skor, dil ve tarih bilgisiyle yönetin.
            </Typography>
          </Box>
          <Button component={RouterLink} to="/app/new" variant="contained" size="large" startIcon={<AddRoundedIcon />} sx={{ alignSelf: { md: 'center' } }}>
            Yeni Başvuru
          </Button>
        </Stack>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={2} sx={{ mb: 2.5 }}>
          <Grid item xs={12} md={4}>
            <KpiCard icon={DescriptionRoundedIcon} label="Toplam başvuru paketi" value={apps.length} tone="primary" />
          </Grid>
          <Grid item xs={12} md={4}>
            <KpiCard icon={InsightsRoundedIcon} label="Ortalama ATS skoru" value={avgScore ?? '—'} hint={`${strongApps} paket güçlü eşikte`} tone="green" />
          </Grid>
          <Grid item xs={12} md={4}>
            <KpiCard
              icon={BoltRoundedIcon}
              label={usage ? `${usage.plan} plan` : 'Plan'}
              value={
                usage
                  ? usage.monthlyLimit === null
                    ? 'Sınırsız'
                    : `${usage.usedThisMonth}/${usage.monthlyLimit}`
                  : '—'
              }
              hint={usage && usage.monthlyLimit !== null ? `${usage.remaining} hak kaldı` : 'Bu ay'}
              tone="amber"
            />
          </Grid>
        </Grid>

        {usage && (usage.plan === 'pro' || usage.monthlyLimit !== null) && (
          <Paper variant="outlined" sx={{ p: 2, mb: 2.5, borderRadius: '8px', bgcolor: 'rgba(245,158,11,0.07)' }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }} gap={1.5}>
              <Stack direction="row" spacing={1.2} alignItems="center">
                <ArrowUpwardRoundedIcon sx={{ color: 'secondary.main' }} />
                <Typography variant="body2" color="text.secondary">
                  {usage.monthlyLimit === null
                    ? 'Sınırsız plandasınız.'
                    : `Bu ay ${usage.usedThisMonth}/${usage.monthlyLimit} başvuru kullanıldı. Kalan: ${usage.remaining}.`}
                </Typography>
              </Stack>
              {usage.plan === 'pro' ? (
                <Button size="small" variant="outlined" onClick={handleManageSubscription} disabled={portalLoading}>
                  {portalLoading ? 'Açılıyor...' : 'Aboneliği Yönet'}
                </Button>
              ) : (
                <Button size="small" variant="contained" component={RouterLink} to="/pricing">
                  Pro plana geç
                </Button>
              )}
            </Stack>
          </Paper>
        )}

        <Paper variant="outlined" sx={{ p: 1.5, mb: 2.5, borderRadius: '8px', bgcolor: brand.glass }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ md: 'center' }}>
            <TextField
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Pozisyon, dil veya tarz ara"
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRoundedIcon sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              select
              value={scoreFilter}
              onChange={(e) => setScoreFilter(e.target.value)}
              sx={{ minWidth: { xs: '100%', md: 220 } }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <TuneRoundedIcon sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
              }}
            >
              <MenuItem value="all">Tüm skorlar</MenuItem>
              <MenuItem value="strong">75+ güçlü</MenuItem>
              <MenuItem value="review">İyileştirilecek</MenuItem>
            </TextField>
          </Stack>
        </Paper>

        {loading ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : apps.length === 0 ? (
          <Paper variant="outlined" sx={{ p: { xs: 4, md: 6 }, textAlign: 'center', borderRadius: '8px' }}>
            <Box
              sx={{
                width: 64,
                height: 64,
                mx: 'auto',
                mb: 2,
                borderRadius: '8px',
                display: 'grid',
                placeItems: 'center',
                bgcolor: 'rgba(94,234,212,0.1)',
                color: 'primary.main',
              }}
            >
              <WorkOutlineRoundedIcon sx={{ fontSize: 32 }} />
            </Box>
            <Typography variant="h5" gutterBottom>
              Henüz başvurunuz yok
            </Typography>
            <Typography color="text.secondary" sx={{ maxWidth: 460, mx: 'auto', mb: 3, lineHeight: 1.7 }}>
              CV’nizi ve hedef iş ilanını girin; CV, ön yazı ve LinkedIn önerilerinizi tek pakette hazırlayın.
            </Typography>
            <Button component={RouterLink} to="/app/new" variant="contained" size="large" startIcon={<AddRoundedIcon />}>
              İlk Başvurunu Hazırla
            </Button>
          </Paper>
        ) : filteredApps.length === 0 ? (
          <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', borderRadius: '8px' }}>
            <Typography variant="h6">Filtreye uyan başvuru yok</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Arama metnini temizleyin veya skor filtresini tüm skorlar olarak değiştirin.
            </Typography>
          </Paper>
        ) : (
          <>
            <Stack spacing={1.5} sx={{ display: { xs: 'flex', md: 'none' } }}>
              {filteredApps.map((a) => {
                const { hasScore, score, scoreColor } = getScoreMeta(a);
                return (
                  <Paper key={a.id} variant="outlined" sx={{ p: 2, borderRadius: '8px' }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography sx={{ fontWeight: 800 }} noWrap>
                          {a.targetPosition}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(a.createdAt)}
                        </Typography>
                      </Box>
                      <Chip
                        size="small"
                        label={hasScore ? `ATS ${score}` : 'ATS -'}
                        color={scoreColor}
                        variant={hasScore ? 'filled' : 'outlined'}
                      />
                    </Stack>
                    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 1.5 }}>
                      <Stack direction="row" spacing={0.8}>
                        <Chip size="small" variant="outlined" label={a.language === 'en' ? 'İngilizce' : 'Türkçe'} />
                        <Chip size="small" variant="outlined" label={a.style} sx={{ textTransform: 'capitalize' }} />
                      </Stack>
                      <Box>
                        <IconButton size="small" color="primary" component={RouterLink} to={`/app/${a.id}`} aria-label="Detay">
                          <VisibilityRoundedIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" color="error" onClick={() => setDeleteTarget(a)} aria-label="Sil">
                          <DeleteOutlineRoundedIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Stack>
                  </Paper>
                );
              })}
            </Stack>

            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '8px', display: { xs: 'none', md: 'block' }, overflow: 'hidden' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Pozisyon</TableCell>
                    <TableCell>Dil</TableCell>
                    <TableCell>Tarz</TableCell>
                    <TableCell align="center">ATS</TableCell>
                    <TableCell>Tarih</TableCell>
                    <TableCell align="right">İşlemler</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredApps.map((a) => {
                    const { hasScore, score, scoreColor } = getScoreMeta(a);
                    return (
                      <TableRow key={a.id} hover>
                        <TableCell sx={{ fontWeight: 800 }}>{a.targetPosition}</TableCell>
                        <TableCell>{a.language === 'en' ? 'İngilizce' : 'Türkçe'}</TableCell>
                        <TableCell sx={{ textTransform: 'capitalize' }}>{a.style}</TableCell>
                        <TableCell align="center">
                          <Chip size="small" label={hasScore ? score : '-'} color={scoreColor} variant={hasScore ? 'filled' : 'outlined'} />
                        </TableCell>
                        <TableCell sx={{ color: 'text.secondary' }}>{formatDate(a.createdAt)}</TableCell>
                        <TableCell align="right">
                          <Tooltip title="Detay">
                            <IconButton size="small" color="primary" component={RouterLink} to={`/app/${a.id}`}>
                              <VisibilityRoundedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Sil">
                            <IconButton size="small" color="error" onClick={() => setDeleteTarget(a)}>
                              <DeleteOutlineRoundedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}
      </Box>

      <Dialog open={Boolean(deleteTarget)} onClose={() => !deleting && setDeleteTarget(null)}>
        <DialogTitle>Başvuruyu sil</DialogTitle>
        <DialogContent>
          <DialogContentText>
            <strong>{deleteTarget?.targetPosition}</strong> başvurusunu silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
          </DialogContentText>
        </DialogContent>
        {deleting && <LinearProgress />}
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteTarget(null)} disabled={deleting}>
            Vazgeç
          </Button>
          <Button onClick={confirmDelete} color="error" variant="contained" disabled={deleting}>
            {deleting ? 'Siliniyor...' : 'Sil'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
