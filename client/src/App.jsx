import { Box } from '@mui/material';

import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import AppRoutes from './routes.jsx';

export default function App() {
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <Box component="main" sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <AppRoutes />
      </Box>
      <Footer />
    </Box>
  );
}
