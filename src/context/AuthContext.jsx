'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fungsi untuk memuat session saat halaman dibuka / direfresh
  const initializeAuth = async () => {
    try {
      // 1. Cek sesi lokal yang disimpan
      const localData = localStorage.getItem('resto_user_session');
      if (localData) {
        const parsed = JSON.parse(localData);
        setUser(parsed);
        setProfile(parsed);
      }

      // 2. Cek sesi bawaan Supabase Auth jika ada
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: prof } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();

        if (prof) {
          const combinedUser = { ...session.user, ...prof };
          setUser(combinedUser);
          setProfile(combinedUser);
          localStorage.setItem('resto_user_session', JSON.stringify(combinedUser));
        }
      }
    } catch (err) {
      console.error("Auth init error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const { data: prof } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();

        if (prof) {
          const combinedUser = { ...session.user, ...prof };
          setUser(combinedUser);
          setProfile(combinedUser);
          localStorage.setItem('resto_user_session', JSON.stringify(combinedUser));
        }
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // Fungsi Login Manual
  const login = (userData) => {
    setUser(userData);
    setProfile(userData);
    localStorage.setItem('resto_user_session', JSON.stringify(userData));
  };

  // Fungsi Logout
  const logout = async () => {
    localStorage.removeItem('resto_user_session');
    localStorage.removeItem('diciplin_user');
    setUser(null);
    setProfile(null);
    try {
      await supabase.auth.signOut();
    } catch (e) {}
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, profile, setUser, setProfile, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}