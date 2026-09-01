'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../api';
import { useAuth } from '../context/AuthContext';
import imageCompression from 'browser-image-compression';
import { 
  FiClock, 
  FiCamera, 
  FiX, 
  FiCoffee,
  FiLogIn,
  FiLogOut,
  FiLayout,
  FiUsers,
  FiRotateCcw,
  FiSettings,
  FiShield,
  FiCheckCircle,
  FiAlertCircle,
  FiImage,
  FiMapPin,
  FiAlertTriangle,
  FiDroplet,
  FiAward,
  FiFrown,
  FiUser,
  FiLock,
  FiPhone,
  FiUploadCloud,
  FiZap,
  FiPlusCircle,
  FiVolume2,
  FiCheck,
  FiStar,
  FiRefreshCw,
  FiUserCheck,
  FiBriefcase,
  FiLayers,
  FiCheckSquare,
  FiChevronDown,
  FiCalendar,
  FiActivity,
  FiFileText,
  FiFilter,
  FiList
} from 'react-icons/fi';

// ================= KONFIGURASI GEOFENCE OUTLET =================
const TARGET_LAT = -1.260041; 
const TARGET_LNG = 116.863895; 
const MAX_RADIUS_METERS = 50; 

function getDistanceFromLatLonInMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000; 
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
  return R * c; 
}

const SHIFT_HOURS_OPTIONS = Array.from({ length: 24 }, (_, i) => ({
  label: `${i.toString().padStart(2, '0')}:00 WITA${i === 0 ? ' (Midnight)' : i === 22 ? ' (Shift Malam)' : ''}`,
  hour: i
}));

const CREW_STATION_OPTIONS = [
  'Station Noodle',
  'Station Dimsum',
  'Station Bar',
  'Station Produksi',
  'Station Kasir',
  'Station Assembler',
  'Station Presenter',
  'Station Server',
  'Quality Control',
  'Stocker',
  'Cel',
  'Dishwasher'
];

const LOGS_PAGE_SIZE = 20;
const LOGS_MAX_AGE_DAYS = 60;

export default function BreakSystem() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('absen');
  const [, setOfficeRules] = useState(null);

  // ================= STATE ABSENSI UTAMA =================
  const [isOnBreak, setIsOnBreak] = useState(false);
  const [breakStartTime, setBreakStartTime] = useState(null);
  const [timeLeft, setTimeLeft] = useState(3600); 
  const [, setMaxBreakDuration] = useState(3600); 
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraMode, setCameraMode] = useState(''); 
  const [capturedImage, setCapturedImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [greeting, setGreeting] = useState('Selamat Pagi');
  const [motivationQuote, setMotivationQuote] = useState('');
  
  const [hasCheckedIn, setHasCheckedIn] = useState(false);
  const [hasCheckedOut, setHasCheckedOut] = useState(false);
  const [checkInTime, setCheckInTime] = useState(null);
  const [activeLogId, setActiveLogId] = useState(null);
  const [requiredWorkHours, setRequiredWorkHours] = useState(9); 

  const [showShiftPicker, setShowShiftPicker] = useState(false);
  const [selectedShiftHour, setSelectedShiftHour] = useState(9);
  const [selectedStation, setSelectedStation] = useState('Station Noodle');

  const [activeShiftStats, setActiveShiftStats] = useState({
    totalScheduledCrew: 0,
    totalActiveNow: 0,
    staffActive: 0,
    managerActive: 0,
    stationCounts: {}
  });

  const [, setBreakLogs] = useState([]);
  const [liveBreaks, setLiveBreaks] = useState([]);
  const [ghostingCrew, setGhostingCrew] = useState([]);
  const [waterBreaks, setWaterBreaks] = useState([]);
  const [isFetchingLive, setIsFetchingLive] = useState(false);
  
  const [hasPlayed5MinAlarm, setHasPlayed5MinAlarm] = useState(false);
  const [hasPlayed0MinAlarm, setHasPlayed0MinAlarm] = useState(false);
  const [hasNotifiedOverbreak, setHasNotifiedOverbreak] = useState(false);
  const announcedOverbreakCrew = useRef(new Set());

  // Role Checker
  const placementLower = (profile?.station_placement || '').toLowerCase();
  const roleLower = (profile?.role || '').toLowerCase();
  const nameLower = (profile?.full_name || '').toLowerCase();

  const isManager = Boolean(
    placementLower === 'manager' || 
    placementLower === 'atasan' || 
    placementLower === 'owner' || 
    nameLower.includes('owner') || 
    roleLower === 'manager'
  );

  const canReportViolation = Boolean(
    isManager || 
    placementLower.includes('quality control') || 
    placementLower.includes('qc') || 
    placementLower.includes('stocker')
  );

  // ================= STATE LEADERBOARD, HISTORI & INDISIPLINER =================
  const currentMonthYear = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  const [selectedMonth, setSelectedMonth] = useState(currentMonthYear);
  const [leaderboard, setLeaderboard] = useState([]);
  const [managerLeaderboard, setManagerLeaderboard] = useState([]);
  const [leaderboardCategory, setLeaderboardCategory] = useState('crew'); 
  const [isFetchingLeaderboard, setIsFetchingLeaderboard] = useState(false);

  const [activeSubTabLeaderboard, setActiveSubTabLeaderboard] = useState('ranking');
  const [selectedInfractionCategory, setSelectedInfractionCategory] = useState('late');
  const [selectedStationFilter, setSelectedStationFilter] = useState('ALL');

  const [crewInfractionRankings, setCrewInfractionRankings] = useState({ topLate: [], topOverbreak: [], topGhosting: [], topSoc: [] });
  const [managerInfractionRankings, setManagerInfractionRankings] = useState({ topLate: [], topOverbreak: [], topGhosting: [], topSoc: [] });
  const [selectedCrewInfractionDetail, setSelectedCrewInfractionDetail] = useState(null);
  const [showInfractionModal, setShowInfractionModal] = useState(false);

  // Modal Input Pelanggaran SOC / Unprosedural (Dengan Upload Dokumentasi)
  const [showReportViolationModal, setShowReportViolationModal] = useState(false);
  const [reportTargetCrewId, setReportTargetCrewId] = useState('');
  const [reportViolationType, setReportViolationType] = useState('Pelanggaran SOC');
  const [reportNotes, setReportNotes] = useState('');
  const [reportPenaltyPoints, setReportPenaltyPoints] = useState('5');
  const [reportEvidenceImage, setReportEvidenceImage] = useState(null);
  const [isUploadingEvidence, setIsUploadingEvidence] = useState(false);
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  // State Log Foto vs Rekap Presensi Harian (Sub-tab)
  const [logSubTab, setLogSubTab] = useState('photo'); // 'photo' | 'summary'
  const [allCrewLogs, setAllCrewLogs] = useState([]);
  const [managerCrewLogs, setManagerCrewLogs] = useState([]);
  const [attendanceSummaryList, setAttendanceSummaryList] = useState([]);
  const [isFetchingSummary, setIsFetchingSummary] = useState(false);
  const [logCategory, setLogCategory] = useState('crew'); 
  const [isFetchingAllLogs, setIsFetchingAllLogs] = useState(false);
  const [isFetchingMoreLogs, setIsFetchingMoreLogs] = useState(false);
  const [logsPage, setLogsPage] = useState(0);
  const [hasMoreLogs, setHasMoreLogs] = useState(true);
  const isLogsFetchedRef = useRef(false);

  const [humanDetectionStatus, setHumanDetectionStatus] = useState('LOADING_ENGINE'); 
  const [currentSystemTime, setCurrentSystemTime] = useState(new Date());
  const [, setUserLocation] = useState({ lat: null, lng: null });
  const [isVerifyingLocation, setIsVerifyingLocation] = useState(false);

  const [allProfiles, setAllProfiles] = useState([]);
  const [, setIsFetchingProfiles] = useState(false);
  const [selectedCrewId, setSelectedCrewId] = useState('');
  const [selectedIzinType, setSelectedIzinType] = useState('toilet'); 
  const [customIzinMinutes, setCustomIzinMinutes] = useState('10');
  const [isSubmittingIzin, setIsSubmittingIzin] = useState(false);

  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  const videoRef = useRef(null);
  const localStreamRef = useRef(null);
  const animationFrameRef = useRef(null);

  const speakAiVoice = useCallback((text) => {
    try {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'id-ID';
        utterance.rate = 0.92; 
        utterance.pitch = 1.05;

        const voices = window.speechSynthesis.getVoices();
        const idVoice = voices.find(v => (v.lang === 'id-ID' || v.lang === 'id_ID') && !v.name.includes('eSpeak')) ||
                        voices.find(v => v.lang.includes('id') || v.lang.includes('ID'));
        if (idVoice) utterance.voice = idVoice;

        window.speechSynthesis.speak(utterance);
      }
    } catch (e) {
      console.error("SpeechSynthesis Error:", e);
    }
  }, []);

  const triggerSystemNotification = useCallback((title, body) => {
    try {
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          navigator.serviceWorker.ready.then((reg) => {
            reg.showNotification(title, {
              body,
              icon: '/Diciplin-logo.png',
              badge: '/Diciplin-logo.png',
              vibrate: [300, 100, 300, 100, 300],
              requireInteraction: true
            });
          });
        } else {
          new Notification(title, { body, icon: '/Diciplin-logo.png' });
        }
      }
    } catch (e) {
      console.error("Notification trigger error:", e);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').catch(() => {});
      }
    }
  }, []);

  const formatCountdown = (seconds) => {
    if (seconds < 0) {
      const absSeconds = Math.abs(seconds);
      const mins = Math.floor(absSeconds / 60);
      const secs = absSeconds % 60;
      return `-${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const closeCamera = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    setIsCameraOpen(false);
    setCapturedImage(null);
  }, []);

  const getCrewBadge = (points) => {
    if (points >= 120) return { name: 'Elite Guardian', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
    if (points >= 105) return { name: 'Discipline Master', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    if (points >= 100) return { name: 'Regular Crew', color: 'bg-blue-50 text-blue-700 border-blue-200' };
    return { name: 'Under Review', color: 'bg-rose-50 text-rose-700 border-rose-200' };
  };

  const checkAndPerformMonthlyReset = useCallback(async (currentProf) => {
    if (!currentProf || !user?.id) return;
    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const userLastReset = currentProf.last_points_reset_month;

    if (userLastReset && userLastReset !== currentMonthKey) {
      try {
        await supabase.from('discipline_monthly_history').insert({
          user_id: user.id,
          month_year: userLastReset,
          final_points: currentProf.total_points ?? 100
        });

        await supabase.from('user_profiles').update({
          total_points: 100,
          last_points_reset_month: currentMonthKey
        }).eq('id', user.id);

        setProfile(prev => prev ? ({ ...prev, total_points: 100, last_points_reset_month: currentMonthKey }) : prev);
      } catch (err) {
        console.error("Gagal auto reset bulanan:", err);
      }
    }
  }, [user]);

  const fetchAllProfilesList = useCallback(async () => {
    setIsFetchingProfiles(true);
    try {
      const { data: profilesData, error } = await supabase
        .from('user_profiles')
        .select('id, full_name, station_placement, role')
        .order('full_name', { ascending: true });

      if (!error && profilesData) {
        setAllProfiles(profilesData);
      }
    } catch (err) {
      console.error("Gagal memuat profil staff:", err);
    } finally {
      setIsFetchingProfiles(false);
    }
  }, []);

  const fetchActiveShiftStats = useCallback(async () => {
    try {
      const [{ data: activeLogs, error: lError }, { data: profiles, error: pError }] = await Promise.all([
        supabase
          .from('attendance_logs')
          .select('user_id, status_in, break_start_time, break_end_time, discipline_status')
          .not('actual_in', 'is', null)
          .is('actual_out', null),
        supabase
          .from('user_profiles')
          .select('id, full_name, station_placement, role')
      ]);

      if (!lError && !pError && activeLogs && profiles) {
        const profileMap = {};
        profiles.forEach(p => { profileMap[p.id] = p; });

        let totalScheduled = activeLogs.length;
        let staffCount = 0;
        let managerCount = 0;
        let totalActiveNow = 0;
        const stationCounts = {};

        activeLogs.forEach(log => {
          const p = profileMap[log.user_id];
          if (p) {
            const isCurrentlyBreaking = (Boolean(log.break_start_time) && !Boolean(log.break_end_time)) || log.discipline_status === 'Sedang Istirahat';
            const nLower = (p.full_name || '').toLowerCase();
            const plLower = (p.station_placement || '').toLowerCase();
            const rLower = (p.role || '').toLowerCase();

            const isMgr = nLower.includes('owner') || plLower.includes('owner') || plLower.includes('manager') || plLower.includes('atasan') || rLower === 'manager';

            if (isMgr) managerCount += 1;
            else staffCount += 1;

            if (!isCurrentlyBreaking) {
              totalActiveNow += 1;
              let stationName = isMgr ? 'Manager Duty' : (p.station_placement || 'Staff Duty');
              
              if (!isMgr && log.status_in && log.status_in.includes(' - ')) {
                const parts = log.status_in.split(' - ');
                if (parts[1]) stationName = parts[1].trim();
              }

              if (stationName && stationName !== 'Staff Duty') {
                stationCounts[stationName] = (stationCounts[stationName] || 0) + 1;
              } else if (isMgr) {
                stationCounts['Manager Duty'] = (stationCounts['Manager Duty'] || 0) + 1;
              }
            }
          }
        });

        setActiveShiftStats({
          totalScheduledCrew: totalScheduled,
          totalActiveNow: totalActiveNow,
          staffActive: staffCount,
          managerActive: managerCount,
          stationCounts: stationCounts
        });
      }
    } catch (e) {
      console.error("Gagal sinkronisasi data shift aktif:", e);
    }
  }, []);

  const fetchAttendanceStatus = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { data: prof } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
        
      if (prof) {
        setProfile(prof);
        checkAndPerformMonthlyReset(prof);
        if (prof.station_placement) setSelectedStation(prof.station_placement);

        if (prof.company_id) {
          try {
            const { data: rulesData, error: rError } = await supabase
              .from('companies') 
              .select('latitude, longitude, radius_meter')
              .eq('id', prof.company_id)
              .maybeSingle();
              
            if (!rError && rulesData) setOfficeRules(rulesData);
          } catch (err) {
            console.error("Gagal sinkronisasi aturan:", err);
          }
        }
      }

      const safeWindow = new Date();
      safeWindow.setHours(safeWindow.getHours() - 36);

      const { data: activeLogs } = await supabase
        .from('attendance_logs')
        .select('id, actual_in, actual_out, break_start_time, break_end_time, discipline_status, status_in') 
        .eq('user_id', user.id)
        .is('actual_out', null)
        .gte('created_at', safeWindow.toISOString())
        .order('created_at', { ascending: false })
        .limit(1);

      let currentLog = activeLogs?.[0];

      if (!currentLog) {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const { data: logs } = await supabase
          .from('attendance_logs')
          .select('id, actual_in, actual_out, break_start_time, break_end_time, discipline_status, status_in') 
          .eq('user_id', user.id)
          .gte('created_at', todayStart.toISOString())
          .order('created_at', { ascending: false })
          .limit(1);

        currentLog = logs?.[0];
      }

      if (currentLog) {
        setActiveLogId(currentLog.id);
        setHasCheckedIn(!!currentLog.actual_in);
        setHasCheckedOut(!!currentLog.actual_out);
        
        const inTime = currentLog.actual_in ? new Date(currentLog.actual_in) : null;
        setCheckInTime(inTime);

        if (currentLog.status_in && currentLog.status_in.includes('Shift ')) {
          try {
            const parsedHour = parseInt(currentLog.status_in.split('Shift ')[1].split(':')[0]);
            if (!isNaN(parsedHour)) setSelectedShiftHour(parsedHour);
          } catch(e) {}
        }

        let checkInHour = 0;
        try {
          const checkInHourStr = inTime ? inTime.toLocaleTimeString('en-US', { hour: '2-digit', hour12: false, timeZone: 'Asia/Makassar' }) : '0';
          checkInHour = parseInt(checkInHourStr);
        } catch (e) {
          checkInHour = inTime ? inTime.getHours() : 0;
        }

        const isShift22 = (selectedShiftHour === 22 || checkInHour === 22);
        setRequiredWorkHours(isShift22 ? 8 : 9);
        
        const breaking = (!!currentLog.break_start_time && !currentLog.break_end_time) || currentLog.discipline_status === 'Sedang Istirahat';
        
        if (breaking) {
          setIsOnBreak(true);
          if (currentLog.break_start_time) {
            setBreakStartTime(new Date(currentLog.break_start_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Makassar' }) + ' WITA');
          } else {
            setBreakStartTime(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Makassar' }) + ' WITA');
          }

          const allowedBreakSec = (checkInHour === 22) ? 1800 : 3600; 
          const startTimeMs = currentLog.break_start_time ? new Date(currentLog.break_start_time).getTime() : Date.now();
          const elapsed = Math.floor((Date.now() - startTimeMs) / 1000);
          
          setTimeLeft(allowedBreakSec - elapsed);
          setMaxBreakDuration(allowedBreakSec);
        } else {
          setIsOnBreak(false);
          setBreakStartTime(null);
        }
      } else {
        setHasCheckedIn(false);
        setHasCheckedOut(false);
        setCheckInTime(null);
        setIsOnBreak(false);
        setActiveLogId(null);
        setBreakStartTime(null);
      }
    } catch (err) {
      console.error("Gagal memuat status kehadiran:", err);
    }
  }, [user, selectedShiftHour, checkAndPerformMonthlyReset]);

  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('attendance_realtime_alert')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'attendance_logs' },
        (payload) => {
          const newRow = payload.new;
          if (newRow.user_id === user.id && newRow.discipline_status === 'Overbreak') {
            triggerSystemNotification(
              "⚠️ PERINGATAN OVERBREAK!",
              "Waktu istirahat Anda telah habis! Poin kedisiplinan Anda mulai terpotong otomatis."
            );
          }
          if (isManager && newRow.user_id !== user.id && newRow.discipline_status === 'Overbreak') {
            triggerSystemNotification(
              "🚨 ALERT MANAGER: CREW OVERBREAK!",
              "Rekan kru terdeteksi melewati batas istirahat. Segera periksa radar live."
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, isManager, triggerSystemNotification]);

  const fetchLiveBreakData = useCallback(async () => {
    setIsFetchingLive(true);
    try {
      const [{ data: logsData, error: logsError }, { data: wbData }, { data: profilesData, error: profilesError }] = await Promise.all([
        supabase
          .from('attendance_logs')
          .select('id, user_id, break_start_time, break_end_time, actual_in, actual_out, discipline_status, is_outside_radius, distance_meters, status_in')
          .not('actual_in', 'is', null)
          .is('actual_out', null),
        supabase
          .from('user_profiles')
          .select('id, full_name, station_placement, current_izin_start, current_izin_duration, current_izin_type')
          .not('current_izin_start', 'is', null),
        supabase
          .from('user_profiles')
          .select('id, full_name, station_placement')
      ]);

      if (logsError || profilesError) return;

      if (profilesData) {
        setAllProfiles(profilesData);
        const profileMap = {};
        const stationMap = {};
        profilesData.forEach(p => { 
          profileMap[p.id] = p.full_name;
          stationMap[p.id] = p.station_placement || 'Station Staff';
        });

        if (logsData && logsData.length > 0) {
          const activeBreaks = logsData.filter(l => l.break_start_time && !l.break_end_time).map((log, index) => {
            const start = new Date(log.break_start_time);
            const checkInHour = log.actual_in ? new Date(log.actual_in).getHours() : 0;
            const allowedSec = (checkInHour === 22) ? 1800 : 3600; 
            const elapsedSec = Math.floor((Date.now() - start.getTime()) / 1000);
            const isOver = elapsedSec > allowedSec;

            let currentStation = stationMap[log.user_id] || 'Staff Duty';
            if (log.status_in && log.status_in.includes(' - ')) {
              const parts = log.status_in.split(' - ');
              if (parts[1]) currentStation = parts[1].trim();
            }

            return {
              id: log.id || index,
              name: profileMap[log.user_id] || 'Crew Member',
              station: currentStation,
              start: start.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Makassar' }) + ' WITA',
              duration: isOver ? `Over +${Math.floor((elapsedSec - allowedSec) / 60)}m` : `${Math.floor(elapsedSec / 60)}m berjalan`,
              zone: 'Dalam Radius Outlet',
              rawRawStart: start,
              allowedSec: allowedSec,
              isOverBreak: isOver
            };
          });
          setLiveBreaks(activeBreaks);

          const activeGhosting = logsData.filter(l => l.is_outside_radius === true && !l.break_start_time).map(l => ({
            id: l.id,
            name: profileMap[l.user_id] || 'Crew Member',
            station: stationMap[l.user_id] || 'Station Staff',
            distance: `${l.distance_meters || 55}m di luar area`
          }));
          setGhostingCrew(activeGhosting);
        } else {
          setLiveBreaks([]);
          setGhostingCrew([]);
        }

        if (wbData && wbData.length > 0) {
          const activeWBs = wbData.map(wb => {
            const start = new Date(wb.current_izin_start);
            const durationSec = (wb.current_izin_duration || 10) * 60; 
            const elapsedSec = Math.floor((Date.now() - start.getTime()) / 1000);
            return {
              id: wb.id,
              name: wb.full_name,
              station: wb.station_placement || 'Station Staff',
              type: wb.current_izin_type || 'TOILET',
              duration: `${Math.floor((durationSec - elapsedSec) / 60)}m sisa`,
              rawRawStart: start,
              allowedSec: durationSec,
              isOverBreak: elapsedSec > durationSec
            };
          });
          setWaterBreaks(activeWBs);
        } else {
          setWaterBreaks([]);
        }
      }
    } catch (err) {
      console.error("Gagal memuat data live monitoring:", err);
    } finally {
      setIsFetchingLive(false);
    }
  }, []);

  // ================= LEADERBOARD & INDISIPLINER =================
  const fetchLeaderboard = useCallback(async () => {
    setIsFetchingLeaderboard(true);
    try {
      const [{ data: profiles, error: pError }, { data: logs }, { data: violations }] = await Promise.all([
        supabase
          .from('user_profiles')
          .select('id, full_name, avatar, station_placement, role, total_points'),
        supabase
          .from('attendance_logs')
          .select('id, user_id, created_at, break_start_time, break_end_time, actual_in, actual_out, discipline_status, penalty_points, status_in, status_out, is_outside_radius, distance_meters'),
        supabase
          .from('operational_violations')
          .select('*')
      ]);
        
      if (pError || !profiles) {
        setIsFetchingLeaderboard(false);
        return;
      }

      let historyMap = {};
      if (selectedMonth !== currentMonthYear) {
        const { data: historyData } = await supabase
          .from('discipline_monthly_history')
          .select('*')
          .eq('month_year', selectedMonth);
        if (historyData) {
          historyData.forEach(h => { historyMap[h.user_id] = h.final_points; });
        }
      }

      const isProfileManager = (p) => {
        const nLower = (p.full_name || '').toLowerCase();
        const plLower = (p.station_placement || '').toLowerCase();
        const rLower = (p.role || '').toLowerCase();
        return nLower.includes('owner') || plLower.includes('owner') || plLower.includes('manager') || plLower.includes('atasan') || rLower === 'manager';
      };

      const filteredCrewProfiles = profiles.filter(p => !isProfileManager(p));
      const filteredManagerProfiles = profiles.filter(p => isProfileManager(p));

      const processData = (profileList) => {
        const lateRankingList = [];
        const overbreakRankingList = [];
        const ghostingRankingList = [];
        const socRankingList = [];

        const leaderboardArray = profileList.map(person => {
          let pts = 100;
          if (selectedMonth === currentMonthYear) {
            pts = person.total_points !== null && person.total_points !== undefined ? Number(person.total_points) : 100;
          } else {
            pts = historyMap[person.id] !== undefined ? Number(historyMap[person.id]) : 100;
          }
          
          let lateCount = 0;
          let totalLateMinutes = 0;
          let overBreakCount = 0;
          let totalOverBreakMinutes = 0;
          let ghostingCount = 0;
          let socCount = 0;
          let normalBreakCount = 0;
          let totalBreakMinutes = 0;
          const userInfractionHistory = [];

          const personLogs = (logs || []).filter(l => {
            if (l.user_id !== person.id) return false;
            if (!l.created_at) return true;
            return l.created_at.substring(0, 7) === selectedMonth;
          });

          personLogs.forEach(log => {
            const logDate = new Date(log.created_at || log.actual_in);
            const formattedDate = logDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Makassar' });
            const formattedTime = logDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Makassar' });

            if (log.status_in && log.status_in.toLowerCase().includes('terlambat')) {
              try {
                const match = log.status_in.match(/Terlambat (\d+)m/);
                const mins = match && match[1] ? parseInt(match[1]) : 0;
                if (mins > 0 && mins < 720) {
                  lateCount += 1;
                  totalLateMinutes += mins;
                  userInfractionHistory.push({
                    type: 'Terlambat Masuk Shift',
                    badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
                    detail: `${mins} Menit terlambat`,
                    date: formattedDate,
                    time: `${formattedTime} WITA`,
                    note: log.status_in
                  });
                }
              } catch(e) {}
            }

            if (log.break_start_time && log.break_end_time) {
              normalBreakCount += 1;
              const start = new Date(log.break_start_time);
              const end = new Date(log.break_end_time);
              const actualMins = Math.floor((end.getTime() - start.getTime()) / 60000);
              totalBreakMinutes += actualMins;

              const checkInHour = log.actual_in ? new Date(log.actual_in).getHours() : 0;
              const allowedMins = (checkInHour === 22) ? 30 : 60;

              if (actualMins > allowedMins) {
                const overM = actualMins - allowedMins;
                overBreakCount += 1;
                totalOverBreakMinutes += overM;
                userInfractionHistory.push({
                  type: 'Overbreak Istirahat',
                  badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
                  detail: `Over +${overM} Menit (Total break ${actualMins}m)`,
                  date: formattedDate,
                  time: `${start.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Makassar' })} WITA`,
                  note: 'Melebihi alokasi waktu istirahat'
                });
              }
            } else if (log.discipline_status === 'Overbreak') {
              overBreakCount += 1;
              const penalty = log.penalty_points ? Number(log.penalty_points) : 1;
              totalOverBreakMinutes += penalty;
              userInfractionHistory.push({
                type: 'Overbreak Terdeteksi',
                badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
                detail: `Overbreak aktif (${penalty} Poin deduksi)`,
                date: formattedDate,
                time: `${formattedTime} WITA`,
                note: 'Belum presensi selesai break'
              });
            }

            if (log.is_outside_radius || (log.discipline_status && log.discipline_status.toLowerCase().includes('ghosting'))) {
              ghostingCount += 1;
              userInfractionHistory.push({
                type: 'Ghosting / Luar Radius',
                badgeColor: 'bg-red-100 text-red-800 border-red-200',
                detail: `${log.distance_meters || '50+'}m di luar area tugas`,
                date: formattedDate,
                time: `${formattedTime} WITA`,
                note: 'Meninggalkan area tugas outlet tanpa izin resmi'
              });
            }

            if (log.status_out && log.status_out.toLowerCase().includes('pulang cepat')) {
              userInfractionHistory.push({
                type: 'Pulang Cepat (Early Leave)',
                badgeColor: 'bg-orange-100 text-orange-800 border-orange-200',
                detail: `Checkout sebelum durasi shift selesai (-${log.penalty_points || 0} Pts)`,
                date: formattedDate,
                time: `${formattedTime} WITA`,
                note: log.status_out
              });
            }
          });

          const personViolations = (violations || []).filter(v => {
            if (v.crew_id !== person.id) return false;
            if (!v.created_at) return true;
            return v.created_at.substring(0, 7) === selectedMonth;
          });

          personViolations.forEach(v => {
            socCount += 1;
            const vDate = new Date(v.created_at);
            userInfractionHistory.push({
              type: v.violation_type || 'Pelanggaran SOC',
              badgeColor: 'bg-orange-100 text-orange-800 border-orange-200',
              detail: `Pengurangan (-${v.penalty_points || 0} Poin)`,
              date: vDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Makassar' }),
              time: `${vDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Makassar' })} WITA`,
              note: v.notes,
              evidence_image_url: v.evidence_image_url || null // Dokumentasi foto bukti pelanggaran (Poin 4)
            });
          });

          const personStation = person.station_placement || person.role || 'Staff Crew';

          if (lateCount > 0) {
            lateRankingList.push({
              id: person.id,
              name: person.full_name,
              avatar: person.avatar,
              role: personStation,
              station: personStation,
              count: lateCount,
              totalMinutes: totalLateMinutes,
              history: userInfractionHistory.filter(h => h.type.includes('Terlambat'))
            });
          }

          if (overBreakCount > 0) {
            overbreakRankingList.push({
              id: person.id,
              name: person.full_name,
              avatar: person.avatar,
              role: personStation,
              station: personStation,
              count: overBreakCount,
              totalMinutes: totalOverBreakMinutes,
              history: userInfractionHistory.filter(h => h.type.includes('Overbreak'))
            });
          }

          if (ghostingCount > 0) {
            ghostingRankingList.push({
              id: person.id,
              name: person.full_name,
              avatar: person.avatar,
              role: personStation,
              station: personStation,
              count: ghostingCount,
              totalMinutes: 0,
              history: userInfractionHistory.filter(h => h.type.includes('Ghosting'))
            });
          }

          if (socCount > 0) {
            socRankingList.push({
              id: person.id,
              name: person.full_name,
              avatar: person.avatar,
              role: personStation,
              station: personStation,
              count: socCount,
              totalMinutes: 0,
              history: userInfractionHistory.filter(h => !h.type.includes('Terlambat') && !h.type.includes('Overbreak') && !h.type.includes('Ghosting'))
            });
          }

          const reasons = [];
          if (lateCount > 0) reasons.push(`${lateCount}x Telat (${totalLateMinutes}m)`);
          if (overBreakCount > 0) reasons.push(`${overBreakCount}x Overbreak (${totalOverBreakMinutes}m)`);
          if (ghostingCount > 0) reasons.push(`${ghostingCount}x Ghosting`);
          if (socCount > 0) reasons.push(`${socCount}x Unprosedural/SOC`);

          let statusDescription = '';
          const hasRealInfractions = reasons.length > 0;

          if (hasRealInfractions) {
            statusDescription = `⚠️ ` + reasons.join(' • ');
          } else if (pts < 100) {
            statusDescription = `⚠️ Pengurangan Disiplin (${pts - 100} Pts)`;
          } else if (normalBreakCount > 0) {
            statusDescription = `✓ ${normalBreakCount}x Break (${totalBreakMinutes} Menit) Sesuai`;
          } else {
            statusDescription = '✓ Disiplin Standar (100 Pts)';
          }

          return {
            id: person.id,
            name: person.full_name || 'Staff Member',
            avatar: person.avatar,
            role: personStation, 
            points: pts,
            isBebal: pts < 100 || (hasRealInfractions && pts <= 100),
            breakInfo: statusDescription,
            infractions: userInfractionHistory
          };
        });

        return {
          leaderboard: leaderboardArray,
          rankings: {
            topLate: lateRankingList.sort((a, b) => b.count - a.count || b.totalMinutes - a.totalMinutes),
            topOverbreak: overbreakRankingList.sort((a, b) => b.count - a.count || b.totalMinutes - a.totalMinutes),
            topGhosting: ghostingRankingList.sort((a, b) => b.count - a.count),
            topSoc: socRankingList.sort((a, b) => b.count - a.count)
          }
        };
      };

      const crewProcessed = processData(filteredCrewProfiles);
      const managerProcessed = processData(filteredManagerProfiles);

      setLeaderboard(crewProcessed.leaderboard);
      setCrewInfractionRankings(crewProcessed.rankings);

      setManagerLeaderboard(managerProcessed.leaderboard);
      setManagerInfractionRankings(managerProcessed.rankings);

    } catch (e) {
      console.error("Error leaderboard:", e);
    } finally {
      setIsFetchingLeaderboard(false);
    }
  }, [selectedMonth, currentMonthYear]);

  // Upload Dokumentasi Pendukung Pelanggaran (Poin 1)
  const handleEvidenceImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingEvidence(true);
      const compressed = await imageCompression(file, {
        maxSizeMB: 0.1,
        maxWidthOrHeight: 1024,
        useWebWorker: true
      });

      const filePath = `evidence/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
      const { error: uploadError } = await supabase.storage
        .from('attendance-proofs')
        .upload(filePath, compressed, { contentType: 'image/jpeg', upsert: true });

      if (uploadError) throw uploadError;

      const { data: publicData } = supabase.storage
        .from('attendance-proofs')
        .getPublicUrl(filePath);

      setReportEvidenceImage(publicData.publicUrl);
    } catch (err) {
      alert(`Gagal mengunggah foto bukti: ${err.message}`);
    } finally {
      setIsUploadingEvidence(false);
    }
  };

  // Form Submit Pelanggaran SOC / Unprosedural (Wajib Bukti Foto)
  const handleSubmitOperationalViolation = async (e) => {
    e.preventDefault();
    if (!reportTargetCrewId) return alert("Pilih kru yang bersangkutan.");
    if (!reportNotes.trim()) return alert("Tuliskan deskripsi/catatan pelanggaran.");
    if (!reportEvidenceImage) return alert("⚠️ Wajib mengunggah foto dokumentasi pendukung sebelum mengirim laporan.");

    setIsSubmittingReport(true);
    try {
      const deduction = parseInt(reportPenaltyPoints) || 0;

      const { error: insErr } = await supabase.from('operational_violations').insert({
        crew_id: reportTargetCrewId,
        reported_by: user?.id,
        reporter_name: profile?.full_name || 'Supervisor/QC',
        reporter_role: profile?.station_placement || profile?.role || 'Quality Control',
        violation_type: reportViolationType,
        notes: reportNotes.trim(),
        penalty_points: deduction,
        evidence_image_url: reportEvidenceImage
      });

      if (insErr) throw insErr;

      if (deduction > 0) {
        const { data: targetProf } = await supabase
          .from('user_profiles')
          .select('total_points')
          .eq('id', reportTargetCrewId)
          .maybeSingle();

        const currentPts = targetProf?.total_points ?? 100;
        await supabase
          .from('user_profiles')
          .update({ total_points: currentPts - deduction })
          .eq('id', reportTargetCrewId);
      }

      alert("✓ Laporan pelanggaran & foto bukti berhasil disimpan!");
      setShowReportViolationModal(false);
      setReportNotes('');
      setReportTargetCrewId('');
      setReportEvidenceImage(null);
      fetchLeaderboard();
      fetchAttendanceStatus();
    } catch (err) {
      alert(`Gagal mengirim laporan: ${err.message}`);
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const openInfractionDetailModal = (crewData) => {
    setSelectedCrewInfractionDetail(crewData);
    setShowInfractionModal(true);
  };

  const fetchBreakLogs = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { data, error } = await supabase
        .from('attendance_logs')
        .select('id, created_at, break_start_time, break_end_time, image_url, after_break_image_url, discipline_status, actual_in')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (!error && data) {
        setBreakLogs(data.filter(log => log.break_start_time));
      }
    } catch (e) {
      console.error("Gagal memuat rekap log break:", e);
    }
  }, [user]);

  // Fetch Rekap Presensi Masuk & Pulang Harian Tanpa Foto (Poin 2)
  const fetchAttendanceSummaryList = useCallback(async () => {
    setIsFetchingSummary(true);
    try {
      const [{ data: logs, error: lError }, { data: profiles, error: pError }] = await Promise.all([
        supabase
          .from('attendance_logs')
          .select('id, user_id, created_at, actual_in, actual_out, status_in, status_out, discipline_status')
          .not('actual_in', 'is', null)
          .order('created_at', { ascending: false })
          .limit(100),
        supabase
          .from('user_profiles')
          .select('id, full_name, station_placement')
      ]);

      if (!lError && !pError && logs && profiles) {
        const pMap = {};
        const stMap = {};
        profiles.forEach(p => { 
          pMap[p.id] = p.full_name; 
          stMap[p.id] = p.station_placement || 'Staff Station';
        });

        const formatted = logs.map(l => {
          const logDate = new Date(l.actual_in || l.created_at);
          const dateStr = logDate.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            timeZone: 'Asia/Makassar'
          });

          const inTimeStr = l.actual_in 
            ? new Date(l.actual_in).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Makassar' }) + ' WITA' 
            : '--:--';

          const outTimeStr = l.actual_out 
            ? new Date(l.actual_out).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Makassar' }) + ' WITA' 
            : 'Belum Pulang';

          return {
            id: l.id,
            name: pMap[l.user_id] || 'Crew Member',
            station: stMap[l.user_id] || 'Staff',
            date: dateStr,
            inTime: inTimeStr,
            outTime: outTimeStr,
            statusIn: l.status_in || 'Tepat Waktu',
            statusOut: l.status_out || (l.actual_out ? 'Shift Selesai' : 'On-Duty')
          };
        });

        setAttendanceSummaryList(formatted);
      }
    } catch (e) {
      console.error("Gagal load rekap presensi:", e);
    } finally {
      setIsFetchingSummary(false);
    }
  }, []);

  const fetchAllCrewLogs = useCallback(async (loadMore = false, pageNum = 0) => {
    if (loadMore) {
      setIsFetchingMoreLogs(true);
    } else {
      setIsFetchingAllLogs(true);
    }

    try {
      const pageToFetch = loadMore ? pageNum : 0;
      const rangeFrom = pageToFetch * LOGS_PAGE_SIZE;
      const rangeTo = rangeFrom + LOGS_PAGE_SIZE - 1;

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - LOGS_MAX_AGE_DAYS);

      const [{ data: logs, error: lError }, { data: profiles, error: pError }] = await Promise.all([
        supabase
          .from('attendance_logs')
          .select('id, user_id, created_at, break_start_time, break_end_time, image_url, after_break_image_url, actual_in')
          .not('break_start_time', 'is', null)
          .gte('created_at', cutoffDate.toISOString())
          .order('created_at', { ascending: false })
          .range(rangeFrom, rangeTo),
        supabase
          .from('user_profiles')
          .select('id, full_name, station_placement, role')
      ]);

      if (!lError && !pError && logs && profiles) {
        const profileMap = {};
        const isManagerMap = {};
        
        profiles.forEach(p => { 
          profileMap[p.id] = p.full_name;
          const nLower = (p.full_name || '').toLowerCase();
          const plLower = (p.station_placement || '').toLowerCase();
          const rLower = (p.role || '').toLowerCase();
          
          isManagerMap[p.id] = nLower.includes('owner') || plLower.includes('owner') || plLower.includes('manager') || plLower.includes('atasan') || rLower === 'manager';
        });

        const cleanImageUrl = (rawUrl) => {
          if (!rawUrl) return null;
          let clean = rawUrl;
          if (clean.includes('](')) clean = clean.split('](')[0];
          if (clean.includes(')')) clean = clean.split(')')[0];
          if (clean.includes('[')) clean = clean.replace('[', '');
          if (clean.includes(']')) clean = clean.replace(']', '');
          if (clean.includes('/crew-assets/')) clean = clean.replace('/crew-assets/', '/attendance-proofs/');

          if (!clean.startsWith('http')) {
            return supabase.storage.from('attendance-proofs').getPublicUrl(clean).data.publicUrl;
          }
          return clean.trim();
        };

        const newCrewLogsArray = [];
        const newManagerLogsArray = [];

        logs.forEach(log => {
          let durationString = 'Sedang Istirahat';
          let isOver = false;
          let startTimeString = '--:-- WITA';
          let endTimeString = 'In Progress';

          if (log.break_start_time) {
            startTimeString = new Date(log.break_start_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Makassar' }) + ' WITA';
          }

          if (log.break_end_time) {
            endTimeString = new Date(log.break_end_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Makassar' }) + ' WITA';
          }

          if (log.break_start_time && log.break_end_time) {
            const start = new Date(log.break_start_time);
            const end = new Date(log.break_end_time);
            const elapsedMins = Math.floor((end.getTime() - start.getTime()) / 60000);
            const checkInHour = log.actual_in ? new Date(log.actual_in).getHours() : 0;
            const allowedMins = (checkInHour === 22) ? 30 : 60;
            
            durationString = `${elapsedMins} Menit`;
            if (elapsedMins > allowedMins) {
              isOver = true;
              durationString += ` (Over +${elapsedMins - allowedMins}m)`;
            }
          }

          const processedLog = {
            ...log,
            image_url: cleanImageUrl(log.image_url),
            after_break_image_url: cleanImageUrl(log.after_break_image_url),
            crewName: profileMap[log.user_id] || 'Crew Member',
            formattedDuration: durationString,
            formattedStartTime: startTimeString,
            formattedEndTime: endTimeString,
            isOverBreak: isOver
          };

          if (isManagerMap[log.user_id]) {
            newManagerLogsArray.push(processedLog);
          } else {
            newCrewLogsArray.push(processedLog);
          }
        });

        if (loadMore) {
          setAllCrewLogs(prev => [...prev, ...newCrewLogsArray]);
          setManagerCrewLogs(prev => [...prev, ...newManagerLogsArray]);
        } else {
          setAllCrewLogs(newCrewLogsArray);
          setManagerCrewLogs(newManagerLogsArray);
        }

        setLogsPage(pageToFetch + 1);
        setHasMoreLogs(logs.length === LOGS_PAGE_SIZE);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsFetchingAllLogs(false);
      setIsFetchingMoreLogs(false);
    }
  }, []);

  const updateDurationsLocally = useCallback(() => {
    setLiveBreaks(prev => prev.map(crew => {
      if (!crew.rawRawStart) return crew;
      const elapsedSec = Math.floor((Date.now() - crew.rawRawStart.getTime()) / 1000);
      const allowedSec = crew.allowedSec || 3600;
      const isOver = elapsedSec > allowedSec;
      const timeLeftSec = allowedSec - elapsedSec;
      
      let displayDuration = `${Math.floor(elapsedSec / 60)}m ${elapsedSec % 60}s berjalan`;
      let isWarning = timeLeftSec <= 300 && timeLeftSec > 0;

      if (isOver) {
        const overSec = elapsedSec - allowedSec;
        const overMins = Math.floor(overSec / 60);
        displayDuration = `Over +${overMins}m ${overSec % 60}s (Poin -${overMins})`;

        if (isManager && !announcedOverbreakCrew.current.has(crew.id)) {
          announcedOverbreakCrew.current.add(crew.id);
          speakAiVoice(`Pemberitahuan Manager. Rekan kerja atas nama ${crew.name} di ${crew.station} terdeteksi telah over break.`);
          triggerSystemNotification(
            "🚨 OVERBREAK TERDETEKSI!",
            `Kru ${crew.name} (${crew.station}) telah melewati batas waktu istirahat!`
          );
        }
      }

      return {
        ...crew,
        duration: displayDuration,
        isOverBreak: isOver,
        isWarningBreak: isWarning
      };
    }));
  }, [isManager, speakAiVoice, triggerSystemNotification]);

  const updateWaterBreaksLocally = useCallback(() => {
    setWaterBreaks(prev => prev.map(wb => {
      if (!wb.rawRawStart) return wb;
      const elapsedSec = Math.floor((Date.now() - wb.rawRawStart.getTime()) / 1000);
      const totalAllowedSec = wb.allowedSec || 600; 
      const remainingSec = totalAllowedSec - elapsedSec;
      const isOver = remainingSec <= 0;

      let displayCountdown = '';
      if (isOver) {
        const overSec = Math.abs(remainingSec);
        const overMins = Math.max(1, Math.floor(overSec / 60));
        displayCountdown = `Over +${Math.floor(overSec / 60)}m ${overSec % 60}s (Poin -${overMins})`;
      } else {
        displayCountdown = `${Math.floor(remainingSec / 60)}m ${remainingSec % 60}s sisa`;
      }

      return {
        ...wb,
        duration: displayCountdown,
        isOverBreak: isOver,
        elapsedSec,
        allowedSec: totalAllowedSec
      };
    }));
  }, []);

  const handleStopWaterbreak = async (crewId) => {
    try {
      const targetId = crewId || user?.id;
      if (!targetId) return;

      const currentWb = waterBreaks.find(w => w.id === targetId);
      let pointDeduction = 0;
      if (currentWb && currentWb.isOverBreak) {
        const overSec = currentWb.elapsedSec - currentWb.allowedSec;
        pointDeduction = Math.max(1, Math.floor(overSec / 60));
      }

      const { data: targetProfile } = await supabase
        .from('user_profiles')
        .select('total_points')
        .eq('id', targetId)
        .maybeSingle();

      if (targetProfile && pointDeduction > 0) {
        const existingPts = targetProfile.total_points !== null && targetProfile.total_points !== undefined ? Number(targetProfile.total_points) : 100;
        const newPts = existingPts - pointDeduction;

        await supabase
          .from('user_profiles')
          .update({ total_points: newPts })
          .eq('id', targetId);
      }

      const { error } = await supabase
        .from('user_profiles')
        .update({
          current_izin_start: null,
          current_izin_duration: null,
          current_izin_type: null
        })
        .eq('id', targetId);

      if (error) throw error;
      
      alert(`✓ Status Waterbreak Selesai!${pointDeduction > 0 ? ` (-${pointDeduction} Poin)` : ''}`);
      await Promise.all([
        fetchAttendanceStatus(),
        fetchLiveBreakData(),
        fetchLeaderboard(),
        fetchActiveShiftStats()
      ]);
    } catch (err) {
      alert(`Gagal menghentikan waterbreak: ${err.message}`);
    }
  };

  const formatWITATime = (date) => {
    try {
      return date.toLocaleTimeString('id-ID', {
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZone: 'Asia/Makassar'
      });
    } catch (e) {
      return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    }
  };

  useEffect(() => {
    const clockTimer = setInterval(() => setCurrentSystemTime(new Date()), 1000);
    return () => clearInterval(clockTimer);
  }, []);

  useEffect(() => {
    return () => {
      if (localStreamRef.current) localStreamRef.current.getTracks().forEach(t => t.stop());
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  useEffect(() => {
    const liveTrackerTimer = setInterval(() => {
      if (liveBreaks.length > 0) updateDurationsLocally();
      if (waterBreaks.length > 0) updateWaterBreaksLocally();
    }, 1000);
    return () => clearInterval(liveTrackerTimer);
  }, [liveBreaks.length, waterBreaks.length, updateDurationsLocally, updateWaterBreaksLocally]);

  useEffect(() => {
    let timer = null;
    if (isOnBreak) {
      timer = setInterval(async () => {
        const savedStart = localStorage.getItem('resto_break_start_time');
        const savedDuration = localStorage.getItem('resto_break_max_duration') || '3600';
        
        if (savedStart) {
          const maxDurationSec = parseInt(savedDuration);
          const elapsedSeconds = Math.floor((Date.now() - parseInt(savedStart)) / 1000);
          const remaining = maxDurationSec - elapsedSeconds;
          
          setTimeLeft(remaining);
          setMaxBreakDuration(maxDurationSec);

          if (remaining <= 300 && remaining > 0 && !hasPlayed5MinAlarm) {
            setHasPlayed5MinAlarm(true);
            speakAiVoice("Halo rekan crew, waktu istirahat Anda tersisa lima menit lagi. Silakan bersiap-siap kembali ke station kerja ya.");
            triggerSystemNotification(
              "⏰ WAKTU ISTIRAHAT TERSISA 5 MENIT!",
              "Waktu break Anda hampir selesai (sisa 5 menit). Silakan bersiap kembali ke station kerja."
            );
          }

          if (remaining === 0 && !hasPlayed0MinAlarm) {
            setHasPlayed0MinAlarm(true);
            speakAiVoice("Waktu istirahat Anda telah selesai. Mohon segera kembali ke station dan lakukan presensi selesai break.");
            triggerSystemNotification(
              "🔔 WAKTU BREAK SELESAI!",
              "Alokasi break Anda telah habis. Harap segera lakukan foto selesai istirahat."
            );
          }

          if (remaining < 0 && !hasNotifiedOverbreak && activeLogId) {
            setHasNotifiedOverbreak(true);
            speakAiVoice("Perhatian, waktu istirahat Anda telah melewati batas atau over break. Poin kedisiplinan mulai terpotong otomatis.");
            triggerSystemNotification(
              "🚨 ANDA OVERBREAK!",
              "Waktu break telah melewati batas! Poin kedisiplinan Anda mulai terpotong otomatis per menit."
            );

            try {
              await supabase
                .from('attendance_logs')
                .update({ discipline_status: 'Overbreak' })
                .eq('id', activeLogId);
            } catch(e) {
              console.error("Gagal update overbreak status:", e);
            }
          }
        }
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isOnBreak, hasPlayed5MinAlarm, hasPlayed0MinAlarm, hasNotifiedOverbreak, activeLogId, speakAiVoice, triggerSystemNotification]);

  useEffect(() => {
    if (activeTab === 'history') {
      fetchBreakLogs();
    } else if (activeTab === 'live-break') {
      fetchLiveBreakData();
    } else if (activeTab === 'leaderboard') {
      fetchLeaderboard();
    } else if (activeTab === 'all-logs') {
      if (logSubTab === 'summary') {
        fetchAttendanceSummaryList();
      } else if (!isLogsFetchedRef.current) {
        setLogsPage(0);
        setHasMoreLogs(true);
        fetchAllCrewLogs(false, 0);
        isLogsFetchedRef.current = true;
      }
    } else if (activeTab === 'profile' && profile) {
      setEditName(profile.full_name || '');
      setEditPhone(profile.whatsapp_number || '');
      setEditAvatar(profile.avatar || '');
    }
  }, [activeTab, logSubTab, profile, fetchBreakLogs, fetchLiveBreakData, fetchLeaderboard, fetchAllCrewLogs, fetchAttendanceSummaryList]);

  useEffect(() => {
    if (user?.id) {
      fetchAttendanceStatus();
      fetchAllProfilesList(); 
      fetchActiveShiftStats(); 
    }
    const hour = new Date().getHours();
    if (hour < 11) {
      setGreeting('Selamat Pagi');
      setMotivationQuote('Awali shift dengan senyuman, layani pelanggan dengan standar terbaik! ☕');
    } else if (hour < 15) {
      setGreeting('Selamat Siang');
      setMotivationQuote('Tetap jaga fokus dan energi di jam-jam sibuk outlet! Semangat! 🔥');
    } else {
      setGreeting('Selamat Malam');
      setMotivationQuote('Terima kasih atas dedikasi hebatmu menjaga kualitas outlet hari ini! 🌟');
    }
  }, [user, fetchAttendanceStatus, fetchAllProfilesList, fetchActiveShiftStats]);

  const runLiveHumanDetection = () => {
    if (!videoRef.current || capturedImage) return;
    setHumanDetectionStatus("HUMAN_DETECTED");
    if (isCameraOpen && !capturedImage) {
      animationFrameRef.current = requestAnimationFrame(runLiveHumanDetection);
    }
  };

  const triggerCheckInProcess = () => {
    setShowShiftPicker(true);
  };

  const handleConfirmShiftAndOpenCamera = () => {
    setShowShiftPicker(false);
    openCamera('IN');
  };

  const openCamera = async (mode) => {
    if (mode === 'START_BREAK') {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const { data: existingBreaks } = await supabase
        .from('attendance_logs')
        .select('break_start_time')
        .eq('user_id', user.id)
        .gte('created_at', todayStart.toISOString())
        .not('break_start_time', 'is', null);

      if (existingBreaks && existingBreaks.length >= 1) {
        alert("🔒 Akses Ditolak: Anda sudah mengambil jatah 1 kali break untuk shift hari ini.");
        return;
      }
    }

    if (!navigator.geolocation) {
      alert("❌ Browser Anda tidak mendukung sensor lokasi (Geolocation API).");
      return;
    }

    setIsVerifyingLocation(true);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;
        setUserLocation({ lat: userLat, lng: userLng });

        let targetLat = TARGET_LAT;
        let targetLng = TARGET_LNG;
        let allowedRadius = MAX_RADIUS_METERS;

        try {
          if (user?.id) {
            const { data: prof } = await supabase
              .from('user_profiles')
              .select('company_id')
              .eq('id', user.id)
              .maybeSingle();

            if (prof?.company_id) {
              const { data: rulesData } = await supabase
                .from('companies') 
                .select('latitude, longitude, radius_meter')
                .eq('id', prof.company_id)
                .maybeSingle();
              
              if (rulesData) {
                if (rulesData.latitude) targetLat = parseFloat(rulesData.latitude);
                if (rulesData.longitude) targetLng = parseFloat(rulesData.longitude);
                if (rulesData.radius_meter) allowedRadius = parseFloat(rulesData.radius_meter);
              }
            }
          }
        } catch (dbError) {
          console.log("Fallback geofence:", dbError);
        }

        const distance = getDistanceFromLatLonInMeters(userLat, userLng, targetLat, targetLng);

        if (distance > allowedRadius) {
          alert(`❌ AKSES DITOLAK: Anda terdeteksi berada ${Math.round(distance)} meter di luar area outlet harian. Fitur presensi dikunci.`);
          setIsVerifyingLocation(false);
          return;
        }

        setIsVerifyingLocation(false);
        setCameraMode(mode);
        setCapturedImage(null);
        setIsCameraOpen(true);
        setHumanDetectionStatus("LOADING_ENGINE");
        
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }
          });
          localStreamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.onloadedmetadata = () => {
              videoRef.current.play();
              setTimeout(() => runLiveHumanDetection(), 500); 
            };
          }
        } catch (err) {
          alert("Gagal memuat kamera perangkat. Silakan periksa izin browser.");
          setIsCameraOpen(false);
          setHumanDetectionStatus("NOT_DETECTED");
        }
      },
      () => {
        setIsVerifyingLocation(false);
        alert("🔒 Gagal membaca lokasi GPS. Mohon izinkan akses lokasi di browser.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleCapture = () => {
    if (humanDetectionStatus !== 'HUMAN_DETECTED' || !videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 720;
    canvas.height = video.videoHeight || 1280;
    const ctx = canvas.getContext('2d');
    
    ctx.translate(canvas.width, 0); 
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);

    setCapturedImage(dataUrl);
    setHumanDetectionStatus('SUCCESS');
  };

  const handleConfirmSubmission = async () => {
    if (!capturedImage || humanDetectionStatus !== 'SUCCESS' || !user?.id) {
      alert("Sesi tidak valid.");
      return;
    }
    setIsLoading(true);

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }

    try {
      const timestampIso = new Date().toISOString();
      const now = new Date();
      let publicUrl = null;

      if (cameraMode === 'START_BREAK' || cameraMode === 'END_BREAK' || cameraMode === 'IN' || cameraMode === 'OUT') {
        const res = await fetch(capturedImage);
        const blob = await res.blob();
        
        const compressed = await imageCompression(blob, { 
          maxSizeMB: 0.05, 
          maxWidthOrHeight: 720, 
          useWebWorker: true,
          fileType: 'image/jpeg'
        });
        
        const filePath = `logs/${user.id}-${Date.now()}.jpg`;

        const { error: uploadError } = await supabase.storage
          .from('attendance-proofs')
          .upload(filePath, compressed, {
            contentType: 'image/jpeg',
            cacheControl: '31536000',
            upsert: true
          });

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from('attendance-proofs')
          .getPublicUrl(filePath);

        publicUrl = publicUrlData?.publicUrl || `https://nbfuhpfoqkwwdkpnlgwz.supabase.co/storage/v1/object/public/attendance-proofs/${filePath}`;
      }

      if (cameraMode === 'IN') {
        const fallbackCompanyId = profile?.company_id || user?.user_metadata?.company_id || null;
        const scheduledTime = new Date();
        scheduledTime.setHours(selectedShiftHour, 0, 0, 0);

        const actualStationPlacement = isManager ? 'Manager' : selectedStation;

        let statusInText = `Shift ${selectedShiftHour.toString().padStart(2, '0')}:00 (Tepat Waktu) - ${actualStationPlacement}`;
        let lateMinutes = 0;
        let financialLoss = 0;

        if (now > scheduledTime) {
          lateMinutes = Math.floor((now.getTime() - scheduledTime.getTime()) / 60000);
          statusInText = `Shift ${selectedShiftHour.toString().padStart(2, '0')}:00 (Terlambat ${lateMinutes}m) - ${actualStationPlacement}`;
          financialLoss = lateMinutes * 1000; 
        }

        if (!isManager) {
          await supabase
            .from('user_profiles')
            .update({ station_placement: actualStationPlacement })
            .eq('id', user.id);
        }

        const { error: insertError } = await supabase
          .from('attendance_logs')
          .insert({ 
            user_id: user.id, 
            company_id: fallbackCompanyId, 
            actual_in: timestampIso, 
            status_in: statusInText, 
            discipline_status: lateMinutes > 0 ? 'Terlambat Masuk' : 'Bekerja',
            penalty_points: lateMinutes > 0 ? lateMinutes : 0,
            financial_loss_amount: financialLoss
          });

        if (insertError) throw insertError;

        if (lateMinutes > 0) {
          const { data: currentProf } = await supabase
            .from('user_profiles')
            .select('total_points')
            .eq('id', user.id)
            .maybeSingle();

          const existingPts = currentProf?.total_points ?? 100;
          const updatedPts = Number(existingPts) - lateMinutes;

          await supabase
            .from('user_profiles')
            .update({ total_points: updatedPts })
            .eq('id', user.id);
        }

      } else if (cameraMode === 'START_BREAK') {
        const { data: latestActiveLog } = await supabase
          .from('attendance_logs')
          .select('id, actual_in')
          .eq('user_id', user.id)
          .is('actual_out', null)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        const targetLogId = latestActiveLog?.id || activeLogId;

        if (targetLogId) {
          await supabase
            .from('attendance_logs')
            .update({
              break_start_time: timestampIso,
              image_url: publicUrl,
              discipline_status: 'Sedang Istirahat'
            })
            .eq('id', targetLogId);

          let currentHourStr = '0';
          const refTime = latestActiveLog?.actual_in ? new Date(latestActiveLog.actual_in) : (checkInTime || new Date());
          try { currentHourStr = refTime.getHours().toString(); } catch(e) {}
          const checkInHr = parseInt(currentHourStr);
          const breakDurationSec = (selectedShiftHour === 22 || checkInHr === 22) ? 1800 : 3600;

          localStorage.setItem('resto_break_start_time', Date.now().toString());
          localStorage.setItem('resto_break_max_duration', breakDurationSec.toString());
          
          setIsOnBreak(true);
          setTimeLeft(breakDurationSec);
          setMaxBreakDuration(breakDurationSec);
          setHasPlayed5MinAlarm(false);
          setHasPlayed0MinAlarm(false);
          setHasNotifiedOverbreak(false);
          setBreakStartTime(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Makassar' }) + ' WITA');
        }
      } else if (cameraMode === 'END_BREAK') {
        const { data: latestActiveLog } = await supabase
          .from('attendance_logs')
          .select('id, break_start_time, actual_in')
          .eq('user_id', user.id)
          .is('actual_out', null)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        const targetLogId = latestActiveLog?.id || activeLogId;

        if (targetLogId && latestActiveLog?.break_start_time) {
          const startTimeMs = new Date(latestActiveLog.break_start_time).getTime();
          const endTimeMs = new Date().getTime();
          const elapsedMins = Math.floor((endTimeMs - startTimeMs) / 60000);
          
          let checkInHour = latestActiveLog.actual_in ? new Date(latestActiveLog.actual_in).getHours() : 0;
          const allowedMins = (selectedShiftHour === 22 || checkInHour === 22) ? 30 : 60;
          const isOver = elapsedMins > allowedMins;

          let penaltyPoints = 0;
          let pointChange = 0; 
          let financialLoss = 0;
          let finalStatus = 'Bekerja';

          if (isOver) {
            const overMins = elapsedMins - allowedMins;
            penaltyPoints = overMins; 
            pointChange = -overMins; 
            financialLoss = overMins * 1000;             
            finalStatus = 'Overbreak';
          } else {
            penaltyPoints = 0;
            pointChange = 5; 
          }

          const { error: updateError } = await supabase
            .from('attendance_logs')
            .update({
              break_end_time: timestampIso,
              after_break_image_url: publicUrl, 
              discipline_status: finalStatus,
              penalty_points: penaltyPoints,
              financial_loss_amount: financialLoss,
              points_calculated: true
            })
            .eq('id', targetLogId);

          if (updateError) throw updateError;

          const { data: currentProf } = await supabase
            .from('user_profiles')
            .select('total_points')
            .eq('id', user.id)
            .maybeSingle();

          const existingPoints = currentProf?.total_points ?? 100;
          const updatedPoints = Number(existingPoints) + pointChange;

          await supabase
            .from('user_profiles')
            .update({ total_points: updatedPoints })
            .eq('id', user.id);

          localStorage.removeItem('resto_break_start_time');
          localStorage.removeItem('resto_break_max_duration');
          setIsOnBreak(false);
          setBreakStartTime(null);
        }
      } else if (cameraMode === 'OUT') {
        // Poin 3: Absen Pulang Tercatat & Deteksi Pulang Cepat
        const { data: latestActiveLog } = await supabase
          .from('attendance_logs')
          .select('id, actual_in, status_in')
          .eq('user_id', user.id)
          .is('actual_out', null)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        const targetLogId = latestActiveLog?.id || activeLogId;

        if (targetLogId && latestActiveLog?.actual_in) {
          const inDate = new Date(latestActiveLog.actual_in);
          const workedHours = (now.getTime() - inDate.getTime()) / (1000 * 60 * 60);

          let checkInHour = inDate.getHours();
          const targetRequiredHours = (selectedShiftHour === 22 || checkInHour === 22) ? 8 : 9;

          let statusOutText = 'Sesuai Jadwal';
          let earlyPenalty = 0;
          let earlyFinancialLoss = 0;

          if (workedHours < targetRequiredHours) {
            const missingMinutes = Math.floor((targetRequiredHours * 60) - (workedHours * 60));
            statusOutText = `Pulang Cepat (${missingMinutes}m)`;
            earlyPenalty = Math.min(30, Math.max(5, Math.floor(missingMinutes / 10) * 5)); // Pengurangan poin indisipliner
            earlyFinancialLoss = missingMinutes * 1000;
          }

          await supabase.from('attendance_logs').update({
            actual_out: timestampIso,
            status_out: statusOutText,
            discipline_status: workedHours < targetRequiredHours ? 'Pulang Lebih Awal' : 'Shift Selesai',
            penalty_points: earlyPenalty,
            financial_loss_amount: earlyFinancialLoss
          }).eq('id', targetLogId);

          if (earlyPenalty > 0) {
            const { data: currentProf } = await supabase
              .from('user_profiles')
              .select('total_points')
              .eq('id', user.id)
              .maybeSingle();

            const existingPts = currentProf?.total_points ?? 100;
            await supabase
              .from('user_profiles')
              .update({ total_points: Math.max(0, Number(existingPts) - earlyPenalty) })
              .eq('id', user.id);
          }
        }
      }

      isLogsFetchedRef.current = false;
      await fetchAttendanceStatus();
      if (activeTab === 'history') await fetchBreakLogs(); 
      await fetchLiveBreakData();
      await fetchLeaderboard(); 
      await fetchActiveShiftStats(); 
      if (activeTab === 'all-logs' && logSubTab === 'summary') await fetchAttendanceSummaryList();
      
      setIsCameraOpen(false);
      setCapturedImage(null);
      alert("✓ Data Presensi Pulang & Kedisiplinan Berhasil Diperbarui!");
    } catch (err) {
      alert(`Gagal sinkronisasi data: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGrantIzin = async (e) => {
    e.preventDefault();
    if (!selectedCrewId) return alert('Silakan pilih crew terlebih dahulu');
    setIsSubmittingIzin(true);
    try {
      const startIso = new Date().toISOString();
      const durationValue = selectedIzinType === 'custom' ? parseInt(customIzinMinutes) : 10;

      const { error } = await supabase
        .from('user_profiles')
        .update({
          current_izin_start: startIso,
          current_izin_duration: durationValue,
          current_izin_type: selectedIzinType.toUpperCase()
        })
        .eq('id', selectedCrewId);

      if (error) throw error;
      alert('✓ Otorisasi izin sementara berhasil diberikan ke radar crew!');
      fetchLiveBreakData();
    } catch (err) {
      alert(`Gagal memberikan izin: ${err.message}`);
    } finally {
      setIsSubmittingIzin(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;
    
    try {
      setIsUpdatingProfile(true);
      const compressed = await imageCompression(file, { maxSizeMB: 0.05, maxWidthOrHeight: 400 });
      const filePath = `avatars/${user.id}-${Date.now()}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from('attendance-proofs')
        .upload(filePath, compressed, {
          contentType: 'image/jpeg',
          cacheControl: '31536000',
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('attendance-proofs')
        .getPublicUrl(filePath);

      const publicUrl = publicUrlData?.publicUrl;

      if (publicUrl) {
        setEditAvatar(publicUrl);
      }
    } catch (err) {
      console.error("Gagal unggah foto:", err);
      alert(`Gagal unggah foto profil: ${err.message}`);
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!user?.id) return;
    setIsUpdatingProfile(true);

    try {
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({
          full_name: editName,
          whatsapp_number: editPhone,
          avatar: editAvatar
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      if (newPassword) {
        const { error: passError } = await supabase.auth.updateUser({ password: newPassword });
        if (passError) throw passError;
        setOldPassword('');
        setNewPassword('');
      }

      alert('✓ Profil Anda berhasil diperbarui!');
      await fetchAttendanceStatus();
      await fetchLeaderboard();
    } catch (err) {
      alert(`Gagal perbarui profil: ${err.message}`);
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const currentUserPoints = profile?.total_points !== null && profile?.total_points !== undefined ? Number(profile.total_points) : 100;
  const activeBadge = getCrewBadge(currentUserPoints);
  
  const activeLeaderboardData = (isManager && leaderboardCategory === 'manager') ? managerLeaderboard : leaderboard;
  const activeInfractionRanking = (isManager && leaderboardCategory === 'manager') ? managerInfractionRankings : crewInfractionRankings;
  const activeLogData = (isManager && logCategory === 'manager') ? managerCrewLogs : allCrewLogs;

  const topTierList = activeLeaderboardData
    .filter(c => !c.isBebal)
    .sort((a, b) => b.points - a.points);

  const bebalList = activeLeaderboardData
    .filter(c => c.isBebal)
    .sort((a, b) => a.points - b.points);

  const filterByStation = (list) => {
    if (selectedStationFilter === 'ALL') return list;
    return list.filter(item => {
      const st = (item.station || item.role || '').toLowerCase();
      return st.includes(selectedStationFilter.toLowerCase());
    });
  };

  const currentFilteredLate = filterByStation(activeInfractionRanking.topLate);
  const currentFilteredOverbreak = filterByStation(activeInfractionRanking.topOverbreak);
  const currentFilteredGhosting = filterByStation(activeInfractionRanking.topGhosting);
  const currentFilteredSoc = filterByStation(activeInfractionRanking.topSoc);

  return (
    <div className="min-h-screen w-full bg-[#F8FAFC] flex justify-center font-sans antialiased text-slate-800">
      
      <style>{`
        header.sticky.top-0, 
        div.min-h-screen > header,
        body > div > header {
          display: none !important;
        }
      `}</style>

      <div className="w-full max-w-md bg-[#F8FAFC] min-h-screen flex flex-col relative pb-20">
        
        {/* ================= HEADER APLIKASI UTAMA (1 BARIS BERSIH) ================= */}
        <div className="sticky top-0 w-full bg-white px-5 py-3.5 border-b border-slate-100 flex items-center justify-between z-30 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <img 
              src="/Diciplin-logo.png" 
              onError={(e) => { 
                e.currentTarget.onerror = null;
                e.currentTarget.src = "/logo.png";
              }} 
              alt="Diciplin Logo" 
              className="h-8 w-auto object-contain" 
            />
            <div className="flex flex-col">
              <span className="font-sans font-black text-base tracking-tight text-slate-900 leading-none">
                Diciplin<span className="text-indigo-600">.com</span>
              </span>
              <span className="text-[8px] font-bold text-slate-400 tracking-wider uppercase mt-0.5">Crew Attendance System</span>
            </div>
          </div>
          
          <button 
            onClick={async () => { await supabase.auth.signOut(); }} 
            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 text-[10px] font-extrabold rounded-xl border border-rose-100 uppercase tracking-wider transition-all active:scale-95 cursor-pointer"
          >
            Keluar
          </button>
        </div>

        {/* ================= TAB 1: ABSENSI UTAMA ================= */}
        {activeTab === 'absen' && (
          <div className="flex-1 px-4 py-4 space-y-3.5">
            
            {/* HERO PROFILE CARD */}
            <div className="bg-white border border-slate-200/80 rounded-[20px] p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <img src={profile?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100"} alt="Avatar" className="h-12 w-12 rounded-xl object-cover border border-slate-100 shadow-2xs" />
                    <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 bg-emerald-500 border-2 border-white rounded-full"></span>
                  </div>
                  <div>
                    <p className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest">{greeting}</p>
                    <h1 className="text-sm font-black tracking-tight text-slate-900">{profile?.full_name || 'Crew Member'}</h1>
                  </div>
                </div>
                
                <div className="flex flex-col items-end gap-1">
                  <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 text-[9px] font-black rounded-full tracking-wider uppercase border border-indigo-100">{profile?.station_placement || 'Staff Crew'}</span>
                  <span className={`text-[8px] px-2 py-0.5 rounded-md font-black border uppercase ${activeBadge.color}`}>{activeBadge.name}</span>
                </div>
              </div>

              {/* JAM OPERASIONAL WIDGET */}
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                  <FiClock className="text-indigo-600 text-base" />
                  <span>Jam Operasional Valid</span>
                </div>
                <div className="flex items-center gap-1.5 bg-white border border-slate-200/80 px-2.5 py-1 rounded-lg shadow-2xs">
                  <span className="font-mono text-base font-black text-slate-900 tracking-wider">
                    {formatWITATime(currentSystemTime)}
                  </span>
                  <span className="text-[9px] font-extrabold text-indigo-600">WITA</span>
                </div>
              </div>
            </div>

            {/* LIVE STATION MONITORING */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs space-y-3.5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Live Station Monitoring</h3>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                    Total IC: {activeShiftStats.totalScheduledCrew}
                  </span>
                  <span className="text-[9px] font-black text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                    {activeShiftStats.totalActiveNow} Standby
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="bg-gradient-to-br from-indigo-50/70 to-slate-50 border border-indigo-100/70 rounded-xl p-2.5 flex items-center gap-2.5">
                  <div className="p-2 bg-indigo-600 text-white rounded-lg text-xs font-black shadow-xs">
                    <FiUserCheck />
                  </div>
                  <div>
                    <p className="text-[8px] font-extrabold text-slate-400 uppercase tracking-wider">Crew In Charge</p>
                    <p className="text-xs font-black text-slate-900">{activeShiftStats.staffActive} <span className="text-[9px] font-semibold text-slate-500">Staff</span></p>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-emerald-50/70 to-slate-50 border border-emerald-100/70 rounded-xl p-2.5 flex items-center gap-2.5">
                  <div className="p-2 bg-emerald-600 text-white rounded-lg text-xs font-black shadow-xs">
                    <FiBriefcase />
                  </div>
                  <div>
                    <p className="text-[8px] font-extrabold text-slate-400 uppercase tracking-wider">Manager Duty</p>
                    <p className="text-xs font-black text-slate-900">{activeShiftStats.managerActive} <span className="text-[9px] font-semibold text-slate-500">Orang</span></p>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <FiLayers className="text-indigo-600 text-xs"/> Personil Aktif per Station
                  </p>
                  <span className="text-[8px] font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">Live Counter</span>
                </div>

                {Object.keys(activeShiftStats.stationCounts).length === 0 ? (
                  <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl py-3 text-center text-[10px] font-semibold text-slate-400">
                    Tidak ada crew yang sedang standby di station.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-0.5">
                    {Object.entries(activeShiftStats.stationCounts).map(([stationName, count]) => (
                      <div key={stationName} className="bg-slate-50 hover:bg-indigo-50/40 border border-slate-200/80 rounded-xl p-2.5 flex flex-col justify-between transition-all min-h-[58px]">
                        <span className="text-[10px] font-extrabold text-slate-700 leading-snug break-words">
                          {stationName}
                        </span>
                        <div className="flex justify-end mt-1.5">
                          <span className="text-[9px] font-black font-mono bg-slate-900 text-white px-2 py-0.5 rounded-md shadow-2xs">
                            {count} Orang
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {isVerifyingLocation && (
              <div className="bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs rounded-xl p-3 flex items-center justify-center gap-2 font-bold animate-pulse">
                <FiMapPin className="animate-bounce text-sm"/> Mengunci GPS Outlet...
              </div>
            )}

            {/* WATERBREAK ACTIVE NOTIFICATION */}
            {profile?.current_izin_start && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl p-3 shadow-2xs flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center text-sm font-black"><FiDroplet/></div>
                  <div>
                    <p className="text-[9px] font-black text-emerald-800 uppercase tracking-wider">IZIN {profile.current_izin_type} AKTIF</p>
                    <p className="text-xs text-emerald-700 font-bold">Alokasi: {profile.current_izin_duration || 10} Menit</p>
                  </div>
                </div>
                <button
                  onClick={() => handleStopWaterbreak(user?.id)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] px-3 py-1.5 rounded-xl uppercase tracking-wider flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
                >
                  <FiCheck className="text-xs" /> Selesaikan
                </button>
              </div>
            )}

            {/* REMINDER BOX */}
            <div className="bg-white border border-slate-200/70 rounded-2xl p-3 shadow-2xs flex items-start gap-2.5">
              <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg flex-shrink-0"><FiStar className="text-xs"/></div>
              <div>
                <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest mb-0.5">Reminder Shift:</p>
                <p className="text-xs text-slate-700 leading-relaxed font-semibold">{motivationQuote}</p>
              </div>
            </div>

            {/* ================= SEJAJAR: MANAGER CONTROL PANEL & PELAPORAN INDISIPLINER ================= */}
            {(isManager || canReportViolation) && (
              <div className="space-y-3">
                {/* 1. MANAGER CONTROL PANEL (OTORISASI IZIN) */}
                {isManager && (
                  <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-md space-y-3 border border-slate-800">
                    <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                      <div className="p-1.5 bg-indigo-600 text-white rounded-lg"><FiShield className="text-xs" /></div>
                      <div>
                        <h3 className="text-xs font-black uppercase tracking-wider">Manager Control Panel</h3>
                        <p className="text-[9px] text-slate-400">Otorisasi izin darurat & waterbreak kru.</p>
                      </div>
                    </div>
                    <form onSubmit={handleGrantIzin} className="space-y-2.5">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] font-extrabold text-slate-400 uppercase">Pilih Anggota Crew</label>
                          <select 
                            value={selectedCrewId} 
                            onChange={(e) => setSelectedCrewId(e.target.value)} 
                            onClick={() => { if (allProfiles.length === 0) fetchAllProfilesList(); }}
                            className="bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white outline-none focus:border-indigo-500 font-medium"
                          >
                            <option value="" className="text-slate-900">
                              {allProfiles.length === 0 ? 'Memuat Staff...' : '-- Pilih Staff --'}
                            </option>
                            {allProfiles.map(p => (
                              <option key={p.id} value={p.id} className="text-slate-900">
                                {p.full_name} {p.station_placement ? `(${p.station_placement})` : ''}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] font-extrabold text-slate-400 uppercase">Jenis Alokasi Izin</label>
                          <select value={selectedIzinType} onChange={(e) => setSelectedIzinType(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white outline-none focus:border-indigo-500 font-medium">
                            <option value="toilet" className="text-slate-900">Toilet (10M)</option>
                            <option value="shalat" className="text-slate-900">Shalat (10M)</option>
                            <option value="makan" className="text-slate-900">Makan (10M)</option>
                            <option value="custom" className="text-slate-900">Custom Menit</option>
                          </select>
                        </div>
                      </div>
                      {selectedIzinType === 'custom' && (
                        <input type="number" value={customIzinMinutes} onChange={(e) => setCustomIzinMinutes(e.target.value)} placeholder="Masukkan menit khusus..." className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white outline-none" />
                      )}
                      <button type="submit" disabled={isSubmittingIzin} className="w-full bg-indigo-600 hover:bg-indigo-500 font-black py-2.5 rounded-xl text-xs uppercase tracking-wider shadow-sm flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] cursor-pointer">
                        <FiPlusCircle className="text-xs"/> Berikan Izin & Sync Radar
                      </button>
                    </form>
                  </div>
                )}

                {/* 2. PANEL PENCATATAN PELANGGARAN SOC / UNPROSEDURAL */}
                {canReportViolation && (
                  <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-2xl p-4 shadow-md space-y-3 border border-slate-800">
                    <div className="flex items-center gap-2 border-b border-slate-800 pb-2.5">
                      <div className="p-1.5 bg-orange-600 text-white rounded-lg">
                        <FiFileText className="text-xs" />
                      </div>
                      <div>
                        <h3 className="text-xs font-black uppercase tracking-wider">Input Tindakan Indisipliner</h3>
                        <p className="text-[9px] text-slate-400">Catat pelanggaran SOC & unprosedural kerja.</p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        if (allProfiles.length === 0) fetchAllProfilesList();
                        setShowReportViolationModal(true);
                      }}
                      className="w-full bg-orange-600 hover:bg-orange-500 text-white font-black py-2.5 rounded-xl text-xs uppercase tracking-wider shadow-sm flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] cursor-pointer"
                    >
                      <FiAlertTriangle className="text-xs" /> Buka Form Laporan Pelanggaran
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* PRESENSI UTAMA CARD (POIN 3: ABSEN PULANG FLEKSIBEL & CATAT SELISIH JAM) */}
            <div className="bg-white border border-slate-200/70 rounded-2xl p-4 shadow-xs space-y-3">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
                <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-1.5">
                  <FiShield className="text-indigo-600 text-sm" /> Presensi Shift Kerja
                </p>
                {checkInTime && (
                  <span className="text-[9px] text-emerald-700 font-black bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 uppercase tracking-wider">
                    Masuk: {checkInTime.toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit', timeZone: 'Asia/Makassar'})}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  disabled={hasCheckedIn || isVerifyingLocation}
                  onClick={triggerCheckInProcess}
                  className={`py-3.5 px-3 rounded-2xl border flex flex-col items-center justify-center gap-1.5 font-black text-xs transition-all duration-200 ${hasCheckedIn ? 'bg-emerald-50/80 border-emerald-200 text-emerald-700 shadow-inner' : 'bg-slate-50 hover:bg-slate-100 border-slate-200/80 text-slate-800 active:scale-[0.97]'}`}
                >
                  <div className={`p-2 rounded-xl ${hasCheckedIn ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-50 text-indigo-600'}`}>
                    <FiLogIn className="text-lg" />
                  </div>
                  <span>{hasCheckedIn ? 'Sudah Masuk ✓' : 'Absen Masuk'}</span>
                </button>

                <button
                  disabled={!hasCheckedIn || hasCheckedOut || isVerifyingLocation}
                  onClick={() => openCamera('OUT')}
                  className={`py-3.5 px-3 rounded-2xl border flex flex-col items-center justify-center gap-1.5 font-black text-xs transition-all duration-200 cursor-pointer active:scale-[0.97] ${hasCheckedOut ? 'bg-slate-100 border-slate-200 text-slate-400' : 'bg-slate-50 hover:bg-rose-50 border-slate-200/80 text-slate-800 hover:text-rose-700 hover:border-rose-200'}`}
                >
                  <div className={`p-2 rounded-xl ${hasCheckedOut ? 'bg-slate-200 text-slate-400' : 'bg-rose-50 text-rose-600'}`}>
                    <FiLogOut className="text-lg" />
                  </div>
                  <span>{hasCheckedOut ? 'Sudah Pulang ✓' : 'Absen Pulang'}</span>
                </button>
              </div>

              {hasCheckedIn && !hasCheckedOut && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 flex items-start gap-2">
                  <FiClock className="text-slate-500 mt-0.5 flex-shrink-0 text-sm" />
                  <p className="text-[10px] text-slate-600 font-semibold leading-relaxed">
                    Target shift: {requiredWorkHours} Jam Kerja. Jam checkout Anda akan tercatat langsung ke dashboard supervisor.
                  </p>
                </div>
              )}
            </div>

            {/* DYNAMIC BREAK ACTIVE CARD */}
            <div className="bg-white border border-slate-200/70 rounded-2xl p-4 shadow-xs">
              {isOnBreak ? (
                <div className="space-y-3">
                  {timeLeft < 0 ? (
                    <div className="bg-rose-600 text-white rounded-2xl p-4 space-y-2 text-center shadow-md animate-pulse">
                      <div className="flex items-center justify-between border-b border-white/20 pb-1.5">
                        <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider">
                          <FiAlertTriangle /> Overbreak Terdeteksi!
                        </div>
                        <span className="text-[8px] font-bold bg-white/20 px-2 py-0.5 rounded-md">Mulai: {breakStartTime}</span>
                      </div>
                      <h2 className="font-mono text-3xl font-black">{formatCountdown(timeLeft)}</h2>
                      <p className="text-[9px] text-rose-100 font-bold">Poin terpotong otomatis (-1 Poin/Menit). Segera kembali!</p>
                    </div>
                  ) : (
                    <div className="space-y-2 text-center">
                      <div className="flex items-center justify-between text-[9px] font-black tracking-widest text-slate-400 border-b border-slate-100 pb-2">
                        <span className="flex items-center gap-1.5 text-indigo-600">
                          <span className="h-2 w-2 rounded-full bg-indigo-600 animate-ping" /> BREAK AKTIF
                        </span>
                        <span className="font-mono text-xs text-slate-700 font-bold">MULAI: {breakStartTime || '--:--'}</span>
                      </div>
                      <h2 className="font-mono text-4xl font-black text-slate-900 tracking-tight py-1">{formatCountdown(timeLeft)}</h2>
                      <p className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest">Sisa Alokasi Waktu Istirahat</p>
                    </div>
                  )}

                  <button 
                    disabled={isVerifyingLocation}
                    onClick={() => openCamera('END_BREAK')} 
                    className="w-full bg-rose-600 hover:bg-rose-700 text-white font-black py-3 rounded-xl text-xs tracking-wider shadow-md shadow-rose-600/20 transition-all active:scale-[0.98] cursor-pointer"
                  >
                    Akhiri Waktu Break
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-[10px] text-slate-500 font-black uppercase tracking-wider">
                    <span className="flex items-center gap-1.5">
                      <FiCoffee className="text-indigo-600 text-base" /> 
                      Alokasi: {selectedShiftHour === 22 ? '30 Menit' : '60 Menit'}
                    </span>
                    <span className={`text-[8px] px-2.5 py-0.5 rounded-full font-black border uppercase tracking-wider ${hasCheckedIn && !hasCheckedOut ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-slate-100 text-slate-400'}`}>{hasCheckedIn && !hasCheckedOut ? 'Ready' : 'Locked'}</span>
                  </div>
                  <button
                    disabled={!hasCheckedIn || hasCheckedOut || isVerifyingLocation}
                    onClick={() => openCamera('START_BREAK')}
                    className={`w-full py-3.5 px-4 rounded-xl font-black text-xs tracking-wider transition-all duration-200 cursor-pointer ${hasCheckedIn && !hasCheckedOut ? 'bg-slate-900 hover:bg-slate-800 text-white shadow-md active:scale-[0.98]' : 'bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed'}`}
                  >
                    Ambil Absen Istirahat (Mulai Timer)
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 2: LIVE MONITORING ================= */}
        {activeTab === 'live-break' && (
          <div className="flex-1 px-4 py-4 space-y-4">
            <div className="flex items-center justify-between bg-white border border-slate-200/70 rounded-2xl p-3.5 shadow-xs">
              <div>
                <h2 className="text-sm font-black text-slate-900 tracking-tight">Live Pemantauan Crew</h2>
                <p className="text-[10px] text-slate-400 font-bold">Sinkronisasi radar geofence & station pos aktif.</p>
              </div>
              
              {isManager && (
                <button 
                  onClick={() => speakAiVoice("Radar pemantauan aktif dan sistem alarm suara manager siap membunyikan peringatan overbreak.")}
                  className="flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-xl transition-colors cursor-pointer"
                >
                  <FiVolume2 className="text-emerald-600 text-xs animate-bounce" />
                  <span className="text-[9px] font-bold text-emerald-700 tracking-wider uppercase">TES AUDIO</span>
                </button>
              )}
            </div>

            {/* MAIN BREAK ACTIVE */}
            <div className="space-y-2.5">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                <FiCoffee className="text-indigo-600 text-sm" /> Main Break Active ({liveBreaks.length})
              </h3>
              
              {isFetchingLive ? (
                <div className="text-center py-4 text-xs font-bold text-slate-400 animate-pulse">Menghubungkan Database...</div>
              ) : liveBreaks.length === 0 ? (
                <div className="bg-white border border-slate-200/70 rounded-2xl p-4 text-center text-xs text-slate-400 font-medium shadow-xs">
                  Semua crew sedang standby di station masing-masing (0 Crew Break).
                </div>
              ) : (
                <div className="space-y-2">
                  {liveBreaks.map(crew => (
                    <div key={crew.id} className={`border rounded-2xl p-3.5 flex items-center justify-between shadow-xs transition-all ${crew.isOverBreak ? 'border-rose-400 bg-rose-50/70 animate-pulse' : 'bg-white border-slate-200/70'}`}>
                      <div className="flex items-center space-x-3">
                        <div className={`h-9 w-9 rounded-xl flex items-center justify-center font-black text-xs uppercase border ${crew.isOverBreak ? 'bg-rose-600 text-white border-rose-700' : 'bg-indigo-50 text-indigo-600 border-indigo-100'}`}>
                          {crew.name.substring(0, 2)}
                        </div>
                        <div>
                          <h4 className={`text-xs font-bold tracking-tight ${crew.isOverBreak ? 'text-rose-700 font-black' : 'text-slate-900'}`}>{crew.name}</h4>
                          <p className="text-[9px] text-indigo-600 font-extrabold uppercase flex items-center gap-1">
                            <FiLayers className="text-indigo-500"/> {crew.station}
                          </p>
                        </div>
                      </div>
                      <div className="text-right flex flex-col items-end gap-0.5">
                        <span className={`font-mono text-xs font-black px-2.5 py-0.5 rounded-lg border ${crew.isOverBreak ? 'bg-rose-600 text-white border-rose-600 animate-bounce' : 'bg-slate-100 text-slate-800 border-slate-200'}`}>
                          {crew.duration}
                        </span>
                        <span className="text-[8px] font-bold text-slate-400">Mulai: {crew.start}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* GHOSTING ALERT */}
            <div className="space-y-2.5">
              <h3 className="text-[10px] font-black text-rose-600 uppercase tracking-widest flex items-center gap-1.5">
                <FiAlertTriangle className="text-rose-500 text-sm" /> Ghosting Alert ({ghostingCrew.length})
              </h3>
              {ghostingCrew.length === 0 ? (
                <div className="bg-white border border-slate-200/70 rounded-2xl p-4 text-center text-xs text-slate-400 font-medium shadow-xs">
                  Tidak ada indikasi crew menghilang dari lokasi kerja (0 Alert).
                </div>
              ) : (
                <div className="space-y-2">
                  {ghostingCrew.map(gc => (
                    <div key={gc.id} className="border border-rose-300 bg-rose-50/80 rounded-2xl p-3 flex items-center justify-between shadow-xs animate-pulse">
                      <div className="flex items-center space-x-2.5">
                        <div className="h-8 w-8 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center text-xs font-black"><FiAlertTriangle/></div>
                        <div>
                          <h4 className="text-xs font-bold text-rose-950">{gc.name}</h4>
                          <p className="text-[9px] text-indigo-600 font-bold uppercase">{gc.station} • {gc.distance}</p>
                        </div>
                      </div>
                      <span className="bg-rose-600 text-white text-[9px] font-black px-2 py-0.5 rounded-lg uppercase tracking-wider">GHOSTING DETECTED</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* SHORT WATERBREAK */}
            <div className="space-y-2.5">
              <h3 className="text-[10px] font-black text-emerald-700 uppercase tracking-widest flex items-center gap-1.5">
                <FiDroplet className="text-emerald-500 text-sm" /> Short Waterbreak Active ({waterBreaks.length})
              </h3>
              {waterBreaks.length === 0 ? (
                <div className="bg-white border border-slate-200/70 rounded-2xl p-4 text-center text-xs text-slate-400 font-medium shadow-xs">
                  Tidak ada crew mengambil izin pendek toilet/shalat (0 Active).
                </div>
              ) : (
                <div className="space-y-2">
                  {waterBreaks.map(wb => (
                    <div key={wb.id} className={`border rounded-2xl p-3 bg-white flex items-center justify-between border-slate-200/70 ${wb.isOverBreak ? 'border-rose-300 bg-rose-50/60' : ''}`}>
                      <div className="flex items-center space-x-2.5">
                        <div className="h-8 w-8 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center text-xs font-black"><FiDroplet/></div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-800">{wb.name}</h4>
                          <p className="text-[9px] text-emerald-600 font-black uppercase">{wb.station} • IZIN: {wb.type}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1.5">
                        <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded-lg border ${wb.isOverBreak ? 'bg-rose-600 text-white animate-pulse' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>{wb.duration}</span>
                        {isManager && (
                          <button
                            onClick={() => handleStopWaterbreak(wb.id)}
                            className="bg-slate-900 hover:bg-slate-800 text-white font-black text-[9px] px-2 py-1 rounded-lg uppercase transition-colors cursor-pointer"
                          >
                            Selesai
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 3: LEADERBOARD & REKAP INDISIPLINER ================= */}
        {activeTab === 'leaderboard' && (
          <div className="flex-1 px-4 py-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex flex-col space-y-0.5">
                <h2 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                  <FiAward className="text-amber-500 text-lg" /> Status & Evaluasi
                </h2>
                <p className="text-[10px] text-slate-400 font-medium">
                  {selectedMonth === currentMonthYear ? 'Data periode bulan berjalan.' : `Arsip data ${selectedMonth}.`}
                </p>
              </div>

              <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl px-2 py-1 shadow-2xs">
                <FiCalendar className="text-indigo-600 text-xs" />
                <input 
                  type="month" 
                  value={selectedMonth} 
                  onChange={(e) => setSelectedMonth(e.target.value)} 
                  className="text-[10px] font-black text-slate-700 bg-transparent outline-none cursor-pointer"
                />
              </div>
            </div>

            {/* SUB-NAVBAR TABS */}
            <div className="bg-slate-200/80 p-1 rounded-2xl flex gap-1 shadow-inner">
              <button
                onClick={() => setActiveSubTabLeaderboard('ranking')}
                className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${activeSubTabLeaderboard === 'ranking' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
              >
                <FiAward className="text-sm" /> Skor Poin
              </button>
              <button
                onClick={() => setActiveSubTabLeaderboard('indisipliner')}
                className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${activeSubTabLeaderboard === 'indisipliner' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
              >
                <FiAlertTriangle className="text-sm" /> Indisipliner
              </button>
            </div>

            {/* HANYA MUNCUL JIKA AKUN MANAGER */}
            {isManager && (
              <div className="bg-slate-200/80 p-1 rounded-2xl flex gap-1 shadow-inner">
                <button
                  onClick={() => setLeaderboardCategory('crew')}
                  className={`flex-1 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${leaderboardCategory === 'crew' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  Data Crew
                </button>
                <button
                  onClick={() => setLeaderboardCategory('manager')}
                  className={`flex-1 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${leaderboardCategory === 'manager' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  Data Manager 🔒
                </button>
              </div>
            )}

            {isFetchingLeaderboard ? (
              <div className="text-center py-8 text-xs text-slate-400 font-medium animate-pulse">Menghitung matriks evaluasi...</div>
            ) : activeSubTabLeaderboard === 'ranking' ? (
              /* VIEW 1: SKOR POIN */
              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest flex items-center gap-1">
                    🌟 PALING RAJIN ({leaderboardCategory === 'manager' && isManager ? 'MANAGER' : 'CREW'})
                  </p>
                  <div className="bg-white border border-slate-200/70 rounded-2xl divide-y divide-slate-100 shadow-xs overflow-hidden">
                    {topTierList.length === 0 ? (
                      <div className="p-4 text-center text-xs font-bold text-slate-400">Belum ada user di Top Tier.</div>
                    ) : (
                      topTierList.map((person, index) => (
                        <div 
                          className="p-3.5 flex items-center justify-between w-full hover:bg-slate-50/80 cursor-pointer transition-colors" 
                          key={person.id}
                          onClick={() => openInfractionDetailModal(person)}
                        >
                          <div className="flex items-center space-x-3">
                            <span className="font-mono text-xs font-bold text-slate-400 w-4">{index + 1}.</span>
                            <img src={person.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100"} loading="lazy" className="w-9 h-9 rounded-xl object-cover border border-slate-100 shadow-xs" alt="Avatar" />
                            <div>
                              <span className="text-xs font-bold text-slate-900 block">{person.name}</span>
                              <span className="text-[9px] text-indigo-600 font-black uppercase tracking-wider block">{person.role}</span>
                              <span className="text-[9px] text-slate-500 font-medium block mt-0.5 bg-slate-50 px-1.5 py-0.2 rounded border border-slate-100">{person.breakInfo}</span>
                            </div>
                          </div>
                          <span className="bg-emerald-50 text-emerald-700 text-xs font-black px-2.5 py-1 rounded-xl border border-emerald-200/60">{person.points} Pts</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest flex items-center gap-1">
                    ⚠️ PERLU EVALUASI ({leaderboardCategory === 'manager' && isManager ? 'MANAGER' : 'CREW'})
                  </p>
                  <div className="bg-white border border-slate-200/70 rounded-2xl divide-y divide-slate-100 shadow-xs overflow-hidden">
                    {bebalList.length === 0 ? (
                      <div className="p-4 text-center text-xs font-bold text-slate-400">0 User dalam zona bahaya kedisiplinan.</div>
                    ) : (
                      bebalList.map((person, index) => (
                        <div 
                          key={person.id} 
                          className="p-3.5 flex items-center justify-between bg-rose-50/20 hover:bg-rose-50/50 cursor-pointer transition-colors"
                          onClick={() => openInfractionDetailModal(person)}
                        >
                          <div className="flex items-center space-x-3">
                            <span className="font-mono text-xs font-bold text-rose-500 w-4">{index + 1}.</span>
                            <img src={person.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100"} loading="lazy" className="w-9 h-9 rounded-xl object-cover border border-rose-100 shadow-xs" alt="Avatar" />
                            <div>
                              <span className="text-xs font-bold text-rose-950 block">{person.name}</span>
                              <span className="text-[9px] text-rose-600 font-black uppercase tracking-wider block">{person.role}</span>
                              <span className="text-[9px] text-rose-900 font-medium block mt-0.5 bg-rose-100/40 px-1.5 py-0.2 rounded border border-rose-200">{person.breakInfo}</span>
                            </div>
                          </div>
                          <span className="bg-rose-100 text-rose-700 text-xs font-black px-2.5 py-1 rounded-xl border border-rose-200 flex items-center gap-1"><FiFrown /> {person.points} Pts</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* VIEW 2: INDISIPLINER DENGAN FILTER TABS & FILTER STATION */
              <div className="space-y-3.5">
                
                {/* FILTER PILLS KATEGORI INDISIPLINER */}
                <div className="grid grid-cols-4 gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/70">
                  <button
                    onClick={() => setSelectedInfractionCategory('late')}
                    className={`py-2 px-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all flex flex-col items-center justify-center gap-0.5 ${selectedInfractionCategory === 'late' ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'}`}
                  >
                    <span>Terlambat</span>
                    <span className="text-[8px] opacity-90">({activeInfractionRanking.topLate.length})</span>
                  </button>

                  <button
                    onClick={() => setSelectedInfractionCategory('overbreak')}
                    className={`py-2 px-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all flex flex-col items-center justify-center gap-0.5 ${selectedInfractionCategory === 'overbreak' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'}`}
                  >
                    <span>Overbreak</span>
                    <span className="text-[8px] opacity-90">({activeInfractionRanking.topOverbreak.length})</span>
                  </button>

                  <button
                    onClick={() => setSelectedInfractionCategory('ghosting')}
                    className={`py-2 px-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all flex flex-col items-center justify-center gap-0.5 ${selectedInfractionCategory === 'ghosting' ? 'bg-red-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'}`}
                  >
                    <span>Ghosting</span>
                    <span className="text-[8px] opacity-90">({activeInfractionRanking.topGhosting.length})</span>
                  </button>

                  <button
                    onClick={() => setSelectedInfractionCategory('soc')}
                    className={`py-2 px-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all flex flex-col items-center justify-center gap-0.5 ${selectedInfractionCategory === 'soc' ? 'bg-orange-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'}`}
                  >
                    <span>SOC/Lainnya</span>
                    <span className="text-[8px] opacity-90">({activeInfractionRanking.topSoc.length})</span>
                  </button>
                </div>

                {/* FILTER DROPDOWN STATION */}
                <div className="flex items-center justify-between bg-white border border-slate-200/80 px-3 py-2 rounded-xl shadow-2xs">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                    <FiFilter className="text-indigo-600" />
                    <span>Filter Station:</span>
                  </div>
                  <select
                    value={selectedStationFilter}
                    onChange={(e) => setSelectedStationFilter(e.target.value)}
                    className="text-xs font-bold bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-2.5 py-1 outline-none cursor-pointer"
                  >
                    <option value="ALL">Semua Station</option>
                    {CREW_STATION_OPTIONS.map((st) => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                    <option value="Manager">Manager Duty</option>
                  </select>
                </div>

                {/* KONTEN KATEGORI TERPILIH */}
                {selectedInfractionCategory === 'late' && (
                  <div className="space-y-2 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between px-1">
                      <p className="text-[10px] font-black text-amber-800 uppercase tracking-widest flex items-center gap-1.5">
                        <FiClock className="text-amber-600 text-xs" /> Ranking Terbanyak Terlambat
                      </p>
                      <span className="text-[8px] font-bold text-slate-400">Klik nama untuk detail</span>
                    </div>

                    <div className="bg-white border border-slate-200/70 rounded-2xl divide-y divide-slate-100 shadow-xs overflow-hidden">
                      {currentFilteredLate.length === 0 ? (
                        <div className="p-6 text-center text-xs font-semibold text-slate-400">
                          Nihil catatan terlambat pada {selectedStationFilter === 'ALL' ? 'semua station' : selectedStationFilter} ({selectedMonth}). 🌟
                        </div>
                      ) : (
                        currentFilteredLate.map((c, idx) => (
                          <div 
                            key={c.id} 
                            onClick={() => openInfractionDetailModal(c)}
                            className="p-3.5 flex items-center justify-between hover:bg-amber-50/40 cursor-pointer transition-colors"
                          >
                            <div className="flex items-center space-x-3">
                              <span className="font-mono text-xs font-black text-amber-600 w-4">{idx + 1}.</span>
                              <img src={c.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100"} loading="lazy" className="w-9 h-9 rounded-xl object-cover border border-amber-100 shadow-2xs" alt="Avatar" />
                              <div>
                                <span className="text-xs font-bold text-slate-900 block">{c.name}</span>
                                <span className="text-[9px] text-slate-400 font-bold uppercase">{c.role}</span>
                              </div>
                            </div>
                            <span className="bg-amber-100 text-amber-800 text-xs font-black px-2.5 py-1 rounded-xl border border-amber-200">
                              {c.count}x Telat ({c.totalMinutes}m)
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {selectedInfractionCategory === 'overbreak' && (
                  <div className="space-y-2 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between px-1">
                      <p className="text-[10px] font-black text-rose-800 uppercase tracking-widest flex items-center gap-1.5">
                        <FiCoffee className="text-rose-600 text-xs" /> Ranking Terbanyak Overbreak
                      </p>
                      <span className="text-[8px] font-bold text-slate-400">Klik nama untuk detail</span>
                    </div>

                    <div className="bg-white border border-slate-200/70 rounded-2xl divide-y divide-slate-100 shadow-xs overflow-hidden">
                      {currentFilteredOverbreak.length === 0 ? (
                        <div className="p-6 text-center text-xs font-semibold text-slate-400">
                          Nihil catatan overbreak pada {selectedStationFilter === 'ALL' ? 'semua station' : selectedStationFilter} ({selectedMonth}). 🌟
                        </div>
                      ) : (
                        currentFilteredOverbreak.map((c, idx) => (
                          <div 
                            key={c.id} 
                            onClick={() => openInfractionDetailModal(c)}
                            className="p-3.5 flex items-center justify-between hover:bg-rose-50/40 cursor-pointer transition-colors"
                          >
                            <div className="flex items-center space-x-3">
                              <span className="font-mono text-xs font-black text-rose-600 w-4">{idx + 1}.</span>
                              <img src={c.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100"} loading="lazy" className="w-9 h-9 rounded-xl object-cover border border-rose-100 shadow-2xs" alt="Avatar" />
                              <div>
                                <span className="text-xs font-bold text-slate-900 block">{c.name}</span>
                                <span className="text-[9px] text-slate-400 font-bold uppercase">{c.role}</span>
                              </div>
                            </div>
                            <span className="bg-rose-100 text-rose-800 text-xs font-black px-2.5 py-1 rounded-xl border border-rose-200">
                              {c.count}x Over (+{c.totalMinutes}m)
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {selectedInfractionCategory === 'ghosting' && (
                  <div className="space-y-2 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between px-1">
                      <p className="text-[10px] font-black text-red-800 uppercase tracking-widest flex items-center gap-1.5">
                        <FiAlertTriangle className="text-red-600 text-xs" /> Ranking Terbanyak Ghosting
                      </p>
                      <span className="text-[8px] font-bold text-slate-400">Klik nama untuk detail</span>
                    </div>

                    <div className="bg-white border border-slate-200/70 rounded-2xl divide-y divide-slate-100 shadow-xs overflow-hidden">
                      {currentFilteredGhosting.length === 0 ? (
                        <div className="p-6 text-center text-xs font-semibold text-slate-400">
                          Nihil catatan ghosting pada {selectedStationFilter === 'ALL' ? 'semua station' : selectedStationFilter} ({selectedMonth}). 🌟
                        </div>
                      ) : (
                        currentFilteredGhosting.map((c, idx) => (
                          <div 
                            key={c.id} 
                            onClick={() => openInfractionDetailModal(c)}
                            className="p-3.5 flex items-center justify-between hover:bg-red-50/40 cursor-pointer transition-colors"
                          >
                            <div className="flex items-center space-x-3">
                              <span className="font-mono text-xs font-black text-red-600 w-4">{idx + 1}.</span>
                              <img src={c.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100"} loading="lazy" className="w-9 h-9 rounded-xl object-cover border border-red-100 shadow-2xs" alt="Avatar" />
                              <div>
                                <span className="text-xs font-bold text-slate-900 block">{c.name}</span>
                                <span className="text-[9px] text-slate-400 font-bold uppercase">{c.role}</span>
                              </div>
                            </div>
                            <span className="bg-red-100 text-red-800 text-xs font-black px-2.5 py-1 rounded-xl border border-red-200">
                              {c.count}x Ghosting
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {selectedInfractionCategory === 'soc' && (
                  <div className="space-y-2 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between px-1">
                      <p className="text-[10px] font-black text-orange-800 uppercase tracking-widest flex items-center gap-1.5">
                        <FiFileText className="text-orange-600 text-xs" /> Pelanggaran SOC & Unprosedural
                      </p>
                      <span className="text-[8px] font-bold text-slate-400">Klik nama untuk detail</span>
                    </div>

                    <div className="bg-white border border-slate-200/70 rounded-2xl divide-y divide-slate-100 shadow-xs overflow-hidden">
                      {currentFilteredSoc.length === 0 ? (
                        <div className="p-6 text-center text-xs font-semibold text-slate-400">
                          Nihil pelanggaran SOC pada {selectedStationFilter === 'ALL' ? 'semua station' : selectedStationFilter} ({selectedMonth}). 🌟
                        </div>
                      ) : (
                        currentFilteredSoc.map((c, idx) => (
                          <div 
                            key={c.id} 
                            onClick={() => openInfractionDetailModal(c)}
                            className="p-3.5 flex items-center justify-between hover:bg-orange-50/40 cursor-pointer transition-colors"
                          >
                            <div className="flex items-center space-x-3">
                              <span className="font-mono text-xs font-black text-orange-600 w-4">{idx + 1}.</span>
                              <img src={c.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100"} loading="lazy" className="w-9 h-9 rounded-xl object-cover border border-orange-100 shadow-2xs" alt="Avatar" />
                              <div>
                                <span className="text-xs font-bold text-slate-900 block">{c.name}</span>
                                <span className="text-[9px] text-slate-400 font-bold uppercase">{c.role}</span>
                              </div>
                            </div>
                            <span className="bg-orange-100 text-orange-800 text-xs font-black px-2.5 py-1 rounded-xl border border-orange-200">
                              {c.count}x Pelanggaran
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

              </div>
            )}
          </div>
        )}

        {/* ================= MODAL DETAIL INDISIPLINER (POIN 4: TANPA PELAPOR, DENGAN FOTO BUKTI) ================= */}
        {showInfractionModal && selectedCrewInfractionDetail && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
            <div className="bg-white border border-slate-200 rounded-[28px] max-w-sm w-full overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
              
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 bg-rose-100 text-rose-700 rounded-xl text-base">
                    <FiActivity />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-tight">Detail Riwayat Indisipliner</h3>
                    <p className="text-[9px] text-slate-400 font-bold">{selectedCrewInfractionDetail.name} ({selectedMonth})</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowInfractionModal(false)}
                  className="p-1.5 hover:bg-slate-200 rounded-full text-slate-400 transition-colors cursor-pointer"
                >
                  <FiX className="text-lg"/>
                </button>
              </div>

              <div className="p-4 flex-1 overflow-y-auto space-y-3">
                {(!selectedCrewInfractionDetail.history && !selectedCrewInfractionDetail.infractions) || 
                 ((selectedCrewInfractionDetail.history || selectedCrewInfractionDetail.infractions).length === 0) ? (
                  <div className="py-8 text-center text-xs font-semibold text-slate-400">
                    Tidak ada catatan tindakan indisipliner pada bulan ini. Kru disiplin! 🌟
                  </div>
                ) : (
                  (selectedCrewInfractionDetail.history || selectedCrewInfractionDetail.infractions).map((inf, i) => (
                    <div key={i} className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 space-y-2 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <span className={`text-[8px] font-black px-2 py-0.5 rounded-md border uppercase ${inf.badgeColor}`}>
                          {inf.type}
                        </span>
                        <span className="text-[9px] font-mono font-bold text-slate-500">
                          {inf.date} • {inf.time}
                        </span>
                      </div>
                      <p className="text-xs font-extrabold text-slate-900">{inf.detail}</p>
                      {inf.note && (
                        <p className="text-[9px] text-slate-600 font-medium bg-white px-2.5 py-1.5 rounded-xl border border-slate-100 leading-relaxed">
                          {inf.note}
                        </p>
                      )}

                      {/* TAMPILAN FOTO DOKUMENTASI BUKTI KEJADIAN (POIN 4) */}
                      {inf.evidence_image_url && (
                        <div className="space-y-1 pt-1">
                          <span className="text-[8px] font-black uppercase text-slate-400 tracking-wider block">Foto Bukti Dokumentasi:</span>
                          <img 
                            src={inf.evidence_image_url} 
                            alt="Bukti Pelanggaran" 
                            className="w-full aspect-[4/3] rounded-xl object-cover border border-slate-200 shadow-xs" 
                          />
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              <div className="p-3 bg-slate-50 border-t border-slate-100">
                <button
                  onClick={() => setShowInfractionModal(false)}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl text-xs uppercase tracking-wider cursor-pointer"
                >
                  Tutup Rincian
                </button>
              </div>

            </div>
          </div>
        )}

        {/* ================= MODAL INPUT PELANGGARAN SOC (POIN 1: WAJIB UPLOAD BUKTI FOTO) ================= */}
        {showReportViolationModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
            <div className="bg-white border border-slate-200 rounded-[28px] max-w-sm w-full overflow-hidden shadow-2xl p-5 space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-orange-50 text-orange-600 rounded-xl">
                    <FiFileText className="text-base" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                      Catat Pelanggaran Operasional
                    </h3>
                    <p className="text-[9px] text-slate-400 font-medium">Wajib lampirkan foto dokumentasi pendukung</p>
                  </div>
                </div>
                <button onClick={() => setShowReportViolationModal(false)} className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 transition-colors cursor-pointer">
                  <FiX className="text-lg"/>
                </button>
              </div>

              <form onSubmit={handleSubmitOperationalViolation} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-600 uppercase">Pilih Kru yang Melanggar</label>
                  <select
                    value={reportTargetCrewId}
                    onChange={(e) => setReportTargetCrewId(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 outline-none focus:border-indigo-500"
                  >
                    <option value="">-- Pilih Kru --</option>
                    {allProfiles.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.full_name} {p.station_placement ? `(${p.station_placement})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-600 uppercase">Jenis Pelanggaran</label>
                    <select
                      value={reportViolationType}
                      onChange={(e) => setReportViolationType(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-900 outline-none"
                    >
                      <option value="Pelanggaran SOC">Pelanggaran SOC</option>
                      <option value="Tindakan Unprosedural">Unprosedural</option>
                      <option value="Kelalaian Operasional">Kelalaian Kerja</option>
                      <option value="Tindakan Indisipliner Lain">Lainnya</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-600 uppercase">Pengurangan Poin</label>
                    <select
                      value={reportPenaltyPoints}
                      onChange={(e) => setReportPenaltyPoints(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 outline-none"
                    >
                      <option value="5">-5 Poin (Ringan)</option>
                      <option value="10">-10 Poin (Sedang)</option>
                      <option value="15">-15 Poin (Berat)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-600 uppercase">Rincian Kejadian / Catatan</label>
                  <textarea
                    rows={2}
                    value={reportNotes}
                    onChange={(e) => setReportNotes(e.target.value)}
                    placeholder="Contoh: Tidak memakai sarung tangan saat handling dimsum / mengabaikan resep..."
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium text-slate-900 outline-none focus:border-indigo-500"
                  />
                </div>

                {/* UPLOAD FOTO BUKTI PENDUKUNG (POIN 1) */}
                <div className="space-y-1.5 pt-1">
                  <label className="text-[10px] font-black text-slate-700 uppercase flex items-center gap-1">
                    <FiCamera className="text-orange-600" /> Foto Bukti Dokumentasi (Wajib)
                  </label>
                  
                  {reportEvidenceImage ? (
                    <div className="relative rounded-2xl overflow-hidden border border-slate-200">
                      <img src={reportEvidenceImage} alt="Bukti" className="w-full h-32 object-cover" />
                      <button 
                        type="button" 
                        onClick={() => setReportEvidenceImage(null)} 
                        className="absolute top-2 right-2 bg-slate-900/80 text-white p-1.5 rounded-full hover:bg-slate-900 cursor-pointer"
                      >
                        <FiX className="text-xs" />
                      </button>
                    </div>
                  ) : (
                    <label className="w-full border-2 border-dashed border-slate-300 hover:border-orange-500 bg-slate-50 p-4 rounded-2xl flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-colors">
                      <FiUploadCloud className="text-xl text-slate-400" />
                      <span className="text-[10px] font-bold text-slate-600">
                        {isUploadingEvidence ? 'Mengunggah Foto...' : 'Pilih / Ambil Foto Bukti'}
                      </span>
                      <input type="file" accept="image/*" onChange={handleEvidenceImageChange} className="hidden" disabled={isUploadingEvidence} />
                    </label>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingReport || isUploadingEvidence}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white font-black py-3 rounded-2xl text-xs uppercase tracking-wider shadow-md transition-all active:scale-[0.98] cursor-pointer disabled:opacity-60"
                >
                  {isSubmittingReport ? 'Menyimpan Laporan...' : 'Kirim & Simpan Pelanggaran'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ================= TAB 4: LOG FOTO & REKAP HARIAN (POIN 2) ================= */}
        {activeTab === 'all-logs' && (
          <div className="flex-1 px-4 py-4 space-y-3.5">
            
            {/* SUB-TAB NAV: LOG FOTO VS REKAP PRESENSI HARIAN */}
            <div className="bg-slate-200/80 p-1 rounded-2xl flex gap-1 shadow-inner">
              <button
                onClick={() => setLogSubTab('photo')}
                className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${logSubTab === 'photo' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
              >
                <FiImage className="text-sm" /> Log Foto Break
              </button>
              <button
                onClick={() => setLogSubTab('summary')}
                className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${logSubTab === 'summary' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
              >
                <FiList className="text-sm" /> Rekap Jam Presensi
              </button>
            </div>

            {/* VIEW A: REKAP JAM PRESENSI HARIAN TANPA FOTO (POIN 2) */}
            {logSubTab === 'summary' ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Rekap Presensi Harian Kru</h3>
                    <p className="text-[9px] text-slate-400 font-medium">Daftar jam masuk & jam pulang per tanggal.</p>
                  </div>
                  <button 
                    onClick={fetchAttendanceSummaryList} 
                    className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors cursor-pointer"
                  >
                    <FiRefreshCw className="text-xs" />
                  </button>
                </div>

                {isFetchingSummary ? (
                  <div className="text-center py-8 text-xs text-slate-400 font-medium animate-pulse">Memuat rekap jam masuk/pulang...</div>
                ) : attendanceSummaryList.length === 0 ? (
                  <div className="bg-white border border-slate-200/70 rounded-2xl p-6 text-center text-xs text-slate-400 font-medium shadow-xs">
                    Belum ada riwayat presensi yang tersimpan.
                  </div>
                ) : (
                  <div className="bg-white border border-slate-200/70 rounded-2xl divide-y divide-slate-100 shadow-xs overflow-hidden">
                    {attendanceSummaryList.map((item) => (
                      <div key={item.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50/70 transition-colors">
                        <div className="space-y-0.5">
                          <span className="text-xs font-bold text-slate-900 block">{item.name}</span>
                          <span className="text-[9px] text-indigo-600 font-black uppercase">{item.station}</span>
                          <span className="text-[9px] text-slate-400 font-mono block mt-0.5">{item.date}</span>
                        </div>

                        <div className="text-right space-y-1">
                          <div className="flex items-center gap-1 text-[10px] font-mono justify-end">
                            <span className="bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-md border border-emerald-200">
                              IN: {item.inTime}
                            </span>
                            <span className={`font-bold px-2 py-0.5 rounded-md border ${item.outTime === 'Belum Pulang' ? 'bg-slate-100 text-slate-500 border-slate-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                              OUT: {item.outTime}
                            </span>
                          </div>
                          <span className={`text-[8px] font-black uppercase px-2 py-0.2 rounded inline-block ${item.statusIn.toLowerCase().includes('terlambat') || item.statusOut.toLowerCase().includes('pulang cepat') ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'}`}>
                            {item.statusIn.toLowerCase().includes('terlambat') ? 'Terlambat Masuk' : item.statusOut.toLowerCase().includes('pulang cepat') ? 'Pulang Cepat' : 'Jadwal Normal'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* VIEW B: LOG FOTO ISTIRAHAT */
              <div className="space-y-3">
                <div className="flex flex-col space-y-0.5">
                  <h2 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                    <FiImage className="text-indigo-600 text-lg" /> Log Foto Istirahat
                  </h2>
                  <p className="text-[10px] text-slate-400 font-medium">Foto diarsip otomatis maksimal 60 hari.</p>
                </div>

                {isManager && (
                  <div className="bg-slate-200/80 p-1 rounded-2xl flex gap-1 shadow-inner">
                    <button
                      onClick={() => setLogCategory('crew')}
                      className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${logCategory === 'crew' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                      Log Crew
                    </button>
                    <button
                      onClick={() => setLogCategory('manager')}
                      className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${logCategory === 'manager' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                      Log Manager 🔒
                    </button>
                  </div>
                )}

                {isFetchingAllLogs ? (
                  <div className="text-center py-8 text-xs text-slate-400 font-medium animate-pulse">Menghubungkan cloud storage...</div>
                ) : activeLogData.length === 0 ? (
                  <div className="bg-white border border-slate-200/70 rounded-2xl p-6 text-center text-xs text-slate-400 font-medium shadow-xs">
                    Belum ada aktivitas log break dalam 60 hari terakhir.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activeLogData.map((log) => (
                      <div key={log.id} className="bg-white border border-slate-200/70 rounded-2xl p-3.5 shadow-xs space-y-2.5">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                          <div>
                            <h4 className="text-xs font-bold text-slate-900">{log.crewName}</h4>
                            <p className="text-[9px] text-slate-400 font-medium">{new Date(log.created_at).toLocaleDateString('id-ID', {day:'numeric', month:'long', year:'numeric', timeZone: 'Asia/Makassar'})}</p>
                          </div>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md uppercase border ${log.isOverBreak ? 'bg-rose-100 text-rose-700 border-rose-200' : 'bg-emerald-100 text-emerald-700 border-emerald-200'}`}>
                            {log.formattedDuration}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-[8px] font-extrabold text-slate-400 uppercase tracking-wider block">Foto Mulai</span>
                              <span className="text-[8px] font-black font-mono text-indigo-600 bg-indigo-50 px-1 py-0.2 rounded border border-indigo-100">
                                {log.formattedStartTime}
                              </span>
                            </div>
                            {log.image_url ? (
                              <img src={log.image_url} loading="lazy" className="w-full aspect-[3/4] rounded-xl object-cover border border-slate-100 shadow-xs" alt="Mulai" />
                            ) : (
                              <div className="w-full aspect-[3/4] rounded-xl bg-slate-50 border border-dashed flex items-center justify-center text-[9px] text-slate-400 font-bold">Foto Telah Diarsip</div>
                            )}
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-[8px] font-extrabold text-slate-400 uppercase tracking-wider block">Foto Selesai</span>
                              <span className={`text-[8px] font-black font-mono px-1 py-0.2 rounded border ${log.formattedEndTime === 'In Progress' ? 'text-amber-600 bg-amber-50 border-amber-100' : 'text-emerald-700 bg-emerald-50 border-emerald-100'}`}>
                                {log.formattedEndTime}
                              </span>
                            </div>
                            {log.after_break_image_url ? (
                              <img src={log.after_break_image_url} loading="lazy" className="w-full aspect-[3/4] rounded-xl object-cover border border-slate-100 shadow-xs" alt="Selesai" />
                            ) : (
                              <div className="w-full aspect-[3/4] rounded-xl bg-slate-50 border border-dashed flex items-center justify-center text-[9px] text-slate-400 font-bold">In Progress / Diarsip</div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}

                    {hasMoreLogs && (
                      <button
                        onClick={() => fetchAllCrewLogs(true, logsPage)}
                        disabled={isFetchingMoreLogs}
                        className="w-full bg-white hover:bg-slate-50 border border-slate-200/70 text-slate-600 font-bold py-3 rounded-2xl text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors disabled:opacity-60 cursor-pointer"
                      >
                        {isFetchingMoreLogs ? (
                          <span className="animate-pulse">Memuat...</span>
                        ) : (
                          <>
                            <FiChevronDown className="text-sm" /> Muat Lebih Banyak
                          </>
                        )}
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

          </div>
        )}

        {/* ================= TAB 5: EDIT PROFIL ================= */}
        {activeTab === 'profile' && (
          <div className="flex-1 px-4 py-4 space-y-4">
            <div className="flex flex-col space-y-0.5">
              <h2 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                <FiSettings className="text-slate-700 text-lg" /> Pengaturan Profil
              </h2>
              <p className="text-[10px] text-slate-400 font-medium">Kelola informasi pribadi staff.</p>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-3">
              <div className="bg-white border border-slate-200/70 rounded-2xl p-4 flex flex-col items-center justify-center space-y-2 shadow-xs relative">
                <div className="relative">
                  <img src={editAvatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100"} className="w-16 h-16 rounded-2xl object-cover border-2 border-slate-100 shadow-xs" alt="Avatar" />
                  <label className="absolute -bottom-1 -right-1 bg-indigo-600 text-white p-1.5 rounded-lg cursor-pointer hover:bg-indigo-700 transition-colors shadow-xs">
                    <FiUploadCloud className="text-xs" />
                    <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                  </label>
                </div>
                
                <div className="flex flex-col items-center gap-0.5 pt-1">
                  <div className={`flex items-center gap-1 text-[10px] font-black px-2.5 py-0.5 rounded-xl border uppercase ${activeBadge.color}`}>
                    <FiZap className="animate-bounce" /> {activeBadge.name}
                  </div>
                  <p className="text-[9px] text-slate-400 font-bold">Skor Kedisiplinan: {currentUserPoints} Pts</p>
                </div>
              </div>

              <div className="bg-white border border-slate-200/70 rounded-2xl p-4 shadow-xs space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1"><FiUser/> Nama Lengkap</label>
                  <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} required className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-indigo-500 transition-colors" />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1"><FiPhone/> No. WhatsApp Aktif</label>
                  <input type="text" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-indigo-500 transition-colors" />
                </div>

                <div className="pt-2 border-t border-slate-100 space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1"><FiLock/> Password Baru</label>
                  <input type="password" placeholder="Isi hanya jika ingin ganti password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none" />
                </div>
              </div>

              <button type="submit" disabled={isUpdatingProfile} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-2xl text-xs tracking-wider shadow-md transition-all active:scale-[0.98] cursor-pointer">
                {isUpdatingProfile ? 'Menyimpan...' : 'Simpan Pembaruan Profil'}
              </button>
            </form>
          </div>
        )}

        {/* FIXED BOTTOM NAV BAR */}
        <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/95 backdrop-blur-xl border-t border-slate-200/80 px-2 py-2 flex justify-between items-center z-40 shadow-[0_-4px_25px_rgba(0,0,0,0.05)]">
          <button onClick={() => setActiveTab('absen')} className={`flex-1 flex flex-col items-center gap-1 py-1 transition-all cursor-pointer ${activeTab === 'absen' ? 'text-indigo-600 font-black scale-105' : 'text-slate-400 font-bold hover:text-slate-700'}`}>
            <FiLayout className="text-lg" /> <span className="text-[9px] tracking-tight">Absen</span>
          </button>
          <button onClick={() => setActiveTab('live-break')} className={`flex-1 flex flex-col items-center gap-1 py-1 transition-all cursor-pointer ${activeTab === 'live-break' ? 'text-indigo-600 font-black scale-105' : 'text-slate-400 font-bold hover:text-slate-700'}`}>
            <FiUsers className="text-lg" /> <span className="text-[9px] tracking-tight">Live</span>
          </button>
          <button onClick={() => setActiveTab('leaderboard')} className={`flex-1 flex flex-col items-center gap-1 py-1 transition-all cursor-pointer ${activeTab === 'leaderboard' ? 'text-indigo-600 font-black scale-105' : 'text-slate-400 font-bold hover:text-slate-700'}`}>
            <FiAward className="text-lg" /> <span className="text-[9px] tracking-tight">Poin</span>
          </button>
          <button onClick={() => setActiveTab('all-logs')} className={`flex-1 flex flex-col items-center gap-1 py-1 transition-all cursor-pointer ${activeTab === 'all-logs' ? 'text-indigo-600 font-black scale-105' : 'text-slate-400 font-bold hover:text-slate-700'}`}>
            <FiRotateCcw className="text-lg" /> <span className="text-[9px] tracking-tight">Log</span>
          </button>
          <button onClick={() => setActiveTab('profile')} className={`flex-1 flex flex-col items-center gap-1 py-1 transition-all cursor-pointer ${activeTab === 'profile' ? 'text-indigo-600 font-black scale-105' : 'text-slate-400 font-bold hover:text-slate-700'}`}>
            <FiSettings className="text-lg" /> <span className="text-[9px] tracking-tight">Profil</span>
          </button>
        </div>

        {/* MODAL PILIHAN SHIFT */}
        {showShiftPicker && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
            <div className="bg-white border border-slate-200 rounded-[28px] max-w-sm w-full overflow-hidden shadow-2xl p-5 space-y-4">
              
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-xl">
                    <FiLayers className="text-base" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                      {isManager ? 'Konfirmasi Shift Manager' : 'Konfirmasi Shift & Station'}
                    </h3>
                    <p className="text-[9px] text-slate-400 font-medium">
                      {isManager ? 'Pilih jam masuk shift kerja Anda' : 'Pilih penempatan tugas station hari ini'}
                    </p>
                  </div>
                </div>
                <button onClick={() => setShowShiftPicker(false)} className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 transition-colors cursor-pointer">
                  <FiX className="text-lg"/>
                </button>
              </div>

              {!isManager ? (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider">
                      1. Pilih Station Tugas Hari Ini
                    </label>
                    <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                      {selectedStation}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-1.5 max-h-40 overflow-y-auto pr-1">
                    {CREW_STATION_OPTIONS.map((st) => {
                      const isSelected = selectedStation === st;
                      return (
                        <button
                          key={st}
                          type="button"
                          onClick={() => setSelectedStation(st)}
                          className={`px-3 py-2 rounded-xl text-left font-bold text-[10px] transition-all flex items-center justify-between border cursor-pointer ${isSelected ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200/80'}`}
                        >
                          <span className="truncate pr-1">{st}</span>
                          {isSelected && <FiCheckSquare className="text-xs flex-shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 border border-slate-200/70 rounded-xl p-3 flex items-center gap-2.5">
                  <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-black"><FiBriefcase/></div>
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase">Role / Posisi Anda</p>
                    <p className="text-xs font-black text-slate-900">Manager</p>
                  </div>
                </div>
              )}

              <div className="space-y-1.5 pt-1">
                <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider">
                  {!isManager ? '2. Pilih Jam Masuk Shift' : 'Pilih Jam Masuk Shift'}
                </label>
                <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-1">
                  {SHIFT_HOURS_OPTIONS.map((opt) => {
                    const isSelected = selectedShiftHour === opt.hour;
                    return (
                      <button
                        key={opt.hour}
                        type="button"
                        onClick={() => setSelectedShiftHour(opt.hour)}
                        className={`p-2 rounded-xl border flex items-center justify-center gap-1.5 transition-all text-[10px] font-black cursor-pointer ${isSelected ? 'bg-slate-900 text-white border-slate-900 shadow-sm' : 'bg-slate-50 text-slate-700 border-slate-200/80 hover:bg-indigo-50'}`}
                      >
                        <FiClock className="text-xs"/>
                        <span>{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 space-y-2">
                <button 
                  type="button" 
                  onClick={handleConfirmShiftAndOpenCamera} 
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-3 rounded-2xl text-xs uppercase tracking-wider shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <FiCamera className="text-sm" /> Lanjutkan Buka Kamera
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowShiftPicker(false)} 
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Batal
                </button>
              </div>

            </div>
          </div>
        )}

        {/* MODAL KAMERA FULL SCREEN */}
        {isCameraOpen && (
          <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col justify-between z-50 animate-in fade-in duration-200">
            <div className="p-4 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between text-white relative z-10">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                <h3 className="font-black text-xs tracking-widest uppercase text-slate-200">
                  VERIFIKASI WAJAH: {cameraMode} {cameraMode === 'IN' ? `(${isManager ? 'Manager' : selectedStation} - SHIFT ${selectedShiftHour.toString().padStart(2, '0')}:00)` : ''}
                </h3>
              </div>
              <button type="button" onClick={closeCamera} className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-full transition-colors cursor-pointer">
                <FiX className="h-5 w-5" />
              </button>
            </div>
            
            <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
              {!capturedImage ? (
                <div className="relative w-full h-full flex items-center justify-center">
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    muted 
                    className="w-full h-full object-cover -scale-x-100" 
                  />
                  
                  <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6 bg-slate-950/40">
                    <div className="relative w-full max-w-[280px] aspect-[3/4] rounded-[100px] border-4 border-dashed border-white/80 shadow-[0_0_0_9999px_rgba(15,23,42,0.65)] flex flex-col items-center justify-center">
                      <div className="absolute top-8 text-center text-white/90 text-xs font-bold bg-slate-900/80 px-3 py-1 rounded-full border border-white/20 backdrop-blur-sm">
                        Posisikan Wajah di Dalam Oval
                      </div>
                    </div>
                  </div>

                  {humanDetectionStatus === 'HUMAN_DETECTED' && (
                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20">
                      <button 
                        type="button" 
                        onClick={handleCapture} 
                        className="bg-indigo-600 hover:bg-indigo-500 text-white p-5 rounded-full shadow-2xl border-4 border-white/80 active:scale-95 transition-transform flex items-center justify-center cursor-pointer"
                      >
                        <FiCamera className="text-2xl" />
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="relative w-full h-full flex flex-col items-center justify-center p-4 bg-slate-900">
                  <div className="w-full max-w-sm aspect-[3/4] rounded-3xl overflow-hidden border-2 border-slate-700 shadow-2xl relative">
                    <img src={capturedImage} alt="Preview Foto" className="w-full h-full object-cover" />
                    <div className="absolute top-3 right-3 bg-emerald-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-md flex items-center gap-1">
                      <FiCheckCircle /> WAJAH VALID
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-900 border-t border-slate-800 space-y-3">
              {capturedImage ? (
                <div className="flex gap-3 max-w-sm mx-auto">
                  <button 
                    type="button" 
                    onClick={() => { setCapturedImage(null); openCamera(cameraMode); }} 
                    className="flex-1 bg-slate-800 text-slate-200 font-bold py-3.5 rounded-2xl text-xs border border-slate-700 hover:bg-slate-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <FiRefreshCw /> Foto Ulang
                  </button>
                  <button 
                    type="button" 
                    disabled={isLoading} 
                    onClick={handleConfirmSubmission} 
                    className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-black py-3.5 rounded-2xl text-xs shadow-lg shadow-indigo-600/30 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {isLoading ? 'Memproses Data...' : 'Konfirmasi Absen'}
                  </button>
                </div>
              ) : (
                <div className="text-xs font-black text-slate-300 text-center font-mono py-1">
                  {humanDetectionStatus === 'LOADING_ENGINE' && <span className="animate-pulse text-indigo-400">Mengaktifkan Sensor Kamera...</span>}
                  {humanDetectionStatus === 'NOT_DETECTED' && <span className="text-rose-400">🚨 Kamera Tidak Siap</span>}
                  {humanDetectionStatus === 'HUMAN_DETECTED' && <span className="text-emerald-400">✓ Posisikan Wajah & Tekan Tombol Kamera</span>}
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}