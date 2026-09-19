'use client';

import { useState } from 'react';
import { supabase } from '../api';
import { useAuth } from '../context/AuthContext';
import { 
  FiPhone, 
  FiLock, 
  FiLogIn, 
  FiEye, 
  FiEyeOff, 
  FiAlertCircle, 
  FiUser, 
  FiHome, 
  FiCheckCircle, 
  FiUserPlus, 
  FiArrowLeft 
} from 'react-icons/fi';

export default function Login() {
  const { login } = useAuth();

  // Mode: false = Tampilan Login, true = Tampilan Daftar Kru Baru
  const [isRegistering, setIsRegistering] = useState(false);

  // State Form Login
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // State Form Pendaftaran Kru Baru
  const [regOutletCode, setRegOutletCode] = useState('');
  const [regFullName, setRegFullName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  // Fungsi pembuat variasi format nomor WhatsApp (08xx dan 628xx)
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

  // ==========================================
  // LOGIKA 1: PROSES MASUK / LOGIN
  // ==========================================
  const handleLogin = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    
    if (!phoneNumber || !phoneNumber.trim()) {
      setErrorMessage('Nomor WhatsApp wajib diisi.');
      return;
    }

    setIsLoading(true);

    try {
      const phoneVars = getPhoneVariations(phoneNumber.trim());

      // Cari data pengguna di tabel user_profiles
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

      // Validasi Password
      if (userProfile.password && userProfile.password.trim() !== '') {
        if (!inputPass) {
          throw new Error('Akun ini memiliki password. Silakan masukkan password Anda.');
        }
        if (inputPass !== userProfile.password.trim()) {
          throw new Error('Password yang dimasukkan salah!');
        }
      } else {
        // Jika akun lama belum punya password, simpan password yang baru diinput
        if (inputPass !== '') {
          await supabase
            .from('user_profiles')
            .update({ password: inputPass })
            .eq('id', userProfile.id);
          userProfile.password = inputPass;
        }
      }

      // Format data sesi user
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

      // Simpan sesi login
      if (login) {
        login(sessionUser);
      } else {
        localStorage.setItem('resto_user_session', JSON.stringify(sessionUser));
      }

      // Redirect ke halaman dashboard
      window.location.href = '/';

    } catch (err) {
      console.error("Login error:", err);
      setErrorMessage(err.message || 'Gagal masuk ke akun.');
      setIsLoading(false);
    }
  };

  // ==========================================
  // LOGIKA 2: PROSES DAFTAR KRU MANDIRI
  // ==========================================
  const handleRegister = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const cleanOutletCode = regOutletCode.trim();

    // Validasi input awal
    if (!cleanOutletCode) {
      setErrorMessage('Kode Resto / Cabang wajib diisi.');
      return;
    }
    if (!regFullName.trim()) {
      setErrorMessage('Nama lengkap wajib diisi.');
      return;
    }
    if (!regPhone.trim()) {
      setErrorMessage('Nomor WhatsApp wajib diisi.');
      return;
    }
    if (!regPassword.trim()) {
      setErrorMessage('Password wajib dibuat.');
      return;
    }

    setIsLoading(true);

    try {
      // 1. Cek apakah Kode Resto terdaftar di database Supabase (tabel outlets)
      const { data: outletData, error: outletError } = await supabase
        .from('outlets')
        .select('id, name, code')
        .eq('code', cleanOutletCode)
        .maybeSingle();

      if (outletError) throw outletError;

      // Tolak jika kode tidak cocok dengan yang terdaftar di Supabase
      if (!outletData) {
        throw new Error(`Kode resto "${cleanOutletCode}" tidak valid. Pastikan kode cabang sudah benar.`);
      }

      // 2. Pastikan nomor WhatsApp belum pernah terdaftar sebelumnya
      const phoneVars = getPhoneVariations(regPhone.trim());
      const { data: existingUser, error: checkError } = await supabase
        .from('user_profiles')
        .select('id')
        .in('whatsapp_number', phoneVars)
        .limit(1);

      if (checkError) throw checkError;
      if (existingUser && existingUser.length > 0) {
        throw new Error('Nomor WhatsApp ini sudah terdaftar di sistem.');
      }

      // Format nomor telepon menjadi standar (08xxx)
      let cleanPhone = regPhone.replace(/[^0-9]/g, '');
      if (cleanPhone.startsWith('62')) {
        cleanPhone = '0' + cleanPhone.substring(2);
      }

      // 3. Simpan data kru baru ke user_profiles (tanpa kolom is_active)
      const { error: insertError } = await supabase
  .from('user_profiles')
  .insert([
    {
      full_name: regFullName.trim(),
      whatsapp_number: cleanPhone,
      password: regPassword.trim(),
      outlet_id: outletData.id,
      company_id: '17377d4d-4a72-4ee8-99d5-65ec8ac0b001', // Tambahkan ini
      role: 'kru'
    }
  ]);

      if (insertError) throw insertError;

      // Isi form login secara otomatis dan alihkan kembali ke tampilan masuk
      setPhoneNumber(cleanPhone);
      setPassword(regPassword.trim());
      setSuccessMessage(`Berhasil mendaftar di ${outletData.name}! Silakan klik Masuk Sekarang.`);
      setIsRegistering(false);

      // Bersihkan input pendaftaran
      setRegOutletCode('');
      setRegFullName('');
      setRegPhone('');
      setRegPassword('');

    } catch (err) {
      console.error("Register error:", err);
      setErrorMessage(err.message || 'Gagal mendaftarkan kru baru.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#F8FAFC] flex flex-col items-center justify-center p-4 font-sans text-slate-800">
      
      <div className="w-full max-w-sm bg-white rounded-[32px] border border-slate-100 shadow-[0_10px_40px_rgba(0,0,0,0.04)] p-7 space-y-6">
        
        {/* Header Logo & Judul */}
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
              {isRegistering ? 'Pendaftaran Akun Kru Baru' : 'Masuk Akun Kru & Management'}
            </p>
          </div>
        </div>

        {/* Notifikasi Error */}
        {errorMessage && (
          <div className="bg-rose-50 border border-rose-200/80 rounded-2xl p-3 flex items-start gap-2.5 text-rose-700">
            <FiAlertCircle className="text-base shrink-0 mt-0.5" />
            <p className="text-xs font-semibold leading-relaxed">{errorMessage}</p>
          </div>
        )}

        {/* Notifikasi Berhasil */}
        {successMessage && (
          <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-3 flex items-start gap-2.5 text-emerald-700">
            <FiCheckCircle className="text-base shrink-0 mt-0.5" />
            <p className="text-xs font-semibold leading-relaxed">{successMessage}</p>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAMPILAN: FORM LOGIN ATAU FORM REGISTRASI                */}
        {/* ========================================================= */}
        {!isRegistering ? (
          /* FORM LOGIN */
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

            <div className="text-center pt-2">
              <p className="text-xs font-semibold text-slate-500">
                Belum punya akun kru?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage('');
                    setSuccessMessage('');
                    setIsRegistering(true);
                  }}
                  className="text-indigo-600 font-extrabold hover:underline cursor-pointer"
                >
                  Daftar Kru Baru
                </button>
              </p>
            </div>

          </form>
        ) : (
          /* FORM REGISTRASI KRU MANDIRI */
          <form onSubmit={handleRegister} className="space-y-3.5">
            
            {/* Input Kode Resto */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                Kode Resto / Cabang
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-slate-400">
                  <FiHome className="text-sm" />
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={regOutletCode}
                  onChange={(e) => setRegOutletCode(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="Masukkan kode cabang"
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-bold text-slate-900 tracking-wider placeholder:normal-case placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-2xs"
                />
              </div>
            </div>

            {/* Input Nama Kru */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                Nama Lengkap Kru
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-slate-400">
                  <FiUser className="text-sm" />
                </span>
                <input
                  type="text"
                  value={regFullName}
                  onChange={(e) => setRegFullName(e.target.value)}
                  placeholder="Nama Lengkap Anda"
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-bold text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-2xs"
                />
              </div>
            </div>

            {/* Input No WhatsApp */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                No. WhatsApp
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-slate-400">
                  <FiPhone className="text-sm" />
                </span>
                <input
                  type="text"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  placeholder="08123456789"
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-bold text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-2xs"
                />
              </div>
            </div>

            {/* Input Password */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                Buat Password
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-slate-400">
                  <FiLock className="text-sm" />
                </span>
                <input
                  type={showRegPassword ? 'text' : 'password'}
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="Buat password akun Anda"
                  required
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-bold text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-2xs"
                />
                <button
                  type="button"
                  onClick={() => setShowRegPassword(!showRegPassword)}
                  className="absolute right-3.5 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  {showRegPassword ? <FiEyeOff className="text-sm" /> : <FiEye className="text-sm" />}
                </button>
              </div>
            </div>

            {/* Tombol Simpan Pendaftaran */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60"
            >
              {isLoading ? (
                <span className="animate-pulse">Mendaftarkan Kru...</span>
              ) : (
                <>
                  <FiUserPlus className="text-base" />
                  <span>Daftar Akun Kru</span>
                </>
              )}
            </button>

            {/* Tombol Kembali ke Login */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setErrorMessage('');
                  setIsRegistering(false);
                }}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                <FiArrowLeft className="text-sm" />
                Sudah punya akun? Masuk
              </button>
            </div>

          </form>
        )}

      </div>

      <div className="mt-6 text-center text-[10px] text-slate-400 font-extrabold uppercase tracking-widest flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
        Secured Multi-Tenant Architecture
      </div>

    </div>
  );
}