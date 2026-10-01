import { Box, Grid, Typography } from '@mui/material';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import RadioButtonUncheckedRoundedIcon from '@mui/icons-material/RadioButtonUncheckedRounded';
import { alpha } from '@mui/material/styles';
import {
  CV_TEMPLATES,
  normalizeCvTemplate,
  storeCvTemplate,
} from '../constants/cvTemplates.js';
import { brand } from '../theme/theme.js';

export function TemplateSelect({ value, onChange }) {
  const selectedValue = normalizeCvTemplate(value);
  const selectedTemplate = CV_TEMPLATES.find((template) => template.value === selectedValue);

  function handleChange(nextValue) {
    onChange(storeCvTemplate(nextValue));
  }

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        CV şablonu
      </Typography>
      <Grid container spacing={1.5} sx={{ maxWidth: 760 }}>
        {CV_TEMPLATES.map((template) => {
          const selected = selectedValue === template.value;
          const Icon = selected ? CheckCircleRoundedIcon : RadioButtonUncheckedRoundedIcon;

          return (
            <Grid item xs={6} sm={4} md={2} key={template.value}>
              <Box
                role="button"
                tabIndex={0}
                aria-pressed={selected}
                aria-label={`${template.label} CV şablonu`}
                onClick={() => handleChange(template.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    handleChange(template.value);
                  }
                }}
                sx={{
                  cursor: 'pointer',
                  borderRadius: '8px',
                  p: 0.75,
                  border: '2px solid',
                  borderColor: selected ? 'primary.main' : 'transparent',
                  bgcolor: selected ? alpha(brand.primary, 0.1) : 'transparent',
                  transition: 'border-color .15s ease, background-color .15s ease',
                  '&:hover': {
                    borderColor: selected ? 'primary.main' : alpha(brand.primary, 0.34),
                  },
                  '&:focus-visible': {
                    outline: '2px solid',
                    outlineColor: 'primary.main',
                    outlineOffset: 2,
                  },
                }}
              >
                <Box sx={{ position: 'relative' }}>
                  <Box
                    component="img"
                    src={template.image}
                    alt={`${template.label} CV şablonu`}
                    loading="lazy"
                    sx={{
                      display: 'block',
                      width: '100%',
                      aspectRatio: '300 / 424',
                      objectFit: 'cover',
                      objectPosition: 'top',
                      borderRadius: '6px',
                      border: '1px solid',
                      borderColor: 'divider',
                      bgcolor: '#fff',
                    }}
                  />
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 6,
                      right: 6,
                      display: 'grid',
                      placeItems: 'center',
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      bgcolor: selected ? 'primary.main' : 'rgba(255,255,255,0.9)',
                      color: selected ? '#fff' : 'text.secondary',
                      boxShadow: '0 4px 12px rgba(15,23,42,0.16)',
                    }}
                  >
                    <Icon sx={{ fontSize: 17 }} />
                  </Box>
                </Box>
                <Typography sx={{ fontSize: 12, fontWeight: 700, textAlign: 'center', mt: 0.7 }}>
                  {template.label}
                </Typography>
              </Box>
            </Grid>
          );
        })}
      </Grid>
      {selectedTemplate?.hint && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.8 }}>
          Seçili: {selectedTemplate.label}. {selectedTemplate.hint}
        </Typography>
      )}
    </Box>
  );
}
