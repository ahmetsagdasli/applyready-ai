import { Box, Container, Typography, Stack, Divider } from '@mui/material';

// Yasal metin sayfaları için ortak düzen: tutarlı başlık, "son güncelleme",
// numaralı bölümler ve okunabilir satır uzunluğu.
export default function LegalPage({ title, intro, updatedAt, sections = [] }) {
  return (
    <Box sx={{ py: { xs: 5, md: 7 }, bgcolor: 'background.default' }}>
      <Container maxWidth="md" sx={{ px: { xs: 2, md: 4 } }}>
        <Typography variant="h3" gutterBottom sx={{ fontSize: { xs: 32, md: 44 } }}>
          {title}
        </Typography>
        {updatedAt && (
          <Typography variant="caption" color="text.secondary">
            Son güncelleme: {updatedAt}
          </Typography>
        )}
        {intro && (
          <Typography variant="body1" color="text.secondary" sx={{ mt: 2, maxWidth: 720 }}>
            {intro}
          </Typography>
        )}

        <Divider sx={{ my: 4 }} />

        <Stack spacing={4} sx={{ maxWidth: 720 }}>
          {sections.map((s, i) => (
            <Box key={i} component="section">
              <Typography variant="h6" gutterBottom sx={{ color: 'primary.main' }}>
                {s.heading}
              </Typography>
              {(Array.isArray(s.body) ? s.body : [s.body]).map((p, j) => (
                <Typography
                  key={j}
                  variant="body2"
                  color="text.secondary"
                  sx={{ lineHeight: 1.75, mb: 1, whiteSpace: 'pre-line' }}
                >
                  {p}
                </Typography>
              ))}
            </Box>
          ))}
        </Stack>
      </Container>
    </Box>
  );
}
