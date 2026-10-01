import { useNavigate } from 'react-router-dom';
import { Box, Container, Typography, Stack, Button } from '@mui/material';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import { brand } from '../theme/theme.js';

const { deep } = brand.landing;

export default function OceanUploadHero() {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        position: 'relative',
        minHeight: { xs: '92svh', md: '100svh' },
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden',
        color: '#fff',
        backgroundImage: 'url("/applyready-hero.jpg")',
        backgroundSize: 'cover',
        backgroundPosition: { xs: '62% center', md: 'center' },
      }}
    >
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          inset: 0,
          background: {
            xs: 'linear-gradient(90deg, rgba(6,10,18,0.82) 0%, rgba(6,10,18,0.58) 58%, rgba(6,10,18,0.18) 100%)',
            md: 'linear-gradient(90deg, rgba(6,10,18,0.78) 0%, rgba(6,10,18,0.50) 38%, rgba(6,10,18,0.08) 78%)',
          },
        }}
      />

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1, px: { xs: 2, md: 3 }, pt: { xs: 8, md: 10 } }}>
        <Stack spacing={2.4} sx={{ maxWidth: 560 }}>
          <Typography
            component="h1"
            sx={{
              fontWeight: 800,
              fontSize: { xs: 40, sm: 52, md: 66 },
              lineHeight: 1.04,
              color: '#fff',
              textShadow: '0 2px 22px rgba(0,0,0,0.34)',
            }}
          >
            İlanına özel başvuru paketi.
          </Typography>
          <Typography
            sx={{
              color: 'rgba(255,255,255,0.82)',
              fontSize: { xs: 16, md: 19 },
              lineHeight: 1.7,
              maxWidth: 520,
            }}
          >
            ApplyReady CV, ön yazı ve LinkedIn metinlerini ilana göre sade,
            düzenlenebilir ve indirilebilir şekilde hazırlar.
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <Button
              variant="contained"
              size="large"
              endIcon={<ArrowForwardRoundedIcon />}
              onClick={() => navigate('/app/new')}
              sx={{
                bgcolor: '#ffffff',
                color: deep,
                '&:hover': { bgcolor: '#f8fafc' },
              }}
            >
              Başla
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={() => document.querySelector('#templates')?.scrollIntoView({ behavior: 'smooth' })}
              sx={{
                borderColor: 'rgba(255,255,255,0.52)',
                color: '#fff',
                '&:hover': { borderColor: '#fff', bgcolor: 'rgba(255,255,255,0.08)' },
              }}
            >
              Şablonları gör
            </Button>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}
