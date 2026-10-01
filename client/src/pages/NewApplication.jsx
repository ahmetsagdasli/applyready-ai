import { useState, useEffect, useRef } from 'react';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  MenuItem,
  Button,
  Stack,
  Alert,
  Divider,
  Chip,
  List,
  ListItem,
  ListItemText,
  LinearProgress,
  Grid,
  Tabs,
  Tab,
} from '@mui/material';
import UploadFileRoundedIcon from '@mui/icons-material/UploadFileRounded';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import FileDownloadRoundedIcon from '@mui/icons-material/FileDownloadRounded';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import InsightsRoundedIcon from '@mui/icons-material/InsightsRounded';
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded';
import MailOutlineRoundedIcon from '@mui/icons-material/MailOutlineRounded';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import FactCheckRoundedIcon from '@mui/icons-material/FactCheckRounded';
import QuestionAnswerRoundedIcon from '@mui/icons-material/QuestionAnswerRounded';

import { createAnalyzedApplicationStream, refineApplication } from '../api/applicationApi.js';
import {
  exportCvPdf,
  exportCvDocx,
  exportCoverPdf,
  exportCoverDocx,
} from '../api/exportApi.js';
import { useAuth } from '../context/AuthContext.jsx';
import LinkedInProfileView from '../components/LinkedInProfileView.jsx';
import GapInterview from '../components/GapInterview.jsx';
import KeywordBreakdownTable from '../components/KeywordBreakdownTable.jsx';
import CvCurationPanel from '../components/CvCurationPanel.jsx';
import { TemplateSelect } from '../components/TemplateSelect.jsx';
import ProfilePhotoUpload from '../components/ProfilePhotoUpload.jsx';
import {
  getStoredCvTemplate,
  storeCvTemplate,
  templateLabel,
} from '../constants/cvTemplates.js';
import { composeCvText } from '../lib/composeCvText.js';
import {
  splitLanguagesFromSkills,
  splitSkillGroupsAndLanguages,
} from '../lib/humanLanguages.js';
import { brand } from '../theme/theme.js';
import { getScoreHex } from '../utils/score.js';

// Default editable CV metni: kurasyonlu (GPA gizli, dusuk relevance kisa).
function defaultCvText(data, language) {
  if (data?.tailoredCv) {
    const composed = composeCvText(data.tailoredCv, { language, showGpa: false });
    if (composed) return composed;
  }
  return data?.generatedCv || '';
}

const LANGUAGES = [
  { value: 'tr', label: 'Türkçe' },
  { value: 'en', label: 'İngilizce' },
];
const STYLES = [
  { value: 'sade', label: 'Sade' },
  { value: 'kurumsal', label: 'Kurumsal' },
  { value: 'yazilimci', label: 'Yazılımcı' },
];

const fmtText = (v) => (v && String(v).trim() ? String(v) : '-');
const fmtList = (arr) => (Array.isArray(arr) && arr.length ? arr.join(', ') : '-');

function Field({ label, value }) {
  return (
    <Grid item xs={12} sm={6}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
        {value}
      </Typography>
    </Grid>
  );
}

function tabId(index) {
  return `application-result-tab-${index}`;
}

function panelId(index) {
  return `application-result-panel-${index}`;
}

function tabA11yProps(index) {
  return {
    id: tabId(index),
    'aria-controls': panelId(index),
  };
}

function TabPanel({ value, index, children }) {
  return (
    <Box
      role="tabpanel"
      hidden={value !== index}
      id={panelId(index)}
      aria-labelledby={tabId(index)}
      sx={{ pt: value === index ? 3 : 0 }}
    >
      {value === index ? children : null}
    </Box>
  );
}

// Form bölümü — numaralı rozet + başlık + açıklama, altında girişler.
function FormSection({ step, title, description, children }) {
  return (
    <Box>
      <Stack direction="row" spacing={1.5} alignItems="center">
        <Box
          sx={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'primary.main',
            color: '#061016',
            fontSize: 14,
            fontWeight: 700,
          }}
        >
          {step}
        </Box>
        <Typography variant="h6">{title}</Typography>
      </Stack>
      {description && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, ml: { xs: 0, sm: '40px' } }}>
          {description}
        </Typography>
      )}
      <Box sx={{ mt: 2, ml: { xs: 0, sm: '40px' } }}>{children}</Box>
    </Box>
  );
}

// ATS skor halkası — Dashboard/landing ile aynı eşik renkleri.
function ScoreRing({ score }) {
  const n = Math.max(0, Math.min(100, Number(score) || 0));
  const color = getScoreHex(score);
  const R = 54;
  const CIRC = 2 * Math.PI * R;
  return (
    <Box sx={{ position: 'relative', width: 136, height: 136, mx: 'auto' }}>
      <svg viewBox="0 0 136 136" width="136" height="136">
        <circle cx="68" cy="68" r={R} fill="none" stroke="rgba(148,163,184,0.18)" strokeWidth="12" />
        <circle
          cx="68" cy="68" r={R} fill="none"
          stroke={color} strokeWidth="12" strokeLinecap="round"
          strokeDasharray={`${CIRC * (n / 100)} ${CIRC}`}
          transform="rotate(-90 68 68)"
          style={{ transition: 'stroke-dasharray .8s ease' }}
        />
      </svg>
      <Box sx={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <Typography sx={{ fontWeight: 800, fontSize: 40, lineHeight: 1, color }}>
          {fmtText(score)}
        </Typography>
        <Typography sx={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', color: 'text.secondary' }}>
          / 100
        </Typography>
      </Box>
    </Box>
  );
}

function QualityChip({ check }) {
  if (!check) return null;
  return check.passed ? (
    <Chip icon={<CheckCircleRoundedIcon />} color="success" variant="outlined" size="small" label="Kontrolden geçti" />
  ) : (
    <Chip icon={<WarningAmberRoundedIcon />} color="warning" variant="outlined" size="small" label="Gözden geçirilmeli" />
  );
}

// Misafirin emeği login/kayıt yolculuğunda kaybolmasın: form + sonuç bu anahtarla
// sessionStorage'a yazılır, dönüşte geri yüklenir. (Dosya nesnesi taşınamaz;
// PDF'ten gelen içerik zaten sonuçtaki parsedCv içinde yaşar.)
const PENDING_KEY = 'applyready:pending-analysis';

function savePendingState(state) {
  try {
    sessionStorage.setItem(PENDING_KEY, JSON.stringify(state));
  } catch {
    /* quota vb. — sessizce vazgeç, akış bozulmasın */
  }
}

function loadPendingState() {
  try {
    const raw = sessionStorage.getItem(PENDING_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function NewApplication() {
  const { user, getToken } = useAuth();
  const navigate = useNavigate();

  const [cvFile, setCvFile] = useState(null);
  const [cvText, setCvText] = useState('');
  const [jobText, setJobText] = useState('');
  const [targetPosition, setTargetPosition] = useState('');
  const [language, setLanguage] = useState('tr');
  const [style, setStyle] = useState('sade');

  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(null); // { step, total, label }
  const [error, setError] = useState('');
  const [limitReached, setLimitReached] = useState(false);
  const [result, setResult] = useState(null);
  const [tab, setTab] = useState(0);

  const [editableCv, setEditableCv] = useState('');
  const [editableCover, setEditableCover] = useState('');
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');
  const [refineLoading, setRefineLoading] = useState(false);
  const [refineError, setRefineError] = useState('');
  const [refined, setRefined] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [pdfTemplate, setPdfTemplate] = useState(() => getStoredCvTemplate());
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [restored, setRestored] = useState(false);

  // Misafir, sonucu kaybetmeden giriş/kayıt sayfasına geçsin.
  function persistAndGo(path) {
    savePendingState({
      cvText,
      jobText,
      targetPosition,
      language,
      style,
      result,
      editableCv,
      editableCover,
      refined,
      pdfTemplate,
      profilePhoto,
    });
    navigate(path, { state: { next: '/app/new' } });
  }

  async function handleExport(exportFn, payload) {
    setExportError('');
    setExporting(true);
    try {
      await exportFn(payload);
    } catch (err) {
      setExportError(err.message || 'İndirme sırasında bir hata oluştu.');
    } finally {
      setExporting(false);
    }
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0] || null;
    if (file && file.type !== 'application/pdf') {
      setError('Sadece PDF dosyası yükleyebilirsiniz.');
      setCvFile(null);
      e.target.value = '';
      return;
    }
    setError('');
    setCvFile(file);
  }

  function validate() {
    if (!jobText.trim()) return 'İş ilanı metni zorunludur.';
    if (!targetPosition.trim()) return 'Hedef pozisyon zorunludur.';
    if (!cvText.trim() && !cvFile) return 'CV metni girin veya bir PDF dosyası yükleyin.';
    return '';
  }

  // Analiz cekirdegi — hem form gonderiminden hem landing'den gelen state'ten cagrilir.
  async function runAnalyze(values) {
    const v = {
      cvText: values.cvText || '',
      cvFile: values.cvFile || null,
      jobText: values.jobText || '',
      targetPosition: values.targetPosition || '',
      language: values.language || 'tr',
      style: values.style || 'sade',
    };
    setError('');
    setLimitReached(false);

    const formData = new FormData();
    formData.append('cvText', v.cvText);
    formData.append('jobText', v.jobText);
    formData.append('targetPosition', v.targetPosition);
    formData.append('language', v.language);
    formData.append('style', v.style);
    if (v.cvFile) formData.append('cvFile', v.cvFile);

    setLoading(true);
    setProgress(null);
    try {
      const data = await createAnalyzedApplicationStream(formData, getToken(), (p) =>
        setProgress(p)
      );
      setResult(data);
      setEditableCv(defaultCvText(data, v.language));
      setEditableCover(data.coverLetter || '');
      setRefined(false);
      setRefineError('');
      setTab(0);
    } catch (err) {
      let message =
        err.response?.data?.message || 'İşlem sırasında bir hata oluştu. Lütfen tekrar deneyin.';
      if (err.response?.data?.code === 'USAGE_LIMIT_REACHED') {
        message = 'Aylık hakkınız doldu.';
        setLimitReached(true);
      }
      setError(message);
    } finally {
      setLoading(false);
      setProgress(null);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    await runAnalyze({ cvText, cvFile, jobText, targetPosition, language, style });
  }

  // Landing'deki okyanus yükleme kartından gelen verilerle önden doldur + (uygunsa) otomatik başlat.
  const location = useLocation();
  const autoStartedRef = useRef(false);
  useEffect(() => {
    const st = location.state;
    if (!st || autoStartedRef.current) return;
    autoStartedRef.current = true;
    if (st.jobText) setJobText(st.jobText);
    if (st.targetPosition) setTargetPosition(st.targetPosition);
    if (st.language) setLanguage(st.language);
    if (st.style) setStyle(st.style);
    if (st.cvTemplate) setPdfTemplate(storeCvTemplate(st.cvTemplate));
    if (st.cvFile) setCvFile(st.cvFile);
    if (st.cvText) setCvText(st.cvText);
    if (st.autostart && st.jobText && st.targetPosition && (st.cvFile || st.cvText)) {
      runAnalyze({
        cvText: st.cvText,
        cvFile: st.cvFile,
        jobText: st.jobText,
        targetPosition: st.targetPosition,
        language: st.language,
        style: st.style,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  // Giriş/kayıt yolculuğundan dönen misafirin form + sonucunu geri yükle.
  useEffect(() => {
    if (location.state || autoStartedRef.current) return;
    const pending = loadPendingState();
    if (!pending) return;
    autoStartedRef.current = true;
    sessionStorage.removeItem(PENDING_KEY);
    if (pending.cvText) setCvText(pending.cvText);
    if (pending.jobText) setJobText(pending.jobText);
    if (pending.targetPosition) setTargetPosition(pending.targetPosition);
    if (pending.language) setLanguage(pending.language);
    if (pending.style) setStyle(pending.style);
    if (pending.pdfTemplate) setPdfTemplate(storeCvTemplate(pending.pdfTemplate));
    if (pending.profilePhoto) setProfilePhoto(pending.profilePhoto);
    if (pending.result) {
      setResult(pending.result);
      setEditableCv(pending.editableCv || '');
      setEditableCover(pending.editableCover || '');
      setRefined(Boolean(pending.refined));
    }
    setRestored(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  async function handleRefine(answers) {
    if (!result) return;
    setRefineError('');
    setRefineLoading(true);
    try {
      // Kayitli (authed) basvuruda agir AI durumunu tekrar gondermeye gerek yok;
      // sunucu applicationId ile DB'den okur. Sadece guest akista tam state gider.
      const hasServerState = Boolean(user && result.applicationId);
      const payload = hasServerState
        ? { applicationId: result.applicationId, gapAnswers: answers }
        : {
            parsedCv: result.parsedCv,
            jobAnalysis: result.jobAnalysis,
            targetPosition,
            language,
            style,
            gapAnswers: answers,
          };
      const data = await refineApplication(payload, getToken());
      setResult((prev) => ({ ...prev, ...data }));
      setEditableCv(defaultCvText(data, language));
      setEditableCover(data.coverLetter || '');
      setRefined(true);
      setTab(1);
    } catch (err) {
      setRefineError(
        err.response?.data?.message || 'Güçlendirme sırasında bir hata oluştu.'
      );
    } finally {
      setRefineLoading(false);
    }
  }

  const parsedCv = result?.parsedCv;
  const jobAnalysis = result?.jobAnalysis;
  const matchResult = result?.matchResult;
  const gapQuestions = result?.gapQuestions || [];
  const GAP_TAB_INDEX = 5;
  const tailoredCv = result?.tailoredCv;
  const coverLetterResult = result?.coverLetterResult;
  const linkedinProfile = result?.linkedinProfile;
  const qualityChecks = result?.qualityChecks;
  const tailoredSkillData = splitSkillGroupsAndLanguages(
    tailoredCv?.skills,
    tailoredCv?.languages
  );
  const parsedSkillData = splitLanguagesFromSkills(
    parsedCv?.skills,
    parsedCv?.languages
  );
  const projectNames =
    Array.isArray(parsedCv?.projects) && parsedCv.projects.length
      ? parsedCv.projects.map((p) => p?.name).filter(Boolean).join(', ')
      : '';

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
        <Button component={RouterLink} to="/" startIcon={<ArrowBackRoundedIcon />} sx={{ mb: 2 }}>
          Ana sayfa
        </Button>

        <Typography variant="h3" component="h1" gutterBottom sx={{ fontSize: { xs: 32, md: 44 } }}>
          Başvuru Paketi Hazırla
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 720, lineHeight: 1.7 }}>
          CV’nizi ve hedef iş ilanını girin; CV, ön yazı ve LinkedIn önerilerinizi
          birlikte hazırlayalım.
        </Typography>

        <Paper
          variant="outlined"
          component="form"
          onSubmit={handleSubmit}
          sx={{
            p: { xs: 2.5, md: 4 },
            borderRadius: '8px',
            bgcolor: brand.glass,
            backdropFilter: 'blur(18px)',
            WebkitBackdropFilter: 'blur(18px)',
          }}
        >
          <Stack spacing={3} divider={<Divider flexItem />}>
            <FormSection
              step={1}
              title="CV"
              description="Hazır CV’niz varsa PDF yükleyin; yoksa kendinizden bahsederek metni yazın. PDF veya metinden en az biri yeterli."
            >
              <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2, flexWrap: 'wrap', gap: 1 }}>
                <Button variant="outlined" component="label" startIcon={<UploadFileRoundedIcon />}>
                  PDF Seç
                  <input type="file" accept="application/pdf,.pdf" hidden onChange={handleFileChange} />
                </Button>
                {cvFile && <Chip label={cvFile.name} onDelete={() => setCvFile(null)} />}
              </Stack>
              <TextField
                label="CV metni / kendinizden bahsedin (opsiyonel)"
                value={cvText}
                onChange={(e) => setCvText(e.target.value)}
                multiline
                minRows={5}
                fullWidth
              />
              {cvFile && cvText.trim() && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  Metin girildiği için analizde yazdığınız metin kullanılacak.
                </Alert>
              )}
            </FormSection>

            <FormSection
              step={2}
              title="İş İlanı"
              description="Başvurduğunuz ilanın metnini ve hedef pozisyonu girin."
            >
              <Stack spacing={2}>
                <TextField
                  label="İş ilanı metni"
                  value={jobText}
                  onChange={(e) => setJobText(e.target.value)}
                  multiline
                  minRows={6}
                  fullWidth
                  required
                />
                <TextField
                  label="Hedef pozisyon"
                  value={targetPosition}
                  onChange={(e) => setTargetPosition(e.target.value)}
                  fullWidth
                  required
                />
              </Stack>
            </FormSection>

            <FormSection step={3} title="Tercihler" description="Çıktının dilini ve CV tarzını seçin.">
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField select label="Dil" value={language} onChange={(e) => setLanguage(e.target.value)} fullWidth>
                  {LANGUAGES.map((o) => (
                    <MenuItem key={o.value} value={o.value}>
                      {o.label}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField select label="CV tarzı" value={style} onChange={(e) => setStyle(e.target.value)} fullWidth>
                  {STYLES.map((o) => (
                    <MenuItem key={o.value} value={o.value}>
                      {o.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Stack>
              <Box sx={{ mt: 2 }}>
                <ProfilePhotoUpload value={profilePhoto} onChange={setProfilePhoto} />
              </Box>
            </FormSection>

            <Box>
              {error && (
                <Alert
                  severity={limitReached ? 'warning' : 'error'}
                  sx={{ mb: 2 }}
                  action={
                    limitReached ? (
                      <Button color="inherit" size="small" component={RouterLink} to="/pricing">
                        Pro plana geç
                      </Button>
                    ) : null
                  }
                >
                  {error}
                </Alert>
              )}
              <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                disabled={loading}
                startIcon={<AutoAwesomeRoundedIcon />}
              >
                {loading ? 'Hazırlanıyor...' : 'Başvuru Paketimi Hazırla'}
              </Button>
              {loading && (
                <Box
                  sx={{
                    mt: 2.5,
                    p: 2.5,
                    borderRadius: '8px',
                    bgcolor: 'rgba(94,234,212,0.06)',
                    border: '1px solid rgba(94,234,212,0.16)',
                  }}
                >
                  <Stack direction="row" justifyContent="space-between" alignItems="baseline" sx={{ mb: 1.2 }}>
                    <Typography variant="body2" sx={{ fontWeight: 800, color: 'primary.main' }}>
                      {progress ? progress.label : 'Başlatılıyor…'}
                    </Typography>
                    {progress && (
                      <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0, ml: 2 }}>
                        Adım {progress.step}/{progress.total}
                      </Typography>
                    )}
                  </Stack>
                  <LinearProgress
                    variant={progress ? 'determinate' : 'indeterminate'}
                    value={progress ? Math.round((progress.step / progress.total) * 100) : undefined}
                    sx={{ height: 8, borderRadius: 5 }}
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    CV'niz ilana göre yeniden yazılıyor — genellikle 30–40 saniye sürer, sayfadan ayrılmayın.
                  </Typography>
                </Box>
              )}
            </Box>
          </Stack>
        </Paper>

        {result && (
          <Box sx={{ mt: 4 }}>
            {user && result.usage && (
              <Alert severity="info" sx={{ mb: 2 }}>
                {result.usage.monthlyLimit === null
                  ? `Plan: ${result.usage.plan} (sınırsız).`
                  : `Kalan hakkınız: ${result.usage.remaining} / ${result.usage.monthlyLimit}`}
              </Alert>
            )}

            {user && result.applicationId ? (
              <Alert severity="success" sx={{ mb: 2 }}>
                Başvuru kaydedildi. Dashboard’dan tekrar açabilirsiniz.
              </Alert>
            ) : user && result.saveError ? (
              <Alert severity="warning" sx={{ mb: 2 }}>
                {result.saveError}
              </Alert>
            ) : user && restored ? (
              <Alert severity="success" sx={{ mb: 2 }}>
                Tekrar hoş geldiniz — giriş öncesi hazırladığınız sonuçlar geri yüklendi.
                Düzenleyip dışa aktarabilirsiniz; bu sonuç geçmişinize kaydedilmedi.
              </Alert>
            ) : (
              !user && (
                <Alert
                  severity="info"
                  sx={{ mb: 2 }}
                  action={
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Button color="inherit" size="small" onClick={() => persistAndGo('/login')}>
                        Giriş Yap
                      </Button>
                      <Button color="inherit" size="small" variant="outlined" onClick={() => persistAndGo('/register')}>
                        Kayıt Ol
                      </Button>
                    </Stack>
                  }
                >
                  Giriş yapmadan hazırladınız. Buradan giriş yapar veya kayıt olursanız
                  sonuçlarınız kaybolmaz; kaldığınız yerden devam edersiniz.
                </Alert>
              )
            )}

            {refined && (
              <Alert severity="success" sx={{ mb: 2 }}>
                CV’niz verdiğiniz cevaplarla güçlendirildi. Güncel skor ve içerik
                aşağıda.
              </Alert>
            )}

            {gapQuestions.length > 0 && (
              <Alert
                severity="info"
                sx={{ mb: 2 }}
                action={
                  <Button color="inherit" size="small" onClick={() => setTab(GAP_TAB_INDEX)}>
                    Eksikleri Tamamla
                  </Button>
                }
              >
                İlanda istenen {gapQuestions.length} beceri CV’nizde net görünmüyor.
                Gerçekten varsa ekleyelim — uydurmadan, sizin cevaplarınızla.
              </Alert>
            )}

            <Paper variant="outlined" sx={{ borderRadius: '8px', overflow: 'hidden', bgcolor: brand.surface }}>
              <Tabs
                value={tab}
                onChange={(e, v) => setTab(v)}
                variant="scrollable"
                scrollButtons="auto"
                aria-label="Başvuru sonucu bölümleri"
                sx={{
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  px: 1,
                  bgcolor: 'rgba(255,255,255,0.035)',
                  '& .MuiTab-root': { minHeight: 56, fontWeight: 600 },
                }}
              >
                <Tab icon={<InsightsRoundedIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Özet" {...tabA11yProps(0)} />
                <Tab icon={<DescriptionRoundedIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="CV" {...tabA11yProps(1)} />
                <Tab icon={<MailOutlineRoundedIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Ön Yazı" {...tabA11yProps(2)} />
                <Tab icon={<LinkedInIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="LinkedIn" {...tabA11yProps(3)} />
                <Tab icon={<FactCheckRoundedIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Detaylar" {...tabA11yProps(4)} />
                {gapQuestions.length > 0 && (
                  <Tab
                    icon={<QuestionAnswerRoundedIcon sx={{ fontSize: 18 }} />}
                    iconPosition="start"
                    label={`Eksikleri Tamamla (${gapQuestions.length})`}
                    {...tabA11yProps(GAP_TAB_INDEX)}
                  />
                )}
              </Tabs>

              <Box sx={{ p: { xs: 2.5, md: 3 } }}>
                <TabPanel value={tab} index={0}>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={4}>
                      <Paper
                        variant="outlined"
                        onClick={() => setShowBreakdown((v) => !v)}
                        sx={{
                          p: 3,
                          borderRadius: '8px',
                          textAlign: 'center',
                          cursor: 'pointer',
                          transition: 'border-color .2s',
                          '&:hover': { borderColor: 'primary.main' },
                        }}
                      >
                        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5 }}>
                          ATS Uyum Skoru
                        </Typography>
                        <ScoreRing score={result.atsScore} />
                        <Typography variant="caption" color="primary" sx={{ mt: 1.5, display: 'block', fontWeight: 600 }}>
                          {showBreakdown ? 'Detayı gizle ▲' : 'Neden bu skor? Detay ▼'}
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} sm={8}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Eksik anahtar kelimeler
                      </Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
                        {(result.missingKeywords || []).map((kw) => (
                          <Chip key={kw} label={kw} color="warning" variant="outlined" size="small" />
                        ))}
                      </Stack>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Eşleşen anahtar kelimeler
                      </Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        {(matchResult?.matchedKeywords || []).map((kw) => (
                          <Chip key={kw} label={kw} color="success" variant="outlined" size="small" />
                        ))}
                      </Stack>
                    </Grid>

                    {showBreakdown && (
                      <Grid item xs={12}>
                        <Divider sx={{ mb: 2 }} />
                        <Typography variant="subtitle1" gutterBottom>
                          Keyword eşleştirme detayı
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                          Her ilan keyword’ünün durumu. Sarı olanlar “Eklenebilir” —
                          gerçekten varsa “Ekle” ile cevaplarınızı girip CV’ye işleyebiliriz.
                        </Typography>
                        <KeywordBreakdownTable
                          breakdown={matchResult?.keywordBreakdown}
                          onFill={() => setTab(GAP_TAB_INDEX)}
                        />
                      </Grid>
                    )}

                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle1" gutterBottom>
                        Güçlü yönler
                      </Typography>
                      <List dense>
                        {(result.strengths || []).map((s, i) => (
                          <ListItem key={i} disableGutters sx={{ py: 0.2 }}>
                            <CheckCircleRoundedIcon color="success" sx={{ fontSize: 18, mr: 1 }} />
                            <ListItemText primary={s} />
                          </ListItem>
                        ))}
                      </List>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle1" gutterBottom>
                        Geliştirilecek alanlar
                      </Typography>
                      <List dense>
                        {(result.weaknesses || []).map((w, i) => (
                          <ListItem key={i} disableGutters sx={{ py: 0.2 }}>
                            <WarningAmberRoundedIcon color="warning" sx={{ fontSize: 18, mr: 1 }} />
                            <ListItemText primary={w} />
                          </ListItem>
                        ))}
                      </List>
                    </Grid>

                    {matchResult?.recommendations?.length > 0 && (
                      <Grid item xs={12}>
                        <Typography variant="subtitle1" gutterBottom>
                          Öneriler
                        </Typography>
                        <List dense>
                          {matchResult.recommendations.map((r, i) => (
                            <ListItem key={i} disableGutters sx={{ py: 0.2 }}>
                              <ListItemText primary={`• ${r}`} />
                            </ListItem>
                          ))}
                        </List>
                      </Grid>
                    )}

                    {qualityChecks && (
                      <Grid item xs={12}>
                        <Divider sx={{ mb: 2 }} />
                        <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap alignItems="center">
                          <Typography variant="body2" color="text.secondary">
                            Kalite kontrolü:
                          </Typography>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Typography variant="caption" color="text.secondary">CV</Typography>
                            <QualityChip check={qualityChecks.tailoredCv} />
                          </Stack>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Typography variant="caption" color="text.secondary">Ön Yazı</Typography>
                            <QualityChip check={qualityChecks.coverLetter} />
                          </Stack>
                        </Stack>
                      </Grid>
                    )}
                  </Grid>
                </TabPanel>

                <TabPanel value={tab} index={1}>
                  {tailoredCv && (
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="h6">{fmtText(tailoredCv.title)}</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap', mb: 2 }}>
                        {fmtText(tailoredCv.professionalSummary)}
                      </Typography>
                      <Grid container spacing={2}>
                        <Field label="Öne çıkan beceriler" value={fmtList(tailoredSkillData.skills.highlighted)} />
                        <Field label="Teknik beceriler" value={fmtList(tailoredSkillData.skills.technical)} />
                        <Field label="Diller" value={fmtList(tailoredSkillData.languages)} />
                      </Grid>

                      {Array.isArray(tailoredCv.experience) && tailoredCv.experience.length > 0 && (
                        <>
                          <Divider sx={{ my: 2 }} />
                          <Typography variant="subtitle2" gutterBottom>Deneyim</Typography>
                          {tailoredCv.experience.map((exp, i) => (
                            <Box key={i} sx={{ mb: 1.5 }}>
                              <Typography variant="body2" fontWeight={600}>
                                {fmtText(exp.title)} — {fmtText(exp.company)} {exp.period ? `(${exp.period})` : ''}
                              </Typography>
                              <List dense disablePadding>
                                {(exp.bullets || []).map((b, j) => (
                                  <ListItem key={j} disableGutters sx={{ py: 0 }}>
                                    <ListItemText primary={`• ${b}`} />
                                  </ListItem>
                                ))}
                              </List>
                            </Box>
                          ))}
                        </>
                      )}

                      {Array.isArray(tailoredCv.education) && tailoredCv.education.length > 0 && (
                        <>
                          <Divider sx={{ my: 2 }} />
                          <Typography variant="subtitle2" gutterBottom>Eğitim</Typography>
                          {tailoredCv.education.map((ed, i) => (
                            <Typography key={i} variant="body2">
                              {fmtText(ed.degree)} {ed.field ? `- ${ed.field}` : ''} / {fmtText(ed.school)}{' '}
                              {ed.period ? `(${ed.period})` : ''}
                            </Typography>
                          ))}
                        </>
                      )}
                    </Box>
                  )}

                  <Divider sx={{ my: 2 }} />
                  <CvCurationPanel
                    tailoredCv={tailoredCv}
                    language={language}
                    onApply={(text) => setEditableCv(text)}
                  />
                  <Typography variant="subtitle1" gutterBottom>
                    Üretilen CV (düzenlenebilir)
                  </Typography>
                  <TextField value={editableCv} onChange={(e) => setEditableCv(e.target.value)} multiline minRows={12} fullWidth />

                  <Box sx={{ mt: 2 }}>
                    <TemplateSelect value={pdfTemplate} onChange={setPdfTemplate} />
                  </Box>
                  <Box sx={{ mt: 2 }}>
                    <ProfilePhotoUpload value={profilePhoto} onChange={setProfilePhoto} />
                  </Box>

                  <Stack direction="row" spacing={2} sx={{ mt: 1.5 }} flexWrap="wrap" useFlexGap>
                    <Button
                      variant="contained"
                      startIcon={<FileDownloadRoundedIcon />}
                      disabled={!editableCv.trim() || exporting}
                      onClick={() => handleExport(exportCvPdf, { content: editableCv, language, title: tailoredCv?.title, template: pdfTemplate, profilePhoto })}
                    >
                      PDF İndir ({templateLabel(pdfTemplate)})
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<FileDownloadRoundedIcon />}
                      disabled={!editableCv.trim() || exporting}
                      onClick={() => handleExport(exportCvDocx, { content: editableCv, language, title: tailoredCv?.title, template: pdfTemplate, profilePhoto })}
                    >
                      DOCX İndir ({templateLabel(pdfTemplate)})
                    </Button>
                  </Stack>
                </TabPanel>

                <TabPanel value={tab} index={2}>
                  {coverLetterResult && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Konu
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        {fmtText(coverLetterResult.subject)}
                      </Typography>
                    </Box>
                  )}
                  <Typography variant="subtitle1" gutterBottom>
                    Ön Yazı (düzenlenebilir)
                  </Typography>
                  <TextField value={editableCover} onChange={(e) => setEditableCover(e.target.value)} multiline minRows={12} fullWidth />

                  <Box sx={{ mt: 2 }}>
                    <TemplateSelect value={pdfTemplate} onChange={setPdfTemplate} />
                  </Box>

                  <Stack direction="row" spacing={2} sx={{ mt: 1.5 }} flexWrap="wrap" useFlexGap>
                    <Button
                      variant="contained"
                      startIcon={<FileDownloadRoundedIcon />}
                      disabled={!editableCover.trim() || exporting}
                      onClick={() => handleExport(exportCoverPdf, { content: editableCover, language, title: coverLetterResult?.subject, template: pdfTemplate })}
                    >
                      PDF İndir ({templateLabel(pdfTemplate)})
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<FileDownloadRoundedIcon />}
                      disabled={!editableCover.trim() || exporting}
                      onClick={() => handleExport(exportCoverDocx, { content: editableCover, language, title: coverLetterResult?.subject, template: pdfTemplate })}
                    >
                      DOCX İndir ({templateLabel(pdfTemplate)})
                    </Button>
                  </Stack>
                </TabPanel>

                <TabPanel value={tab} index={3}>
                  {linkedinProfile ? (
                    <LinkedInProfileView profile={linkedinProfile} />
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      LinkedIn önerisi bulunamadı.
                    </Typography>
                  )}
                </TabPanel>

                <TabPanel value={tab} index={4}>
                  {parsedCv && (
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle1" gutterBottom>
                        CV’den çıkarılan bilgiler
                      </Typography>
                      <Grid container spacing={2}>
                        <Field label="Ad Soyad" value={fmtText(parsedCv.name)} />
                        <Field label="E-posta" value={fmtText(parsedCv.contact?.email)} />
                        <Field label="Telefon" value={fmtText(parsedCv.contact?.phone)} />
                        <Field label="Lokasyon" value={fmtText(parsedCv.contact?.location)} />
                        <Field label="Deneyim sayısı" value={fmtText(parsedCv.experience?.length ?? 0)} />
                        <Field label="Eğitim sayısı" value={fmtText(parsedCv.education?.length ?? 0)} />
                        <Field label="Beceriler" value={fmtList(parsedSkillData.skills)} />
                        <Field label="Diller" value={fmtList(parsedSkillData.languages)} />
                        <Field label="Projeler" value={fmtText(projectNames)} />
                      </Grid>
                    </Box>
                  )}
                  {jobAnalysis && (
                    <Box>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="subtitle1" gutterBottom>
                        İş ilanı analizi
                      </Typography>
                      <Grid container spacing={2}>
                        <Field label="Tespit edilen pozisyon" value={fmtText(jobAnalysis.detectedJobTitle)} />
                        <Field label="Şirket" value={fmtText(jobAnalysis.company)} />
                        <Field label="Lokasyon" value={fmtText(jobAnalysis.location)} />
                        <Field label="Çalışma şekli" value={fmtText(jobAnalysis.workMode)} />
                        <Field label="Kıdem seviyesi" value={fmtText(jobAnalysis.seniority)} />
                        <Field label="Sektör" value={fmtText(jobAnalysis.industry)} />
                        <Field label="Zorunlu beceriler" value={fmtList(jobAnalysis.requiredSkills)} />
                        <Field label="ATS anahtar kelimeleri" value={fmtList(jobAnalysis.atsKeywords)} />
                      </Grid>
                    </Box>
                  )}
                </TabPanel>

                <TabPanel value={tab} index={GAP_TAB_INDEX}>
                  <GapInterview
                    questions={gapQuestions}
                    onSubmit={handleRefine}
                    loading={refineLoading}
                    error={refineError}
                  />
                </TabPanel>
              </Box>
            </Paper>

            {exportError && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {exportError}
              </Alert>
            )}
            {exporting && <LinearProgress sx={{ mt: 1 }} />}
          </Box>
        )}
      </Container>
    </Box>
  );
}
