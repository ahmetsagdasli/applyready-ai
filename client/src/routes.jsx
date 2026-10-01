import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';

import Landing from './pages/Landing.jsx';

// Landing ilk boyamada gerekli; diger sayfalar route bazli lazy yuklenir.
const NewApplication = lazy(() => import('./pages/NewApplication.jsx'));
const Login = lazy(() => import('./pages/Login.jsx'));
const Register = lazy(() => import('./pages/Register.jsx'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword.jsx'));
const ResetPassword = lazy(() => import('./pages/ResetPassword.jsx'));
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'));
const ApplicationDetail = lazy(() => import('./pages/ApplicationDetail.jsx'));
const AccountSettings = lazy(() => import('./pages/AccountSettings.jsx'));
const Pricing = lazy(() => import('./pages/Pricing.jsx'));
const BillingSuccess = lazy(() => import('./pages/BillingSuccess.jsx'));
const BillingCancel = lazy(() => import('./pages/BillingCancel.jsx'));
const Privacy = lazy(() => import('./pages/Privacy.jsx'));
const Kvkk = lazy(() => import('./pages/Kvkk.jsx'));
const Terms = lazy(() => import('./pages/Terms.jsx'));
const NotFound = lazy(() => import('./pages/NotFound.jsx'));

function PageFallback() {
  return (
    <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', py: 10 }}>
      <CircularProgress />
    </Box>
  );
}

export default function AppRoutes() {
  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/settings" element={<AccountSettings />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/billing/success" element={<BillingSuccess />} />
        <Route path="/billing/cancel" element={<BillingCancel />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/kvkk" element={<Kvkk />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/app/new" element={<NewApplication />} />
        <Route path="/app/:id" element={<ApplicationDetail />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
