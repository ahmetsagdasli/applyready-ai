import { Link as RouterLink } from 'react-router-dom';
import { Box, Container, Grid, Stack, Typography, Link, Divider } from '@mui/material';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import MailOutlineRoundedIcon from '@mui/icons-material/MailOutlineRounded';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';

const LINKS = [
  { label: 'Fiyatlandırma', to: '/pricing' },
  { label: 'Gizlilik Politikası', to: '/privacy' },
  { label: 'KVKK Aydınlatma Metni', to: '/kvkk' },
  { label: 'Kullanım Koşulları', to: '/terms' },
];

const contactSx = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 0.75,
  color: 'primary.main',
  fontWeight: 700,
  '&:hover': { color: 'primary.light' },
};

export default function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        mt: 'auto',
        py: { xs: 5, md: 6 },
        bgcolor: '#090d14',
        color: 'text.secondary',
        borderTop: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Container maxWidth="xl" sx={{ px: { xs: 2, md: 4 } }}>
        <Grid container spacing={4} justifyContent="space-between">
          <Grid item xs={12} md={6}>
            <Stack direction="row" spacing={1.1} alignItems="center">
              <Box
                sx={{
                  width: 34,
                  height: 34,
                  borderRadius: '8px',
                  display: 'grid',
                  placeItems: 'center',
                  color: '#061016',
                  background: 'linear-gradient(135deg, #5eead4 0%, #38bdf8 100%)',
                }}
              >
                <AutoAwesomeRoundedIcon sx={{ fontSize: 19 }} />
              </Box>
              <Typography variant="h6" fontWeight={800} sx={{ color: 'text.primary' }}>
                ApplyReady
              </Typography>
            </Stack>

            <Typography variant="body2" sx={{ mt: 1.5, maxWidth: 430, lineHeight: 1.75 }}>
              CV, ön yazı ve LinkedIn profil metinlerini tek başvuru çalışma alanında hazırlayan,
              ATS odaklı kariyer üretim sistemi.
            </Typography>
          </Grid>

          <Grid item xs={12} md="auto">
            <Stack spacing={1} sx={{ alignItems: { xs: 'flex-start', md: 'flex-end' } }}>
              {LINKS.map((l) => (
                <Link
                  key={l.to}
                  component={RouterLink}
                  to={l.to}
                  variant="body2"
                  underline="hover"
                  sx={{ color: 'text.secondary', fontWeight: 650, '&:hover': { color: 'text.primary' } }}
                >
                  {l.label}
                </Link>
              ))}
              <Stack direction="row" spacing={2} sx={{ mt: 1.2 }}>
                <Link href="mailto:ahmetssagdasli@gmail.com" variant="body2" underline="hover" sx={contactSx}>
                  <MailOutlineRoundedIcon sx={{ fontSize: 18 }} />
                  E-posta
                </Link>
                <Link
                  href="https://wa.me/905418629323"
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="body2"
                  underline="hover"
                  sx={contactSx}
                >
                  <WhatsAppIcon sx={{ fontSize: 18 }} />
                  WhatsApp
                </Link>
              </Stack>
            </Stack>
          </Grid>
        </Grid>

        <Divider sx={{ my: 3, borderColor: 'divider' }} />

        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          © 2026 ApplyReady. Tüm hakları saklıdır.
        </Typography>
      </Container>
    </Box>
  );
}
