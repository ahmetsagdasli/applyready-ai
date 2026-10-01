import { alpha, createTheme } from '@mui/material/styles';

const HEAD_FONT = '"Manrope", "Inter", "Helvetica", "Arial", sans-serif';
const BODY_FONT = '"Inter", "Roboto", "Helvetica", "Arial", sans-serif';

// Three-tier visual foundation: raw-ish brand values, semantic surfaces,
// then component-level defaults in MUI overrides below.
export const brand = {
  primary: '#5eead4',
  primaryDark: '#14b8a6',
  primaryContainer: '#123f43',
  secondary: '#f59e0b',
  accent: '#38bdf8',
  ink: '#eef6ff',
  muted: '#9aa8ba',
  tint: '#111827',
  bg: '#0b0f17',
  bgSoft: '#101722',
  surface: '#151d2a',
  surfaceElevated: '#1d2635',
  surfaceWarm: '#221b12',
  border: 'rgba(148, 163, 184, 0.18)',
  borderStrong: 'rgba(94, 234, 212, 0.34)',
  glass: 'rgba(21, 29, 42, 0.74)',
  glassBorder: 'rgba(148, 163, 184, 0.24)',
  glassShadow: '0 24px 60px rgba(0, 0, 0, 0.34)',
  pageGradient:
    'linear-gradient(180deg, #0b0f17 0%, #111827 46%, #0f172a 100%)',
  heroOverlay:
    'linear-gradient(105deg, rgba(9, 13, 21, 0.92) 0%, rgba(9, 13, 21, 0.74) 48%, rgba(9, 13, 21, 0.52) 100%)',
  landing: {
    ink: '#141922',
    muted: '#68717d',
    line: '#ded6ca',
    accent: '#173b68',
    paper: '#f3efe7',
    paperAlt: '#ece6dc',
    surface: '#fffaf2',
    deep: '#111827',
    iconBg: '#e8eef4',
  },
};

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: brand.primary,
      dark: brand.primaryDark,
      light: '#99f6e4',
      contrastText: '#061016',
    },
    secondary: {
      main: brand.secondary,
      dark: '#d97706',
      light: '#fcd34d',
      contrastText: '#12100a',
    },
    info: { main: brand.accent, contrastText: '#061016' },
    success: { main: '#34d399', contrastText: '#06140f' },
    warning: { main: '#fbbf24', contrastText: '#171006' },
    error: { main: '#fb7185', contrastText: '#21070c' },
    background: {
      default: brand.bg,
      paper: brand.surface,
    },
    text: {
      primary: brand.ink,
      secondary: brand.muted,
      disabled: 'rgba(154, 168, 186, 0.48)',
    },
    divider: brand.border,
  },
  shape: { borderRadius: 8 },
  typography: {
    fontFamily: BODY_FONT,
    h1: { fontFamily: HEAD_FONT, fontWeight: 800, letterSpacing: 0, lineHeight: 1.05 },
    h2: { fontFamily: HEAD_FONT, fontWeight: 800, letterSpacing: 0, lineHeight: 1.08 },
    h3: { fontFamily: HEAD_FONT, fontWeight: 800, letterSpacing: 0, lineHeight: 1.12 },
    h4: { fontFamily: HEAD_FONT, fontWeight: 800, letterSpacing: 0, lineHeight: 1.15 },
    h5: { fontFamily: HEAD_FONT, fontWeight: 750, letterSpacing: 0 },
    h6: { fontFamily: HEAD_FONT, fontWeight: 750, letterSpacing: 0 },
    subtitle1: { fontWeight: 700 },
    subtitle2: { fontWeight: 700 },
    button: { textTransform: 'none', fontWeight: 750, letterSpacing: 0 },
    overline: { fontWeight: 800, letterSpacing: '0.08em' },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        ':root': {
          '--color-bg-primary': brand.bg,
          '--color-bg-secondary': brand.bgSoft,
          '--color-bg-elevated': brand.surface,
          '--color-text-primary': brand.ink,
          '--color-text-secondary': brand.muted,
          '--color-border-primary': brand.border,
          '--color-brand-primary': brand.primary,
          '--color-accent': brand.secondary,
          '--radius-sm': '6px',
          '--radius-md': '8px',
          '--radius-lg': '12px',
          '--space-1': '4px',
          '--space-2': '8px',
          '--space-3': '12px',
          '--space-4': '16px',
          '--space-6': '24px',
          '--space-8': '32px',
          '--transition-fast': '150ms cubic-bezier(0.2, 0, 0, 1)',
          '--transition-normal': '220ms cubic-bezier(0.2, 0, 0, 1)',
        },
        'html, body, #root': {
          minHeight: '100%',
        },
        body: {
          background: brand.pageGradient,
          color: brand.ink,
          textRendering: 'optimizeLegibility',
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
        },
        a: {
          color: brand.primary,
          textDecorationColor: alpha(brand.primary, 0.38),
          textUnderlineOffset: '3px',
          transition: 'color var(--transition-fast), text-decoration-color var(--transition-fast)',
        },
        'a:hover': {
          color: '#99f6e4',
          textDecorationColor: '#99f6e4',
        },
        '::selection': {
          backgroundColor: alpha(brand.primary, 0.28),
          color: brand.ink,
        },
        '*': {
          boxSizing: 'border-box',
        },
        '@media (prefers-reduced-motion: reduce)': {
          '*, *::before, *::after': {
            animationDuration: '0.01ms !important',
            animationIterationCount: '1 !important',
            scrollBehavior: 'auto !important',
            transitionDuration: '0.01ms !important',
          },
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: 999,
          minHeight: 42,
          paddingInline: 18,
          transition:
            'transform var(--transition-fast), box-shadow var(--transition-fast), background-color var(--transition-fast), border-color var(--transition-fast)',
          '&:hover': {
            transform: 'translateY(-1px)',
          },
          '&:active': {
            transform: 'translateY(0) scale(0.98)',
          },
          '&.Mui-focusVisible': {
            outline: `2px solid ${alpha(brand.primary, 0.86)}`,
            outlineOffset: 3,
          },
        },
        sizeLarge: {
          minHeight: 48,
          paddingInline: 24,
          fontSize: '0.98rem',
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #5eead4 0%, #38bdf8 100%)',
          color: '#061016',
          boxShadow: `0 16px 34px ${alpha(brand.primary, 0.2)}`,
          '&:hover': {
            boxShadow: `0 20px 42px ${alpha(brand.primary, 0.28)}`,
          },
        },
        outlinedPrimary: {
          borderColor: alpha(brand.primary, 0.44),
          color: brand.primary,
          '&:hover': {
            borderColor: brand.primary,
            backgroundColor: alpha(brand.primary, 0.08),
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: brand.surface,
          borderColor: brand.border,
        },
        outlined: {
          borderColor: brand.border,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: brand.surface,
          border: `1px solid ${brand.border}`,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          color: brand.ink,
          backgroundColor: alpha('#0b0f17', 0.72),
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
          borderBottom: `1px solid ${brand.border}`,
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          backgroundColor: alpha('#ffffff', 0.035),
          transition: 'box-shadow var(--transition-fast), background-color var(--transition-fast)',
          '&:hover': {
            backgroundColor: alpha('#ffffff', 0.055),
          },
          '&.Mui-focused': {
            boxShadow: `0 0 0 4px ${alpha(brand.primary, 0.12)}`,
          },
        },
        notchedOutline: {
          borderColor: alpha('#cbd5e1', 0.2),
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: brand.muted,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 700,
          borderRadius: 999,
        },
      },
    },
    MuiTableContainer: {
      styleOverrides: {
        root: {
          backgroundColor: brand.surface,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottomColor: brand.border,
        },
        head: {
          fontWeight: 800,
          color: brand.ink,
          backgroundColor: alpha('#ffffff', 0.04),
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          transition: 'background-color var(--transition-fast)',
          '&.MuiTableRow-hover:hover': {
            backgroundColor: alpha(brand.primary, 0.06),
          },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          height: 3,
          borderRadius: 999,
          background: 'linear-gradient(90deg, #5eead4, #38bdf8)',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 750,
          '&.Mui-focusVisible': {
            outline: `2px solid ${alpha(brand.primary, 0.75)}`,
            outlineOffset: -4,
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 8,
          border: `1px solid ${brand.border}`,
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          backgroundColor: alpha('#ffffff', 0.1),
        },
        bar: {
          borderRadius: 999,
        },
      },
    },
  },
});

export default theme;
