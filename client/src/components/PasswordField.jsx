import { useState } from 'react';
import { TextField, InputAdornment, IconButton } from '@mui/material';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import VisibilityOffRoundedIcon from '@mui/icons-material/VisibilityOffRounded';

// Goster/gizle togglelı ortak şifre alanı — tüm auth ekranlarında kullanılır.
export default function PasswordField({ label = 'Şifre', ...props }) {
  const [show, setShow] = useState(false);

  return (
    <TextField
      label={label}
      type={show ? 'text' : 'password'}
      fullWidth
      InputProps={{
        endAdornment: (
          <InputAdornment position="end">
            <IconButton
              aria-label={show ? 'Şifreyi gizle' : 'Şifreyi göster'}
              onClick={() => setShow((v) => !v)}
              edge="end"
              size="small"
            >
              {show ? (
                <VisibilityOffRoundedIcon fontSize="small" />
              ) : (
                <VisibilityRoundedIcon fontSize="small" />
              )}
            </IconButton>
          </InputAdornment>
        ),
      }}
      {...props}
    />
  );
}
