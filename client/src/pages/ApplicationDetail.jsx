import { useEffect, useState, useCallback } from 'react';
import { useParams, Link as RouterLink, Navigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Paper,
  TextField,
  Button,
  Stack,
  Alert,
  Divider,
  Chip,
  CircularProgress,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import FileDownloadRoundedIcon from '@mui/icons-material/FileDownloadRounded';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded';
import MailOutlineRoundedIcon from '@mui/icons-material/MailOutlineRounded';

// Bölüm başlığı — ikon rozetli, marka dilinde.
function SectionTitle({ icon: Icon, children }) {
  return (
    <Stack direction="row" spacing={1.2} alignItems="center" sx={{ mb: 2 }}>
      <Box
        sx={{
          width: 34,
          height: 34,
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'rgba(94,234,212,0.1)',
          color: 'primary.main',
          flexShrink: 0,
        }}
      >
        <Icon sx={{ fontSize: 19 }} />
      </Box>
      <Typography variant="h6">{children}</Typography>
    </Stack>
  );
}

import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { getApplication, updateApplication } from '../api/applicationApi.js';
import LinkedInProfileView from '../components/LinkedInProfileView.jsx';
import { TemplateSelect } from '../components/TemplateSelect.jsx';
import ProfilePhotoUpload from '../components/ProfilePhotoUpload.jsx';
import { getStoredCvTemplate, templateLabel } from '../constants/cvTemplates.js';
import {
  exportCvPdf,
  exportCvDocx,
  exportCoverPdf,
  exportCoverDocx,
} from '../api/exportApi.js';
import { brand } from '../theme/theme.js';
import { getScoreColor } from '../utils/score.js';

export default function ApplicationDetail() {
  const { id } = useParams();
  const { user, loading: authLoading, getToken } = useAuth();
  const toast = useToast();

  const [app, setApp] = useState(null);
  const [editableCv, setEditableCv] = useState('');
  const [editableCover, setEditableCover] = useState('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');
  const [pdfTemplate, setPdfTemplate] = useState(() => getStoredCvTemplate());
  const [profilePhoto, setProfilePhoto] = useState(null);

  const load = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      const data = await getApplication(id, getToken());
      setApp(data);
      setEditableCv(data.editableCv || '');
      setEditableCover(data.editableCoverLetter || '');
    } catch (err) {
      setError(err.response?.data?.message || 'Başvuru yüklenirken hata oluştu.');
    } finally {
      setLoading(false);
    }
  }, [id, getToken]);

  useEffect(() => {
    if (user) load();
  }, [user, load]);

  async function handleSave() {
    setError('');
    setSaving(true);
    try {
      const updated = await updateApplication(
        id,
        { editableCv, editableCoverLetter: editableCover },
        getToken()
      );
      setApp(updated);
      toast.success('Değişiklikler kaydedildi.');
    } catch (err) {
      setError(err.response?.data?.message || 'Kaydetme başarısız.');
    } finally {
      setSaving(false);
    }
  }

  async function handleExport(exportFn, payload) {
    setExportError('');
    setExporting(true);
    try {
      await exportFn(payload);
      toast.success('Dosya indirildi.');
    } catch (err) {
      setExportError(err.message || 'İndirme sırasında hata oluştu.');
    } finally {
      setExporting(false);
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
        background:
          'linear-gradient(180deg, rgba(11,15,23,1) 0%, rgba(15,23,42,1) 45%, rgba(11,15,23,1) 100%)',
      }}
    >
      <Container maxWidth="lg" sx={{ px: { xs: 2, md: 4 } }}>
        <Button component={RouterLink} to="/dashboard" startIcon={<ArrowBackIcon />} sx={{ mb: 2 }}>
          Dashboard
        </Button>

        {loading ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : error && !app ? (
          <Alert severity="error">{error}</Alert>
        ) : app ? (
          <>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              justifyContent="space-between"
              alignItems={{ xs: 'flex-start', sm: 'center' }}
              spacing={2}
              sx={{ mb: 3 }}
            >
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="h3" gutterBottom sx={{ fontSize: { xs: 32, md: 44 } }}>
                  {app.targetPosition}
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  <Chip
                    label={`Dil: ${app.language === 'en' ? 'İngilizce' : 'Türkçe'}`}
                    size="small"
                    variant="outlined"
                  />
                  <Chip
                    label={`Tarz: ${app.style}`}
                    size="small"
                    variant="outlined"
                    sx={{ textTransform: 'capitalize' }}
                  />
                  <Chip
                    label={`ATS: ${app.atsScore ?? '-'}`}
                    color={getScoreColor(app.atsScore)}
                    variant={getScoreColor(app.atsScore) === 'default' ? 'outlined' : 'filled'}
                    size="small"
                  />
                </Stack>
              </Box>
              <Button
                variant="contained"
                startIcon={<SaveRoundedIcon />}
                disabled={saving}
                onClick={handleSave}
                sx={{ flexShrink: 0 }}
              >
                {saving ? 'Kaydediliyor...' : 'Kaydet'}
              </Button>
            </Stack>

            <LinkedInProfileView profile={app.linkedinProfile} title="LinkedIn Profil Önerileri" />

            <Divider sx={{ my: 4 }} />

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            {exportError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {exportError}
              </Alert>
            )}

            <Paper variant="outlined" sx={{ p: { xs: 2.5, md: 3 }, borderRadius: '8px', mb: 3, bgcolor: brand.surface }}>
              <SectionTitle icon={DescriptionRoundedIcon}>CV (düzenlenebilir)</SectionTitle>
              <TextField
                value={editableCv}
                onChange={(e) => setEditableCv(e.target.value)}
                multiline
                minRows={10}
                fullWidth
                sx={{ '& textarea': { fontSize: 14, lineHeight: 1.65 } }}
              />
              <Box sx={{ mt: 2 }}>
                <TemplateSelect value={pdfTemplate} onChange={setPdfTemplate} />
              </Box>
              <Box sx={{ mt: 2 }}>
                <ProfilePhotoUpload value={profilePhoto} onChange={setProfilePhoto} />
              </Box>
              <Stack direction="row" spacing={1.5} sx={{ mt: 2 }} flexWrap="wrap" useFlexGap>
                <Button
                  variant="outlined"
                  startIcon={<FileDownloadRoundedIcon />}
                  disabled={!editableCv.trim() || exporting}
                  onClick={() =>
                    handleExport(exportCvPdf, {
                      content: editableCv,
                      language: app.language,
                      title: app.tailoredCv?.title,
                      template: pdfTemplate,
                      profilePhoto,
                    })
                  }
                >
                  CV PDF İndir ({templateLabel(pdfTemplate)})
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<FileDownloadRoundedIcon />}
                  disabled={!editableCv.trim() || exporting}
                  onClick={() =>
                    handleExport(exportCvDocx, {
                      content: editableCv,
                      language: app.language,
                      title: app.tailoredCv?.title,
                      template: pdfTemplate,
                      profilePhoto,
                    })
                  }
                >
                  CV DOCX İndir ({templateLabel(pdfTemplate)})
                </Button>
              </Stack>
            </Paper>

            <Paper variant="outlined" sx={{ p: { xs: 2.5, md: 3 }, borderRadius: '8px', mb: 3, bgcolor: brand.surface }}>
              <SectionTitle icon={MailOutlineRoundedIcon}>Ön Yazı (düzenlenebilir)</SectionTitle>
              <TextField
                value={editableCover}
                onChange={(e) => setEditableCover(e.target.value)}
                multiline
                minRows={8}
                fullWidth
                sx={{ '& textarea': { fontSize: 14, lineHeight: 1.65 } }}
              />
              <Box sx={{ mt: 2 }}>
                <TemplateSelect value={pdfTemplate} onChange={setPdfTemplate} />
              </Box>
              <Stack direction="row" spacing={1.5} sx={{ mt: 2 }} flexWrap="wrap" useFlexGap>
                <Button
                  variant="outlined"
                  startIcon={<FileDownloadRoundedIcon />}
                  disabled={!editableCover.trim() || exporting}
                  onClick={() =>
                    handleExport(exportCoverPdf, {
                      content: editableCover,
                      language: app.language,
                      title: app.coverLetterResult?.subject,
                      template: pdfTemplate,
                    })
                  }
                >
                  Ön Yazı PDF İndir ({templateLabel(pdfTemplate)})
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<FileDownloadRoundedIcon />}
                  disabled={!editableCover.trim() || exporting}
                  onClick={() =>
                    handleExport(exportCoverDocx, {
                      content: editableCover,
                      language: app.language,
                      title: app.coverLetterResult?.subject,
                      template: pdfTemplate,
                    })
                  }
                >
                  Ön Yazı DOCX İndir ({templateLabel(pdfTemplate)})
                </Button>
              </Stack>
            </Paper>

            <Button
              variant="contained"
              size="large"
              fullWidth
              startIcon={<SaveRoundedIcon />}
              disabled={saving}
              onClick={handleSave}
            >
              {saving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
            </Button>
          </>
        ) : null}
      </Container>
    </Box>
  );
}
