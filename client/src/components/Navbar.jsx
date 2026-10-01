import { useState } from 'react';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Stack,
  Container,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Divider,
  Avatar,
  Menu,
  MenuItem,
  useScrollTrigger,
} from '@mui/material';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import SpaceDashboardRoundedIcon from '@mui/icons-material/SpaceDashboardRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import KeyboardArrowRightRoundedIcon from '@mui/icons-material/KeyboardArrowRightRounded';

import { useAuth } from '../context/AuthContext.jsx';
import { brand } from '../theme/theme.js';

function NavLink({ to, label, active, light = false }) {
  return (
    <Button
      component={RouterLink}
      to={to}
      disableRipple
      sx={{
        px: 1.5,
        minHeight: 40,
        borderRadius: 999,
        fontSize: 14,
        color: active ? (light ? '#0f766e' : 'primary.main') : light ? '#475569' : 'text.secondary',
        bgcolor: active ? (light ? '#f0fdfa' : 'rgba(94, 234, 212, 0.09)') : 'transparent',
        '&:hover': {
          color: light ? '#111827' : 'text.primary',
          bgcolor: light ? '#f8fafc' : 'rgba(255,255,255,0.06)',
        },
      }}
    >
      {label}
    </Button>
  );
}

function BrandMark({ compact = false, light = false }) {
  return (
    <Stack
      direction="row"
      spacing={1}
      alignItems="center"
      component={RouterLink}
      to="/"
      sx={{ textDecoration: 'none', color: 'inherit', minWidth: 0 }}
    >
      <Box
        sx={{
          width: compact ? 30 : 34,
          height: compact ? 30 : 34,
          borderRadius: '8px',
          display: 'grid',
          placeItems: 'center',
          color: light ? '#0f766e' : '#061016',
          background: light ? '#f0fdfa' : 'linear-gradient(135deg, #5eead4 0%, #38bdf8 100%)',
          border: light ? '1px solid #ccfbf1' : 'none',
          boxShadow: light ? 'none' : '0 14px 30px rgba(94, 234, 212, 0.18)',
        }}
      >
        <AutoAwesomeRoundedIcon sx={{ fontSize: compact ? 17 : 19 }} />
      </Box>
      <Typography
        variant={compact ? 'subtitle1' : 'h6'}
        sx={{ fontWeight: 800, color: light ? '#111827' : 'text.primary', lineHeight: 1 }}
      >
        ApplyReady
      </Typography>
    </Stack>
  );
}

export default function Navbar() {
  const { user, signOut, supabaseEnabled } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState(null);

  const scrolled = useScrollTrigger({ disableHysteresis: true, threshold: 28 });
  const isLanding = location.pathname === '/';
  const transparent = isLanding && !scrolled;
  const landingLight = isLanding && scrolled;
  const authed = supabaseEnabled && user;
  const initial = (user?.email || '?').charAt(0).toUpperCase();

  async function handleSignOut() {
    setOpen(false);
    setMenuAnchor(null);
    await signOut();
    navigate('/');
  }

  const navLinks = [
    { label: 'Nasıl Çalışır', to: isLanding ? '#how-it-works' : '/#how-it-works' },
    { label: 'Şablonlar', to: isLanding ? '#templates' : '/#templates' },
    { label: 'Fiyatlandırma', to: '/pricing', activePath: '/pricing' },
    ...(authed ? [{ label: 'Başvurularım', to: '/dashboard', activePath: '/dashboard' }] : []),
  ];

  return (
    <>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          backgroundColor: landingLight
            ? transparent
              ? 'rgba(248, 250, 252, 0.78)'
              : 'rgba(255, 255, 255, 0.88)'
            : transparent
              ? 'rgba(11, 15, 23, 0.18)'
              : 'rgba(11, 15, 23, 0.76)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid',
          borderColor: landingLight ? '#e5e7eb' : transparent ? 'rgba(255,255,255,0.08)' : brand.border,
          boxShadow: scrolled ? (landingLight ? '0 10px 30px rgba(15,23,42,0.06)' : '0 18px 46px rgba(0, 0, 0, 0.24)') : 'none',
          transition: 'background-color .22s ease, box-shadow .22s ease, border-color .22s ease',
        }}
      >
        <Container maxWidth="xl" sx={{ px: { xs: 2, md: 4 } }}>
          <Toolbar disableGutters sx={{ minHeight: { xs: 64, md: 72 }, gap: 2 }}>
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <BrandMark light={landingLight} />
            </Box>

            <Stack
              direction="row"
              spacing={0.5}
              alignItems="center"
              sx={{ display: { xs: 'none', md: 'flex' } }}
            >
              {navLinks.map((l) => (
                <NavLink
                  key={l.label}
                  to={l.to}
                  label={l.label}
                  light={landingLight}
                  active={Boolean(l.activePath && location.pathname.startsWith(l.activePath))}
                />
              ))}

              {authed ? (
                <>
                  <Button
                    component={RouterLink}
                    to="/app/new"
                    variant="contained"
                    startIcon={<AddRoundedIcon />}
                    sx={{ ml: 1.2 }}
                  >
                    Yeni Başvuru
                  </Button>
                  <IconButton
                    onClick={(e) => setMenuAnchor(e.currentTarget)}
                    aria-label="Hesap menüsü"
                    sx={{ ml: 0.5 }}
                  >
                    <Avatar
                      sx={{
                        width: 36,
                        height: 36,
                        fontSize: 15,
                        fontWeight: 800,
                        color: '#061016',
                        bgcolor: 'primary.main',
                        border: '1px solid rgba(255,255,255,0.24)',
                      }}
                    >
                      {initial}
                    </Avatar>
                  </IconButton>
                  <Menu
                    anchorEl={menuAnchor}
                    open={Boolean(menuAnchor)}
                    onClose={() => setMenuAnchor(null)}
                    slotProps={{
                      paper: {
                        sx: {
                          mt: 1.2,
                          minWidth: 250,
                          borderRadius: '8px',
                          border: '1px solid',
                          borderColor: 'divider',
                          boxShadow: '0 24px 60px rgba(0,0,0,0.34)',
                        },
                      },
                    }}
                  >
                    <Box sx={{ px: 2, py: 1.25 }}>
                      <Typography variant="caption" color="text.secondary">
                        Giriş yapıldı
                      </Typography>
                      <Typography variant="body2" fontWeight={700} noWrap>
                        {user.email}
                      </Typography>
                    </Box>
                    <Divider />
                    <MenuItem component={RouterLink} to="/app/new" onClick={() => setMenuAnchor(null)}>
                      <ListItemIcon><AddRoundedIcon fontSize="small" /></ListItemIcon>
                      Yeni Başvuru
                    </MenuItem>
                    <MenuItem component={RouterLink} to="/dashboard" onClick={() => setMenuAnchor(null)}>
                      <ListItemIcon><SpaceDashboardRoundedIcon fontSize="small" /></ListItemIcon>
                      Başvurularım
                    </MenuItem>
                    <MenuItem component={RouterLink} to="/settings" onClick={() => setMenuAnchor(null)}>
                      <ListItemIcon><SettingsRoundedIcon fontSize="small" /></ListItemIcon>
                      Ayarlar
                    </MenuItem>
                    <Divider />
                    <MenuItem onClick={handleSignOut} sx={{ color: 'error.main' }}>
                      <ListItemIcon><LogoutRoundedIcon fontSize="small" sx={{ color: 'error.main' }} /></ListItemIcon>
                      Çıkış Yap
                    </MenuItem>
                  </Menu>
                </>
              ) : (
                supabaseEnabled && (
                  <>
                    <Button component={RouterLink} to="/login" sx={{ ml: 1, color: landingLight ? '#111827' : 'text.primary' }}>
                      Giriş Yap
                    </Button>
                    <Button
                      component={RouterLink}
                      to="/register"
                      variant="contained"
                      endIcon={<KeyboardArrowRightRoundedIcon />}
                      sx={landingLight ? { bgcolor: '#111827', color: '#fff', '&:hover': { bgcolor: '#0f172a' } } : undefined}
                    >
                      Ücretsiz Başla
                    </Button>
                  </>
                )
              )}
            </Stack>

            <IconButton
              edge="end"
              onClick={() => setOpen(true)}
              sx={{ display: { xs: 'inline-flex', md: 'none' }, color: landingLight ? '#111827' : 'text.primary' }}
              aria-label="Menü"
            >
              <MenuRoundedIcon />
            </IconButton>
          </Toolbar>
        </Container>
      </AppBar>

      {!isLanding && <Toolbar sx={{ minHeight: { xs: 64, md: 72 } }} />}

      <Drawer
        anchor="right"
        open={open}
        onClose={() => setOpen(false)}
        PaperProps={{
          sx: {
            width: 320,
            maxWidth: '86vw',
            bgcolor: landingLight ? '#fff' : 'background.paper',
            borderLeft: '1px solid',
            borderColor: landingLight ? '#e5e7eb' : 'divider',
          },
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', p: 2, color: landingLight ? '#111827' : 'inherit' }} role="presentation">
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
            <BrandMark compact light={landingLight} />
            <IconButton onClick={() => setOpen(false)} aria-label="Menüyü kapat" size="small">
              <CloseRoundedIcon />
            </IconButton>
          </Stack>

          {authed && (
            <Stack
              direction="row"
              spacing={1.2}
              alignItems="center"
              sx={{
                p: 1.25,
                my: 1.5,
                borderRadius: '8px',
                bgcolor: 'rgba(94, 234, 212, 0.08)',
                border: '1px solid rgba(94, 234, 212, 0.16)',
              }}
            >
              <Avatar sx={{ width: 36, height: 36, fontSize: 14, fontWeight: 800, bgcolor: 'primary.main', color: '#061016' }}>
                {initial}
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="caption" color="text.secondary">
                  Giriş yapıldı
                </Typography>
                <Typography variant="body2" fontWeight={700} noWrap>
                  {user.email}
                </Typography>
              </Box>
            </Stack>
          )}

          <List
            onClick={() => setOpen(false)}
            sx={{
              '& .MuiListItemButton-root': { borderRadius: '8px', color: landingLight ? '#111827' : 'inherit' },
              '& .MuiListItemIcon-root': { color: landingLight ? '#475569' : 'inherit' },
            }}
          >
            <ListItem disablePadding>
              <ListItemButton component={RouterLink} to={isLanding ? '#how-it-works' : '/#how-it-works'}>
                <ListItemText primary="Nasıl Çalışır" primaryTypographyProps={{ fontWeight: 700 }} />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton component={RouterLink} to={isLanding ? '#templates' : '/#templates'}>
                <ListItemText primary="Şablonlar" primaryTypographyProps={{ fontWeight: 700 }} />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton component={RouterLink} to="/pricing">
                <ListItemText primary="Fiyatlandırma" primaryTypographyProps={{ fontWeight: 700 }} />
              </ListItemButton>
            </ListItem>
            {authed && (
              <>
                <ListItem disablePadding>
                  <ListItemButton component={RouterLink} to="/dashboard">
                    <ListItemIcon sx={{ minWidth: 38 }}><SpaceDashboardRoundedIcon fontSize="small" /></ListItemIcon>
                    <ListItemText primary="Başvurularım" primaryTypographyProps={{ fontWeight: 700 }} />
                  </ListItemButton>
                </ListItem>
                <ListItem disablePadding>
                  <ListItemButton component={RouterLink} to="/app/new">
                    <ListItemIcon sx={{ minWidth: 38 }}><AddRoundedIcon fontSize="small" /></ListItemIcon>
                    <ListItemText primary="Yeni Başvuru" primaryTypographyProps={{ fontWeight: 700 }} />
                  </ListItemButton>
                </ListItem>
                <ListItem disablePadding>
                  <ListItemButton component={RouterLink} to="/settings">
                    <ListItemIcon sx={{ minWidth: 38 }}><SettingsRoundedIcon fontSize="small" /></ListItemIcon>
                    <ListItemText primary="Ayarlar" primaryTypographyProps={{ fontWeight: 700 }} />
                  </ListItemButton>
                </ListItem>
              </>
            )}
          </List>

          <Box sx={{ mt: 'auto' }}>
            {authed ? (
              <Button
                fullWidth
                variant="outlined"
                color="error"
                startIcon={<LogoutRoundedIcon />}
                onClick={handleSignOut}
              >
                Çıkış Yap
              </Button>
            ) : (
              supabaseEnabled && (
                <Stack spacing={1.2}>
                  <Button fullWidth variant="contained" size="large" component={RouterLink} to="/register" onClick={() => setOpen(false)}>
                    Ücretsiz Başla
                  </Button>
                  <Button fullWidth variant="outlined" size="large" component={RouterLink} to="/login" onClick={() => setOpen(false)}>
                    Giriş Yap
                  </Button>
                </Stack>
              )
            )}
          </Box>
        </Box>
      </Drawer>
    </>
  );
}
