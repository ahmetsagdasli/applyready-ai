import { Component } from 'react';
import { Box, Container, Typography, Button, Stack } from '@mui/material';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';

// Beklenmeyen render hatalarinda beyaz ekran yerine markali bir hata ekrani gosterir.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('Uncaught render error:', error, info);
  }

  handleReload = () => {
    window.location.href = '/';
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          background: 'linear-gradient(180deg, #0b0f17 0%, #111827 100%)',
        }}
      >
        <Container maxWidth="sm">
          <Stack spacing={2} alignItems="center" textAlign="center">
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'rgba(94,234,212,0.1)',
                color: '#5eead4',
              }}
            >
              <ErrorOutlineRoundedIcon sx={{ fontSize: 34 }} />
            </Box>
            <Typography variant="h5" fontWeight={800} sx={{ color: 'text.primary' }}>
              Bir şeyler ters gitti
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 400 }}>
              Beklenmeyen bir hata oluştu. Sayfayı yenileyerek kaldığınız yerden
              devam edebilirsiniz; sorun devam ederse bize ulaşın.
            </Typography>
            <Button variant="contained" size="large" onClick={this.handleReload}>
              Ana sayfaya dön
            </Button>
          </Stack>
        </Container>
      </Box>
    );
  }
}
