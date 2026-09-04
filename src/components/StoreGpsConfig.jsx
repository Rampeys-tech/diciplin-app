'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../api';
import { FiMapPin, FiLock, FiCheckCircle, FiCrosshair, FiAlertTriangle } from 'react-icons/fi';

export default function StoreGpsConfig({ profile, onOutletUpdated }) {
  const [outlet, setOutlet] = useState(null);
  const [currentLat, setCurrentLat] = useState(null);
  const [currentLng, setCurrentLng] = useState(null);
  const [isLoadingGps, setIsLoadingGps] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Ambil data outlet tempat SM bertugas
  useEffect(() => {
    async function loadOutletData() {
      if (!profile?.outlet_id) return;
      const { data, error } = await supabase
        .from('outlets')
        .select('*')
        .eq('id', profile.outlet_id)
        .maybeSingle();

      if (!error && data) {
        setOutlet(data);
        setCurrentLat(data.latitude);
        setCurrentLng(data.longitude);
      }
    }
    loadOutletData();
  }, [profile?.outlet_id]);

  // Fungsi membaca GPS HP Store Manager secara presisi
  const handleGetLiveLocation = () => {
    if (!navigator.geolocation) {
      alert("Browser Anda tidak mendukung sensor GPS.");
      return;
    }

    setIsLoadingGps(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCurrentLat(position.coords.latitude);
        setCurrentLng(position.coords.longitude);
        setIsLoadingGps(false);
      },
      (err) => {
        alert("Gagal membaca GPS. Pastikan izin lokasi browser aktif.");
        setIsLoadingGps(false);
      },
      { enableHighAccuracy: true, timeout: 12000 }
    );
  };

  // Simpan koordinat ke database
  const handleSaveCoordinates = async () => {
    if (!currentLat || !currentLng || !outlet?.id) {
      alert("Koordinat belum valid.");
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('outlets')
        .update({
          latitude: currentLat,
          longitude: currentLng,
          updated_by: profile.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', outlet.id);

      if (error) throw error;

      alert(`✓ Titik koordinat untuk ${outlet.name} berhasil disimpan!`);
      if (onOutletUpdated) onOutletUpdated();
    } catch (err) {
      alert(`Gagal menyimpan: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Hanya tampil untuk akun Store Manager
  if (profile?.role !== 'store_manager') return null;

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs space-y-3">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
            <FiMapPin className="text-sm" />
          </div>
          <div>
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
              Titik GPS Resto: {outlet?.name || 'Cabang Resto'}
            </h3>
            <p className="text-[9px] text-slate-400 font-medium">
              Kode Store: <span className="font-bold text-slate-600">{outlet?.code || '-'}</span>
            </p>
          </div>
        </div>

        {outlet?.is_locked ? (
          <span className="flex items-center gap-1 text-[9px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
            <FiLock className="text-[10px]" /> TERKUNCI
          </span>
        ) : (
          <span className="flex items-center gap-1 text-[9px] font-black text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
            <FiAlertTriangle className="text-[10px]" /> BELUM DIKUNCI
          </span>
        )}
      </div>

      {outlet?.is_locked ? (
        <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-3 text-center space-y-1">
          <p className="text-xs font-bold text-slate-700 flex items-center justify-center gap-1.5">
            <FiCheckCircle className="text-emerald-600" /> Geofence Outlet Terverifikasi
          </p>
          <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
            Titik koordinat cabang ini telah dikunci permanen oleh Area Manager. Hubungi Area Manager jika memerlukan kalibrasi ulang.
          </p>
          <div className="pt-1 font-mono text-[10px] text-slate-500 font-bold">
            Lat: {outlet.latitude?.toFixed(6)} | Lng: {outlet.longitude?.toFixed(6)} (Radius {outlet.radius_meter || 50}m)
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 space-y-2">
            <p className="text-[10px] text-slate-600 font-semibold leading-relaxed">
              Silakan berdiri di tengah area resto, lalu klik tombol di bawah untuk mengambil titik koordinat GPS fisik cabang Anda.
            </p>
            <button
              type="button"
              onClick={handleGetLiveLocation}
              disabled={isLoadingGps}
              className="w-full py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all active:scale-98 cursor-pointer"
            >
              <FiCrosshair className="text-sm" />
              <span>{isLoadingGps ? 'Membaca Sensor GPS...' : 'Ambil Titik Lokasi Saya'}</span>
            </button>

            {currentLat && currentLng && (
              <div className="pt-1 text-center font-mono text-[10px] text-indigo-700 font-bold bg-indigo-50/60 py-1.5 rounded-lg border border-indigo-100">
                Titik Terbaca: {currentLat.toFixed(6)}, {currentLng.toFixed(6)}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleSaveCoordinates}
            disabled={isSaving || !currentLat || !currentLng}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-2.5 rounded-xl text-xs uppercase tracking-wider shadow-sm transition-all active:scale-98 cursor-pointer disabled:opacity-50"
          >
            {isSaving ? 'Menyimpan Titik...' : 'Simpan Koordinat Resto'}
          </button>
        </div>
      )}
    </div>
  );
}