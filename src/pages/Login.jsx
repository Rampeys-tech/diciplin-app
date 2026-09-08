'use client';

import { useState } from 'react';
import { supabase } from '../api';
import { useAuth } from '../context/AuthContext';
import { FiPhone, FiLock, FiLogIn, FiEye, FiEyeOff, FiAlertCircle } from 'react-icons/fi';

export default function Login() {
  const { login } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Buat variasi nomor telepon (08xx, 628xx)
  const getPhoneVariations = (input) => {
    let clean = input.replace(/[^0-9]/g, '');
    const list = [clean];
    if (clean.startsWith('0')) {
      list.push('62' + clean.substring(1));
    } else if (clean.startsWith('62')) {
      list.push('0' + clean.substring(2));
    }
    return list;
  };

  const handleLogin = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setErrorMessage('');
    
    if (!phoneNumber || !phoneNumber.trim()) {
      setErrorMessage('Nomor WhatsApp wajib diisi.');
      return;
    }

    setIsLoading(true);

    try {
      const phoneVars = getPhoneVariations(phoneNumber.trim());

      // 1. Cari data kru di tabel user_profiles
      const { data: profiles, error: pError } = await supabase
        .from('user_profiles')
        .select('*')
        .in('whatsapp_number', phoneVars)
        .limit(1);

      if (pError) throw pError;
      if (!profiles || profiles.length === 0) {
        throw new Error('Nomor WhatsApp tidak terdaftar di sistem.');
      }

      const userProfile = profiles[0];
      const inputPass = (password || '').trim();

      // 2. Validasi Password
      if (userProfile.password && userProfile.password.trim() !== '') {
        if (!inputPass) {
          throw new Error('Akun ini memiliki password. Silakan masukkan password Anda.');
        }
        if (inputPass !== userProfile.password.trim()) {
          throw new Error('Password yang dimasukkan salah!');
        }
      } else {
        // Jika akun belum ada password, simpan password yang baru diinput
        if (inputPass !== '') {
          await supabase
            .from('user_profiles')
            .update({ password: inputPass })
            .eq('id', userProfile.id);
          userProfile.password = inputPass;
        }
      }

      // 3. Format Objek User Sesuai AuthContext
      const sessionUser = {
        id: userProfile.id,
        user_metadata: {
          full_name: userProfile.full_name,
          role: userProfile.role,
          station_placement: userProfile.station_placement,
          outlet_id: userProfile.outlet_id
        },
        ...userProfile
      };

      // 4. Daftarkan / sinkronkan login ke AuthContext
      if (login) {
        login(sessionUser);
      } else {
        localStorage.setItem('resto_user_session', JSON.stringify(sessionUser));
      }

      // 5. Pindah ke halaman utama
      window.location.href = '/';

    } catch (err) {
      console.error("Login error:", err);
      setErrorMessage(err.message || 'Gagal masuk ke akun.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#F8FAFC] flex flex-col items-center justify-center p-4 font-sans text-slate-800">
      
      <div className="w-full max-w-sm bg-white rounded-[32px] border border-slate-100 shadow-[0_10px_40px_rgba(0,0,0,0.04)] p-7 space-y-6">
        
        <div className="flex flex-col items-center text-center space-y-2">
          <img 
            src="/Diciplin-logo.png" 
            onError={(e) => { 
              e.currentTarget.onerror = null; 
              e.currentTarget.src = "/logo.png"; 
            }} 
            alt="Diciplin Logo" 
            className="h-10 w-auto object-contain"
          />
          <div>
            <h1 className="text-xl font-black tracking-tight text-slate-900 leading-none">
              Diciplin<span className="text-indigo-600">.com</span>
            </h1>
            <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest mt-1">
              Masuk Akun Kru &amp; Management
            </p>
          </div>
        </div>

        {errorMessage && (
          <div className="bg-rose-50 border border-rose-200/80 rounded-2xl p-3 flex items-start gap-2.5 text-rose-700">
            <FiAlertCircle className="text-base shrink-0 mt-0.5" />
            <p className="text-xs font-semibold leading-relaxed">{errorMessage}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
              No. WhatsApp Terdaftar
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-slate-400">
                <FiPhone className="text-sm" />
              </span>
              <input
                type="text"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="082123422234"
                required
                className="w-full pl-10 pr-3.5 py-3 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-bold text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-2xs"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                Password
              </label>
              <span className="text-[9px] font-bold text-slate-400">
                (Kosongkan jika belum buat)
              </span>
            </div>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-slate-400">
                <FiLock className="text-sm" />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password Anda"
                className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-bold text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-2xs"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                {showPassword ? <FiEyeOff className="text-sm" /> : <FiEye className="text-sm" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60"
          >
            {isLoading ? (
              <span className="animate-pulse">Memverifikasi Akun...</span>
            ) : (
              <>
                <FiLogIn className="text-base" />
                <span>Masuk Sekarang</span>
              </>
            )}
          </button>

        </form>

        <div className="text-center pt-2">
          <p className="text-xs font-semibold text-slate-500">
            Belum punya akun kru?{' '}
            <button
              type="button"
              onClick={() => alert('Pendaftaran akun kru baru dilakukan melalui Store Manager atau Area Manager.')}
              className="text-indigo-600 font-extrabold hover:underline cursor-pointer"
            >
              Daftar Kru Baru
            </button>
          </p>
        </div>

      </div>

      <div className="mt-6 text-center text-[10px] text-slate-400 font-extrabold uppercase tracking-widest flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
        Secured Multi-Tenant Architecture
      </div>

    </div>
  );
}