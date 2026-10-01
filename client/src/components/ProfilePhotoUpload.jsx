import { useState } from 'react';
import { Alert, Avatar, Box, Button, Stack, Typography } from '@mui/material';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import PhotoCameraRoundedIcon from '@mui/icons-material/PhotoCameraRounded';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_INPUT_BYTES = 5 * 1024 * 1024;
const MAX_OUTPUT_SIZE = 360;

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Fotoğraf okunamadı.'));
    reader.readAsDataURL(file);
  });
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Fotoğraf işlenemedi.'));
    img.src = src;
  });
}

async function prepareProfilePhoto(file) {
  if (!file) return null;
  if (!ACCEPTED_TYPES.includes(file.type)) {
    throw new Error('JPG, PNG veya WebP fotoğraf yükleyin.');
  }
  if (file.size > MAX_INPUT_BYTES) {
    throw new Error('Fotoğraf 5 MB sınırını aşmamalı.');
  }

  const source = await readFileAsDataUrl(file);
  const img = await loadImage(source);
  const sourceSize = Math.min(img.naturalWidth || img.width, img.naturalHeight || img.height);
  if (!sourceSize) throw new Error('Fotoğraf boyutu okunamadı.');

  const sx = Math.max(0, ((img.naturalWidth || img.width) - sourceSize) / 2);
  const sy = Math.max(0, ((img.naturalHeight || img.height) - sourceSize) / 2);
  const targetSize = Math.min(MAX_OUTPUT_SIZE, sourceSize);

  const canvas = document.createElement('canvas');
  canvas.width = targetSize;
  canvas.height = targetSize;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Fotoğraf işlenemedi.');
  ctx.clearRect(0, 0, targetSize, targetSize);
  ctx.save();
  ctx.beginPath();
  ctx.arc(targetSize / 2, targetSize / 2, targetSize / 2 - 4, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(img, sx, sy, sourceSize, sourceSize, 0, 0, targetSize, targetSize);
  ctx.restore();
  ctx.beginPath();
  ctx.arc(targetSize / 2, targetSize / 2, targetSize / 2 - 6, 0, Math.PI * 2);
  ctx.lineWidth = Math.max(6, targetSize * 0.035);
  ctx.strokeStyle = 'rgba(255,255,255,0.96)';
  ctx.stroke();

  return {
    dataUrl: canvas.toDataURL('image/png'),
    name: file.name,
  };
}

export default function ProfilePhotoUpload({ value, onChange }) {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleFileChange(event) {
    const file = event.target.files?.[0] || null;
    event.target.value = '';
    if (!file) return;

    setError('');
    setLoading(true);
    try {
      onChange(await prepareProfilePhoto(file));
    } catch (err) {
      setError(err.message || 'Fotoğraf yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        Profil fotoğrafı
      </Typography>
      <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap>
        <Avatar
          src={value?.dataUrl || undefined}
          alt="Profil fotoğrafı"
          sx={{ width: 88, height: 88, bgcolor: 'rgba(94,234,212,0.12)', color: 'primary.main' }}
        >
          <PhotoCameraRoundedIcon />
        </Avatar>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Button
            variant="outlined"
            component="label"
            startIcon={<PhotoCameraRoundedIcon />}
            disabled={loading}
          >
            {loading ? 'Yükleniyor...' : value ? 'Fotoğrafı Değiştir' : 'Fotoğraf Seç'}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              hidden
              onChange={handleFileChange}
            />
          </Button>
          {value && (
            <Button
              variant="text"
              color="inherit"
              startIcon={<DeleteRoundedIcon />}
              onClick={() => {
                setError('');
                onChange(null);
              }}
            >
              Kaldır
            </Button>
          )}
        </Stack>
      </Stack>
      {value?.name && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.8 }}>
          {value.name}
        </Typography>
      )}
      {error && (
        <Alert severity="error" sx={{ mt: 1 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
}
