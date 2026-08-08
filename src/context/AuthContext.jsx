import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../api'; 

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("=== AUTH CONTEXT MULTI-TENANT ROBUST SYSTEM DIAKTIFKAN ===");

    const initializeAuth = async () => {
      try {
        // 1. Cek jalur pertama: Apakah ada session resmi Supabase Auth (Jalur Akun Owner)
        const { data: { session: currentSession }, error: authError } = await supabase.auth.getSession();
        if (authError) throw authError;

        // 2. Cek jalur kedua: Apakah ada data login Kru di LocalStorage
        const localCrewData = localStorage.getItem('crew_session');

        if (currentSession) {
          // JALUR OWNER OPERASIONAL
          setSession(currentSession);
          setUser(currentSession.user);

          const { data: ownerProf } = await supabase
            .from('user_profiles')
            .select('role, company_id, full_name')
            .eq('id', currentSession.user.id)
            .maybeSingle();

          if (ownerProf) {
            setProfile(ownerProf);
            // Proteksi: Jika owner tersasar ke halaman login, lempar ke dashboard
            if (window.location.pathname === '/login' || window.location.pathname === '/') {
              window.location.href = '/dashboard';
            }
          }
        } else if (localCrewData) {
          // JALUR TIM KRU OPERASIONAL (Mengamankan data Kru agar tidak ditendang balik ke login)
          const parsedCrew = JSON.parse(localCrewData);
          
          // Buat mock object user & session agar kodingan komponen BreakSystem tidak crash
          setUser(parsedCrew);
          setSession({ user: parsedCrew });
          setProfile(parsedCrew);

          console.log("✓ Satpam AuthContext mengizinkan sesi Kru aktif via localStorage.");
          
          // Proteksi: Jika Kru sudah sukses login tapi masih berada di halaman /login, langsung arahkan ke system utama
          if (window.location.pathname === '/login' || window.location.pathname === '/') {
            window.location.href = '/break-system';
          }
        } else {
          // Jika benar-benar kosong (belum login sama sekali)
          setSession(null);
          setUser(null);
          setProfile(null);
        }
      } catch (err) {
        console.error("Gagal inisialisasi otorisasi:", err.message);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listener otomatis Supabase (Dipertahankan untuk mendeteksi logout / perubahan session Owner)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, currentSession) => {
      if (_event === 'SIGNED_OUT') {
        localStorage.removeItem('crew_session'); // Bersihkan sisa data kru jika owner logout
        setSession(null);
        setUser(null);
        setProfile(null);
        window.location.href = '/login';
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const value = {
    session,
    user,
    profile,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};