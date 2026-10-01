import { Link as RouterLink } from 'react-router-dom';
import { Box, Container, Paper, Typography, Button, Stack } from '@mui/material';
import ReplayRoundedIcon from '@mui/icons-material/ReplayRounded';

export default function BillingCancel() {
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
              bgcolor: 'rgba(94, 234, 212, 0.1)',
              color: 'primary.main',
            }}
          >
            <ReplayRoundedIcon sx={{ fontSize: 38 }} />
          </Box>
          <Typography variant="h4" gutterBottom>
            Ödeme iptal edildi
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3, maxWidth: 380, mx: 'auto' }}>
            Herhangi bir ücret alınmadı. Hazır olduğunuzda dilediğiniz zaman tekrar
            deneyebilirsiniz.
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="center">
            <Button component={RouterLink} to="/pricing" variant="contained" size="large">
              Fiyatlandırmaya Dön
            </Button>
            <Button component={RouterLink} to="/dashboard" variant="outlined" size="large">
              Dashboard'a Git
            </Button>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}
