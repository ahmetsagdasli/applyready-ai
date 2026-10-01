import { Link as RouterLink } from 'react-router-dom';
import { Box, Container, Typography, Button, Stack } from '@mui/material';
import ExploreOffRoundedIcon from '@mui/icons-material/ExploreOffRounded';

export default function NotFound() {
  return (
    <Box
      sx={{
        flexGrow: 1,
        display: 'flex',
        alignItems: 'center',
        py: 6,
        background: 'linear-gradient(180deg, #0b0f17 0%, #111827 100%)',
      }}
    >
      <Container maxWidth="sm">
        <Stack spacing={2} alignItems="center" textAlign="center">
          <Box
            sx={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'rgba(94, 234, 212, 0.1)',
              color: 'primary.main',
            }}
          >
            <ExploreOffRoundedIcon sx={{ fontSize: 36 }} />
          </Box>
          <Typography
            variant="h1"
            sx={{ fontSize: { xs: 72, md: 96 }, lineHeight: 1, color: 'primary.main' }}
          >
            404
          </Typography>
          <Typography variant="h5">Sayfa bulunamadı</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 360 }}>
            Aradığınız sayfa taşınmış veya hiç var olmamış olabilir.
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ pt: 1 }}>
            <Button component={RouterLink} to="/" variant="contained" size="large">
              Ana sayfaya dön
            </Button>
            <Button component={RouterLink} to="/dashboard" variant="outlined" size="large">
              Dashboard
            </Button>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}
