'use client';

import { useState } from 'react';
import { supabase } from '../api';
import { useNavigate } from 'react-router-dom';
import { FiPhone, FiUser, FiAlertCircle, FiShield, FiBriefcase, FiMapPin, FiLogIn } from 'react-icons/fi';

export default function Register({ onSwitchToLogin }) {
  const [mode, setMode] = useState('register');

  // State Login
  const [loginPhone, setLoginPhone] = useState('');

  // State Register
  const [fullName, setFullName] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [companyNameInput, setCompanyNameInput] = useState('');
  const [stationPlacement, setStationPlacement] = useState('Crew Station');

  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  // ================= 1. PROSES LOGIN =================
  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      let cleanPhone = loginPhone.trim().replace(/[^0-9]/g, '');
      if (cleanPhone.startsWith('0')) cleanPhone = '62' + cleanPhone.slice(1);

      if (cleanPhone.length < 10) {
        throw new Error('Masukkan nomor WhatsApp terdaftar yang valid.');
      }

      const { data: userProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('whatsapp_number', cleanPhone)
        .maybeSingle();

      if (profileError) throw profileError;

      if (!userProfile) {
        throw new Error('Nomor WhatsApp belum terdaftar. Silakan daftar akun kru terlebih dahulu.');
      }

      localStorage.setItem('crew_session', JSON.stringify(userProfile));
      navigate('/break-system');
      window.location.href = '/break-system';

    } catch (err) {
      console.error("Login Gagal:", err.message);
      setErrorMsg(err.message || 'Gagal masuk. Periksa nomor HP Anda.');
    } finally {
      setIsLoading(false);
    }
  };

  // ================= 2. PROSES REGISTRASI =================
  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      const cleanCompanyName = companyNameInput.trim();
      if (!cleanCompanyName) {
        throw new Error('Silakan masukkan Nama Perusahaan / Outlet Anda.');
      }

      const { data: companyData } = await supabase
        .from('companies')
        .select('id, company_name')
        .ilike('company_name', `%${cleanCompanyName}%`)
        .maybeSingle();

      if (!companyData) {
        throw new Error('Outlet tidak ditemukan. Periksa kembali ejaan nama outlet.');
      }

      let cleanPhone = whatsappNumber.trim().replace(/[^0-9]/g, '');
      if (cleanPhone.startsWith('0')) cleanPhone = '62' + cleanPhone.slice(1);

      const { data: existingUser } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('whatsapp_number', cleanPhone)
        .eq('company_id', companyData.id)
        .maybeSingle();

      if (existingUser) {
        throw new Error('Nomor ini sudah terdaftar. Silakan beralih ke menu Login.');
      }

      const generatedId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : undefined;

      const newCrewData = {
        id: generatedId,
        company_id: companyData.id,
        full_name: fullName.trim(),
        whatsapp_number: cleanPhone,
        role: stationPlacement.toLowerCase() === 'manager' ? 'manager' : 'crew',
        station_placement: stationPlacement,
        total_points: 100,
        wage_per_minute: 500
      };

      const { data: insertedProfile, error: insertError } = await supabase
        .from('user_profiles')
        .insert([newCrewData])
        .select()
        .single();

      if (insertError) throw insertError;

      localStorage.setItem('crew_session', JSON.stringify(insertedProfile));
      alert(`Registrasi Berhasil! Selamat bergabung, ${insertedProfile.full_name}.`);
      
      navigate('/break-system');
      window.location.href = '/break-system';

    } catch (err) {
      console.error("Registrasi Gagal:", err.message);
      setErrorMsg(err.message || 'Gagal mendaftar. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  const switchToLoginMode = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setMode('login');
    if (typeof onSwitchToLogin === 'function') onSwitchToLogin();
  };

  const switchToRegisterMode = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setMode('register');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f8fafc] via-[#f1f5f9] to-[#e2e8f0] flex flex-col items-center justify-center p-5 font-sans select-none antialiased">
      
      <div className="w-full max-w-[380px] bg-white/80 backdrop-blur-xl border border-white/60 rounded-[32px] p-8 shadow-[0_20px_50px_-12px_rgba(15,23,42,0.08)] space-y-6 transition-all duration-300">
        
        {/* HEADER */}
        <div className="text-center space-y-3">
          <div className="flex justify-center items-center">
            <img 
              src="/Diciplin-logo.png" 
              onError={(e) => {
                e.target.onerror = null;
                e.target.style.display = 'none';
                if (e.target.nextSibling) {
                  e.target.nextSibling.style.display = 'flex';
                }
              }}
              alt="Diciplin Logo" 
              className="h-14 w-auto object-contain drop-shadow-md mx-auto" 
            />
            <div 
              style={{ display: 'none' }}
              className="h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-700 items-center justify-center text-white text-xl font-black tracking-tighter mx-auto shadow-[0_8px_20px_-4px_rgba(79,70,229,0.4)]"
            >
              D
            </div>
          </div>
          <div className="space-y-1">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              diciplin<span className="text-indigo-600">.com</span>
            </h2>
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-[0.15em] max-w-[250px] mx-auto leading-none">
              {mode === 'login' ? 'Masuk Akun Kru' : 'Pendaftaran Kru Baru'}
            </p>
          </div>
        </div>

        <div className="h-[1px] bg-gradient-to-r from-transparent via-slate-200 to-transparent"></div>

        {/* ERROR MESSAGE */}
        {errorMsg && (
          <div className="p-3.5 bg-rose-50/80 border border-rose-100/70 backdrop-blur-sm rounded-2xl text-rose-600 text-xs font-semibold flex items-start gap-2.5 animate-in fade-in duration-200">
            <FiAlertCircle className="flex-shrink-0 text-sm mt-0.5" />
            <span className="leading-relaxed">{errorMsg}</span>
          </div>
        )}

        {/* FORM 1: LOGIN */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">
                No. WhatsApp Terdaftar
              </label>
              <div className="relative group">
                <FiPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 text-base transition-colors" />
                <input
                  type="text"
                  required
                  disabled={isLoading}
                  placeholder="Contoh: 085774554443"
                  value={loginPhone}
                  onChange={(e) => setLoginPhone(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-white/50 border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/80 transition-all text-slate-800 shadow-sm placeholder:text-slate-300"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white font-bold py-4 px-4 rounded-2xl text-xs tracking-wider transition-all duration-200 active:scale-[0.98] shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 mt-4"
            >
              {isLoading ? (
                <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <FiLogIn className="text-base" /> MASUK SEKARANG
                </>
              )}
            </button>
          </form>
        )}

        {/* FORM 2: REGISTER */}
        {mode === 'register' && (
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">
                Nama Outlet / Perusahaan
              </label>
              <div className="relative group">
                <FiBriefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 text-base transition-colors" />
                <input
                  type="text"
                  required
                  disabled={isLoading}
                  placeholder="Ketik nama outlet (misal: 7005)..."
                  value={companyNameInput}
                  onChange={(e) => setCompanyNameInput(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-white/50 border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/80 transition-all text-slate-800 shadow-sm placeholder:text-slate-300"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">
                Nama Lengkap Kru
              </label>
              <div className="relative group">
                <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 text-base transition-colors" />
                <input
                  type="text"
                  required
                  disabled={isLoading}
                  placeholder="Masukkan nama lengkap Anda..."
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-white/50 border border-slate-200 rounded-2xl text-xs font-medium focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/80 transition-all text-slate-800 shadow-sm placeholder:text-slate-300"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">
                No. WhatsApp Aktif
              </label>
              <div className="relative group">
                <FiPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 text-base transition-colors" />
                <input
                  type="text"
                  required
                  disabled={isLoading}
                  placeholder="Contoh: 085774554443"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-white/50 border border-slate-200 rounded-2xl text-xs font-medium focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/80 transition-all text-slate-800 shadow-sm placeholder:text-slate-300"
                />
              </div>
            </div>

            {/* INPUT POSISI / DIVISI KERJA DROPDOWN */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">
                Posisi / Divisi Kerja
              </label>
              <div className="relative group">
                <FiMapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 text-base transition-colors pointer-events-none z-10" />
                <select
                  required
                  disabled={isLoading}
                  value={stationPlacement}
                  onChange={(e) => setStationPlacement(e.target.value)}
                  className="w-full pl-11 pr-8 py-3.5 bg-white/50 border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/80 transition-all text-slate-800 shadow-sm appearance-none cursor-pointer"
                >
                  <option value="Crew Station">Crew Station</option>
                  <option value="Staff">Staff</option>
                  <option value="Manager">Manager</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white font-bold py-4 px-4 rounded-2xl text-xs tracking-wider transition-all duration-200 active:scale-[0.98] shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 mt-4"
            >
              {isLoading ? (
                <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                'DAFTARKAN AKUN KRU'
              )}
            </button>
          </form>
        )}

        {/* TOGGLE SWITCHER */}
        <div className="text-center pt-2 relative z-20">
          {mode === 'register' ? (
            <p className="text-xs text-slate-500 font-medium">
              Sudah punya akun?{' '}
              <button
                type="button"
                onClick={switchToLoginMode}
                className="text-indigo-600 font-bold hover:underline cursor-pointer py-1 px-2 rounded-lg bg-indigo-50/60 hover:bg-indigo-100 transition-colors inline-block"
              >
                Masuk di sini
              </button>
            </p>
          ) : (
            <p className="text-xs text-slate-500 font-medium">
              Belum punya akun kru?{' '}
              <button
                type="button"
                onClick={switchToRegisterMode}
                className="text-indigo-600 font-bold hover:underline cursor-pointer py-1 px-2 rounded-lg bg-indigo-50/60 hover:bg-indigo-100 transition-colors inline-block"
              >
                Daftar Kru Baru
              </button>
            </p>
          )}
        </div>

      </div>
      
      <div className="mt-8 flex items-center gap-1.5 text-[10px] text-slate-400 font-semibold uppercase tracking-widest">
        <FiShield className="text-slate-300 text-xs" /> Secured Multi-Tenant Architecture
      </div>
    </div>
  );
}