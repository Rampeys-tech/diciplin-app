import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  // Jika sistem AuthContext masih loading memeriksa cookie/token login, 
  // tampilkan indikator loading smooth agar tidak langsung ngeblank
  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="h-6 w-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Jika setelah dicek ternyata user belum login, satpam akan mengarahkan paksa ke halaman login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Jika sudah login dengan aman, izinkan masuk ke halaman absen (BreakSystem)
  return children;
}