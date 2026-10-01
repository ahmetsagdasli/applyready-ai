import { Box, Container, Paper, Typography, Stack, Chip } from '@mui/material';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import ShieldRoundedIcon from '@mui/icons-material/ShieldRounded';
import { brand } from '../theme/theme.js';

export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <Box
      sx={{
        flexGrow: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: { xs: 5, md: 8 },
        position: 'relative',
        overflow: 'hidden',
        background:
          'linear-gradient(135deg, rgba(11,15,23,1) 0%, rgba(15,23,42,1) 50%, rgba(28,25,23,1) 100%)',
      }}
    >
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          inset: 0,
          opacity: 0.28,
          backgroundImage:
            'linear-gradient(rgba(148,163,184,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.12) 1px, transparent 1px)',
          backgroundSize: '44px 44px',
          maskImage: 'linear-gradient(180deg, transparent 0%, #000 24%, #000 72%, transparent 100%)',
        }}
      />
      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
        <Stack alignItems="center" spacing={1.4} sx={{ mb: 3.5, textAlign: 'center' }}>
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: '8px',
              display: 'grid',
              placeItems: 'center',
              color: '#061016',
              background: 'linear-gradient(135deg, #5eead4 0%, #38bdf8 100%)',
              boxShadow: '0 18px 40px rgba(94,234,212,0.2)',
            }}
          >
            <AutoAwesomeRoundedIcon />
          </Box>
          <Chip
            icon={<ShieldRoundedIcon sx={{ fontSize: 16 }} />}
            label="Güvenli başvuru çalışma alanı"
            variant="outlined"
            sx={{ borderColor: 'rgba(94,234,212,0.28)', color: 'text.secondary' }}
          />
          <Typography variant="h4" component="h1" sx={{ color: 'text.primary' }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 420, lineHeight: 1.7 }}>
              {subtitle}
            </Typography>
          )}
        </Stack>

        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, sm: 4 },
            borderRadius: '8px',
            bgcolor: brand.glass,
            backdropFilter: 'blur(18px)',
            WebkitBackdropFilter: 'blur(18px)',
            border: `1px solid ${brand.glassBorder}`,
            boxShadow: brand.glassShadow,
          }}
        >
          {children}
        </Paper>

        {footer && (
          <Typography variant="body2" align="center" sx={{ mt: 3, color: 'text.secondary' }}>
            {footer}
          </Typography>
        )}
      </Container>
    </Box>
  );
}
