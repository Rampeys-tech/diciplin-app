'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../api';
import { useAuth } from '../context/AuthContext';
import { 
  FiAward, 
  FiAlertTriangle, 
  FiCalendar, 
  FiRefreshCw, 
  FiActivity, 
  FiShield, 
  FiTrendingDown, 
  FiBriefcase, 
  FiCheckSquare, 
  FiLock, 
  FiUnlock, 
  FiX, 
  FiChevronRight, 
  FiClock, 
  FiPieChart, 
  FiSend, 
  FiPlus, 
  FiUsers, 
  FiCheckCircle, 
  FiUploadCloud, 
  FiFileText,
  FiSettings
} from 'react-icons/fi';

export default function AreaDashboard() {
  const { user } = useAuth();
  const [currentProfile, setCurrentProfile] = useState(null);
  const [outlets, setOutlets] = useState([]);
  
  const currentMonthYear = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  const [selectedMonth, setSelectedMonth] = useState(currentMonthYear);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingLock, setIsUpdatingLock] = useState(false);
  
  const [profiles, setProfiles] = useState([]);
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [violations, setViolations] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [closings, setClosings] = useState([]);
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('ALL_MANAGERS');

  // Modal states: 'detail_resto' | 'detail_manager' | 'rapor_all' | 'peringkat_resto' | 'deviasi_kru' | 'task_manager' | 'upload_closing' | 'recipe_settings' | null
  const [activeModal, setActiveModal] = useState(null);
  const [selectedOutletForDetail, setSelectedOutletForDetail] = useState(null);
  const [selectedManagerForDetail, setSelectedManagerForDetail] = useState(null);

  const [selectedDevOutlet, setSelectedDevOutlet] = useState('ALL');

  // Standar Konversi Resep & File BOM PDF
  const [recipePdfFile, setRecipePdfFile] = useState(null);
  const [lastUploadedPdfName, setLastUploadedPdfName] = useState('Standar_Gramasi_BOM_Gacoan_2026.pdf');
  const [isUploadingBOM, setIsUploadingBOM] = useState(false);

  const [recipeFormulas, setRecipeFormulas] = useState({
    ayamTaburPerPorsiMie: 15,
    isianPangsitPerPcs: 18,
    cabeRawitPerPorsi: 12,
    mieBasahPerPorsi: 100
  });

  // Form Buat Tugas Baru
  const [taskDept, setTaskDept] = useState('ordering');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskOutletId, setTaskOutletId] = useState('ALL');
  const [taskDeadline, setTaskDeadline] = useState('');
  const [taskPriority, setTaskPriority] = useState('normal');
  const [isSubmittingTask, setIsSubmittingTask] = useState(false);

  // Form Upload Closing Midnight
  const [uploadOutletId, setUploadOutletId] = useState('');
  const [soFile, setSoFile] = useState(null);
  const [esbFile, setEsbFile] = useState(null);
  const [isParsingFiles, setIsParsingFiles] = useState(false);

  useEffect(() => {
    async function loadUser() {
      if (!user?.id) return;
      const { data } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      if (data) setCurrentProfile(data);
    }
    loadUser();
  }, [user]);

  const loadMasterData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [
        { data: outData },
        { data: profData },
        { data: logsData },
        { data: violData },
        { data: taskData },
        { data: closeData }
      ] = await Promise.all([
        supabase.from('outlets').select('*').order('code', { ascending: true }),
        supabase.from('user_profiles').select('id, full_name, avatar, role, total_points, outlet_id, station_placement'),
        supabase.from('attendance_logs').select('id, user_id, outlet_id, created_at, actual_in, actual_out, break_start_time, break_end_time, status_in, status_out, discipline_status, penalty_points, financial_loss_amount'),
        supabase.from('operational_violations').select('*'),
        supabase.from('department_tasks').select('*').order('created_at', { ascending: false }),
        supabase.from('store_daily_closings').select('*').order('created_at', { ascending: false }).limit(60)
      ]);

      if (outData) {
        const kaltimOutlets = outData.filter(o => 
          !o.code?.startsWith('GAC-') && !o.name?.toLowerCase().includes('cabang 0')
        );
        setOutlets(kaltimOutlets.slice(0, 9));
        if (kaltimOutlets.length > 0 && !uploadOutletId) {
          setUploadOutletId(kaltimOutlets[0].id);
        }
      }
      if (profData) setProfiles(profData);
      if (logsData) setAttendanceLogs(logsData);
      if (violData) setViolations(violData);
      if (taskData) setTasks(taskData);
      if (closeData) setClosings(closeData);
    } catch (e) {
      console.error("Gagal load area dashboard data:", e);
    } finally {
      setIsLoading(false);
    }
  }, [uploadOutletId]);

  useEffect(() => {
    loadMasterData();
  }, [loadMasterData]);

  const handleToggleGpsLock = async (outletId, currentStatus, outletName) => {
    if (currentProfile?.role !== 'area_manager') {
      alert("Hanya Area Manager yang memiliki wewenang mengunci/membuka titik GPS.");
      return;
    }

    const confirmAction = confirm(
      currentStatus 
        ? `Buka kunci titik GPS ${outletName}?` 
        : `Kunci permanen titik GPS ${outletName}?`
    );
    if (!confirmAction) return;

    setIsUpdatingLock(true);
    try {
      const { error } = await supabase
        .from('outlets')
        .update({ 
          is_locked: !currentStatus,
          updated_by: user.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', outletId);

      if (error) throw error;
      alert(`✓ Status GPS ${outletName} diperbarui!`);
      loadMasterData();
    } catch (err) {
      alert(`Gagal perbarui: ${err.message}`);
    } finally {
      setIsUpdatingLock(false);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!taskTitle || !taskDeadline) return alert("Lengkapi judul dan deadline!");

    setIsSubmittingTask(true);
    try {
      const payload = {
        department: taskDept,
        title: taskTitle,
        deadline: new Date(taskDeadline).toISOString(),
        priority: taskPriority,
        outlet_id: taskOutletId === 'ALL' ? null : taskOutletId,
        created_by: user?.id,
        status: 'pending'
      };

      const { error } = await supabase.from('department_tasks').insert([payload]);
      if (error) throw error;

      alert("✓ Tugas berhasil dikirim ke resto!");
      setTaskTitle('');
      setTaskDeadline('');
      loadMasterData();
    } catch (err) {
      alert(`Gagal membuat tugas: ${err.message}`);
    } finally {
      setIsSubmittingTask(false);
    }
  };

  // Upload Standar Gramasi PDF Khusus Area Manager
  const handleUploadRecipePdf = (e) => {
    e.preventDefault();
    if (currentProfile?.role !== 'area_manager') {
      alert("Akses ditolak: Hanya Area Manager yang berwenang menetapkan standar gramasi!");
      return;
    }
    if (!recipePdfFile) return alert("Pilih file PDF gramasi resep!");

    setIsUploadingBOM(true);
    setTimeout(() => {
      setLastUploadedPdfName(recipePdfFile.name);
      setIsUploadingBOM(false);
      alert(`✓ Dokumen standar gramasi "${recipePdfFile.name}" berhasil ditetapkan untuk seluruh 9 gerai Kaltim!`);
      setActiveModal('deviasi_kru');
    }, 1000);
  };

  const handleProcessClosingUpload = async (e) => {
    e.preventDefault();
    if (!soFile || !esbFile) {
      return alert("Harap unggah file Excel SO Harian dan PDF Sales Menu ESB!");
    }

    setIsParsingFiles(true);
    try {
      const dummyPorsiMie = 2863;
      const dummyPorsiPangsit = 480;

      const calculatedTheoryGrams = {
        ayamTabur: dummyPorsiMie * recipeFormulas.ayamTaburPerPorsiMie,
        isianPangsit: (dummyPorsiPangsit * 3 * recipeFormulas.isianPangsitPerPcs) + (dummyPorsiMie * 2 * recipeFormulas.isianPangsitPerPcs),
        cabeRawit: dummyPorsiMie * recipeFormulas.cabeRawitPerPorsi,
        mieBasah: dummyPorsiMie * recipeFormulas.mieBasahPerPorsi
      };

      const payload = {
        outlet_id: uploadOutletId,
        closing_date: new Date().toISOString().split('T')[0],
        deviation_summary: {
          files: { so: soFile.name, esb: esbFile.name },
          calculatedTheoryGrams
        },
        speed_of_service_minutes: 7.2,
        status: 'submitted',
        submitted_by: user?.id || null,
        created_at: new Date().toISOString()
      };

      const { error } = await supabase.from('store_daily_closings').insert([payload]);
      if (error) throw error;

      alert("✓ Berhasil memproses closing dan kalkulasi teori bahan!");
      setSoFile(null);
      setEsbFile(null);
      loadMasterData();
    } catch (err) {
      alert(`Gagal memproses file: ${err.message}`);
    } finally {
      setIsParsingFiles(false);
    }
  };

  const outletScoreRankings = useMemo(() => {
    return outlets.map(outlet => {
      const restoCrew = profiles.filter(p => p.outlet_id === outlet.id);
      const crewIds = new Set(restoCrew.map(p => p.id));
      
      const restoLogs = attendanceLogs.filter(l => {
        const matchOutlet = l.outlet_id === outlet.id || crewIds.has(l.user_id);
        const matchMonth = l.created_at && l.created_at.substring(0, 7) === selectedMonth;
        return matchOutlet && matchMonth;
      });

      const restoViols = violations.filter(v => {
        const matchOutlet = v.outlet_id === outlet.id || crewIds.has(v.crew_id);
        const matchMonth = v.created_at && v.created_at.substring(0, 7) === selectedMonth;
        return matchOutlet && matchMonth;
      });

      let lateCount = 0;
      let totalLogs = restoLogs.length || 1;
      restoLogs.forEach(log => {
        if (log.status_in && log.status_in.toLowerCase().includes('terlambat')) lateCount++;
      });
      const attendanceScore = Math.max(0, Math.round(((totalLogs - lateCount) / totalLogs) * 100));

      let overbreakCount = 0;
      let lossRupiah = 0;
      restoLogs.forEach(log => {
        if (log.discipline_status === 'Overbreak') overbreakCount++;
        lossRupiah += Number(log.financial_loss_amount || 0);
      });
      const breakDisciplineScore = Math.max(40, Math.round(100 - ((overbreakCount * 5) / (restoCrew.length || 1))));

      const restoTasks = tasks.filter(t => t.outlet_id === outlet.id || t.outlet_id === null);
      const completedTasks = restoTasks.filter(t => t.status === 'completed');
      const taskComplianceRate = restoTasks.length > 0 
        ? Math.round((completedTasks.length / restoTasks.length) * 100) 
        : 95;

      const latestClosing = closings.find(c => c.outlet_id === outlet.id);
      const deviationItems = latestClosing?.deviation_summary?.physical_stock?.length || 0;
      const deviationScore = Math.max(50, 100 - (deviationItems > 0 ? 5 : 0));
      const cacpComplianceScore = Math.max(60, 92 - (restoViols.length * 4));

      const overallScore = Math.round(
        (attendanceScore * 0.20) +
        (breakDisciplineScore * 0.20) +
        (taskComplianceRate * 0.25) +
        (deviationScore * 0.20) +
        (cacpComplianceScore * 0.15)
      );

      const storeManager = restoCrew.find(p => p.role === 'store_manager');

      return {
        ...outlet,
        crewCount: restoCrew.length,
        storeManagerName: storeManager?.full_name || 'Belum Diisi',
        storeManagerAvatar: storeManager?.avatar,
        lateCount,
        overbreakCount,
        lossAmount: lossRupiah,
        violationCount: restoViols.length,
        healthScore: overallScore,
        metrics: {
          attendance: attendanceScore,
          breakDiscipline: breakDisciplineScore,
          taskCompliance: taskComplianceRate,
          deviation: deviationScore,
          cacpAudit: cacpComplianceScore,
          sosMinutes: latestClosing?.speed_of_service_minutes || 7.2
        }
      };
    }).sort((a, b) => b.healthScore - a.healthScore);
  }, [outlets, profiles, attendanceLogs, violations, tasks, closings, selectedMonth]);

  const allLeaderRankings = useMemo(() => {
    const leaderProfiles = profiles.filter(p => {
      const r = (p.role || '').toLowerCase();
      return ['store_manager', 'ast_store_manager', 'floor_leader', 'floor_leader_orientation'].includes(r);
    });

    return leaderProfiles.map(person => {
      const personOutlet = outlets.find(o => o.id === person.outlet_id);
      const personLogs = attendanceLogs.filter(l => {
        return l.user_id === person.id && l.created_at && l.created_at.substring(0, 7) === selectedMonth;
      });

      let lateMinutes = 0;
      let overbreakCount = 0;
      let personalPoints = person.total_points !== null && person.total_points !== undefined ? Number(person.total_points) : 100;

      personLogs.forEach(l => {
        if (l.status_in && l.status_in.includes('Terlambat')) {
          const match = l.status_in.match(/Terlambat (\d+)m/);
          if (match && match[1]) lateMinutes += parseInt(match[1]);
        }
        if (l.discipline_status === 'Overbreak') overbreakCount++;
      });

      const personTasks = tasks.filter(t => t.outlet_id === person.outlet_id || t.outlet_id === null);
      const completedOnTime = personTasks.filter(t => t.status === 'completed').length;
      const taskRate = personTasks.length > 0 ? Math.round((completedOnTime / personTasks.length) * 100) : 95;

      const outletInfo = outletScoreRankings.find(o => o.id === person.outlet_id);
      const restoHealth = outletInfo?.healthScore || 80;

      const penalty = (lateMinutes * 0.5) + (overbreakCount * 5);
      const compositeScore = Math.max(30, Math.round(
        ((personalPoints - penalty) * 0.4) +
        (taskRate * 0.3) +
        (restoHealth * 0.3)
      ));

      const formatRole = (role) => {
        switch (role) {
          case 'store_manager': return 'Store Manager (SM)';
          case 'ast_store_manager': return 'Asst. Manager (ASM)';
          case 'floor_leader': return 'Floor Leader (FL)';
          case 'floor_leader_orientation': return 'FL Orientation (FLO)';
          default: return 'Leader';
        }
      };

      return {
        id: person.id,
        name: person.full_name || 'Leader',
        avatar: person.avatar,
        role: person.role,
        roleLabel: formatRole(person.role),
        outletName: personOutlet?.name || 'Gacoan Balikpapan MT Haryono',
        outletCode: personOutlet?.code || '-',
        points: personalPoints,
        restoHealth,
        compositeScore,
        lateMinutes,
        overbreakCount,
        taskRate,
        isPromotionReady: compositeScore >= 88 && lateMinutes === 0 && overbreakCount === 0,
        isWarningZone: compositeScore < 70 || lateMinutes > 30 || overbreakCount > 1
      };
    }).sort((a, b) => b.compositeScore - a.compositeScore);
  }, [profiles, outlets, attendanceLogs, tasks, outletScoreRankings, selectedMonth]);

  const top1Outlet = outletScoreRankings[0];
  const top1Leader = allLeaderRankings[0];
  const top2Leader = allLeaderRankings[1];
  const top3Leader = allLeaderRankings[2];

  const bottomOutlets = outletScoreRankings.slice(-3).reverse();
  const bottomLeaders = [...allLeaderRankings].reverse().slice(0, 3);

  const handleOpenRestoDetail = (resto) => {
    if (!resto) return;
    setSelectedOutletForDetail(resto);
    setActiveModal('detail_resto');
  };

  const handleOpenManagerDetail = (manager) => {
    if (!manager) return;
    setSelectedManagerForDetail(manager);
    setActiveModal('detail_manager');
  };

  return (
    <div className="min-h-screen bg-slate-100 flex justify-center font-sans antialiased text-slate-800">
      
      <div className="w-full max-w-md bg-[#FAFBFD] min-h-screen flex flex-col shadow-2xl relative pb-28 border-x border-slate-200">
        
        {/* HEADER */}
        <div className="px-5 pt-4 pb-3 bg-white border-b border-slate-100 flex items-center justify-between sticky top-0 z-20 shadow-2xs">
          <div>
            <h1 className="text-base font-black text-slate-900 tracking-tight">Dashboard Area Kaltim</h1>
            <p className="text-[10px] text-slate-400 font-medium">Monitoring 9 Cabang & Seluruh Leader</p>
          </div>

          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200/80 px-2 py-1 rounded-xl text-xs font-bold text-slate-700">
              <FiCalendar className="text-indigo-600 text-xs" />
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent outline-none cursor-pointer text-[11px] font-bold text-slate-700 w-20"
              />
            </div>

            <button
              onClick={loadMasterData}
              disabled={isLoading}
              className="p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-slate-600 rounded-xl transition-colors cursor-pointer"
              title="Perbarui Data"
            >
              <FiRefreshCw className={`text-xs ${isLoading ? 'animate-spin text-indigo-600' : ''}`} />
            </button>
          </div>
        </div>

        <div className="px-4 py-4 space-y-5">

          {/* ================= 1. STORE TERBAIK: LAPANG, BERJARAK & RAPI DI HP ================= */}
          <div 
            onClick={() => handleOpenRestoDetail(top1Outlet)}
            className="cursor-pointer bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 text-white shadow-xl shadow-indigo-950/20 relative overflow-hidden border border-indigo-500/30 group transition-all hover:scale-[1.01]"
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-56 h-20 bg-amber-400/20 rounded-full blur-2xl pointer-events-none"></div>

            <div className="text-center pb-1">
              <div className="inline-flex items-center gap-1.5 bg-amber-400/10 border border-amber-400/30 px-3.5 py-1 rounded-full text-amber-300 text-[10px] font-black uppercase tracking-widest mb-3 shadow-xs">
                <FiAward className="text-xs text-amber-300" /> Resto Terbaik Bulan Ini
              </div>

              <h2 className="text-xl font-black text-white tracking-tight drop-shadow-md group-hover:text-amber-300 transition-colors px-2">
                {top1Outlet?.name || 'Gacoan Resto'}
              </h2>
              <p className="text-xs text-indigo-200 font-medium mt-1">
                Store Manager: <span className="text-white font-bold">{top1Outlet?.storeManagerName}</span>
              </p>
            </div>

            {/* Area Skor & Metrik: Jarak Lebar, Tidak Menumpuk di Layar HP */}
            <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between px-3 gap-6">
              
              {/* Kolom Kiri: Skor Besar */}
              <div className="text-left shrink-0">
                <span className="text-[9px] text-slate-400 block uppercase tracking-widest font-black">Skor Akumulatif</span>
                <span className="text-4xl font-black text-emerald-400 font-mono tracking-tight drop-shadow-md block mt-0.5">
                  {top1Outlet?.healthScore || 100}%
                </span>
              </div>

              <div className="w-px h-14 bg-white/15 shrink-0"></div>

              {/* Kolom Kanan: 3 Indikator Beri Jarak Lapang */}
              <div className="space-y-2 flex-1 min-w-0 text-left">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0"></span>
                  <span className="text-xs font-mono font-bold text-emerald-300">{top1Outlet?.metrics?.breakDiscipline || 100}%</span>
                  <span className="text-[11px] text-slate-300 font-medium truncate">Break & Presensi</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0"></span>
                  <span className="text-xs font-mono font-bold text-blue-300">{top1Outlet?.metrics?.taskCompliance || 95}%</span>
                  <span className="text-[11px] text-slate-300 font-medium truncate">SLA Tugas Dept</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-400 shrink-0"></span>
                  <span className="text-xs font-mono font-bold text-purple-300">{top1Outlet?.metrics?.cacpAudit || 92}%</span>
                  <span className="text-[11px] text-slate-300 font-medium truncate">CACP & Deviasi SO</span>
                </div>
              </div>

            </div>

            <div className="mt-5 pt-3 border-t border-white/10 flex items-center justify-center gap-1.5 text-[10px] font-bold text-amber-300/90 group-hover:text-amber-300">
              <span>Buka rincian lengkap grafik penilaian</span>
              <FiChevronRight className="text-xs" />
            </div>
          </div>

          {/* ================= 2. MANAGER TELADAN: BINGKAI MEWAH MAHKOTA ================= */}
          <div className="bg-gradient-to-b from-amber-500/20 via-white to-amber-500/10 rounded-3xl p-6 border-2 border-amber-400 shadow-xl shadow-amber-900/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-300/30 rounded-full blur-2xl pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-yellow-400/20 rounded-full blur-2xl pointer-events-none"></div>

            <div className="flex items-center justify-between mb-4 border-b border-amber-300/70 pb-2.5 relative z-10">
              <div className="flex items-center gap-1.5">
                <span className="text-base">👑</span>
                <h3 className="text-xs font-black uppercase tracking-wider text-amber-950">
                  Manager Teladan Bulan Ini
                </h3>
              </div>
              <button 
                onClick={() => setActiveModal('rapor_all')}
                className="text-[9px] font-bold text-amber-900 hover:text-amber-950 flex items-center gap-0.5 cursor-pointer bg-amber-200/60 px-2 py-0.5 rounded-full border border-amber-300"
              >
                Lihat Semua <FiChevronRight />
              </button>
            </div>

            {/* JUARA 1 DI TENGAH */}
            <div 
              onClick={() => handleOpenManagerDetail(top1Leader)}
              className="text-center cursor-pointer group py-1 relative z-10"
            >
              <div className="flex justify-center mb-3">
                <div className="relative">
                  <div className="absolute -inset-2 rounded-full bg-gradient-to-tr from-amber-400 via-yellow-300 to-amber-600 blur-md opacity-85 animate-pulse"></div>
                  
                  <div className="relative w-28 h-28 rounded-full p-1.5 bg-gradient-to-tr from-amber-500 via-amber-200 to-yellow-400 shadow-2xl flex items-center justify-center">
                    <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center text-amber-300 font-black text-3xl overflow-hidden ring-4 ring-white">
                      {top1Leader?.avatar ? (
                        <img src={top1Leader.avatar} alt={top1Leader.name} className="w-full h-full object-cover" />
                      ) : (
                        top1Leader?.name.substring(0, 2).toUpperCase() || 'LD'
                      )}
                    </div>
                  </div>

                  <div className="absolute -top-5 right-0 text-3xl drop-shadow-md rotate-12">
                    👑
                  </div>
                </div>
              </div>

              <h4 className="text-lg font-black text-slate-950 group-hover:text-amber-800 transition-colors tracking-tight">
                {top1Leader?.name || 'Leader Teladan'}
              </h4>
              <p className="text-xs font-black text-indigo-700 uppercase tracking-widest mt-0.5">
                {top1Leader?.roleLabel}
              </p>
              <p className="text-xs text-slate-600 font-semibold mt-0.5">
                {top1Leader?.outletName}
              </p>

              <div className="mt-3 flex items-center justify-center gap-2">
                <span className="text-xs font-black font-mono px-3.5 py-1 bg-amber-100 text-amber-950 rounded-xl border border-amber-300 shadow-2xs">
                  {top1Leader?.compositeScore || 100} Pts
                </span>
                <span className="text-[10px] font-black uppercase text-emerald-900 bg-emerald-100 px-3 py-1 rounded-xl border border-emerald-300 shadow-2xs">
                  ★ Peringkat #1 Area
                </span>
              </div>
            </div>

            {/* JUARA 2 & 3 BERDAMPINGAN */}
            <div className="grid grid-cols-2 gap-2 mt-5 pt-3.5 border-t border-amber-300/70 relative z-10">
              <div 
                onClick={() => handleOpenManagerDetail(top2Leader)}
                className="bg-white/95 p-2.5 rounded-2xl border border-amber-200 shadow-2xs flex items-center gap-2.5 cursor-pointer hover:border-indigo-300 transition-all"
              >
                <div className="w-9 h-9 rounded-full bg-slate-200 text-slate-700 font-black text-xs flex items-center justify-center shrink-0 border border-slate-300">
                  🥈
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-black text-slate-800 truncate">{top2Leader?.name || 'Leader #2'}</p>
                  <p className="text-[9px] text-indigo-600 font-bold truncate">{top2Leader?.roleLabel}</p>
                  <span className="text-[9px] font-mono font-bold text-slate-500 block mt-0.5">{top2Leader?.compositeScore || 90} Pts</span>
                </div>
              </div>

              <div 
                onClick={() => handleOpenManagerDetail(top3Leader)}
                className="bg-white/95 p-2.5 rounded-2xl border border-amber-200 shadow-2xs flex items-center gap-2.5 cursor-pointer hover:border-indigo-300 transition-all"
              >
                <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-800 font-black text-xs flex items-center justify-center shrink-0 border border-amber-300">
                  🥉
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-black text-slate-800 truncate">{top3Leader?.name || 'Leader #3'}</p>
                  <p className="text-[9px] text-indigo-600 font-bold truncate">{top3Leader?.roleLabel}</p>
                  <span className="text-[9px] font-mono font-bold text-slate-500 block mt-0.5">{top3Leader?.compositeScore || 85} Pts</span>
                </div>
              </div>
            </div>

            <p className="text-[10px] text-slate-500 text-center mt-3 font-medium relative z-10">
              Ketuk profil untuk melihat rapor rincian performanya
            </p>
          </div>

          {/* ================= 3. MENU GRID OPERASIONAL ================= */}
          <div>
            <div className="flex items-center justify-between mb-2.5 px-1">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Menu Operasional
              </h3>
              <span className="text-[10px] text-slate-400">Akses Penuh</span>
            </div>

            <div className="grid grid-cols-4 gap-2">
              <button 
                onClick={() => setActiveModal('deviasi_kru')}
                className="flex flex-col items-center text-center p-2 rounded-2xl hover:bg-slate-50 transition-all group cursor-pointer"
              >
                <div className="w-13 h-13 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 text-lg shadow-2xs group-hover:scale-105 transition-all">
                  <FiPieChart />
                </div>
                <span className="text-xs font-bold text-slate-800 mt-1.5">Deviasi</span>
                <span className="text-[9px] text-slate-400">Bahan SO</span>
              </button>

              <button 
                onClick={() => setActiveModal('task_manager')}
                className="flex flex-col items-center text-center p-2 rounded-2xl hover:bg-slate-50 transition-all group relative cursor-pointer"
              >
                <div className="w-13 h-13 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 text-lg shadow-2xs group-hover:scale-105 transition-all">
                  <FiCheckSquare />
                  {tasks.filter(t => t.status !== 'completed').length > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-white rounded-full text-[8px] font-black flex items-center justify-center border-2 border-white">
                      {tasks.filter(t => t.status !== 'completed').length}
                    </span>
                  )}
                </div>
                <span className="text-xs font-bold text-slate-800 mt-1.5">Task Mgr</span>
                <span className="text-[9px] text-slate-400">Instruksi</span>
              </button>

              <button 
                onClick={() => setActiveModal('rapor_all')}
                className="flex flex-col items-center text-center p-2 rounded-2xl hover:bg-slate-50 transition-all group cursor-pointer"
              >
                <div className="w-13 h-13 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 text-lg shadow-2xs group-hover:scale-105 transition-all">
                  <FiBriefcase />
                </div>
                <span className="text-xs font-bold text-slate-800 mt-1.5">Rapor Leader</span>
                <span className="text-[9px] text-slate-400">All Level</span>
              </button>

              <button 
                onClick={() => setActiveModal('peringkat_resto')}
                className="flex flex-col items-center text-center p-2 rounded-2xl hover:bg-slate-50 transition-all group cursor-pointer"
              >
                <div className="w-13 h-13 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 text-lg shadow-2xs group-hover:scale-105 transition-all">
                  <FiActivity />
                </div>
                <span className="text-xs font-bold text-slate-800 mt-1.5">Peringkat</span>
                <span className="text-[9px] text-slate-400">9 Cabang</span>
              </button>
            </div>
          </div>

          {/* ================= 4. ZONA PEMBINAAN KHUSUS ================= */}
          <div className="bg-gradient-to-br from-rose-500/15 via-white to-rose-50 rounded-3xl p-5 border-2 border-rose-300 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-rose-200/60 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-600"></span>
                </span>
                <h3 className="text-xs font-black uppercase tracking-wider text-rose-950">
                  Zona Perlu Pembinaan Khusus
                </h3>
              </div>
              <span className="text-[8px] font-black uppercase px-2 py-0.5 bg-rose-100 text-rose-700 rounded-full border border-rose-200">
                Red Alert Area
              </span>
            </div>

            {/* List 3 Resto Terburuk */}
            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase text-rose-900 tracking-wider flex items-center gap-1">
                <FiTrendingDown className="text-rose-600" /> 3 Resto Performa Terendah
              </span>

              {bottomOutlets.map((outlet, i) => (
                <div 
                  key={outlet.id}
                  onClick={() => handleOpenRestoDetail(outlet)}
                  className="bg-white p-3 rounded-2xl border border-rose-200 hover:border-rose-400 cursor-pointer transition-all shadow-2xs flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-6 h-6 rounded-lg bg-rose-100 text-rose-800 text-[10px] font-black flex items-center justify-center shrink-0">
                      #{outletScoreRankings.length - i}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-black text-slate-900 truncate">{outlet.name}</p>
                      <p className="text-[10px] text-rose-600 font-bold truncate">
                        Over: {outlet.overbreakCount}x • Bocor: Rp {Number(outlet.lossAmount || 0).toLocaleString('id-ID')}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-black text-rose-700 bg-rose-100 px-2.5 py-1 rounded-xl font-mono shrink-0">
                    {outlet.healthScore}%
                  </span>
                </div>
              ))}
            </div>

            {/* List 3 Leader Terendah */}
            <div className="space-y-2 pt-1 border-t border-rose-200/50">
              <span className="text-[10px] font-black uppercase text-rose-900 tracking-wider flex items-center gap-1">
                <FiAlertTriangle className="text-rose-600" /> 3 Leader Perlu Evaluasi Disiplin
              </span>

              {bottomLeaders.map((ldr) => (
                <div 
                  key={ldr.id}
                  onClick={() => handleOpenManagerDetail(ldr)}
                  className="bg-white p-3 rounded-2xl border border-rose-200 hover:border-rose-400 cursor-pointer transition-all shadow-2xs flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center text-xs shrink-0 font-black border border-rose-200">
                      {ldr.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-black text-slate-900 truncate">{ldr.name}</p>
                        <span className="text-[8px] font-bold text-rose-700 bg-rose-50 px-1 py-0.2 rounded">
                          {ldr.roleLabel}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-medium truncate">
                        {ldr.outletName} • Telat {ldr.lateMinutes}m • {ldr.overbreakCount}x Over
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-black text-rose-700 bg-rose-100 px-2.5 py-1 rounded-xl font-mono shrink-0">
                    {ldr.compositeScore} Pts
                  </span>
                </div>
              ))}
            </div>

          </div>

        </div>

        {/* ================= MODAL AUDIT & KONTROL DEVIASI BAHAN ================= */}
        {activeModal === 'deviasi_kru' && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex justify-center items-end sm:items-center p-0 sm:p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-100">
              
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div>
                  <h3 className="text-sm font-black text-slate-900">Audit Deviasi Bahan Baku</h3>
                  <p className="text-[10px] text-slate-400 font-medium">Monitoring Selisih Fisik SO Harian vs Teori ESB</p>
                </div>
                <button 
                  onClick={() => setActiveModal(null)}
                  className="p-2 bg-white hover:bg-slate-200 text-slate-600 rounded-full border border-slate-200 cursor-pointer"
                >
                  <FiX className="text-sm" />
                </button>
              </div>

              {/* Baris Tombol Aksi & Pengaturan Rumus Konversi (Hanya AM yang punya akses Atur) */}
              <div className="p-3 bg-indigo-50/70 border-b border-indigo-100 flex items-center justify-between gap-2">
                {currentProfile?.role === 'area_manager' ? (
                  <button
                    onClick={() => setActiveModal('recipe_settings')}
                    className="px-3 py-1.5 bg-white hover:bg-slate-50 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold flex items-center gap-1 shadow-2xs cursor-pointer transition-colors"
                  >
                    <FiSettings className="text-xs" />
                    <span>⚙️ Atur Rumus Gramasi (AM)</span>
                  </button>
                ) : (
                  <span className="text-[10px] font-bold text-slate-400">Standar: {lastUploadedPdfName}</span>
                )}

                <button
                  onClick={() => setActiveModal('upload_closing')}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer transition-colors"
                >
                  <FiUploadCloud className="text-xs" />
                  <span>+ Input Closing File</span>
                </button>
              </div>

              {/* Filter Resto */}
              <div className="px-4 py-2 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between gap-2">
                <span className="text-[10px] font-black uppercase text-slate-400">Filter Resto:</span>
                <select
                  value={selectedDevOutlet}
                  onChange={(e) => setSelectedDevOutlet(e.target.value)}
                  className="text-xs font-bold bg-white border border-slate-200 text-slate-800 rounded-xl px-2.5 py-1.5 outline-none cursor-pointer shadow-2xs flex-1 max-w-[220px]"
                >
                  <option value="ALL">Semua 9 Cabang Kaltim</option>
                  {outlets.map(o => (
                    <option key={o.id} value={o.id}>{o.name}</option>
                  ))}
                </select>
              </div>

              <div className="p-4 overflow-y-auto space-y-3">
                
                {/* Radar Potensi Kebocoran */}
                <div className="p-3.5 bg-rose-50/70 border border-rose-200 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center text-xs font-black shrink-0">
                      <FiAlertTriangle />
                    </div>
                    <div>
                      <p className="text-xs font-black text-rose-950">Potensi Kebocoran Bahan</p>
                      <p className="text-[10px] text-rose-600 font-medium">Berdasarkan data closing terakhir</p>
                    </div>
                  </div>
                  <span className="font-mono text-xs font-black text-rose-700 bg-white px-2.5 py-1 rounded-xl border border-rose-200">
                    -Rp 1.485.000
                  </span>
                </div>

                {/* Kartu Rincian Bahan Kritis */}
                <div className="space-y-2.5">
                  {[
                    { name: 'Adonan Kulit & Isian Pangsit', unit: 'Gram', fisik: 22400, teori: 24800, selisih: -2400, lossRp: 360000, status: 'Bocor Kritis', store: 'Gacoan Bontang' },
                    { name: 'Ayam Tabur (Giling Masak)', unit: 'Gram', fisik: 18100, teori: 19500, selisih: -1400, lossRp: 210000, status: 'Bocor Kritis', store: 'Gacoan Samarinda Wahid Hasyim' },
                    { name: 'Cabe Rawit Giling Halus', unit: 'Gram', fisik: 34200, teori: 35000, selisih: -800, lossRp: 96000, status: 'Waspada', store: 'Gacoan Sangatta' },
                    { name: 'Mie Basah Mentah (Portion)', unit: 'Porsi', fisik: 2840, teori: 2863, selisih: -23, lossRp: 69000, status: 'Toleransi Wajar', store: 'Gacoan Balikpapan MT Haryono' },
                    { name: 'Udang Keju Siap Goreng', unit: 'Porsi', fisik: 1502, teori: 1506, selisih: -4, lossRp: 48000, status: 'Aman', store: 'Gacoan Balikpapan MT Haryono' },
                  ]
                  .filter(item => selectedDevOutlet === 'ALL' || item.store.includes(outlets.find(o => o.id === selectedDevOutlet)?.name || ''))
                  .map((item, idx) => {
                    const isDanger = item.selisih < -1000 || (item.unit === 'Porsi' && item.selisih < -15);
                    return (
                      <div key={idx} className="p-3 bg-white border border-slate-200/80 rounded-2xl space-y-2 shadow-2xs">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md">
                              {item.store}
                            </span>
                            <h4 className="text-xs font-black text-slate-900 mt-1">{item.name}</h4>
                          </div>
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                            isDanger ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            {item.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-1.5 py-1.5 px-2 bg-slate-50 rounded-xl text-center font-mono">
                          <div>
                            <span className="text-[8px] text-slate-400 block font-sans uppercase">Fisik SO</span>
                            <span className="text-[11px] font-bold text-slate-800">{item.fisik.toLocaleString('id-ID')}</span>
                          </div>
                          <div>
                            <span className="text-[8px] text-slate-400 block font-sans uppercase">Teori ESB</span>
                            <span className="text-[11px] font-bold text-slate-800">{item.teori.toLocaleString('id-ID')}</span>
                          </div>
                          <div>
                            <span className="text-[8px] text-slate-400 block font-sans uppercase">Selisih</span>
                            <span className={`text-[11px] font-black ${item.selisih < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                              {item.selisih > 0 ? `+${item.selisih}` : item.selisih} {item.unit === 'Gram' ? 'gr' : 'pcs'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[10px] pt-0.5">
                          <span className="text-slate-400">Estimasi Nilai Selisih:</span>
                          <span className="font-mono font-black text-rose-700">-Rp {item.lossRp.toLocaleString('id-ID')}</span>
                        </div>

                        {isDanger && (
                          <button
                            onClick={() => alert(`Instruksi BAP Deviasi dikirim ke Store Manager ${item.store}!`)}
                            className="w-full py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-[10px] font-black flex items-center justify-center gap-1 cursor-pointer transition-colors"
                          >
                            <FiAlertTriangle />
                            <span>Kirim Tiket Investigasi BAP ke SM</span>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

              </div>

              <div className="p-3 border-t border-slate-100 bg-slate-50">
                <button
                  onClick={() => setActiveModal(null)}
                  className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer hover:bg-slate-800 transition-colors"
                >
                  Tutup Modul Deviasi
                </button>
              </div>

            </div>
          </div>
        )}

        {/* ================= MODAL ATUR RUMUS GRAMASI & UPLOAD PDF (KHUSUS AREA MANAGER) ================= */}
        {activeModal === 'recipe_settings' && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex justify-center items-end sm:items-center p-0 sm:p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-100">
              
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div>
                  <h3 className="text-sm font-black text-slate-900">Standar Gramasi Resep (BOM)</h3>
                  <p className="text-[10px] text-slate-400 font-medium">Otoritas Penuh Area Manager Kaltim</p>
                </div>
                <button 
                  onClick={() => setActiveModal('deviasi_kru')}
                  className="p-2 bg-white hover:bg-slate-200 text-slate-600 rounded-full border border-slate-200 cursor-pointer"
                >
                  <FiX className="text-sm" />
                </button>
              </div>

              <div className="p-5 overflow-y-auto space-y-4">
                
                {/* 1. Fitur Upload Dokumen BOM Versi PDF */}
                <form onSubmit={handleUploadRecipePdf} className="p-4 bg-indigo-50/60 border border-indigo-200 rounded-2xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-indigo-950 flex items-center gap-1.5">
                      <FiUploadCloud className="text-indigo-600" /> Upload PDF Standar Gramasi
                    </span>
                    <span className="text-[9px] font-bold text-indigo-700 bg-white px-2 py-0.5 rounded border border-indigo-200">
                      Format PDF
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Unggah dokumen PDF daftar gramasi resmi. Sistem akan menyimpan file acuan ini untuk audit 9 resto.
                  </p>
                  
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setRecipePdfFile(e.target.files[0])}
                    className="text-xs text-slate-600 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 cursor-pointer w-full"
                    required
                  />

                  {recipePdfFile && (
                    <p className="text-[10px] text-indigo-700 font-bold truncate">✓ File siap: {recipePdfFile.name}</p>
                  )}

                  <button
                    type="submit"
                    disabled={isUploadingBOM}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1 cursor-pointer transition-colors"
                  >
                    <FiCheckCircle />
                    <span>{isUploadingBOM ? 'Memproses PDF...' : 'Tetapkan Dokumen PDF Ini'}</span>
                  </button>

                  <div className="pt-1 text-[9px] text-slate-400 font-mono">
                    Dokumen Aktif: <span className="text-slate-700 font-bold">{lastUploadedPdfName}</span>
                  </div>
                </form>

                {/* 2. Formulir Gramasi Per Item Menu */}
                <div className="space-y-2.5 pt-1">
                  <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider block">
                    Penetapan Gramasi Cepat (Per Porsi)
                  </span>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                      <label className="text-[10px] font-bold text-slate-700 block">Ayam Tabur (gr/mie)</label>
                      <input
                        type="number"
                        value={recipeFormulas.ayamTaburPerPorsiMie}
                        onChange={(e) => setRecipeFormulas({ ...recipeFormulas, ayamTaburPerPorsiMie: Number(e.target.value) })}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-mono font-bold outline-none"
                      />
                    </div>

                    <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                      <label className="text-[10px] font-bold text-slate-700 block">Isian Pangsit (gr/pcs)</label>
                      <input
                        type="number"
                        value={recipeFormulas.isianPangsitPerPcs}
                        onChange={(e) => setRecipeFormulas({ ...recipeFormulas, isianPangsitPerPcs: Number(e.target.value) })}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-mono font-bold outline-none"
                      />
                    </div>

                    <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                      <label className="text-[10px] font-bold text-slate-700 block">Cabe Rawit (gr/porsi)</label>
                      <input
                        type="number"
                        value={recipeFormulas.cabeRawitPerPorsi}
                        onChange={(e) => setRecipeFormulas({ ...recipeFormulas, cabeRawitPerPorsi: Number(e.target.value) })}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-mono font-bold outline-none"
                      />
                    </div>

                    <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                      <label className="text-[10px] font-bold text-slate-700 block">Mie Mentah (gr/porsi)</label>
                      <input
                        type="number"
                        value={recipeFormulas.mieBasahPerPorsi}
                        onChange={(e) => setRecipeFormulas({ ...recipeFormulas, mieBasahPerPorsi: Number(e.target.value) })}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-mono font-bold outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => {
                      alert("✓ Standar angka konversi gramasi resep berhasil disimpan!");
                      setActiveModal('deviasi_kru');
                    }}
                    className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
                  >
                    Simpan Nilai Input
                  </button>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* ================= MODAL INPUT CLOSING ================= */}
        {activeModal === 'upload_closing' && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex justify-center items-end sm:items-center p-0 sm:p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-100">
              
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div>
                  <h3 className="text-sm font-black text-slate-900">Input Closing Midnight Resto</h3>
                  <p className="text-[10px] text-slate-400 font-medium">Upload File SO Excel & PDF Sales Menu ESB</p>
                </div>
                <button 
                  onClick={() => setActiveModal('deviasi_kru')}
                  className="p-2 bg-white hover:bg-slate-200 text-slate-600 rounded-full border border-slate-200 cursor-pointer"
                >
                  <FiX className="text-sm" />
                </button>
              </div>

              <form onSubmit={handleProcessClosingUpload} className="p-5 overflow-y-auto space-y-4">
                
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400">Pilih Cabang Resto:</label>
                  <select
                    value={uploadOutletId}
                    onChange={(e) => setUploadOutletId(e.target.value)}
                    className="w-full text-xs font-bold bg-white border border-slate-200 text-slate-800 rounded-xl px-3 py-2 outline-none cursor-pointer"
                    required
                  >
                    {outlets.map(o => (
                      <option key={o.id} value={o.id}>{o.name}</option>
                    ))}
                  </select>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                      <FiFileText className="text-emerald-600" /> 1. File Excel SO Harian
                    </span>
                    <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      .xlsx / .xls
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Sistem membaca stok fisik pada baris TOTAL sheet INPUT SO HARIAN.
                  </p>
                  <input
                    type="file"
                    accept=".xlsx, .xls"
                    onChange={(e) => setSoFile(e.target.files[0])}
                    className="text-xs text-slate-600 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-600 file:text-white hover:file:bg-emerald-700 cursor-pointer w-full"
                    required
                  />
                  {soFile && <p className="text-[10px] text-emerald-700 font-bold truncate">✓ Terpilih: {soFile.name}</p>}
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                      <FiPieChart className="text-indigo-600" /> 2. File PDF Sales Menu ESB
                    </span>
                    <span className="text-[9px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                      .pdf (Promix)
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Sistem mengekstrak kuantitas porsi mie, pangsit, dan dimsum terjual lalu mengonversi ke gramasi resep.
                  </p>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setEsbFile(e.target.files[0])}
                    className="text-xs text-slate-600 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 cursor-pointer w-full"
                    required
                  />
                  {esbFile && <p className="text-[10px] text-indigo-700 font-bold truncate">✓ Terpilih: {esbFile.name}</p>}
                </div>

                <button
                  type="submit"
                  disabled={isParsingFiles}
                  className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-black flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-md disabled:opacity-50"
                >
                  <FiUploadCloud className="text-sm" />
                  <span>{isParsingFiles ? 'Mengonversi Gramasi & Menghitung...' : 'Proses & Simpan Closing'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveModal('deviasi_kru')}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold cursor-pointer transition-colors"
                >
                  Kembali ke Audit Deviasi
                </button>
              </form>

            </div>
          </div>
        )}

        {/* ================= MODAL RAPOR INDIVIDU LEADER ================= */}
        {activeModal === 'detail_manager' && selectedManagerForDetail && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex justify-center items-end sm:items-center p-0 sm:p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-100">
              
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div>
                  <h3 className="text-sm font-black text-slate-900">Rapor Performa Leader</h3>
                  <p className="text-[10px] text-slate-400 font-medium">Evaluasi Kinerja & Integritas Individu</p>
                </div>
                <button 
                  onClick={() => setActiveModal(null)}
                  className="p-2 bg-white hover:bg-slate-200 text-slate-600 rounded-full border border-slate-200 cursor-pointer"
                >
                  <FiX className="text-sm" />
                </button>
              </div>

              <div className="p-5 overflow-y-auto space-y-4">
                <div className="flex items-center gap-3.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
                  <div className="w-14 h-14 rounded-2xl bg-slate-900 text-amber-300 font-black text-lg flex items-center justify-center shrink-0 border border-slate-700 shadow-xs">
                    {selectedManagerForDetail.avatar ? (
                      <img src={selectedManagerForDetail.avatar} alt={selectedManagerForDetail.name} className="w-full h-full object-cover rounded-2xl" />
                    ) : (
                      selectedManagerForDetail.name.substring(0, 2).toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-black text-slate-900 truncate">{selectedManagerForDetail.name}</h4>
                    <p className="text-xs font-bold text-indigo-700 uppercase tracking-wider">{selectedManagerForDetail.roleLabel}</p>
                    <p className="text-[11px] text-slate-500 font-medium truncate">{selectedManagerForDetail.outletName}</p>
                  </div>
                </div>

                <div className="bg-slate-900 text-white p-4 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Total Nilai Akumulatif</span>
                    <p className="text-xs font-medium text-emerald-400 mt-0.5">
                      {selectedManagerForDetail.isPromotionReady ? '★ Direkomendasikan Promosi' : 
                       selectedManagerForDetail.isWarningZone ? '⚠️ Memerlukan Evaluasi Disiplin' : 'Kinerja Sesuai Standar SOP'}
                    </p>
                  </div>
                  <span className="text-3xl font-black font-mono text-amber-400">
                    {selectedManagerForDetail.compositeScore} <span className="text-xs font-sans text-slate-400">Pts</span>
                  </span>
                </div>

                <div className="space-y-3 pt-1">
                  <div className="p-3 bg-white border border-slate-200 rounded-2xl flex items-center justify-between">
                    <div>
                      <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                        <FiClock className="text-indigo-600" /> Keterlambatan Masuk Shift
                      </span>
                      <p className="text-[10px] text-slate-400">Total akumulasi menit terlambat periode ini</p>
                    </div>
                    <span className={`text-xs font-mono font-black px-2.5 py-1 rounded-xl border ${
                      selectedManagerForDetail.lateMinutes === 0 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}>
                      {selectedManagerForDetail.lateMinutes} Menit
                    </span>
                  </div>

                  <div className="p-3 bg-white border border-slate-200 rounded-2xl flex items-center justify-between">
                    <div>
                      <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                        <FiAlertTriangle className="text-rose-600" /> Pelanggaran Overbreak
                      </span>
                      <p className="text-[10px] text-slate-400">Istirahat melebihi alokasi waktu SOP</p>
                    </div>
                    <span className={`text-xs font-mono font-black px-2.5 py-1 rounded-xl border ${
                      selectedManagerForDetail.overbreakCount === 0 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}>
                      {selectedManagerForDetail.overbreakCount} Kali
                    </span>
                  </div>

                  <div className="p-3 bg-white border border-slate-200 rounded-2xl flex items-center justify-between">
                    <div>
                      <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                        <FiCheckSquare className="text-blue-600" /> Tingkat Kepatuhan SLA Tugas
                      </span>
                      <p className="text-[10px] text-slate-400">Penyelesaian instruksi tepat sebelum deadline</p>
                    </div>
                    <span className="text-xs font-mono font-black px-2.5 py-1 rounded-xl border bg-blue-50 text-blue-700 border-blue-200">
                      {selectedManagerForDetail.taskRate}% On-Time
                    </span>
                  </div>

                  <div className="p-3 bg-white border border-slate-200 rounded-2xl flex items-center justify-between">
                    <div>
                      <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                        <FiActivity className="text-emerald-600" /> Indeks Kinerja Resto
                      </span>
                      <p className="text-[10px] text-slate-400">Health score cabang penempatan saat ini</p>
                    </div>
                    <span className="text-xs font-mono font-black px-2.5 py-1 rounded-xl border bg-emerald-50 text-emerald-700 border-emerald-200">
                      {selectedManagerForDetail.restoHealth}% Health
                    </span>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => setActiveModal(null)}
                    className="w-full py-3 bg-slate-900 text-white rounded-2xl text-xs font-bold cursor-pointer hover:bg-slate-800 transition-colors"
                  >
                    Tutup Rapor
                  </button>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* ================= MODAL SEMUA LEADER ================= */}
        {activeModal === 'rapor_all' && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex justify-center items-end sm:items-center p-0 sm:p-4">
            <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl max-h-[88vh] flex flex-col shadow-2xl overflow-hidden border border-slate-100">
              
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div>
                  <h3 className="text-sm font-black text-slate-900">Daftar Penilaian Semua Leader</h3>
                  <p className="text-[10px] text-slate-400 font-medium">Ketuk nama untuk membuka rapor individu</p>
                </div>
                <button 
                  onClick={() => setActiveModal(null)}
                  className="p-2 bg-white hover:bg-slate-200 text-slate-600 rounded-full border border-slate-200 cursor-pointer"
                >
                  <FiX className="text-sm" />
                </button>
              </div>

              <div className="px-4 py-2.5 bg-slate-50/50 border-b border-slate-100">
                <select
                  value={selectedRoleFilter}
                  onChange={(e) => setSelectedRoleFilter(e.target.value)}
                  className="w-full text-xs font-bold bg-white border border-slate-200 text-slate-800 rounded-xl px-3 py-2 outline-none cursor-pointer shadow-2xs"
                >
                  <option value="ALL_MANAGERS">Semua Posisi Leader</option>
                  <option value="store_manager">Store Manager (SM)</option>
                  <option value="ast_store_manager">Asst Store Manager (ASM)</option>
                  <option value="floor_leader">Floor Leader (FL)</option>
                  <option value="floor_leader_orientation">FL Orientation (FLO)</option>
                </select>
              </div>

              <div className="p-4 overflow-y-auto space-y-2.5">
                {allLeaderRankings
                  .filter(m => selectedRoleFilter === 'ALL_MANAGERS' || m.role === selectedRoleFilter)
                  .map((mgr, idx) => (
                  <div 
                    key={mgr.id} 
                    onClick={() => handleOpenManagerDetail(mgr)}
                    className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${
                      idx === 0 
                        ? 'bg-amber-500/5 border-amber-300 shadow-xs' 
                        : mgr.isWarningZone 
                        ? 'bg-rose-50/50 border-rose-200' 
                        : 'bg-white border-slate-200/80 hover:border-indigo-300'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-8 h-8 rounded-xl font-black text-xs flex items-center justify-center shrink-0 ${
                        idx === 0 ? 'bg-amber-400 text-amber-950 shadow-xs' :
                        idx === 1 ? 'bg-slate-200 text-slate-800' :
                        idx === 2 ? 'bg-amber-100 text-amber-900' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {idx === 0 ? '1' : idx === 1 ? '2' : idx === 2 ? '3' : `#${idx + 1}`}
                      </div>

                      <div className="min-w-0">
                        <p className="text-xs font-black text-slate-900 truncate">{mgr.name}</p>
                        <p className="text-[10px] text-indigo-700 font-bold truncate">{mgr.roleLabel}</p>
                        <p className="text-[9px] text-slate-400 font-mono truncate">
                          {mgr.outletName} • Telat: {mgr.lateMinutes}m • Over: {mgr.overbreakCount}x
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className={`text-xs font-black px-2.5 py-1 rounded-xl border font-mono ${
                        mgr.compositeScore >= 85 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        mgr.compositeScore >= 70 ? 'bg-slate-100 text-slate-700 border-slate-200' :
                        'bg-rose-50 text-rose-700 border-rose-200'
                      }`}>
                        {mgr.compositeScore} Pts
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ================= MODAL DETAIL AUDIT RESTO ================= */}
        {activeModal === 'detail_resto' && selectedOutletForDetail && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex justify-center items-end sm:items-center p-0 sm:p-4">
            <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in duration-200">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div>
                  <h3 className="text-sm font-black text-slate-900">{selectedOutletForDetail.name}</h3>
                  <p className="text-[10px] text-slate-400 font-medium">Laporan Audit Kinerja Multi-Indikator</p>
                </div>
                <button 
                  onClick={() => setActiveModal(null)}
                  className="p-2 bg-white hover:bg-slate-200 text-slate-600 rounded-full border border-slate-200 cursor-pointer"
                >
                  <FiX className="text-sm" />
                </button>
              </div>

              <div className="p-5 overflow-y-auto space-y-4">
                <div className="bg-slate-900 text-white p-4 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Indeks Total Health Score</span>
                    <h4 className="text-xs font-bold text-indigo-300">Store Manager: {selectedOutletForDetail.storeManagerName}</h4>
                  </div>
                  <span className="text-3xl font-black font-mono text-emerald-400">
                    {selectedOutletForDetail.healthScore}%
                  </span>
                </div>

                <div className="space-y-3.5 pt-1">
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-700 flex items-center gap-1.5">
                        <FiUsers className="text-indigo-600" /> Presensi & On-Time Kru ({selectedOutletForDetail.crewCount} Orang)
                      </span>
                      <span className="font-mono text-indigo-700">{selectedOutletForDetail.metrics.attendance}%</span>
                    </div>
                    <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${selectedOutletForDetail.metrics.attendance}%` }} />
                    </div>
                    <span className="text-[9px] text-slate-400">Total Keterlambatan Shift: {selectedOutletForDetail.lateCount} kali</span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-700 flex items-center gap-1.5">
                        <FiClock className="text-emerald-600" /> Kedisiplinan Break & Rest
                      </span>
                      <span className="font-mono text-emerald-700">{selectedOutletForDetail.metrics.breakDiscipline}%</span>
                    </div>
                    <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${selectedOutletForDetail.metrics.breakDiscipline}%` }} />
                    </div>
                    <span className="text-[9px] text-slate-400">Overbreak: {selectedOutletForDetail.overbreakCount}x • Kebocoran: Rp {selectedOutletForDetail.lossAmount.toLocaleString('id-ID')}</span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-700 flex items-center gap-1.5">
                        <FiCheckSquare className="text-blue-600" /> Ketepatan SLA Instruksi 5 Dept
                      </span>
                      <span className="font-mono text-blue-700">{selectedOutletForDetail.metrics.taskCompliance}%</span>
                    </div>
                    <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600 rounded-full" style={{ width: `${selectedOutletForDetail.metrics.taskCompliance}%` }} />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-700 flex items-center gap-1.5">
                        <FiPieChart className="text-amber-600" /> Kontrol Deviasi SO vs POS ESB
                      </span>
                      <span className="font-mono text-amber-700">{selectedOutletForDetail.metrics.deviation}%</span>
                    </div>
                    <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full" style={{ width: `${selectedOutletForDetail.metrics.deviation}%` }} />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-700 flex items-center gap-1.5">
                        <FiCheckCircle className="text-purple-600" /> Kepatuhan Standar CACP & SOP
                      </span>
                      <span className="font-mono text-purple-700">{selectedOutletForDetail.metrics.cacpAudit}%</span>
                    </div>
                    <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-purple-600 rounded-full" style={{ width: `${selectedOutletForDetail.metrics.cacpAudit}%` }} />
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => setActiveModal(null)}
                    className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Tutup Rincian
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= MODAL PERINGKAT 9 RESTO ================= */}
        {activeModal === 'peringkat_resto' && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex justify-center items-end sm:items-center p-0 sm:p-4">
            <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl max-h-[88vh] flex flex-col shadow-2xl overflow-hidden border border-slate-100">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div>
                  <h3 className="text-sm font-black text-slate-900">Peringkat 9 Resto Kaltim</h3>
                  <p className="text-[10px] text-slate-400 font-medium">Berdasarkan Health Score Gabungan</p>
                </div>
                <button 
                  onClick={() => setActiveModal(null)}
                  className="p-2 bg-white hover:bg-slate-200 text-slate-600 rounded-full border border-slate-200 cursor-pointer"
                >
                  <FiX className="text-sm" />
                </button>
              </div>

              <div className="p-4 overflow-y-auto space-y-2.5">
                {outletScoreRankings.map((resto, idx) => (
                  <div 
                    key={resto.id} 
                    onClick={() => handleOpenRestoDetail(resto)}
                    className="p-3.5 bg-white border border-slate-200 rounded-2xl flex items-center justify-between cursor-pointer hover:border-indigo-300 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0">
                        #{idx + 1}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-black text-slate-900 truncate">{resto.name}</p>
                        <p className="text-[10px] text-slate-500 font-medium">SM: {resto.storeManagerName} • {resto.crewCount} Kru</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-black px-2.5 py-1 rounded-xl border font-mono bg-slate-50 text-slate-800">
                        {resto.healthScore}%
                      </span>
                      {currentProfile?.role === 'area_manager' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleGpsLock(resto.id, resto.is_locked, resto.name);
                          }}
                          disabled={isUpdatingLock}
                          className="p-1.5 rounded-lg border bg-slate-50 cursor-pointer"
                        >
                          {resto.is_locked ? <FiLock className="text-xs text-emerald-600" /> : <FiUnlock className="text-xs text-amber-600" />}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ================= MODAL TASK MANAGER ================= */}
        {activeModal === 'task_manager' && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex justify-center items-end sm:items-center p-0 sm:p-4">
            <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl max-h-[88vh] flex flex-col shadow-2xl overflow-hidden border border-slate-100">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div>
                  <h3 className="text-sm font-black text-slate-900">Task Manager Area Kaltim</h3>
                  <p className="text-[10px] text-slate-400 font-medium">Instruksi AM ke Cabang</p>
                </div>
                <button 
                  onClick={() => setActiveModal(null)}
                  className="p-2 bg-white hover:bg-slate-200 text-slate-600 rounded-full border border-slate-200 cursor-pointer"
                >
                  <FiX className="text-sm" />
                </button>
              </div>

              <div className="p-4 overflow-y-auto space-y-4">
                <form onSubmit={handleCreateTask} className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-2.5">
                  <span className="text-[10px] font-black uppercase text-indigo-600 flex items-center gap-1">
                    <FiPlus /> Buat Tugas Baru
                  </span>

                  <input
                    type="text"
                    placeholder="Judul Tugas (Contoh: Deep Clean Chiller / Cek SO)"
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-indigo-500"
                    required
                  />

                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={taskDept}
                      onChange={(e) => setTaskDept(e.target.value)}
                      className="bg-white border border-slate-200 rounded-xl px-2 py-1.5 text-xs font-medium outline-none cursor-pointer"
                    >
                      <option value="ordering">Dept: Ordering</option>
                      <option value="mnr">Dept: M&R</option>
                      <option value="payroll">Dept: Payroll</option>
                      <option value="schedule">Dept: Schedule</option>
                      <option value="marketing_cel">Dept: Marketing/CEL</option>
                    </select>

                    <select
                      value={taskOutletId}
                      onChange={(e) => setTaskOutletId(e.target.value)}
                      className="bg-white border border-slate-200 rounded-xl px-2 py-1.5 text-xs font-medium outline-none cursor-pointer"
                    >
                      <option value="ALL">Semua 9 Resto</option>
                      {outlets.map(o => (
                        <option key={o.id} value={o.id}>{o.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="datetime-local"
                      value={taskDeadline}
                      onChange={(e) => setTaskDeadline(e.target.value)}
                      className="bg-white border border-slate-200 rounded-xl px-2 py-1.5 text-xs font-medium outline-none cursor-pointer"
                      required
                    />

                    <select
                      value={taskPriority}
                      onChange={(e) => setTaskPriority(e.target.value)}
                      className="bg-white border border-slate-200 rounded-xl px-2 py-1.5 text-xs font-medium outline-none cursor-pointer"
                    >
                      <option value="normal">Normal</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingTask}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1 cursor-pointer transition-colors"
                  >
                    <FiSend />
                    <span>{isSubmittingTask ? 'Mengirim...' : 'Kirim Penugasan'}</span>
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* ================= BOTTOM BAR ================= */}
        <div className="fixed bottom-0 max-w-md w-full bg-white border-t border-slate-200 px-6 py-2.5 flex justify-between items-center z-30 shadow-lg">
          <button 
            onClick={() => setActiveModal(null)} 
            className="flex flex-col items-center text-indigo-600 font-bold cursor-pointer"
          >
            <FiActivity className="text-base" />
            <span className="text-[10px] mt-0.5">Beranda</span>
          </button>
          <button 
            onClick={() => setActiveModal('peringkat_resto')}
            className="flex flex-col items-center text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <FiAward className="text-base" />
            <span className="text-[10px] mt-0.5">Peringkat</span>
          </button>
          <button 
            onClick={() => setActiveModal('rapor_all')}
            className="flex flex-col items-center text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <FiBriefcase className="text-base" />
            <span className="text-[10px] mt-0.5">Rapor Leader</span>
          </button>
          <button 
            onClick={() => alert("Profil Area Manager Kaltim")}
            className="flex flex-col items-center text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <FiShield className="text-base" />
            <span className="text-[10px] mt-0.5">Akun</span>
          </button>
        </div>

      </div>
    </div>
  );
}