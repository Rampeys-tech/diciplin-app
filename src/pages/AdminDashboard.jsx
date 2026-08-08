import { useState, useEffect } from 'react';
import { apiCall } from '../api';

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [breaks, setBreaks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const userData = await apiCall('get_data', { sheetName: 'users' });
        const breakData = await apiCall('get_data', { sheetName: 'break_logs' });
        setUsers(userData);
        setBreaks(breakData.slice(-10).reverse()); // Ambil 10 aktivitas break terakhir
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAdminData();
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-black text-gray-900 mb-1">Admin Control Center</h2>
        <p className="text-xs text-gray-500">Monitor seluruh akun karyawan dan log aktivitas sistem langsung dari database Sheets.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Kolom Daftar User */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider mb-3">Daftar Akun Karyawan ({users.length})</h3>
          <div className="divide-y divide-gray-50 max-h-80 overflow-y-auto">
            {loading ? <p className="text-xs text-gray-400">Memuat user...</p> : users.map((user, idx) => (
              <div key={idx} className="py-2.5 flex justify-between items-center text-xs">
                <div>
                  <p className="font-bold text-gray-900">{user.name}</p>
                  <p className="text-[10px] text-gray-400">{user.email}</p>
                </div>
                <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 font-extrabold text-[10px] rounded uppercase">{user.role}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Kolom Monitoring Break */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider mb-3">10 Log Istirahat Terakhir</h3>
          <div className="divide-y divide-gray-50 max-h-80 overflow-y-auto">
            {loading ? <p className="text-xs text-gray-400">Memuat log...</p> : breaks.length === 0 ? <p className="text-xs text-gray-400 italic">Belum ada log istirahat.</p> : breaks.map((b, idx) => (
              <div key={idx} className="py-2.5 flex justify-between items-center text-xs">
                <div>
                  <p className="font-bold text-gray-900">{b.name}</p>
                  <p className="text-[10px] text-gray-500">{b.type} | Mulai: {b.start_time.split(' ')[1]}</p>
                </div>
                <span className={`px-2 py-0.5 font-bold text-[10px] rounded ${b.end_time === '-' ? 'bg-amber-50 text-amber-700 animate-pulse' : 'bg-gray-100 text-gray-600'}`}>
                  {b.end_time === '-' ? 'On Break' : b.duration}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}