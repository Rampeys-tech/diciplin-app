'use client';

import { useState } from 'react';
import { supabase } from '../api';
import { useNavigate, Link } from 'react-router-dom';
import { FiPhone, FiUser, FiAlertCircle, FiShield, FiBriefcase, FiMapPin } from 'react-icons/fi';

export default function Register() {
  const [fullName, setFullName] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [companyNameInput, setCompanyNameInput] = useState(''); // User menginput Nama Perusahaan
  const [stationPlacement, setStationPlacement] = useState('Resto Staff');
  
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      const cleanCompanyName = companyNameInput.trim();
      
      if (!cleanCompanyName) {
        throw new Error('Silakan masukkan Nama Perusahaan / Outlet Anda.');
      }

      // 1. MURNI CARI BERDASARKAN KOLOM company_name (Mencakup pencarian kata / ilike)
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('id, company_name')
        .ilike('company_name', `%${cleanCompanyName}%`)
        .maybeSingle();

      if (companyError) {
        console.error("Gagal verifikasi perusahaan:", companyError);
      }

      if (!companyData) {
        throw new Error('Nama Perusahaan / Outlet tidak ditemukan. Silakan periksa kembali ejaan nama perusahaan Anda.');
      }

      // Format nomor WhatsApp agar seragam (dimulai 62)
      let cleanPhone = whatsappNumber.trim().replace(/[^0-9]/g, '');
      if (cleanPhone.startsWith('0')) cleanPhone = '62' + cleanPhone.slice(1);

      if (cleanPhone.length < 10) {
        throw new Error('Nomor WhatsApp tidak valid. Masukkan nomor yang benar.');
      }

      // 2. Cek apakah nomor WhatsApp sudah terdaftar di perusahaan tersebut
      const { data: existingUser, error: checkError } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('whatsapp_number', cleanPhone)
        .eq('company_id', companyData.id)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existingUser) {
        throw new Error('Nomor WhatsApp ini sudah terdaftar di perusahaan tersebut. Silakan langsung Login.');
      }

      // 3. Simpan Kru Baru ke Database user_profiles (Menggunakan randomUUID untuk ID Kru)
      const generatedId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : undefined;

      const newCrewData = {
        id: generatedId,
        company_id: companyData.id,
        full_name: fullName.trim(),
        whatsapp_number: cleanPhone,
        role: 'crew',
        station_placement: stationPlacement.trim() || 'Resto Staff',
        total_points: 100,
        wage_per_minute: 500
      };

      const { data: insertedProfile, error: insertError } = await supabase
        .from('user_profiles')
        .insert([newCrewData])
        .select()
        .single();

      if (insertError) throw insertError;

      // 4. Simpan Session Lokal & Navigasi ke Break System
      localStorage.setItem('crew_session', JSON.stringify(insertedProfile));
      alert(`Registrasi Berhasil! Selamat bergabung di ${companyData.company_name}, ${insertedProfile.full_name}.`);
      
      navigate('/break-system');
      setTimeout(() => {
        window.location.href = '/break-system';
      }, 100);

    } catch (err) {
      console.error("Proses Registrasi Gagal:", err.message);
      setErrorMsg(err.message || 'Gagal mendaftar. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f8fafc] via-[#f1f5f9] to-[#e2e8f0] flex flex-col items-center justify-center p-5 font-sans select-none antialiased">
      
      <div className="w-full max-w-[380px] bg-white/80 backdrop-blur-xl border border-white/60 rounded-[32px] p-8 shadow-[0_20px_50px_-12px_rgba(15,23,42,0.08)] space-y-6 transition-all duration-300">
        
        <div className="text-center space-y-2.5">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-700 flex items-center justify-center text-white text-xl font-black tracking-tighter mx-auto shadow-[0_8px_20px_-4px_rgba(79,70,229,0.4)]">
            D
          </div>
          <div className="space-y-1">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              diciplin<span className="text-indigo-600">.com</span>
            </h2>
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-[0.15em] max-w-[250px] mx-auto leading-none">
              Pendaftaran Kru Baru
            </p>
          </div>
        </div>

        <div className="h-[1px] bg-gradient-to-r from-transparent via-slate-200 to-transparent"></div>

        {errorMsg && (
          <div className="p-3.5 bg-rose-50/80 border border-rose-100/70 backdrop-blur-sm rounded-2xl text-rose-600 text-xs font-semibold flex items-start gap-2.5 animate-in fade-in slide-in-from-top-2 duration-200">
            <FiAlertCircle className="flex-shrink-0 text-sm mt-0.5" />
            <span className="leading-relaxed">{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          
          {/* INPUT NAMA PERUSAHAAN */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">
              Nama Outlet / Perusahaan
            </label>
            <div className="relative group">
              <FiBriefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 text-base transition-colors duration-200" />
              <input
                type="text"
                required
                disabled={isLoading}
                placeholder="Ketik nama outlet (misal: 7005 atau Resto Owner)..."
                value={companyNameInput}
                onChange={(e) => setCompanyNameInput(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 bg-white/50 border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/80 transition-all text-slate-800 shadow-sm placeholder:text-slate-300"
              />
            </div>
          </div>

          {/* INPUT NAMA LENGKAP */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">
              Nama Lengkap Kru
            </label>
            <div className="relative group">
              <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 text-base transition-colors duration-200" />
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

          {/* INPUT WHATSAPP */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">
              No. WhatsApp Aktif
            </label>
            <div className="relative group">
              <FiPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 text-base transition-colors duration-200" />
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

          {/* INPUT POSISI / STATION PLACEMENT */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">
              Posisi / Divisi Kerja
            </label>
            <div className="relative group">
              <FiMapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 text-base transition-colors duration-200" />
              <input
                type="text"
                required
                disabled={isLoading}
                placeholder="Contoh: Dapur Utama / Kasir / Server"
                value={stationPlacement}
                onChange={(e) => setStationPlacement(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 bg-white/50 border border-slate-200 rounded-2xl text-xs font-medium focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/80 transition-all text-slate-800 shadow-sm placeholder:text-slate-300"
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
              'DAFTARKAN AKUN KRU'
            )}
          </button>
        </form>

        <div className="text-center pt-2">
          <p className="text-xs text-slate-500 font-medium">
            Sudah punya akun?{' '}
            <Link to="/login" className="text-indigo-600 font-bold hover:underline">
              Masuk di sini
            </Link>
          </p>
        </div>

      </div>
      
      <div className="mt-8 flex items-center gap-1.5 text-[10px] text-slate-400 font-semibold uppercase tracking-widest">
        <FiShield className="text-slate-300 text-xs" /> Secured Multi-Tenant Architecture
      </div>
    </div>
  );
}