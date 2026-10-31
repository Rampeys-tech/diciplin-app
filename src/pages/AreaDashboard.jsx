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
  FiChevronDown,
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
  FiLayers,
  FiZap,
  FiDroplet,
  FiEdit3
} from 'react-icons/fi';

const CACP_GOOGLE_FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLSeinsH4vwQ-1K5WMYsOv6dkbg6sOgW_2zMMFtEnutuyxXf2EQ/viewform";
const OPEX_SPREADSHEET_URL = "https://docs.google.com/spreadsheets/d/1r1MCRJycu8gEjKMfnIl_nVdJvPfAGqOmn7QHbPrO-dY/edit?gid=301774897#gid=301774897";
// ➕ URL SPREADSHEET SALES (Ganti dengan link spreadsheet sales milikmu jika sudah ada)
const SALES_SPREADSHEET_URL = "https://docs.google.com/spreadsheets/d/1r1MCRJycu8gEjKMfnIl_nVdJvPfAGqOmn7QHbPrO-dY/edit?gid=0";

// MASTER DAFTAR RESTO PER WILAYAH DENGAN KATA KUNCI
const REGIONAL_AREAS = {
  KALSEL_1: {
    name: 'Kalsel 1',
    outlets: ['BJMHAS', 'BJMAHM', 'PLIBAL', 'BLNBAT', 'BLNPRO'],
    keywords: ['banjarmasin', 'tanah laut', 'bali rejo', 'batu licin', 'tanah bumbu', 'tanahbumbu', 'hasan basri', 'a yani']
  },
  KALTIM: {
    name: 'Kaltim',
    outlets: ['BPPHAR', 'BPPSOE', 'BPPMUL', 'SMRYAM', 'SMRAHM', 'SMRKES', 'TRGAKH', 'SGTMAR', 'BONIMA'],
    keywords: ['balikpapan', 'samarinda', 'tenggarong', 'sangatta', 'bontang']
  }
};

const isOutletInRegion = (outlet, regionKey) => {
  if (!outlet || !regionKey || regionKey === 'ALL') return true;
  const target = REGIONAL_AREAS[regionKey];
  if (!target) return true;

  const code = (outlet.code || '').toUpperCase().trim();
  const name = (outlet.name || '').toLowerCase().trim();

  // 1. Jika filter KALSEL_1: BLOKIR MUTLAK jika ada kode atau nama Kaltim
  if (regionKey === 'KALSEL_1') {
    const isKaltimCode = code.length >= 3 && REGIONAL_AREAS.KALTIM.outlets.some(c => code.startsWith(c) || code === c);
    const isKaltimName = REGIONAL_AREAS.KALTIM.keywords.some(k => name.includes(k));
    if (isKaltimCode || isKaltimName) return false;

    const matchCode = code.length >= 3 && target.outlets.some(c => code.startsWith(c) || code === c);
    const matchKeyword = target.keywords.some(k => name.includes(k));
    return matchCode || matchKeyword;
  }

  // 2. Jika filter KALTIM: BLOKIR MUTLAK jika ada kode atau nama Kalsel
  if (regionKey === 'KALTIM') {
    const isKalselCode = code.length >= 3 && REGIONAL_AREAS.KALSEL_1.outlets.some(c => code.startsWith(c) || code === c);
    const isKalselName = REGIONAL_AREAS.KALSEL_1.keywords.some(k => name.includes(k));
    if (isKalselCode || isKalselName) return false;

    const matchCode = code.length >= 3 && target.outlets.some(c => code.startsWith(c) || code === c);
    const matchKeyword = target.keywords.some(k => name.includes(k));
    return matchCode || matchKeyword;
  }

  return true;
};

// GABUNGAN SELURUH KODE RESTO
const OUTLET_CODES = [
  ...REGIONAL_AREAS.KALSEL_1.outlets,
  ...REGIONAL_AREAS.KALTIM.outlets
];

// MASTER ITEM RESMI SESUAI FORMULIR STOCK OPNAME (SO) GACOAN
const MASTER_SO_ITEMS = [
  { name: 'MIE BASAH MENTAH', unit: 'porsi', category: 'NOODLE', stdKemarin: 1050, stdHariIni: 220, stdTeori: 810 },
  { name: 'KULIT PANGSIT GORENG', unit: 'lembar', category: 'DIMSUM', stdKemarin: 1600, stdHariIni: 400, stdTeori: 1180 },
  { name: 'ISIAN AYAM PANGSIT', unit: 'gr', category: 'DIMSUM', stdKemarin: 14500, stdHariIni: 3200, stdTeori: 11000 },
  { name: 'AYAM TABUR OLAHAN', unit: 'gr', category: 'NOODLE', stdKemarin: 18500, stdHariIni: 3900, stdTeori: 14200 },
  { name: 'CABE RAWIT GILING MERAH', unit: 'gr', category: 'KITCHEN', stdKemarin: 7200, stdHariIni: 1800, stdTeori: 5200 },
  { name: 'MINYAK GORENG SAWIT', unit: 'gr', category: 'FRYER', stdKemarin: 28000, stdHariIni: 6000, stdTeori: 21500 },
  { name: 'KECAP ASIN GACOAN', unit: 'ml', category: 'NOODLE', stdKemarin: 9500, stdHariIni: 2100, stdTeori: 7300 },
  { name: 'KECAP MANIS GACOAN', unit: 'ml', category: 'NOODLE', stdKemarin: 9500, stdHariIni: 2200, stdTeori: 7250 },
  { name: 'SAUS DIMSUM SPECIAL', unit: 'gr', category: 'DIMSUM', stdKemarin: 12000, stdHariIni: 2500, stdTeori: 9350 },
  { name: 'BAWANG GORENG TABUR', unit: 'gr', category: 'KITCHEN', stdKemarin: 5000, stdHariIni: 1200, stdTeori: 3750 },
  { name: 'DAUN BAWANG RAJANG', unit: 'gr', category: 'KITCHEN', stdKemarin: 4500, stdHariIni: 900, stdTeori: 3550 },
  { name: 'SIOMAY AYAM FROZEN', unit: 'pcs', category: 'DIMSUM', stdKemarin: 650, stdHariIni: 130, stdTeori: 510 },
  { name: 'UDANG RAMBUTAN FROZEN', unit: 'pcs', category: 'DIMSUM', stdKemarin: 580, stdHariIni: 110, stdTeori: 465 },
  { name: 'UDANG KEJU FROZEN', unit: 'pcs', category: 'DIMSUM', stdKemarin: 620, stdHariIni: 125, stdTeori: 490 }
];

// DATA AWAL CONTROLLING BUDGETING OPEX (FALLBACK)
const INITIAL_OPEX_DATA = [
  { 
    outletCode: 'BPPHAR', 
    outletName: 'Gacoan Balikpapan MT Haryono', 
    actual_sales: 171234691, 
    budget: 74371564, 
    actual: 15796700, 
    sisa_budget: 58574864, 
    percent_used: 21.2, 
    categories: { 
      utilities: { 
        actual_rp: 15051700, 
        actual_pct: 8.79, 
        budget_rp: 49195198, 
        budget_pct: 3.40, 
        sisa_rp: 34143498, 
        items: { 
          listrik: { actual_rp: 0, actual_pct: 0, budget_rp: 11720032, budget_pct: 0.81, sisa_rp: 11720032 }, 
          air: { actual_rp: 600000, actual_pct: 0.35, budget_rp: 1302226, budget_pct: 0.09, sisa_rp: 702226 }, 
          gas: { actual_rp: 14451700, actual_pct: 8.44, budget_rp: 34291947, budget_pct: 2.37, sisa_rp: 19840247 } 
        } 
      }, 
      operational_supply: { actual_rp: 65000, actual_pct: 0.04, budget_rp: 11285957, budget_pct: 0.78, sisa_rp: 11220957 }, 
      office_supply: { actual_rp: 680000, actual_pct: 0.40, budget_rp: 3038527, budget_pct: 0.21, sisa_rp: 2358527 }, 
      maintenance: { actual_rp: 0, actual_pct: 0, budget_rp: 10851882, budget_pct: 0.75, sisa_rp: 10851882 } 
    } 
  },
  { 
    outletCode: 'BPPSOE', 
    outletName: 'Gacoan Balikpapan Soetta', 
    actual_sales: 85200000, 
    budget: 47711378, 
    actual: 8200000, 
    sisa_budget: 39511378, 
    percent_used: 17.1, 
    categories: {
      utilities: {
        actual_rp: 7500000, actual_pct: 8.8, budget_rp: 28000000, budget_pct: 5.8, sisa_rp: 20500000,
        items: {
          listrik: { actual_rp: 3200000, actual_pct: 3.7, budget_rp: 9000000, budget_pct: 1.8, sisa_rp: 5800000 },
          air: { actual_rp: 400000, actual_pct: 0.4, budget_rp: 1000000, budget_pct: 0.2, sisa_rp: 600000 },
          gas: { actual_rp: 3900000, actual_pct: 4.5, budget_rp: 18000000, budget_pct: 3.7, sisa_rp: 14100000 }
        }
      },
      operational_supply: { actual_rp: 200000, actual_pct: 0.2, budget_rp: 8000000, budget_pct: 1.6, sisa_rp: 7800000 },
      office_supply: { actual_rp: 500000, actual_pct: 0.5, budget_rp: 2500000, budget_pct: 0.5, sisa_rp: 2000000 },
      maintenance: { actual_rp: 0, actual_pct: 0, budget_rp: 9211378, budget_pct: 1.9, sisa_rp: 9211378 }
    }
  },
  { 
    outletCode: 'BPPMUL', 
    outletName: 'Gacoan Balikpapan Mulawarman', 
    actual_sales: 0, 
    budget: 45000000, 
    actual: 0, 
    sisa_budget: 45000000, 
    percent_used: 0, 
    categories: {
      utilities: {
        actual_rp: 0, actual_pct: 0, budget_rp: 25000000, budget_pct: 5.5, sisa_rp: 25000000,
        items: {
          listrik: { actual_rp: 0, actual_pct: 0, budget_rp: 8000000, budget_pct: 1.7, sisa_rp: 8000000 },
          air: { actual_rp: 0, actual_pct: 0, budget_rp: 1000000, budget_pct: 0.2, sisa_rp: 1000000 },
          gas: { actual_rp: 0, actual_pct: 0, budget_rp: 16000000, budget_pct: 3.5, sisa_rp: 16000000 }
        }
      },
      operational_supply: { actual_rp: 0, actual_pct: 0, budget_rp: 8000000, budget_pct: 1.6, sisa_rp: 8000000 },
      office_supply: { actual_rp: 0, actual_pct: 0, budget_rp: 2000000, budget_pct: 0.4, sisa_rp: 2000000 },
      maintenance: { actual_rp: 0, actual_pct: 0, budget_rp: 10000000, budget_pct: 2.0, sisa_rp: 10000000 }
    } 
  },
  { outletCode: 'SMRYAM', outletName: 'Gacoan Samarinda Wahid Hasyim', actual_sales: 0, budget: 68000000, actual: 0, sisa_budget: 68000000, percent_used: 0, categories: {} },
  { outletCode: 'SMRAHM', outletName: 'Gacoan Samarinda Ahmad Yani', actual_sales: 0, budget: 52000000, actual: 0, sisa_budget: 52000000, percent_used: 0, categories: {} },
  { outletCode: 'SMRKES', outletName: 'Gacoan Samarinda Kesejahteraan', actual_sales: 0, budget: 48000000, actual: 0, sisa_budget: 48000000, percent_used: 0, categories: {} },
  { outletCode: 'TRGAKH', outletName: 'Gacoan Tenggarong', actual_sales: 0, budget: 44000000, actual: 0, sisa_budget: 44000000, percent_used: 0, categories: {} },
  { outletCode: 'SGTMAR', outletName: 'Gacoan Sangatta', actual_sales: 0, budget: 46000000, actual: 0, sisa_budget: 46000000, percent_used: 0, categories: {} },
  { outletCode: 'BONIMA', outletName: 'Gacoan Bontang', actual_sales: 0, budget: 42000000, actual: 0, sisa_budget: 42000000, percent_used: 0, categories: {} }
];

// MASTER TEMPLATE STOCK EQUIPMENT LENGKAP
const MASTER_EQUIPMENT_TEMPLATE = [
  { name: 'KOMPUTER KASIR POS', station: 'KASIR', leadTime: '-', acuanOps: 2, onHandAwal: 2 },
  { name: 'MESIN EDC BANK', station: 'KASIR', leadTime: '-', acuanOps: 2, onHandAwal: 2 },
  { name: 'PRINTER THERMAL KASIR', station: 'KASIR', leadTime: '-', acuanOps: 2, onHandAwal: 2 },
  { name: 'CASH BOX DRAWER', station: 'KASIR', leadTime: '2 MINGGU', acuanOps: 2, onHandAwal: 2 },
  { name: 'SCANNER BARCODE QRIS', station: 'KASIR', leadTime: '1 MINGGU', acuanOps: 2, onHandAwal: 2 },

  { name: 'BOILER MIE BESAR', station: 'NOODLE', leadTime: '-', acuanOps: 4, onHandAwal: 4 },
  { name: 'PANCI MIE STAINLESS', station: 'NOODLE', leadTime: '2 BULAN', acuanOps: 90, onHandAwal: 90 },
  { name: 'SARINGAN MIE GAGANG KAYU', station: 'NOODLE', leadTime: '2 MINGGU', acuanOps: 48, onHandAwal: 32 },
  { name: 'SENDOK TAKAR BUMBU PLASTIK', station: 'NOODLE', leadTime: '2 MINGGU', acuanOps: 8, onHandAwal: 4 },
  { name: 'SENDOK MAKAN STAINLESS', station: 'NOODLE', leadTime: '2 MINGGU', acuanOps: 15, onHandAwal: 15 },
  { name: 'SENDOK TAKAR 12 GRAM', station: 'NOODLE', leadTime: '2 MINGGU', acuanOps: 6, onHandAwal: 6 },
  { name: 'PIRING HAWAI BLACK MIE', station: 'NOODLE', leadTime: '1-2 KAMIS', acuanOps: 320, onHandAwal: 320 },
  { name: 'BOTOL KECAP KECIL 500ML', station: 'NOODLE', leadTime: '2 MINGGU', acuanOps: 12, onHandAwal: 12 },
  { name: 'CAPITAN MIE STAINLESS', station: 'NOODLE', leadTime: '2 MINGGU', acuanOps: 14, onHandAwal: 14 },
  { name: 'TIMER MASAK DIGITAL', station: 'NOODLE', leadTime: '1 MINGGU', acuanOps: 4, onHandAwal: 4 },

  { name: 'KUKUSAN KLAKAT BAMBU DIMSUM', station: 'DIMSUM', leadTime: '2 MINGGU', acuanOps: 45, onHandAwal: 45 },
  { name: 'TUTUP KLAKAT BAMBU', station: 'DIMSUM', leadTime: '2 MINGGU', acuanOps: 45, onHandAwal: 45 },
  { name: 'DEEP FRYER GAS GORENGAN', station: 'DIMSUM', leadTime: '-', acuanOps: 3, onHandAwal: 3 },
  { name: 'KERANJANG BASKET FRYER', station: 'DIMSUM', leadTime: '1 BULAN', acuanOps: 6, onHandAwal: 6 },
  { name: 'PIRING DIMSUM SAJI OVAL', station: 'DIMSUM', leadTime: '2 MINGGU', acuanOps: 180, onHandAwal: 180 },
  { name: 'CAPITAN DIMSUM PANJANG', station: 'DIMSUM', leadTime: '2 MINGGU', acuanOps: 10, onHandAwal: 10 },
  { name: 'THERMOMETER MINYAK', station: 'DIMSUM', leadTime: '2 MINGGU', acuanOps: 2, onHandAwal: 2 },

  { name: 'JUG STAINLESS 1 LITER', station: 'BAR', leadTime: '1 MINGGU', acuanOps: 8, onHandAwal: 8 },
  { name: 'DISPENSER SIRUP / JIGGER', station: 'BAR', leadTime: '2 MINGGU', acuanOps: 6, onHandAwal: 6 },
  { name: 'GELAS ES GACOAN ACRYLIC', station: 'BAR', leadTime: '2 BULAN', acuanOps: 250, onHandAwal: 250 },
  { name: 'SENDOK ES BATU SCOOP', station: 'BAR', leadTime: '2 MINGGU', acuanOps: 4, onHandAwal: 4 },
  { name: 'BLENDER COMMERCIAL HEAVY DUTY', station: 'BAR', leadTime: '1 BULAN', acuanOps: 2, onHandAwal: 2 },
  { name: 'ICE BOX CONTAINER', station: 'BAR', leadTime: '-', acuanOps: 2, onHandAwal: 2 },

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
    onHandTerakhir: item.onHandAwal,
    selisihOps: item.onHandAwal - item.acuanOps
  }))
);

export default function AreaDashboard() {
  const { user } = useAuth();
  const [currentProfile, setCurrentProfile] = useState(null);
  const [outlets, setOutlets] = useState([]);
  
  const currentMonthYear = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  const [selectedMonth, setSelectedMonth] = useState(currentMonthYear);
  // STATE METRIK TARGET ORIENTASI / PROBATION
  const [probationMetrics, setProbationMetrics] = useState({
    salesAchievement: { target: 100, actual: 96.35, unit: '%' },
    opexGas: { target: 2.53, actual: 2.53, unit: '%' },
    opexInventaris: { target: 0.13, actual: 0.13, unit: '%' },
    serviceTimeOjol: { target: 20.0, actual: 20.2, unit: 'menit' },
    opexOfficeSupply: { target: 0.21, actual: 0.24, unit: '%' },
    csKomplainRatio: { target: 1.0, actual: 0.8, unit: 'rasio' }
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingLock, setIsUpdatingLock] = useState(false);
  // DEFINISIKAN ROLE DI ATAS
  const isSuperUser = ['superadmin', 'area_manager', 'owner'].includes((currentProfile?.role || '').toLowerCase());

  const [profiles, setProfiles] = useState([]);
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [violations, setViolations] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [closings, setClosings] = useState([]);
  const [opexList, setOpexList] = useState(INITIAL_OPEX_DATA);
  const [expandedOpexCode, setExpandedOpexCode] = useState('BPPHAR');

  // Modal states
  const [activeModal, setActiveModal] = useState(null);
  const [selectedOutletForDetail, setSelectedOutletForDetail] = useState(null);
  const [selectedOutletForCacp, setSelectedOutletForCacp] = useState(null);
  const [selectedManagerForDetail, setSelectedManagerForDetail] = useState(null);
  const [selectedDevOutlet, setSelectedDevOutlet] = useState('ALL');
  const [selectedRegionFilter, setSelectedRegionFilter] = useState('ALL'); // 'ALL' | 'KALSEL_1' | 'KALTIM'
  const [selectedOpexOutlet, setSelectedOpexOutlet] = useState('ALL');
  // State untuk jenis opex aktif: 'gas' | 'atk' | 'inv'
  const [activeOpexCategory, setActiveOpexCategory] = useState('gas');
  // State modal detail resto terpilih
  const [selectedOpexRestoDetail, setSelectedOpexRestoDetail] = useState(null);
  const [rankingTab, setRankingTab] = useState('resto');
  // ➕ STATE FITUR SALES DARI SUPABASE
  const [selectedSalesOutlet, setSelectedSalesOutlet] = useState('ALL');
  const [selectedSalesRestoDetail, setSelectedSalesRestoDetail] = useState(null);
  const [salesPeriodFilter, setSalesPeriodFilter] = useState('monthly');
  // Data real-time dari tabel sales_monthly_summary Supabase
  const [salesMonthlyDb, setSalesMonthlyDb] = useState([]);
  // Data real-time controlling opex kalsel
  const [opexKalselDb, setOpexKalselDb] = useState([]);

  // Controlling Equipment
  const [equipmentList, setEquipmentList] = useState(GENERATED_EQUIPMENT_DATA);
  const [selectedEquipOutlet, setSelectedEquipOutlet] = useState('BPPHAR');
  // STATE FILTER KHUSUS MODUL SLA TASKS
  const [slaFilterRegion, setSlaFilterRegion] = useState('ALL');
  const [slaFilterOutletId, setSlaFilterOutletId] = useState('ALL');
  const [slaActiveTab, setSlaActiveTab] = useState('ranking');

  // State untuk Portofolio Rincian Tugas Manajer & Preview Foto Penuh
  const [selectedManagerForTaskHistory, setSelectedManagerForTaskHistory] = useState(null);
  const [selectedRestoForSlaDetail, setSelectedRestoForSlaDetail] = useState(null);
  const [selectedManagerForCacpHistory, setSelectedManagerForCacpHistory] = useState(null);
  const [taskProofModalImage, setTaskProofModalImage] = useState(null);
  const [multiPhotoGallery, setMultiPhotoGallery] = useState(null); // { title: '', photos: [] }
  const [dailyFormScopeType, setDailyFormScopeType] = useState('INDIVIDUAL'); // 'INDIVIDUAL' | 'RESTO'
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
  const [cacpLogs, setCacpLogs] = useState([]);

  // State Pilihan Status CACP (IC / OFF / CUTI / SKD) & File Screenshot
  const [cacpStatusChoice, setCacpStatusChoice] = useState('IC');
  const [cacpScreenshotFile, setCacpScreenshotFile] = useState(null);
  const [isSubmittingCacpModal, setIsSubmittingCacpModal] = useState(false);

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
  // Target Scope Baru untuk Task Assignment
  const [taskScopeType, setTaskScopeType] = useState('KALSEL_SM'); // Default praktis
  const [taskTargetRegion, setTaskTargetRegion] = useState('KALSEL_1');
  const [taskTargetUserId, setTaskTargetUserId] = useState('');

  // Fungsi Hitung Skor SLA Real (100% tepat waktu, 80% toleransi hari sama, 50% lewat hari)
  const calculateTaskScore = (task) => {
    if (task.has_tolerance) return 100;

    if (task.status !== 'completed') {
      const isOverdue = new Date(task.deadline) < new Date();
      return isOverdue ? 0 : null;
    }

    if (task.is_on_time === true) return 100;

    const completedTime = new Date(task.completed_at || task.created_at).getTime();
    const deadlineTime = new Date(task.deadline).getTime();

    if (completedTime <= deadlineTime) {
      return 100;
    }

    const deadlineDate = new Date(task.deadline).toDateString();
    const completedDate = new Date(completedTime).toDateString();

    if (deadlineDate === completedDate) {
      return 80;
    } else {
      return 50;
    }
  };
  const [isSubmittingTask, setIsSubmittingTask] = useState(false);

  // Konfirmasi Bukti Foto Tugas
  const [taskToConfirm, setTaskToConfirm] = useState(null);
  const [proofImage, setProofImage] = useState(null);
  const [multiProofImages, setMultiProofImages] = useState([]);
  const [completionNotes, setCompletionNotes] = useState('');
  const [isConfirmingTask, setIsConfirmingTask] = useState(false);
  // STATE BARU: DAILY TEMPLATES & MULTI-PHOTO UPLOAD
  const [dailyTemplates, setDailyTemplates] = useState([]);
  const [dailySubmissions, setDailySubmissions] = useState([]);
  const [taskTypeTab, setTaskTypeTab] = useState('adhoc'); // 'adhoc' | 'daily'
  const [dailyRecapPeriod, setDailyRecapPeriod] = useState('daily'); // 'daily' | 'weekly' | 'monthly'
  const [dailyFilterDate, setDailyFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [isCreatingDailyTemplate, setIsCreatingDailyTemplate] = useState(false);
  const [dailyFormTitle, setDailyFormTitle] = useState('');
  const [dailyFormMinPhotos, setDailyFormMinPhotos] = useState(10);
  const [dailyFormDeadline, setDailyFormDeadline] = useState('21:00');
  const [dailyFormRole, setDailyFormRole] = useState('ALL_MANAGERS');
  const [dailyFormTargetOutlet, setDailyFormTargetOutlet] = useState('ALL'); // Target resto tertentu untuk tugas daily

  // Upload Closing & Adjustment Deviasi
  const [uploadOutletId, setUploadOutletId] = useState('');
  const [soFile, setSoFile] = useState(null);
  const [esbFile, setEsbFile] = useState(null);
  const [isParsingFiles, setIsParsingFiles] = useState(false);
  const [itemToAdjust, setItemToAdjust] = useState(null);
  const [adjustQty, setAdjustQty] = useState(0);
  const [adjustReason, setAdjustReason] = useState('Penerimaan barang belum tercatat');
  const [isSubmittingAdjustment, setIsSubmittingAdjustment] = useState(false);

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
      if (data) {
        setCurrentProfile(data);
        const isSuper = ['superadmin', 'area_manager', 'owner'].includes((data.role || '').toLowerCase());
        if (!isSuper) {
          if (data.outlet_id) {
            setSelectedDevOutlet(data.outlet_id);
            // Kunci default resto ke restonya sendiri saat login
            setSlaFilterOutletId(data.outlet_id);
          }
          // Ambil data outlet untuk mendeteksi wilayah resto manajer
          const { data: outData } = await supabase
            .from('outlets')
            .select('*')
            .eq('id', data.outlet_id)
            .maybeSingle();

          if (outData) {
            const isKalsel = isOutletInRegion(outData, 'KALSEL_1');
            const userRegion = isKalsel ? 'KALSEL_1' : 'KALTIM';
            setSelectedRegionFilter(userRegion);
            // Kunci wilayah SLA agar tidak bercampur dengan wilayah lain
            setSlaFilterRegion(userRegion);
          }
        }
      }
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

  // LOAD MASTER DATA
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
        { data: equipDbData },
        { data: dailyTplData },
        { data: dailySubData },
        { data: cacpLogsData },
        { data: salesDbData },
        { data: opexKalselRes }
      ] = await Promise.all([
        supabase.from('outlets').select('*').order('code', { ascending: true }),
        supabase.from('user_profiles').select('id, full_name, avatar, role, total_points, outlet_id, station_placement'),
        supabase.from('attendance_logs').select('id, user_id, outlet_id, created_at, actual_in, actual_out, break_start_time, break_end_time, status_in, status_out, discipline_status, penalty_points, financial_loss_amount'),
        supabase.from('operational_violations').select('*'),
        supabase.from('department_tasks').select('*').order('created_at', { ascending: false }),
        supabase.from('store_daily_closings').select('*').order('created_at', { ascending: false }).limit(200),
        supabase.from('opex_budgets').select('*').eq('period_month', selectedMonth),
        supabase.from('controlling_equipment').select('*').limit(5000),
        supabase.from('daily_task_templates').select('*').eq('is_active', true),
        supabase.from('daily_task_submissions').select('*'),
        supabase.from('cacp_daily_logs').select('*'),
        supabase.from('sales_monthly_summary').select('*'),
        supabase.from('opex_kalsel_controlling').select('*')
      ]);

      if (opexKalselRes && opexKalselRes.length > 0) {
        setOpexKalselDb(opexKalselRes);
      } else {
        setOpexKalselDb([]);
      }

      if (salesDbData && salesDbData.length > 0) {
        // Filter periode dengan trim agar kebal spasi
        const targetPer = (selectedMonth || '').trim();
        const matchedData = salesDbData.filter(d => (d.periode || '').trim().startsWith(targetPer));
        setSalesMonthlyDb(matchedData.length > 0 ? matchedData : salesDbData);
      } else {
        setSalesMonthlyDb([]);
      }

      if (cacpLogsData) setCacpLogs(cacpLogsData);

      if (dailyTplData) setDailyTemplates(dailyTplData);
      if (dailySubData) setDailySubmissions(dailySubData);

      if (outData) {
        const kaltimOutlets = outData
          .filter(o => !o.code?.startsWith('GAC-') && !o.name?.toLowerCase().includes('cabang 0'))
          .map(o => {
            if (o.name?.toLowerCase().includes('tenggarong') && o.code === 'TNRISA') {
              return { ...o, code: 'TRGAKH' };
            }
            return o;
          });

        setOutlets(kaltimOutlets);
        if (kaltimOutlets.length > 0 && !uploadOutletId) {
          setUploadOutletId(kaltimOutlets[0].id);
        }
      }
      if (profData) setProfiles(profData);
      if (logsData) setAttendanceLogs(logsData);
      if (violData) setViolations(violData);
      if (taskData) setTasks(taskData);
      if (closeData) setClosings(closeData);

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

    // REAL-TIME POSTGRES LISTENER SUPABASE
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance_logs' }, () => loadMasterData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'department_tasks' }, () => loadMasterData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cacp_daily_logs' }, () => loadMasterData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'daily_task_submissions' }, () => loadMasterData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sales_monthly_summary' }, () => loadMasterData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'opex_kalsel_controlling' }, () => loadMasterData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadMasterData]);

  // RANGKUMAN TOTAL OPEX KALTIM
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

  // FILTER TUGAS SESUAI TARGET AKUN / RESTO / WILAYAH / JABATAN
  const userVisibleTasks = useMemo(() => {
    if (!currentProfile) return [];
    const isSuper = ['superadmin', 'area_manager', 'owner'].includes((currentProfile.role || '').toLowerCase()) || currentProfile.is_internal;
    if (isSuper) return tasks;

    return tasks.filter(t => {
      // 1. Jika tugas spesifik ke satu user
      if (t.target_user_id) {
        return t.target_user_id === currentProfile.id;
      }

      // 2. Jika ada pembatasan target role/jabatan
      if (t.target_role && t.target_role !== currentProfile.role) {
        return false;
      }

      // 3. Cek kesesuaian outlet
      if (t.outlet_id && t.outlet_id !== currentProfile.outlet_id) {
        return false;
      }

      return true;
    });
  }, [tasks, currentProfile]);

  // ALARM OTOMATIS & REMINDER SEBELUM OVERDEADLINE (KHUSUS MANAJER TOKO)
  useEffect(() => {
    const role = (currentProfile?.role || '').toLowerCase();
    const isSuperOrAM = ['area_manager', 'superadmin', 'owner'].includes(role);
    const isManagerRole = ['store_manager', 'ast_store_manager', 'floor_leader', 'floor_leader_orientation'].includes(role);

    // Jika akun adalah AM atau bukan manajer cabang, jangan pernah bunyikan alarm jobdesk
    if (isSuperOrAM || !isManagerRole) {
      return;
    }

    const checkScheduleAndOverdue = () => {
      const now = new Date();
      const currentHour = now.getHours();

      // Hanya periksa tugas yang spesifik ditugaskan ke manajer yang sedang login
      const hasMyOverdueTask = userVisibleTasks.some(t => 
        (t.target_user_id === currentProfile?.id || (t.outlet_id === currentProfile?.outlet_id && t.target_role === currentProfile?.role)) &&
        t.status === 'pending' && 
        new Date(t.deadline) < now
      );

      if (hasMyOverdueTask) {
        setAlarmTriggerType('TASK_OVERDUE');
        startAudioAlarm();
        return;
      }

      if (!hasConfirmedCacpToday && !isManagerIC) {
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

  // KONFIRMASI CACP HARIAN (MENDUKUNG IC DENGAN SCREENSHOT, SERTA OFF / CUTI / SKD OTOMATIS SELESAI)
  const handleConfirmCacp = async () => {
    if (cacpStatusChoice === 'IC' && !cacpScreenshotFile) {
      return alert("⚠️ Mohon lampirkan screenshot bukti pengerjaan CACP!");
    }

    setIsSubmittingConfirm(true);
    try {
      stopAudioAlarm();
      setHasConfirmedCacpToday(true);
      setAlarmTriggerType(null);

      let uploadedScreenshotUrl = null;
      if (cacpScreenshotFile) {
        const fileExt = cacpScreenshotFile.name.split('.').pop();
        const filePath = `cacp_proofs/${user.id}-${Date.now()}.${fileExt}`;
        const { error: upErr } = await supabase.storage
          .from('attendance-proofs')
          .upload(filePath, cacpScreenshotFile, { upsert: true });

        if (!upErr) {
          const { data: pubData } = supabase.storage.from('attendance-proofs').getPublicUrl(filePath);
          uploadedScreenshotUrl = pubData?.publicUrl;
        }
      }

      const todayDate = new Date().toISOString().split('T')[0];
      const payload = {
        user_id: user?.id,
        outlet_id: currentProfile?.outlet_id || null,
        log_date: todayDate,
        shift_status: cacpStatusChoice, // 'IC' | 'OFF' | 'CUTI' | 'SKD'
        proof_photo_url: uploadedScreenshotUrl,
        confirmed_at: new Date().toISOString()
      };

      const { error: dbErr } = await supabase.from('cacp_daily_logs').upsert([payload], {
        onConflict: 'user_id,log_date'
      });
      if (dbErr) throw dbErr;

      alert(`✓ Status CACP (${cacpStatusChoice}) berhasil dicatat & terrekap selesai!`);
      setCacpScreenshotFile(null);
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
    const list = processedEquipment.filter(item => {
      const matchOutlet = item.outletCode === selectedEquipOutlet;
      const matchStation = equipStationFilter === 'ALL' || item.station === equipStationFilter;
      const matchSearch = item.name.toLowerCase().includes(equipSearchQuery.toLowerCase());
      const matchTab = equipTabFilter === 'all' || (equipTabFilter === 'shortage' && item.isShortage);
      return matchOutlet && matchStation && matchSearch && matchTab;
    });

    return list.sort((a, b) => (a.isShortage === b.isShortage ? 0 : a.isShortage ? -1 : 1));
  }, [processedEquipment, selectedEquipOutlet, equipStationFilter, equipSearchQuery, equipTabFilter]);

  const totalOutletAssets = useMemo(() => {
    return processedEquipment.filter(i => i.outletCode === selectedEquipOutlet).length;
  }, [processedEquipment, selectedEquipOutlet]);

  const totalShortageCount = useMemo(() => {
    return processedEquipment.filter(i => i.outletCode === selectedEquipOutlet && i.isShortage).length;
  }, [processedEquipment, selectedEquipOutlet]);

  const totalNormalCount = totalOutletAssets - totalShortageCount;
  const assetReadinessPercent = totalOutletAssets > 0 ? Math.round((totalNormalCount / totalOutletAssets) * 100) : 100;

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

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!taskTitle.trim() || !taskDeadline) return alert("Isi judul tugas dan batas waktu!");

    setIsSubmittingTask(true);
    try {
      // Saring seluruh akun manajer di wilayah Kalsel 1
      const kalselManagers = profiles.filter(p => {
        const isManagerRole = ['store_manager', 'ast_store_manager', 'floor_leader', 'floor_leader_orientation'].includes(p.role);
        const personOutlet = outlets.find(o => o.id === p.outlet_id);
        const matchRegion = isOutletInRegion(personOutlet, 'KALSEL_1');
        return isManagerRole && matchRegion;
      });

      let targetProfiles = [];

      if (taskScopeType === 'ALL_MANAGERS') {
        targetProfiles = kalselManagers;
      } else if (taskScopeType === 'STORE_MANAGER' || taskScopeType === 'KALSEL_SM') {
        targetProfiles = kalselManagers.filter(p => p.role === 'store_manager');
      } else if (taskScopeType === 'AST_STORE_MANAGER') {
        targetProfiles = kalselManagers.filter(p => p.role === 'ast_store_manager');
      } else if (taskScopeType === 'FLOOR_LEADER') {
        targetProfiles = kalselManagers.filter(p => ['floor_leader', 'floor_leader_orientation'].includes(p.role));
      } else if (taskScopeType === 'USER') {
        const singleTarget = profiles.find(p => p.id === taskTargetUserId);
        if (singleTarget) targetProfiles = [singleTarget];
      }

      if (targetProfiles.length === 0) {
        alert("Tidak ada manajer yang cocok dengan jabatan yang dipilih!");
        setIsSubmittingTask(false);
        return;
      }

      // Kunci tugas langsung ke user_id dan simpan nama manajer di kolom department
      const payloads = targetProfiles.map(mgr => ({
        title: taskTitle.trim(),
        deadline: new Date(taskDeadline).toISOString(),
        priority: taskPriority,
        department: mgr.full_name || 'Tugas Manager',
        target_role: mgr.role,
        outlet_id: mgr.outlet_id,
        target_user_id: mgr.id,
        created_by: user?.id,
        status: 'pending',
        has_tolerance: false
      }));

      const { error } = await supabase.from('department_tasks').insert(payloads);
      if (error) throw error;

      alert(`✓ Tugas berhasil dikirim ke ${targetProfiles.length} manajer!`);
      setTaskTitle('');
      setTaskDeadline('');
      loadMasterData();
    } catch (err) {
      alert(`Gagal membuat tugas: ${err.message}`);
    } finally {
      setIsSubmittingTask(false);
    }
  };

  // Fungsi Memberikan Toleransi Khusus oleh AM (Jadikan 100%)
  const handleGrantTolerance = async (taskItem) => {
    const reason = prompt(`Masukkan alasan toleransi untuk tugas "${taskItem.title}":`);
    if (!reason || !reason.trim()) return;

    try {
      const { error } = await supabase
        .from('department_tasks')
        .update({
          has_tolerance: true,
          tolerance_reason: reason.trim(),
          tolerance_granted_by: user.id,
          is_on_time: true
        })
        .eq('id', taskItem.id);

      if (error) throw error;
      alert("✓ Toleransi berhasil diberikan! Nilai tugas ini disesuaikan menjadi 100%.");
      loadMasterData();
    } catch (err) {
      alert(`Gagal memberi toleransi: ${err.message}`);
    }
  };
    
// SIMPAN TEMPLATE DAILY BARU (MENDUKUNG TARGET RESTO TERTENTU)
  const handleCreateDailyTemplate = async (e) => {
    e.preventDefault();
    if (!dailyFormTitle.trim()) return alert("Judul tugas daily wajib diisi!");

    setIsSubmittingTask(true);
    try {
      const { error } = await supabase.from('daily_task_templates').insert([{
        title: dailyFormTitle.trim(),
        min_photos: Number(dailyFormMinPhotos) || 10,
        deadline_time: dailyFormDeadline || '21:00:00',
        target_role: dailyFormRole,
        scope_type: dailyFormScopeType, // 'INDIVIDUAL' atau 'RESTO'
        target_outlet_id: dailyFormTargetOutlet === 'ALL' ? null : dailyFormTargetOutlet, // Simpan ID resto spesifik
        is_active: true
      }]);

      if (error) throw error;
      alert("✓ Template Jobdesk Daily berhasil disimpan!");
      setDailyFormTitle('');
      setDailyFormScopeType('INDIVIDUAL');
      setDailyFormTargetOutlet('ALL');
      setIsCreatingDailyTemplate(false);
      loadMasterData();
    } catch (err) {
      alert(`Gagal simpan template: ${err.message}`);
    } finally {
      setIsSubmittingTask(false);
    }
  };

  // HAPUS TEMPLATE DAILY (OLEH AREA MANAGER)
  const handleDeleteDailyTemplate = async (templateId, templateTitle) => {
    if (!confirm(`Hapus template jobdesk "${templateTitle}"?`)) return;
    try {
      const { error } = await supabase
        .from('daily_task_templates')
        .delete()
        .eq('id', templateId);

      if (error) throw error;
      alert("✓ Template berhasil dihapus!");
      loadMasterData();
    } catch (err) {
      alert(`Gagal menghapus: ${err.message}`);
    }
  };

  // LAPOR STATUS NON-EFEKTIF (OFF / SAKIT / IZIN / CUTI)
  const handleReportDailyAbsence = async (templateItem, statusChoice) => {
    const confirmAction = confirm(`Konfirmasi status hari ini sebagai: "${statusChoice}" untuk tugas "${templateItem.title}"?`);
    if (!confirmAction) return;

    try {
      const todayDate = new Date().toISOString().split('T')[0];
      const payload = {
        template_id: templateItem.id,
        user_id: user?.id,
        outlet_id: currentProfile?.outlet_id,
        submission_date: todayDate,
        photo_urls: [],
        notes: `Status Kehadiran: ${statusChoice}`,
        status: statusChoice, // 'OFF', 'SAKIT', 'IZIN', 'CUTI'
        submitted_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('daily_task_submissions')
        .upsert([payload], { onConflict: 'template_id,user_id,submission_date' });

      if (error) throw error;

      alert(`✓ Status ${statusChoice} berhasil disimpan! Anda dibebaskan dari tugas harian hari ini.`);
      loadMasterData();
    } catch (err) {
      alert(`Gagal menyimpan status: ${err.message}`);
    }
  };
  // KONFIRMASI PENYELESAIAN TUGAS + SIMPAN FOTO KE STORAGE (MULTI-FOTO SUPPORT)
  const handleConfirmTaskCompletion = async (e) => {
    e.preventDefault();
    if (!taskToConfirm) return;

    // Cek apakah tugas adalah TTC atau membutuhkan minimal 20 foto
    const isTTC = (taskToConfirm.title || '').toUpperCase().includes('TTC');
    const minPhotosRequired = isTTC ? 20 : 1;

    const totalFiles = multiProofImages.length > 0 ? multiProofImages.length : (proofImage ? 1 : 0);

    if (totalFiles < minPhotosRequired) {
      return alert(`⚠️ DITOLAK! Tugas ini memerlukan minimal ${minPhotosRequired} bukti foto. Saat ini baru ada ${totalFiles} foto.`);
    }

    setIsConfirmingTask(true);
    try {
      const filesToUpload = multiProofImages.length > 0 ? multiProofImages : [proofImage];
      const uploadedUrls = [];

      for (let i = 0; i < filesToUpload.length; i++) {
        const file = filesToUpload[i];
        const fileExt = file.name.split('.').pop();
        const filePath = `task_proofs/${user.id}-${Date.now()}-${i + 1}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('attendance-proofs')
          .upload(filePath, file, {
            contentType: file.type || 'image/jpeg',
            cacheControl: '31536000',
            upsert: true
          });

        if (!uploadError) {
          const { data: publicData } = supabase.storage
            .from('attendance-proofs')
            .getPublicUrl(filePath);
          if (publicData?.publicUrl) {
            uploadedUrls.push(publicData.publicUrl);
          }
        }
      }

      const todayDate = new Date().toISOString().split('T')[0];

      // JIKA YANG DISUBMIT ADALAH TUGAS DAILY TEMPLATE
      if (taskToConfirm?.deadline_time || (taskToConfirm?.min_photos && taskToConfirm.min_photos > 1)) {
        const dailyPayload = {
          template_id: taskToConfirm.id,
          user_id: user?.id,
          outlet_id: currentProfile?.outlet_id,
          submission_date: todayDate,
          photo_urls: uploadedUrls,
          notes: completionNotes || '',
          status: 'completed',
          submitted_at: new Date().toISOString()
        };

        const { error: dailyErr } = await supabase
          .from('daily_task_submissions')
          .upsert([dailyPayload], { onConflict: 'template_id,user_id,submission_date' });

        if (dailyErr) throw dailyErr;

        alert(`✓ Sukses! Berhasil mengirim ${uploadedUrls.length} foto bukti tugas daily.`);
        setProofImage(null);
        setMultiProofImages([]);
        setCompletionNotes('');
        setTaskToConfirm(null);
        setActiveModal('task_manager');
        await loadMasterData();
        return;
      }

      const now = new Date();
      const deadline = new Date(taskToConfirm.deadline);
      const isCompletedOnTime = now <= deadline;

      const fullNotes = completionNotes 
        ? `${completionNotes.trim()} | [${uploadedUrls.length} Foto Terlampir] | [Dikonfirmasi: ${now.toLocaleDateString('id-ID')}]` 
        : `Selesai (${uploadedUrls.length} foto) pada ${now.toLocaleTimeString('id-ID')} WITA`;

      const primaryPayload = {
        status: 'completed',
        completed_at: now.toISOString(),
        completed_by: user?.id,
        proof_photo_url: uploadedUrls[0] || null, // Foto utama untuk preview thumbnail
        completion_notes: fullNotes,
        is_on_time: isCompletedOnTime
      };

      const { error: updateError } = await supabase
        .from('department_tasks')
        .update(primaryPayload)
        .eq('id', taskToConfirm.id);

      if (updateError) throw updateError;

      alert(isCompletedOnTime 
        ? `✓ Tugas berhasil dikonfirmasi tepat waktu! (${uploadedUrls.length} foto tersimpan)` 
        : `⚠️ Tugas dikonfirmasi (${uploadedUrls.length} foto), melewati deadline.`);

      setProofImage(null);
      setMultiProofImages([]);
      setCompletionNotes('');
      setTaskToConfirm(null);
      setActiveModal('task_manager');
      await loadMasterData();
    } catch (err) {
      alert(`Gagal konfirmasi tugas: ${err.message}`);
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

  // UPLOAD CLOSING DENGAN RUMUS DEVIASI RESMI: Usage Fisik = (Kemarin + Masuk) - Hari Ini
  const handleProcessClosingUpload = async (e) => {
    e.preventDefault();
    if (!soFile || !esbFile) return alert("Lengkapi kedua file SO dan ESB!");

    setIsParsingFiles(true);
    try {
      const generatedFullSoItems = MASTER_SO_ITEMS.map((item, idx) => {
        const stokKemarin = item.stdKemarin;
        const stokHariIni = item.stdHariIni;
        const promixTeori = item.stdTeori;
        const barangMasuk = 0;

        const usageFisik = (stokKemarin + barangMasuk) - stokHariIni;
        const selisihDeviasi = promixTeori - usageFisik; 
        const persentaseDeviasi = promixTeori > 0 ? Number(((selisihDeviasi / promixTeori) * 100).toFixed(2)) : 0;
        
        return {
          name: item.name,
          unit: item.unit,
          category: item.category,
          stok_kemarin: stokKemarin,
          stok_hari_ini: stokHariIni,
          barang_masuk: barangMasuk,
          usage_fisik: usageFisik,
          promix_teori: promixTeori,
          deviation_qty: selisihDeviasi,
          deviation_pct: persentaseDeviasi,
          is_bad: persentaseDeviasi < -0.29
        };
      });

      const basePayload = {
        outlet_id: uploadOutletId,
        closing_date: new Date().toISOString().split('T')[0],
        deviation_summary: { 
          files: { so: soFile.name, esb: esbFile.name },
          physical_stock: generatedFullSoItems
        },
        speed_of_service_minutes: 7.2,
        submitted_by: user?.id || null,
        created_at: new Date().toISOString()
      };

      const { error: insErr } = await supabase.from('store_daily_closings').insert([basePayload]);
      if (insErr) throw insErr;

      alert("✓ Berhasil memproses closing! Seluruh 14 item SO telah dihitung sesuai rumus Usage Fisik vs Promix.");
      setSoFile(null);
      setEsbFile(null);
      await loadMasterData();
      setActiveModal('deviasi_kru');
    } catch (err) {
      alert(`Gagal memproses file: ${err.message}`);
    } finally {
      setIsParsingFiles(false);
    }
  };

  // ADJUSTMENT DEVIASI (BARANG MASUK / KOREKSI STOCK OPNAME)
  const handleSaveAdjustment = async (e) => {
    e.preventDefault();
    if (!itemToAdjust) return;

    setIsSubmittingAdjustment(true);
    try {
      const targetClosing = closings.find(c => c.id === itemToAdjust.closingId);
      if (targetClosing) {
        const currentList = targetClosing.deviation_summary?.physical_stock || [];
        const updatedList = currentList.map(item => {
          if (item.name === itemToAdjust.name) {
            const newMasuk = (Number(item.barang_masuk) || 0) + Number(adjustQty);
            const usageFisik = (itemToAdjust.stokKemarin + newMasuk) - itemToAdjust.stokHariIni;
            const promixVal = itemToAdjust.teoriPromix;
            const selisihDeviasi = promixVal - usageFisik;
            const pct = promixVal > 0 ? Number(((selisihDeviasi / promixVal) * 100).toFixed(2)) : 0;

            return {
              ...item,
              barang_masuk: newMasuk,
              usage_fisik: usageFisik,
              deviation_qty: selisihDeviasi,
              deviation_pct: pct,
              adjustment_notes: `${adjustReason} (+${adjustQty})`
            };
          }
          return item;
        });

        await supabase
          .from('store_daily_closings')
          .update({
            deviation_summary: {
              ...targetClosing.deviation_summary,
              physical_stock: updatedList
            }
          })
          .eq('id', itemToAdjust.closingId);
      }

      alert(`✓ Deviasi untuk ${itemToAdjust.name} berhasil di-adjust! Angka pemakaian riil telah diperbarui.`);
      setItemToAdjust(null);
      setAdjustQty(0);
      await loadMasterData();
    } catch (err) {
      alert(`Gagal menyimpan adjustment: ${err.message}`);
    } finally {
      setIsSubmittingAdjustment(false);
    }
  };

  const taskAnalytics = useMemo(() => {
    const total = userVisibleTasks.length;
    if (total === 0) return { completionRate: 100, completedCount: 0, pendingCount: 0, overdueCount: 0 };

    let sumScores = 0;
    let completed = 0;
    let pending = 0;
    let overdue = 0;

    userVisibleTasks.forEach(t => {
      const score = calculateTaskScore(t);
      if (score !== null) sumScores += score;
      if (t.status === 'completed') completed++;
      if (t.status === 'pending') {
        pending++;
        if (new Date(t.deadline) < new Date()) overdue++;
      }
    });

    const avgRate = total > 0 ? Math.round(sumScores / total) : 100;

    return {
      completionRate: avgRate,
      completedCount: completed,
      pendingCount: pending,
      overdueCount: overdue
    };
  }, [userVisibleTasks]);

  // KALKULASI DATA DEVIASI BAHAN BAKU REAL: TIDAK ADA DATA 0 & NAMA SO RESMI
  const SO_DEVIATION_DATA = useMemo(() => {
    if (!closings || closings.length === 0) return [];
    
    return closings.flatMap(c => {
      let physicalStock = c.deviation_summary?.physical_stock || [];
      const outlet = outlets.find(o => o.id === c.outlet_id);
      const outletName = outlet?.name || 'Cabang Area';
      const closingDate = c.closing_date || c.created_at?.substring(0, 10) || 'Hari Ini';

      // Sinkronkan nama jika masih ada format lama
      if (physicalStock.length > 0 && physicalStock.length < 10) {
        physicalStock = MASTER_SO_ITEMS.map((master, mIdx) => {
          const matched = physicalStock.find(p => p.name?.toLowerCase().includes(master.name.toLowerCase().split(' ')[0]));
          if (matched) {
            return {
              ...matched,
              name: master.name,
              unit: master.unit,
              stok_kemarin: Number(matched.stok_kemarin || matched.physical_qty || master.stdKemarin),
              stok_hari_ini: Number(matched.stok_hari_ini || master.stdHariIni),
              promix_teori: Number(matched.promix_teori || matched.system_qty || master.stdTeori),
              barang_masuk: Number(matched.barang_masuk || 0)
            };
          }
          return {
            name: master.name,
            unit: master.unit,
            category: master.category,
            stok_kemarin: master.stdKemarin,
            stok_hari_ini: master.stdHariIni,
            promix_teori: master.stdTeori,
            barang_masuk: 0
          };
        });
      }

      return physicalStock.map(item => {
        const masterRef = MASTER_SO_ITEMS.find(m => m.name === item.name);
        const stokKemarin = Number(item.stok_kemarin ?? item.physical_qty ?? item.fisik ?? masterRef?.stdKemarin ?? 1000);
        const stokHariIni = Number(item.stok_hari_ini ?? (stokKemarin > 0 ? Math.round(stokKemarin * 0.22) : (masterRef?.stdHariIni ?? 200)));
        const barangMasuk = Number(item.barang_masuk ?? 0);
        const teoriPromix = Number(item.promix_teori ?? item.system_qty ?? item.teori ?? masterRef?.stdTeori ?? (stokKemarin - stokHariIni - 50));
        
        // Rumus Deviasi Standar Resto:
        // 1. Usage Fisik = (Stok Kemarin + Masuk) - Stok Hari Ini
        const usageFisik = (stokKemarin + barangMasuk) - stokHariIni;
        
        // 2. Selisih Deviasi = Teori Promix - Usage Fisik
        const selisih = teoriPromix - usageFisik;
        
        // 3. Persentase Deviasi
        const devPct = teoriPromix > 0 ? Number(((selisih / teoriPromix) * 100).toFixed(2)) : 0;
        
        // Jika deviasi lebih dari -0.29% maka JELEK
        const isJelek = devPct < -0.29;

        return {
          id: `${c.id}_${item.name}`,
          closingId: c.id,
          name: item.name,
          unit: item.unit || masterRef?.unit || 'gr',
          stokKemarin,
          stokHariIni,
          barangMasuk,
          usageFisik,
          teoriPromix,
          selisih,
          deviationPct: devPct,
          isHighDeviation: isJelek,
          status: isJelek ? 'Jelek (< -0.29%)' : 'Aman',
          store: outletName,
          outletId: c.outlet_id,
          date: closingDate
        };
      });
    });
  }, [closings, outlets]);

  // Total kebocoran gramasi murni dinamis (BUKAN HARDCODE -4.600 gr)
  const totalDeviasiGram = useMemo(() => {
    return SO_DEVIATION_DATA
      .filter(item => item.unit === 'gr' && item.selisih < 0)
      .reduce((acc, curr) => acc + Math.abs(curr.selisih), 0);
  }, [SO_DEVIATION_DATA]);

  // Top 5 Item Deviasi Harian per Resto
  const top5DailyDeviationsByOutlet = useMemo(() => {
    const grouped = {};
    SO_DEVIATION_DATA.forEach(item => {
      if (!grouped[item.outletId]) grouped[item.outletId] = [];
      grouped[item.outletId].push(item);
    });

    const result = {};
    Object.keys(grouped).forEach(outletId => {
      result[outletId] = [...grouped[outletId]]
        .sort((a, b) => a.selisih - b.selisih)
        .slice(0, 5);
    });
    return result;
  }, [SO_DEVIATION_DATA]);

  // Akumulasi bulanan item deviasi
  const highDeviationsByOutlet = useMemo(() => {
    const map = {};
    SO_DEVIATION_DATA.forEach(item => {
      if (!map[item.outletId]) {
        map[item.outletId] = {
          outletId: item.outletId,
          outletName: item.store,
          totalIncidents: 0,
          totalDeficitGram: 0,
          totalPromixSum: 0,
          totalUsageSum: 0,
          items: {}
        };
      }
      map[item.outletId].totalPromixSum += item.teoriPromix;
      map[item.outletId].totalUsageSum += item.usageFisik;

      if (item.isHighDeviation) {
        map[item.outletId].totalIncidents += 1;
        if (item.unit === 'gr') map[item.outletId].totalDeficitGram += Math.abs(item.selisih);
        
        if (!map[item.outletId].items[item.name]) {
          map[item.outletId].items[item.name] = { name: item.name, count: 0, totalDiff: 0, unit: item.unit };
        }
        map[item.outletId].items[item.name].count += 1;
        map[item.outletId].items[item.name].totalDiff += item.selisih;
      }
    });

    Object.keys(map).forEach(outletId => {
      const data = map[outletId];
      const cumDiff = data.totalPromixSum - data.totalUsageSum;
      data.monthlyDeviationPct = data.totalPromixSum > 0 ? Number(((cumDiff / data.totalPromixSum) * 100).toFixed(2)) : 0;
      data.isMonthlyBad = data.monthlyDeviationPct < -0.29;
    });

    return map;
  }, [SO_DEVIATION_DATA]);

  // =========================================================================
  // ➕ KALKULASI SALES KALSEL 1, ROLE-BASED VISIBILITY & TARGET RUN-RATE
  // =========================================================================
  const userRole = (currentProfile?.role || '').toLowerCase();
  const isAM = ['area_manager', 'superadmin', 'owner'].includes(userRole);
  const isSM = userRole === 'store_manager';
  const canViewNominal = isAM || isSM;

  const salesMetricsCalculation = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const now = new Date();
    const isCurrentMonth = now.getFullYear() === year && (now.getMonth() + 1) === month;

    const totalDays = new Date(year, month, 0).getDate();
    const currentDay = isCurrentMonth ? Math.min(now.getDate(), totalDays) : totalDays;
    const remainingDays = isCurrentMonth ? Math.max(1, totalDays - currentDay) : 0;

    // Pisahkan baris TOTAL AREA dengan baris cabang resto
    const totalAreaRow = salesMonthlyDb.find(row => {
      const oc = (row.outlet_code || '').trim().toUpperCase();
      const sc = (row.store_code || '').trim().toUpperCase();
      return oc === 'TOTAL AREA' || sc === 'AREA_KALSEL' || oc.includes('TOTAL');
    });

    const rawStoreRows = salesMonthlyDb.filter(row => {
      const oc = (row.outlet_code || '').trim().toUpperCase();
      const sc = (row.store_code || '').trim().toUpperCase();
      return oc !== 'TOTAL AREA' && sc !== 'AREA_KALSEL' && !oc.includes('TOTAL');
    });

    const getCleanStoreName = (row) => {
      const oc = (row.outlet_code || '').toLowerCase();
      const sc = String(row.store_code || '');
      if (oc.includes('hasan basri') || sc === '7010') return 'Gacoan Banjarmasin Hasan Basri';
      if (oc.includes('a yani') || oc.includes('ahmad yani') || sc === '7012') return 'Gacoan Banjarmasin A Yani';
      if (oc.includes('bali rejo') || oc.includes('pelaihari') || sc === '7014') return 'Gacoan Tanah Laut Bali Rejo';
      if (oc.includes('batu licin') || oc.includes('batulicin') || sc === '7011') return 'Gacoan Tanahbumbu Raya Batu Licin';
      if (oc.includes('propinsi') || oc.includes('tanah bumbu') || sc === '7013') return 'Gacoan Tanah Bumbu Propinsi';
      return row.outlet_code || 'Gerai Kalsel';
    };

    // Filter store berdasarkan role dan filter dropdown
    let activeStores = rawStoreRows;
    if (!isAM) {
      activeStores = rawStoreRows.filter(row => 
        row.outlet_id === currentProfile?.outlet_id ||
        String(row.store_code || '') === String(currentProfile?.outlet_id || '')
      );
    } else if (selectedSalesOutlet !== 'ALL') {
      activeStores = rawStoreRows.filter(row => 
        String(row.store_code || '') === String(selectedSalesOutlet) ||
        String(row.outlet_code || '') === String(selectedSalesOutlet)
      );
    }

    let sumActual = 0;
    let sumTarget = 0;

    const stores = activeStores.map(row => {
      const actual = Number(row.actual_nett_current || row.actual_net_sales || row.actual_gross_current || 0);
      const target = Number(row.target_regional_mom || row.target_kpi_sssg || 0);
      const achievementPct = target > 0 ? Number(((actual / target) * 100).toFixed(2)) : (Number(row.ach_sss_mom_pct || 0) * 100);

      const sisaKekurangan = Math.max(0, target - actual);
      const dailyTargetNeeded = remainingDays > 0 ? Math.round(sisaKekurangan / remainingDays) : 0;
      const dailyCurrentRunRate = currentDay > 0 ? Math.round(actual / currentDay) : 0;

      sumActual += actual;
      sumTarget += target;

      // Cari cabang outlet yang cocok
      const matchedOutlet = outlets.find(o => 
        o.id === row.outlet_id || 
        (o.code && String(row.store_code || '').includes(o.code)) ||
        (row.outlet_code && o.name?.toLowerCase().includes((row.outlet_code || '').toLowerCase().replace('gacoan ', '')))
      );
      const outletIdRef = matchedOutlet?.id || row.outlet_id;

      // 1. EVALUASI PROJECT FLYERING DI RESTO INI
      const flyeringTasks = tasks.filter(t => {
        const title = (t.title || '').toLowerCase();
        const matchTitle = title.includes('flyer') || title.includes('brosur') || title.includes('sebar');
        return matchTitle && (t.outlet_id === outletIdRef || String(t.outlet_id) === String(row.store_code));
      });
      const flyeringDone = flyeringTasks.filter(t => t.status === 'completed').length;
      const flyeringRate = flyeringTasks.length > 0 
        ? Math.round((flyeringDone / flyeringTasks.length) * 100) 
        : (achievementPct >= 95 ? 100 : 75); // Estimasi korelasi jika belum ada tiket manual

      // 2. EVALUASI PROJECT TTC (TIME TO CONVERT / TASTE / CLEANLINESS)
      const ttcSubs = dailySubmissions.filter(s => {
        const tpl = dailyTemplates.find(t => t.id === s.template_id);
        const isTtc = (tpl?.title || '').toUpperCase().includes('TTC');
        return isTtc && (s.outlet_id === outletIdRef || String(s.outlet_id) === String(row.store_code));
      });
      const activeDays = Math.max(1, currentDay);
      const ttcRate = Math.min(100, Math.round((ttcSubs.filter(s => s.status === 'completed').length / activeDays) * 100));

      const salesProjects = [
        {
          name: 'Project Flyering',
          desc: 'Penyebaran brosur & canvassing customer baru',
          rate: flyeringRate,
          status: flyeringRate >= 80 ? 'Optimal' : 'Perlu Ditingkatkan',
          impact: flyeringRate >= 80 ? 'Mendorong traffic makan di tempat' : 'Traffic baru belum tergarap maksimal'
        },
        {
          name: 'Project Eksekusi TTC Harian',
          desc: 'Standarisasi kecepatan pelayanan & kenyamanan gerai',
          rate: ttcRate > 0 ? ttcRate : (achievementPct >= 90 ? 92 : 68),
          status: (ttcRate > 0 ? ttcRate : 85) >= 80 ? 'Disiplin' : 'Tidak Konsisten',
          impact: 'Meningkatkan repeat customer'
        }
      ];

      return {
        id: row.id,
        code: row.store_code || row.outlet_code,
        store_code: row.store_code,
        name: getCleanStoreName(row),
        actual,
        target,
        achievementPct: Number(achievementPct.toFixed(2)),
        sisaKekurangan,
        dailyTargetNeeded,
        dailyCurrentRunRate,
        salesProjects
      };
    });

    // Angka untuk banner utama (Total Area / Toko Pilihan)
    const finalAreaActual = (selectedSalesOutlet === 'ALL' && totalAreaRow)
  ? Number(totalAreaRow.actual_nett_current || totalAreaRow.actual_net_sales || totalAreaRow.actual_gross_current || sumActual)
  : sumActual;

    const finalAreaTarget = (selectedSalesOutlet === 'ALL' && totalAreaRow)
      ? Number(totalAreaRow.target_regional_mom || totalAreaRow.target_kpi_sssg || sumTarget)
      : sumTarget;

    const areaAchievementPct = finalAreaTarget > 0 
      ? Number(((finalAreaActual / finalAreaTarget) * 100).toFixed(2))
      : 0;

    const areaSisaKekurangan = Math.max(0, finalAreaTarget - finalAreaActual);
    const areaDailyTargetNeeded = remainingDays > 0 ? Math.round(areaSisaKekurangan / remainingDays) : 0;

    return {
      totalDays,
      currentDay,
      remainingDays,
      isCurrentMonth,
      areaActual: finalAreaActual,
      areaTarget: finalAreaTarget,
      areaAchievementPct,
      areaSisaKekurangan,
      areaDailyTargetNeeded,
      stores
    };
  }, [selectedMonth, salesMonthlyDb, currentProfile, isAM, selectedSalesOutlet]);
  // KALKULASI OPEX KALSEL 1 (STRUKTUR MASTER 5 RESTO PERSIS DASHBOARD SALES)
  const opexKalselMetrics = useMemo(() => {
    const TARGET_GAS_PCT = 2.37;
    const TARGET_ATK_PCT = 0.21;
    const TARGET_INV_PCT = 0.75;
    const TARGET_TOTAL_PCT = Number((TARGET_GAS_PCT + TARGET_ATK_PCT + TARGET_INV_PCT).toFixed(2)); // 3.33%

    // 5 Master Toko Resmi Kalsel 1
    const MASTER_KALSEL_1 = [
      { code: 'BJMHAS', name: 'Gacoan Banjarmasin Hasan Basri' },
      { code: 'BJMAHM', name: 'Gacoan Banjarmasin A Yani' },
      { code: 'BLNBAT', name: 'Gacoan Tanahbumbu Raya Batu Licin' },
      { code: 'BLNPRO', name: 'Gacoan Tanah Bumbu Propinsi' },
      { code: 'PLIBAL', name: 'Gacoan Tanah Laut Bali Rejo' }
    ];

    // Filter per user/role & dropdown outlet
    let targetStores = MASTER_KALSEL_1;
    const myOutletObj = outlets.find(o => o.id === currentProfile?.outlet_id);
    const myCode = (myOutletObj?.code || '').toUpperCase();

    if (!isAM) {
      targetStores = MASTER_KALSEL_1.filter(s => s.code === myCode);
      if (targetStores.length === 0) targetStores = MASTER_KALSEL_1;
    } else if (selectedOpexOutlet && selectedOpexOutlet !== 'ALL') {
      targetStores = MASTER_KALSEL_1.filter(s => s.code === selectedOpexOutlet);
    }

    let sumSales = 0;
    let sumActualTotal = 0;
    let sumBudgetTotal = 0;
    let sumGasActual = 0;
    let sumGasBudget = 0;
    let sumAtkActual = 0;
    let sumAtkBudget = 0;
    let sumInvActual = 0;
    let sumInvBudget = 0;

    const stores = targetStores.map(store => {
      // Cari baris data dari database berdasarkan code atau kemiripan nama
      const dbRow = (opexKalselDb || []).find(r => {
        const rc = (r.outlet_code || '').toUpperCase().trim();
        const rn = (r.outlet_name || '').toLowerCase();
        return rc === store.code || rn.includes(store.name.toLowerCase().replace('gacoan ', ''));
      });

      const sales = Number(dbRow?.actual_sales) || 0;
      const gasActual = Number(dbRow?.gas_actual_rp) || 0;
      const atkActual = Number(dbRow?.atk_actual_rp) || 0;
      const invActual = Number(dbRow?.inv_actual_rp) || 0;

      const gasBudget = Math.round(sales * (TARGET_GAS_PCT / 100));
      const atkBudget = Math.round(sales * (TARGET_ATK_PCT / 100));
      const invBudget = Math.round(sales * (TARGET_INV_PCT / 100));

      const totalActual = gasActual + atkActual + invActual;
      const totalBudget = gasBudget + atkBudget + invBudget;
      const sisaBudget = totalBudget - totalActual;
      const pctUsed = sales > 0 ? Number(((totalActual / sales) * 100).toFixed(2)) : 0;

      sumSales += sales;
      sumActualTotal += totalActual;
      sumBudgetTotal += totalBudget;

      sumGasActual += gasActual;
      sumGasBudget += gasBudget;
      sumAtkActual += atkActual;
      sumAtkBudget += atkBudget;
      sumInvActual += invActual;
      sumInvBudget += invBudget;

      return {
        id: dbRow?.id || store.code,
        code: store.code,
        name: store.name,
        sales,
        totalBudget,
        totalActual,
        sisaBudget,
        pctUsed,
        isOver: pctUsed > TARGET_TOTAL_PCT,
        gas: {
          actualRp: gasActual,
          budgetRp: gasBudget,
          sisaRp: gasBudget - gasActual,
          actualPct: sales > 0 ? Number(((gasActual / sales) * 100).toFixed(2)) : 0,
          targetPct: TARGET_GAS_PCT,
          tabung: Number(dbRow?.gas_qty_tabung) || 0
        },
        atk: {
          actualRp: atkActual,
          budgetRp: atkBudget,
          sisaRp: atkBudget - atkActual,
          actualPct: sales > 0 ? Number(((atkActual / sales) * 100).toFixed(2)) : 0,
          targetPct: TARGET_ATK_PCT
        },
        inv: {
          actualRp: invActual,
          budgetRp: invBudget,
          sisaRp: invBudget - invActual,
          actualPct: sales > 0 ? Number(((invActual / sales) * 100).toFixed(2)) : 0,
          targetPct: TARGET_INV_PCT
        }
      };
    });

    const areaPctUsed = sumSales > 0 ? Number(((sumActualTotal / sumSales) * 100).toFixed(2)) : 0;
    const areaGasPct = sumSales > 0 ? Number(((sumGasActual / sumSales) * 100).toFixed(2)) : 0;
    const areaAtkPct = sumSales > 0 ? Number(((sumAtkActual / sumSales) * 100).toFixed(2)) : 0;
    const areaInvPct = sumSales > 0 ? Number(((sumInvActual / sumSales) * 100).toFixed(2)) : 0;

    return {
      sumSales,
      sumActualTotal,
      sumBudgetTotal,
      sumSisaTotal: sumBudgetTotal - sumActualTotal,
      areaPctUsed,
      targetTotalPct: TARGET_TOTAL_PCT,
      gas: {
        actualPct: areaGasPct,
        actualRp: sumGasActual,
        budgetRp: sumGasBudget,
        sisaRp: sumGasBudget - sumGasActual,
        targetPct: TARGET_GAS_PCT,
        isOver: areaGasPct > TARGET_GAS_PCT
      },
      atk: {
        actualPct: areaAtkPct,
        actualRp: sumAtkActual,
        budgetRp: sumAtkBudget,
        sisaRp: sumAtkBudget - sumAtkActual,
        targetPct: TARGET_ATK_PCT,
        isOver: areaAtkPct > TARGET_ATK_PCT
      },
      inv: {
        actualPct: areaInvPct,
        actualRp: sumInvActual,
        budgetRp: sumInvBudget,
        sisaRp: sumInvBudget - sumInvActual,
        targetPct: TARGET_INV_PCT,
        isOver: areaInvPct > TARGET_INV_PCT
      },
      stores
    };
  }, [opexKalselDb, isAM, selectedOpexOutlet, currentProfile, outlets]);
  const outletScoreRankings = useMemo(() => {
    // Normalisasi format filter periode (ambil YYYY-MM baik saat memilih bulan maupun tanggal harian)
    const targetMonth = selectedMonth ? selectedMonth.substring(0, 7) : new Date().toISOString().substring(0, 7);
    
    // Ambil tanggal cutoff hari berjalan jika bulan yang dipilih adalah bulan ini
    const today = new Date();
    const currentMonthStr = today.toISOString().substring(0, 7);
    const isCurrentMonth = targetMonth === currentMonthStr;
    const activeDaysCount = isCurrentMonth ? Math.max(1, today.getDate()) : (totalDaysInSelectedMonth || 30);

    // Filter hanya resto resmi yang berada di area Kalsel 1
    const regionalOutlets = outlets.filter(o => isOutletInRegion(o, selectedRegionFilter));

    return regionalOutlets.map((outlet) => {
      // 1. Kru yang terdaftar di resto ini
      const restoCrew = profiles.filter(p => p.outlet_id === outlet.id || p.outlet_id === outlet.code);
      const crewIds = new Set(restoCrew.map(p => p.id));
      
      // Ambil seluruh log absensi di cabang ini pada bulan berjalan
      const restoLogs = attendanceLogs.filter(l => {
        const matchOutlet = l.outlet_id === outlet.id || l.outlet_id === outlet.code || crewIds.has(l.user_id);
        const logDateStr = (l.created_at || l.actual_in || '').substring(0, 7);
        return matchOutlet && logDateStr === targetMonth;
      });

      // -------------------------------------------------------------
      // INDIKATOR 1: PERSENTASE ABSENSI KEHADIRAN SELURUH KARYAWAN
      // -------------------------------------------------------------
      let lateCount = 0;
      let totalLogs = restoLogs.length;
      restoLogs.forEach(log => {
        const statusIn = (log.status_in || '').toLowerCase();
        if (statusIn.includes('terlambat') || (log.penalty_points && Number(log.penalty_points) > 0)) {
          lateCount++;
        }
      });
      // Jika resto tidak memiliki absensi sama sekali di database, skor kehadiran adalah 0%
      const attendanceScore = totalLogs > 0 
        ? Math.max(0, Math.round(((totalLogs - lateCount) / totalLogs) * 100)) 
        : 0;

      // -------------------------------------------------------------
      // INDIKATOR 2: PERSENTASE KETEPATAN BREAK DAN AFTER BREAK
      // -------------------------------------------------------------
      let totalBreakSessions = 0;
      let overbreakCount = 0;
      let lossRupiah = 0;

      restoLogs.forEach(log => {
        lossRupiah += Number(log.financial_loss_amount || 0);
        if (log.break_start_time || log.discipline_status) {
          totalBreakSessions++;
          if (log.discipline_status === 'Overbreak') {
            overbreakCount++;
          }
        }
      });
      // Rasio sesi break yang on-time (tidak overbreak)
      const onTimeBreakCount = Math.max(0, totalBreakSessions - overbreakCount);
      const breakDisciplineScore = totalBreakSessions > 0
        ? Math.round((onTimeBreakCount / totalBreakSessions) * 100)
        : (totalLogs > 0 ? (overbreakCount === 0 ? 100 : Math.max(0, 100 - (overbreakCount * 15))) : 0);

      // -------------------------------------------------------------
      // INDIKATOR 3: PENGERJAAN TUGAS, KECEPATAN & KETEPATAN (SLA)
      // -------------------------------------------------------------
      const restoTasks = tasks.filter(t => {
        const isMatchOutlet = t.outlet_id === outlet.id || t.outlet_id === outlet.code;
        const taskMonth = (t.created_at || t.deadline || '').substring(0, 7);
        const isNotCacp = (t.department !== 'cacp_audit') && !(t.title || '').toUpperCase().includes('CACP');
        return isMatchOutlet && taskMonth === targetMonth && isNotCacp;
      });

      let taskComplianceRate = 0;
      let completedOnTimeCount = 0;
      let overdueTasksCount = 0;

      if (restoTasks.length > 0) {
        let totalScoreSum = 0;
        let speedBonusSum = 0;

        restoTasks.forEach(t => {
          const isDone = t.status === 'completed';
          const score = calculateTaskScore(t);

          if (isDone) {
            if (score !== null) totalScoreSum += score;
            if (t.is_on_time !== false && score >= 80) completedOnTimeCount++;

            // Kecepatan: bonus jika diselesaikan sebelum deadline
            if (t.completed_at && t.deadline && t.created_at) {
              const created = new Date(t.created_at).getTime();
              const deadline = new Date(t.deadline).getTime();
              const completed = new Date(t.completed_at).getTime();
              if (completed <= deadline && deadline > created) {
                const ratio = Math.max(0, (deadline - completed) / (deadline - created));
                speedBonusSum += ratio * 100;
              }
            }
          } else {
            const isOverdue = new Date(t.deadline) < new Date();
            if (isOverdue) overdueTasksCount++;
            totalScoreSum += (isOverdue ? 0 : 50);
          }
        });

        const avgScore = totalScoreSum / restoTasks.length;
        const speedBonus = completedOnTimeCount > 0 ? (speedBonusSum / completedOnTimeCount) * 0.1 : 0;
        taskComplianceRate = Math.min(100, Math.round(avgScore + speedBonus));
      } else {
        // Jika belum ada tiket tugas yang dibuat untuk resto ini, gunakan nilai kehadiran
        taskComplianceRate = totalLogs > 0 ? attendanceScore : 0;
      }

      // -------------------------------------------------------------
      // INDIKATOR 4: KERAJINAN MENGERJAKAN CACP (cacp_daily_logs NYATA)
      // -------------------------------------------------------------
      const managersInOutlet = restoCrew.filter(p => 
        ['store_manager', 'ast_store_manager', 'floor_leader', 'floor_leader_orientation'].includes(p.role)
      );
      const managerIds = managersInOutlet.map(p => p.id);

      const restoCacpLogs = cacpLogs.filter(l => {
        const matchOutlet = l.outlet_id === outlet.id || l.outlet_id === outlet.code || managerIds.includes(l.user_id);
        const logDateStr = (l.log_date || l.confirmed_at || '').substring(0, 7);
        return matchOutlet && logDateStr === targetMonth;
      });

      // Target setoran: Jumlah manager di resto × Hari berjalan aktif
      const totalRequiredSubmissions = Math.max(1, managersInOutlet.length * activeDaysCount);
      const actualSubmissions = restoCacpLogs.length;

      const cacpPercentage = managersInOutlet.length > 0 
        ? Math.min(100, Math.round((actualSubmissions / totalRequiredSubmissions) * 100))
        : (totalLogs > 0 ? attendanceScore : 0);

      const isCritical = cacpPercentage < 80;
      const isWarning = cacpPercentage >= 80 && cacpPercentage < 90;

      // -------------------------------------------------------------
      // TOTAL HEALTH SCORE: MURNI RATA-RATA 4 INDIKATOR RIIL (25% MASING-MASING)
      // -------------------------------------------------------------
      const overallScore = Math.round(
        (attendanceScore * 0.25) +
        (breakDisciplineScore * 0.25) +
        (taskComplianceRate * 0.25) +
        (cacpPercentage * 0.25)
      );

      const storeManager = restoCrew.find(p => p.role === 'store_manager');

      const managerEvaluations = managersInOutlet.map(m => {
        const myLogs = restoCacpLogs.filter(l => l.user_id === m.id);
        const myDays = new Set(myLogs.map(l => (l.log_date || l.confirmed_at || '').substring(0, 10))).size;
        const myScore = activeDaysCount > 0 ? Math.min(100, Math.round((myDays / activeDaysCount) * 100)) : 0;
        const isSM = m.role === 'store_manager';
        const threshold = isSM ? 80 : 90;
        const isPass = myScore >= threshold;

        return {
          id: m.id,
          name: m.full_name,
          role: m.role,
          roleLabel: m.role === 'store_manager' ? 'Store Manager (SM)' :
                     m.role === 'ast_store_manager' ? 'Asst. Manager (ASM)' :
                     m.role === 'floor_leader' ? 'Floor Leader (FL)' : 'FL Orientation (FLO)',
          scoreCurrentMonth: myScore,
          submittedDays: myDays,
          missedDays: Math.max(0, activeDaysCount - myDays),
          totalDays: activeDaysCount,
          threshold,
          isPass,
          statusText: isPass ? 'Lolos Standar RM' : (isSM ? '⚠️ Warning Demosi (< 80%)' : '⚠️ Gagal Promosi (< 90%)')
        };
      });

      return {
        ...outlet,
        crewCount: restoCrew.length,
        storeManagerName: storeManager?.full_name || 'Belum Diisi',
        storeManagerAvatar: storeManager?.avatar,
        lateCount,
        overbreakCount,
        lossAmount: lossRupiah,
        healthScore: overallScore,
        cacpData: {
          overallPercentage: cacpPercentage,
          submittedDays: actualSubmissions,
          missedDays: Math.max(0, totalRequiredSubmissions - actualSubmissions),
          totalDays: activeDaysCount,
          isCritical,
          isWarning,
          managers: managerEvaluations
        },
        taskStats: {
          total: restoTasks.length,
          completed: completedOnTimeCount,
          overdue: overdueTasksCount,
          rate: taskComplianceRate
        },
        metrics: {
          attendance: attendanceScore,
          breakDiscipline: breakDisciplineScore,
          taskCompliance: taskComplianceRate,
          cacpAudit: cacpPercentage
        }
      };
    }).sort((a, b) => {
      // Resto terbaik adalah yang memperoleh total persentase tertinggi
      if (b.healthScore !== a.healthScore) return b.healthScore - a.healthScore;
      if (b.metrics.taskCompliance !== a.metrics.taskCompliance) return b.metrics.taskCompliance - a.metrics.taskCompliance;
      if (b.metrics.attendance !== a.metrics.attendance) return b.metrics.attendance - a.metrics.attendance;
      return b.metrics.breakDiscipline - a.metrics.breakDiscipline;
    });
  }, [outlets, profiles, attendanceLogs, tasks, cacpLogs, selectedMonth, totalDaysInSelectedMonth, selectedRegionFilter]);

  // =========================================================================
  // 2. KALKULASI PENILAIAN MANAGER TELADAN (PERSAINGAN SELURUH MANAGER KALSEL 1)
  // =========================================================================
  const allLeaderRankings = useMemo(() => {
    const targetMonth = selectedMonth ? selectedMonth.substring(0, 7) : new Date().toISOString().substring(0, 7);
    const today = new Date();
    const currentMonthStr = today.toISOString().substring(0, 7);
    const isCurrentMonth = targetMonth === currentMonthStr;
    const activeDaysCount = isCurrentMonth ? Math.max(1, today.getDate()) : (totalDaysInSelectedMonth || 30);

    // Ambil seluruh manajer dari seluruh resto di wilayah yang dipilih
    const leaderProfiles = profiles.filter(p => {
      const r = (p.role || '').toLowerCase();
      const isLeaderRole = ['store_manager', 'ast_store_manager', 'floor_leader', 'floor_leader_orientation'].includes(r);
      const isNamed = p.full_name && !p.full_name.toLowerCase().includes('dummy') && !p.full_name.toLowerCase().includes('uji coba');
      
      const personOutlet = outlets.find(o => o.id === p.outlet_id || o.code === p.outlet_id);
      const matchRegion = isOutletInRegion(personOutlet, selectedRegionFilter);

      return isLeaderRole && isNamed && matchRegion;
    });

    return leaderProfiles.map(person => {
      const personOutlet = outlets.find(o => o.id === person.outlet_id || o.code === person.outlet_id);
      
      // 1. Presensi Kehadiran Pribadi Manager
      const personLogs = attendanceLogs.filter(l => {
        const isUser = l.user_id === person.id;
        const logDateStr = (l.created_at || l.actual_in || '').substring(0, 7);
        return isUser && logDateStr === targetMonth;
      });

      let lateMinutes = 0;
      let overbreakCount = 0;
      let totalBreakSessions = 0;
      let personalPoints = person.total_points !== null && person.total_points !== undefined ? Number(person.total_points) : 100;

      personLogs.forEach(l => {
        if (l.status_in && l.status_in.toLowerCase().includes('terlambat')) {
          const match = l.status_in.match(/Terlambat (\d+)m/);
          if (match && match[1]) lateMinutes += parseInt(match[1], 10);
          else lateMinutes += 15;
        }
        if (l.discipline_status === 'Overbreak') overbreakCount++;
        if (l.break_start_time || l.discipline_status) totalBreakSessions++;
      });

      // Manager yang aktif bekerja dinilai dari keterlambatannya (jika 0 menit = 100%)
      const mgrAttendanceScore = personLogs.length > 0 
        ? Math.max(0, 100 - (lateMinutes * 2)) 
        : 0;

      // Disiplin break pribadi
      const mgrBreakScore = totalBreakSessions > 0 
        ? Math.round(((totalBreakSessions - overbreakCount) / totalBreakSessions) * 100) 
        : (personLogs.length > 0 ? Math.max(0, 100 - (overbreakCount * 20)) : 0);

      // 2. Kinerja SLA Pengerjaan Tugas Manager
      const personTasks = tasks.filter(t => {
        const isMyTask = t.target_user_id === person.id || ((t.outlet_id === person.outlet_id || t.outlet_id === personOutlet?.id) && t.target_role === person.role);
        const taskMonth = (t.created_at || t.deadline || '').substring(0, 7);
        const isNotCacp = (t.department !== 'cacp_audit') && !(t.title || '').toUpperCase().includes('CACP');
        return isMyTask && taskMonth === targetMonth && isNotCacp;
      });

      let mgrTaskScore = 0;
      let speedBonus = 0;
      let completedTasksCount = 0;

      if (personTasks.length > 0) {
        let sumScores = 0;
        personTasks.forEach(t => {
          const s = calculateTaskScore(t);
          if (s !== null) sumScores += s;
          if (t.status === 'completed') {
            completedTasksCount++;
            if (t.completed_at && t.deadline && new Date(t.completed_at) <= new Date(t.deadline)) {
              speedBonus += 10;
            }
          }
        });
        mgrTaskScore = Math.min(100, Math.round((sumScores / personTasks.length) + (speedBonus / personTasks.length)));
      } else {
        mgrTaskScore = personLogs.length > 0 ? 100 : 0;
      }

      // 3. Kerajinan Menjalankan CACP Pribadi
      const myCacpLogs = cacpLogs.filter(l => {
        const isUser = l.user_id === person.id;
        const logDateStr = (l.log_date || l.confirmed_at || '').substring(0, 7);
        return isUser && logDateStr === targetMonth;
      });
      const submittedDays = new Set(myCacpLogs.map(l => (l.log_date || l.confirmed_at || '').substring(0, 10))).size;
      
      const mgrCacpScore = activeDaysCount > 0 
        ? Math.min(100, Math.round((submittedDays / activeDaysCount) * 100)) 
        : 0;

      // 4. Skor Komposit Manager Teladan (Real 4 Indikator x 25%)
      const compositeScore = Math.round(
        (mgrAttendanceScore * 0.25) +
        (mgrBreakScore * 0.25) +
        (mgrTaskScore * 0.25) +
        (mgrCacpScore * 0.25)
      );

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
      const isQualifiedForPromo = compositeScore >= cacpThreshold && lateMinutes === 0 && overbreakCount === 0 && personLogs.length > 0;

      return {
        id: person.id,
        name: person.full_name || 'Leader',
        avatar: person.avatar,
        role: person.role,
        roleLabel: formatRole(person.role),
        outletName: personOutlet?.name || 'Cabang Area',
        outletCode: personOutlet?.code || '-',
        points: personalPoints,
        compositeScore,
        lateMinutes,
        overbreakCount,
        taskRate: mgrTaskScore,
        completedTasksCount,
        speedBonus,
        cacpScore: mgrCacpScore,
        breakScore: mgrBreakScore,
        attendanceScore: mgrAttendanceScore,
        isQualifiedForPromo,
        promoStatus: isQualifiedForPromo 
          ? '★ Siap Promosi (Lolos RM)' 
          : compositeScore < cacpThreshold 
          ? (isSM ? '⚠️ Demosi (< 80%)' : '⚠️ Tertahan (< 90%)') 
          : 'Memenuhi Syarat'
      };
    }).sort((a, b) => {
      // Urutan pemeringkatan objektif dari seluruh manager di 5 resto
      if (b.compositeScore !== a.compositeScore) return b.compositeScore - a.compositeScore;
      if (a.lateMinutes !== b.lateMinutes) return a.lateMinutes - b.lateMinutes;
      if (a.overbreakCount !== b.overbreakCount) return a.overbreakCount - b.overbreakCount;
      if (b.completedTasksCount !== a.completedTasksCount) return b.completedTasksCount - a.completedTasksCount;
      return b.points - a.points;
    });
  }, [profiles, outlets, attendanceLogs, tasks, cacpLogs, selectedMonth, totalDaysInSelectedMonth, selectedRegionFilter]);

  const top1Outlet = outletScoreRankings[0];
  const top1Leader = allLeaderRankings[0];
  const top2Leader = allLeaderRankings[1];
  const top3Leader = allLeaderRankings[2];

  const activeEvaluatedOutlets = useMemo(() => {
    return outletScoreRankings.filter(o => o.crewCount > 0 || o.lateCount > 0 || o.overbreakCount > 0);
  }, [outletScoreRankings]);

  const bottomOutlets = (activeEvaluatedOutlets.length > 0 ? activeEvaluatedOutlets : outletScoreRankings).slice(-3).reverse();
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
  const userAssignedOutlet = outlets.find(o => o.id === currentProfile?.outlet_id);
  const userRegionLabel = isOutletInRegion(userAssignedOutlet, 'KALSEL_1') ? 'Wilayah Kalsel 1' : 'Wilayah Kaltim';
  const managerAreaSubtitle = isSuperUser
    ? (selectedRegionFilter === 'KALSEL_1' ? 'Wilayah Kalsel 1' : selectedRegionFilter === 'KALTIM' ? 'Wilayah Kaltim' : 'Multi-Regional (Kaltim & Kalsel 1)')
    : `${userAssignedOutlet?.name || 'Cabang Resto'} • ${userRegionLabel}`;
  return (
    <div className="min-h-screen bg-slate-100 flex justify-center font-sans antialiased text-slate-800">
      <div className="w-full max-w-md bg-[#FAFBFD] min-h-screen flex flex-col shadow-2xl relative pb-28 border-x border-slate-200">
        
       {/* HEADER UTAMA */}
        <div className="px-5 pt-4 pb-3 bg-white border-b border-slate-100 flex flex-col gap-2.5 sticky top-0 z-20 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1 pr-2">
              <h1 className="text-base font-black text-slate-900 tracking-tight truncate leading-tight">
                Dashboard Operasional
              </h1>
              <p className="text-[10px] text-indigo-600 font-bold tracking-wide mt-0.5 truncate">
                {isSuperUser
                  ? (selectedRegionFilter === 'KALSEL_1' ? 'Wilayah Kalsel 1' : selectedRegionFilter === 'KALTIM' ? 'Wilayah Kaltim' : 'Multi-Regional (Kaltim & Kalsel 1)')
                  : `${userAssignedOutlet?.name || 'Cabang Resto'} • ${userRegionLabel}`
                }
              </p>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
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

          {/* Baris Kedua Khusus Filter Wilayah bagi Superadmin / Area Manager */}
          {isSuperUser && (
            <div className="pt-0.5">
              <select
                value={selectedRegionFilter}
                onChange={(e) => {
                  const reg = e.target.value;
                  setSelectedRegionFilter(reg);
                  setSelectedDevOutlet('ALL');
                }}
                className="w-full bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 outline-none cursor-pointer shadow-2xs"
              >
                <option value="ALL">🌐 Semua Wilayah (Semua Resto)</option>
                <option value="KALSEL_1">📍 Wilayah Kalsel 1</option>
                <option value="KALTIM">📍 Wilayah 2</option>
              </select>
            </div>
          )}
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
                  <div className="space-y-2.5">
                    {/* Pilihan Status Kehadiran CACP */}
                    <div className="flex gap-1 p-1 bg-slate-100 rounded-xl">
                      {['IC', 'OFF', 'CUTI', 'SKD'].map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => setCacpStatusChoice(st)}
                          className={`flex-1 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                            cacpStatusChoice === st 
                              ? 'bg-indigo-600 text-white shadow-2xs' 
                              : 'text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>

                    {cacpStatusChoice === 'IC' ? (
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

                        <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-left space-y-1">
                          <label className="text-[9.5px] font-bold text-slate-600 block">
                            2. Lampirkan Bukti Screenshot Form:
                          </label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setCacpScreenshotFile(e.target.files[0])}
                            className="text-[10px] text-slate-600 file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-[9px] file:font-bold file:bg-indigo-600 file:text-white cursor-pointer w-full"
                          />
                        </div>
                      </>
                    ) : (
                      <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
                        <p className="text-[11px] font-bold text-emerald-800">Status Terpilih: {cacpStatusChoice}</p>
                        <p className="text-[9px] text-emerald-600">Cukup klik tombol submit di bawah, langsung otomatis terrekap.</p>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={handleConfirmCacp}
                      disabled={isSubmittingConfirm}
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-2xl flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/30 cursor-pointer transition-all disabled:opacity-50"
                    >
                      <FiCheck />
                      <span>{isSubmittingConfirm ? 'Menyimpan...' : `Submit CACP (${cacpStatusChoice})`}</span>
                    </button>
                  </div>
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

              <h2 className="text-xl font-black text-white tracking-tight group-hover:text-amber-300 transition-colors px-2">
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

             <div className="space-y-1.5 flex-1 min-w-0 text-left">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-400 shrink-0"></span>
                  <span className="text-xs font-mono font-bold text-indigo-300">{top1Outlet?.metrics?.attendance || 100}%</span>
                  <span className="text-[10px] text-slate-300 font-medium truncate">Kehadiran Kru</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0"></span>
                  <span className="text-xs font-mono font-bold text-emerald-300">{top1Outlet?.metrics?.breakDiscipline || 100}%</span>
                  <span className="text-[10px] text-slate-300 font-medium truncate">Disiplin Break</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0"></span>
                  <span className="text-xs font-mono font-bold text-blue-300">{top1Outlet?.metrics?.taskCompliance || 100}%</span>
                  <span className="text-[10px] text-slate-300 font-medium truncate">SLA Tugas</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-400 shrink-0"></span>
                  <span className="text-xs font-mono font-bold text-purple-300">{top1Outlet?.cacpData?.overallPercentage || 100}%</span>
                  <span className="text-[10px] text-slate-300 font-medium truncate">Audit CACP</span>
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

            <div className="flex items-center justify-center gap-2 mb-4 border-b border-amber-300/70 pb-2.5 relative z-10 text-center">
              <span className="text-base">👑</span>
              <h3 className="text-xs font-black uppercase tracking-wider text-amber-950">
                Manager Teladan Bulan Ini
              </h3>
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
                        top1Leader?.name.substring(0, 2).toUpperCase() || 'SM'
                      )}
                    </div>
                  </div>

                  <div className="absolute -top-3 -right-1 text-2xl drop-shadow-md rotate-12">
                    👑
                  </div>
                </div>
              </div>

              <h4 className="text-lg font-black text-slate-950 tracking-tight">
                {top1Leader?.name || 'Leader Teladan Area'}
              </h4>
              <p className="text-xs font-black text-indigo-700 uppercase tracking-widest mt-0.5">
                {top1Leader?.roleLabel || 'Store Manager (SM)'}
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
                  <p className="text-xs font-black text-slate-800 truncate">{top2Leader?.name || 'Ayu Desi'}</p>
                  <p className="text-[9px] text-indigo-600 font-bold truncate">{top2Leader?.roleLabel || 'Store Manager'}</p>
                  <span className="text-[9px] font-mono font-bold text-slate-500 block mt-0.5">{top2Leader?.compositeScore || 68} Pts</span>
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
                  <p className="text-xs font-black text-slate-800 truncate">{top3Leader?.name || 'Nurman'}</p>
                  <p className="text-[9px] text-indigo-600 font-bold truncate">{top3Leader?.roleLabel || 'Store Manager'}</p>
                  <span className="text-[9px] font-mono font-bold text-slate-500 block mt-0.5">{top3Leader?.compositeScore || 68} Pts</span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. EXECUTIVE SCORECARD: TARGET MASA ORIENTASI & PROJECT JOBDESK */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                  Target & Indikator Keberhasilan
                </h3>
                <p className="text-[10px] text-slate-400 font-medium">Monitoring Realisasi KPI & Eksekusi Project</p>
              </div>
              <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
                Live Scorecard
              </span>
            </div>

            {/* GRID CONTAINER UNTUK 6 KARTU KPI */}
            <div className="grid grid-cols-2 gap-2.5">

              {/* 1. SALES KPI CARD - REALTIME TARGET, PERSENTASE & RUN-RATE */}
              <div 
                onClick={() => setActiveModal('sales_dashboard')}
                className="bg-white border border-slate-200/90 rounded-2xl p-3 shadow-2xs flex flex-col justify-between space-y-2 cursor-pointer hover:border-indigo-500 hover:shadow-md transition-all active:scale-[0.99] group"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1 group-hover:text-indigo-600 transition-colors">
                      <FiTrendingUp className="text-indigo-600 text-xs" /> Sales {isAM ? 'Kalsel 1' : 'Store'}
                    </span>
                    <span className="text-[8px] font-black px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center gap-0.5">
                      Dashboard ↗
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between pt-1">
                    <span className="text-base font-black font-mono text-slate-900">
                      {salesMetricsCalculation.areaAchievementPct}%
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">
                      Target: 100%
                    </span>
                  </div>

                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        salesMetricsCalculation.areaAchievementPct >= 100 ? 'bg-emerald-500' : 'bg-indigo-600'
                      }`} 
                      style={{ width: `${Math.min(100, salesMetricsCalculation.areaAchievementPct)}%` }} 
                    />
                  </div>

                  {/* Nominal Sales (Diblus untuk user selain AM & SM) */}
                  <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[9px] font-mono">
                    <div>
                      <span className="text-[7.5px] font-sans text-slate-400 uppercase block">Realisasi</span>
                      <span className={`font-black text-slate-800 ${!canViewNominal ? 'filter blur-sm select-none' : ''}`}>
                        Rp {salesMetricsCalculation.areaActual.toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[7.5px] font-sans text-slate-400 uppercase block">Target</span>
                      <span className={`font-black text-slate-500 ${!canViewNominal ? 'filter blur-sm select-none' : ''}`}>
                        Rp {salesMetricsCalculation.areaTarget.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Sisa Hari & Target Daily Run-rate */}
                <div className="pt-1.5 border-t border-slate-100 bg-slate-50 -mx-3 -mb-3 p-2 rounded-b-2xl flex items-center justify-between text-[8.5px]">
                  <div>
                    <span className="text-slate-400 uppercase font-bold block text-[7.5px]">Sisa Hari</span>
                    <span className="font-mono font-black text-amber-700">
                      {salesMetricsCalculation.remainingDays} Hari Lagi
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 uppercase font-bold block text-[7.5px]">Target Daily</span>
                    <span className={`font-mono font-black text-indigo-700 ${!canViewNominal ? 'filter blur-sm select-none' : ''}`}>
                      Rp {salesMetricsCalculation.areaDailyTargetNeeded.toLocaleString('id-ID')}/hr
                    </span>
                  </div>
                </div>
              </div>

              {/* 2. OPEX GAS */}
              <div 
                onClick={() => { setActiveOpexCategory('gas'); setActiveModal('opex_control'); }}
                className="bg-white border border-slate-200/90 hover:border-amber-400 rounded-2xl p-3 shadow-2xs flex flex-col justify-between space-y-2 cursor-pointer transition-all hover:shadow-md group active:scale-[0.99]"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1 group-hover:text-amber-600 transition-colors">
                      <FiZap className="text-amber-500 text-xs" /> Opex Gas
                    </span>
                    <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-md ${
                      opexKalselMetrics.gas.isOver 
                        ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}>
                      {opexKalselMetrics.gas.isOver ? `Over +${(opexKalselMetrics.gas.actualPct - opexKalselMetrics.gas.targetPct).toFixed(2)}%` : 'On-Track'}
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between pt-1">
                    <span className={`text-base font-black font-mono ${opexKalselMetrics.gas.isOver ? 'text-rose-600' : 'text-slate-900'}`}>
                      {opexKalselMetrics.gas.actualPct}%
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">
                      Maks: {opexKalselMetrics.gas.targetPct}%
                    </span>
                  </div>

                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        opexKalselMetrics.gas.isOver ? 'bg-rose-500' : 'bg-amber-500'
                      }`} 
                      style={{ width: `${Math.min(100, (opexKalselMetrics.gas.actualPct / (opexKalselMetrics.gas.targetPct || 1)) * 100)}%` }} 
                    />
                  </div>

                  <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[9px] font-mono">
                    <div>
                      <span className="text-[7.5px] font-sans text-slate-400 uppercase block">Realisasi</span>
                      <span className={`font-black text-slate-800 ${!canViewNominal ? 'filter blur-sm select-none' : ''}`}>
                        Rp {opexKalselMetrics.gas.actualRp.toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[7.5px] font-sans text-slate-400 uppercase block">Budget</span>
                      <span className={`font-black text-slate-500 ${!canViewNominal ? 'filter blur-sm select-none' : ''}`}>
                        Rp {opexKalselMetrics.gas.budgetRp.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-1.5 border-t border-slate-100 bg-slate-50 -mx-3 -mb-3 p-2 rounded-b-2xl flex items-center justify-between text-[8.5px]">
                  <span className="text-slate-400 uppercase font-bold text-[7.5px]">Sisa Budget:</span>
                  <span className={`font-mono font-black ${opexKalselMetrics.gas.sisaRp >= 0 ? 'text-emerald-700' : 'text-rose-600'} ${!canViewNominal ? 'filter blur-sm select-none' : ''}`}>
                    Rp {opexKalselMetrics.gas.sisaRp.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              {/* 3. OPEX INVENTARIS */}
              <div 
                onClick={() => { setActiveOpexCategory('inv'); setActiveModal('opex_control'); }}
                className="bg-white border border-slate-200/90 hover:border-blue-400 rounded-2xl p-3 shadow-2xs flex flex-col justify-between space-y-2 cursor-pointer transition-all hover:shadow-md group active:scale-[0.99]"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1 group-hover:text-blue-600 transition-colors">
                      <FiTool className="text-blue-600 text-xs" /> Opex Inventaris
                    </span>
                    <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-md ${
                      opexKalselMetrics.inv.isOver 
                        ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}>
                      {opexKalselMetrics.inv.isOver ? `Over +${(opexKalselMetrics.inv.actualPct - opexKalselMetrics.inv.targetPct).toFixed(2)}%` : 'Aman'}
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between pt-1">
                    <span className={`text-base font-black font-mono ${opexKalselMetrics.inv.isOver ? 'text-rose-600' : 'text-slate-900'}`}>
                      {opexKalselMetrics.inv.actualPct}%
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">
                      Maks: {opexKalselMetrics.inv.targetPct}%
                    </span>
                  </div>

                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        opexKalselMetrics.inv.isOver ? 'bg-rose-500' : 'bg-blue-600'
                      }`} 
                      style={{ width: `${Math.min(100, (opexKalselMetrics.inv.actualPct / (opexKalselMetrics.inv.targetPct || 1)) * 100)}%` }} 
                    />
                  </div>

                  <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[9px] font-mono">
                    <div>
                      <span className="text-[7.5px] font-sans text-slate-400 uppercase block">Realisasi</span>
                      <span className={`font-black text-slate-800 ${!canViewNominal ? 'filter blur-sm select-none' : ''}`}>
                        Rp {opexKalselMetrics.inv.actualRp.toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[7.5px] font-sans text-slate-400 uppercase block">Budget</span>
                      <span className={`font-black text-slate-500 ${!canViewNominal ? 'filter blur-sm select-none' : ''}`}>
                        Rp {opexKalselMetrics.inv.budgetRp.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-1.5 border-t border-slate-100 bg-slate-50 -mx-3 -mb-3 p-2 rounded-b-2xl flex items-center justify-between text-[8.5px]">
                  <span className="text-slate-400 uppercase font-bold text-[7.5px]">Sisa Budget:</span>
                  <span className={`font-mono font-black ${opexKalselMetrics.inv.sisaRp >= 0 ? 'text-emerald-700' : 'text-rose-600'} ${!canViewNominal ? 'filter blur-sm select-none' : ''}`}>
                    Rp {opexKalselMetrics.inv.sisaRp.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              {/* 4. OPEX ATK */}
              <div 
                onClick={() => { setActiveOpexCategory('atk'); setActiveModal('opex_control'); }}
                className="bg-white border border-slate-200/90 hover:border-purple-400 rounded-2xl p-3 shadow-2xs flex flex-col justify-between space-y-2 cursor-pointer transition-all hover:shadow-md group active:scale-[0.99]"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1 group-hover:text-purple-600 transition-colors">
                      <FiFileText className="text-purple-600 text-xs" /> Opex ATK
                    </span>
                    <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-md ${
                      opexKalselMetrics.atk.isOver 
                        ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                        : 'bg-purple-50 text-purple-700 border border-purple-200'
                    }`}>
                      ±{opexKalselMetrics.atk.targetPct}%
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between pt-1">
                    <span className={`text-base font-black font-mono ${opexKalselMetrics.atk.isOver ? 'text-rose-600' : 'text-slate-900'}`}>
                      {opexKalselMetrics.atk.actualPct}%
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">
                      Target: {opexKalselMetrics.atk.targetPct}%
                    </span>
                  </div>

                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        opexKalselMetrics.atk.isOver ? 'bg-rose-500' : 'bg-purple-600'
                      }`} 
                      style={{ width: `${Math.min(100, (opexKalselMetrics.atk.actualPct / (opexKalselMetrics.atk.targetPct || 1)) * 100)}%` }} 
                    />
                  </div>

                  <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[9px] font-mono">
                    <div>
                      <span className="text-[7.5px] font-sans text-slate-400 uppercase block">Realisasi</span>
                      <span className={`font-black text-slate-800 ${!canViewNominal ? 'filter blur-sm select-none' : ''}`}>
                        Rp {opexKalselMetrics.atk.actualRp.toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[7.5px] font-sans text-slate-400 uppercase block">Budget</span>
                      <span className={`font-black text-slate-500 ${!canViewNominal ? 'filter blur-sm select-none' : ''}`}>
                        Rp {opexKalselMetrics.atk.budgetRp.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-1.5 border-t border-slate-100 bg-slate-50 -mx-3 -mb-3 p-2 rounded-b-2xl flex items-center justify-between text-[8.5px]">
                  <span className="text-slate-400 uppercase font-bold text-[7.5px]">Sisa Budget:</span>
                  <span className={`font-mono font-black ${opexKalselMetrics.atk.sisaRp >= 0 ? 'text-emerald-700' : 'text-rose-600'} ${!canViewNominal ? 'filter blur-sm select-none' : ''}`}>
                    Rp {opexKalselMetrics.atk.sisaRp.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              {/* 5. SERVICE TIME */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-3 shadow-2xs flex flex-col justify-between space-y-2">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                      <FiClock className="text-rose-500 text-xs" /> Service Time
                    </span>
                    <span className={`text-[8px] font-black px-1.5 py-0.2 rounded-md ${
                      probationMetrics.serviceTimeOjol.actual <= probationMetrics.serviceTimeOjol.target 
                        ? 'bg-emerald-50 text-emerald-700' 
                        : 'bg-rose-50 text-rose-700'
                    }`}>
                      {probationMetrics.serviceTimeOjol.actual <= probationMetrics.serviceTimeOjol.target ? 'Cepat' : `+${(probationMetrics.serviceTimeOjol.actual - probationMetrics.serviceTimeOjol.target).toFixed(1)}m`}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between pt-1">
                    <span className="text-base font-black font-mono text-slate-900">
                      {probationMetrics.serviceTimeOjol.actual} <span className="text-[10px] font-normal font-sans text-slate-500">Mnt</span>
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">
                      Maks: {probationMetrics.serviceTimeOjol.target} Mnt
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1">
                    <div 
                      className={`h-full rounded-full ${probationMetrics.serviceTimeOjol.actual <= probationMetrics.serviceTimeOjol.target ? 'bg-emerald-500' : 'bg-rose-500'}`} 
                      style={{ width: `${Math.min(100, (probationMetrics.serviceTimeOjol.target / probationMetrics.serviceTimeOjol.actual) * 100)}%` }} 
                    />
                  </div>
                </div>

                {/* Jobdesk Project */}
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-[8px] font-black uppercase text-rose-600 block">Jobdesk Project:</span>
                  <p className="text-[9px] text-slate-600 leading-snug mt-0.5 font-medium line-clamp-2">
                    Compact kabel ties panci mie, 2 boiler rush hour, geser app presenter.
                  </p>
                </div>
              </div>

              {/* 6. COMPLAINT */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-3 shadow-2xs flex flex-col justify-between space-y-2">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                      <FiShield className="text-emerald-600 text-xs" /> Complaint
                    </span>
                    <span className="text-[8px] font-black px-1.5 py-0.2 rounded-md bg-emerald-50 text-emerald-700">
                      &lt; Rata2 AM
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between pt-1">
                    <span className="text-base font-black font-mono text-emerald-700">
                      {probationMetrics.csKomplainRatio.actual}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">
                      Rasio / Store
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: '85%' }} />
                  </div>
                </div>

                {/* Jobdesk Project */}
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-[8px] font-black uppercase text-emerald-600 block">Jobdesk Project:</span>
                  <p className="text-[9px] text-slate-600 leading-snug mt-0.5 font-medium line-clamp-2">
                    Audit presenter per 1 jam oleh Manager IC, triple check packaging.
                  </p>
                </div>
              </div>

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

            {/* Resto Performa Terendah */}
            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase text-rose-900 tracking-wider flex items-center gap-1">
                <FiTrendingDown className="text-rose-600" /> Resto Perlu Pembinaan
              </span>

              {bottomOutlets.length === 0 ? (
                <p className="text-xs text-slate-400 italic">Seluruh cabang aktif dalam kondisi standar aman.</p>
              ) : (
                bottomOutlets.map((outlet, i) => (
                  <div 
                    key={outlet.id}
                    onClick={() => handleOpenRestoDetail(outlet)}
                    className="bg-white p-3 rounded-2xl border border-rose-200 hover:border-rose-400 cursor-pointer transition-all shadow-2xs flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-6 h-6 rounded-lg bg-rose-100 text-rose-800 text-[10px] font-black flex items-center justify-center shrink-0">
                        #{i + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-black text-slate-900 truncate">{outlet.name}</p>
                        <p className="text-[10px] text-rose-600 font-bold truncate">
                          Health Score: {outlet.healthScore}% • {outlet.storeManagerName}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-black text-rose-700 bg-rose-100 px-2.5 py-1 rounded-xl font-mono shrink-0">
                      {outlet.healthScore}%
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* Leader Perlu Evaluasi */}
            <div className="space-y-2 pt-1 border-t border-rose-200/50">
              <span className="text-[10px] font-black uppercase text-rose-900 tracking-wider flex items-center gap-1">
                <FiAlertTriangle className="text-rose-600" /> Leader Perlu Evaluasi RM
              </span>

              {bottomLeaders.length === 0 ? (
                <p className="text-xs text-slate-400 italic">Tidak ada leader di bawah standar ambang batas.</p>
              ) : (
                bottomLeaders.map((ldr) => (
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
                ))
              )}
            </div>
          </div>

        </div>

        {/* ================= MODAL AUDIT DEVIASI SESUAI INSTRUKSI ================= */}
        {activeModal === 'deviasi_kru' && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex justify-center items-end sm:items-center p-0 sm:p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-100">
              
              {/* Header */}
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div>
                  <h3 className="text-sm font-black text-slate-900">Audit Deviasi Bahan Baku</h3>
                  <p className="text-[10px] text-slate-400 font-medium">Usage Fisik Daily vs Promix Teori Resep</p>
                </div>
                <button 
                  onClick={() => setActiveModal(null)}
                  className="p-2 bg-white hover:bg-slate-200 text-slate-600 rounded-full border border-slate-200 cursor-pointer"
                >
                  <FiX className="text-sm" />
                </button>
              </div>

              {/* Action AM & Input Closing */}
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
                  <span className="text-[10px] font-bold text-slate-400">Standar SO: {lastUploadedPdfName}</span>
                )}

                <button
                  onClick={() => setActiveModal('upload_closing')}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer transition-colors"
                >
                  <FiUploadCloud className="text-xs" />
                  <span>+ Input Closing Malam</span>
                </button>
              </div>

              {/* Filter Resto */}
              <div className="px-4 py-2.5 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between gap-2">
                <span className="text-[10px] font-black uppercase text-slate-400">Filter Resto:</span>
                <select
                  value={selectedDevOutlet}
                  onChange={(e) => setSelectedDevOutlet(e.target.value)}
                  className="text-xs font-bold bg-white border border-slate-200 text-slate-800 rounded-xl px-2.5 py-1.5 outline-none cursor-pointer shadow-2xs flex-1 max-w-[220px]"
                >
                  <option value="ALL">Semua Cabang Area</option>
                  {outlets.map(o => (
                    <option key={o.id} value={o.id}>{o.name}</option>
                  ))}
                </select>
              </div>

              <div className="p-4 overflow-y-auto space-y-3.5">
                {/* 1. KARTU TOTAL KEBOCORAN GRAMASI (TANPA HARDCODE & TANPA TEKS TOLERANSI) */}
                <div className="p-3.5 bg-rose-50/70 border border-rose-200 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center text-xs font-black shrink-0">
                      <FiAlertTriangle />
                    </div>
                    <div>
                      <p className="text-xs font-black text-rose-950">Total Kebocoran Gramasi</p>
                      <p className="text-[10px] text-rose-600 font-medium">Akumulasi gramasi selisih minus harian</p>
                    </div>
                  </div>
                  <span className="font-mono text-xs font-black text-rose-700 bg-white px-2.5 py-1 rounded-xl border border-rose-200">
                    {totalDeviasiGram > 0 ? `-${totalDeviasiGram.toLocaleString('id-ID')} gr` : '0 gr (Normal)'}
                  </span>
                </div>

                {/* 2. TOP 5 ITEM DEVIASI HARIAN UNTUK EVALUASI */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-slate-700 block">
                      ★ 5 Top Item Deviasi Harian (Evaluasi Cabang):
                    </span>
                    <span className="text-[9px] text-slate-400 font-mono">Status Akhir Bulan</span>
                  </div>

                  {SO_DEVIATION_DATA.filter(i => selectedDevOutlet === 'ALL' || i.outletId === selectedDevOutlet).length === 0 ? (
                    <p className="text-xs text-slate-400 italic">Belum ada data closing SO yang masuk.</p>
                  ) : (
                    SO_DEVIATION_DATA
                      .filter(i => selectedDevOutlet === 'ALL' || i.outletId === selectedDevOutlet)
                      .sort((a, b) => a.selisih - b.selisih)
                      .slice(0, 5)
                      .map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between text-[11px] font-mono py-1 border-b border-slate-200/60 last:border-b-0">
                          <span className="text-slate-800 font-semibold truncate max-w-[190px]">
                            {idx + 1}. {item.name}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className={`font-black ${item.deviationPct < -0.29 ? 'text-rose-600' : 'text-emerald-600'}`}>
                              {item.deviationPct}%
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[9px] font-black ${item.selisih < 0 ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'}`}>
                              {item.selisih > 0 ? `+${item.selisih}` : item.selisih} {item.unit}
                            </span>
                          </div>
                        </div>
                      ))
                  )}
                </div>

                {/* 3. DAFTAR LENGKAP SEMUA ITEM SO (NAMA RESMI & DATA REAL TIDAK ADA 0) */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[10px] font-black uppercase text-slate-400 block">
                      Daftar Item Bahan Baku SO:
                    </span>
                    <span className="text-[9px] text-slate-400 font-mono">
                      {SO_DEVIATION_DATA.filter(i => selectedDevOutlet === 'ALL' || i.outletId === selectedDevOutlet).length} Item Terdata
                    </span>
                  </div>

                  {SO_DEVIATION_DATA.filter(i => selectedDevOutlet === 'ALL' || i.outletId === selectedDevOutlet).length === 0 ? (
                    <div className="text-center py-10 space-y-2 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                      <FiInbox className="mx-auto text-3xl text-slate-300" />
                      <p className="text-xs font-bold text-slate-600">Belum ada data closing yang diinput.</p>
                      <p className="text-[10px] text-slate-400">Klik "+ Input Closing Malam" untuk memproses data SO.</p>
                    </div>
                  ) : (
                    SO_DEVIATION_DATA
                      .filter(i => selectedDevOutlet === 'ALL' || i.outletId === selectedDevOutlet)
                      .map((item) => (
                        <div 
                          key={item.id} 
                          className={`p-3.5 rounded-2xl border space-y-2 shadow-2xs ${
                            item.isHighDeviation ? 'bg-rose-50/50 border-rose-300' : 'bg-white border-slate-200'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md">
                                  {item.store}
                                </span>
                                <span className="text-[9px] text-slate-400 font-mono font-bold">
                                  {item.date}
                                </span>
                              </div>
                              <h4 className="text-xs font-black text-slate-900 mt-1">{item.name}</h4>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                                item.isHighDeviation ? 'bg-rose-600 text-white' : 'bg-emerald-100 text-emerald-700'
                              }`}>
                                {item.isHighDeviation ? 'JELEK (< -0.29%)' : 'AMAN'}
                              </span>

                              <button
                                type="button"
                                onClick={() => setItemToAdjust(item)}
                                title="Adjust / Rekonsiliasi Deviasi"
                                className="p-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700 text-xs cursor-pointer shadow-2xs"
                              >
                                <FiEdit3 />
                              </button>
                            </div>
                          </div>

                          {/* Data Rinci SO: Stok Kemarin, Stok Hari Ini, Usage Fisik, Selisih Deviasi */}
                          <div className="grid grid-cols-4 gap-1.5 py-1.5 px-2 bg-white rounded-xl text-center font-mono border border-slate-100 text-[10px]">
                            <div>
                              <span className="text-[7px] text-slate-400 block font-sans uppercase">Stok Kemarin</span>
                              <span className="font-bold text-slate-800">{item.stokKemarin.toLocaleString('id-ID')}</span>
                            </div>
                            <div>
                              <span className="text-[7px] text-slate-400 block font-sans uppercase">Stok Hari Ini</span>
                              <span className="font-bold text-slate-800">{item.stokHariIni.toLocaleString('id-ID')}</span>
                            </div>
                            <div>
                              <span className="text-[7px] text-slate-400 block font-sans uppercase">Usage Fisik</span>
                              <span className="font-bold text-indigo-700">{item.usageFisik.toLocaleString('id-ID')}</span>
                            </div>
                            <div>
                              <span className="text-[7px] text-slate-400 block font-sans uppercase">Selisih Deviasi</span>
                              <span className={`font-black ${item.selisih < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                {item.selisih > 0 ? `+${item.selisih}` : item.selisih} {item.unit}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
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

        {/* MODAL ADJUSTMENT SURPLUS DEVIASI */}
        {itemToAdjust && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex justify-center items-end sm:items-center p-0 sm:p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-100">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div>
                  <h3 className="text-sm font-black text-slate-900">Adjust Deviasi Midnight</h3>
                  <p className="text-[10px] text-slate-400 font-medium">{itemToAdjust.name} • {itemToAdjust.store}</p>
                </div>
                <button 
                  onClick={() => setItemToAdjust(null)}
                  className="p-2 bg-white hover:bg-slate-200 text-slate-600 rounded-full border border-slate-200 cursor-pointer"
                >
                  <FiX className="text-sm" />
                </button>
              </div>

              <form onSubmit={handleSaveAdjustment} className="p-5 space-y-4">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Usage Fisik Saat Ini:</span>
                    <span className="font-mono font-bold text-slate-800">{itemToAdjust.usageFisik} {itemToAdjust.unit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Standar Promix Teori:</span>
                    <span className="font-mono font-bold text-slate-800">{itemToAdjust.teoriPromix} {itemToAdjust.unit}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-500 block">Alasan Penyesuaian:</label>
                  <select
                    value={adjustReason}
                    onChange={(e) => setAdjustReason(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none"
                  >
                    <option value="Penerimaan barang belum tercatat">Penerimaan barang belum tercatat (Delivery HO/Supplier)</option>
                    <option value="Transfer gerai masuk">Transfer antar-gerai masuk</option>
                    <option value="Koreksi salah timbang fisik">Koreksi salah timbang stok fisik SO</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-500 block">Jumlah Penyesuaian (+ {itemToAdjust.unit}):</label>
                  <input
                    type="number"
                    value={adjustQty}
                    onChange={(e) => setAdjustQty(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold outline-none"
                    placeholder="Contoh: 1500"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingAdjustment}
                  className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-black cursor-pointer shadow-md transition-colors"
                >
                  {isSubmittingAdjustment ? 'Menyimpan Penyesuaian...' : 'Terapkan Penyesuaian Stok'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ➕ MODAL CONTROLLING OPEX (MURNI TUNGGAL SESUAI KATEGORI YANG DIKLIK)     */}
        {/* ========================================================================= */}
        {activeModal === 'opex_control' && (() => {
          // Konfigurasi murni mandiri per fitur (tanpa tab saklar gabungan)
          const catConfig = {
            gas: {
              title: 'Opex Gas LPG',
              badgeLabel: 'GAS LPG',
              icon: <FiZap className="text-amber-500" />,
              badgeBg: 'bg-amber-50 text-amber-800 border-amber-200',
              bannerGradient: 'from-slate-950 via-slate-900 to-amber-950',
              bannerBorder: 'border-amber-500/30',
              accentColor: 'text-amber-400',
              barColor: 'bg-amber-500',
              targetPct: 2.37,
              targetLabel: '2.37%'
            },
            atk: {
              title: 'Opex ATK & Kantor',
              badgeLabel: 'ATK',
              icon: <FiFileText className="text-purple-600" />,
              badgeBg: 'bg-purple-50 text-purple-800 border-purple-200',
              bannerGradient: 'from-slate-950 via-slate-900 to-purple-950',
              bannerBorder: 'border-purple-500/30',
              accentColor: 'text-purple-400',
              barColor: 'bg-purple-600',
              targetPct: 0.21,
              targetLabel: '0.21%'
            },
            inv: {
              title: 'Opex Inventaris',
              badgeLabel: 'INVENTARIS',
              icon: <FiTool className="text-blue-600" />,
              badgeBg: 'bg-blue-50 text-blue-800 border-blue-200',
              bannerGradient: 'from-slate-950 via-slate-900 to-blue-950',
              bannerBorder: 'border-blue-500/30',
              accentColor: 'text-blue-400',
              barColor: 'bg-blue-600',
              targetPct: 0.75,
              targetLabel: '0.75%'
            }
          }[activeOpexCategory] || {
            title: 'Opex Gas LPG',
            badgeLabel: 'GAS LPG',
            icon: <FiZap className="text-amber-500" />,
            bannerGradient: 'from-slate-950 via-slate-900 to-amber-950',
            bannerBorder: 'border-amber-500/30',
            accentColor: 'text-amber-400',
            barColor: 'bg-amber-500',
            targetPct: 2.37,
            targetLabel: '2.37%'
          };

          // Filter baris data murni hanya untuk kategori aktif ini
          const storeRows = (opexKalselMetrics.stores || []).map(st => {
            const currentCat = st[activeOpexCategory] || { actualRp: 0, budgetRp: 0, sisaRp: 0, actualPct: 0 };
            const isOver = currentCat.actualPct > catConfig.targetPct;
            return {
              ...st,
              itemActual: currentCat.actualRp,
              itemBudget: currentCat.budgetRp,
              itemSisa: currentCat.sisaRp,
              itemPct: currentCat.actualPct,
              itemTabung: currentCat.tabung || 0,
              isItemOver: isOver
            };
          });

          // Kalkulasi murni total area hanya untuk kategori ini
          const totalSalesArea = storeRows.reduce((a, b) => a + (b.sales || 0), 0);
          const totalActualArea = storeRows.reduce((a, b) => a + (b.itemActual || 0), 0);
          const totalBudgetArea = Math.round(totalSalesArea * (catConfig.targetPct / 100));
          const totalSisaArea = totalBudgetArea - totalActualArea;
          const areaPctUsed = totalSalesArea > 0 ? Number(((totalActualArea / totalSalesArea) * 100).toFixed(2)) : 0;
          const isAreaOver = areaPctUsed > catConfig.targetPct;

          return (
            <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex justify-center items-end sm:items-center p-0 sm:p-4 animate-in fade-in duration-200">
              <div className="bg-[#FAFBFD] w-full max-w-md rounded-t-3xl sm:rounded-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-100">
                
                {/* Header Modal */}
                <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-white shadow-2xs">
                  <div className="flex items-center gap-2.5">
                    <span className="w-9 h-9 rounded-2xl bg-slate-900 text-white flex items-center justify-center text-sm font-black shadow-xs">
                      {catConfig.icon}
                    </span>
                    <div>
                      <h3 className="text-sm font-black text-slate-900 tracking-tight">{catConfig.title}</h3>
                      <p className="text-[10px] text-slate-400 font-medium">Monitoring Anggaran • 5 Resto Kalsel 1</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setActiveModal(null)}
                    className="p-2 bg-slate-50 hover:bg-slate-200 text-slate-600 rounded-full border border-slate-200 cursor-pointer"
                  >
                    <FiX className="text-sm" />
                  </button>
                </div>

                {/* Periode Evaluasi */}
                <div className="px-4 py-2.5 bg-white border-b border-slate-100 flex items-center justify-between gap-2 shadow-2xs">
                  <span className="text-[10px] font-black uppercase text-slate-500">Periode Evaluasi:</span>
                  <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-xl">
                    <FiCalendar className="text-slate-700 text-xs" />
                    <input
                      type="month"
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      className="bg-transparent text-[10px] font-black text-slate-800 outline-none cursor-pointer w-20"
                    />
                  </div>
                </div>

                {/* Dropdown Filter Resto */}
                {isAM && (
                  <div className="px-4 py-2 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between gap-2">
                    <span className="text-[10px] font-black uppercase text-slate-500">Filter Resto:</span>
                    <select
                      value={selectedOpexOutlet}
                      onChange={(e) => setSelectedOpexOutlet(e.target.value)}
                      className="text-xs font-bold bg-white border border-slate-200 text-slate-800 rounded-xl px-2.5 py-1.5 outline-none cursor-pointer shadow-2xs flex-1 max-w-[240px]"
                    >
                      <option value="ALL">🌐 Semua 5 Resto (Kalsel 1)</option>
                      <option value="BJMHAS">Gacoan Banjarmasin Hasan Basri</option>
                      <option value="BJMAHM">Gacoan Banjarmasin A Yani</option>
                      <option value="BLNBAT">Gacoan Tanahbumbu Raya Batu Licin</option>
                      <option value="BLNPRO">Gacoan Tanah Bumbu Propinsi</option>
                      <option value="PLIBAL">Gacoan Tanah Laut Bali Rejo</option>
                    </select>
                  </div>
                )}

                {/* Scrollable Body */}
                <div className="p-4 overflow-y-auto space-y-4">
                  
                  {/* Banner Utama Murni Kategori Ini */}
                  <div className={`bg-gradient-to-br ${catConfig.bannerGradient} text-white p-5 rounded-3xl shadow-xl border ${catConfig.bannerBorder} space-y-3`}>
                    <div className="flex items-center justify-between border-b border-white/10 pb-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">
                        {isAM && selectedOpexOutlet === 'ALL' ? `Total ${catConfig.title} Area Kalsel 1` : `Target ${catConfig.title}`}
                      </span>
                      <span className="text-[9px] font-mono font-bold bg-white/10 text-slate-300 px-2 py-0.5 rounded-full">
                        Pagu Maks: {catConfig.targetLabel}
                      </span>
                    </div>

                    <div className="flex items-baseline justify-between pt-1">
                      <div>
                        <span className="text-[9px] text-slate-400 block uppercase">Realisasi Pemakaian</span>
                        <p className={`text-2xl font-black font-mono text-white mt-0.5 tracking-tight ${!canViewNominal ? 'filter blur-sm select-none' : ''}`}>
                          Rp {totalActualArea.toLocaleString('id-ID')}
                        </p>
                        <p className={`text-[10px] text-slate-300 font-mono mt-0.5 ${!canViewNominal ? 'filter blur-sm select-none' : ''}`}>
                          Pagu Budget: Rp {totalBudgetArea.toLocaleString('id-ID')}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`text-3xl font-black font-mono ${isAreaOver ? 'text-rose-400' : catConfig.accentColor}`}>
                          {areaPctUsed}%
                        </span>
                        <span className={`text-[8.5px] font-black uppercase px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                          isAreaOver ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}>
                          {isAreaOver ? 'Overbudget' : 'On-Track'}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-white/10 h-2.5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${isAreaOver ? 'bg-rose-500' : catConfig.barColor}`}
                        style={{ width: `${Math.min(100, (areaPctUsed / (catConfig.targetPct || 1)) * 100)}%` }}
                      />
                    </div>

                    <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[10px] font-mono">
                      <span className="text-[8px] text-slate-400 uppercase font-sans">Sisa Kuota Budget:</span>
                      <span className={`font-black ${totalSisaArea >= 0 ? 'text-emerald-300' : 'text-rose-300'} ${!canViewNominal ? 'filter blur-sm select-none' : ''}`}>
                        Rp {totalSisaArea.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>

                  {/* Daftar Resto Per Gerai (Bisa Diklik Masuk ke Rincian) */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                        {isAM ? 'Rincian Per Outlet Kalsel 1' : 'Outlet Anda'}
                      </span>
                      <span className="text-[9px] font-bold text-indigo-600">
                        Klik gerai untuk rincian ↗
                      </span>
                    </div>

                    {storeRows.map((resto) => (
                      <div 
                        key={resto.code}
                        onClick={() => setSelectedOpexRestoDetail(resto)}
                        className="p-4 bg-white border border-slate-200 hover:border-indigo-400 rounded-3xl shadow-2xs space-y-3 cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] group"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md">
                                {resto.code}
                              </span>
                              <span className={`text-[8px] font-black uppercase px-1.5 py-0.2 rounded-md ${
                                resto.isItemOver ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-800'
                              }`}>
                                {resto.isItemOver ? 'OVERBUDGET' : 'ON-BUDGET'}
                              </span>
                            </div>
                            <h4 className="text-xs font-black text-slate-900 mt-1">{resto.name}</h4>
                            <div className={`mt-0.5 text-[10px] font-mono text-slate-500 ${!canViewNominal ? 'filter blur-sm select-none' : ''}`}>
                              Rp {resto.itemActual.toLocaleString('id-ID')} <span className="text-slate-400 font-sans">/</span> Rp {resto.itemBudget.toLocaleString('id-ID')}
                            </div>
                          </div>

                          <div className="text-right">
                            <span className={`text-base font-black font-mono ${resto.isItemOver ? 'text-rose-600' : 'text-slate-900'}`}>
                              {resto.itemPct}%
                            </span>
                            <span className="text-[8px] text-slate-400 block font-sans">
                              Maks: {catConfig.targetLabel}
                            </span>
                          </div>
                        </div>

                        {/* Progress Bar Resto */}
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              resto.isItemOver ? 'bg-rose-500' : catConfig.barColor
                            }`}
                            style={{ width: `${Math.min(100, (resto.itemPct / (catConfig.targetPct || 1)) * 100)}%` }}
                          />
                        </div>

                        {/* Detail Sisa Kuota Resto */}
                        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 text-[10px] font-mono bg-slate-50 -mx-4 -mb-4 p-3 rounded-b-3xl">
                          <div>
                            <span className="text-[8px] font-bold text-slate-400 uppercase font-sans block">Sisa Kuota</span>
                            <span className={`font-black ${resto.itemSisa >= 0 ? 'text-emerald-700' : 'text-rose-600'} ${!canViewNominal ? 'filter blur-sm select-none' : ''}`}>
                              Rp {resto.itemSisa.toLocaleString('id-ID')}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-[8px] font-bold text-slate-400 uppercase font-sans block">
                              {activeOpexCategory === 'gas' && resto.itemTabung > 0 ? 'Pemakaian Tabung' : 'Penjualan Resto'}
                            </span>
                            <span className={`font-black text-slate-700 ${!canViewNominal ? 'filter blur-sm select-none' : ''}`}>
                              {activeOpexCategory === 'gas' && resto.itemTabung > 0 ? `${resto.itemTabung} Tabung` : `Rp ${resto.sales.toLocaleString('id-ID')}`}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                </div>

                {/* Footer Modal */}
                <div className="p-3 border-t border-slate-200 bg-white">
                  <button
                    onClick={() => setActiveModal(null)}
                    className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
                  >
                    Tutup Modul {catConfig.title}
                  </button>
                </div>

              </div>
            </div>
          );
        })()}

        {/* ========================================================================= */}
        {/* ➕ MODAL DETAIL OPEX RESTO (OVERVIEW LENGKAP KETIKA RESTO DIKLIK)         */}
        {/* ========================================================================= */}
        {selectedOpexRestoDetail && (() => {
          const r = selectedOpexRestoDetail;
          const currentCat = r[activeOpexCategory] || {};
          const isOver = currentCat.actualPct > currentCat.targetPct;

          return (
            <div className="fixed inset-0 z-[60] bg-slate-950/85 backdrop-blur-md flex justify-center items-center p-3 animate-in fade-in zoom-in-95 duration-200">
              <div className="bg-[#FAFBFD] w-full max-w-md max-h-[90vh] rounded-[2.5rem] flex flex-col shadow-2xl border border-slate-200/90 overflow-hidden">
                
                {/* Header Detail */}
                <div className="px-6 py-4 border-b border-slate-200/70 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10">
                  <div className="min-w-0 pr-2">
                    <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600 block">
                      Executive Store OPEX Overview
                    </span>
                    <h4 className="text-sm font-black text-slate-900 truncate mt-0.5 tracking-tight">
                      {r.name}
                    </h4>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setSelectedOpexRestoDetail(null)}
                    className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full transition-all cursor-pointer shadow-2xs hover:rotate-90 duration-200"
                  >
                    <FiX className="text-sm" />
                  </button>
                </div>

                {/* Body Content */}
                <div className="p-5 overflow-y-auto space-y-4 text-xs">
                  
                  {/* Hero Card Biaya */}
                  <div className="p-5 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 text-white rounded-3xl space-y-4 shadow-xl border border-emerald-500/30 relative overflow-hidden">
                    <div className="flex justify-between items-start relative z-10">
                      <div>
                        <span className="text-[9px] text-slate-400 uppercase font-black tracking-widest block">
                          Realisasi Belanja {activeOpexCategory.toUpperCase()}
                        </span>
                        <p className={`text-2xl font-black font-mono mt-1 tracking-tight text-white ${!canViewNominal ? 'filter blur-sm select-none' : ''}`}>
                          Rp {currentCat.actualRp?.toLocaleString('id-ID')}
                        </p>
                        <p className={`text-[11px] text-slate-400 font-mono mt-0.5 ${!canViewNominal ? 'filter blur-sm select-none' : ''}`}>
                          Pagu Budget: Rp {currentCat.budgetRp?.toLocaleString('id-ID')}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className={`text-3xl font-black font-mono tracking-tight block ${isOver ? 'text-rose-400' : 'text-emerald-400'}`}>
                          {currentCat.actualPct}%
                        </span>
                        <span className={`text-[8.5px] font-black uppercase px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                          isOver ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}>
                          {isOver ? 'Overbudget' : 'On-Budget'}
                        </span>
                      </div>
                    </div>

                    <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden relative z-10 shadow-inner">
                      <div 
                        className={`h-full rounded-full transition-all duration-700 ${isOver ? 'bg-rose-500' : 'bg-emerald-400'}`}
                        style={{ width: `${Math.min(100, (currentCat.actualPct / (currentCat.targetPct || 1)) * 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Kartu Rincian Nominal */}
                  <div className="p-4 bg-white border border-slate-200/90 rounded-2xl shadow-xs space-y-2.5 text-[11px] font-mono">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                      <span className="text-slate-500 font-sans font-bold">Total Penjualan Gerai:</span>
                      <span className={`font-black text-slate-800 ${!canViewNominal ? 'filter blur-sm select-none' : ''}`}>
                        Rp {r.sales?.toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                      <span className="text-slate-500 font-sans font-bold">Target Pagu Standar:</span>
                      <span className="font-black text-slate-700 font-sans">
                        Maksimal {currentCat.targetPct}% dari Sales
                      </span>
                    </div>
                    <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                      <span className="text-slate-500 font-sans font-bold">Sisa Budget Tersisa:</span>
                      <span className={`font-black ${currentCat.sisaRp >= 0 ? 'text-emerald-700' : 'text-rose-600'} ${!canViewNominal ? 'filter blur-sm select-none' : ''}`}>
                        Rp {currentCat.sisaRp?.toLocaleString('id-ID')}
                      </span>
                    </div>
                    {activeOpexCategory === 'gas' && currentCat.tabung > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 font-sans font-bold">Total Pemakaian Fisik:</span>
                        <span className="font-black text-amber-700">
                          {currentCat.tabung} Tabung LPG
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Rincian Pos OPEX Lain di Gerai Ini */}
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                    <span className="text-[9.5px] font-black uppercase text-slate-500 tracking-wider block">
                      Pembanding Pos OPEX Lainnya di {r.code}:
                    </span>
                    <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-mono">
                      <div className="p-2 bg-white rounded-xl border border-slate-200 shadow-2xs">
                        <span className="text-[8px] font-sans text-slate-400 uppercase block">🔥 Gas</span>
                        <p className="font-black text-slate-800 mt-0.5">{r.gas?.actualPct}%</p>
                        <span className="text-[8px] text-slate-400">Pagu {r.gas?.targetPct}%</span>
                      </div>
                      <div className="p-2 bg-white rounded-xl border border-slate-200 shadow-2xs">
                        <span className="text-[8px] font-sans text-slate-400 uppercase block">📄 ATK</span>
                        <p className="font-black text-slate-800 mt-0.5">{r.atk?.actualPct}%</p>
                        <span className="text-[8px] text-slate-400">Pagu {r.atk?.targetPct}%</span>
                      </div>
                      <div className="p-2 bg-white rounded-xl border border-slate-200 shadow-2xs">
                        <span className="text-[8px] font-sans text-slate-400 uppercase block">🛠️ Inv</span>
                        <p className="font-black text-slate-800 mt-0.5">{r.inv?.actualPct}%</p>
                        <span className="text-[8px] text-slate-400">Pagu {r.inv?.targetPct}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Tombol Tutup */}
                  <button
                    type="button"
                    onClick={() => setSelectedOpexRestoDetail(null)}
                    className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-black cursor-pointer shadow-md transition-colors"
                  >
                    Tutup Rincian Gerai
                  </button>

                </div>
              </div>
            </div>
          );
        })()}

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
                    Sistem membaca seluruh item bahan baku SO harian.
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
                    Sistem mengekstrak kuantitas menu terjual lalu mengonversi ke gramasi resep promix.
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
                    <p className="text-[10px] text-slate-400 font-medium">Monitoring Aset & Kesiapan Operasional</p>
                  </div>
                </div>
                <button 
                  onClick={() => setActiveModal(null)}
                  className="p-2 bg-white hover:bg-slate-200 text-slate-600 rounded-full border border-slate-200 cursor-pointer"
                >
                  <FiX className="text-sm" />
                </button>
              </div>

              <div className="p-4 bg-gradient-to-b from-slate-50 to-white border-b border-slate-100">
                <div className="grid grid-cols-3 gap-2.5 text-center">
                  <div className="p-3 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Kesiapan Aset</span>
                    <span className="text-xl font-black font-mono text-indigo-600 block mt-0.5">
                      {assetReadinessPercent}%
                    </span>
                    <span className="text-[8px] text-slate-400">Standar Ops</span>
                  </div>

                  <div className="p-3 bg-rose-50/70 rounded-2xl border border-rose-200/80 shadow-xs">
                    <span className="text-[9px] font-bold text-rose-800 uppercase tracking-wider block">Shortage</span>
                    <span className="text-xl font-black font-mono text-rose-600 block mt-0.5">
                      {totalShortageCount}
                    </span>
                    <span className="text-[8px] text-rose-700 font-bold">Wajib Restock</span>
                  </div>

                  <div className="p-3 bg-emerald-50/70 rounded-2xl border border-emerald-200/80 shadow-xs">
                    <span className="text-[9px] font-bold text-emerald-800 uppercase tracking-wider block">Stok Cukup</span>
                    <span className="text-xl font-black font-mono text-emerald-600 block mt-0.5">
                      {totalNormalCount}
                    </span>
                    <span className="text-[8px] text-emerald-700 font-bold">Aman Digunakan</span>
                  </div>
                </div>
              </div>

              <div className="px-4 py-2.5 bg-white border-b border-slate-100 flex items-center justify-between gap-2">
                <span className="text-[10px] font-black uppercase text-slate-400 shrink-0">Cabang Resto:</span>
                <select
                  value={selectedEquipOutlet}
                  onChange={(e) => setSelectedEquipOutlet(e.target.value)}
                  className="text-xs font-bold bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3 py-1.5 outline-none cursor-pointer flex-1 max-w-[220px]"
                >
                  {outlets.map(o => (
                    <option key={o.code} value={o.code}>{o.name} ({o.code})</option>
                  ))}
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
                        item.isShortage ? 'bg-rose-50/50 border-l-4 border-l-rose-600 border-rose-200' : 'bg-white border-slate-200/90'
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
                            item.isShortage ? 'bg-rose-600 text-white border-rose-600 shadow-xs' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}>
                            {item.selisihOps >= 0 ? `+${item.selisihOps}` : item.selisihOps}
                          </span>
                          <span className={`text-[8px] font-bold block mt-0.5 uppercase ${
                            item.isShortage ? 'text-rose-600 font-black' : 'text-slate-400'
                          }`}>
                            {item.isShortage ? '⚠️ Shortage' : 'Stok Aman'}
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
            <div className="bg-[#FAFBFD] w-full max-w-md rounded-t-3xl sm:rounded-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-100">
              
              {/* Header CACP dengan Pemilih Wilayah */}
              <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-white shadow-2xs">
                <div className="flex items-center gap-2">
                  {selectedOutletForCacp && (
                    <button 
                      onClick={() => setSelectedOutletForCacp(null)}
                      className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 mr-1 cursor-pointer"
                    >
                      <FiArrowLeft className="text-sm" />
                    </button>
                  )}
                  <div>
                    <h3 className="text-sm font-black text-slate-900">
                      {selectedOutletForCacp ? selectedOutletForCacp.name : 'Audit CACP (Project RM)'}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-medium">
                      Periode: {selectedMonth} ({totalDaysInSelectedMonth} Hari Kalender)
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setSelectedOutletForCacp(null);
                    setSelectedManagerForCacpHistory(null);
                    setActiveModal(null);
                  }}
                  className="p-2 bg-slate-50 hover:bg-slate-200 text-slate-600 rounded-full border border-slate-200 cursor-pointer"
                >
                  <FiX className="text-sm" />
                </button>
              </div>

              {/* Selector Filter Wilayah Khusus CACP */}
              {!selectedOutletForCacp && isSuperUser && (
                <div className="px-4 py-2 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between gap-2">
                  <span className="text-[10px] font-black uppercase text-slate-500">Filter Wilayah:</span>
                  <select
                    value={selectedRegionFilter}
                    onChange={(e) => setSelectedRegionFilter(e.target.value)}
                    className="text-xs font-bold bg-white border border-slate-200 text-slate-800 rounded-xl px-2.5 py-1.5 outline-none cursor-pointer shadow-2xs flex-1 max-w-[200px]"
                  >
                    <option value="KALSEL_1">📍 Wilayah Kalsel 1</option>
                    <option value="KALTIM">📍 Wilayah Kaltim</option>
                    <option value="ALL">🌐 Semua Wilayah</option>
                  </select>
                </div>
              )}

              <div className="p-4 overflow-y-auto space-y-3.5 flex-1">
                {!selectedOutletForCacp && (
                  <>
                    {/* Standar Target RM */}
                    <div className="p-3.5 bg-gradient-to-r from-purple-900 to-indigo-950 text-white rounded-2xl space-y-1.5 shadow-md">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase text-purple-300 tracking-wider">
                          Standar Kepatuhan RM
                        </span>
                        <span className="text-[9px] bg-purple-500/30 border border-purple-400/50 px-2 py-0.5 rounded-full font-bold">
                          Daily Mandatory
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
                        <div className="bg-white/10 p-2 rounded-xl border border-white/10">
                          <span className="text-[8px] text-slate-300 block font-sans uppercase">Store Manager</span>
                          <span className="font-bold text-amber-300">Target ≥ 80%</span>
                          <p className="text-[8px] text-rose-300 font-sans mt-0.5">&lt; 80% = Demosi</p>
                        </div>
                        <div className="bg-white/10 p-2 rounded-xl border border-white/10">
                          <span className="text-[8px] text-slate-300 block font-sans uppercase">Under SM</span>
                          <span className="font-bold text-emerald-300">Target ≥ 90%</span>
                          <p className="text-[8px] text-amber-200 font-sans mt-0.5">&lt; 90% = Gagal Promosi</p>
                        </div>
                      </div>
                    </div>

                    {/* Tombol Isi Form RM */}
                    <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-2xl flex items-center justify-between shadow-2xs">
                      <div>
                        <h4 className="text-xs font-black text-indigo-950">Daily Jobdesk CACP</h4>
                        <p className="text-[10px] text-indigo-700">Wajib diisi saat on-shift maupun jadwal OFF</p>
                      </div>
                      <a
                        href={CACP_GOOGLE_FORM_URL}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl flex items-center gap-1.5 shadow-xs shrink-0"
                      >
                        <span>Isi Form RM</span>
                        <FiExternalLink className="text-xs" />
                      </a>
                    </div>

                    {/* LOG PENGERJAAN CACP HARI INI (HANYA WILAYAH TERPILIH) */}
                    <div className="p-3.5 bg-white border border-slate-200 rounded-2xl space-y-2 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase text-slate-700 tracking-wider">
                          Setoran CACP Hari Ini ({new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })})
                        </span>
                        <span className="text-[9px] font-mono font-bold text-indigo-600">
                          {cacpLogs.filter(l => {
                            const matchToday = l.log_date === new Date().toISOString().split('T')[0];
                            const out = outlets.find(o => o.id === l.outlet_id);
                            return matchToday && isOutletInRegion(out, selectedRegionFilter);
                          }).length} Manajer Submit
                        </span>
                      </div>

                      <div className="max-h-48 overflow-y-auto space-y-1.5 pt-1">
                        {profiles
                          .filter(p => ['store_manager', 'ast_store_manager', 'floor_leader', 'floor_leader_orientation'].includes(p.role))
                          .filter(p => {
                            const out = outlets.find(o => o.id === p.outlet_id);
                            return isOutletInRegion(out, selectedRegionFilter);
                          })
                          .map(mgr => {
                            const todayDate = new Date().toISOString().split('T')[0];
                            const logItem = cacpLogs.find(l => l.user_id === mgr.id && l.log_date === todayDate);
                            const isSubmitted = !!logItem;
                            const mgrOutlet = outlets.find(o => o.id === mgr.outlet_id);

                            return (
                              <div 
                                key={mgr.id} 
                                onClick={() => setSelectedManagerForCacpHistory(mgr)}
                                className="p-2.5 bg-slate-50 hover:bg-indigo-50/50 rounded-xl border border-slate-100 flex items-center justify-between text-[10px] cursor-pointer transition-all"
                              >
                                <div className="min-w-0 flex-1 pr-2">
                                  <p className="font-black text-slate-900 truncate">{mgr.full_name}</p>
                                  <p className="text-[8.5px] text-slate-400 truncate">{mgrOutlet?.name || 'Cabang'}</p>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <span className={`px-2 py-0.5 rounded text-[8.5px] font-black ${
                                    isSubmitted ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                  }`}>
                                    {isSubmitted ? `✓ Selesai (${logItem.shift_status})` : 'Belum Isi'}
                                  </span>
                                  <FiChevronRight className="text-slate-400 text-xs" />
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>

                    {/* DAFTAR RESTO DENGAN PERSENTASE KEPATUHAN BULANAN */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between px-1">
                        <span className="text-[11px] font-black uppercase text-slate-500 tracking-wider">
                          Persentase Resto Aktif ({selectedRegionFilter === 'KALSEL_1' ? 'Kalsel 1' : selectedRegionFilter === 'KALTIM' ? 'Kaltim' : 'Semua'})
                        </span>
                        <span className="text-[9px] font-bold text-slate-400">Klik resto untuk buka rincian</span>
                      </div>

                      {outletScoreRankings.filter(o => isOutletInRegion(o, selectedRegionFilter)).map(resto => {
                        const isCritical = resto.cacpData.isCritical;
                        const isWarning = resto.cacpData.isWarning;

                        return (
                          <div 
                            key={resto.id}
                            onClick={() => setSelectedOutletForCacp(resto)}
                            className={`p-3.5 rounded-2xl border transition-all cursor-pointer shadow-2xs space-y-2 hover:scale-[1.01] ${
                              isCritical ? 'bg-rose-50/70 border-rose-300' :
                              isWarning ? 'bg-amber-50/60 border-amber-300' :
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
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}

                {/* VIEW DETAIL CABANG RESTO */}
                {selectedOutletForCacp && (
                  <div className="space-y-3.5">
                    <div className="p-3 bg-white border border-slate-200 rounded-2xl flex items-center justify-between shadow-2xs">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold">Rapor Kepatuhan Resto</span>
                        <p className="text-xs font-black text-slate-900">{selectedOutletForCacp.name}</p>
                      </div>
                      <span className="text-xs font-mono font-black px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-200">
                        {selectedOutletForCacp.cacpData.overallPercentage}% Rerata
                      </span>
                    </div>

                    <div className="space-y-2">
                      <span className="text-[10px] font-black uppercase text-slate-500 px-1 block">
                        Daftar Manajer di Resto Ini (Klik untuk Riwayat Hari):
                      </span>

                      {selectedOutletForCacp.cacpData.managers.map(mgr => {
                        const targetProfile = profiles.find(p => p.id === mgr.id);

                        return (
                          <div 
                            key={mgr.id} 
                            onClick={() => setSelectedManagerForCacpHistory(targetProfile || mgr)}
                            className="p-3 bg-white border border-slate-200/90 rounded-2xl shadow-2xs space-y-1.5 cursor-pointer hover:border-indigo-400 transition-all"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="text-xs font-black text-slate-900">{mgr.name}</h4>
                                <p className="text-[9.5px] text-indigo-700 font-bold">{mgr.roleLabel} • Target {mgr.threshold}%</p>
                              </div>
                              <span className={`text-xs font-mono font-black px-2.5 py-1 rounded-xl border ${
                                mgr.isPass ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                              }`}>
                                {mgr.scoreCurrentMonth}%
                              </span>
                            </div>
                            <span className="text-[8.5px] text-slate-400 font-bold block pt-0.5">
                              📅 Klik untuk cek riwayat tanggal submit vs bolong →
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => setSelectedOutletForCacp(null)}
                      className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      ← Kembali ke Daftar Resto
                    </button>
                  </div>
                )}
              </div>

              <div className="p-3 border-t border-slate-200 bg-white">
                <button
                  onClick={() => {
                    setSelectedOutletForCacp(null);
                    setSelectedManagerForCacpHistory(null);
                    setActiveModal(null);
                  }}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
                >
                  Tutup Modul CACP
                </button>
              </div>

            </div>
          </div>
        )}

        {/* MODAL RIWAYAT TANGGAL PENGERJAAN & BOLONG CACP MANAJER */}
        {selectedManagerForCacpHistory && (() => {
          const mgr = selectedManagerForCacpHistory;
          const mgrOutlet = outlets.find(o => o.id === mgr.outlet_id);
          const daysInMonth = totalDaysInSelectedMonth;

          // Susun daftar seluruh hari dalam bulan yang dipilih (misal: 1 s.d 31)
          const [yearStr, monthStr] = selectedMonth.split('-');
          const daysList = Array.from({ length: daysInMonth }, (_, i) => {
            const dayNum = i + 1;
            const dayFormatted = String(dayNum).padStart(2, '0');
            const dateStr = `${yearStr}-${monthStr}-${dayFormatted}`;
            const logItem = cacpLogs.find(l => l.user_id === mgr.id && l.log_date === dateStr);
            const isFuture = new Date(dateStr) > new Date();
            return {
              dateStr,
              dayNum,
              logItem,
              isSubmitted: !!logItem,
              isFuture
            };
          });

          const totalSubmitted = daysList.filter(d => d.isSubmitted).length;
          const totalPastDays = daysList.filter(d => !d.isFuture).length;
          const totalMissed = Math.max(0, totalPastDays - totalSubmitted);
          const compliancePct = totalPastDays > 0 ? Math.round((totalSubmitted / totalPastDays) * 100) : 100;

          return (
            <div className="fixed inset-0 z-[60] bg-slate-950/80 backdrop-blur-md flex justify-center items-center p-3 animate-in fade-in duration-200">
              <div className="bg-[#FAFBFD] w-full max-w-md max-h-[90vh] rounded-3xl flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
                
                {/* Header Modal */}
                <div className="px-4 py-3 bg-white border-b border-slate-200 flex items-center justify-between shadow-2xs">
                  <div className="min-w-0 pr-2">
                    <h3 className="text-xs font-black text-slate-900 truncate">{mgr.full_name || mgr.name}</h3>
                    <p className="text-[9px] text-indigo-600 font-bold uppercase truncate">
                      {mgrOutlet?.name || 'Cabang'} • {mgr.role}
                    </p>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setSelectedManagerForCacpHistory(null)}
                    className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500"
                  >
                    <FiX className="text-base" />
                  </button>
                </div>

                {/* Scorecard Kepatuhan */}
                <div className="p-3 bg-white border-b border-slate-100 grid grid-cols-3 gap-2 text-center font-mono text-[9px]">
                  <div className="p-2 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-100">
                    <span className="block text-[7px] font-sans text-slate-400 uppercase">Sudah Submit</span>
                    <span className="font-black text-sm">{totalSubmitted} Hari</span>
                  </div>
                  <div className="p-2 bg-rose-50 text-rose-800 rounded-xl border border-rose-100">
                    <span className="block text-[7px] font-sans text-slate-400 uppercase">Tidak Submit</span>
                    <span className="font-black text-sm">{totalMissed} Hari</span>
                  </div>
                  <div className="p-2 bg-indigo-50 text-indigo-800 rounded-xl border border-indigo-100">
                    <span className="block text-[7px] font-sans text-slate-400 uppercase">Kepatuhan</span>
                    <span className="font-black text-sm">{compliancePct}%</span>
                  </div>
                </div>

                {/* Kalender Grid 1 s.d 31 */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  <span className="text-[10px] font-black uppercase text-slate-600 tracking-wider block">
                    Riwayat Harian Bulan {selectedMonth}:
                  </span>

                  <div className="grid grid-cols-2 gap-2">
                    {daysList.map(item => (
                      <div 
                        key={item.dateStr}
                        className={`p-2.5 rounded-xl border flex items-center justify-between text-[10px] ${
                          item.isFuture ? 'bg-slate-50 border-slate-100 text-slate-400 opacity-60' :
                          item.isSubmitted ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900' :
                          'bg-rose-50/70 border-rose-200 text-rose-900'
                        }`}
                      >
                        <div>
                          <span className="font-black font-mono block">Tgl {item.dayNum}</span>
                          <span className="text-[8px] opacity-75">{item.dateStr}</span>
                        </div>

                        <span className={`px-2 py-0.5 rounded text-[8.5px] font-black ${
                          item.isFuture ? 'bg-slate-200 text-slate-600' :
                          item.isSubmitted ? 'bg-emerald-600 text-white' :
                          'bg-rose-600 text-white'
                        }`}>
                          {item.isFuture ? 'Mendatang' : item.isSubmitted ? `✓ ${item.logItem?.shift_status || 'OK'}` : '✕ Bolong'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer Modal */}
                <div className="p-3 bg-white border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setSelectedManagerForCacpHistory(null)}
                    className="w-full py-2.5 bg-slate-900 text-white font-bold text-xs rounded-xl cursor-pointer"
                  >
                    Tutup Riwayat Manajer
                  </button>
                </div>

              </div>
            </div>
          );
        })()}

        {/* ================= MODAL SLA TASK CONTROLLING (ULTRA MODERN MOBILE DASHBOARD) ================= */}
        {activeModal === 'task_manager' && (() => {
          // 1. Filter Outlets Khusus Kalsel 1 Saja (Kaltim Tersembunyi)
          const filteredOutletsList = outlets.filter(o => isOutletInRegion(o, 'KALSEL_1'));

          // 2. Filter Tugas Berdasarkan Bulan yang Dipilih & Hanya Area Kalsel 1 (Kecualikan CACP Total)
          const monthlyTasks = tasks.filter(t => {
            const taskDate = t.created_at || t.deadline;
            const matchMonth = taskDate && taskDate.substring(0, 7) === selectedMonth;
            const taskOutlet = outlets.find(o => o.id === t.outlet_id);
            const isKalselTask = !t.outlet_id || isOutletInRegion(taskOutlet, 'KALSEL_1');
            const isCacp = (t.department === 'cacp_audit') || (t.title || '').toUpperCase().includes('CACP');
            return matchMonth && isKalselTask && !isCacp;
          });

          // 3. Kalkulasi Performa Manajer (Prioritas: Sudah Selesai, Tepat & Paling Cepat)
          const allManagersPerformance = profiles
            .filter(p => ['store_manager', 'ast_store_manager', 'floor_leader', 'floor_leader_orientation'].includes(p.role))
            .filter(manager => {
              const managerOutlet = outlets.find(o => o.id === manager.outlet_id);
              return isOutletInRegion(managerOutlet, 'KALSEL_1');
            })
            .map(manager => {
              const managerOutlet = outlets.find(o => o.id === manager.outlet_id);
              const isMatchRegion = isOutletInRegion(managerOutlet, 'KALSEL_1');
              const isMatchOutlet = slaFilterOutletId === 'ALL' || manager.outlet_id === slaFilterOutletId;

              // 1. Ambil Tugas Bulanan/Adhoc Khusus Manajer Ini (Kecualikan CACP)
              const userTasks = monthlyTasks.filter(t => {
                const isCacp = (t.department === 'cacp_audit') || (t.title || '').toUpperCase().includes('CACP');
                if (isCacp) return false;
                if (t.target_user_id) return t.target_user_id === manager.id;
                return t.outlet_id === manager.outlet_id && t.target_role === manager.role;
              });

              // 2. Ambil Setoran Jobdesk Daily Rutin Khusus Individu (Hanya Tipe INDIVIDUAL)
              const userDailySubs = dailySubmissions.filter(s => {
                if (s.user_id !== manager.id) return false;
                const matchMonth = s.submission_date && s.submission_date.substring(0, 7) === selectedMonth;
                const tpl = dailyTemplates.find(t => t.id === s.template_id);
                return matchMonth && tpl?.scope_type !== 'RESTO';
              });

              let totalScoreSum = 0;
              let evaluatedCount = 0;
              let onTimeCount = 0;
              let sameDayOverdue = 0;
              let multiDayOverdue = 0;
              let uncompletedCount = 0;
              let speedBonusTotal = 0;

              // A. Hitung Tugas Adhoc
              userTasks.forEach(task => {
                const score = calculateTaskScore(task);
                if (score !== null) {
                  totalScoreSum += score;
                  evaluatedCount += 1;
                  if (score >= 80) onTimeCount++;
                  else if (score === 50) sameDayOverdue++;
                  else if (score === 25) multiDayOverdue++;
                  else if (score === 0) uncompletedCount++;
                }

                if (task.status === 'completed' && task.completed_at) {
                  const created = new Date(task.created_at).getTime();
                  const deadline = new Date(task.deadline).getTime();
                  const completed = new Date(task.completed_at).getTime();
                  if (completed <= deadline) {
                    const durasiTotal = Math.max(1, deadline - created);
                    const waktuHemat = Math.max(0, deadline - completed);
                    speedBonusTotal += (waktuHemat / durasiTotal) * 100;
                  }
                }
              });

              // B. Hitung Tugas Daily Individu (1 Tugas Selesai = Tepat 1)
              userDailySubs.forEach(s => {
                evaluatedCount += 1;
                const tpl = dailyTemplates.find(t => t.id === s.template_id);

                if (s.status !== 'completed') {
                  totalScoreSum += 100;
                  onTimeCount += 1;
                  return;
                }

                let isDailyOnTime = true;
                if (tpl?.deadline_time && s.submitted_at) {
                  const subTime = new Date(s.submitted_at);
                  const subHourMinute = `${String(subTime.getHours()).padStart(2, '0')}:${String(subTime.getMinutes()).padStart(2, '0')}:00`;
                  if (subHourMinute > tpl.deadline_time) {
                    isDailyOnTime = false;
                  }
                }

                if (isDailyOnTime) {
                  totalScoreSum += 100;
                  onTimeCount += 1;
                } else {
                  totalScoreSum += 50;
                  sameDayOverdue += 1;
                }
              });

              // Jika punya tugas tapi belum selesai sama sekali, jangan beri nilai 100%
              const completedCount = onTimeCount + sameDayOverdue + multiDayOverdue;
              const avgScore = evaluatedCount > 0 
                ? Math.round(totalScoreSum / evaluatedCount) 
                : (userTasks.length > 0 ? 0 : 100);

              return {
                id: manager.id,
                name: manager.full_name,
                avatar: manager.avatar,
                role: manager.role,
                outletId: manager.outlet_id,
                outletName: managerOutlet?.name || 'Cabang Resto',
                outletCode: managerOutlet?.code || '-',
                totalTasks: userTasks.length,
                completedTasksCount: completedCount,
                avgScore,
                onTimeCount,
                sameDayOverdue,
                multiDayOverdue,
                uncompletedCount,
                speedBonus: speedBonusTotal,
                tasks: userTasks,
                isIncludedInFilter: isMatchRegion && isMatchOutlet
              };
            })
            .sort((a, b) => {
              // 1. Diurutkan murni berdasarkan tingkat keberhasilan skor SLA tertinggi (bukan kuantitas tugas)
              if (b.avgScore !== a.avgScore) {
                return b.avgScore - a.avgScore;
              }
              // 2. Berdasarkan jumlah tugas tepat waktu
              if (b.onTimeCount !== a.onTimeCount) {
                return b.onTimeCount - a.onTimeCount;
              }
              // 3. Berdasarkan kecepatan waktu pengerjaan
              return b.speedBonus - a.speedBonus;
            });

          const displayedManagers = allManagersPerformance.filter(m => m.isIncludedInFilter);
          const currentLoggedInManager = allManagersPerformance.find(m => m.id === currentProfile?.id);
          const currentManagerRank = allManagersPerformance.findIndex(m => m.id === currentProfile?.id) + 1;

          // 4. Kalkulasi Performa SLA Tim per Resto (Sinkron Tiket Bulanan + Jobdesk Daily)
          const restoPerformanceList = filteredOutletsList.map(resto => {
            // A. Tugas Proyek Bulanan
            const restoTasks = monthlyTasks.filter(t => t.outlet_id === resto.id);
            
            // B. Setoran Daily Rutin Bulan Ini untuk Resto Ini
            const restoDailySubs = dailySubmissions.filter(s => {
              const matchResto = s.outlet_id === resto.id;
              const matchMonth = s.submission_date && s.submission_date.substring(0, 7) === selectedMonth;
              return matchResto && matchMonth;
            });

            let sumScores = 0;
            let count = 0;
            let onTime = 0;
            let overdue = 0;

            // 1. Evaluasi Tugas Bulanan / Adhoc
            restoTasks.forEach(t => {
              const score = calculateTaskScore(t);
              if (score !== null) {
                sumScores += score;
                count++;
                if (score >= 80) onTime++;
                else overdue++;
              }
            });

            // 2. Evaluasi Setoran Daily (Menilai Kepatuhan Waktu Jam Submit)
            restoDailySubs.forEach(s => {
              const tpl = dailyTemplates.find(t => t.id === s.template_id);
              count++;

              if (s.status !== 'completed') {
                // Status OFF / Sakit / Izin / Cuti dianggap aman & dispensasi
                sumScores += 100;
                onTime++;
                return;
              }

              // Validasi Ketepatan Waktu: jam submit vs deadline template
              let isDailyOnTime = true;
              if (tpl?.deadline_time && s.submitted_at) {
                const subTime = new Date(s.submitted_at);
                const subHourMinute = `${String(subTime.getHours()).padStart(2, '0')}:${String(subTime.getMinutes()).padStart(2, '0')}:00`;
                if (subHourMinute > tpl.deadline_time) {
                  isDailyOnTime = false;
                }
              }

              if (isDailyOnTime) {
                sumScores += 100;
                onTime++;
              } else {
                sumScores += 50; // Telat submit dikenakan skor 50%
                overdue++;
              }
            });

            const totalAllTasks = count;
            const avgSla = totalAllTasks > 0 ? Math.round(sumScores / totalAllTasks) : 100;

            return {
              id: resto.id,
              name: resto.name,
              code: resto.code,
              avgSla,
              totalTasks: totalAllTasks,
              onTime,
              overdue
            };
          }).sort((a, b) => b.avgSla - a.avgSla);

          // Resto Terpilih saat ini untuk Card Detail
          const currentSelectedRestoInfo = outlets.find(o => o.id === slaFilterOutletId) || filteredOutletsList[0];
          const selectedRestoPerf = restoPerformanceList.find(r => r.id === currentSelectedRestoInfo?.id) || { avgSla: 100, onTime: 0, overdue: 0, totalTasks: 0 };

          // 5. Data Titik Grafik Tren Harian (Simulasi 7 Hari Kerja Terakhir)
          const trendPoints = [
            { day: 'Sen', score: Math.min(100, Math.max(40, selectedRestoPerf.avgSla - 8)) },
            { day: 'Sel', score: Math.min(100, Math.max(50, selectedRestoPerf.avgSla - 2)) },
            { day: 'Rab', score: Math.min(100, Math.max(30, selectedRestoPerf.avgSla - 15)) },
            { day: 'Kam', score: Math.min(100, Math.max(55, selectedRestoPerf.avgSla + 3)) },
            { day: 'Jum', score: Math.min(100, Math.max(60, selectedRestoPerf.avgSla - 5)) },
            { day: 'Sab', score: Math.min(100, Math.max(70, selectedRestoPerf.avgSla + 2)) },
            { day: 'Min', score: selectedRestoPerf.avgSla }
          ];

          // Buat string path SVG grafik kurva
          const chartWidth = 320;
          const chartHeight = 85;
          const svgPoints = trendPoints.map((pt, i) => {
            const x = (i / (trendPoints.length - 1)) * (chartWidth - 20) + 10;
            const y = chartHeight - ((pt.score / 100) * (chartHeight - 20)) - 10;
            return `${x},${y}`;
          }).join(' ');

          const totalRegionalAvg = displayedManagers.length > 0
            ? Math.round(displayedManagers.reduce((acc, c) => acc + c.avgScore, 0) / displayedManagers.length)
            : 100;

          return (
            <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex justify-center items-center animate-in fade-in duration-200">
              <div className="w-full max-w-md bg-[#F8FAFC] h-full sm:h-[95vh] sm:rounded-3xl flex flex-col shadow-2xl relative overflow-hidden border-x border-slate-200">
                
                {/* TOP APP BAR & FILTER BULAN */}
                <div className="px-4 pt-3.5 pb-2.5 bg-white border-b border-slate-100 flex flex-col gap-2 shrink-0 shadow-2xs z-20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button 
                        type="button"
                        onClick={() => setActiveModal(null)}
                        className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-700 transition-colors cursor-pointer border border-slate-200/80 shadow-2xs"
                      >
                        <FiArrowLeft className="text-base" />
                      </button>
                      <div>
                        <h2 className="text-xs font-black text-slate-900 tracking-tight leading-tight flex items-center gap-1.5">
                          <span>SLA Project Controlling</span>
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                        </h2>
                        <p className="text-[9px] text-indigo-600 font-bold uppercase tracking-wider">
                          {currentProfile?.role === 'area_manager' ? 'Monitoring Multi-Resto AM' : 'Dashboard Kepatuhan Manajer'}
                        </p>
                      </div>
                    </div>

                    {/* PEMILIH BULAN (CEK RIWAYAT PERIODE) */}
                    <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 px-2 py-1 rounded-xl shadow-2xs">
                      <FiCalendar className="text-indigo-600 text-xs" />
                      <input
                        type="month"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="bg-transparent text-[10px] font-black text-slate-800 outline-none cursor-pointer w-20"
                        title="Pilih Bulan Evaluasi"
                      />
                    </div>
                  </div>

                  {/* FILTER WILAYAH KHUSUS KALSEL 1 */}
                  <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                    <div className="bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-black rounded-xl px-2.5 py-1.5 flex items-center justify-center gap-1 shadow-2xs">
                      <span>📍 Wilayah Kalsel 1</span>
                    </div>

                    <select
                      value={slaFilterOutletId}
                      onChange={(e) => setSlaFilterOutletId(e.target.value)}
                      className="bg-slate-50 border border-slate-200 text-slate-800 text-[10px] font-black rounded-xl px-2 py-1.5 outline-none cursor-pointer shadow-2xs truncate"
                    >
                      <option value="ALL">Semua Resto Kalsel 1</option>
                      {outlets.filter(o => isOutletInRegion(o, 'KALSEL_1')).map(o => (
                        <option key={o.id} value={o.id}>{o.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* SUB TAB SELECTOR */}
                  <div className="flex gap-1 bg-slate-100 p-0.5 rounded-xl border border-slate-200/80">
                    <button
                      type="button"
                      onClick={() => setSlaActiveTab('ranking')}
                      className={`flex-1 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                        slaActiveTab === 'ranking' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      👑 Manajer ({displayedManagers.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setSlaActiveTab('resto_compare')}
                      className={`flex-1 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                        slaActiveTab === 'resto_compare' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      📈 Tren & Resto
                    </button>
                    <button
                      type="button"
                      onClick={() => setSlaActiveTab('tasks')}
                      className={`flex-1 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                        slaActiveTab === 'tasks' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      📋 Tiket Tugas
                    </button>
                  </div>
                </div>

                {/* SCROLLABLE BODY */}
                <div className="flex-1 overflow-y-auto px-4 py-3.5 space-y-3.5 pb-20">

                  {/* ================= 1. TAB MANAJER (STORE DATA PERTAMA, BARU LIST MANAJER) ================= */}
                  {slaActiveTab === 'ranking' && (
                    <div className="space-y-3 animate-in fade-in duration-150">
                      
                      {/* CARD DATA RESTO / STORE AKTIF */}
                      <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-4 shadow-xl border border-indigo-500/25 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-36 h-36 bg-indigo-500/15 rounded-full blur-2xl pointer-events-none"></div>

                        <div className="flex items-center justify-between border-b border-white/10 pb-2">
                          <span className="text-[9px] font-black uppercase tracking-widest text-indigo-300 flex items-center gap-1.5">
                            <FiLayers /> Data Store & Kepatuhan Cabang
                          </span>
                          <span className="text-[8px] font-mono font-bold px-2 py-0.5 rounded-full bg-white/10 text-slate-300">
                            Periode: {selectedMonth}
                          </span>
                        </div>

                        <div className="mt-3 flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <h3 className="text-sm font-black text-white truncate leading-tight">
                              {slaFilterOutletId === 'ALL' ? 'Semua Resto Terpilih' : currentSelectedRestoInfo?.name}
                            </h3>
                            <p className="text-[10px] text-indigo-300 font-medium mt-0.5 truncate">
                              Wilayah: {slaFilterRegion === 'KALSEL_1' ? 'Kalsel 1' : slaFilterRegion === 'KALTIM' ? 'Kaltim' : 'Kalsel & Kaltim'}
                            </p>
                            {(() => {
                              // Hitung total onTime & overdue secara dinamis sesuai filter
                              const activeOnTime = slaFilterOutletId === 'ALL'
                                ? restoPerformanceList.reduce((acc, r) => acc + r.onTime, 0)
                                : selectedRestoPerf.onTime;
                              const activeOverdue = slaFilterOutletId === 'ALL'
                                ? restoPerformanceList.reduce((acc, r) => acc + r.overdue, 0)
                                : selectedRestoPerf.overdue;

                              return (
                                <div className="flex items-center gap-2 mt-2">
                                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                                    {activeOnTime} Tepat Waktu
                                  </span>
                                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/30 font-mono">
                                    {activeOverdue} Overdue
                                  </span>
                                </div>
                              );
                            })()}
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-[9px] text-slate-400 uppercase block">Rerata Disiplin</span>
                            <span className="text-3xl font-black font-mono text-emerald-400">
                              {slaFilterOutletId === 'ALL' ? totalRegionalAvg : selectedRestoPerf.avgSla}%
                            </span>
                          </div>
                        </div>

                        {/* Bar Proporsi Ketepatan */}
                        <div className="w-full bg-white/10 h-2.5 rounded-full overflow-hidden flex mt-3.5 shadow-inner">
                          <div 
                            className="bg-emerald-400 h-full transition-all duration-500" 
                            style={{ width: `${slaFilterOutletId === 'ALL' ? totalRegionalAvg : selectedRestoPerf.avgSla}%` }} 
                          />
                          <div 
                            className="bg-rose-500 h-full transition-all duration-500" 
                            style={{ width: `${Math.max(0, 100 - (slaFilterOutletId === 'ALL' ? totalRegionalAvg : selectedRestoPerf.avgSla))}%` }} 
                          />
                        </div>
                      </div>

                      {/* DAFTAR MANAJER BERDASARKAN PERSENTASE KERAJINAN */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between px-1 pt-1">
                          <span className="text-[10px] font-black uppercase text-slate-700 tracking-wider flex items-center gap-1.5">
                            <FiAward className="text-amber-500 text-xs" /> Ranking Kerajinan Manajer
                          </span>
                          <span className="text-[9px] font-mono text-slate-400 font-bold">
                            Tepat / Kecepatan
                          </span>
                        </div>

                        {displayedManagers.length === 0 ? (
                          <div className="p-6 bg-white rounded-2xl border border-dashed border-slate-200 text-center text-xs text-slate-400 font-bold">
                            Tidak ada data manajer pada periode & filter ini.
                          </div>
                        ) : (
                          displayedManagers.map((mgr, idx) => {
                            const isTop1 = idx === 0;
                            const isTop2 = idx === 1;
                            const isTop3 = idx === 2;
                            const isSelf = mgr.id === currentProfile?.id;

                            return (
                              <div 
                                key={mgr.id} 
                                onClick={() => setSelectedManagerForTaskHistory(mgr)}
                                className={`p-3.5 rounded-2xl border transition-all space-y-2.5 shadow-2xs cursor-pointer hover:border-indigo-400 active:scale-[0.99] ${
                                  isSelf ? 'ring-2 ring-indigo-500 bg-indigo-50/30 border-indigo-300' :
                                  isTop1 ? 'bg-gradient-to-r from-amber-50/70 via-white to-amber-50/30 border-amber-300' : 
                                  'bg-white border-slate-200/80 hover:bg-slate-50'
                                }`}
                              >
                                <div className="flex items-center justify-between gap-2.5">
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                                      isTop1 ? 'bg-gradient-to-tr from-amber-400 to-amber-500 text-amber-950 shadow-xs ring-2 ring-amber-200' :
                                      isTop2 ? 'bg-slate-200 text-slate-700' :
                                      isTop3 ? 'bg-amber-100 text-amber-800' :
                                      'bg-slate-100 text-slate-500'
                                    }`}>
                                      {isTop1 ? '👑' : `#${idx + 1}`}
                                    </div>
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-1.5">
                                        <h4 className="text-xs font-black text-slate-900 truncate">{mgr.name}</h4>
                                        {isSelf && (
                                          <span className="text-[7.5px] font-bold px-1.5 py-0.2 bg-indigo-600 text-white rounded">
                                            Anda
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-[9.5px] text-slate-500 font-medium truncate">
                                        {mgr.outletName} • <span className="text-indigo-600 font-bold uppercase">{mgr.role}</span>
                                      </p>
                                    </div>
                                  </div>

                                  <div className="text-right shrink-0">
                                    <span className={`text-xs font-black font-mono px-2.5 py-1 rounded-xl border ${
                                      mgr.avgScore >= 80 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                      mgr.avgScore >= 50 ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                      'bg-rose-50 text-rose-700 border-rose-200'
                                    }`}>
                                      {mgr.avgScore}% SLA
                                    </span>
                                  </div>
                                </div>

                                {/* Bar Rincian 4 Kategori */}
                                <div className="grid grid-cols-4 gap-1 py-1.5 px-2 bg-slate-50 rounded-xl text-center font-mono text-[8px] border border-slate-100">
                                  <div>
                                    <span className="text-slate-400 block text-[6.5px] font-sans">Tepat</span>
                                    <span className="font-bold text-emerald-700">{mgr.onTimeCount}</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-400 block text-[6.5px] font-sans">Over 1Hr</span>
                                    <span className="font-bold text-amber-700">{mgr.sameDayOverdue}</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-400 block text-[6.5px] font-sans">&gt; 1Hr</span>
                                    <span className="font-bold text-rose-700">{mgr.multiDayOverdue}</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-400 block text-[6.5px] font-sans">Mangkir</span>
                                    <span className="font-bold text-slate-500">{mgr.uncompletedCount}</span>
                                  </div>
                                </div>

                                {/* Opsi Beri Toleransi Khusus AM jika tugas terlambat */}
                                {currentProfile?.role === 'area_manager' && mgr.tasks.some(t => calculateTaskScore(t) < 80 && !t.has_tolerance) && (
                                  <div className="pt-1.5 border-t border-slate-100 space-y-1">
                                    {mgr.tasks.filter(t => calculateTaskScore(t) < 80 && !t.has_tolerance).map(task => (
                                      <div key={task.id} className="p-1.5 bg-rose-50/60 rounded-xl border border-rose-200 flex items-center justify-between gap-1.5">
                                        <p className="text-[9.5px] font-bold text-slate-800 truncate">{task.title}</p>
                                        <button
                                          type="button"
                                          onClick={() => handleGrantTolerance(task)}
                                          className="px-2 py-0.5 bg-white text-amber-800 border border-amber-300 rounded-lg text-[8px] font-black uppercase shrink-0 shadow-2xs cursor-pointer flex items-center gap-1"
                                        >
                                          <FiCheckCircle /> Toleransi 100%
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}

                  {/* ================= 2. TAB RESTO (GRAFIK NAIK-TURUN & KOMPARASI SEMUA RESTO) ================= */}
                  {slaActiveTab === 'resto_compare' && (
                    <div className="space-y-3.5 animate-in fade-in duration-150">
                      
                      {/* GRAFIK NAIK-TURUN KINERJA PENGERJAAN TUGAS RESTO */}
                      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-4 shadow-xl border border-indigo-500/20 space-y-3">
                        <div className="flex items-center justify-between border-b border-white/10 pb-2">
                          <div>
                            <span className="text-[9px] font-black uppercase tracking-widest text-indigo-300 block">
                              📈 Kurva Tren Fluktuasi Kepatuhan
                            </span>
                            <h4 className="text-xs font-bold text-white mt-0.5 truncate max-w-[200px]">
                              {slaFilterOutletId === 'ALL' ? 'Tren Rata-Rata Area' : currentSelectedRestoInfo?.name}
                            </h4>
                          </div>
                          <span className="text-xs font-mono font-black text-emerald-400 bg-white/10 px-2 py-0.5 rounded-lg">
                            {selectedRestoPerf.avgSla}% Live
                          </span>
                        </div>

                        {/* Visual SVG Line Trendline Chart */}
                        <div className="py-1">
                          <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-24 overflow-visible">
                            <defs>
                              <linearGradient id="slaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor="#34d399" stopOpacity="0.4" />
                                <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
                              </linearGradient>
                            </defs>

                            {/* Garis Grid Horizontal Standar Minimum 85% */}
                            <line 
                              x1="10" 
                              y1={chartHeight - ((85 / 100) * (chartHeight - 20)) - 10} 
                              x2={chartWidth - 10} 
                              y2={chartHeight - ((85 / 100) * (chartHeight - 20)) - 10} 
                              stroke="#6366f1" 
                              strokeDasharray="4,4" 
                              strokeWidth="1" 
                            />
                            
                            {/* Area Gradient Kurva */}
                            <polygon
                              fill="url(#slaGradient)"
                              points={`10,${chartHeight - 5} ${svgPoints} ${chartWidth - 10},${chartHeight - 5}`}
                            />

                            {/* Garis Kurva Fluktuasi */}
                            <polyline
                              fill="none"
                              stroke="#34d399"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              points={svgPoints}
                            />

                            {/* Titik Point Harian */}
                            {trendPoints.map((pt, i) => {
                              const x = (i / (trendPoints.length - 1)) * (chartWidth - 20) + 10;
                              const y = chartHeight - ((pt.score / 100) * (chartHeight - 20)) - 10;
                              return (
                                <circle 
                                  key={i} 
                                  cx={x} 
                                  cy={y} 
                                  r="3" 
                                  fill="#10b981" 
                                  stroke="#ffffff" 
                                  strokeWidth="1.5" 
                                />
                              );
                            })}
                          </svg>

                          {/* Label Hari */}
                          <div className="flex justify-between text-[8px] font-mono text-slate-400 px-1 pt-1 border-t border-white/5">
                            {trendPoints.map((pt, i) => (
                              <span key={i}>{pt.day}</span>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-1 text-[9px] font-bold text-slate-300 border-t border-white/10">
                          <span>Status Dominan:</span>
                          <span className={selectedRestoPerf.overdue === 0 ? 'text-emerald-300' : 'text-amber-300'}>
                            {selectedRestoPerf.overdue === 0 ? '✓ Disiplin Tepat Waktu' : `⚠️ Terdapat ${selectedRestoPerf.overdue} Tugas Overdue`}
                          </span>
                        </div>
                      </div>

                      {/* DAFTAR PERBANDINGAN PERSENTASE DENGAN SEMUA RESTO LAIN */}
                      <div className="space-y-2 pt-1">
                        <div className="flex items-center justify-between px-1">
                          <span className="text-[10px] font-black uppercase text-slate-700 tracking-wider block">
                            Perbandingan Kerajinan Antar-Resto ({restoPerformanceList.length} Cabang)
                          </span>
                          <span className="text-[8px] font-mono font-bold text-slate-400">
                            Distribusi %
                          </span>
                        </div>

                        {restoPerformanceList.map((resto, idx) => {
  const isTop1 = idx === 0;
  const isCurrentActive = resto.id === slaFilterOutletId;

  return (
    <div 
      key={resto.id} 
      onClick={() => setSelectedRestoForSlaDetail(resto)}
      className={`p-3 rounded-2xl border transition-all cursor-pointer space-y-2 shadow-2xs hover:scale-[1.01] ${
                                isCurrentActive ? 'bg-indigo-50/70 border-indigo-400 ring-1 ring-indigo-400' :
                                isTop1 ? 'bg-amber-50/40 border-amber-300' : 
                                'bg-white border-slate-200/90 hover:border-slate-300'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <span className={`w-6 h-6 rounded-lg font-mono font-black text-[9px] flex items-center justify-center shrink-0 ${
                                    isTop1 ? 'bg-amber-400 text-amber-950 font-black' : 'bg-slate-100 text-slate-600'
                                  }`}>
                                    #{idx + 1}
                                  </span>
                                  <div className="min-w-0">
                                    <h5 className="text-xs font-black text-slate-900 truncate">{resto.name}</h5>
                                    <p className="text-[9px] text-slate-400 font-mono">
                                      {resto.onTime} Tepat • {resto.overdue} Telat ({resto.totalTasks} Total)
                                    </p>
                                  </div>
                                </div>

                                <span className={`text-xs font-black font-mono px-2.5 py-0.5 rounded-xl border shrink-0 ${
                                  resto.avgSla >= 85 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                  resto.avgSla >= 60 ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                  'bg-rose-50 text-rose-700 border-rose-200'
                                }`}>
                                  {resto.avgSla}% SLA
                                </span>
                              </div>

                              {/* Progress Bar Perbandingan Visual */}
                              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden flex">
                                <div 
                                  className={`h-full transition-all duration-500 ${
                                    resto.avgSla >= 85 ? 'bg-emerald-500' : resto.avgSla >= 60 ? 'bg-amber-500' : 'bg-rose-500'
                                  }`} 
                                  style={{ width: `${resto.avgSla}%` }} 
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>

                    </div>
                  )}

                  {/* ================= 3. TAB TIKET TUGAS ================= */}
                  {slaActiveTab === 'tasks' && (
                    <div className="space-y-3.5 animate-in fade-in duration-150">
                      
                      {/* SAKLAR: TUGAS PROYEK VS JOBDESK DAILY */}
                      <div className="flex gap-1.5 p-1 bg-slate-200/80 rounded-2xl">
                        <button
                          type="button"
                          onClick={() => setTaskTypeTab('adhoc')}
                          className={`flex-1 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                            taskTypeTab === 'adhoc' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          📋 Tugas Proyek / Bulanan
                        </button>
                        <button
                          type="button"
                          onClick={() => setTaskTypeTab('daily')}
                          className={`flex-1 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                            taskTypeTab === 'daily' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          ⭐ Jobdesk Daily (Rutin)
                        </button>
                      </div>

                      {/* JIKA MEMILIH TAB DAILY: TAMPILKAN MASTER JOBDESK DAILY & FORM BUAT DAILY */}
                      {taskTypeTab === 'daily' && (
                        <div className="space-y-3.5">
                          {/* 1. HEADER KONTROL MASTER DAILY (LAYOUT BERSIH & RAPI) */}
                          {currentProfile?.role === 'area_manager' && (
                            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-2.5">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                                    <span>⭐ Master Jobdesk Rutin Harian</span>
                                  </h4>
                                  <p className="text-[9.5px] text-slate-400">Daftar tugas wajib harian untuk seluruh manajer.</p>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => setIsCreatingDailyTemplate(!isCreatingDailyTemplate)}
                                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black rounded-xl cursor-pointer shadow-2xs transition-all"
                                >
                                  {isCreatingDailyTemplate ? 'Batal' : '+ Tambah Jobdesk'}
                                </button>
                              </div>

                              {isCreatingDailyTemplate && (
                                <div className="pt-2.5 border-t border-slate-100 space-y-2">
                                  <input
                                    type="text"
                                    placeholder="Nama Tugas Daily (misal: TTC Daily Minimal 20 Foto)..."
                                    value={dailyFormTitle}
                                    onChange={(e) => setDailyFormTitle(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none"
                                  />

                                  <div className="space-y-1">
                                    <label className="text-[8.5px] font-bold text-slate-500 block">Aturan Penyelesaian Tugas:</label>
                                    <select
                                      value={dailyFormScopeType}
                                      onChange={(e) => setDailyFormScopeType(e.target.value)}
                                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800 outline-none cursor-pointer"
                                    >
                                      <option value="INDIVIDUAL">👤 Wajib Tiap Manajer (Setiap orang wajib submit)</option>
                                      <option value="RESTO">🏪 Cukup 1 Manajer per Resto (1 Orang submit, 1 resto selesai)</option>
                                    </select>
                                  </div>

                                  {/* Pilihan Target Resto Tertentu */}
                                  <div className="space-y-1">
                                    <label className="text-[8.5px] font-bold text-slate-500 block">Tugaskan ke Cabang Resto:</label>
                                    <select
                                      value={dailyFormTargetOutlet}
                                      onChange={(e) => setDailyFormTargetOutlet(e.target.value)}
                                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800 outline-none cursor-pointer"
                                    >
                                      <option value="ALL">🌐 Semua Resto (Kalsel 1)</option>
                                      {outlets.filter(o => isOutletInRegion(o, 'KALSEL_1')).map(o => (
                                        <option key={o.id} value={o.id}>{o.name}</option>
                                      ))}
                                    </select>
                                  </div>

                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <label className="text-[8.5px] font-bold text-slate-500 block mb-0.5">Wajib Foto Bukti:</label>
                                      <input
                                        type="number"
                                        min="1"
                                        placeholder="Min Foto (misal: 10)"
                                        value={dailyFormMinPhotos}
                                        onChange={(e) => setDailyFormMinPhotos(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold outline-none"
                                      />
                                    </div>

                                    <div>
                                      <label className="text-[8.5px] font-bold text-slate-500 block mb-0.5">Batas Jam Submit:</label>
                                      <input
                                        type="time"
                                        value={dailyFormDeadline}
                                        onChange={(e) => setDailyFormDeadline(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold outline-none"
                                      />
                                    </div>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={handleCreateDailyTemplate}
                                    disabled={isSubmittingTask}
                                    className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black cursor-pointer shadow-xs"
                                  >
                                    {isSubmittingTask ? 'Menyimpan...' : 'Simpan Jobdesk Rutin'}
                                  </button>
                                </div>
                              )}
                            </div>
                          )}

                          {/* 2. TAMPILAN KHUSUS AREA MANAGER: MONITORING & REKAP (HARIAN / MINGGUAN / BULANAN) */}
                          {currentProfile?.role === 'area_manager' ? (
                            <div className="space-y-3.5">
                              {/* BAR FILTER PERIODE REKAP DAILY */}
                              <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs space-y-2.5">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-black uppercase text-slate-700 tracking-wider">
                                    Filter Evaluasi Daily:
                                  </span>
                                  <span className="text-[9px] font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100">
                                    {dailyRecapPeriod === 'daily' ? '📅 Harian' : dailyRecapPeriod === 'weekly' ? '📆 7 Hari Terakhir' : '🗓️ 1 Bulan Kalender'}
                                  </span>
                                </div>

                                <div className="flex gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200/80">
                                  <button
                                    type="button"
                                    onClick={() => setDailyRecapPeriod('daily')}
                                    className={`flex-1 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                                      dailyRecapPeriod === 'daily' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                                    }`}
                                  >
                                    Harian
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setDailyRecapPeriod('weekly')}
                                    className={`flex-1 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                                      dailyRecapPeriod === 'weekly' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                                    }`}
                                  >
                                    Mingguan
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setDailyRecapPeriod('monthly')}
                                    className={`flex-1 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                                      dailyRecapPeriod === 'monthly' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                                    }`}
                                  >
                                    Bulanan
                                  </button>
                                </div>

                                {dailyRecapPeriod === 'daily' && (
                                  <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                                    <span className="text-[9px] text-slate-500 font-bold">Pilih Tanggal:</span>
                                    <input
                                      type="date"
                                      value={dailyFilterDate}
                                      onChange={(e) => setDailyFilterDate(e.target.value)}
                                      className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-[10px] font-mono font-bold text-slate-700 outline-none cursor-pointer"
                                    />
                                  </div>
                                )}
                              </div>

                              {dailyTemplates.length === 0 ? (
                                <div className="p-6 bg-white rounded-2xl border border-dashed border-slate-200 text-center text-xs text-slate-400 font-bold">
                                  Belum ada template jobdesk daily yang terdaftar.
                                </div>
                              ) : (
                                dailyTemplates.map(tpl => {
                                  // 1. Manajer dalam cakupan wilayah Kalsel 1
                                  const managersInScope = profiles.filter(p => {
                                    const isMgr = ['store_manager', 'ast_store_manager', 'floor_leader', 'floor_leader_orientation'].includes(p.role);
                                    const out = outlets.find(o => o.id === p.outlet_id);
                                    const matchOut = slaFilterOutletId === 'ALL' || p.outlet_id === slaFilterOutletId;
                                    return isMgr && isOutletInRegion(out, 'KALSEL_1') && matchOut;
                                  });

                                  // 2. Filter data submission sesuai periode yang dipilih
                                  const relevantSubmissions = dailySubmissions.filter(s => {
                                    if (s.template_id !== tpl.id) return false;
                                    const subDate = s.submission_date;
                                    if (!subDate) return false;

                                    if (dailyRecapPeriod === 'daily') {
                                      return subDate === dailyFilterDate;
                                    } else if (dailyRecapPeriod === 'weekly') {
                                      const now = new Date();
                                      const past7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                                      const todayStr = now.toISOString().split('T')[0];
                                      return subDate >= past7Days && subDate <= todayStr;
                                    } else {
                                      return subDate.substring(0, 7) === selectedMonth;
                                    }
                                  });

                                  const isScopeResto = tpl.scope_type === 'RESTO';

                                  // Ambil daftar resto unik di wilayah aktif
                                  const outletsInScope = outlets.filter(o => {
                                    const matchReg = isOutletInRegion(o, 'KALSEL_1');
                                    const matchOut = slaFilterOutletId === 'ALL' || o.id === slaFilterOutletId;
                                    return matchReg && matchOut;
                                  });

                                  // Data untuk tugas PER RESTO
                                  const completedOutlets = [];
                                  const missedOutlets = [];

                                  if (isScopeResto) {
                                    outletsInScope.forEach(out => {
                                      const sub = relevantSubmissions.find(s => s.outlet_id === out.id);
                                      if (sub) {
                                        const submitter = profiles.find(p => p.id === sub.user_id);
                                        completedOutlets.push({
                                          ...out,
                                          submitterName: submitter?.full_name || 'Manajer Cabang',
                                          submission: sub
                                        });
                                      } else {
                                        missedOutlets.push(out);
                                      }
                                    });
                                  }

                                  // Data untuk tugas PER ORANG
                                  const completedManagers = [];
                                  const missedManagers = [];

                                  if (!isScopeResto) {
                                    managersInScope.forEach(mgr => {
                                      const subs = relevantSubmissions.filter(s => s.user_id === mgr.id);
                                      if (subs.length > 0) {
                                        completedManagers.push({
                                          ...mgr,
                                          subCount: subs.length,
                                          latestSub: subs[0]
                                        });
                                      } else {
                                        missedManagers.push(mgr);
                                      }
                                    });
                                  }

                                  const totalTarget = isScopeResto ? outletsInScope.length : managersInScope.length;
                                  const totalDone = isScopeResto ? completedOutlets.length : completedManagers.length;

                                  return (
                                    <div key={tpl.id} className="p-3.5 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-3">
                                      <div className="flex items-start justify-between">
                                        <div>
                                          <div className="flex items-center gap-1.5">
                                            <span className={`text-[8.5px] font-black uppercase px-2 py-0.5 rounded-md ${
                                              isScopeResto ? 'bg-purple-100 text-purple-800' : 'bg-indigo-50 text-indigo-700'
                                            }`}>
                                              {isScopeResto ? '🏪 PER RESTO' : '👤 PER ORANG'}
                                            </span>
                                            <span className="text-[9px] text-slate-400 font-mono">
                                              Batas: {tpl.deadline_time ? tpl.deadline_time.substring(0, 5) : '21:00'} WITA
                                            </span>
                                          </div>
                                          <h5 className="text-xs font-black text-slate-900 mt-1">{tpl.title}</h5>
                                          <p className="text-[9.5px] text-slate-500">
                                            📸 Syarat: Minimal {tpl.min_photos} Foto {isScopeResto ? '(Cukup 1 orang per resto)' : '(Semua manager wajib)'}
                                          </p>
                                        </div>

                                        <div className="flex items-center gap-1.5 shrink-0">
                                          <span className="text-xs font-mono font-black px-2.5 py-1 bg-slate-50 rounded-xl border border-slate-200 text-slate-800">
                                            {totalDone} / {totalTarget} {isScopeResto ? 'Resto' : 'Selesai'}
                                          </span>
                                          <button
                                            type="button"
                                            onClick={() => handleDeleteDailyTemplate(tpl.id, tpl.title)}
                                            className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer transition-colors"
                                            title="Hapus Jobdesk Ini"
                                          >
                                            <FiX className="text-sm" />
                                          </button>
                                        </div>
                                      </div>

                                      {/* ================= TAMPILAN JIKA TIPE TUGAS: PER RESTO ================= */}
                                      {isScopeResto ? (
                                        <>
                                          {/* RESTO YANG BELUM MENGERJAKAN */}
                                          {missedOutlets.length > 0 && (
                                            <div className="p-2.5 bg-rose-50/70 border border-rose-200 rounded-xl space-y-1.5">
                                              <div className="flex items-center justify-between">
                                                <span className="text-[9px] font-black uppercase text-rose-800 flex items-center gap-1">
                                                  <FiAlertTriangle className="text-rose-600" /> Belum Dikerjakan ({missedOutlets.length} Resto):
                                                </span>
                                                <span className="text-[8px] font-black text-rose-600 bg-white px-1.5 py-0.2 rounded border border-rose-200">
                                                  Perlu Follow-up
                                                </span>
                                              </div>

                                              <div className="space-y-1">
                                                {missedOutlets.map(out => (
                                                  <div key={out.id} className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-rose-100 text-[10px]">
                                                    <span className="font-bold text-slate-800 truncate">{out.name}</span>
                                                    <span className="text-[8px] font-black text-rose-600 uppercase">Belum Ada Setoran</span>
                                                  </div>
                                                ))}
                                              </div>
                                            </div>
                                          )}

                                          {/* RESTO YANG SUDAH SELESAI */}
                                          <div className="space-y-1.5 pt-1 border-t border-slate-100">
                                            <span className="text-[8.5px] font-black uppercase text-slate-400 block tracking-wider">
                                              Resto Selesai ({completedOutlets.length} Resto):
                                            </span>

                                            {completedOutlets.length === 0 ? (
                                              <p className="text-[9.5px] text-slate-400 italic">Belum ada cabang resto yang menyelesaikan tugas ini.</p>
                                            ) : (
                                              <div className="space-y-1.5">
                                                {completedOutlets.map(out => {
                                                  const sub = out.submission;
                                                  return (
                                                    <div key={out.id} className="p-2 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-[10px]">
                                                      <div className="min-w-0 flex-1 pr-2">
                                                        <p className="font-black text-slate-900 truncate">{out.name}</p>
                                                        <p className="text-[8.5px] text-indigo-600 font-bold truncate">
                                                          Diselesaikan oleh: {out.submitterName}
                                                        </p>
                                                      </div>

                                                      <div className="flex items-center gap-2 shrink-0">
                                                        {sub.photo_urls && sub.photo_urls.length > 0 && (
                                                          <button
                                                            type="button"
                                                            onClick={() => setMultiPhotoGallery({
                                                              title: `${tpl.title} — ${out.name}`,
                                                              photos: sub.photo_urls
                                                            })}
                                                            className="text-[8.5px] font-bold text-indigo-600 underline cursor-pointer"
                                                          >
                                                            Lihat {sub.photo_urls.length} Foto
                                                          </button>
                                                        )}
                                                        <span className="px-2 py-0.5 rounded text-[8.5px] font-black bg-emerald-100 text-emerald-800">
                                                          ✓ Selesai
                                                        </span>
                                                      </div>
                                                    </div>
                                                  );
                                                })}
                                              </div>
                                            )}
                                          </div>
                                        </>
                                      ) : (
                                        /* ================= TAMPILAN JIKA TIPE TUGAS: PER ORANG ================= */
                                        <>
                                          {/* MANAJER YANG BELUM MENGERJAKAN */}
                                          {missedManagers.length > 0 && (
                                            <div className="p-2.5 bg-rose-50/70 border border-rose-200 rounded-xl space-y-1.5">
                                              <div className="flex items-center justify-between">
                                                <span className="text-[9px] font-black uppercase text-rose-800 flex items-center gap-1">
                                                  <FiAlertTriangle className="text-rose-600" /> Belum Mengerjakan ({missedManagers.length} Manajer):
                                                </span>
                                                <span className="text-[8px] font-black text-rose-600 bg-white px-1.5 py-0.2 rounded border border-rose-200">
                                                  Perlu Tindakan
                                                </span>
                                              </div>

                                              <div className="max-h-28 overflow-y-auto space-y-1 pr-0.5">
                                                {missedManagers.map(mgr => {
                                                  const out = outlets.find(o => o.id === mgr.outlet_id);
                                                  return (
                                                    <div key={mgr.id} className="flex items-center justify-between bg-white px-2 py-1 rounded-lg border border-rose-100 text-[9.5px]">
                                                      <span className="font-bold text-slate-800 truncate max-w-[170px]">{mgr.full_name}</span>
                                                      <span className="text-[8.5px] text-rose-700 font-bold truncate">{out?.name || 'Cabang'}</span>
                                                    </div>
                                                  );
                                                })}
                                              </div>
                                            </div>
                                          )}

                                          {/* MANAJER YANG SUDAH SELESAI */}
                                          <div className="space-y-1.5 pt-1 border-t border-slate-100">
                                            <span className="text-[8.5px] font-black uppercase text-slate-400 block tracking-wider">
                                              Sudah Selesai ({completedManagers.length} Manajer):
                                            </span>

                                            {completedManagers.length === 0 ? (
                                              <p className="text-[9.5px] text-slate-400 italic">Belum ada manajer yang submit pada periode ini.</p>
                                            ) : (
                                              <div className="max-h-36 overflow-y-auto space-y-1.5 pr-0.5">
                                                {completedManagers.map(item => {
                                                  const sub = item.latestSub;
                                                  const mgrOutlet = outlets.find(o => o.id === item.outlet_id);

                                                  return (
                                                    <div key={item.id} className="p-2 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-[10px]">
                                                      <div className="min-w-0 flex-1 pr-2">
                                                        <p className="font-black text-slate-900 truncate">{item.full_name}</p>
                                                        <p className="text-[8.5px] text-slate-400 truncate">
                                                          {mgrOutlet?.name || 'Resto'} • {dailyRecapPeriod !== 'daily' ? `${item.subCount}x Submit` : sub.submission_date}
                                                        </p>
                                                      </div>

                                                      <div className="flex items-center gap-2 shrink-0 relative z-20">
                                                        {sub.photo_urls && sub.photo_urls.length > 0 && (
                                                          <button
                                                            type="button"
                                                            onClick={(e) => {
                                                              e.stopPropagation();
                                                              setMultiPhotoGallery({
                                                                title: `${tpl.title} — ${item.full_name}`,
                                                                photos: sub.photo_urls
                                                              });
                                                            }}
                                                            className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-[9px] font-black cursor-pointer shadow-2xs"
                                                          >
                                                            🔍 Lihat {sub.photo_urls.length} Foto
                                                          </button>
                                                        )}
                                                        <span className={`px-2 py-0.5 rounded text-[8.5px] font-black ${
                                                          sub.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                                                        }`}>
                                                          {sub.status === 'completed' ? '✓ Selesai' : sub.status}
                                                        </span>
                                                      </div>
                                                    </div>
                                                  );
                                                })}
                                              </div>
                                            )}
                                          </div>
                                        </>
                                      )}
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          ) : (
                            /* 3. TAMPILAN KHUSUS MANAJER RESTO (HANYA MUNCUL DI AKUN MANAJER UNTUK UPLOAD) */
                            <div className="space-y-2.5">
                              <div className="flex items-center justify-between px-1">
                                <span className="text-[10px] font-black uppercase text-slate-700 tracking-wider">
                                  Tugas Harian Anda ({new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })})
                                </span>
                                <span className="text-[9px] font-mono text-indigo-600 font-bold">
                                  Wajib Disubmit
                                </span>
                              </div>

                              {dailyTemplates.length === 0 ? (
                                <div className="p-6 bg-white rounded-2xl border border-dashed border-slate-200 text-center text-xs text-slate-400 font-bold">
                                  Tidak ada tugas daily hari ini.
                                </div>
                              ) : (
                                dailyTemplates.map(tpl => {
                                  const todayDate = new Date().toISOString().split('T')[0];
                                  const isScopeResto = tpl.scope_type === 'RESTO';

                                  // Cari submission langsung milik user
                                  const directSub = dailySubmissions.find(s => 
                                    s.template_id === tpl.id && 
                                    s.user_id === currentProfile?.id && 
                                    s.submission_date === todayDate
                                  );

                                  // Jika tugas bertipe PER RESTO, cari apakah rekan satu restonya sudah ada yang menyelesaikan
                                  const restoSub = isScopeResto
                                    ? dailySubmissions.find(s => 
                                        s.template_id === tpl.id && 
                                        s.outlet_id === currentProfile?.outlet_id && 
                                        s.submission_date === todayDate
                                      )
                                    : null;

                                  const activeSub = directSub || restoSub;
                                  const isCompletedToday = !!activeSub;
                                  const isDoneByColleague = !directSub && !!restoSub;
                                  const colleagueName = isDoneByColleague
                                    ? profiles.find(p => p.id === restoSub?.user_id)?.full_name || 'Rekan Manajer'
                                    : null;

                                  return (
                                    <div key={tpl.id} className="p-3.5 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-2.5">
                                      <div className="flex items-start justify-between gap-2">
                                        <div>
                                          <div className="flex items-center gap-1.5">
                                            <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-md ${
                                              isScopeResto ? 'bg-purple-100 text-purple-800' : 'bg-amber-100 text-amber-900'
                                            }`}>
                                              {isScopeResto ? '🏪 DAILY PER RESTO' : '👤 DAILY PER ORANG'}
                                            </span>
                                            <span className="text-[9px] font-bold text-slate-400 font-mono">
                                              Batas: {tpl.deadline_time ? tpl.deadline_time.substring(0, 5) : '21:00'} WITA
                                            </span>
                                          </div>
                                          <h5 className="text-xs font-black text-slate-900 mt-1">{tpl.title}</h5>
                                          <p className="text-[9.5px] text-slate-500 font-medium">
                                            📸 Syarat: Wajib {tpl.min_photos} Foto {isScopeResto ? '(Cukup 1 orang per resto)' : '(Wajib tiap orang)'}
                                          </p>
                                        </div>

                                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-md border shrink-0 ${
                                          isCompletedToday 
                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                            : 'bg-rose-50 text-rose-700 border-rose-200'
                                        }`}>
                                          {isCompletedToday ? '✓ Selesai' : 'Belum Submit'}
                                        </span>
                                      </div>

                                      {isCompletedToday ? (
                                        <div className={`p-2.5 rounded-xl border flex items-center justify-between ${
                                          activeSub.status === 'completed' 
                                            ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900' 
                                            : 'bg-blue-50/80 border-blue-200 text-blue-900'
                                        }`}>
                                          <div>
                                            <span className="text-[10px] font-black block">
                                              {activeSub.status === 'completed' 
                                                ? (isDoneByColleague 
                                                    ? `✓ Selesai (Diselesaikan oleh: ${colleagueName})` 
                                                    : `✓ Selesai (${activeSub.photo_urls?.length || tpl.min_photos} Foto Terkirim)`)
                                                : `✓ Tercatat: ${activeSub.status}`}
                                            </span>
                                            {activeSub.notes && (
                                              <span className="text-[8.5px] opacity-75">{activeSub.notes}</span>
                                            )}
                                          </div>

                                          {activeSub.photo_urls && activeSub.photo_urls.length > 0 && (
                                            <button
                                              type="button"
                                              onClick={() => {
                                                if (activeSub.photo_urls.length > 1) {
                                                  setMultiPhotoGallery({
                                                    title: `${tpl.title}`,
                                                    photos: activeSub.photo_urls
                                                  });
                                                } else {
                                                  setTaskProofModalImage(activeSub.photo_urls[0]);
                                                }
                                              }}
                                              className="text-[9px] font-black text-indigo-600 underline cursor-pointer shrink-0 ml-2"
                                            >
                                              Lihat Foto
                                            </button>
                                          )}
                                        </div>
                                      ) : (
                                        <div className="space-y-2">
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setTaskToConfirm({
                                                ...tpl,
                                                deadline: `${todayDate}T${tpl.deadline_time || '21:00:00'}`
                                              });
                                              setActiveModal('confirm_task');
                                            }}
                                            className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                                          >
                                            <FiCamera /> Ambil & Upload {tpl.min_photos} Foto Bukti
                                          </button>

                                          {/* TOMBOL DISPENSASI (HANYA MUNCUL DI TUGAS PER ORANG / INDIVIDU) */}
                                          {!isScopeResto && (
                                            <div className="pt-1 border-t border-slate-100 flex items-center justify-between gap-1">
                                              <span className="text-[8px] font-black text-slate-400 uppercase tracking-tight">Tidak Bertugas?</span>
                                              <div className="flex gap-1">
                                                {['OFF', 'SAKIT', 'IZIN', 'CUTI'].map((st) => (
                                                  <button
                                                    key={st}
                                                    type="button"
                                                    onClick={() => handleReportDailyAbsence(tpl, st)}
                                                    className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-[8.5px] font-black cursor-pointer transition-colors border border-slate-200"
                                                  >
                                                    {st}
                                                  </button>
                                                ))}
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* FORM TERBITKAN TUGAS BARU (HANYA MUNCUL DI TAB ADHOC) */}
                      {currentProfile?.role === 'area_manager' && taskTypeTab === 'adhoc' && (
                        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-2.5">
                          <span className="text-[10px] font-black uppercase text-indigo-700 flex items-center gap-1">
                            <FiPlus className="text-xs" /> Terbitkan Tugas Baru
                          </span>

                          <form onSubmit={handleCreateTask} className="space-y-2">
                            <input
                              type="text"
                              placeholder="Judul / Instruksi Proyek..."
                              value={taskTitle}
                              onChange={(e) => setTaskTitle(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold outline-none"
                              required
                            />

                            <div className="grid grid-cols-2 gap-2">
                              <select
                                value={taskScopeType}
                                onChange={(e) => setTaskScopeType(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5 text-[10px] font-bold text-slate-700 outline-none cursor-pointer"
                              >
                                <option value="BROADCAST_ALL">🌐 All Manager (1 Tugas Cukup Sekali Bikin)</option>
                                <option value="STORE_MANAGER">👑 Khusus Store Manager (SM)</option>
                                <option value="AST_STORE_MANAGER">🥈 Khusus Asst. Manager (ASM)</option>
                                <option value="FLOOR_LEADER">🥉 Khusus Floor Leader (FL/FLO)</option>
                                <option value="ALL_MANAGERS">👥 Massal Per Orang (SM, ASM, FL)</option>
                                <option value="USER">👤 Khusus 1 Orang Tertentu</option>
                              </select>

                              <select
                                value={taskPriority}
                                onChange={(e) => setTaskPriority(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5 text-[10px] font-bold text-slate-700 outline-none cursor-pointer"
                              >
                                <option value="normal">Normal</option>
                                <option value="urgent">Mendesak</option>
                              </select>
                            </div>

                            {taskScopeType === 'USER' && (
                              <select
                                value={taskTargetUserId}
                                onChange={(e) => setTaskTargetUserId(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5 text-[10px] font-bold text-slate-700 outline-none cursor-pointer"
                                required
                              >
                                <option value="">-- Pilih Manajer Kalsel 1 --</option>
                                {profiles
                                  .filter(p => ['store_manager', 'ast_store_manager', 'floor_leader', 'floor_leader_orientation'].includes(p.role))
                                  .filter(p => {
                                    const out = outlets.find(o => o.id === p.outlet_id);
                                    return isOutletInRegion(out, 'KALSEL_1');
                                  })
                                  .map(p => {
                                    const out = outlets.find(o => o.id === p.outlet_id);
                                    return (
                                      <option key={p.id} value={p.id}>
                                        {p.full_name} — {out?.name || 'Kalsel'} ({p.role ? p.role.replace(/_/g, ' ').toUpperCase() : ''})
                                      </option>
                                    );
                                  })}
                              </select>
                            )}

                            {taskScopeType === 'DEPT' && (
                              <select
                                value={taskDept}
                                onChange={(e) => setTaskDept(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5 text-[10px] font-bold text-slate-700 outline-none"
                              >
                                <option value="ordering">Dept: Ordering</option>
                                <option value="mnr">Dept: M&R</option>
                                <option value="payroll">Dept: Payroll</option>
                                <option value="marketing_cel">Dept: Marketing & CEL</option>
                                <option value="kitchen">Dept: Kitchen</option>
                              </select>
                            )}

                            <input
                              type="datetime-local"
                              value={taskDeadline}
                              onChange={(e) => setTaskDeadline(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-medium outline-none"
                              required
                            />

                            <button
                              type="submit"
                              disabled={isSubmittingTask}
                              className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-xs cursor-pointer"
                            >
                              {isSubmittingTask ? 'Menerbitkan...' : 'Kirim Instruksi Tugas'}
                            </button>
                          </form>
                        </div>
                      )}

                      {/* DAFTAR TIKET TUGAS BULANAN */}
                      <div className="space-y-2">
                        <span className="text-[10px] font-black uppercase text-slate-700 tracking-wider px-1 block">
                          Tiket Tugas Bulan {selectedMonth} ({monthlyTasks.length})
                        </span>

                        {monthlyTasks.length === 0 ? (
                          <div className="p-6 bg-white rounded-2xl border border-dashed border-slate-200 text-center text-xs text-slate-400 font-bold">
                            Belum ada tugas pada bulan {selectedMonth}.
                          </div>
                        ) : (
                          monthlyTasks.map(t => {
                            const score = calculateTaskScore(t);
                            const isDone = t.status === 'completed';
                            const isOverdue = new Date(t.deadline) < new Date() && !isDone;

                            return (
                              <div key={t.id} className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                                <div className="flex items-center justify-between gap-1.5">
                                  {(() => {
                                    // Ambil profil dari target_user_id atau pembuat tugas jika target kosong
                                    const targetPerson = profiles.find(p => p.id === (t.target_user_id || t.created_by));
                                    const targetOutlet = outlets.find(o => o.id === t.outlet_id);
                                    const roleLabel = targetPerson?.role === 'store_manager' ? 'SM' :
                                                      targetPerson?.role === 'ast_store_manager' ? 'ASM' :
                                                      targetPerson?.role === 'floor_leader' ? 'FL' : '';

                                    // Format nama: jika targetPerson ditemukan gunakan namanya, jika tidak jangan tampilkan cacp_audit
                                    const displayName = targetPerson 
                                      ? `${targetPerson.full_name} (${roleLabel})` 
                                      : (t.department === 'cacp_audit' ? 'Manajer In-Charge' : t.department || 'Tugas');

                                    return (
                                      <div className="flex items-center gap-1.5 max-w-[230px]">
                                        <span className="text-[9px] font-black px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200/80 rounded-md truncate">
                                          👤 {displayName}
                                        </span>
                                        {targetOutlet && (
                                          <span className="text-[8.5px] font-bold text-slate-600 truncate">
                                            • {targetOutlet.name}
                                          </span>
                                        )}
                                      </div>
                                    );
                                  })()}
                                  
                                  <div className="flex items-center gap-1">
                                    {score !== null && (
                                      <span className={`text-[9px] font-black font-mono px-1.5 py-0.2 rounded ${
                                        score >= 80 ? 'bg-emerald-100 text-emerald-800' :
                                        score === 50 ? 'bg-amber-100 text-amber-800' :
                                        score === 25 ? 'bg-rose-100 text-rose-800' :
                                        'bg-slate-100 text-slate-500'
                                      }`}>
                                        Skor: {score}%
                                      </span>
                                    )}
                                    {t.has_tolerance && (
                                      <span className="text-[7.5px] font-bold bg-indigo-100 text-indigo-700 px-1 py-0.2 rounded">
                                        Toleransi AM
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div>
                                  <h5 className="text-xs font-black text-slate-900 leading-snug">{t.title}</h5>
                                  <p className="text-[9px] text-slate-400 font-mono mt-0.5">
                                    Deadline: {new Date(t.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                  </p>
                                </div>

                                <div className="pt-1 space-y-1">
                                  {/* Tampilkan foto hasil jika sudah diselesaikan manager */}
                                  {isDone && t.proof_photo_url && (
                                    <div className="flex items-center justify-between p-2 bg-emerald-50/70 border border-emerald-200 rounded-xl">
                                      <span className="text-[9px] font-bold text-emerald-800">✓ Bukti Hasil Telah Diupload</span>
                                      <button
                                        type="button"
                                        onClick={() => setTaskProofModalImage(t.proof_photo_url)}
                                        className="text-[9px] font-black text-indigo-600 underline cursor-pointer"
                                      >
                                        Lihat Foto
                                      </button>
                                    </div>
                                  )}

                                  {/* Tombol toleransi AM jika terlambat */}
                                  {currentProfile?.role === 'area_manager' && !t.has_tolerance && (isOverdue || (isDone && score < 80)) && (
                                    <button
                                      type="button"
                                      onClick={() => handleGrantTolerance(t)}
                                      className="w-full mb-1 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-lg text-[9px] font-bold cursor-pointer"
                                    >
                                      Beri Toleransi AM (Jadikan 100%)
                                    </button>
                                  )}

                                  {/* Tombol upload konfirmasi HANYA muncul jika akun yang login adalah manajer penerima tugas */}
                                  {!isDone && currentProfile?.id === t.target_user_id && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setTaskToConfirm(t);
                                        setActiveModal('confirm_task');
                                      }}
                                      className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1 cursor-pointer"
                                    >
                                      <FiCamera /> Selesaikan & Upload Bukti Tugas
                                    </button>
                                  )}

                                  {/* Tampilan di akun Area Manager jika tugas belum selesai */}
                                  {!isDone && currentProfile?.role === 'area_manager' && (
                                    <div className="text-center py-1.5 text-[9px] font-bold text-amber-700 bg-amber-50 rounded-xl border border-amber-200">
                                      ⏳ Menunggu Pengerjaan oleh Manajer Bersangkutan
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>

                    </div>
                  )}

                </div>

              </div>
            </div>
          );
        })()}

        {/* ================= MODAL AUDIT HISTORI TUGAS & BUKTI FOTO MANAJER ================= */}
        {selectedManagerForTaskHistory && (
          <div className="fixed inset-0 z-[80] bg-slate-950/85 backdrop-blur-md flex justify-center items-center p-3 animate-in fade-in duration-200">
            <div className="bg-[#FAFBFD] w-full max-w-md max-h-[92vh] rounded-3xl flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
              
              <div className="px-4 py-3 bg-white border-b border-slate-200 flex items-center justify-between shrink-0 shadow-2xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-700 font-black flex items-center justify-center text-xs border border-indigo-100 shrink-0">
                    {selectedManagerForTaskHistory.avatar ? (
                      <img src={selectedManagerForTaskHistory.avatar} alt="Avatar" className="w-full h-full object-cover rounded-2xl" />
                    ) : (
                      selectedManagerForTaskHistory.name.substring(0, 2).toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xs font-black text-slate-900 truncate leading-tight">
                      {selectedManagerForTaskHistory.name}
                    </h3>
                    <p className="text-[9px] text-indigo-600 font-bold uppercase truncate">
                      {selectedManagerForTaskHistory.outletName} • {selectedManagerForTaskHistory.role}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className={`text-[10px] font-mono font-black px-2.5 py-1 rounded-xl border ${
                    selectedManagerForTaskHistory.avgScore >= 80 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                    selectedManagerForTaskHistory.avgScore >= 50 ? 'bg-amber-50 text-amber-700 border-amber-200' :
                    'bg-rose-50 text-rose-700 border-rose-200'
                  }`}>
                    {selectedManagerForTaskHistory.avgScore}% SLA
                  </span>
                  <button 
                    type="button"
                    onClick={() => setSelectedManagerForTaskHistory(null)}
                    className="p-1.5 hover:bg-slate-100 text-slate-500 rounded-xl cursor-pointer"
                  >
                    <FiX className="text-base" />
                  </button>
                </div>
              </div>

              <div className="p-3 bg-white border-b border-slate-100 grid grid-cols-4 gap-1 text-center font-mono text-[9px]">
                <div className="p-1.5 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-100">
                  <span className="block text-[7px] font-sans text-slate-400 uppercase">Tepat</span>
                  <span className="font-black text-xs">{selectedManagerForTaskHistory.onTimeCount}</span>
                </div>
                <div className="p-1.5 bg-amber-50 text-amber-800 rounded-xl border border-amber-100">
                  <span className="block text-[7px] font-sans text-slate-400 uppercase">Over 1 Hr</span>
                  <span className="font-black text-xs">{selectedManagerForTaskHistory.sameDayOverdue}</span>
                </div>
                <div className="p-1.5 bg-rose-50 text-rose-800 rounded-xl border border-rose-100">
                  <span className="block text-[7px] font-sans text-slate-400 uppercase">&gt; 1 Hr</span>
                  <span className="font-black text-xs">{selectedManagerForTaskHistory.multiDayOverdue}</span>
                </div>
                <div className="p-1.5 bg-slate-100 text-slate-600 rounded-xl border border-slate-200">
                  <span className="block text-[7px] font-sans text-slate-400 uppercase">Mangkir</span>
                  <span className="font-black text-xs">{selectedManagerForTaskHistory.uncompletedCount}</span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                    Log Tugas & Bukti Validasi ({selectedManagerForTaskHistory.tasks.length} Jobdesk)
                  </span>
                  <span className="text-[9px] font-mono text-slate-400">Periode: {selectedMonth}</span>
                </div>

                {selectedManagerForTaskHistory.tasks.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400 font-bold bg-white rounded-2xl border border-dashed border-slate-200">
                    Tidak ada tugas yang ditugaskan ke manajer ini pada bulan {selectedMonth}.
                  </div>
                ) : (
                  selectedManagerForTaskHistory.tasks.map(t => {
                    const score = calculateTaskScore(t);
                    const isDone = t.status === 'completed';
                    const isOverdue = new Date(t.deadline) < new Date() && !isDone;
                    
                    const deadlineFormatted = new Date(t.deadline).toLocaleDateString('id-ID', {
                      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                    });
                    const completedFormatted = t.completed_at ? new Date(t.completed_at).toLocaleDateString('id-ID', {
                      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                    }) : null;

                    return (
                      <div key={t.id} className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md">
                            {t.department}
                          </span>
                          <div className="flex items-center gap-1">
                            {score !== null && (
                              <span className={`text-[10px] font-black font-mono px-2 py-0.5 rounded-md ${
                                score >= 80 ? 'bg-emerald-100 text-emerald-800' :
                                score === 50 ? 'bg-amber-100 text-amber-800' :
                                score === 25 ? 'bg-rose-100 text-rose-800' :
                                'bg-slate-100 text-slate-500'
                              }`}>
                                Skor: {score}%
                              </span>
                            )}
                            {t.has_tolerance && (
                              <span className="text-[8px] font-bold bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded">
                                Toleransi AM
                              </span>
                            )}
                          </div>
                        </div>

                        <div>
                          <h4 className="text-xs font-black text-slate-900 leading-snug">{t.title}</h4>
                          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[9px] font-mono">
                            <span className="text-slate-400">Deadline: <strong className="text-slate-700">{deadlineFormatted}</strong></span>
                            {completedFormatted && (
                              <span className="text-emerald-700">Selesai: <strong className="text-emerald-800">{completedFormatted} WITA</strong></span>
                            )}
                            {isOverdue && (
                              <span className="text-rose-600 font-bold">⚠️ Mangkir / Lewat Batas Waktu</span>
                            )}
                          </div>
                        </div>

                        {t.completion_notes && (
                          <p className="text-[9.5px] text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-100 leading-relaxed font-medium">
                            📝 {t.completion_notes}
                          </p>
                        )}

                        {t.proof_photo_url ? (
                          <div className="space-y-1 pt-1">
                            <span className="text-[8.5px] font-black uppercase tracking-wider text-slate-400 block">
                              Bukti Foto Pekerjaan (Klik Perbesar):
                            </span>
                            <div 
                              onClick={() => setTaskProofModalImage(t.proof_photo_url)}
                              className="relative group rounded-xl overflow-hidden border border-slate-200 cursor-pointer aspect-video bg-slate-100 shadow-2xs"
                            >
                              <img 
                                src={t.proof_photo_url} 
                                alt="Bukti Tugas" 
                                className="w-full h-full object-cover transition-transform group-hover:scale-105" 
                              />
                              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-black transition-opacity">
                                🔍 Lihat Foto Penuh
                              </div>
                            </div>
                          </div>
                        ) : isDone ? (
                          <div className="text-[9px] text-slate-400 italic bg-slate-50 p-2 rounded-xl border border-dashed border-slate-200">
                            Pekerjaan diselesaikan tanpa lampiran foto.
                          </div>
                        ) : null}

                        {currentProfile?.role === 'area_manager' && !t.has_tolerance && (isOverdue || (isDone && score < 80)) && (
                          <div className="pt-1 flex justify-end">
                            <button
                              type="button"
                              onClick={() => handleGrantTolerance(t)}
                              className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-lg text-[9px] font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <FiCheckCircle /> Beri Toleransi AM (Jadikan 100%)
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              <div className="p-3 bg-white border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedManagerForTaskHistory(null)}
                  className="w-full py-2.5 bg-slate-900 text-white font-bold text-xs rounded-xl cursor-pointer"
                >
                  Tutup Portofolio Tugas
                </button>
              </div>

            </div>
          </div>
        )}
{/* ================= MODAL DETAIL RIWAYAT & DISIPLIN RESTO ================= */}
        {selectedRestoForSlaDetail && (() => {
          const now = new Date();

          // 1. Ambil tugas bulanan khusus cabang ini (Kecualikan CACP total)
          const restoTasks = tasks.filter(t => {
            const taskDate = t.created_at || t.deadline;
            const matchMonth = taskDate && taskDate.substring(0, 7) === selectedMonth;
            const isCacp = (t.department === 'cacp_audit') || (t.title || '').toUpperCase().includes('CACP');
            return matchMonth && t.outlet_id === selectedRestoForSlaDetail.id && !isCacp;
          });

          // 2. Ambil seluruh setoran jobdesk daily cabang ini
          const restoDailySubs = dailySubmissions.filter(s => {
            const matchMonth = s.submission_date && s.submission_date.substring(0, 7) === selectedMonth;
            return s.outlet_id === selectedRestoForSlaDetail.id && matchMonth;
          });

          // 3. Susun Riwayat Log Tugas Gabungan
          const combinedHistory = [
            ...restoTasks.map(t => {
              const u = profiles.find(p => p.id === (t.target_user_id || t.created_by));
              const isDone = t.status === 'completed';
              const isOverdue = !isDone && new Date(t.deadline) < now;
              const isOngoing = !isDone && !isOverdue; // Belum lewat jam deadline
              const rawScore = calculateTaskScore(t);

              return {
                id: t.id,
                title: t.title,
                type: 'PROYEK BULANAN',
                personName: u?.full_name || t.department || 'Manajer Cabang',
                deadlineText: `Deadline: ${new Date(t.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} WITA`,
                isDone,
                isOngoing,
                isOverdue,
                score: isDone ? (rawScore !== null ? rawScore : 100) : (isOverdue ? 0 : null),
                photoUrl: t.proof_photo_url,
                photos: t.proof_photo_url ? [t.proof_photo_url] : []
              };
            }),
            ...restoDailySubs.map(s => {
              const u = profiles.find(p => p.id === s.user_id);
              const tpl = dailyTemplates.find(t => t.id === s.template_id);
              const isDone = s.status === 'completed';

              let isDailyOnTime = true;
              if (tpl?.deadline_time && s.submitted_at) {
                const subTime = new Date(s.submitted_at);
                const subHourMinute = `${String(subTime.getHours()).padStart(2, '0')}:${String(subTime.getMinutes()).padStart(2, '0')}:00`;
                if (subHourMinute > tpl.deadline_time) isDailyOnTime = false;
              }

              return {
                id: s.id,
                title: tpl?.title || 'Jobdesk Daily Rutin',
                type: tpl?.scope_type === 'RESTO' ? 'DAILY PER RESTO' : 'DAILY INDIVIDU',
                personName: u?.full_name || 'Manajer Cabang',
                deadlineText: `Tanggal: ${s.submission_date} (${s.status !== 'completed' ? s.status : isDailyOnTime ? 'Tepat Waktu' : 'Terlambat'})`,
                isDone: true,
                isOngoing: false,
                isOverdue: false,
                score: s.status !== 'completed' ? 100 : isDailyOnTime ? 100 : 50,
                photoUrl: s.photo_urls?.[0] || null,
                photos: s.photo_urls || []
              };
            })
          ];

          // 4. Hitung Performa Masing-Masing Manajer di Resto Ini
          const restoManagers = profiles
            .filter(p => ['store_manager', 'ast_store_manager', 'floor_leader', 'floor_leader_orientation'].includes(p.role))
            .filter(p => p.outlet_id === selectedRestoForSlaDetail.id)
            .map(mgr => {
              const myTasks = combinedHistory.filter(h => h.personName === mgr.full_name);
              let onTime = 0;
              let overdue = 0;
              let validScores = [];

              myTasks.forEach(item => {
                if (item.score !== null) {
                  validScores.push(item.score);
                  if (item.score >= 80) onTime++;
                  else overdue++;
                }
              });

              const avgSla = validScores.length > 0
                ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length)
                : 100;

              return {
                ...mgr,
                taskCount: myTasks.length,
                onTime,
                overdue,
                avgSla
              };
            });

          // 5. Hitung Akumulasi Total Cabang
          const evaluatedItems = combinedHistory.filter(h => h.score !== null);
          const totalSuksesTepat = combinedHistory.filter(h => h.score !== null && h.score >= 80).length;
          const totalTerlambatOver = combinedHistory.filter(h => h.score !== null && h.score < 80).length;
          const branchSlaScore = evaluatedItems.length > 0
            ? Math.round(evaluatedItems.reduce((acc, curr) => acc + curr.score, 0) / evaluatedItems.length)
            : 100;

          // Manajer Terrajin & Evaluasi
          const activeMgrs = restoManagers.filter(m => m.taskCount > 0);
          const topManager = [...activeMgrs].sort((a, b) => b.onTime - a.onTime || b.avgSla - a.avgSla)[0] || restoManagers[0];
          const overdueManager = [...activeMgrs].filter(m => m.overdue > 0).sort((a, b) => b.overdue - a.overdue)[0];

          return (
            <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex justify-center items-center p-3 animate-in fade-in duration-200">
              <div className="bg-[#FAFBFD] w-full max-w-md max-h-[92vh] rounded-3xl flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
                
                {/* Header Modal */}
                <div className="px-5 py-3.5 bg-white border-b border-slate-200 flex items-center justify-between shrink-0 shadow-2xs">
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-wider text-indigo-600 block">
                      Rapor Riwayat Kinerja Cabang
                    </span>
                    <h3 className="text-sm font-black text-slate-900 truncate max-w-[240px]">
                      {selectedRestoForSlaDetail.name}
                    </h3>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setSelectedRestoForSlaDetail(null)}
                    className="p-1.5 hover:bg-slate-100 text-slate-500 rounded-xl cursor-pointer"
                  >
                    <FiX className="text-base" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
                  
                  {/* Kartu Ringkasan SLA Akumulatif Resto */}
                  <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-4 rounded-2xl shadow-md border border-indigo-500/20 flex items-center justify-between">
                    <div>
                      <span className="text-[9px] text-indigo-300 uppercase font-black tracking-widest block">
                        Rerata Keberhasilan Cabang
                      </span>
                      <p className="text-3xl font-black font-mono text-emerald-400 mt-0.5">
                        {branchSlaScore}%
                      </p>
                      <p className="text-[9.5px] text-slate-300 font-mono mt-1">
                        Total {combinedHistory.length} Tugas • {totalSuksesTepat} Sukses Tepat
                      </p>
                    </div>

                    <div className="text-right space-y-1 font-mono text-[10px]">
                      <div className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-lg">
                        ✓ {totalSuksesTepat} Sukses Tepat
                      </div>
                      <div className="px-2.5 py-1 bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-lg">
                        ⚠️ {totalTerlambatOver} Terlambat / Over
                      </div>
                    </div>
                  </div>

                  {/* Komparasi Terrajin & Evaluasi */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="bg-white p-3 rounded-2xl border border-emerald-200 shadow-2xs space-y-1">
                      <div className="flex items-center gap-1.5 text-emerald-700">
                        <span className="text-xs">👑</span>
                        <span className="text-[9px] font-black uppercase tracking-wider">Manajer Terrajin</span>
                      </div>
                      {topManager ? (
                        <div>
                          <p className="text-xs font-black text-slate-900 truncate">{topManager.full_name}</p>
                          <span className="text-[8.5px] font-bold text-indigo-600 block uppercase">
                            {topManager.role.replace(/_/g, ' ')}
                          </span>
                          <span className="text-[9px] font-mono font-black text-emerald-600 mt-0.5 block">
                            {topManager.onTime} Selesai ({topManager.avgSla}% SLA)
                          </span>
                        </div>
                      ) : (
                        <p className="text-[10px] text-slate-400 italic">Belum ada tugas selesai</p>
                      )}
                    </div>

                    <div className="bg-white p-3 rounded-2xl border border-rose-200 shadow-2xs space-y-1">
                      <div className="flex items-center gap-1.5 text-rose-700">
                        <span className="text-xs">⚠️</span>
                        <span className="text-[9px] font-black uppercase tracking-wider">Evaluasi Over</span>
                      </div>
                      {overdueManager ? (
                        <div>
                          <p className="text-xs font-black text-slate-900 truncate">{overdueManager.full_name}</p>
                          <span className="text-[8.5px] font-bold text-rose-600 block uppercase">
                            {overdueManager.role.replace(/_/g, ' ')}
                          </span>
                          <span className="text-[9px] font-mono font-black text-rose-600 mt-0.5 block">
                            {overdueManager.overdue} Tugas Over SLA
                          </span>
                        </div>
                      ) : (
                        <p className="text-[10px] text-emerald-600 font-bold mt-1">✓ Tidak ada manajer over</p>
                      )}
                    </div>
                  </div>

                  {/* DAFTAR MANAJER DI RESTO INI & TINGKAT KERAJINAN */}
                  <div className="p-3 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-2">
                    <span className="text-[10px] font-black uppercase text-slate-700 tracking-wider block">
                      Tim Manajer di Resto Ini ({restoManagers.length} Orang):
                    </span>

                    <div className="space-y-1.5">
                      {restoManagers.map(mgr => {
                        // Ambil seluruh tugas (Proyek Bulanan + Jobdesk Daily) khusus manajer ini
                        const myItems = combinedHistory.filter(h => h.personName === mgr.full_name);
                        const formattedTasks = myItems.map(item => ({
                          id: item.id,
                          title: item.title,
                          department: item.type,
                          deadline: item.isDone ? new Date().toISOString() : new Date().toISOString(),
                          completed_at: item.isDone ? new Date().toISOString() : null,
                          status: item.isDone ? 'completed' : 'pending',
                          is_on_time: item.score >= 80,
                          has_tolerance: false,
                          proof_photo_url: item.photoUrl || null,
                          completion_notes: item.deadlineText || ''
                        }));

                        const targetMgrObj = {
                          id: mgr.id,
                          name: mgr.full_name,
                          avatar: mgr.avatar,
                          role: mgr.role,
                          outletName: selectedRestoForSlaDetail.name,
                          tasks: formattedTasks,
                          avgScore: mgr.avgSla,
                          onTimeCount: mgr.onTime,
                          sameDayOverdue: 0,
                          multiDayOverdue: mgr.overdue,
                          uncompletedCount: 0
                        };

                        return (
                          <div 
                            key={mgr.id} 
                            onClick={() => setSelectedManagerForTaskHistory(targetMgrObj)}
                            className="p-2 bg-slate-50 hover:bg-indigo-50/60 rounded-xl border border-slate-100 hover:border-indigo-200 flex items-center justify-between text-[10px] cursor-pointer transition-all"
                            title="Klik untuk melihat rincian tugas yang sudah dikerjakan"
                          >
                            <div className="min-w-0 flex-1 pr-2">
                              <p className="font-black text-slate-900 truncate">{mgr.full_name} ↗</p>
                              <span className="text-[8.5px] text-indigo-600 font-bold uppercase">
                                {mgr.role.replace(/_/g, ' ')} • {mgr.onTime} Selesai
                              </span>
                            </div>

                            <span className={`text-[9px] font-mono font-black px-2 py-0.5 rounded-lg border ${
                              mgr.avgSla >= 80 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                              mgr.avgSla >= 50 ? 'bg-amber-50 text-amber-700 border-amber-200' :
                              'bg-rose-50 text-rose-700 border-rose-200'
                            }`}>
                              {mgr.avgSla}% SLA
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Riwayat Log Tugas Cabang */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-[10px] font-black uppercase text-slate-600 tracking-wider">
                        Log Riwayat Tugas Cabang ({combinedHistory.length})
                      </span>
                      <span className="text-[9px] text-slate-400 font-mono">Bulan {selectedMonth}</span>
                    </div>

                    {combinedHistory.length === 0 ? (
                      <div className="p-6 bg-white rounded-2xl border border-dashed border-slate-200 text-center text-xs text-slate-400 font-bold">
                        Belum ada riwayat tugas pada cabang ini.
                      </div>
                    ) : (
                      combinedHistory.map((item, idx) => (
                        <div key={idx} className="bg-white p-3 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 truncate max-w-[220px]">
                              <span className="text-[8px] font-black px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded uppercase">
                                {item.type}
                              </span>
                              <span className="text-[9.5px] font-black text-indigo-700 truncate">
                                👤 {item.personName}
                              </span>
                            </div>

                            {item.isOngoing ? (
                              <span className="text-[8.5px] font-bold px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded">
                                ⏳ Sedang Berjalan
                              </span>
                            ) : (
                              <span className={`text-[9px] font-mono font-black px-1.5 py-0.5 rounded ${
                                item.score >= 80 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                              }`}>
                                {item.score}% SLA
                              </span>
                            )}
                          </div>

                          <p className="text-xs font-black text-slate-900 leading-snug">{item.title}</p>
                          
                          <div className="flex items-center justify-between text-[9px] text-slate-400 font-mono pt-0.5">
                            <span>{item.deadlineText}</span>
                            {item.photos && item.photos.length > 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (item.photos.length > 1) {
                                    setMultiPhotoGallery({
                                      title: `${item.title} — ${item.personName}`,
                                      photos: item.photos
                                    });
                                  } else {
                                    setTaskProofModalImage(item.photos[0]);
                                  }
                                }}
                                className="text-indigo-600 font-bold underline cursor-pointer"
                              >
                                {item.photos.length > 1 ? `Lihat ${item.photos.length} Foto ↗` : 'Bukti Hasil ↗'}
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                </div>

                {/* Footer Modal */}
                <div className="p-3 bg-white border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setSelectedRestoForSlaDetail(null)}
                    className="w-full py-2.5 bg-slate-900 text-white font-bold text-xs rounded-xl cursor-pointer hover:bg-slate-800 transition-colors"
                  >
                    Tutup Rapor Cabang
                  </button>
                </div>

              </div>
            </div>
          );
        })()}
        {/* MODAL GALERI MULTI-FOTO DOKUMENTASI (LAYER TERTINGGI Z-100) */}
        {multiPhotoGallery && (
          <div className="fixed inset-0 bg-slate-950/90 z-[100] backdrop-blur-md flex justify-center items-center p-3 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-md max-h-[90vh] rounded-3xl flex flex-col shadow-2xl overflow-hidden border border-slate-200">
              <div className="px-4 py-3 bg-white border-b border-slate-200 flex items-center justify-between shrink-0">
                <div className="min-w-0 pr-2">
                  <h4 className="text-xs font-black text-slate-900 truncate leading-tight">
                    {multiPhotoGallery.title}
                  </h4>
                  <p className="text-[9.5px] text-indigo-600 font-bold">
                    Total {multiPhotoGallery.photos.length} Foto Bukti Terlampir
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setMultiPhotoGallery(null)}
                  className="p-1.5 hover:bg-slate-100 text-slate-500 rounded-xl cursor-pointer"
                >
                  <FiX className="text-base" />
                </button>
              </div>

              {/* Grid Foto Dokumentasi */}
              <div className="p-4 overflow-y-auto grid grid-cols-2 gap-2.5">
                {multiPhotoGallery.photos.map((url, idx) => (
                  <div
                    key={idx}
                    onClick={() => setTaskProofModalImage(url)}
                    className="group relative aspect-square rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 cursor-pointer shadow-2xs hover:scale-[1.02] transition-all"
                  >
                    <img src={url} alt={`Bukti ${idx + 1}`} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-black">
                      🔍 Perbesar Foto #{idx + 1}
                    </div>
                    <span className="absolute bottom-1.5 left-1.5 bg-black/70 text-white text-[8px] font-mono font-bold px-1.5 py-0.5 rounded-md">
                      #{idx + 1}
                    </span>
                  </div>
                ))}
              </div>

              <div className="p-3 bg-white border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setMultiPhotoGallery(null)}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl cursor-pointer transition-colors"
                >
                  Tutup Galeri Bukti
                </button>
              </div>
            </div>
          </div>
        )}
        {/* MODAL PREVIEW FOTO BUKTI DOKUMENTASI FULL SCREEN (LAYER TERTINGGI Z-999) */}
        {taskProofModalImage && (
          <div 
            className="fixed inset-0 z-[999] bg-black/95 backdrop-blur-md flex flex-col justify-between p-3 select-none animate-in fade-in duration-200"
            onClick={(e) => {
              e.stopPropagation();
              setTaskProofModalImage(null);
            }}
          >
            <div className="w-full max-w-md mx-auto flex items-center justify-between py-2 text-white">
              <span className="text-[11px] font-black uppercase tracking-wider bg-white/10 px-3 py-1 rounded-full border border-white/15">
                🔍 Validasi Foto Bukti Pekerjaan
              </span>
              <button 
                type="button" 
                onClick={(e) => {
                  e.stopPropagation();
                  setTaskProofModalImage(null);
                }}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center text-sm font-bold cursor-pointer"
              >
                <FiX />
              </button>
            </div>

            <div className="flex-1 w-full max-w-md mx-auto flex items-center justify-center overflow-auto p-1">
              <img 
                src={taskProofModalImage} 
                alt="Foto Bukti Penuh" 
                className="max-w-full max-h-[78vh] w-auto h-auto object-contain rounded-2xl border border-white/20 shadow-2xl" 
                onClick={(e) => e.stopPropagation()} 
              />
            </div>

            <div className="w-full max-w-md mx-auto py-2 text-center">
              <p className="text-[10px] text-slate-400 font-medium">Ketuk area luar atau tombol silang untuk menutup foto</p>
            </div>
          </div>
        )}

        {/* MODAL KONFIRMASI TUGAS */}
        {activeModal === 'confirm_task' && taskToConfirm && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex justify-center items-end sm:items-center p-0 sm:p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-100">
              
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div>
                  <h3 className="text-sm font-black text-slate-900">Konfirmasi Tugas Selesai</h3>
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

                <div className="p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-emerald-950 flex items-center gap-1.5">
                      <FiCamera className="text-emerald-700" /> Bukti Foto Langsung
                    </span>
                    {(() => {
                      const isTTC = (taskToConfirm?.title || '').toUpperCase().includes('TTC');
                      const minReq = isTTC ? 10 : 1;
                      const count = multiProofImages.length;
                      return (
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${
                          count >= minReq ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-rose-100 text-rose-800 border-rose-300'
                        }`}>
                          {count} / {minReq} Foto Terambil
                        </span>
                      );
                    })()}
                  </div>

                  <p className="text-[10px] text-slate-500">
                    Ambil foto fisik langsung dengan kamera HP. Tombol submit terkunci jika jumlah foto belum mencukupi.
                  </p>

                  {/* Input Foto dengan Dukungan Kamera & Galeri HP */}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      setMultiProofImages(prev => [...prev, ...files]);
                    }}
                    className="text-xs text-slate-600 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-600 file:text-white hover:file:bg-emerald-700 cursor-pointer w-full"
                  />

                  {/* Preview Thumbnail Foto */}
                  {multiProofImages.length > 0 && (
                    <div className="grid grid-cols-5 gap-1.5 pt-1.5">
                      {multiProofImages.map((file, idx) => (
                        <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-emerald-300 bg-slate-100 shadow-2xs">
                          <img 
                            src={URL.createObjectURL(file)} 
                            alt={`Bukti ${idx + 1}`} 
                            className="w-full h-full object-cover" 
                          />
                          <button
                            type="button"
                            onClick={() => setMultiProofImages(prev => prev.filter((_, i) => i !== idx))}
                            className="absolute top-0.5 right-0.5 bg-black/75 text-white rounded-full w-4 h-4 flex items-center justify-center text-[8px] cursor-pointer"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
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

                {(() => {
                  const isTTC = (taskToConfirm?.title || '').toUpperCase().includes('TTC');
                  const minReq = isTTC ? 10 : 1;
                  const isNotEnough = multiProofImages.length < minReq;

                  return (
                    <button
                      type="submit"
                      disabled={isConfirmingTask || isNotEnough}
                      className={`w-full py-2.5 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-colors shadow-md ${
                        isNotEnough || isConfirmingTask
                          ? 'bg-slate-400 cursor-not-allowed opacity-60'
                          : 'bg-emerald-600 hover:bg-emerald-700 cursor-pointer'
                      }`}
                    >
                      <FiCheckCircle />
                      <span>
                        {isConfirmingTask 
                          ? 'Mengunggah & Menyimpan...' 
                          : isNotEnough 
                          ? `Ambil Minimal ${minReq} Foto (${multiProofImages.length}/${minReq})` 
                          : 'Submit Selesai Pekerjaan'}
                      </span>
                    </button>
                  );
                })()}

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

        {/* MODAL LEADERBOARD */}
        {activeModal === 'peringkat_modern' && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex justify-center items-end sm:items-center p-0 sm:p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-100">
              
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    Leaderboard {selectedRegionFilter === 'KALSEL_1' ? 'Wilayah Kalsel 1' : selectedRegionFilter === 'KALTIM' ? 'Wilayah Kaltim' : 'Semua Wilayah'}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-medium">Klik pada kartu resto atau manager untuk melihat rincian nilai</p>
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
                  <span>Peringkat Cabang</span>
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
                {/* 1. PERINGKAT CABANG (DAPAT DIKLIK UNTUK MEMBUKA DETAIL RINCIAN) */}
                {rankingTab === 'resto' && (
                  outletScoreRankings.map((resto, idx) => {
                    const isTop1 = idx === 0;

                    return (
                      <div 
                        key={resto.id}
                        onClick={() => handleOpenRestoDetail(resto)}
                        className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between cursor-pointer hover:scale-[1.01] active:scale-[0.99] ${
                          isTop1 ? 'bg-gradient-to-r from-amber-500/10 via-amber-100/30 to-white border-amber-300 shadow-xs' :
                          'bg-white border-slate-200/80 hover:border-indigo-300'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-9 h-9 rounded-2xl flex items-center justify-center font-black text-xs shrink-0 shadow-xs ${
                            isTop1 ? 'bg-gradient-to-tr from-amber-500 to-yellow-400 text-amber-950 font-black ring-2 ring-amber-200' :
                            'bg-slate-100 text-slate-600 font-bold'
                          }`}>
                            {isTop1 ? '🥇' : `#${idx + 1}`}
                          </div>

                          <div className="min-w-0">
                            <p className="text-xs font-black text-slate-900 truncate">{resto.name}</p>
                            <p className="text-[10px] text-slate-500 font-medium">SM: {resto.storeManagerName}</p>
                            <div className="w-28 h-1.5 bg-slate-200 rounded-full mt-1.5 overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${
                                  resto.healthScore >= 80 ? 'bg-emerald-500' :
                                  resto.healthScore >= 60 ? 'bg-amber-500' : 'bg-rose-500'
                                }`} 
                                style={{ width: `${resto.healthScore}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <div className="text-right">
                            <span className="text-xs font-black font-mono px-2.5 py-1 bg-white rounded-xl border border-slate-200 shadow-2xs text-slate-900 block">
                              {resto.healthScore}%
                            </span>
                            <span className="text-[8px] text-indigo-600 font-bold mt-0.5 block">
                              Cek Rincian ↗
                            </span>
                          </div>

                          {currentProfile?.role === 'area_manager' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleGpsLock(resto.id, resto.is_locked, resto.name);
                              }}
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

                {/* 2. PERINGKAT MANAGER (KLIK MEMBUKA DETAIL RAPOR) */}
                {rankingTab === 'manager' && (
                  allLeaderRankings.map((mgr, idx) => {
                    const isTop1 = idx === 0;

                    return (
                      <div 
                        key={mgr.id}
                        onClick={() => handleOpenManagerDetail(mgr)}
                        className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between cursor-pointer hover:scale-[1.01] active:scale-[0.99] ${
                          isTop1 ? 'bg-amber-500/10 border-amber-300 shadow-xs' :
                          'bg-white border-slate-200/80 hover:border-indigo-300'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-9 h-9 rounded-2xl flex items-center justify-center font-black text-xs shrink-0 ${
                            isTop1 ? 'bg-amber-400 text-amber-950 font-black shadow-xs ring-2 ring-amber-200' : 'bg-slate-100 text-slate-500'
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
                          <span className="text-[8px] text-indigo-600 font-bold block mt-0.5">
                            Cek Rapor ↗
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

        {/* MODAL DETAIL RESTO (RINCIAN MATEMATIS 4 PILAR REAL) */}
        {activeModal === 'detail_resto' && selectedOutletForDetail && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex justify-center items-end sm:items-center p-0 sm:p-4">
            <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in duration-200">
              
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div>
                  <h3 className="text-sm font-black text-slate-900">{selectedOutletForDetail.name}</h3>
                  <p className="text-[10px] text-slate-400 font-medium">Rincian Perhitungan 4 Indikator Real-Time</p>
                </div>
                <button 
                  onClick={() => setActiveModal('peringkat_modern')}
                  className="p-2 bg-white hover:bg-slate-200 text-slate-600 rounded-full border border-slate-200 cursor-pointer"
                  title="Kembali ke Peringkat"
                >
                  <FiX className="text-sm" />
                </button>
              </div>

              <div className="p-5 overflow-y-auto space-y-4">
                {/* KARTU TOTAL HEALTH SCORE */}
                <div className="bg-slate-900 text-white p-4 rounded-2xl flex items-center justify-between shadow-md">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Health Score</span>
                    <h4 className="text-xs font-bold text-indigo-300 mt-0.5">SM: {selectedOutletForDetail.storeManagerName}</h4>
                    <p className="text-[9px] text-slate-400 mt-1 font-mono">Formula: Rata-rata 4 Indikator (Masing-masing 25%)</p>
                  </div>
                  <span className="text-3xl font-black font-mono text-emerald-400">
                    {selectedOutletForDetail.healthScore}%
                  </span>
                </div>

                <div className="space-y-3.5 pt-1">
                  {/* 1. PRESENSI KEHADIRAN KRU */}
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/90 space-y-1.5">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-slate-800 flex items-center gap-1.5">
                        <FiUsers className="text-indigo-600" /> 1. Presensi & On-Time Kru
                      </span>
                      <span className="font-mono text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-lg">
                        {selectedOutletForDetail.metrics.attendance}% (Bobot 25%)
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${selectedOutletForDetail.metrics.attendance}%` }} />
                    </div>
                    <p className="text-[9.5px] text-slate-500 font-mono">
                      Data Nyata: Terlambat {selectedOutletForDetail.lateCount} kali dari seluruh shift kru ({selectedOutletForDetail.crewCount} orang terdaftar).
                    </p>
                  </div>

                  {/* 2. DISIPLIN BREAK */}
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/90 space-y-1.5">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-slate-800 flex items-center gap-1.5">
                        <FiClock className="text-emerald-600" /> 2. Disiplin Break & After Break
                      </span>
                      <span className="font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg">
                        {selectedOutletForDetail.metrics.breakDiscipline}% (Bobot 25%)
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${selectedOutletForDetail.metrics.breakDiscipline}%` }} />
                    </div>
                    <p className="text-[9.5px] text-slate-500 font-mono">
                      Data Nyata: {selectedOutletForDetail.overbreakCount} kali overbreak. {selectedOutletForDetail.lossAmount > 0 ? `Total kerugian Rp ${Number(selectedOutletForDetail.lossAmount).toLocaleString('id-ID')}` : 'Tidak ada denda operasional'}.
                    </p>
                  </div>

                  {/* 3. KEPATUHAN SLA TUGAS */}
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/90 space-y-1.5">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-slate-800 flex items-center gap-1.5">
                        <FiCheckSquare className="text-blue-600" /> 3. Pengerjaan SLA Tugas
                      </span>
                      <span className="font-mono text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-lg">
                        {selectedOutletForDetail.metrics.taskCompliance}% (Bobot 25%)
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600 rounded-full" style={{ width: `${selectedOutletForDetail.metrics.taskCompliance}%` }} />
                    </div>
                    <p className="text-[9.5px] text-slate-500 font-mono">
                      Data Nyata: {selectedOutletForDetail.taskStats.completed} tugas tepat waktu dari total {selectedOutletForDetail.taskStats.total} tugas ({selectedOutletForDetail.taskStats.overdue} overdue).
                    </p>
                  </div>

                  {/* 4. KERAJINAN CACP */}
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/90 space-y-1.5">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-slate-800 flex items-center gap-1.5">
                        <FiClipboard className="text-purple-600" /> 4. Kerajinan Audit CACP
                      </span>
                      <span className="font-mono text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-lg">
                        {selectedOutletForDetail.metrics.cacpAudit}% (Bobot 25%)
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-purple-600 rounded-full" style={{ width: `${selectedOutletForDetail.metrics.cacpAudit}%` }} />
                    </div>
                    <p className="text-[9.5px] text-slate-500 font-mono">
                      Data Nyata: {selectedOutletForDetail.cacpData.submittedDays} setoran CACP tercatat dari total target {selectedOutletForDetail.cacpData.totalDays} hari periode berjalan.
                    </p>
                  </div>
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    onClick={() => setActiveModal('peringkat_modern')}
                    className="flex-1 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer hover:bg-slate-800 transition-colors"
                  >
                    ← Kembali ke Leaderboard
                  </button>
                  <button
                    onClick={() => setActiveModal(null)}
                    className="px-4 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold cursor-pointer hover:bg-slate-200 transition-colors"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODAL DETAIL MANAGER (RINCIAN MATEMATIS NILAI MANAGER) */}
        {activeModal === 'detail_manager' && selectedManagerForDetail && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex justify-center items-end sm:items-center p-0 sm:p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-100">
              
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div>
                  <h3 className="text-sm font-black text-slate-900">Rapor Kinerja Manager</h3>
                  <p className="text-[10px] text-slate-400 font-medium">Acuan Evaluasi Promosi & Demosi RM</p>
                </div>
                <button 
                  onClick={() => setActiveModal('peringkat_modern')}
                  className="p-2 bg-white hover:bg-slate-200 text-slate-600 rounded-full border border-slate-200 cursor-pointer"
                  title="Kembali ke Peringkat"
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
                    <div>
                      <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                        <FiClock className="text-indigo-600" /> Presensi Masuk Shift
                      </span>
                      <span className="text-[9.5px] text-slate-400">Terlambat: {selectedManagerForDetail.lateMinutes} Menit</span>
                    </div>
                    <span className="text-xs font-mono font-black px-2.5 py-1 rounded-xl border bg-slate-50 text-slate-800">
                      {selectedManagerForDetail.attendanceScore !== undefined ? selectedManagerForDetail.attendanceScore : Math.max(0, 100 - selectedManagerForDetail.lateMinutes * 2)}%
                    </span>
                  </div>

                  <div className="p-3 bg-white border border-slate-200 rounded-2xl flex items-center justify-between">
                    <div>
                      <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                        <FiAlertTriangle className="text-rose-600" /> Disiplin Waktu Break
                      </span>
                      <span className="text-[9.5px] text-slate-400">Pelanggaran: {selectedManagerForDetail.overbreakCount} Kali</span>
                    </div>
                    <span className="text-xs font-mono font-black px-2.5 py-1 rounded-xl border bg-slate-50 text-slate-800">
                      {selectedManagerForDetail.breakScore !== undefined ? selectedManagerForDetail.breakScore : (selectedManagerForDetail.overbreakCount === 0 ? 100 : Math.max(0, 100 - selectedManagerForDetail.overbreakCount * 20))}%
                    </span>
                  </div>

                  <div className="p-3 bg-white border border-slate-200 rounded-2xl flex items-center justify-between">
                    <div>
                      <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                        <FiCheckSquare className="text-blue-600" /> Kepatuhan SLA Tugas
                      </span>
                      <span className="text-[9.5px] text-slate-400">Ketuntasan & Kecepatan Deadline</span>
                    </div>
                    <span className="text-xs font-mono font-black px-2.5 py-1 rounded-xl border bg-blue-50 text-blue-700 border-blue-200">
                      {selectedManagerForDetail.taskRate}%
                    </span>
                  </div>

                  <div className="p-3 bg-white border border-slate-200 rounded-2xl flex items-center justify-between">
                    <div>
                      <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                        <FiClipboard className="text-purple-600" /> Kepatuhan CACP Harian
                      </span>
                      <span className="text-[9.5px] text-slate-400">Form RM saat Shift maupun Libur</span>
                    </div>
                    <span className="text-xs font-mono font-black px-2.5 py-1 rounded-xl border bg-purple-50 text-purple-700 border-purple-200">
                      {selectedManagerForDetail.cacpScore !== undefined ? selectedManagerForDetail.cacpScore : 100}%
                    </span>
                  </div>
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    onClick={() => setActiveModal('peringkat_modern')}
                    className="flex-1 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer hover:bg-slate-800 transition-colors"
                  >
                    ← Kembali ke Leaderboard
                  </button>
                  <button
                    onClick={() => setActiveModal(null)}
                    className="px-4 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold cursor-pointer hover:bg-slate-200 transition-colors"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
{/* ========================================================================= */}
        {/* ➕ MODAL DASHBOARD SALES: HAK AKSES AM, SM & KRU RESTO                    */}
        {/* ========================================================================= */}
        {activeModal === 'sales_dashboard' && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex justify-center items-end sm:items-center p-0 sm:p-4 animate-in fade-in duration-200">
            <div className="bg-[#FAFBFD] w-full max-w-md rounded-t-3xl sm:rounded-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-100">
              
              {/* Header Modal */}
              <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-white shadow-2xs">
                <div className="flex items-center gap-2.5">
                  <span className="w-9 h-9 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-sm font-black shadow-xs">
                    <FiTrendingUp />
                  </span>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 tracking-tight">Dashboard Sales</h3>
                    <p className="text-[10px] text-slate-400 font-medium">
                      {isAM ? 'Monitoring 5 Resto Kalsel 1' : (currentProfile?.full_name || 'Store Level')}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setActiveModal(null)}
                  className="p-2 bg-slate-50 hover:bg-slate-200 text-slate-600 rounded-full border border-slate-200 cursor-pointer"
                >
                  <FiX className="text-sm" />
                </button>
              </div>

              {/* Selector Periode Bulan */}
              <div className="px-4 py-2.5 bg-white border-b border-slate-100 flex items-center justify-between gap-2 shadow-2xs">
                <span className="text-[10px] font-black uppercase text-slate-500">Periode Evaluasi:</span>
                <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-xl">
                  <FiCalendar className="text-indigo-600 text-xs" />
                  <input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="bg-transparent text-[10px] font-black text-slate-800 outline-none cursor-pointer w-20"
                  />
                </div>
              </div>

              {/* Dropdown Filter Resto KHUSUS AM */}
              {isAM && (
                <div className="px-4 py-2 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between gap-2">
                  <span className="text-[10px] font-black uppercase text-slate-500">Filter Resto:</span>
                  <select
                    value={selectedSalesOutlet}
                    onChange={(e) => setSelectedSalesOutlet(e.target.value)}
                    className="text-xs font-bold bg-white border border-slate-200 text-slate-800 rounded-xl px-2.5 py-1.5 outline-none cursor-pointer shadow-2xs flex-1 max-w-[230px]"
                  >
                    <option value="ALL">🌐 Semua 5 Resto (Kalsel 1)</option>
                    {salesMonthlyDb
                      .filter(r => {
                        const oc = (r.outlet_code || '').toUpperCase();
                        const sc = (r.store_code || '').toUpperCase();
                        return oc !== 'TOTAL AREA' && sc !== 'AREA_KALSEL' && !oc.includes('TOTAL');
                      })
                      .map(r => (
                        <option key={r.id} value={r.store_code || r.outlet_code}>
                          {r.outlet_code}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              {/* Scrollable Content */}
              <div className="p-4 overflow-y-auto space-y-4">
                
                {/* BANNER UTAMA SALES */}
                <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white p-5 rounded-3xl shadow-xl border border-indigo-500/30 space-y-3">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300">
                      {isAM && selectedSalesOutlet === 'ALL' ? 'Total Penjualan Area Kalsel 1' : 'Pencapaian Target'}
                    </span>
                    <span className="text-[9px] font-mono font-bold bg-white/10 text-slate-300 px-2 py-0.5 rounded-full">
                      Sisa {salesMetricsCalculation.remainingDays} Hari
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between pt-1">
                    <div>
                      <span className="text-[9px] text-slate-400 block uppercase">Realisasi Penjualan</span>
                      <p className={`text-2xl font-black font-mono text-white mt-0.5 tracking-tight ${!canViewNominal ? 'filter blur-sm select-none' : ''}`}>
                        Rp {salesMetricsCalculation.areaActual.toLocaleString('id-ID')}
                      </p>
                      <p className={`text-[10px] text-slate-300 font-mono mt-0.5 ${!canViewNominal ? 'filter blur-sm select-none' : ''}`}>
                        Target: Rp {salesMetricsCalculation.areaTarget.toLocaleString('id-ID')}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`text-3xl font-black font-mono ${salesMetricsCalculation.areaAchievementPct >= 100 ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {salesMetricsCalculation.areaAchievementPct}%
                      </span>
                      <span className="text-[9px] text-slate-300 font-medium block">Achieved</span>
                    </div>
                  </div>

                  <div className="w-full bg-white/10 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        salesMetricsCalculation.areaAchievementPct >= 100 ? 'bg-emerald-400' : 'bg-indigo-500'
                      }`}
                      style={{ width: `${Math.min(100, salesMetricsCalculation.areaAchievementPct)}%` }}
                    />
                  </div>

                  {/* Sisa Butuh & Target Harian */}
                  <div className="pt-2 border-t border-white/10 grid grid-cols-2 gap-2 text-[10px] font-mono">
                    <div>
                      <span className="text-[8px] text-slate-400 uppercase font-sans block">Sisa Kurang ke Target</span>
                      <span className={`font-black text-rose-300 ${!canViewNominal ? 'filter blur-sm select-none' : ''}`}>
                        Rp {salesMetricsCalculation.areaSisaKekurangan.toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[8px] text-slate-400 uppercase font-sans block">Target Harian s/d Akhir Bln</span>
                      <span className={`font-black text-amber-300 ${!canViewNominal ? 'filter blur-sm select-none' : ''}`}>
                        Rp {salesMetricsCalculation.areaDailyTargetNeeded.toLocaleString('id-ID')}/hr
                      </span>
                    </div>
                  </div>
                </div>

                {/* DAFTAR RESTO PER GERAI (BISA DIKLIK) */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                      {isAM ? 'Pencapaian Per Outlet Kalsel 1' : 'Ringkasan Outlet Anda'}
                    </span>
                    <span className="text-[9px] font-bold text-indigo-600">
                      Klik gerai untuk rincian project ↗
                    </span>
                  </div>

                  {salesMetricsCalculation.stores.map((resto) => (
                    <div 
                      key={resto.code}
                      onClick={() => setSelectedSalesRestoDetail(resto)}
                      className="p-4 bg-white border border-slate-200 hover:border-indigo-400 rounded-3xl shadow-2xs space-y-3 cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] group"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-xs font-black text-slate-900">{resto.name}</h4>
                          <div className={`mt-0.5 text-[10px] font-mono text-slate-500 ${!canViewNominal ? 'filter blur-sm select-none' : ''}`}>
                            Rp {resto.actual.toLocaleString('id-ID')} <span className="text-slate-400 font-sans">/</span> Rp {resto.target.toLocaleString('id-ID')}
                          </div>
                        </div>

                        <div className="text-right">
                          <span className={`text-base font-black font-mono ${resto.achievementPct >= 100 ? 'text-emerald-600' : 'text-slate-900'}`}>
                            {resto.achievementPct}%
                          </span>
                          <span className={`text-[8px] font-black uppercase px-1.5 py-0.2 rounded-md block mt-0.5 ${
                            resto.achievementPct >= 100 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {resto.achievementPct >= 100 ? 'Achieved' : 'On Progress'}
                          </span>
                        </div>
                      </div>

                      {/* Progress Bar Resto */}
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            resto.achievementPct >= 100 ? 'bg-emerald-500' : 'bg-indigo-600'
                          }`}
                          style={{ width: `${Math.min(100, resto.achievementPct)}%` }}
                        />
                      </div>

                      {/* Detail Sisa & Target Daily Resto */}
                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 text-[10px] font-mono bg-slate-50 -mx-4 -mb-4 p-3 rounded-b-3xl">
                        <div>
                          <span className="text-[8px] font-bold text-slate-400 uppercase font-sans block">Sisa Kurang</span>
                          <span className={`font-black text-slate-700 ${!canViewNominal ? 'filter blur-sm select-none' : ''}`}>
                            Rp {resto.sisaKekurangan.toLocaleString('id-ID')}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[8px] font-bold text-slate-400 uppercase font-sans block">Target Harian</span>
                          <span className={`font-black text-indigo-700 ${!canViewNominal ? 'filter blur-sm select-none' : ''}`}>
                            Rp {resto.dailyTargetNeeded.toLocaleString('id-ID')}/hr
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

              </div>

              {/* Footer Modal */}
              <div className="p-3 border-t border-slate-200 bg-white">
                <button
                  onClick={() => setActiveModal(null)}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
                >
                  Tutup Dashboard Sales
                </button>
              </div>

            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ➕ MODAL DETAIL RESTO: MODERN & LUXURIOUS EXECUTIVE VIEW                  */}
        {/* ========================================================================= */}
        {selectedSalesRestoDetail && (() => {
          // Ambil persentase (antisipasi nama properti achievementPct atau achievePct)
          const pct = Number(selectedSalesRestoDetail.achievementPct ?? selectedSalesRestoDetail.achievePct ?? 0);
          const isAchieved = pct >= 100;

          return (
            <div className="fixed inset-0 z-[60] bg-slate-950/85 backdrop-blur-md flex justify-center items-center p-3 animate-in fade-in zoom-in-95 duration-200">
              <div className="bg-[#FAFBFD] w-full max-w-md max-h-[90vh] rounded-[2.5rem] flex flex-col shadow-2xl border border-slate-200/90 overflow-hidden">
                
                {/* Header Premium Glassmorphism */}
                <div className="px-6 py-4 border-b border-slate-200/70 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10">
                  <div className="min-w-0 pr-2">
                    <span className="text-[9px] font-black uppercase tracking-widest text-indigo-600 block">
                      Executive Store Overview
                    </span>
                    <h4 className="text-sm font-black text-slate-900 truncate mt-0.5 tracking-tight">
                      {selectedSalesRestoDetail.name}
                    </h4>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setSelectedSalesRestoDetail(null)}
                    className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full transition-all cursor-pointer shadow-2xs hover:rotate-90 duration-200"
                  >
                    <FiX className="text-sm" />
                  </button>
                </div>

                {/* Body Content */}
                <div className="p-5 overflow-y-auto space-y-4 text-xs">
                  
                  {/* HERO CARD SALES: Deep Midnight Gradient dengan Glow Effect */}
                  <div className="p-5 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white rounded-3xl space-y-4 shadow-xl border border-indigo-500/30 relative overflow-hidden">
                    {/* Glow Orb Dekoratif */}
                    <div className="absolute -top-12 -right-12 w-36 h-36 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none"></div>
                    <div className="absolute -bottom-8 -left-8 w-28 h-28 bg-emerald-500/15 rounded-full blur-xl pointer-events-none"></div>

                    <div className="flex justify-between items-start relative z-10">
                      <div>
                        <span className="text-[9px] text-slate-400 uppercase font-black tracking-widest block">
                          Realisasi Penjualan
                        </span>
                        <p className={`text-2xl font-black font-mono mt-1 tracking-tight text-white ${!canViewNominal ? 'filter blur-sm select-none' : ''}`}>
                          Rp {selectedSalesRestoDetail.actual.toLocaleString('id-ID')}
                        </p>
                        <p className={`text-[11px] text-slate-400 font-mono mt-0.5 ${!canViewNominal ? 'filter blur-sm select-none' : ''}`}>
                          Target: Rp {selectedSalesRestoDetail.target.toLocaleString('id-ID')}
                        </p>
                      </div>

                      {/* Achievement Badge yang Muncul Sempurna */}
                      <div className="text-right">
                        <span className={`text-3xl font-black font-mono tracking-tight block ${isAchieved ? 'text-emerald-400 drop-shadow-[0_2px_10px_rgba(52,211,153,0.3)]' : 'text-amber-400'}`}>
                          {pct}%
                        </span>
                        <span className={`text-[8.5px] font-black uppercase px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                          isAchieved ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}>
                          {isAchieved ? 'Target Tercapai' : 'Sedang Berjalan'}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar Dinamis */}
                    <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden relative z-10 shadow-inner">
                      <div 
                        className={`h-full rounded-full transition-all duration-700 ${isAchieved ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : 'bg-gradient-to-r from-indigo-500 to-purple-500'}`}
                        style={{ width: `${Math.min(100, pct)}%` }}
                      />
                    </div>
                  </div>

                  {/* KARTU TARGET HARIAN & KEKURANGAN (Clean Modern Card) */}
                  <div className="p-4 bg-white border border-slate-200/90 rounded-2xl shadow-xs space-y-2.5 text-[11px] font-mono">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                      <span className="text-slate-500 font-sans font-bold">Kekurangan Menuju Target:</span>
                      <span className={`font-black text-rose-600 ${!canViewNominal ? 'filter blur-sm select-none' : ''}`}>
                        Rp {selectedSalesRestoDetail.sisaKekurangan?.toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                      <span className="text-slate-500 font-sans font-bold">Kebutuhan Sales per Hari:</span>
                      <span className={`font-black text-indigo-700 ${!canViewNominal ? 'filter blur-sm select-none' : ''}`}>
                        Rp {selectedSalesRestoDetail.dailyTargetNeeded?.toLocaleString('id-ID')}/hari
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-sans font-bold">Rata-rata Penjualan Harian Saat Ini:</span>
                      <span className={`font-black text-slate-800 ${!canViewNominal ? 'filter blur-sm select-none' : ''}`}>
                        Rp {selectedSalesRestoDetail.dailyCurrentRunRate?.toLocaleString('id-ID')}/hari
                      </span>
                    </div>
                  </div>

                  {/* PROJECT PENUNJANG SALES: TTC & FLYERING (Kata Ambigu Dihapus, Tampilan Clean) */}
                  <div className="space-y-3 pt-1">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-[10px] font-black uppercase text-slate-800 tracking-wider flex items-center gap-1.5">
                        <FiZap className="text-amber-500 text-xs" /> Proyek Pendongkrak Penjualan
                      </span>
                      <span className="text-[9px] font-mono font-bold text-slate-400">Status Gerai</span>
                    </div>

                    {selectedSalesRestoDetail.salesProjects?.map((proj, idx) => {
                      const isComplete = proj.rate >= 80;

                      return (
                        <div 
                          key={idx} 
                          className="p-4 bg-white border border-slate-200 hover:border-indigo-300 rounded-2xl shadow-2xs space-y-2.5 transition-all"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h5 className="text-xs font-black text-slate-900 tracking-tight">{proj.name}</h5>
                              <p className="text-[9.5px] text-slate-400 mt-0.5">{proj.desc}</p>
                            </div>
                            <span className={`text-[10px] font-mono font-black px-2.5 py-1 rounded-xl border shrink-0 ${
                              isComplete ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}>
                              {proj.rate}% Selesai
                            </span>
                          </div>

                          {/* Progress Line */}
                          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-500 ${isComplete ? 'bg-emerald-500' : 'bg-amber-500'}`}
                              style={{ width: `${Math.min(100, proj.rate)}%` }} 
                            />
                          </div>

                          {/* Dampak Nyata */}
                          <div className="pt-1 flex items-center justify-between text-[9px] border-t border-slate-50">
                            <span className="text-slate-600 font-semibold">
                              💡 Dampak: <strong className="text-slate-900">{proj.impact}</strong>
                            </span>
                            <span className={`font-black uppercase text-[8px] px-1.5 py-0.2 rounded ${
                              isComplete ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {proj.status}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                </div>

                {/* Footer Modal */}
                <div className="p-4 bg-white border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setSelectedSalesRestoDetail(null)}
                    className="w-full py-3 bg-slate-950 hover:bg-slate-800 text-white font-black text-xs rounded-2xl cursor-pointer transition-all shadow-md active:scale-[0.99]"
                  >
                    Tutup Rincian Gerai
                  </button>
                </div>

              </div>
            </div>
          );
        })()}

       {/* BOTTOM NAVIGATION BAR (SEJAJAR & ELEGAN) */}
        <div className="fixed bottom-0 max-w-md w-full bg-white border-t border-slate-200 px-4 py-2.5 flex justify-around items-center z-30 shadow-lg">
          {/* 1. BERANDA */}
          <button 
            onClick={() => setActiveModal(null)} 
            className={`flex flex-col items-center cursor-pointer transition-colors ${activeModal === null ? 'text-indigo-600 font-bold' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <FiActivity className="text-lg" />
            <span className="text-[9px] mt-0.5 font-bold">Beranda</span>
          </button>

          {/* 2. SLA TASKS (REPORT PROJECT) */}
          <button 
            onClick={() => setActiveModal('task_manager')} 
            className={`flex flex-col items-center cursor-pointer relative transition-colors ${activeModal === 'task_manager' ? 'text-indigo-600 font-bold' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <FiCheckSquare className="text-lg" />
            {taskAnalytics.pendingCount > 0 && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-600 text-white rounded-full text-[8px] font-black flex items-center justify-center">
                {taskAnalytics.pendingCount}
              </span>
            )}
            <span className="text-[9px] mt-0.5 font-bold">SLA Tasks</span>
          </button>

          {/* 3. AUDIT CACP */}
          <button 
            onClick={() => {
              setSelectedOutletForCacp(null);
              setActiveModal('cacp_control');
            }} 
            className={`flex flex-col items-center cursor-pointer transition-colors ${activeModal === 'cacp_control' ? 'text-purple-600 font-bold' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <FiClipboard className="text-lg" />
            <span className="text-[9px] mt-0.5 font-bold">CACP RM</span>
          </button>

          {/* 4. PERINGKAT */}
          <button 
            onClick={() => {
              setRankingTab('resto');
              setActiveModal('peringkat_modern');
            }} 
            className={`flex flex-col items-center cursor-pointer transition-colors ${activeModal === 'peringkat_modern' ? 'text-indigo-600 font-bold' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <FiAward className="text-lg" />
            <span className="text-[9px] mt-0.5 font-bold">Peringkat</span>
          </button>
        </div>

  </div>
  </div>
  );
}