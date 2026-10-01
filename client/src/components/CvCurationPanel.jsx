import { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Stack,
  Chip,
  ToggleButton,
  ToggleButtonGroup,
  Switch,
  FormControlLabel,
  Button,
  Divider,
} from '@mui/material';

import { composeCvText } from '../lib/composeCvText.js';

const MODE_OPTS = [
  { value: 'full', label: 'Tam' },
  { value: 'condensed', label: 'Kısa' },
  { value: 'hidden', label: 'Gizli' },
];

function relevanceChip(relevance) {
  const pct = Math.round((Number(relevance) || 0) * 100);
  const color = pct >= 70 ? 'success' : pct >= 40 ? 'warning' : 'default';
  return <Chip size="small" variant="outlined" color={color} label={`İlgi %${pct}`} />;
}

function initModes(items) {
  const m = {};
  (items || []).forEach((it, i) => {
    m[i] = it.recommendedDisplay || 'full';
  });
  return m;
}

function ItemRow({ title, subtitle, relevance, mode, onMode }) {
  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      spacing={1}
      alignItems={{ xs: 'flex-start', sm: 'center' }}
      justifyContent="space-between"
      sx={{ py: 1 }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="body2" fontWeight={600} noWrap>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="caption" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </Box>
      <Stack direction="row" spacing={1} alignItems="center">
        {relevanceChip(relevance)}
        <ToggleButtonGroup
          size="small"
          exclusive
          value={mode}
          onChange={(e, v) => v && onMode(v)}
        >
          {MODE_OPTS.map((o) => (
            <ToggleButton key={o.value} value={o.value} sx={{ px: 1.2 }}>
              {o.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Stack>
    </Stack>
  );
}

// tailoredCv: yapilandirilmis CV; onApply(text): secimlerle uretilen metni uygular.
export default function CvCurationPanel({ tailoredCv, language = 'tr', onApply }) {
  const [expModes, setExpModes] = useState({});
  const [projModes, setProjModes] = useState({});
  const [eduModes, setEduModes] = useState({});
  const [showGpa, setShowGpa] = useState(false);

  useEffect(() => {
    setExpModes(initModes(tailoredCv?.experience));
    setProjModes(initModes(tailoredCv?.projects));
    setEduModes(initModes(tailoredCv?.education));
    setShowGpa(false);
  }, [tailoredCv]);

  if (!tailoredCv) return null;

  const experience = tailoredCv.experience || [];
  const projects = tailoredCv.projects || [];
  const education = tailoredCv.education || [];
  const hasGpa = education.some((e) => e.gpa && String(e.gpa).trim());

  function apply() {
    const text = composeCvText(tailoredCv, {
      modes: { experience: expModes, projects: projModes, education: eduModes },
      showGpa,
      language,
    });
    onApply?.(text);
  }

  return (
    <Paper variant="outlined" sx={{ p: 2.5, borderRadius: '8px', mb: 2 }}>
      <Typography variant="subtitle1" gutterBottom>
        Kürasyon — neyi öne çıkaralım?
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
        Düşük ilgili/eski deneyimler otomatik “Kısa” işaretlendi. Dilediğinizi
        Tam/Kısa/Gizli yapın; GPA varsayılan gizli. Seçince “CV metnine uygula”ya basın.
      </Typography>

      {hasGpa && (
        <FormControlLabel
          control={<Switch checked={showGpa} onChange={(e) => setShowGpa(e.target.checked)} />}
          label="GPA’yı göster"
        />
      )}

      {experience.length > 0 && (
        <Box sx={{ mt: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Deneyim
          </Typography>
          {experience.map((e, i) => (
            <ItemRow
              key={i}
              title={`${e.title || '-'}${e.company ? ` — ${e.company}` : ''}`}
              subtitle={e.period}
              relevance={e.relevance}
              mode={expModes[i] || 'full'}
              onMode={(v) => setExpModes((p) => ({ ...p, [i]: v }))}
            />
          ))}
        </Box>
      )}

      {projects.length > 0 && (
        <Box sx={{ mt: 1 }}>
          <Divider sx={{ my: 1 }} />
          <Typography variant="caption" color="text.secondary">
            Projeler
          </Typography>
          {projects.map((p, i) => (
            <ItemRow
              key={i}
              title={p.name || '-'}
              subtitle={(p.technologies || []).join(', ')}
              relevance={p.relevance}
              mode={projModes[i] || 'full'}
              onMode={(v) => setProjModes((prev) => ({ ...prev, [i]: v }))}
            />
          ))}
        </Box>
      )}

      {education.length > 0 && (
        <Box sx={{ mt: 1 }}>
          <Divider sx={{ my: 1 }} />
          <Typography variant="caption" color="text.secondary">
            Eğitim
          </Typography>
          {education.map((ed, i) => (
            <ItemRow
              key={i}
              title={`${ed.degree || '-'}${ed.field ? ` - ${ed.field}` : ''}`}
              subtitle={ed.school}
              relevance={ed.relevance}
              mode={eduModes[i] || 'full'}
              onMode={(v) => setEduModes((p) => ({ ...p, [i]: v }))}
            />
          ))}
        </Box>
      )}

      <Button variant="outlined" onClick={apply} sx={{ mt: 2 }}>
        Seçimlerimi CV metnine uygula
      </Button>
    </Paper>
  );
}
