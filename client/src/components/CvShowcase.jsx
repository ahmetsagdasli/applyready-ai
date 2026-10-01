import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, Button, Container, Typography, Grid, Stack, Paper } from '@mui/material';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import { brand } from '../theme/theme.js';
import {
  CV_TEMPLATES,
  getStoredCvTemplate,
  storeCvTemplate,
} from '../constants/cvTemplates.js';

const { ink, muted, line, accent, paper, paperAlt, surface } = brand.landing;

export default function CvShowcase() {
  const [selectedTemplate, setSelectedTemplate] = useState(() => getStoredCvTemplate());

  function handleSelect(value) {
    setSelectedTemplate(storeCvTemplate(value));
  }

  return (
    <Box id="templates" sx={{ bgcolor: paper, borderTop: `1px solid ${line}`, scrollMarginTop: { xs: 64, md: 72 } }}>
      <Container maxWidth="lg" sx={{ py: { xs: 7, md: 9 }, px: { xs: 2, md: 3 } }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2.5}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', md: 'flex-end' }}
          sx={{ mb: { xs: 4, md: 5 } }}
        >
          <Stack spacing={1.2} sx={{ maxWidth: 620 }}>
            <Typography sx={{ color: accent, fontWeight: 800, fontSize: 13 }}>
              CV şablonları
            </Typography>
            <Typography variant="h3" component="h2" sx={{ color: ink, fontSize: { xs: 30, md: 40 } }}>
              Şablonu seç, aynı tasarımla indir
            </Typography>
            <Typography sx={{ color: muted, lineHeight: 1.7 }}>
              Aşağıdaki örneklerden birini seç. Başvuru paketini oluşturduktan sonra
              CV’ni seçtiğin şablonda PDF veya DOCX olarak indirebilirsin.
            </Typography>
          </Stack>
          <Button
            component={RouterLink}
            to="/app/new"
            state={{ cvTemplate: selectedTemplate }}
            variant="contained"
            endIcon={<ArrowForwardRoundedIcon />}
            sx={{ flexShrink: 0 }}
          >
            Seçili şablonla başla
          </Button>
        </Stack>

        <Grid container spacing={2.5}>
          {CV_TEMPLATES.map((template) => {
            const selected = selectedTemplate === template.value;

            return (
              <Grid item xs={12} sm={6} md={4} key={template.value}>
                <Paper
                  component="button"
                  type="button"
                  elevation={0}
                  onClick={() => handleSelect(template.value)}
                  sx={{
                    appearance: 'none',
                    display: 'block',
                    textAlign: 'left',
                    cursor: 'pointer',
                    height: '100%',
                    width: '100%',
                    overflow: 'hidden',
                    borderRadius: '8px',
                    bgcolor: surface,
                    border: '2px solid',
                    borderColor: selected ? accent : line,
                    transition: 'transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease',
                    '&:hover': {
                      transform: 'translateY(-3px)',
                      boxShadow: '0 18px 40px rgba(20, 25, 34, 0.12)',
                    },
                    '&:focus-visible': {
                      outline: `3px solid ${accent}`,
                      outlineOffset: 3,
                    },
                  }}
                >
                  <Box sx={{ bgcolor: paperAlt, p: 2, borderBottom: `1px solid ${line}` }}>
                    <Box
                      component="img"
                      src={template.image}
                      alt={`${template.label} CV şablonu`}
                      loading="lazy"
                      sx={{
                        display: 'block',
                        width: '100%',
                        maxWidth: 230,
                        mx: 'auto',
                        aspectRatio: '300 / 424',
                        objectFit: 'cover',
                        objectPosition: 'top',
                        borderRadius: '6px',
                        border: `1px solid ${line}`,
                        bgcolor: '#fff',
                      }}
                    />
                  </Box>
                  <Box sx={{ p: 2.2 }}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                      <Typography sx={{ color: ink, fontWeight: 800 }}>
                        {template.label}
                      </Typography>
                      {selected && <CheckCircleRoundedIcon sx={{ color: accent, fontSize: 22 }} />}
                    </Stack>
                    <Typography sx={{ mt: 0.6, color: muted, fontSize: 14, lineHeight: 1.6 }}>
                      {template.description}
                    </Typography>
                    {selected && (
                      <Typography sx={{ mt: 1, color: accent, fontSize: 13, fontWeight: 800 }}>
                        Seçili şablon
                      </Typography>
                    )}
                  </Box>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      </Container>
    </Box>
  );
}
