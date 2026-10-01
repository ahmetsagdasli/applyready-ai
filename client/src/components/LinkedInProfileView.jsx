import { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Divider,
  List,
  ListItem,
  ListItemText,
  Button,
  IconButton,
  Tooltip,
  Stack,
  Alert,
} from '@mui/material';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';

const fmtText = (v) => (v && String(v).trim() ? String(v) : '-');
const fmtList = (arr) =>
  Array.isArray(arr) && arr.length ? arr.join(', ') : '-';

// LinkedIn'in ilgili duzenleme sayfasi derin linkleri ("/in/me/" kendi profilin).
const LINKEDIN = {
  intro: 'https://www.linkedin.com/in/me/edit/intro/',
  about: 'https://www.linkedin.com/in/me/edit/about/',
  experience: 'https://www.linkedin.com/in/me/details/experience/',
  skills: 'https://www.linkedin.com/in/me/details/skills/',
};

// LLM arayuzlerindeki gibi sade kopya ikonu; tiklayinca tik'e doner.
function CopyIconButton({ text }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(String(text || ''));
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard erisimi yoksa sessiz gec */
    }
  }
  return (
    <Tooltip title={copied ? 'Kopyalandı' : 'Kopyala'}>
      <span>
        <IconButton
          size="small"
          onClick={copy}
          disabled={!text || !String(text).trim()}
          color={copied ? 'success' : 'default'}
        >
          {copied ? (
            <CheckRoundedIcon fontSize="small" />
          ) : (
            <ContentCopyRoundedIcon fontSize="small" />
          )}
        </IconButton>
      </span>
    </Tooltip>
  );
}

// "LinkedIn'de aç" derin link butonu (yeni sekmede).
function OpenLinkButton({ href, label }) {
  if (!href) return null;
  return (
    <Button
      size="small"
      variant="outlined"
      component="a"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      endIcon={<OpenInNewRoundedIcon />}
      sx={{ textTransform: 'none' }}
    >
      {label}
    </Button>
  );
}

// Kopyalanabilir blok: baslik + kopya ikonu + icerik + altinda yapistirma linki.
function CopyBlock({ label, instruction, text, href, linkLabel, children }) {
  return (
    <Paper variant="outlined" sx={{ p: 2, borderRadius: '8px', mb: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
        <Typography variant="subtitle2">{label}</Typography>
        <CopyIconButton text={text} />
      </Stack>

      <Box sx={{ whiteSpace: 'pre-wrap', userSelect: 'text', mt: 0.5 }}>
        {children || (
          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
            {fmtText(text)}
          </Typography>
        )}
      </Box>

      <Stack
        direction="row"
        spacing={1}
        alignItems="center"
        justifyContent="space-between"
        flexWrap="wrap"
        useFlexGap
        sx={{ mt: 1.5, pt: 1, borderTop: '1px dashed', borderColor: 'divider' }}
      >
        {instruction && (
          <Typography variant="caption" color="text.secondary">
            {instruction}
          </Typography>
        )}
        <OpenLinkButton href={href} label={linkLabel || 'LinkedIn’de aç'} />
      </Stack>
    </Paper>
  );
}

export default function LinkedInProfileView({ profile, title }) {
  if (!profile) return null;

  const skillsText = Array.isArray(profile.skillsToHighlight)
    ? profile.skillsToHighlight.join(', ')
    : '';

  return (
    <Box sx={{ mt: 1 }}>
      {title && (
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
      )}

      <Alert severity="info" sx={{ mb: 2 }}>
        Her bölümü kopya ikonuyla alın, alttaki bağlantıyla LinkedIn’de ilgili
        alanı açıp <strong>kendiniz</strong> yapıştırın. Uygulama profilinize
        otomatik yazmaz (LinkedIn kuralları & güvenlik).
      </Alert>

      <CopyBlock
        label="Headline"
        instruction="Profili düzenle (kalem) → ‘Başlık’ alanına yapıştır."
        text={profile.headline}
        href={LINKEDIN.intro}
        linkLabel="Başlığı düzenle"
      />

      <CopyBlock
        label="About / Hakkında"
        instruction="‘Hakkında’ bölümü → metni yapıştır."
        text={profile.about}
        href={LINKEDIN.about}
        linkLabel="Hakkında’yı düzenle"
      />

      <CopyBlock
        label="Öne çıkarılacak beceriler"
        instruction="‘Beceri ekle’ → her beceriyi tek tek ekle."
        text={skillsText}
        href={LINKEDIN.skills}
        linkLabel="Becerileri düzenle"
      >
        <Typography variant="body2">{fmtList(profile.skillsToHighlight)}</Typography>
      </CopyBlock>

      {Array.isArray(profile.experienceRewriteSuggestions) &&
        profile.experienceRewriteSuggestions.length > 0 && (
          <>
            <Typography variant="subtitle1" sx={{ mt: 1, mb: 1 }}>
              Deneyim açıklamaları (her pozisyon için)
            </Typography>
            {profile.experienceRewriteSuggestions.map((exp, i) => {
              const blockText = [
                exp.suggestedText || '',
                ...(Array.isArray(exp.bulletSuggestions)
                  ? exp.bulletSuggestions.map((b) => `• ${b}`)
                  : []),
              ]
                .filter(Boolean)
                .join('\n');
              return (
                <CopyBlock
                  key={i}
                  label={`${fmtText(exp.title)} — ${fmtText(exp.company)}`}
                  instruction="‘Deneyim’ → bu pozisyonun kalemi → ‘Açıklama’ya yapıştır."
                  text={blockText}
                  href={LINKEDIN.experience}
                  linkLabel="Deneyimi düzenle"
                >
                  {exp.suggestedText && (
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', mb: 0.5 }}>
                      {exp.suggestedText}
                    </Typography>
                  )}
                  {Array.isArray(exp.bulletSuggestions) && exp.bulletSuggestions.length > 0 && (
                    <List dense disablePadding>
                      {exp.bulletSuggestions.map((b, j) => (
                        <ListItem key={j} disableGutters sx={{ py: 0 }}>
                          <ListItemText primary={`• ${b}`} />
                        </ListItem>
                      ))}
                    </List>
                  )}
                </CopyBlock>
              );
            })}
          </>
        )}

      {Array.isArray(profile.featuredSuggestions) && profile.featuredSuggestions.length > 0 && (
        <Paper variant="outlined" sx={{ p: 2, borderRadius: '8px', mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Öne çıkarılacak içerikler (Featured)
          </Typography>
          <List dense disablePadding>
            {profile.featuredSuggestions.map((it, i) => (
              <ListItem key={i} disableGutters sx={{ py: 0 }}>
                <ListItemText primary={`• ${it}`} />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}

      <Grid container spacing={2} sx={{ mt: 0.5 }}>
        {Array.isArray(profile.profileChecklist) && profile.profileChecklist.length > 0 && (
          <Grid item xs={12} sm={6}>
            <Typography variant="caption" color="text.secondary">
              Profil kontrol listesi
            </Typography>
            <List dense disablePadding>
              {profile.profileChecklist.map((it, i) => (
                <ListItem key={i} disableGutters sx={{ py: 0 }}>
                  <ListItemText primary={`• ${it}`} />
                </ListItem>
              ))}
            </List>
          </Grid>
        )}
        {Array.isArray(profile.recommendedLearningAreas) &&
          profile.recommendedLearningAreas.length > 0 && (
            <Grid item xs={12} sm={6}>
              <Typography variant="caption" color="text.secondary">
                Önerilen öğrenme alanları
              </Typography>
              <List dense disablePadding>
                {profile.recommendedLearningAreas.map((it, i) => (
                  <ListItem key={i} disableGutters sx={{ py: 0 }}>
                    <ListItemText primary={`• ${it}`} />
                  </ListItem>
                ))}
              </List>
            </Grid>
          )}
      </Grid>

      {(profile._meta?.notIncludedBecauseMissing?.length > 0 ||
        profile._meta?.sourceWarnings?.length > 0) && (
        <>
          <Divider sx={{ my: 2 }} />
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="caption" color="text.secondary">
                Eksik olduğu için eklenmeyenler
              </Typography>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                {fmtList(profile._meta?.notIncludedBecauseMissing)}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="caption" color="text.secondary">
                Kaynak uyarıları
              </Typography>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                {fmtList(profile._meta?.sourceWarnings)}
              </Typography>
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
}
