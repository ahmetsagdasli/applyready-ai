import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  Stack,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';

const STATUS_META = {
  matched: { label: 'Eşleşti', color: 'success' },
  missing_fillable: { label: 'Eklenebilir', color: 'warning' },
  missing_irrelevant: { label: 'Alakasız', color: 'default' },
};

// Satir arka plan tonu — tema paletinden turetilir (sabit rgba degil).
function statusBg(theme, status) {
  if (status === 'matched') return alpha(theme.palette.success.main, 0.08);
  if (status === 'missing_fillable') return alpha(theme.palette.warning.main, 0.1);
  return alpha(theme.palette.text.primary, 0.04);
}

const WEIGHT_LABEL = { required: 'Zorunlu', preferred: 'Tercih' };

const STATUS_ORDER = { missing_fillable: 0, matched: 1, missing_irrelevant: 2 };
const WEIGHT_ORDER = { required: 0, preferred: 1 };

// breakdown: [{ keyword, weight, status, foundIn, suggestedSource }]
// onFill(keyword): eklenebilir keyword için gap wizard'a yönlendirir.
export default function KeywordBreakdownTable({ breakdown, onFill }) {
  if (!Array.isArray(breakdown) || breakdown.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        Keyword kırılımı bulunamadı.
      </Typography>
    );
  }

  const rows = [...breakdown].sort((a, b) => {
    const s = (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9);
    if (s !== 0) return s;
    return (WEIGHT_ORDER[a.weight] ?? 9) - (WEIGHT_ORDER[b.weight] ?? 9);
  });

  return (
    <Box>
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 1.5 }}>
        <Chip size="small" color="success" variant="outlined" label="Eşleşti" />
        <Chip size="small" color="warning" variant="outlined" label="Eklenebilir (sorabiliriz)" />
        <Chip size="small" variant="outlined" label="Alakasız" />
      </Stack>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Anahtar kelime</TableCell>
              <TableCell>Önem</TableCell>
              <TableCell>Durum</TableCell>
              <TableCell>Not</TableCell>
              <TableCell align="right"></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((r, i) => {
              const meta = STATUS_META[r.status] || STATUS_META.missing_irrelevant;
              return (
                <TableRow
                  key={`${r.keyword}-${i}`}
                  sx={{ bgcolor: (theme) => statusBg(theme, r.status) }}
                >
                  <TableCell sx={{ fontWeight: 600 }}>{r.keyword}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      variant="outlined"
                      color={r.weight === 'required' ? 'primary' : 'default'}
                      label={WEIGHT_LABEL[r.weight] || r.weight}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip size="small" variant="outlined" color={meta.color} label={meta.label} />
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary">
                      {r.status === 'matched'
                        ? r.foundIn || '—'
                        : r.suggestedSource || '—'}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    {r.status === 'missing_fillable' && onFill && (
                      <Button size="small" onClick={() => onFill(r.keyword)}>
                        Ekle
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
