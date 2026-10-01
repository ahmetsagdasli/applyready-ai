import { useMemo, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Stack,
  Chip,
  ToggleButton,
  ToggleButtonGroup,
  Alert,
  LinearProgress,
} from '@mui/material';
import AutoFixHighRoundedIcon from '@mui/icons-material/AutoFixHighRounded';

const WEIGHT_LABEL = {
  required: { label: 'Zorunlu', color: 'primary' },
  preferred: { label: 'Tercih sebebi', color: 'default' },
  unknown: { label: 'İlanda geçiyor', color: 'default' },
};

// questions: [{ keyword, weight, question }]
// onSubmit(answers): answers = [{ keyword, answer, hasIt }]
export default function GapInterview({ questions, onSubmit, loading, error }) {
  // keyword -> { hasIt: bool|null, answer: string }
  const [state, setState] = useState({});

  const setHasIt = (kw, val) =>
    setState((prev) => ({ ...prev, [kw]: { ...prev[kw], hasIt: val } }));
  const setAnswer = (kw, val) =>
    setState((prev) => ({ ...prev, [kw]: { ...prev[kw], answer: val } }));

  const answeredCount = useMemo(
    () =>
      Object.values(state).filter(
        (s) => s?.hasIt === true && s?.answer && s.answer.trim()
      ).length,
    [state]
  );

  function handleSubmit() {
    const answers = questions.map((q) => ({
      keyword: q.keyword,
      hasIt: state[q.keyword]?.hasIt ?? null,
      answer: state[q.keyword]?.answer || '',
    }));
    onSubmit(answers);
  }

  if (!questions || questions.length === 0) return null;

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Eksikleri Tamamla
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        İlan bu becerileri istiyor ama CV’nizde net görünmüyor. Gerçekten
        deneyiminiz varsa kısaca anlatın; CV’ye uygun şekilde ekleyelim.
        Yoksa “Bende yok” deyin — asla uydurmayız.
      </Typography>

      <Stack spacing={2}>
        {questions.map((q) => {
          const s = state[q.keyword] || {};
          const w = WEIGHT_LABEL[q.weight] || WEIGHT_LABEL.unknown;
          return (
            <Paper key={q.keyword} variant="outlined" sx={{ p: 2.5, borderRadius: '8px' }}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                <Typography variant="subtitle1" fontWeight={700}>
                  {q.keyword}
                </Typography>
                <Chip size="small" label={w.label} color={w.color} variant="outlined" />
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                {q.question}
              </Typography>

              <ToggleButtonGroup
                size="small"
                exclusive
                value={s.hasIt === true ? 'yes' : s.hasIt === false ? 'no' : null}
                onChange={(e, val) => {
                  if (val === 'yes') setHasIt(q.keyword, true);
                  else if (val === 'no') setHasIt(q.keyword, false);
                }}
                sx={{ mb: s.hasIt === true ? 1.5 : 0 }}
              >
                <ToggleButton value="yes" color="success">
                  Bende var
                </ToggleButton>
                <ToggleButton value="no" color="error">
                  Bu deneyim bende yok
                </ToggleButton>
              </ToggleButtonGroup>

              {s.hasIt === true && (
                <TextField
                  label="Kısaca anlat: hangi proje/işte, ne yaptın?"
                  value={s.answer || ''}
                  onChange={(e) => setAnswer(q.keyword, e.target.value)}
                  multiline
                  minRows={2}
                  fullWidth
                  autoFocus
                />
              )}
            </Paper>
          );
        })}
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 2 }}>
        <Button
          variant="contained"
          startIcon={<AutoFixHighRoundedIcon />}
          onClick={handleSubmit}
          disabled={loading || answeredCount === 0}
        >
          {loading
            ? 'Güçlendiriliyor...'
            : `Cevaplarımla CV’yi Güçlendir (${answeredCount})`}
        </Button>
        <Typography variant="caption" color="text.secondary">
          {answeredCount} eksik için açıklama girdiniz.
        </Typography>
      </Stack>
      {loading && <LinearProgress sx={{ mt: 1 }} />}
    </Box>
  );
}
