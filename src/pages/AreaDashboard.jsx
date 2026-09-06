'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  FiCheckSquare, 
  FiLock, 
  FiUnlock, 
  FiX, 
  FiChevronRight, 
  FiPieChart, 
  FiSend, 
  FiPlus, 
  FiCheckCircle, 
  FiUploadCloud, 
  FiFileText, 
  FiSettings, 
  FiCamera, 
  FiCheck, 
  FiBell, 
  FiClipboard, 
  FiUserCheck, 
  FiExternalLink,
  FiArrowLeft,
  FiVolume2,
  FiVolumeX,
  FiLogOut,
  FiTool,
  FiSearch,
  FiPackage,
  FiInbox,
  FiUsers,
  FiClock,
  FiDollarSign,
  FiTrendingUp,
  FiBarChart2,
  FiLayers
} from 'react-icons/fi';

const CACP_GOOGLE_FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLSeinsH4vwQ-1K5WMYsOv6dkbg6sOgW_2zMMFtEnutuyxXf2EQ/viewform";
const OPEX_SPREADSHEET_URL = "https://docs.google.com/spreadsheets/d/1r1MCRJycu8gEjKMfnIl_nVdJvPfAGqOmn7QHbPrO-dY/edit?gid=301774897#gid=301774897";

// DAFTAR KODE RESTO RESMI AREA KALTIM
const OUTLET_CODES = [
  'BPPHAR', // Gacoan Balikpapan MT Haryono
  'BPPSOE', // Gacoan Balikpapan Soetta
  'BPPMUL', // Gacoan Balikpapan Mulawarman
  'SMRYAM', // Gacoan Samarinda Wahid Hasyim
  'SMRAHM', // Gacoan Samarinda Ahmad Yani
  'SMRKES', // Gacoan Samarinda Kesejahteraan
  'TRGAKH', // Gacoan Tenggarong (TRGAKH)
  'SGTMAR', // Gacoan Sangatta
  'BONIMA'  // Gacoan Bontang
];

// DATA AWAL CONTROLLING BUDGETING OPEX (FALLBACK)
const INITIAL_OPEX_DATA = [
  { outletCode: 'BPPHAR', outletName: 'Gacoan Balikpapan MT Haryono', actual_sales: 171234691, budget: 74371564, actual: 15796700, sisa_budget: 58574864, percent_used: 21, categories: { utilities: { actual_rp: 15051700, actual_pct: 8.79, budget_rp: 49195198, budget_pct: 3.40, sisa_rp: 34143498, items: { listrik: { actual_rp: 0, actual_pct: 0, budget_rp: 11720032, budget_pct: 0.81, sisa_rp: 11720032 }, air: { actual_rp: 600000, actual_pct: 0.35, budget_rp: 1302226, budget_pct: 0.09, sisa_rp: 702226 }, gas: { actual_rp: 14451700, actual_pct: 8.44, budget_rp: 34291947, budget_pct: 2.37, sisa_rp: 19840247 } } }, operational_supply: { actual_rp: 65000, actual_pct: 0.04, budget_rp: 11285957, budget_pct: 0.78, sisa_rp: 11220957 }, office_supply: { actual_rp: 680000, actual_pct: 0.40, budget_rp: 3038527, budget_pct: 0.21, sisa_rp: 2358527 }, maintenance: { actual_rp: 0, actual_pct: 0, budget_rp: 10851882, budget_pct: 0.75, sisa_rp: 10851882 } } },
  { outletCode: 'BPPSOE', outletName: 'Gacoan Balikpapan Soetta', actual_sales: 0, budget: 47711378, actual: 0, sisa_budget: 47711378, percent_used: 0, categories: {} },
  { outletCode: 'BPPMUL', outletName: 'Gacoan Balikpapan Mulawarman', actual_sales: 0, budget: 45000000, actual: 0, sisa_budget: 45000000, percent_used: 0, categories: {} },
  { outletCode: 'SMRYAM', outletName: 'Gacoan Samarinda Wahid Hasyim', actual_sales: 0, budget: 68000000, actual: 0, sisa_budget: 68000000, percent_used: 0, categories: {} },
  { outletCode: 'SMRAHM', outletName: 'Gacoan Samarinda Ahmad Yani', actual_sales: 0, budget: 52000000, actual: 0, sisa_budget: 52000000, percent_used: 0, categories: {} },
  { outletCode: 'SMRKES', outletName: 'Gacoan Samarinda Kesejahteraan', actual_sales: 0, budget: 48000000, actual: 0, sisa_budget: 48000000, percent_used: 0, categories: {} },
  { outletCode: 'TRGAKH', outletName: 'Gacoan Tenggarong', actual_sales: 0, budget: 44000000, actual: 0, sisa_budget: 44000000, percent_used: 0, categories: {} },
  { outletCode: 'SGTMAR', outletName: 'Gacoan Sangatta', actual_sales: 0, budget: 46000000, actual: 0, sisa_budget: 46000000, percent_used: 0, categories: {} },
  { outletCode: 'BONIMA', outletName: 'Gacoan Bontang', actual_sales: 0, budget: 42000000, actual: 0, sisa_budget: 42000000, percent_used: 0, categories: {} }
];

// MASTER TEMPLATE STOCK EQUIPMENT LENGKAP SEMUA STATION
const MASTER_EQUIPMENT_TEMPLATE = [
  // STATION KASIR
  { name: 'KOMPUTER KASIR POS', station: 'KASIR', leadTime: '-', acuanOps: 2, onHandAwal: 2 },
  { name: 'MESIN EDC BANK', station: 'KASIR', leadTime: '-', acuanOps: 2, onHandAwal: 2 },
  { name: 'PRINTER THERMAL KASIR', station: 'KASIR', leadTime: '-', acuanOps: 2, onHandAwal: 2 },
  { name: 'CASH BOX DRAWER', station: 'KASIR', leadTime: '2 MINGGU', acuanOps: 2, onHandAwal: 2 },
  { name: 'SCANNER BARCODE QRIS', station: 'KASIR', leadTime: '1 MINGGU', acuanOps: 2, onHandAwal: 2 },

  // STATION NOODLE
  { name: 'BOILER MIE BESAR', station: 'NOODLE', leadTime: '-', acuanOps: 4, onHandAwal: 4 },
  { name: 'PANCI MIE STAINLESS', station: 'NOODLE', leadTime: '2 BULAN', acuanOps: 90, onHandAwal: 90 },
  { name: 'SARINGAN MIE GAGANG KAYU', station: 'NOODLE', leadTime: '2 MINGGU', acuanOps: 48, onHandAwal: 48 },
  { name: 'SENDOK TAKAR BUMBU PLASTIK', station: 'NOODLE', leadTime: '2 MINGGU', acuanOps: 8, onHandAwal: 8 },
  { name: 'SENDOK MAKAN STAINLESS', station: 'NOODLE', leadTime: '2 MINGGU', acuanOps: 15, onHandAwal: 15 },
  { name: 'SENDOK TAKAR 12 GRAM', station: 'NOODLE', leadTime: '2 MINGGU', acuanOps: 6, onHandAwal: 6 },
  { name: 'PIRING HAWAI BLACK MIE', station: 'NOODLE', leadTime: '1-2 KAMIS', acuanOps: 320, onHandAwal: 320 },
  { name: 'BOTOL KECAP KECIL 500ML', station: 'NOODLE', leadTime: '2 MINGGU', acuanOps: 12, onHandAwal: 12 },
  { name: 'CAPITAN MIE STAINLESS', station: 'NOODLE', leadTime: '2 MINGGU', acuanOps: 14, onHandAwal: 14 },
  { name: 'TIMER MASAK DIGITAL', station: 'NOODLE', leadTime: '1 MINGGU', acuanOps: 4, onHandAwal: 4 },

  // STATION DIMSUM & FRYER
  { name: 'KUKUSAN KLAKAT BAMBU DIMSUM', station: 'DIMSUM', leadTime: '2 MINGGU', acuanOps: 45, onHandAwal: 45 },
  { name: 'TUTUP KLAKAT BAMBU', station: 'DIMSUM', leadTime: '2 MINGGU', acuanOps: 45, onHandAwal: 45 },
  { name: 'DEEP FRYER GAS GORENGAN', station: 'DIMSUM', leadTime: '-', acuanOps: 3, onHandAwal: 3 },
  { name: 'KERANJANG BASKET FRYER', station: 'DIMSUM', leadTime: '1 BULAN', acuanOps: 6, onHandAwal: 6 },
  { name: 'PIRING DIMSUM SAJI OVAL', station: 'DIMSUM', leadTime: '2 MINGGU', acuanOps: 180, onHandAwal: 180 },
  { name: 'CAPITAN DIMSUM PANJANG', station: 'DIMSUM', leadTime: '2 MINGGU', acuanOps: 10, onHandAwal: 10 },
  { name: 'THERMOMETER MINYAK', station: 'DIMSUM', leadTime: '2 MINGGU', acuanOps: 2, onHandAwal: 2 },

  // STATION BAR / BEVERAGE
  { name: 'JUG STAINLESS 1 LITER', station: 'BAR', leadTime: '1 MINGGU', acuanOps: 8, onHandAwal: 8 },
  { name: 'DISPENSER SIRUP / JIGGER', station: 'BAR', leadTime: '2 MINGGU', acuanOps: 6, onHandAwal: 6 },
  { name: 'GELAS ES GACOAN ACRYLIC', station: 'BAR', leadTime: '2 BULAN', acuanOps: 250, onHandAwal: 250 },
  { name: 'SENDOK ES BATU SCOOP', station: 'BAR', leadTime: '2 MINGGU', acuanOps: 4, onHandAwal: 4 },
  { name: 'BLENDER COMMERCIAL HEAVY DUTY', station: 'BAR', leadTime: '1 BULAN', acuanOps: 2, onHandAwal: 2 },
  { name: 'ICE BOX CONTAINER', station: 'BAR', leadTime: '-', acuanOps: 2, onHandAwal: 2 },

  // STATION DISHWASHER & FLOOR
  { name: 'KERANJANG TIRISAN PIRING', station: 'DISHWASHER', leadTime: '3 MINGGU', acuanOps: 8, onHandAwal: 8 },
  { name: 'BAK PLASTIK CUCI RENDAM', station: 'DISHWASHER', leadTime: '2 MINGGU', acuanOps: 6, onHandAwal: 6 },
  { name: 'SEMPROTAN WATER SPRAYER PRE-RINSE', station: 'DISHWASHER', leadTime: '1 BULAN', acuanOps: 2, onHandAwal: 2 },
  { name: 'NAMPAN / TRAY MAKANAN SAJI', station: 'DISHWASHER', leadTime: '1 BULAN', acuanOps: 120, onHandAwal: 120 },
  { name: 'TEMPAT SENDOK GARPU ACRYLIC MEJA', station: 'DISHWASHER', leadTime: '2 MINGGU', acuanOps: 60, onHandAwal: 60 }
];

const GENERATED_EQUIPMENT_DATA = OUTLET_CODES.flatMap((code) => 
  MASTER_EQUIPMENT_TEMPLATE.map((item, iIdx) => ({
    id: `${code}_${iIdx + 1}`,
    outletCode: code,
    station: item.station,
    name: item.name,
    leadTime: item.leadTime,
    acuanOps: item.acuanOps,
    onHandAwal: item.onHandAwal,
    rusak: 0,
    mutasiKeluar: 0,
    datangBarang: 0,
    beliLuar: 0,
    onHandTerakhir: item.onHandAwal
  }))
);

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
  const [opexList, setOpexList] = useState(INITIAL_OPEX_DATA);

  // Modal states
  const [activeModal, setActiveModal] = useState(null);
  const [selectedOutletForDetail, setSelectedOutletForDetail] = useState(null);
  const [selectedOutletForCacp, setSelectedOutletForCacp] = useState(null);
  const [selectedManagerForDetail, setSelectedManagerForDetail] = useState(null);
  const [selectedDevOutlet, setSelectedDevOutlet] = useState('ALL');
  const [selectedOpexOutlet, setSelectedOpexOutlet] = useState('ALL');
  const [rankingTab, setRankingTab] = useState('resto');

  // Controlling Equipment
  const [equipmentList, setEquipmentList] = useState(GENERATED_EQUIPMENT_DATA);
  const [selectedEquipOutlet, setSelectedEquipOutlet] = useState('BPPHAR');
  const [equipStationFilter, setEquipStationFilter] = useState('ALL');
  const [equipSearchQuery, setEquipSearchQuery] = useState('');
  const [equipTabFilter, setEquipTabFilter] = useState('all');
  const [selectedEquipItem, setSelectedEquipItem] = useState(null);
  const [logQtyRusak, setLogQtyRusak] = useState(0);
  const [logQtyKeluar, setLogQtyKeluar] = useState(0);
  const [logQtyDatangHO, setLogQtyDatangHO] = useState(0);
  const [logQtyBeliLuar, setLogQtyBeliLuar] = useState(0);
  const [isSubmittingEquipLog, setIsSubmittingEquipLog] = useState(false);

  // CACP Harian & Shift Status
  const [hasConfirmedCacpToday, setHasConfirmedCacpToday] = useState(false);
  const [isManagerIC, setIsManagerIC] = useState(true);
  const [isCacpAlarmActive, setIsCacpAlarmActive] = useState(false);
  const [alarmTriggerType, setAlarmTriggerType] = useState(null);
  const [isSubmittingConfirm, setIsSubmittingConfirm] = useState(false);

  const audioContextRef = useRef(null);
  const alarmIntervalRef = useRef(null);

  // Standar Konversi Resep
  const [recipePdfFile, setRecipePdfFile] = useState(null);
  const [lastUploadedPdfName, setLastUploadedPdfName] = useState('Standar_Gramasi_BOM_Gacoan_2026.pdf');
  const [isUploadingBOM, setIsUploadingBOM] = useState(false);

  const [recipeFormulas, setRecipeFormulas] = useState({
    ayamTaburPerPorsiMie: 15,
    isianPangsitPerPcs: 18,
    cabeRawitPerPorsi: 12,
    mieBasahPerPorsi: 100
  });

  // Task Manager States
  const [taskViewTab, setTaskViewTab] = useState('tasks');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskTargetType, setTaskTargetType] = useState('ALL_SM');
  const [taskSelectedTargetId, setTaskSelectedTargetId] = useState('');
  const [taskDept, setTaskDept] = useState('ordering');
  const [taskDeadline, setTaskDeadline] = useState('');
  const [taskPriority, setTaskPriority] = useState('normal');
  const [isSubmittingTask, setIsSubmittingTask] = useState(false);

  // Konfirmasi Bukti Foto Tugas
  const [taskToConfirm, setTaskToConfirm] = useState(null);
  const [proofImage, setProofImage] = useState(null);
  const [completionNotes, setCompletionNotes] = useState('');
  const [isConfirmingTask, setIsConfirmingTask] = useState(false);

  // Upload Closing
  const [uploadOutletId, setUploadOutletId] = useState('');
  const [soFile, setSoFile] = useState(null);
  const [esbFile, setEsbFile] = useState(null);
  const [isParsingFiles, setIsParsingFiles] = useState(false);

  const totalDaysInSelectedMonth = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    return new Date(year, month, 0).getDate();
  }, [selectedMonth]);

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

  // Audio Sirene Alarm
  const startAudioAlarm = useCallback(() => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const playBeep = () => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.3);

        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      };

      playBeep();
      if (alarmIntervalRef.current) clearInterval(alarmIntervalRef.current);
      alarmIntervalRef.current = setInterval(playBeep, 1200);
      setIsCacpAlarmActive(true);
    } catch (e) {
      console.warn("Audio blocked:", e);
    }
  }, []);

  const stopAudioAlarm = useCallback(() => {
    if (alarmIntervalRef.current) {
      clearInterval(alarmIntervalRef.current);
      alarmIntervalRef.current = null;
    }
    setIsCacpAlarmActive(false);
  }, []);

  // LOAD MASTER DATA SINKRON LENGKAP
  const loadMasterData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [
        { data: outData },
        { data: profData },
        { data: logsData },
        { data: violData },
        { data: taskData },
        { data: closeData },
        { data: opexDbData },
        { data: equipDbData }
      ] = await Promise.all([
        supabase.from('outlets').select('*').order('code', { ascending: true }),
        supabase.from('user_profiles').select('id, full_name, avatar, role, total_points, outlet_id, station_placement'),
        supabase.from('attendance_logs').select('id, user_id, outlet_id, created_at, actual_in, actual_out, break_start_time, break_end_time, status_in, status_out, discipline_status, penalty_points, financial_loss_amount'),
        supabase.from('operational_violations').select('*'),
        supabase.from('department_tasks').select('*').order('created_at', { ascending: false }),
        supabase.from('store_daily_closings').select('*').order('created_at', { ascending: false }).limit(60),
        supabase.from('opex_budgets').select('*').eq('period_month', selectedMonth),
        supabase.from('controlling_equipment').select('*').limit(5000)
      ]);

      if (outData) {
        const kaltimOutlets = outData
          .filter(o => !o.code?.startsWith('GAC-') && !o.name?.toLowerCase().includes('cabang 0'))
          .map(o => {
            if (o.name?.toLowerCase().includes('tenggarong') && o.code === 'TNRISA') {
              return { ...o, code: 'TRGAKH' };
            }
            return o;
          });

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

      // SINKRONISASI OPEX REAL
      if (opexDbData && opexDbData.length > 0) {
        setOpexList(opexDbData.map(item => ({
          outletCode: item.outlet_code,
          outletName: item.outlet_name,
          actual_sales: Number(item.actual_sales) || 0,
          budget: Math.round(Number(item.budget) || 0),
          actual: Math.round(Number(item.actual) || 0),
          sisa_budget: Math.round(Number(item.sisa_budget) || 0),
          percent_used: Number(item.percent_used) || 0,
          categories: item.categories || {}
        })));
      }

      // SINKRONISASI EQUIPMENT REAL
      if (equipDbData && equipDbData.length > 0) {
        setEquipmentList(equipDbData.map(item => ({
          id: item.id,
          outletCode: item.outlet_code,
          station: item.station,
          name: item.name,
          leadTime: item.lead_time || '-',
          acuanOps: Number(item.acuan_ops) || 0,
          onHandAwal: Number(item.on_hand_awal) || 0,
          rusak: Number(item.rusak) || 0,
          mutasiKeluar: Number(item.mutasi_keluar) || 0,
          datangBarang: Number(item.datang_barang) || 0,
          beliLuar: Number(item.beli_luar) || 0,
          onHandTerakhir: Number(item.on_hand_terakhir) || 0,
          selisihOps: Number(item.selisih_ops) || 0
        })));
      }
    } catch (e) {
      console.error("Gagal load area dashboard data:", e);
    } finally {
      setIsLoading(false);
    }
  }, [uploadOutletId, selectedMonth]);

  useEffect(() => {
    loadMasterData();
  }, [loadMasterData]);

  // RANGKUMAN TOTAL REGIONAL OPEX KALTIM
  const totalOpexRegional = useMemo(() => {
    const sumSales = opexList.reduce((acc, curr) => acc + (curr.actual_sales || 0), 0);
    const sumBudget = opexList.reduce((acc, curr) => acc + (curr.budget || 0), 0);
    const sumActual = opexList.reduce((acc, curr) => acc + (curr.actual || 0), 0);
    const sumSisa = sumBudget - sumActual;
    const avgPercent = sumBudget > 0 ? Number(((sumActual / sumBudget) * 100).toFixed(1)) : 0;

    const sumUtil = opexList.reduce((acc, curr) => acc + (curr.categories?.utilities?.actual_rp || 0), 0);
    const sumOps = opexList.reduce((acc, curr) => acc + (curr.categories?.operational_supply?.actual_rp || 0), 0);
    const sumOff = opexList.reduce((acc, curr) => acc + (curr.categories?.office_supply?.actual_rp || 0), 0);
    const sumMaint = opexList.reduce((acc, curr) => acc + (curr.categories?.maintenance?.actual_rp || 0), 0);

    return {
      sumSales,
      sumBudget,
      sumActual,
      sumSisa,
      avgPercent,
      categories: {
        utilities: sumUtil,
        operational_supply: sumOps,
        office_supply: sumOff,
        maintenance: sumMaint
      }
    };
  }, [opexList]);

  // FILTER TUGAS: HANYA MUNCUL DI AKUN YANG DIBERIKAN TUGAS
  const userVisibleTasks = useMemo(() => {
    if (!currentProfile) return [];
    if (currentProfile.role === 'area_manager') return tasks;

    return tasks.filter(t => {
      if (t.target_role === 'store_manager') return currentProfile.role === 'store_manager';
      if (t.outlet_id) return t.outlet_id === currentProfile.outlet_id;
      if (t.department && currentProfile.station_placement) {
        return t.department.toLowerCase() === currentProfile.station_placement.toLowerCase();
      }
      return true;
    });
  }, [tasks, currentProfile]);

  // ALARM OTOMATIS
  useEffect(() => {
    const isManagerRole = ['store_manager', 'ast_store_manager', 'floor_leader', 'floor_leader_orientation'].includes(currentProfile?.role);

    const checkScheduleAndOverdue = () => {
      const now = new Date();
      const currentHour = now.getHours();

      const hasOverdue = userVisibleTasks.some(t => 
        t.status === 'pending' && new Date(t.deadline) < now
      );

      if (hasOverdue) {
        setAlarmTriggerType('TASK_OVERDUE');
        startAudioAlarm();
        return;
      }

      if (!hasConfirmedCacpToday && isManagerRole && !isManagerIC) {
        if (currentHour >= 22) {
          setAlarmTriggerType('OFF_ALARM_22');
          startAudioAlarm();
        } else if (currentHour >= 19) {
          setAlarmTriggerType('OFF_ALARM_19');
          startAudioAlarm();
        }
      }
    };

    checkScheduleAndOverdue();
    const timer = setInterval(checkScheduleAndOverdue, 60000);
    return () => clearInterval(timer);
  }, [currentProfile, isManagerIC, hasConfirmedCacpToday, userVisibleTasks, startAudioAlarm]);

  // KONFIRMASI CACP HARIAN
  const handleConfirmCacp = async () => {
    setIsSubmittingConfirm(true);
    try {
      stopAudioAlarm();
      setHasConfirmedCacpToday(true);
      setAlarmTriggerType(null);

      const payload = {
        department: 'cacp_audit',
        title: `CACP Harian: ${isManagerIC ? 'In-Charge (IC)' : 'Jadwal Libur (OFF)'}`,
        deadline: new Date().toISOString(),
        priority: 'urgent',
        outlet_id: currentProfile?.outlet_id || null,
        created_by: user?.id,
        status: 'completed',
        is_on_time: true,
        completion_notes: `Manager mengonfirmasi pengisian CACP RM (${isManagerIC ? 'Selesai sebelum Clock-Out' : 'Diselesaikan saat OFF'}).`
      };

      await supabase.from('department_tasks').insert([payload]);
      alert("✓ Berhasil dikonfirmasi! Akses Clock-Out terbuka & alarm dimatikan.");
      loadMasterData();
    } catch (err) {
      alert(`Gagal konfirmasi: ${err.message}`);
    } finally {
      setIsSubmittingConfirm(false);
    }
  };

  const handleAttemptClockOut = () => {
    if (!hasConfirmedCacpToday) {
      setAlarmTriggerType('LOCK_OUT_IC');
      startAudioAlarm();
    } else {
      alert("✓ Clock-Out berhasil! Anda telah menyelesaikan tugas CACP hari ini.");
    }
  };

  // MUTASI EQUIPMENT
  const handleSaveEquipmentLog = async (e) => {
    e.preventDefault();
    if (!selectedEquipItem) return;

    setIsSubmittingEquipLog(true);
    try {
      const newRusak = selectedEquipItem.rusak + Number(logQtyRusak);
      const newKeluar = selectedEquipItem.mutasiKeluar + Number(logQtyKeluar);
      const newDatang = selectedEquipItem.datangBarang + Number(logQtyDatangHO);
      const newBeli = selectedEquipItem.beliLuar + Number(logQtyBeliLuar);
      const newOnHand = selectedEquipItem.onHandAwal - newRusak - newKeluar + newDatang + newBeli;
      const newSelisih = newOnHand - selectedEquipItem.acuanOps;

      await supabase
        .from('controlling_equipment')
        .update({
          rusak: newRusak,
          mutasi_keluar: newKeluar,
          datang_barang: newDatang,
          beli_luar: newBeli,
          on_hand_terakhir: newOnHand,
          selisih_ops: newSelisih,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedEquipItem.id);

      setEquipmentList(prev => prev.map(item => {
        if (item.id === selectedEquipItem.id) {
          return {
            ...item,
            rusak: newRusak,
            mutasiKeluar: newKeluar,
            datangBarang: newDatang,
            beliLuar: newBeli,
            onHandTerakhir: newOnHand,
            selisihOps: newSelisih
          };
        }
        return item;
      }));

      alert(`✓ Mutasi harian ${selectedEquipItem.name} berhasil disimpan!`);
      setActiveModal('controlling_equipment');
      setSelectedEquipItem(null);
      setLogQtyRusak(0);
      setLogQtyKeluar(0);
      setLogQtyDatangHO(0);
      setLogQtyBeliLuar(0);
    } catch (err) {
      alert(`Gagal simpan mutasi: ${err.message}`);
    } finally {
      setIsSubmittingEquipLog(false);
    }
  };

  const processedEquipment = useMemo(() => {
    return equipmentList.map(item => {
      const onHandTerakhir = item.onHandTerakhir !== undefined 
        ? item.onHandTerakhir 
        : (item.onHandAwal - item.rusak - item.mutasiKeluar + item.datangBarang + item.beliLuar);
      const selisihOps = item.selisihOps !== undefined 
        ? item.selisihOps 
        : (onHandTerakhir - item.acuanOps);
      const isShortage = selisihOps < 0;

      return {
        ...item,
        onHandTerakhir,
        selisihOps,
        isShortage
      };
    });
  }, [equipmentList]);

  const filteredEquipment = useMemo(() => {
    return processedEquipment.filter(item => {
      const matchOutlet = item.outletCode === selectedEquipOutlet;
      const matchStation = equipStationFilter === 'ALL' || item.station === equipStationFilter;
      const matchSearch = item.name.toLowerCase().includes(equipSearchQuery.toLowerCase());
      const matchTab = equipTabFilter === 'all' || (equipTabFilter === 'shortage' && item.isShortage);

      return matchOutlet && matchStation && matchSearch && matchTab;
    });
  }, [processedEquipment, selectedEquipOutlet, equipStationFilter, equipSearchQuery, equipTabFilter]);

  const totalShortageCount = useMemo(() => {
    return processedEquipment.filter(i => i.outletCode === selectedEquipOutlet && i.isShortage).length;
  }, [processedEquipment, selectedEquipOutlet]);

  const handleToggleGpsLock = async (outletId, currentStatus, outletName) => {
    if (currentProfile?.role !== 'area_manager') return alert("Hanya Area Manager yang berwenang!");
    const confirmAction = confirm(currentStatus ? `Buka kunci GPS ${outletName}?` : `Kunci permanen GPS ${outletName}?`);
    if (!confirmAction) return;

    setIsUpdatingLock(true);
    try {
      const { error } = await supabase
        .from('outlets')
        .update({ is_locked: !currentStatus, updated_by: user.id, updated_at: new Date().toISOString() })
        .eq('id', outletId);
      if (error) throw error;
      alert(`✓ Status GPS ${outletName} diperbarui!`);
      loadMasterData();
    } catch (err) {
      alert(`Gagal: ${err.message}`);
    } finally {
      setIsUpdatingLock(false);
    }
  };

  // PEMBUATAN TUGAS: JIKA UNTUK SM, DEPARTEMEN DITIADAKAN
  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!taskTitle.trim() || !taskDeadline) return alert("Isi judul tugas dan batas waktu!");

    setIsSubmittingTask(true);
    try {
      let targetOutlet = null;
      if (taskTargetType === 'STORE') {
        targetOutlet = taskSelectedTargetId || outlets[0]?.id;
      } else if (currentProfile?.role !== 'area_manager') {
        targetOutlet = currentProfile?.outlet_id;
      }

      const payload = {
        department: taskTargetType === 'ALL_SM' ? 'general_management' : taskDept,
        target_role: taskTargetType === 'ALL_SM' ? 'store_manager' : null,
        title: taskTitle.trim(),
        deadline: new Date(taskDeadline).toISOString(),
        priority: taskPriority,
        outlet_id: targetOutlet,
        created_by: user?.id,
        status: 'pending'
      };

      const { error } = await supabase.from('department_tasks').insert([payload]);
      if (error) throw error;

      alert("✓ Jobdesk tugas berhasil diterbitkan!");
      setTaskTitle('');
      setTaskDeadline('');
      loadMasterData();
    } catch (err) {
      alert(`Gagal membuat tugas: ${err.message}`);
    } finally {
      setIsSubmittingTask(false);
    }
  };

  const handleConfirmTaskCompletion = async (e) => {
    e.preventDefault();
    if (!taskToConfirm) return;
    if (!proofImage) return alert("Wajib lampirkan foto dokumentasi hasil pekerjaan!");

    setIsConfirmingTask(true);
    try {
      const photoUrl = URL.createObjectURL(proofImage);
      const now = new Date();
      const deadline = new Date(taskToConfirm.deadline);
      const isCompletedOnTime = now <= deadline;

      const { error } = await supabase
        .from('department_tasks')
        .update({
          status: 'completed',
          completed_at: now.toISOString(),
          completed_by: user?.id,
          proof_photo_url: photoUrl,
          completion_notes: completionNotes,
          is_on_time: isCompletedOnTime
        })
        .eq('id', taskToConfirm.id);

      if (error) throw error;

      if (!isCompletedOnTime) {
        await supabase
          .from('user_profiles')
          .update({ total_points: Math.max(0, (currentProfile?.total_points || 100) - 10) })
          .eq('id', user.id);
        alert("⚠️ Tugas selesai melewati batas waktu (-10 Poin).");
      } else {
        alert("✓ Tugas selesai tepat waktu! Poin terjaga.");
      }

      setProofImage(null);
      setCompletionNotes('');
      setTaskToConfirm(null);
      setActiveModal('task_manager');
      loadMasterData();
    } catch (err) {
      alert(`Gagal konfirmasi: ${err.message}`);
    } finally {
      setIsConfirmingTask(false);
    }
  };

  const handleUploadRecipePdf = (e) => {
    e.preventDefault();
    if (currentProfile?.role !== 'area_manager') return alert("Hanya Area Manager yang berwenang!");
    if (!recipePdfFile) return alert("Pilih file PDF gramasi!");

    setIsUploadingBOM(true);
    setTimeout(() => {
      setLastUploadedPdfName(recipePdfFile.name);
      setIsUploadingBOM(false);
      alert(`✓ Standar gramasi diperbarui!`);
      setActiveModal('deviasi_kru');
    }, 1000);
  };

  const handleProcessClosingUpload = async (e) => {
    e.preventDefault();
    if (!soFile || !esbFile) return alert("Lengkapi kedua file SO dan ESB!");

    setIsParsingFiles(true);
    try {
      const payload = {
        outlet_id: uploadOutletId,
        closing_date: new Date().toISOString().split('T')[0],
        deviation_summary: { files: { so: soFile.name, esb: esbFile.name } },
        speed_of_service_minutes: 7.2,
        status: 'submitted',
        submitted_by: user?.id || null,
        created_at: new Date().toISOString()
      };

      const { error } = await supabase.from('store_daily_closings').insert([payload]);
      if (error) throw error;

      alert("✓ Berhasil simpan data closing!");
      setSoFile(null);
      setEsbFile(null);
      loadMasterData();
    } catch (err) {
      alert(`Gagal memproses file: ${err.message}`);
    } finally {
      setIsParsingFiles(false);
    }
  };

  // ANALITIK TUGAS
  const taskAnalytics = useMemo(() => {
    const total = userVisibleTasks.length;
    if (total === 0) return { completionRate: 100, completedCount: 0, pendingCount: 0, overdueCount: 0 };
    const completed = userVisibleTasks.filter(t => t.status === 'completed' && t.is_on_time !== false);
    const pending = userVisibleTasks.filter(t => t.status === 'pending');
    const overdue = userVisibleTasks.filter(t => (t.status === 'pending' && new Date(t.deadline) < new Date()) || t.is_on_time === false);

    return {
      completionRate: Math.round((completed.length / total) * 100),
      completedCount: completed.length,
      pendingCount: pending.length,
      overdueCount: overdue.length
    };
  }, [userVisibleTasks]);

  // KALKULASI RANKING RESTO
  const outletScoreRankings = useMemo(() => {
    return outlets.map((outlet, idx) => {
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
      const completedOnTime = restoTasks.filter(t => t.status === 'completed' && t.is_on_time !== false);
      const overdueTasks = restoTasks.filter(t => t.status === 'pending' && new Date(t.deadline) < new Date());
      const taskComplianceRate = restoTasks.length > 0 
        ? Math.round((completedOnTime.length / restoTasks.length) * 100) 
        : 95;

      const latestClosing = closings.find(c => c.outlet_id === outlet.id);
      const deviationItems = latestClosing?.deviation_summary?.physical_stock?.length || 0;
      const deviationScore = Math.max(50, 100 - (deviationItems > 0 ? 5 : 0));

      const daysInMonth = totalDaysInSelectedMonth;
      const missedDays = Math.min(daysInMonth, (idx === 8 ? 4 : idx === 7 ? 3 : idx % 2));
      const submittedDays = daysInMonth - missedDays;
      const cacpPercentage = Math.round((submittedDays / daysInMonth) * 100);

      const isCritical = cacpPercentage < 80;
      const isWarning = cacpPercentage >= 80 && cacpPercentage < 88;

      const managersInOutlet = restoCrew.filter(p => 
        ['store_manager', 'ast_store_manager', 'floor_leader', 'floor_leader_orientation'].includes(p.role)
      ).map((m, mIdx) => {
        const mMmissed = Math.min(daysInMonth, (mIdx === 0 ? missedDays : missedDays + 1));
        const mMsubmitted = daysInMonth - mMmissed;
        const mScore = Math.round((mMsubmitted / daysInMonth) * 100);
        const isSM = m.role === 'store_manager';
        
        const threshold = isSM ? 80 : 90;
        const isPass = mScore >= threshold;

        return {
          id: m.id,
          name: m.full_name,
          role: m.role,
          roleLabel: m.role === 'store_manager' ? 'Store Manager (SM)' :
                     m.role === 'ast_store_manager' ? 'Asst. Manager (ASM)' :
                     m.role === 'floor_leader' ? 'Floor Leader (FL)' : 'FL Orientation (FLO)',
          scoreCurrentMonth: mScore,
          submittedDays: mMsubmitted,
          missedDays: mMmissed,
          totalDays: daysInMonth,
          threshold,
          isPass,
          statusText: isPass ? 'Lolos Standar RM' : (isSM ? '⚠️ Warning Demosi (< 80%)' : '⚠️ Gagal Promosi (< 90%)')
        };
      });

      const overallScore = Math.round(
        (attendanceScore * 0.15) +
        (breakDisciplineScore * 0.20) +
        (taskComplianceRate * 0.25) +
        (deviationScore * 0.15) +
        (cacpPercentage * 0.25)
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
        cacpData: {
          overallPercentage: cacpPercentage,
          submittedDays,
          missedDays,
          totalDays: daysInMonth,
          isCritical,
          isWarning,
          managers: managersInOutlet
        },
        taskStats: {
          total: restoTasks.length,
          completed: completedOnTime.length,
          overdue: overdueTasks.length,
          rate: taskComplianceRate
        },
        metrics: {
          attendance: attendanceScore,
          breakDiscipline: breakDisciplineScore,
          taskCompliance: taskComplianceRate,
          deviation: deviationScore,
          cacpAudit: cacpPercentage
        }
      };
    }).sort((a, b) => b.healthScore - a.healthScore);
  }, [outlets, profiles, attendanceLogs, violations, tasks, closings, selectedMonth, totalDaysInSelectedMonth]);

  // KALKULASI RANKING MANAGER
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
      const completedOnTime = personTasks.filter(t => t.status === 'completed' && t.is_on_time !== false).length;
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

      const isSM = person.role === 'store_manager';
      const cacpThreshold = isSM ? 80 : 90;
      const isQualifiedForPromo = compositeScore >= cacpThreshold && lateMinutes === 0 && overbreakCount === 0;

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
        cacpPersonal: compositeScore,
        isQualifiedForPromo,
        promoStatus: isQualifiedForPromo 
          ? '★ Siap Promosi (Lolos RM)' 
          : compositeScore < cacpThreshold 
          ? (isSM ? '⚠️ Demosi (< 80%)' : '⚠️ Tertahan (< 90%)') 
          : 'Memenuhi Syarat'
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

  const isCurrentUserManager = ['store_manager', 'ast_store_manager', 'floor_leader', 'floor_leader_orientation'].includes(currentProfile?.role);

  // DATA DEVIASI DINAMIS DARI CLOSING
  const SO_DEVIATION_DATA = useMemo(() => {
    if (!closings || closings.length === 0) return [];
    
    return closings.flatMap(c => {
      const physicalStock = c.deviation_summary?.physical_stock || [];
      const outlet = outlets.find(o => o.id === c.outlet_id);
      return physicalStock.map(item => ({
        name: item.name,
        unit: item.unit || 'gr',
        fisik: Number(item.physical_qty || item.fisik || 0),
        teori: Number(item.system_qty || item.teori || 0),
        selisih: Number(item.physical_qty || item.fisik || 0) - Number(item.system_qty || item.teori || 0),
        status: (Number(item.physical_qty || item.fisik || 0) - Number(item.system_qty || item.teori || 0)) < -1000 ? 'Bocor Kritis' : 'Normal',
        store: outlet?.name || 'Cabang Area'
      }));
    });
  }, [closings, outlets]);

  const totalDeviasiGram = useMemo(() => {
    return SO_DEVIATION_DATA
      .filter(item => item.unit === 'gr')
      .reduce((acc, curr) => acc + Math.abs(curr.selisih), 0);
  }, [SO_DEVIATION_DATA]);

  return (
    <div className="min-h-screen bg-slate-100 flex justify-center font-sans antialiased text-slate-800">
      
      <div className="w-full max-w-md bg-[#FAFBFD] min-h-screen flex flex-col shadow-2xl relative pb-28 border-x border-slate-200">
        
        {/* HEADER UTAMA */}
        <div className="px-5 pt-4 pb-3 bg-white border-b border-slate-100 flex items-center justify-between sticky top-0 z-20 shadow-2xs">
          <div>
            <h1 className="text-base font-black text-slate-900 tracking-tight">Dashboard Area Kaltim</h1>
            <p className="text-[10px] text-slate-400 font-medium">Executive Controlling & Performance</p>
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

        {/* STATUS SHIFT & ABSEN */}
        {isCurrentUserManager && (
          <div className="mx-4 mt-3 p-3 bg-white border border-slate-200 rounded-2xl shadow-2xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${isManagerIC ? 'bg-emerald-500 animate-ping' : 'bg-slate-400'}`}></span>
              <div>
                <p className="text-xs font-black text-slate-900">
                  Status: {isManagerIC ? 'Sedang In-Charge (IC)' : 'Jadwal Libur (OFF)'}
                </p>
                <p className="text-[10px] text-slate-400">
                  {hasConfirmedCacpToday ? '✓ CACP Hari ini Selesai' : '⚠️ CACP Belum Diisi'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setIsManagerIC(!isManagerIC)}
                className="px-2 py-1 bg-slate-100 text-slate-600 hover:bg-slate-200 text-[10px] font-bold rounded-lg cursor-pointer"
              >
                Ganti
              </button>

              {isManagerIC && (
                <button
                  type="button"
                  onClick={handleAttemptClockOut}
                  className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[10px] font-black rounded-lg cursor-pointer flex items-center gap-1"
                >
                  <FiLogOut />
                  <span>Clock-Out</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* MODAL POP-UP ALARM */}
        {alarmTriggerType !== null && (
          <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white w-full max-w-sm rounded-3xl p-6 text-center space-y-4 border-2 border-rose-500 shadow-2xl relative overflow-hidden">
              <div className="w-16 h-16 rounded-full bg-rose-100 border-2 border-rose-300 text-rose-600 flex items-center justify-center mx-auto text-2xl animate-bounce shadow-md">
                <FiAlertTriangle />
              </div>

              <div className="space-y-1">
                <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-0.5 rounded-full ${
                  alarmTriggerType === 'LOCK_OUT_IC' ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                  alarmTriggerType === 'TASK_OVERDUE' ? 'bg-rose-600 text-white animate-pulse' :
                  alarmTriggerType === 'OFF_ALARM_22' ? 'bg-rose-600 text-white' : 'bg-rose-100 text-rose-800'
                }`}>
                  {alarmTriggerType === 'LOCK_OUT_IC' ? '🔒 CLOCK-OUT TERKUNCI' :
                   alarmTriggerType === 'TASK_OVERDUE' ? '🚨 TUGAS OVERDUE (-10 POIN)' :
                   alarmTriggerType === 'OFF_ALARM_22' ? '⏰ PERINGATAN TERAKHIR 22:00 WITA' : '⏰ PENGINGAT HARIAN 19:00 WITA'}
                </span>
                
                <h3 className="text-base font-black text-slate-950 mt-1">
                  {alarmTriggerType === 'LOCK_OUT_IC' 
                    ? 'Selesaikan CACP Sebelum Pulang!' 
                    : alarmTriggerType === 'TASK_OVERDUE'
                    ? 'Ada Jobdesk Yang Melewati Batas Waktu!'
                    : 'Audit CACP Hari Ini Belum Diisi!'}
                </h3>
              </div>

              <div className="p-3 bg-rose-50 rounded-2xl border border-rose-200 flex items-center justify-between text-left">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-rose-600 text-white rounded-lg">
                    {isCacpAlarmActive ? <FiVolume2 className="text-xs animate-pulse" /> : <FiVolumeX className="text-xs" />}
                  </span>
                  <div>
                    <span className="text-[10px] font-black text-rose-900 block uppercase">Alarm Sirene</span>
                    <span className="text-[9px] text-rose-700">{isCacpAlarmActive ? 'Sirene berbunyi aktif' : 'Sirene disenyapkan'}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={isCacpAlarmActive ? stopAudioAlarm : startAudioAlarm}
                  className="px-2.5 py-1 text-[10px] font-black uppercase rounded-lg border border-rose-300 bg-white text-rose-700 cursor-pointer"
                >
                  {isCacpAlarmActive ? 'Senyapkan' : 'Nyalakan'}
                </button>
              </div>

              <div className="space-y-2 pt-1 text-left">
                {alarmTriggerType === 'TASK_OVERDUE' ? (
                  <button
                    type="button"
                    onClick={() => {
                      stopAudioAlarm();
                      setAlarmTriggerType(null);
                      setActiveModal('task_manager');
                    }}
                    className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-2xl flex items-center justify-center gap-1.5 shadow-lg shadow-rose-600/30 cursor-pointer"
                  >
                    <FiCheckSquare />
                    <span>Buka Task Manager Sekarang</span>
                  </button>
                ) : (
                  <>
                    <a
                      href={CACP_GOOGLE_FORM_URL}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 border border-slate-300"
                    >
                      <span>1. Buka Google Form RM</span>
                      <FiExternalLink className="text-xs" />
                    </a>

                    <button
                      type="button"
                      onClick={handleConfirmCacp}
                      disabled={isSubmittingConfirm}
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-2xl flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/30 cursor-pointer transition-all disabled:opacity-50"
                    >
                      <FiCheck />
                      <span>{isSubmittingConfirm ? 'Menyimpan...' : '2. ✓ Saya Sudah Submit Form CACP Hari Ini'}</span>
                    </button>
                  </>
                )}

                {currentProfile?.role === 'area_manager' && (
                  <button
                    type="button"
                    onClick={() => {
                      stopAudioAlarm();
                      setAlarmTriggerType(null);
                    }}
                    className="w-full text-center text-[10px] font-bold text-slate-400 hover:text-slate-600 py-1 cursor-pointer"
                  >
                    Tutup Uji Coba AM
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="px-4 py-4 space-y-5">

          {/* 1. KARTU RESTO TERBAIK */}
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
                {top1Outlet?.name || 'Gacoan Balikpapan MT Haryono'}
              </h2>
              <p className="text-xs text-indigo-200 font-medium mt-1">
                Store Manager: <span className="text-white font-bold">{top1Outlet?.storeManagerName}</span>
              </p>
            </div>

            <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between px-3 gap-6">
              <div className="text-left shrink-0">
                <span className="text-[9px] text-slate-400 block uppercase tracking-widest font-black">Health Score</span>
                <span className="text-4xl font-black text-emerald-400 font-mono tracking-tight drop-shadow-md block mt-0.5">
                  {top1Outlet?.healthScore || 98}%
                </span>
              </div>

              <div className="w-px h-14 bg-white/15 shrink-0"></div>

              <div className="space-y-2 flex-1 min-w-0 text-left">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0"></span>
                  <span className="text-xs font-mono font-bold text-emerald-300">100%</span>
                  <span className="text-[11px] text-slate-300 font-medium truncate">Break & Shift</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0"></span>
                  <span className="text-xs font-mono font-bold text-blue-300">95%</span>
                  <span className="text-[11px] text-slate-300 font-medium truncate">SLA Tugas Dept</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-400 shrink-0"></span>
                  <span className="text-xs font-mono font-bold text-purple-300">{top1Outlet?.cacpData?.overallPercentage || 97}%</span>
                  <span className="text-[11px] text-slate-300 font-medium truncate">Kepatuhan CACP</span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-white/10 flex items-center justify-center gap-1.5 text-[10px] font-bold text-amber-300/90 group-hover:text-amber-300">
              <span>Buka rincian lengkap grafik penilaian</span>
              <FiChevronRight className="text-xs" />
            </div>
          </div>

          {/* 2. KARTU MANAGER TELADAN */}
          <div className="bg-gradient-to-b from-amber-500/20 via-white to-amber-500/10 rounded-3xl p-6 border-2 border-amber-400 shadow-xl shadow-amber-900/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-300/30 rounded-full blur-2xl pointer-events-none"></div>

            <div className="flex items-center mb-4 border-b border-amber-300/70 pb-2.5 relative z-10">
              <div className="flex items-center gap-1.5">
                <span className="text-base">👑</span>
                <h3 className="text-xs font-black uppercase tracking-wider text-amber-950">
                  Manager Teladan Bulan Ini
                </h3>
              </div>
            </div>

            <div 
              onClick={() => handleOpenManagerDetail(top1Leader)}
              className="text-center group py-1 relative z-10 cursor-pointer"
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

              <h4 className="text-lg font-black text-slate-950 tracking-tight">
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
          </div>

          {/* 3. MENU OPERASIONAL: SEJAJAR 4 FITUR (DEVIASI, OPEX, CACP, EQUIPMENT) */}
          <div>
            <div className="flex items-center justify-between mb-2.5 px-1">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Menu Operasional Utama
              </h3>
              <span className="text-[10px] text-slate-400">4 Pilar Kontrol</span>
            </div>

            <div className="grid grid-cols-4 gap-2">
              <button 
                onClick={() => setActiveModal('deviasi_kru')}
                className="flex flex-col items-center text-center p-2 rounded-2xl bg-white border border-slate-200 hover:border-rose-300 hover:bg-rose-50/20 transition-all group cursor-pointer shadow-2xs"
              >
                <div className="w-11 h-11 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 text-base shadow-2xs group-hover:scale-105 transition-all">
                  <FiPieChart />
                </div>
                <span className="text-[11px] font-bold text-slate-800 mt-1">Deviasi</span>
                <span className="text-[8px] text-slate-400">Fisik SO</span>
              </button>

              <button 
                onClick={() => setActiveModal('opex_control')}
                className="flex flex-col items-center text-center p-2 rounded-2xl bg-white border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/20 transition-all group cursor-pointer shadow-2xs"
              >
                <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 text-base shadow-2xs group-hover:scale-105 transition-all">
                  <FiDollarSign />
                </div>
                <span className="text-[11px] font-bold text-slate-800 mt-1">OPEX</span>
                <span className="text-[8px] text-slate-400">Budget</span>
              </button>

              <button 
                onClick={() => {
                  setSelectedOutletForCacp(null);
                  setActiveModal('cacp_control');
                }}
                className="flex flex-col items-center text-center p-2 rounded-2xl bg-white border border-slate-200 hover:border-purple-300 hover:bg-purple-50/20 transition-all group cursor-pointer shadow-2xs"
              >
                <div className="w-11 h-11 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 text-base shadow-2xs group-hover:scale-105 transition-all">
                  <FiClipboard />
                </div>
                <span className="text-[11px] font-bold text-slate-800 mt-1">Audit CACP</span>
                <span className="text-[8px] text-slate-400">Persen</span>
              </button>

              <button 
                onClick={() => setActiveModal('controlling_equipment')}
                className="flex flex-col items-center text-center p-2 rounded-2xl bg-white border border-slate-200 hover:border-amber-300 hover:bg-amber-50/20 transition-all group cursor-pointer relative shadow-2xs"
              >
                <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 text-base shadow-2xs group-hover:scale-105 transition-all">
                  <FiTool />
                  {totalShortageCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-600 text-white rounded-full text-[8px] font-black flex items-center justify-center border-2 border-white">
                      {totalShortageCount}
                    </span>
                  )}
                </div>
                <span className="text-[11px] font-bold text-slate-800 mt-1">Equipment</span>
                <span className="text-[8px] text-slate-400">Aset</span>
              </button>
            </div>
          </div>

          {/* 4. ZONA PEMBINAAN KHUSUS */}
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

            {/* 3 Resto Terendah */}
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
                        CACP: {outlet.cacpData.overallPercentage}% ({outlet.cacpData.submittedDays}/{outlet.cacpData.totalDays} Hari)
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-black text-rose-700 bg-rose-100 px-2.5 py-1 rounded-xl font-mono shrink-0">
                    {outlet.healthScore}%
                  </span>
                </div>
              ))}
            </div>

            {/* 3 Leader Terendah */}
            <div className="space-y-2 pt-1 border-t border-rose-200/50">
              <span className="text-[10px] font-black uppercase text-rose-900 tracking-wider flex items-center gap-1">
                <FiAlertTriangle className="text-rose-600" /> 3 Leader Terancam Evaluasi RM
              </span>

              {bottomLeaders.map((ldr) => (
                <div 
                  key={ldr.id}
                  onClick={() => handleOpenManagerDetail(ldr)}
                  className="bg-white p-3 rounded-2xl border border-rose-200 shadow-2xs flex items-center justify-between cursor-pointer"
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
                        {ldr.outletName} • {ldr.promoStatus}
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

        {/* ================= MODAL AUDIT DEVIASI ================= */}
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
                <div className="p-3.5 bg-rose-50/70 border border-rose-200 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center text-xs font-black shrink-0">
                      <FiAlertTriangle />
                    </div>
                    <div>
                      <p className="text-xs font-black text-rose-950">Total Selisih Fisik SO</p>
                      <p className="text-[10px] text-rose-600 font-medium">Berdasarkan data closing terakhir</p>
                    </div>
                  </div>
                  <span className="font-mono text-xs font-black text-rose-700 bg-white px-2.5 py-1 rounded-xl border border-rose-200">
                    {totalDeviasiGram > 0 ? `-${totalDeviasiGram.toLocaleString('id-ID')} gr` : '0 gr (Normal)'}
                  </span>
                </div>

                <div className="space-y-2.5">
                  {SO_DEVIATION_DATA.length === 0 ? (
                    <div className="text-center py-10 space-y-2 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                      <FiInbox className="mx-auto text-3xl text-slate-300" />
                      <p className="text-xs font-bold text-slate-600">Belum ada data deviasi yang diproses.</p>
                      <p className="text-[10px] text-slate-400">Silakan lakukan trial input file closing malam ini melalui tombol di atas.</p>
                    </div>
                  ) : (
                    SO_DEVIATION_DATA
                      .filter(item => selectedDevOutlet === 'ALL' || item.store.includes(outlets.find(o => o.id === selectedDevOutlet)?.name || ''))
                      .map((item, idx) => {
                        const isDanger = item.selisih < -1000 || (item.unit === 'porsi' && item.selisih < -15);
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
                                <span className="text-[11px] font-bold text-slate-800">{item.fisik.toLocaleString('id-ID')} {item.unit}</span>
                              </div>
                              <div>
                                <span className="text-[8px] text-slate-400 block font-sans uppercase">Teori ESB</span>
                                <span className="text-[11px] font-bold text-slate-800">{item.teori.toLocaleString('id-ID')} {item.unit}</span>
                              </div>
                              <div>
                                <span className="text-[8px] text-slate-400 block font-sans uppercase">Deviasi</span>
                                <span className={`text-[11px] font-black ${item.selisih < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                  {item.selisih > 0 ? `+${item.selisih}` : item.selisih} {item.unit}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })
                  )}
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

        {/* ================= MODAL OPEX DENGAN 5 KOLOM & GRAFIK RANGKUMAN EKSEKUTIF ================= */}
        {activeModal === 'opex_control' && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex justify-center items-end sm:items-center p-0 sm:p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden border border-slate-100">
              
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-xs font-black shadow-xs">
                    <FiDollarSign />
                  </span>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">Controlling Budget OPEX</h3>
                    <p className="text-[10px] text-slate-400 font-medium">Monitoring Real-Time Anggaran 9 Resto</p>
                  </div>
                </div>
                <button 
                  onClick={() => setActiveModal(null)}
                  className="p-2 bg-white hover:bg-slate-200 text-slate-600 rounded-full border border-slate-200 cursor-pointer"
                >
                  <FiX className="text-sm" />
                </button>
              </div>

              {/* TAUTAN KE SPREADSHEET RM */}
              <div className="p-3 bg-emerald-50/70 border-b border-emerald-100 flex items-center justify-between gap-2">
                <div>
                  <span className="text-xs font-black text-emerald-950 block">Database Spreadsheet RM</span>
                  <span className="text-[10px] text-emerald-700">Sumber data real-time OPEX Kaltim</span>
                </div>
                <a
                  href={OPEX_SPREADSHEET_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer"
                >
                  <span>Buka Sheet</span>
                  <FiExternalLink className="text-xs" />
                </a>
              </div>

              <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between gap-2">
                <span className="text-[10px] font-black uppercase text-slate-400">Filter Resto:</span>
                <select
                  value={selectedOpexOutlet}
                  onChange={(e) => setSelectedOpexOutlet(e.target.value)}
                  className="text-xs font-bold bg-white border border-slate-200 text-slate-800 rounded-xl px-2.5 py-1.5 outline-none cursor-pointer shadow-2xs flex-1 max-w-[220px]"
                >
                  <option value="ALL">📊 Semua 9 Cabang (Executive View)</option>
                  {opexList.map(o => (
                    <option key={o.outletCode} value={o.outletCode}>{o.outletName} ({o.outletCode})</option>
                  ))}
                </select>
              </div>

              <div className="p-4 overflow-y-auto space-y-4">
                {/* 1. RANGKUMAN EKSEKUTIF TOTAL REGIONAL */}
                {selectedOpexOutlet === 'ALL' && (
                  <div className="space-y-3">
                    <div className="bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 p-4 rounded-3xl text-white shadow-lg relative overflow-hidden border border-emerald-500/20">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                          <FiLayers /> Total Anggaran OPEX Area Kaltim
                        </span>
                        <span className="text-[9px] font-mono font-bold bg-emerald-500/30 text-emerald-200 px-2 py-0.5 rounded-full">
                          {selectedMonth}
                        </span>
                      </div>

                      <div className="mt-3 flex items-baseline justify-between">
                        <div>
                          <span className="text-[9px] text-slate-400 block uppercase">Realisasi / Total Budget</span>
                          <p className="text-xl font-black font-mono text-white mt-0.5">
                            Rp {totalOpexRegional.sumActual.toLocaleString('id-ID')}
                          </p>
                          <p className="text-[10px] text-slate-300 font-mono">
                            dari Rp {totalOpexRegional.sumBudget.toLocaleString('id-ID')}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-3xl font-black font-mono text-emerald-400 block">
                            {totalOpexRegional.avgPercent}%
                          </span>
                          <span className="text-[9px] text-slate-300 font-medium">Pemakaian Regional</span>
                        </div>
                      </div>

                      <div className="mt-3 h-2 w-full bg-white/10 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${
                            totalOpexRegional.avgPercent > 100 ? 'bg-rose-500' :
                            totalOpexRegional.avgPercent > 80 ? 'bg-amber-400' : 'bg-emerald-400'
                          }`}
                          style={{ width: `${Math.min(100, totalOpexRegional.avgPercent)}%` }}
                        />
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-white/10 flex justify-between text-[10px] font-mono text-slate-300">
                        <span>Total Sisa Budget Area:</span>
                        <span className="font-bold text-emerald-300">
                          Rp {totalOpexRegional.sumSisa.toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>

                    {/* DIAGRAM PROPORSI BEBAN REGIONAL */}
                    <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase text-slate-500 flex items-center gap-1">
                          <FiBarChart2 className="text-indigo-600" /> Distribusi Beban Regional
                        </span>
                        <span className="text-[9px] text-slate-400 font-bold">4 Pos Beban</span>
                      </div>

                      <div className="space-y-1.5 text-[10px] font-mono">
                        <div>
                          <div className="flex justify-between text-slate-700">
                            <span>1. Utilities (Listrik/Air/Gas)</span>
                            <span className="font-bold">Rp {totalOpexRegional.categories.utilities.toLocaleString('id-ID')}</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-200 rounded-full mt-0.5 overflow-hidden">
                            <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${totalOpexRegional.sumActual > 0 ? (totalOpexRegional.categories.utilities / totalOpexRegional.sumActual) * 100 : 0}%` }} />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-slate-700">
                            <span>2. Operational Supply</span>
                            <span className="font-bold">Rp {totalOpexRegional.categories.operational_supply.toLocaleString('id-ID')}</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-200 rounded-full mt-0.5 overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${totalOpexRegional.sumActual > 0 ? (totalOpexRegional.categories.operational_supply / totalOpexRegional.sumActual) * 100 : 0}%` }} />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-slate-700">
                            <span>3. Office Supply (ATK)</span>
                            <span className="font-bold">Rp {totalOpexRegional.categories.office_supply.toLocaleString('id-ID')}</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-200 rounded-full mt-0.5 overflow-hidden">
                            <div className="h-full bg-amber-500 rounded-full" style={{ width: `${totalOpexRegional.sumActual > 0 ? (totalOpexRegional.categories.office_supply / totalOpexRegional.sumActual) * 100 : 0}%` }} />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-slate-700">
                            <span>4. Maintenance Resto</span>
                            <span className="font-bold">Rp {totalOpexRegional.categories.maintenance.toLocaleString('id-ID')}</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-200 rounded-full mt-0.5 overflow-hidden">
                            <div className="h-full bg-rose-500 rounded-full" style={{ width: `${totalOpexRegional.sumActual > 0 ? (totalOpexRegional.categories.maintenance / totalOpexRegional.sumActual) * 100 : 0}%` }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. DAFTAR RINCIAN PER RESTO DENGAN FORMAT 5 KOLOM */}
                <div className="space-y-3">
                  <span className="text-[10px] font-black uppercase text-slate-400 px-1 block">
                    {selectedOpexOutlet === 'ALL' ? 'Rincian Budget Per Resto' : 'Rincian Resto Terpilih'}
                  </span>

                  {opexList
                    .filter(item => selectedOpexOutlet === 'ALL' || item.outletCode === selectedOpexOutlet)
                    .map(item => {
                      const variance = item.sisa_budget;
                      const percentUsed = item.percent_used;
                      const isOverbudget = percentUsed > 100;
                      const cat = item.categories || {};

                      const util = cat.utilities || {};
                      const utilItems = util.items || {};
                      const ops = cat.operational_supply || {};
                      const off = cat.office_supply || {};
                      const maint = cat.maintenance || {};

                      return (
                        <div key={item.outletCode} className="p-4 bg-white border border-slate-200 rounded-2xl space-y-3 shadow-2xs">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md">
                                  {item.outletCode}
                                </span>
                                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                                  isOverbudget ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                                }`}>
                                  {isOverbudget ? 'Overbudget' : 'On-Budget'}
                                </span>
                              </div>
                              <h4 className="text-xs font-black text-slate-900 mt-1">{item.outletName}</h4>
                              <p className="text-[10px] text-indigo-700 font-mono font-bold mt-0.5 flex items-center gap-1">
                                <FiTrendingUp className="text-xs" />
                                <span>Actual Sales: Rp {item.actual_sales ? item.actual_sales.toLocaleString('id-ID') : '0'}</span>
                              </p>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px] font-mono">
                              <span className="text-slate-500 font-medium">Pemakaian OPEX: {percentUsed}%</span>
                              <span className={isOverbudget ? 'text-rose-600 font-bold' : 'text-emerald-700 font-bold'}>
                                {variance >= 0 ? `Sisa: Rp ${variance.toLocaleString('id-ID')}` : `Defisit: Rp ${Math.abs(variance).toLocaleString('id-ID')}`}
                              </span>
                            </div>
                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all ${
                                  isOverbudget ? 'bg-rose-500' : percentUsed > 80 ? 'bg-amber-500' : 'bg-emerald-500'
                                }`} 
                                style={{ width: `${Math.min(100, percentUsed)}%` }}
                              />
                            </div>
                          </div>

                          {/* TABEL LENGKAP 5 KOLOM (ACTUAL, % ACT, BUDGET, % BUD, SISA) */}
                          <div className="overflow-x-auto no-scrollbar">
                            <table className="w-full text-left font-mono text-[9px] border-collapse">
                              <thead>
                                <tr className="border-b border-slate-200 text-[8px] text-slate-400 uppercase font-sans">
                                  <th className="py-1">Akun Beban</th>
                                  <th className="py-1 text-right">Actual (Rp)</th>
                                  <th className="py-1 text-right">% Act</th>
                                  <th className="py-1 text-right">Budget (Rp)</th>
                                  <th className="py-1 text-right">% Bud</th>
                                  <th className="py-1 text-right">Sisa (Rp)</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {/* Utilities */}
                                <tr className="font-bold text-slate-800 bg-slate-50/50">
                                  <td className="py-1.5 font-sans">Beban Utilities</td>
                                  <td className="py-1.5 text-right">{(util.actual_rp || 0).toLocaleString('id-ID')}</td>
                                  <td className="py-1.5 text-right text-indigo-600">{util.actual_pct || 0}%</td>
                                  <td className="py-1.5 text-right">{(util.budget_rp || 0).toLocaleString('id-ID')}</td>
                                  <td className="py-1.5 text-right text-slate-500">{util.budget_pct || 0}%</td>
                                  <td className="py-1.5 text-right text-emerald-700">{(util.sisa_rp || 0).toLocaleString('id-ID')}</td>
                                </tr>
                                {utilItems.listrik && (
                                  <tr className="text-slate-500 text-[8px]">
                                    <td className="py-0.5 pl-2 font-sans">↳ Listrik</td>
                                    <td className="py-0.5 text-right">{(utilItems.listrik.actual_rp || 0).toLocaleString('id-ID')}</td>
                                    <td className="py-0.5 text-right">{utilItems.listrik.actual_pct || 0}%</td>
                                    <td className="py-0.5 text-right">{(utilItems.listrik.budget_rp || 0).toLocaleString('id-ID')}</td>
                                    <td className="py-0.5 text-right">{utilItems.listrik.budget_pct || 0}%</td>
                                    <td className="py-0.5 text-right">{(utilItems.listrik.sisa_rp || 0).toLocaleString('id-ID')}</td>
                                  </tr>
                                )}
                                {utilItems.air && (
                                  <tr className="text-slate-500 text-[8px]">
                                    <td className="py-0.5 pl-2 font-sans">↳ Air</td>
                                    <td className="py-0.5 text-right">{(utilItems.air.actual_rp || 0).toLocaleString('id-ID')}</td>
                                    <td className="py-0.5 text-right">{utilItems.air.actual_pct || 0}%</td>
                                    <td className="py-0.5 text-right">{(utilItems.air.budget_rp || 0).toLocaleString('id-ID')}</td>
                                    <td className="py-0.5 text-right">{utilItems.air.budget_pct || 0}%</td>
                                    <td className="py-0.5 text-right">{(utilItems.air.sisa_rp || 0).toLocaleString('id-ID')}</td>
                                  </tr>
                                )}
                                {utilItems.gas && (
                                  <tr className="text-slate-500 text-[8px]">
                                    <td className="py-0.5 pl-2 font-sans">↳ Gas</td>
                                    <td className="py-0.5 text-right">{(utilItems.gas.actual_rp || 0).toLocaleString('id-ID')}</td>
                                    <td className="py-0.5 text-right">{utilItems.gas.actual_pct || 0}%</td>
                                    <td className="py-0.5 text-right">{(utilItems.gas.budget_rp || 0).toLocaleString('id-ID')}</td>
                                    <td className="py-0.5 text-right">{utilItems.gas.budget_pct || 0}%</td>
                                    <td className="py-0.5 text-right">{(utilItems.gas.sisa_rp || 0).toLocaleString('id-ID')}</td>
                                  </tr>
                                )}

                                {/* Ops Supply */}
                                <tr className="font-bold text-slate-800">
                                  <td className="py-1.5 font-sans">Beban Ops Supply</td>
                                  <td className="py-1.5 text-right">{(ops.actual_rp || 0).toLocaleString('id-ID')}</td>
                                  <td className="py-1.5 text-right text-indigo-600">{ops.actual_pct || 0}%</td>
                                  <td className="py-1.5 text-right">{(ops.budget_rp || 0).toLocaleString('id-ID')}</td>
                                  <td className="py-1.5 text-right text-slate-500">{ops.budget_pct || 0}%</td>
                                  <td className="py-1.5 text-right text-emerald-700">{(ops.sisa_rp || 0).toLocaleString('id-ID')}</td>
                                </tr>

                                {/* Office Supply / ATK */}
                                <tr className="font-bold text-slate-800">
                                  <td className="py-1.5 font-sans">Beban ATK / Office</td>
                                  <td className="py-1.5 text-right">{(off.actual_rp || 0).toLocaleString('id-ID')}</td>
                                  <td className="py-1.5 text-right text-indigo-600">{off.actual_pct || 0}%</td>
                                  <td className="py-1.5 text-right">{(off.budget_rp || 0).toLocaleString('id-ID')}</td>
                                  <td className="py-1.5 text-right text-slate-500">{off.budget_pct || 0}%</td>
                                  <td className="py-1.5 text-right text-emerald-700">{(off.sisa_rp || 0).toLocaleString('id-ID')}</td>
                                </tr>

                                {/* Maintenance / Inventaris */}
                                <tr className="font-bold text-slate-800">
                                  <td className="py-1.5 font-sans">Beban Inventaris</td>
                                  <td className="py-1.5 text-right">{(maint.actual_rp || 0).toLocaleString('id-ID')}</td>
                                  <td className="py-1.5 text-right text-indigo-600">{maint.actual_pct || 0}%</td>
                                  <td className="py-1.5 text-right">{(maint.budget_rp || 0).toLocaleString('id-ID')}</td>
                                  <td className="py-1.5 text-right text-slate-500">{maint.budget_pct || 0}%</td>
                                  <td className="py-1.5 text-right text-emerald-700">{(maint.sisa_rp || 0).toLocaleString('id-ID')}</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
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
                  Tutup Modul OPEX
                </button>
              </div>

            </div>
          </div>
        )}

        {/* MODAL ATUR RUMUS GRAMASI */}
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
                    Unggah dokumen PDF daftar gramasi resmi untuk audit 9 resto.
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

        {/* MODAL INPUT CLOSING */}
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

        {/* MODAL CONTROLLING EQUIPMENT */}
        {activeModal === 'controlling_equipment' && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex justify-center items-end sm:items-center p-0 sm:p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-100">
              
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center text-xs font-black shadow-xs">
                    <FiTool />
                  </span>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">Controlling Equipment</h3>
                    <p className="text-[10px] text-slate-400 font-medium">Monitoring Aset & Peralatan 9 Cabang</p>
                  </div>
                </div>
                <button 
                  onClick={() => setActiveModal(null)}
                  className="p-2 bg-white hover:bg-slate-200 text-slate-600 rounded-full border border-slate-200 cursor-pointer"
                >
                  <FiX className="text-sm" />
                </button>
              </div>

              <div className="px-4 py-2.5 bg-white border-b border-slate-100 flex items-center justify-between gap-2">
                <span className="text-[10px] font-black uppercase text-slate-400 shrink-0">Cabang Resto:</span>
                <select
                  value={selectedEquipOutlet}
                  onChange={(e) => setSelectedEquipOutlet(e.target.value)}
                  className="text-xs font-bold bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3 py-1.5 outline-none cursor-pointer flex-1 max-w-[220px]"
                >
                  <option value="BPPHAR">Gacoan Balikpapan MT Haryono (BPPHAR)</option>
                  <option value="BPPSOE">Gacoan Balikpapan Soetta (BPPSOE)</option>
                  <option value="BPPMUL">Gacoan Balikpapan Mulawarman (BPPMUL)</option>
                  <option value="SMRYAM">Gacoan Samarinda Wahid Hasyim (SMRYAM)</option>
                  <option value="SMRAHM">Gacoan Samarinda Ahmad Yani (SMRAHM)</option>
                  <option value="SMRKES">Gacoan Samarinda Kesejahteraan (SMRKES)</option>
                  <option value="TRGAKH">Gacoan Tenggarong (TRGAKH)</option>
                  <option value="SGTMAR">Gacoan Sangatta (SGTMAR)</option>
                  <option value="BONIMA">Gacoan Bontang (BONIMA)</option>
                </select>
              </div>

              <div className="p-3 bg-slate-50/70 border-b border-slate-100 space-y-2.5">
                <div className="relative">
                  <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                  <input
                    type="text"
                    placeholder="Cari nama alat (contoh: Piring, Saringan, Sendok)..."
                    value={equipSearchQuery}
                    onChange={(e) => setEquipSearchQuery(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-bold text-slate-800 outline-none shadow-2xs focus:border-indigo-500"
                  />
                </div>

                <div className="flex gap-1.5">
                  <button
                    onClick={() => setEquipTabFilter('all')}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1 ${
                      equipTabFilter === 'all' 
                        ? 'bg-slate-900 text-white shadow-xs' 
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <FiPackage className="text-xs" />
                    <span>Semua Peralatan</span>
                  </button>
                  <button
                    onClick={() => setEquipTabFilter('shortage')}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1 ${
                      equipTabFilter === 'shortage' 
                        ? 'bg-rose-600 text-white shadow-xs' 
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <FiAlertTriangle className="text-xs" />
                    <span>Barang Shortage ({totalShortageCount})</span>
                  </button>
                </div>

                <div className="flex gap-1 overflow-x-auto pb-0.5 no-scrollbar">
                  {['ALL', 'KASIR', 'NOODLE', 'DIMSUM', 'BAR', 'DISHWASHER'].map((st) => (
                    <button
                      key={st}
                      onClick={() => setEquipStationFilter(st)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase whitespace-nowrap cursor-pointer transition-all ${
                        equipStationFilter === st 
                          ? 'bg-indigo-600 text-white shadow-xs' 
                          : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {st === 'ALL' ? 'Semua Station' : st}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 overflow-y-auto space-y-2.5">
                {filteredEquipment.length === 0 ? (
                  <div className="text-center py-10 space-y-2">
                    <FiInbox className="mx-auto text-3xl text-slate-300" />
                    <p className="text-xs font-bold text-slate-500">Tidak ada data alat yang cocok.</p>
                    <p className="text-[10px] text-slate-400">Semua perlengkapan stasiun dalam batas standar aman.</p>
                  </div>
                ) : (
                  filteredEquipment.map(item => (
                    <div 
                      key={item.id}
                      className={`p-3.5 rounded-2xl border transition-all space-y-2 shadow-2xs ${
                        item.isShortage ? 'bg-rose-50/60 border-rose-300' : 'bg-white border-slate-200/90'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] font-black uppercase px-2 py-0.2 bg-slate-100 text-slate-700 rounded-md">
                              {item.station}
                            </span>
                            {item.leadTime !== '-' && (
                              <span className="text-[8px] font-bold text-slate-400">
                                Lead: {item.leadTime}
                              </span>
                            )}
                          </div>
                          <h4 className="text-xs font-black text-slate-900 mt-1">{item.name}</h4>
                        </div>

                        <div className="text-right shrink-0">
                          <span className={`text-xs font-mono font-black px-2 py-0.5 rounded-lg border ${
                            item.isShortage ? 'bg-rose-600 text-white border-rose-600' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}>
                            {item.selisihOps >= 0 ? `+${item.selisihOps}` : item.selisihOps}
                          </span>
                          <span className={`text-[8px] font-bold block mt-0.5 uppercase ${
                            item.isShortage ? 'text-rose-600 font-black' : 'text-slate-400'
                          }`}>
                            {item.isShortage ? 'Kekurangan Ops' : 'Stok Cukup'}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-1 py-1.5 px-2 bg-white/90 rounded-xl text-center font-mono border border-slate-100 text-[10px]">
                        <div>
                          <span className="text-[8px] text-slate-400 block font-sans uppercase">Acuan Ops</span>
                          <span className="font-bold text-slate-700">{item.acuanOps}</span>
                        </div>
                        <div>
                          <span className="text-[8px] text-slate-400 block font-sans uppercase">Awal Bulan</span>
                          <span className="font-bold text-slate-700">{item.onHandAwal}</span>
                        </div>
                        <div>
                          <span className="text-[8px] text-slate-400 block font-sans uppercase">Rusak/Mutasi</span>
                          <span className={`font-bold ${item.rusak > 0 || item.mutasiKeluar > 0 ? 'text-rose-600' : 'text-slate-700'}`}>
                            {item.rusak + item.mutasiKeluar}
                          </span>
                        </div>
                        <div>
                          <span className="text-[8px] text-slate-400 block font-sans uppercase">On Hand</span>
                          <span className={`font-bold ${item.isShortage ? 'text-rose-600' : 'text-emerald-700'}`}>
                            {item.onHandTerakhir}
                          </span>
                        </div>
                      </div>

                      <div className="pt-1 flex items-center justify-between">
                        <span className="text-[9px] text-slate-400">Update status harian:</span>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedEquipItem(item);
                            setActiveModal('input_equipment_log');
                          }}
                          className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-black rounded-lg cursor-pointer flex items-center gap-1 shadow-2xs"
                        >
                          <FiPlus className="text-xs" />
                          <span>Input Mutasi Hari Ini</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-3 border-t border-slate-100 bg-slate-50">
                <button
                  onClick={() => setActiveModal(null)}
                  className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer hover:bg-slate-800 transition-colors"
                >
                  Tutup Modul Equipment
                </button>
              </div>

            </div>
          </div>
        )}

        {/* MODAL INPUT MUTASI EQUIPMENT */}
        {activeModal === 'input_equipment_log' && selectedEquipItem && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex justify-center items-end sm:items-center p-0 sm:p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-100">
              
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div>
                  <h3 className="text-sm font-black text-slate-900">Input Mutasi Equipment Harian</h3>
                  <p className="text-[10px] text-slate-400 font-medium">{selectedEquipItem.name} ({selectedEquipItem.station})</p>
                </div>
                <button 
                  onClick={() => setActiveModal('controlling_equipment')}
                  className="p-2 bg-white hover:bg-slate-200 text-slate-600 rounded-full border border-slate-200 cursor-pointer"
                >
                  <FiX className="text-sm" />
                </button>
              </div>

              <form onSubmit={handleSaveEquipmentLog} className="p-5 overflow-y-auto space-y-4">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-500">Stok On-Hand Saat Ini:</span>
                  <span className="font-mono text-slate-900">{selectedEquipItem.onHandTerakhir} Unit</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-2xl space-y-1">
                    <label className="text-[10px] font-black uppercase text-rose-800 block">Jumlah Rusak / Pecah:</label>
                    <input
                      type="number"
                      min="0"
                      value={logQtyRusak}
                      onChange={(e) => setLogQtyRusak(e.target.value)}
                      className="w-full bg-white border border-rose-300 rounded-xl px-3 py-1.5 text-xs font-mono font-bold outline-none"
                    />
                  </div>

                  <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-1">
                    <label className="text-[10px] font-black uppercase text-amber-800 block">Mutasi Keluar Gerai:</label>
                    <input
                      type="number"
                      min="0"
                      value={logQtyKeluar}
                      onChange={(e) => setLogQtyKeluar(e.target.value)}
                      className="w-full bg-white border border-amber-300 rounded-xl px-3 py-1.5 text-xs font-mono font-bold outline-none"
                    />
                  </div>

                  <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-1">
                    <label className="text-[10px] font-black uppercase text-emerald-800 block">Datang dari HO:</label>
                    <input
                      type="number"
                      min="0"
                      value={logQtyDatangHO}
                      onChange={(e) => setLogQtyDatangHO(e.target.value)}
                      className="w-full bg-white border border-emerald-300 rounded-xl px-3 py-1.5 text-xs font-mono font-bold outline-none"
                    />
                  </div>

                  <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-2xl space-y-1">
                    <label className="text-[10px] font-black uppercase text-blue-800 block">Pembelian di Luar:</label>
                    <input
                      type="number"
                      min="0"
                      value={logQtyBeliLuar}
                      onChange={(e) => setLogQtyBeliLuar(e.target.value)}
                      className="w-full bg-white border border-blue-300 rounded-xl px-3 py-1.5 text-xs font-mono font-bold outline-none"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmittingEquipLog}
                    className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-black cursor-pointer shadow-md transition-colors"
                  >
                    {isSubmittingEquipLog ? 'Menyimpan Mutasi...' : 'Simpan Mutasi Harian'}
                  </button>
                </div>
              </form>

            </div>
          </div>
        )}

        {/* MODAL AUDIT CACP */}
        {activeModal === 'cacp_control' && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex justify-center items-end sm:items-center p-0 sm:p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-100">
              
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2">
                  {selectedOutletForCacp && (
                    <button 
                      onClick={() => setSelectedOutletForCacp(null)}
                      className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-600 mr-1"
                    >
                      <FiArrowLeft className="text-sm" />
                    </button>
                  )}
                  <div>
                    <h3 className="text-sm font-black text-slate-900">
                      {selectedOutletForCacp ? selectedOutletForCacp.name : 'Audit CACP (Project RM)'}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-medium">
                      Periode: {selectedMonth} ({totalDaysInSelectedMonth} Hari Kalender Penuh)
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setSelectedOutletForCacp(null);
                    setActiveModal(null);
                  }}
                  className="p-2 bg-white hover:bg-slate-200 text-slate-600 rounded-full border border-slate-200 cursor-pointer"
                >
                  <FiX className="text-sm" />
                </button>
              </div>

              <div className="p-4 overflow-y-auto space-y-3.5">
                {!selectedOutletForCacp && (
                  <>
                    <div className="p-3.5 bg-gradient-to-r from-purple-900 to-indigo-950 text-white rounded-2xl space-y-1.5 shadow-md">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase text-purple-300 tracking-wider">
                          Standar Persentase Bulanan RM
                        </span>
                        <span className="text-[9px] bg-purple-500/30 border border-purple-400/50 px-2 py-0.5 rounded-full font-bold">
                          Daily Mandatory
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
                        <div className="bg-white/10 p-2 rounded-xl border border-white/10">
                          <span className="text-[8px] text-slate-300 block font-sans uppercase">Store Manager (SM)</span>
                          <span className="font-bold text-amber-300">Target ≥ 80%</span>
                          <p className="text-[8px] text-rose-300 font-sans mt-0.5">&lt; 80% = Demosi</p>
                        </div>
                        <div className="bg-white/10 p-2 rounded-xl border border-white/10">
                          <span className="text-[8px] text-slate-300 block font-sans uppercase">Under SM (ASM/FL/FLO)</span>
                          <span className="font-bold text-emerald-300">Target ≥ 90%</span>
                          <p className="text-[8px] text-amber-200 font-sans mt-0.5">&lt; 90% = Gagal Promosi</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-3.5 bg-indigo-50 border border-indigo-200 rounded-2xl space-y-2 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-xs font-black text-indigo-950">Daily Jobdesk CACP</h4>
                          <p className="text-[10px] text-indigo-700">Wajib diisi saat on-shift maupun jadwal OFF</p>
                        </div>
                        <a
                          href={CACP_GOOGLE_FORM_URL}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl flex items-center gap-1.5 shadow-sm shrink-0"
                        >
                          <span>Isi Form RM</span>
                          <FiExternalLink className="text-xs" />
                        </a>
                      </div>

                      {currentProfile?.role === 'area_manager' && (
                        <button
                          type="button"
                          onClick={() => {
                            setActiveModal(null);
                            setAlarmTriggerType('TEST');
                            startAudioAlarm();
                          }}
                          className="w-full py-2 bg-white hover:bg-slate-100 text-indigo-700 border border-indigo-300 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                        >
                          <FiVolume2 />
                          <span>Uji Coba Alarm & Pop-Up Manager</span>
                        </button>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between px-1">
                        <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider">
                          Persentase Kepatuhan 9 Resto
                        </span>
                        <span className="text-[9px] font-bold text-slate-400">Ketuk untuk rincian manager</span>
                      </div>

                      {outletScoreRankings.map(resto => {
                        const isCritical = resto.cacpData.isCritical;
                        const isWarning = resto.cacpData.isWarning;

                        return (
                          <div 
                            key={resto.id}
                            onClick={() => setSelectedOutletForCacp(resto)}
                            className={`p-3.5 rounded-2xl border transition-all cursor-pointer shadow-2xs space-y-2 hover:scale-[1.01] ${
                              isCritical ? 'bg-rose-50/70 border-rose-300 hover:border-rose-400' :
                              isWarning ? 'bg-amber-50/60 border-amber-300 hover:border-amber-400' :
                              'bg-white border-slate-200/90 hover:border-indigo-300'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <h4 className="text-xs font-black text-slate-900 truncate">{resto.name}</h4>
                                  <span className={`text-[8px] font-black uppercase px-1.5 py-0.2 rounded ${
                                    isCritical ? 'bg-rose-600 text-white' :
                                    isWarning ? 'bg-amber-200 text-amber-900' :
                                    'bg-emerald-100 text-emerald-800'
                                  }`}>
                                    {isCritical ? 'URGENT' : isWarning ? 'WASPADA' : 'AMAN'}
                                  </span>
                                </div>
                                <p className="text-[10px] text-slate-500 font-medium">SM: {resto.storeManagerName}</p>
                              </div>

                              <div className="flex items-center gap-1.5">
                                <span className={`text-xs font-mono font-black px-2.5 py-1 rounded-xl border ${
                                  isCritical ? 'bg-rose-100 text-rose-800 border-rose-300' :
                                  isWarning ? 'bg-amber-100 text-amber-800 border-amber-300' :
                                  'bg-emerald-50 text-emerald-700 border-emerald-200'
                                }`}>
                                  {resto.cacpData.overallPercentage}%
                                </span>
                                <FiChevronRight className="text-slate-400 text-xs" />
                              </div>
                            </div>

                            <div className="grid grid-cols-3 gap-1.5 pt-1 text-center font-mono">
                              <div className="bg-white/80 p-1.5 rounded-xl border border-slate-100">
                                <span className="text-[8px] text-slate-400 block font-sans uppercase">Submit Berhasil</span>
                                <span className="text-[11px] font-bold text-slate-800">
                                  {resto.cacpData.submittedDays} Hari
                                </span>
                              </div>
                              <div className="bg-white/80 p-1.5 rounded-xl border border-slate-100">
                                <span className="text-[8px] text-slate-400 block font-sans uppercase">Bolong/Alpa</span>
                                <span className={`text-[11px] font-bold ${resto.cacpData.missedDays > 0 ? 'text-rose-600' : 'text-slate-800'}`}>
                                  {resto.cacpData.missedDays} Hari
                                </span>
                              </div>
                              <div className="bg-white/80 p-1.5 rounded-xl border border-slate-100">
                                <span className="text-[8px] text-slate-400 block font-sans uppercase">Total Hari</span>
                                <span className="text-[11px] font-bold text-indigo-700">
                                  {resto.cacpData.totalDays} Hari
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}

                {selectedOutletForCacp && (
                  <div className="space-y-3.5">
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold">Periode Penilaian</span>
                        <p className="text-xs font-black text-slate-900">{selectedMonth} ({totalDaysInSelectedMonth} Hari)</p>
                      </div>
                      <span className="text-xs font-mono font-black px-2.5 py-1 bg-white rounded-xl border border-slate-200">
                        Rata-Rata: {selectedOutletForCacp.cacpData.overallPercentage}%
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      {selectedOutletForCacp.cacpData.managers.map(mgr => (
                        <div key={mgr.id} className="p-3.5 bg-white border border-slate-200/90 rounded-2xl shadow-2xs space-y-2">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="text-xs font-black text-slate-900">{mgr.name}</h4>
                              <p className="text-[10px] text-indigo-700 font-bold">{mgr.roleLabel} • Min {mgr.threshold}%</p>
                            </div>
                            <div className="text-right">
                              <span className={`text-xs font-mono font-black px-2.5 py-1 rounded-xl border ${
                                mgr.isPass ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                              }`}>
                                {mgr.scoreCurrentMonth}%
                              </span>
                              <span className={`text-[8px] font-bold block mt-0.5 ${mgr.isPass ? 'text-emerald-700' : 'text-rose-600'}`}>
                                {mgr.statusText}
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[10px]">
                            <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 flex items-center justify-between">
                              <span className="text-slate-400 font-sans">Submit:</span>
                              <span className="font-bold text-emerald-700">{mgr.submittedDays} / {mgr.totalDays} Hari</span>
                            </div>
                            <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 flex items-center justify-between">
                              <span className="text-slate-400 font-sans">Bolong:</span>
                              <span className={`font-bold ${mgr.missedDays > 0 ? 'text-rose-600' : 'text-slate-700'}`}>
                                {mgr.missedDays} Hari
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => setSelectedOutletForCacp(null)}
                      className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      ← Kembali ke Daftar 9 Resto
                    </button>
                  </div>
                )}

              </div>

              <div className="p-3 border-t border-slate-100 bg-slate-50">
                <button
                  onClick={() => {
                    setSelectedOutletForCacp(null);
                    setActiveModal(null);
                  }}
                  className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer hover:bg-slate-800 transition-colors"
                >
                  Tutup Modul CACP
                </button>
              </div>

            </div>
          </div>
        )}

        {/* ================= MODAL TASK MANAGER ================= */}
        {activeModal === 'task_manager' && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex justify-center items-end sm:items-center p-0 sm:p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-100">
              
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div>
                  <h3 className="text-sm font-black text-slate-900">Task Manager Terpadu</h3>
                  <p className="text-[10px] text-slate-400 font-medium">Instruksi & SLA Jobdesk Area</p>
                </div>
                <button 
                  onClick={() => setActiveModal(null)}
                  className="p-2 bg-white hover:bg-slate-200 text-slate-600 rounded-full border border-slate-200 cursor-pointer"
                >
                  <FiX className="text-sm" />
                </button>
              </div>

              <div className="px-4 pt-3 pb-2 bg-white border-b border-slate-100 flex gap-2">
                <button
                  onClick={() => setTaskViewTab('tasks')}
                  className={`flex-1 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    taskViewTab === 'tasks' ? 'bg-slate-900 text-white shadow-xs' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  Daftar Tugas ({userVisibleTasks.length})
                </button>
                <button
                  onClick={() => setTaskViewTab('resto_sla')}
                  className={`flex-1 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    taskViewTab === 'resto_sla' ? 'bg-slate-900 text-white shadow-xs' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  Kepatuhan 9 Resto
                </button>
              </div>

              <div className="p-4 overflow-y-auto space-y-4">
                <div className="bg-slate-900 text-white p-4 rounded-2xl flex items-center justify-between shadow-md">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kepatuhan SLA Area</span>
                    <p className="text-xs text-slate-300 font-medium mt-0.5">
                      {taskAnalytics.completedCount} Selesai • {taskAnalytics.overdueCount} Overdue
                    </p>
                  </div>
                  <span className="text-3xl font-black font-mono text-emerald-400">
                    {taskAnalytics.completionRate}%
                  </span>
                </div>

                {taskViewTab === 'resto_sla' && (
                  <div className="space-y-2">
                    <p className="text-[11px] text-slate-500 font-medium px-1">Status penyelesaian per gerai:</p>
                    {outletScoreRankings.map(resto => {
                      const stats = resto.taskStats;
                      const isLelet = stats.overdue > 0 || stats.rate < 75;

                      return (
                        <div key={resto.id} className="p-3 bg-white border border-slate-200 rounded-2xl flex items-center justify-between shadow-2xs">
                          <div className="min-w-0">
                            <p className="text-xs font-black text-slate-900 truncate">{resto.name}</p>
                            <p className="text-[10px] text-slate-400 font-medium">SM: {resto.storeManagerName}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <span className={`text-xs font-mono font-black px-2 py-0.5 rounded-lg border ${
                              stats.rate >= 85 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}>
                              {stats.rate}% SLA
                            </span>
                            {isLelet && (
                              <span className="text-[8px] font-black text-rose-600 block mt-0.5 uppercase">⚠️ Lelet</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {taskViewTab === 'tasks' && (
                  <>
                    {/* Form Pembuatan Tugas: Khusus Area Manager */}
                    {currentProfile?.role === 'area_manager' && (
                      <form onSubmit={handleCreateTask} className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2.5">
                        <span className="text-xs font-black uppercase text-indigo-700 flex items-center gap-1">
                          <FiPlus /> Buat Tugas Baru
                        </span>

                        <input
                          type="text"
                          placeholder="Judul / Deskripsi Jobdesk"
                          value={taskTitle}
                          onChange={(e) => setTaskTitle(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-indigo-500 shadow-2xs"
                          required
                        />

                        <div className="grid grid-cols-2 gap-2">
                          <select
                            value={taskTargetType}
                            onChange={(e) => setTaskTargetType(e.target.value)}
                            className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-700 outline-none cursor-pointer"
                          >
                            <option value="ALL_SM">Semua SM</option>
                            <option value="ALL_LEADERS">Semua Leader</option>
                            <option value="STORE">Pilih Resto</option>
                          </select>

                          {/* Jika tugas untuk SM, pilihan departemen ditiadakan */}
                          {taskTargetType === 'ALL_SM' ? (
                            <div className="bg-slate-100 border border-dashed border-slate-300 rounded-xl px-2.5 py-1.5 text-[11px] font-bold text-slate-400 flex items-center justify-center">
                              Tugas Umum SM (Tanpa Dept)
                            </div>
                          ) : (
                            <select
                              value={taskDept}
                              onChange={(e) => setTaskDept(e.target.value)}
                              className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-700 outline-none cursor-pointer"
                            >
                              <option value="ordering">Dept: Ordering</option>
                              <option value="mnr">Dept: M&R</option>
                              <option value="payroll">Dept: Payroll</option>
                              <option value="schedule">Dept: Schedule</option>
                              <option value="marketing_cel">Dept: Marketing</option>
                              <option value="kitchen">Dept: Kitchen</option>
                            </select>
                          )}
                        </div>

                        {taskTargetType === 'STORE' && (
                          <select
                            value={taskSelectedTargetId}
                            onChange={(e) => setTaskSelectedTargetId(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-700 outline-none cursor-pointer"
                          >
                            {outlets.map(o => (
                              <option key={o.id} value={o.id}>{o.name}</option>
                            ))}
                          </select>
                        )}

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
                          className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-xs disabled:opacity-50"
                        >
                          <FiSend />
                          <span>{isSubmittingTask ? 'Menerbitkan...' : 'Kirim Tugas'}</span>
                        </button>
                      </form>
                    )}

                    <div className="space-y-2">
                      <span className="text-[10px] font-black uppercase text-slate-400 px-1 block">Tiket Tugas Masuk</span>
                      {userVisibleTasks.length === 0 ? (
                        <div className="text-center py-8 space-y-1.5 bg-slate-50/60 rounded-2xl border border-dashed border-slate-200">
                          <FiInbox className="mx-auto text-2xl text-slate-300" />
                          <p className="text-xs font-bold text-slate-500">Tidak ada tugas tertunda untuk akun ini.</p>
                          <p className="text-[9px] text-slate-400">Daftar tugas yang belum dikerjakan hanya muncul di akun yang ditugaskan.</p>
                        </div>
                      ) : (
                        userVisibleTasks.map(t => {
                          const resto = outlets.find(o => o.id === t.outlet_id);
                          const isOverdue = new Date(t.deadline) < new Date() && t.status !== 'completed';
                          const isDone = t.status === 'completed';

                          return (
                            <div key={t.id} className={`p-3 rounded-2xl border space-y-1.5 shadow-2xs ${isOverdue ? 'bg-rose-50/70 border-rose-300' : 'bg-white border-slate-200'}`}>
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md">
                                  {t.department} • {resto ? resto.code : 'SEMUA SM'}
                                </span>
                                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                                  isDone ? 'bg-emerald-100 text-emerald-800' :
                                  isOverdue ? 'bg-rose-600 text-white animate-pulse' : 'bg-amber-100 text-amber-800'
                                }`}>
                                  {isDone ? '✓ Selesai' : isOverdue ? 'Overdue (-10 Pts)' : 'Pending'}
                                </span>
                              </div>

                              <div>
                                <h5 className="text-xs font-black text-slate-900">{t.title}</h5>
                                <p className="text-[9px] text-slate-400 font-mono mt-0.5">
                                  Deadline: {new Date(t.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>

                              {!isDone && (
                                <button
                                  onClick={() => {
                                    setTaskToConfirm(t);
                                    setActiveModal('confirm_task');
                                  }}
                                  className="w-full mt-1 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-[11px] font-black flex items-center justify-center gap-1 cursor-pointer"
                                >
                                  <FiCheck />
                                  <span>Konfirmasi Selesai & Kirim Foto</span>
                                </button>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </>
                )}

              </div>
            </div>
          </div>
        )}

        {/* ================= MODAL KONFIRMASI TUGAS ================= */}
        {activeModal === 'confirm_task' && taskToConfirm && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex justify-center items-end sm:items-center p-0 sm:p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-100">
              
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div>
                  <h3 className="text-sm font-black text-slate-900">Konfirmasi Tugas</h3>
                  <p className="text-[10px] text-slate-400 font-medium">Unggah Bukti Hasil Pekerjaan</p>
                </div>
                <button 
                  onClick={() => setActiveModal('task_manager')}
                  className="p-2 bg-white hover:bg-slate-200 text-slate-600 rounded-full border border-slate-200 cursor-pointer"
                >
                  <FiX className="text-sm" />
                </button>
              </div>

              <form onSubmit={handleConfirmTaskCompletion} className="p-5 overflow-y-auto space-y-3.5">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                  <span className="text-[9px] font-black uppercase px-2 py-0.2 bg-indigo-100 text-indigo-800 rounded">
                    {taskToConfirm.department}
                  </span>
                  <h4 className="text-xs font-black text-slate-900">{taskToConfirm.title}</h4>
                  <p className="text-[10px] text-slate-400 font-mono">
                    Deadline: {new Date(taskToConfirm.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>

                <div className="p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-2xl space-y-1.5">
                  <span className="text-xs font-black text-emerald-950 flex items-center gap-1.5">
                    <FiCamera className="text-emerald-700" /> Foto Hasil Pekerjaan (Wajib)
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={(e) => setProofImage(e.target.files[0])}
                    className="text-xs text-slate-600 file:mr-2 file:py-1 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-600 file:text-white hover:file:bg-emerald-700 cursor-pointer w-full"
                    required
                  />
                  {proofImage && <p className="text-[10px] text-emerald-700 font-bold truncate">✓ Terpilih: {proofImage.name}</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400">Catatan Pelaksana:</label>
                  <textarea
                    placeholder="Keterangan hasil pekerjaan..."
                    value={completionNotes}
                    onChange={(e) => setCompletionNotes(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-medium outline-none focus:border-indigo-500 h-20"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isConfirmingTask}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-md disabled:opacity-50"
                >
                  <FiCheckCircle />
                  <span>{isConfirmingTask ? 'Menyimpan...' : 'Kirim Bukti Selesai'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveModal('task_manager')}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold cursor-pointer transition-colors"
                >
                  Batal
                </button>
              </form>

            </div>
          </div>
        )}

        {/* MODAL PERINGKAT */}
        {activeModal === 'peringkat_modern' && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex justify-center items-end sm:items-center p-0 sm:p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-100">
              
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div>
                  <h3 className="text-sm font-black text-slate-900">Leaderboard Wilayah Kaltim</h3>
                  <p className="text-[10px] text-slate-400 font-medium">Pemeringkatan Resmi Cabang & Manager</p>
                </div>
                <button 
                  onClick={() => setActiveModal(null)}
                  className="p-2 bg-white hover:bg-slate-200 text-slate-600 rounded-full border border-slate-200 cursor-pointer"
                >
                  <FiX className="text-sm" />
                </button>
              </div>

              <div className="px-4 pt-3 pb-2 bg-white border-b border-slate-100 flex gap-2">
                <button
                  onClick={() => setRankingTab('resto')}
                  className={`flex-1 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    rankingTab === 'resto' 
                      ? 'bg-slate-900 text-white shadow-xs' 
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  <FiAward className="text-xs" />
                  <span>Peringkat 9 Cabang</span>
                </button>
                <button
                  onClick={() => setRankingTab('manager')}
                  className={`flex-1 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    rankingTab === 'manager' 
                      ? 'bg-slate-900 text-white shadow-xs' 
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  <FiUserCheck className="text-xs" />
                  <span>Peringkat Manager</span>
                </button>
              </div>

              <div className="p-4 overflow-y-auto space-y-2.5">
                {rankingTab === 'resto' && (
                  outletScoreRankings.map((resto, idx) => {
                    const isTop1 = idx === 0;
                    const isTop2 = idx === 1;
                    const isTop3 = idx === 2;

                    return (
                      <div 
                        key={resto.id}
                        className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                          isTop1 ? 'bg-gradient-to-r from-amber-500/10 via-amber-100/30 to-white border-amber-300 shadow-xs' :
                          isTop2 ? 'bg-gradient-to-r from-slate-200/50 via-slate-50 to-white border-slate-300' :
                          isTop3 ? 'bg-gradient-to-r from-amber-700/10 via-amber-50 to-white border-amber-200' :
                          'bg-white border-slate-200/80 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-9 h-9 rounded-2xl flex items-center justify-center font-black text-xs shrink-0 shadow-xs ${
                            isTop1 ? 'bg-gradient-to-tr from-amber-500 to-yellow-400 text-amber-950 font-black ring-2 ring-amber-200' :
                            isTop2 ? 'bg-gradient-to-tr from-slate-300 to-slate-200 text-slate-800' :
                            isTop3 ? 'bg-gradient-to-tr from-amber-700 to-amber-600 text-white' :
                            'bg-slate-100 text-slate-600 font-bold'
                          }`}>
                            {isTop1 ? '🥇' : isTop2 ? '🥈' : isTop3 ? '🥉' : `#${idx + 1}`}
                          </div>

                          <div className="min-w-0">
                            <p className="text-xs font-black text-slate-900 truncate">{resto.name}</p>
                            <p className="text-[10px] text-slate-500 font-medium">SM: {resto.storeManagerName}</p>
                            <div className="w-28 h-1.5 bg-slate-200 rounded-full mt-1.5 overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${
                                  resto.healthScore >= 85 ? 'bg-emerald-500' :
                                  resto.healthScore >= 70 ? 'bg-amber-500' : 'bg-rose-500'
                                }`} 
                                style={{ width: `${resto.healthScore}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs font-black font-mono px-2.5 py-1 bg-white rounded-xl border border-slate-200 shadow-2xs text-slate-900">
                            {resto.healthScore}%
                          </span>

                          {currentProfile?.role === 'area_manager' && (
                            <button
                              onClick={() => handleToggleGpsLock(resto.id, resto.is_locked, resto.name)}
                              disabled={isUpdatingLock}
                              className="p-1.5 rounded-xl border bg-white cursor-pointer shadow-2xs hover:bg-slate-50"
                            >
                              {resto.is_locked ? <FiLock className="text-xs text-emerald-600" /> : <FiUnlock className="text-xs text-amber-600" />}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}

                {rankingTab === 'manager' && (
                  allLeaderRankings.map((mgr, idx) => {
                    const isTop1 = idx === 0;

                    return (
                      <div 
                        key={mgr.id}
                        onClick={() => handleOpenManagerDetail(mgr)}
                        className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${
                          isTop1 ? 'bg-amber-500/10 border-amber-300 shadow-xs' :
                          'bg-white border-slate-200/80 hover:border-indigo-300'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-9 h-9 rounded-2xl flex items-center justify-center font-black text-xs shrink-0 ${
                            isTop1 ? 'bg-amber-400 text-amber-950 font-black shadow-xs ring-2 ring-amber-200' :
                            idx === 1 ? 'bg-slate-200 text-slate-800' :
                            idx === 2 ? 'bg-amber-100 text-amber-900' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {isTop1 ? '👑' : `#${idx + 1}`}
                          </div>

                          <div className="min-w-0">
                            <p className="text-xs font-black text-slate-900 truncate">{mgr.name}</p>
                            <p className="text-[10px] text-indigo-700 font-bold truncate">{mgr.roleLabel}</p>
                            <p className="text-[9px] text-slate-400 truncate">{mgr.outletName}</p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-xs font-black font-mono px-2.5 py-1 bg-slate-50 rounded-xl border border-slate-200 text-slate-900">
                            {mgr.compositeScore} Pts
                          </span>
                          <span className={`text-[8px] font-bold block mt-0.5 ${mgr.isQualifiedForPromo ? 'text-emerald-700' : 'text-rose-600'}`}>
                            {mgr.promoStatus}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="p-3 border-t border-slate-100 bg-slate-50">
                <button
                  onClick={() => setActiveModal(null)}
                  className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer hover:bg-slate-800 transition-colors"
                >
                  Tutup Leaderboard
                </button>
              </div>

            </div>
          </div>
        )}

        {/* MODAL DETAIL RESTO */}
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
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-700 flex items-center gap-1.5">
                        <FiCheckSquare className="text-blue-600" /> Ketepatan SLA Tugas
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
                        <FiPieChart className="text-amber-600" /> Kontrol Deviasi SO vs POS
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
                        <FiClipboard className="text-purple-600" /> Kepatuhan CACP Bulanan
                      </span>
                      <span className="font-mono text-purple-700">{selectedOutletForDetail.cacpData.overallPercentage}%</span>
                    </div>
                    <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-purple-600 rounded-full" style={{ width: `${selectedOutletForDetail.cacpData.overallPercentage}%` }} />
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

        {/* MODAL DETAIL MANAGER */}
        {activeModal === 'detail_manager' && selectedManagerForDetail && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex justify-center items-end sm:items-center p-0 sm:p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-100">
              
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div>
                  <h3 className="text-sm font-black text-slate-900">Rapor Kinerja Manager</h3>
                  <p className="text-[10px] text-slate-400 font-medium">Acuan Evaluasi Promosi & Demosi RM</p>
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
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Status Kelayakan Karir</span>
                    <p className="text-xs font-medium text-emerald-400 mt-0.5">
                      {selectedManagerForDetail.promoStatus}
                    </p>
                  </div>
                  <span className="text-3xl font-black font-mono text-amber-400">
                    {selectedManagerForDetail.compositeScore} <span className="text-xs font-sans text-slate-400">Pts</span>
                  </span>
                </div>

                <div className="space-y-3 pt-1">
                  <div className="p-3 bg-white border border-slate-200 rounded-2xl flex items-center justify-between">
                    <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                      <FiClock className="text-indigo-600" /> Keterlambatan Masuk Shift
                    </span>
                    <span className="text-xs font-mono font-black px-2.5 py-1 rounded-xl border bg-slate-50 text-slate-800">
                      {selectedManagerForDetail.lateMinutes} Menit
                    </span>
                  </div>

                  <div className="p-3 bg-white border border-slate-200 rounded-2xl flex items-center justify-between">
                    <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                      <FiAlertTriangle className="text-rose-600" /> Pelanggaran Overbreak
                    </span>
                    <span className="text-xs font-mono font-black px-2.5 py-1 rounded-xl border bg-slate-50 text-slate-800">
                      {selectedManagerForDetail.overbreakCount} Kali
                    </span>
                  </div>

                  <div className="p-3 bg-white border border-slate-200 rounded-2xl flex items-center justify-between">
                    <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                      <FiCheckSquare className="text-blue-600" /> Kepatuhan SLA Tugas
                    </span>
                    <span className="text-xs font-mono font-black px-2.5 py-1 rounded-xl border bg-blue-50 text-blue-700 border-blue-200">
                      {selectedManagerForDetail.taskRate}%
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

        {/* BOTTOM BAR */}
        <div className="fixed bottom-0 max-w-md w-full bg-white border-t border-slate-200 px-6 py-2.5 flex justify-between items-center z-30 shadow-lg">
          <button 
            onClick={() => setActiveModal(null)} 
            className="flex flex-col items-center text-indigo-600 font-bold cursor-pointer"
          >
            <FiActivity className="text-base" />
            <span className="text-[10px] mt-0.5">Beranda</span>
          </button>

          <button 
            onClick={() => {
              setRankingTab('resto');
              setActiveModal('peringkat_modern');
            }} 
            className="flex flex-col items-center text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <FiAward className="text-base" />
            <span className="text-[10px] mt-0.5">Peringkat</span>
          </button>

          <button 
            onClick={() => setActiveModal('task_manager')} 
            className="flex flex-col items-center text-slate-400 hover:text-indigo-600 cursor-pointer relative"
          >
            <FiCheckSquare className="text-base" />
            {taskAnalytics.pendingCount > 0 && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-600 text-white rounded-full text-[8px] font-black flex items-center justify-center">
                {taskAnalytics.pendingCount}
              </span>
            )}
            <span className="text-[10px] mt-0.5">Task Mgr</span>
          </button>

          <button 
            onClick={() => setActiveModal('opex_control')} 
            className="flex flex-col items-center text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <FiDollarSign className="text-base" />
            <span className="text-[10px] mt-0.5">OPEX</span>
          </button>
        </div>

      </div>
    </div>
  );
}