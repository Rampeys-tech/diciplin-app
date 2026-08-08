import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import BreakSystem from './pages/BreakSystem';

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Jalur Publik */}
          <Route path="/login" element={<Login />} />

          {/* Jalur Terproteksi: Murni Fitur Absen & Istirahat HP Kru */}
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="/" element={<Navigate to="/break-system" replace />} />
            <Route path="/break-system" element={<BreakSystem />} />
          </Route>

          {/* Jalur Pengaman */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}