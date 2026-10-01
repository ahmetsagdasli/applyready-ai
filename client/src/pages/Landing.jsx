import { useEffect, useRef, useState } from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Stack,
  Button,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import CloudUploadRoundedIcon from '@mui/icons-material/CloudUploadRounded';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import FileDownloadRoundedIcon from '@mui/icons-material/FileDownloadRounded';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import OceanUploadHero from '../components/OceanUploadHero.jsx';
import CvShowcase from '../components/CvShowcase.jsx';
import { brand } from '../theme/theme.js';

const { ink, muted, line, accent, paper, paperAlt, surface, deep, iconBg } = brand.landing;

function Reveal({ children, delay = 0, sx }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
      setShown(true);
      return undefined;
    }
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          obs.disconnect();
        }
      },
      { threshold: 0.12 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <Box
      ref={ref}
      sx={{
        opacity: shown ? 1 : 0,
        transform: shown ? 'none' : 'translateY(18px)',
        transition: `opacity .45s ease ${delay}s, transform .45s ease ${delay}s`,
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}

const steps = [
  {
    icon: CloudUploadRoundedIcon,
    title: 'Bilgileri ekle',
    text: 'CV’ni yükle veya metin olarak yapıştır. İş ilanını da aynı ekrana ekle.',
  },
  {
    icon: AutoAwesomeRoundedIcon,
    title: 'Paket hazırlansın',
    text: 'CV, ön yazı ve LinkedIn önerileri ilana göre sade biçimde oluşturulur.',
  },
  {
    icon: FileDownloadRoundedIcon,
    title: 'Kontrol et ve indir',
    text: 'Metinleri düzenle, ATS skorunu gör, PDF veya DOCX olarak indir.',
  },
];

function HowItWorks() {
  return (
    <Box id="how-it-works" sx={{ bgcolor: paper, borderTop: `1px solid ${line}`, scrollMarginTop: { xs: 64, md: 72 } }}>
      <Container maxWidth="lg" sx={{ py: { xs: 7, md: 9 }, px: { xs: 2, md: 3 } }}>
        <Stack spacing={1.2} sx={{ mb: { xs: 4, md: 5 }, maxWidth: 620 }}>
          <Typography sx={{ color: accent, fontWeight: 800, fontSize: 13 }}>
            Nasıl çalışır?
          </Typography>
          <Typography variant="h3" component="h2" sx={{ color: ink, fontSize: { xs: 30, md: 40 } }}>
            Üç sade adım
          </Typography>
        </Stack>

        <Grid container spacing={2.5}>
          {steps.map((step, index) => (
            <Grid item xs={12} md={4} key={step.title}>
              <Reveal delay={index * 0.06}>
                <Stack
                  spacing={1.5}
                  sx={{
                    height: '100%',
                    p: 2.5,
                    border: `1px solid ${line}`,
                    borderRadius: '8px',
                    bgcolor: surface,
                    boxShadow: '0 18px 42px rgba(20, 25, 34, 0.06)',
                  }}
                >
                  <Box
                    sx={{
                      width: 42,
                      height: 42,
                      borderRadius: '8px',
                      display: 'grid',
                      placeItems: 'center',
                      bgcolor: iconBg,
                      color: accent,
                    }}
                  >
                    <step.icon sx={{ fontSize: 22 }} />
                  </Box>
                  <Typography sx={{ color: ink, fontWeight: 800, fontSize: 18 }}>
                    {step.title}
                  </Typography>
                  <Typography sx={{ color: muted, lineHeight: 1.7 }}>
                    {step.text}
                  </Typography>
                </Stack>
              </Reveal>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}

const faqItems = [
  {
    q: 'Ücretsiz kullanabilir miyim?',
    a: 'Evet. Free planla her ay 3 başvuru paketi hazırlayabilirsin.',
  },
  {
    q: 'Hangi çıktıları alırım?',
    a: 'İlana göre CV, ön yazı ve LinkedIn profil önerileri hazırlanır. CV ve ön yazıyı PDF veya DOCX olarak indirebilirsin.',
  },
  {
    q: 'CV şablonları gerçek mi?',
    a: 'Evet. Şablon bölümündeki örneklerden birini seçip oluşturulan CV’ni aynı şablonda indirebilirsin.',
  },
];

function Faq() {
  return (
    <Box sx={{ bgcolor: paperAlt, borderTop: `1px solid ${line}` }}>
      <Container maxWidth="md" sx={{ py: { xs: 7, md: 8 }, px: { xs: 2, md: 3 } }}>
        <Stack spacing={1.2} sx={{ mb: 3 }}>
          <Typography sx={{ color: accent, fontWeight: 800, fontSize: 13 }}>
            Sık sorulanlar
          </Typography>
          <Typography variant="h3" component="h2" sx={{ color: ink, fontSize: { xs: 30, md: 38 } }}>
            Kısa cevaplar
          </Typography>
        </Stack>

        <Stack spacing={1}>
          {faqItems.map((item) => (
            <Accordion
              key={item.q}
              disableGutters
              elevation={0}
              sx={{
                bgcolor: surface,
                color: ink,
                border: `1px solid ${line}`,
                borderRadius: '8px !important',
                overflow: 'hidden',
                '&:before': { display: 'none' },
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreRoundedIcon sx={{ color: muted }} />}
                sx={{ px: 2.2, '& .MuiAccordionSummary-content': { my: 1.4 } }}
              >
                <Typography sx={{ color: ink, fontWeight: 800 }}>{item.q}</Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 2.2, pt: 0, pb: 2.2 }}>
                <Typography sx={{ color: muted, lineHeight: 1.7 }}>{item.a}</Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </Stack>
      </Container>
    </Box>
  );
}

function FinalCta() {
  return (
    <Box sx={{ bgcolor: deep, borderTop: '1px solid rgba(255,255,255,0.10)' }}>
      <Container maxWidth="md" sx={{ py: { xs: 7, md: 9 }, px: { xs: 2, md: 3 }, textAlign: 'center' }}>
        <Typography variant="h3" component="h2" sx={{ color: '#fff', fontSize: { xs: 32, md: 44 } }}>
          İlk başvurunu hazırlayalım.
        </Typography>
        <Typography sx={{ color: 'rgba(255,255,255,0.72)', mt: 1.5, mb: 3, lineHeight: 1.7 }}>
          CV ve ilan metnini ekle. ApplyReady sade, düzenlenebilir bir başvuru paketi oluştursun.
        </Typography>
        <Button
          component={RouterLink}
          to="/app/new"
          variant="contained"
          size="large"
          endIcon={<ArrowForwardRoundedIcon />}
          sx={{ bgcolor: '#fff', color: '#111827', '&:hover': { bgcolor: '#f8fafc' } }}
        >
          Başvuru Paketi Hazırla
        </Button>
      </Container>
    </Box>
  );
}

export default function Landing() {
  const location = useLocation();

  useEffect(() => {
    if (!location.hash) return;
    const el = document.querySelector(location.hash);
    if (el) {
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    }
  }, [location.hash, location.key]);

  return (
    <Box sx={{ bgcolor: paper }}>
      <OceanUploadHero />
      <HowItWorks />
      <CvShowcase />
      <Faq />
      <FinalCta />
    </Box>
  );
}
