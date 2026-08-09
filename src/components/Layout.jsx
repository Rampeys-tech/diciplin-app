import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiLogOut } from 'react-icons/fi';

export default function Layout() {
  const { logout, profile } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    if (logout) {
      await logout();
    }
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans">
      
      {/* HEADER ATAS: DIICIPLIN.COM */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-40 px-4 py-3 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.02)]">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="h-7 w-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-xs font-black tracking-tighter shadow-sm">
              D
            </div>
            <span className="font-black text-sm tracking-tight text-slate-800">
              diciplin<span className="text-indigo-600">.com</span>
            </span>
          </div>
          
          <button 
            onClick={handleLogout}
            type="button" 
            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 border border-rose-100 text-rose-600 hover:bg-rose-100 rounded-xl text-xs font-bold transition-all active:scale-95"
          >
            <FiLogOut /> Keluar
          </button>
        </div>
      </header>

      {/* WORKSPACE AREA: KONTEN UTAMA */}
      <main className="flex-1 w-full max-w-md mx-auto p-0 pb-20">
        <Outlet />
      </main>

    </div>
  );
}