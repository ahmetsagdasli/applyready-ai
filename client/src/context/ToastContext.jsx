import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Snackbar, Alert } from '@mui/material';

const ToastContext = createContext(null);

// Gecici geri bildirimler (kaydedildi, indirildi, silindi...) icin global snackbar.
// Kullanim: const toast = useToast(); toast.success('Kaydedildi.');
export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null); // { message, severity }
  const [open, setOpen] = useState(false);

  const show = useCallback((message, severity = 'info') => {
    setToast({ message, severity });
    setOpen(true);
  }, []);

  const api = useMemo(
    () => ({
      show,
      success: (m) => show(m, 'success'),
      error: (m) => show(m, 'error'),
      info: (m) => show(m, 'info'),
      warning: (m) => show(m, 'warning'),
    }),
    [show]
  );

  function handleClose(_e, reason) {
    if (reason === 'clickaway') return;
    setOpen(false);
  }

  return (
    <ToastContext.Provider value={api}>
      {children}
      <Snackbar
        open={open}
        autoHideDuration={4000}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleClose}
          severity={toast?.severity || 'info'}
          variant="filled"
          sx={{ borderRadius: 3, boxShadow: '0 12px 32px rgba(7,68,105,0.24)' }}
        >
          {toast?.message}
        </Alert>
      </Snackbar>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
