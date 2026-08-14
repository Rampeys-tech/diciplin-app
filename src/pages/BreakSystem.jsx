'use client';

import { useState, useEffect, useRef } from 'react';
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
  FiCalendar,
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
  FiCheckSquare
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

// Daftar Pilihan Jam Shift Bulat (24 Jam Lengkap)
const SHIFT_HOURS_OPTIONS = [
  { label: '00:00 WITA (Midnight)', hour: 0 },
  { label: '01:00 WITA', hour: 1 },
  { label: '02:00 WITA', hour: 2 },
  { label: '03:00 WITA', hour: 3 },
  { label: '04:00 WITA', hour: 4 },
  { label: '05:00 WITA', hour: 5 },
  { label: '06:00 WITA', hour: 6 },
  { label: '07:00 WITA', hour: 7 },
  { label: '08:00 WITA', hour: 8 },
  { label: '09:00 WITA', hour: 9 },
  { label: '10:00 WITA', hour: 10 },
  { label: '11:00 WITA', hour: 11 },
  { label: '12:00 WITA', hour: 12 },
  { label: '13:00 WITA', hour: 13 },
  { label: '14:00 WITA', hour: 14 },
  { label: '15:00 WITA', hour: 15 },
  { label: '16:00 WITA', hour: 16 },
  { label: '17:00 WITA', hour: 17 },
  { label: '18:00 WITA', hour: 18 },
  { label: '19:00 WITA', hour: 19 },
  { label: '20:00 WITA', hour: 20 },
  { label: '21:00 WITA', hour: 21 },
  { label: '22:00 WITA (Shift Malam)', hour: 22 },
  { label: '23:00 WITA', hour: 23 }
];

// DAFTAR STATION KHUSUS CREW & STAFF
const CREW_STATION_OPTIONS = [
  'Station Noodle',
  'Station Dimsum',
  'Station Bar',
  'Station Produksi',
  'Station Kasir',
  'Station Assembler',
  'Station Presenter',
  'Station Server',
  'Staff QC',
  'Staff Stocker',
  'Cel',
  'Dishwasher'
];

export default function BreakSystem() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('absen');
  const [officeRules, setOfficeRules] = useState(null);

  // ================= STATE ABSENSI UTAMA =================
  const [isOnBreak, setIsOnBreak] = useState(false);
  const [breakStartTime, setBreakStartTime] = useState(null);
  const [timeLeft, setTimeLeft] = useState(3600); 
  const [maxBreakDuration, setMaxBreakDuration] = useState(3600); 
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraMode, setCameraMode] = useState(''); 
  const [capturedImage, setCapturedImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [greeting, setGreeting] = useState('Selamat Pagi');
  const [motivationQuote, setMotivationQuote] = useState('');
  
  const [hasCheckedIn, setHasCheckedIn] = useState(false);
  const [hasCheckedOut, setHasCheckedOut] = useState(false);
  const [checkInTime, setCheckInTime] = useState(null);
  const [isEligibleForCheckOut, setIsEligibleForCheckOut] = useState(false);
  const [activeLogId, setActiveLogId] = useState(null);
  const [requiredWorkHours, setRequiredWorkHours] = useState(9); 

  // Modal Pilihan Jam Shift & Station
  const [showShiftPicker, setShowShiftPicker] = useState(false);
  const [selectedShiftHour, setSelectedShiftHour] = useState(9);
  const [selectedStation, setSelectedStation] = useState('Station Noodle');

  // ================= STATE REKAP OPERASIONAL PER STATION =================
  const [activeShiftStats, setActiveShiftStats] = useState({
    totalScheduledCrew: 0,
    totalActiveNow: 0,
    staffActive: 0,
    managerActive: 0,
    stationCounts: {}
  });

  // ================= STATE MONITORING & LIVE DATA =================
  const [breakLogs, setBreakLogs] = useState([]);
  const [isFetchingLogs, setIsFetchingLogs] = useState(false);
  const [liveBreaks, setLiveBreaks] = useState([]);
  const [ghostingCrew, setGhostingCrew] = useState([]);
  const [waterBreaks, setWaterBreaks] = useState([]);
  const [isFetchingLive, setIsFetchingLive] = useState(false);
  
  // Triggers Voice Alarm AI
  const [hasPlayed5MinAlarm, setHasPlayedAlarm] = useState(false);
  const [hasPlayed0MinAlarm, setHasPlayed0MinAlarm] = useState(false);
  const [hasNotifiedOverbreak, setHasNotifiedOverbreak] = useState(false);
  const announcedOverbreakCrew = useRef(new Set());

  const isManager = profile?.station_placement?.toLowerCase() === 'manager' || 
                    profile?.station_placement?.toLowerCase() === 'atasan' || 
                    profile?.station_placement?.toLowerCase() === 'owner' || 
                    profile?.full_name?.toLowerCase().includes('owner') || 
                    profile?.role?.toLowerCase() === 'manager';

  // ================= STATE LEADERBOARD POIN =================
  const [leaderboard, setLeaderboard] = useState([]);
  const [managerLeaderboard, setManagerLeaderboard] = useState([]);
  const [leaderboardCategory, setLeaderboardCategory] = useState('crew'); 
  const [isFetchingLeaderboard, setIsFetchingLeaderboard] = useState(false);

  // ================= STATE LOG FOTO =================
  const [allCrewLogs, setAllCrewLogs] = useState([]);
  const [managerCrewLogs, setManagerCrewLogs] = useState([]);
  const [logCategory, setLogCategory] = useState('crew'); 
  const [isFetchingAllLogs, setIsFetchingAllLogs] = useState(false);

  // ================= STATE GEOLOKASI =================
  const [humanDetectionStatus, setHumanDetectionStatus] = useState('LOADING_ENGINE'); 
  const [currentSystemTime, setCurrentSystemTime] = useState(new Date());
  const [userLocation, setUserLocation] = useState({ lat: null, lng: null });
  const [isVerifyingLocation, setIsVerifyingLocation] = useState(false);

  const [allProfiles, setAllProfiles] = useState([]);
  const [isFetchingProfiles, setIsFetchingProfiles] = useState(false);
  const [selectedCrewId, setSelectedCrewId] = useState('');
  const [selectedIzinType, setSelectedIzinType] = useState('toilet'); 
  const [customIzinMinutes, setCustomIzinMinutes] = useState('10');
  const [isSubmittingIzin, setIsSubmittingIzin] = useState(false);

  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  const videoRef = useRef(null);
  const localStreamRef = useRef(null);
  const animationFrameRef = useRef(null);

  // ================= SUARA AI REALISTIS / NATURAL HUMAN VOICE =================
  const speakAiVoice = (text) => {
    try {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'id-ID';
        utterance.rate = 0.92; 
        utterance.pitch = 1.05;

        // Pilih voice natural bahasa Indonesia yang tersedia di browser/perangkat
        const voices = window.speechSynthesis.getVoices();
        const idVoice = voices.find(v => (v.lang === 'id-ID' || v.lang === 'id_ID') && !v.name.includes('eSpeak')) ||
                        voices.find(v => v.lang.includes('id') || v.lang.includes('ID'));
        if (idVoice) utterance.voice = idVoice;

        window.speechSynthesis.speak(utterance);
      }
    } catch (e) {
      console.error("SpeechSynthesis Error:", e);
    }
  };

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

  const closeCamera = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    setIsCameraOpen(false);
    setCapturedImage(null);
  };

  const getCrewBadge = (points) => {
    if (points >= 120) return { name: 'Elite Guardian', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
    if (points >= 105) return { name: 'Discipline Master', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    if (points >= 100) return { name: 'Regular Crew', color: 'bg-blue-50 text-blue-700 border-blue-200' };
    return { name: 'Under Review', color: 'bg-rose-50 text-rose-700 border-rose-200' };
  };

  const fetchAllProfilesList = async () => {
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
  };

  // ================= PERBAIKAN 1: KALKULASI SINKRON TOTAL IC, STANDBY, & BREAK =================
  const fetchActiveShiftStats = async () => {
    try {
      const { data: activeLogs, error: lError } = await supabase
        .from('attendance_logs')
        .select('user_id, status_in, break_start_time, break_end_time, discipline_status')
        .not('actual_in', 'is', null)
        .is('actual_out', null);

      const { data: profiles, error: pError } = await supabase
        .from('user_profiles')
        .select('id, full_name, station_placement, role');

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
            // SINKRONISASI MUTLAK DENGAN LOGIKA BREAK LIVE MONITORING
            const isCurrentlyBreaking = (Boolean(log.break_start_time) && !Boolean(log.break_end_time)) || log.discipline_status === 'Sedang Istirahat';

            const nameLower = (p.full_name || '').toLowerCase();
            const placementLower = (p.station_placement || '').toLowerCase();
            const roleLower = (p.role || '').toLowerCase();

            const isMgr = nameLower.includes('owner') || 
                          placementLower.includes('owner') || 
                          placementLower.includes('manager') || 
                          placementLower.includes('atasan') || 
                          roleLower === 'manager';

            if (isMgr) {
              managerCount += 1;
            } else {
              staffCount += 1;
            }

            // Personil hanya dihitung standby di station jika TIDAK sedang break
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
  };

  useEffect(() => {
    const clockTimer = setInterval(() => setCurrentSystemTime(new Date()), 1000);
    return () => clearInterval(clockTimer);
  }, []);

  useEffect(() => {
    const liveTrackerTimer = setInterval(() => {
      if (liveBreaks.length > 0) updateDurationsLocally();
      if (waterBreaks.length > 0) updateWaterBreaksLocally();
    }, 1000);
    return () => clearInterval(liveTrackerTimer);
  }, [liveBreaks, waterBreaks, isManager]);

  const updateDurationsLocally = () => {
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
        }
      }

      return {
        ...crew,
        duration: displayDuration,
        isOverBreak: isOver,
        isWarningBreak: isWarning
      };
    }));
  };

  const updateWaterBreaksLocally = () => {
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
        elapsedSec: elapsedSec,
        allowedSec: totalAllowedSec
      };
    }));
  };

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
        const newPts = Math.max(0, existingPts - pointDeduction);

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
      await fetchAttendanceStatus();
      await fetchLiveBreakData();
      await fetchLeaderboard();
      await fetchActiveShiftStats();
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

  const formatWITADate = (date) => {
    try {
      return date.toLocaleDateString('id-ID', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Makassar'
      });
    } catch (e) {
      return date.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    }
  };

  useEffect(() => {
    if (!checkInTime || hasCheckedOut) {
      setIsEligibleForCheckOut(false);
      return;
    }

    const checkEligibility = () => {
      let checkInHour = 0;
      try {
        const checkInHourStr = checkInTime.toLocaleTimeString('en-US', { hour: '2-digit', hour12: false, timeZone: 'Asia/Makassar' });
        checkInHour = parseInt(checkInHourStr);
      } catch (e) {
        checkInHour = new Date(checkInTime).getHours();
      }

      const isShift22 = (selectedShiftHour === 22 || checkInHour === 22);
      const targetHours = isShift22 ? 8 : 9;
      setRequiredWorkHours(targetHours);

      const now = new Date();
      const durationMs = now.getTime() - new Date(checkInTime).getTime();
      const durationHours = durationMs / (1000 * 60 * 60);
      setIsEligibleForCheckOut(durationHours >= targetHours);
    };

    checkEligibility();
    const eligibilityTimer = setInterval(checkEligibility, 5000); 
    return () => clearInterval(eligibilityTimer);
  }, [checkInTime, hasCheckedOut, selectedShiftHour]);

  // ================= PERBAIKAN 2 & 3: ALARM SETIAP 5 MENIT SEBELUM BREAK HABIS =================
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

          // PENGINGAT 5 MENIT SEBELUM BREAK HABIS DENGAN SUARA NATURAL
          if (remaining <= 300 && remaining > 0 && !hasPlayed5MinAlarm) {
            setHasPlayedAlarm(true);
            speakAiVoice("Halo rekan crew, waktu istirahat Anda tersisa lima menit lagi. Silakan bersiap-siap kembali ke station kerja ya.");
          }

          // WAKTU BREAK TEPAT HABIS
          if (remaining === 0 && !hasPlayed0MinAlarm) {
            setHasPlayed0MinAlarm(true);
            speakAiVoice("Waktu istirahat Anda telah selesai. Mohon segera kembali ke station dan lakukan presensi selesai break.");
          }

          // OVER BREAK
          if (remaining < 0 && !hasNotifiedOverbreak && activeLogId) {
            setHasNotifiedOverbreak(true);
            speakAiVoice("Perhatian, waktu istirahat Anda telah melewati batas atau over break. Poin kedisiplinan mulai terpotong otomatis.");
          }
        }
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isOnBreak, timeLeft, hasPlayed5MinAlarm, hasPlayed0MinAlarm, hasNotifiedOverbreak, activeLogId]);

  const fetchLiveBreakData = async () => {
    setIsFetchingLive(true);
    try {
      const { data: logsData, error: logsError } = await supabase
        .from('attendance_logs')
        .select('id, user_id, break_start_time, break_end_time, actual_in, actual_out, discipline_status, is_outside_radius, distance_meters, status_in')
        .not('actual_in', 'is', null)
        .is('actual_out', null);

      if (logsError) throw logsError;

      const { data: wbData } = await supabase
        .from('user_profiles')
        .select('id, full_name, station_placement, current_izin_start, current_izin_duration, current_izin_type')
        .not('current_izin_start', 'is', null);

      const { data: profilesData, error: profilesError } = await supabase
        .from('user_profiles')
        .select('id, full_name, station_placement');

      if (profilesError) throw profilesError;

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
  };

  const fetchLeaderboard = async () => {
    setIsFetchingLeaderboard(true);
    try {
      const { data: profiles, error: pError } = await supabase
        .from('user_profiles')
        .select('id, full_name, avatar, station_placement, role, total_points');
        
      if (pError) {
        setIsFetchingLeaderboard(false);
        return;
      }

      const { data: logs } = await supabase
        .from('attendance_logs')
        .select('user_id, break_start_time, break_end_time, actual_in, discipline_status, penalty_points, status_in');

      if (profiles) {
        const filteredCrewProfiles = profiles.filter(p => {
          const nameLower = (p.full_name || '').toLowerCase();
          const placementLower = (p.station_placement || '').toLowerCase();
          const roleLower = (p.role || '').toLowerCase();
          return !nameLower.includes('owner') && 
                 !placementLower.includes('owner') && 
                 !placementLower.includes('manager') && 
                 !placementLower.includes('atasan') &&
                 roleLower !== 'manager';
        });

        const filteredManagerProfiles = profiles.filter(p => {
          const nameLower = (p.full_name || '').toLowerCase();
          const placementLower = (p.station_placement || '').toLowerCase();
          const roleLower = (p.role || '').toLowerCase();
          return nameLower.includes('owner') || 
                 placementLower.includes('owner') || 
                 placementLower.includes('manager') || 
                 placementLower.includes('atasan') || 
                 roleLower === 'manager';
        });

        const processLeaderboardData = (profileList) => {
          return profileList.map(person => {
            const pts = person.total_points !== null && person.total_points !== undefined ? Number(person.total_points) : 100;
            let totalBreakMinutes = 0;
            let breakCount = 0;
            let hasOverBreakHistory = false;
            
            const personLogs = (logs || []).filter(l => l.user_id === person.id);

            personLogs.forEach(log => {
              if (log.discipline_status === 'Overbreak' || 
                  (log.penalty_points && Number(log.penalty_points) > 0) || 
                  (log.status_in && log.status_in.toLowerCase().includes('terlambat'))) {
                hasOverBreakHistory = true;
              }

              if (log.break_start_time && log.break_end_time) {
                breakCount += 1;
                const start = new Date(log.break_start_time);
                const end = new Date(log.break_end_time);
                const actualMins = Math.floor((end.getTime() - start.getTime()) / 60000);
                totalBreakMinutes += actualMins;

                const checkInHour = log.actual_in ? new Date(log.actual_in).getHours() : 0;
                const allowedMins = (checkInHour === 22) ? 30 : 60;

                if (actualMins > allowedMins) {
                  hasOverBreakHistory = true;
                }
              }
            });

            const isBebal = pts < 100 || (pts <= 100 && hasOverBreakHistory);

            return {
              id: person.id,
              name: person.full_name || 'Staff Member',
              avatar: person.avatar,
              role: person.station_placement || person.role || 'Staff Crew', 
              points: pts,
              isBebal: isBebal,
              hasOverBreakHistory: hasOverBreakHistory,
              breakInfo: breakCount > 0 ? `${breakCount}x Break (${totalBreakMinutes} Menit)${hasOverBreakHistory ? ' ⚠️ Over' : ' ✓ Sesuai'}` : 'Belum Ada Break'
            };
          }).sort((a, b) => b.points - a.points);
        };

        setLeaderboard(processLeaderboardData(filteredCrewProfiles));
        setManagerLeaderboard(processLeaderboardData(filteredManagerProfiles));
      }
    } catch (e) {
      console.error("Error leaderboard:", e);
    } finally {
      setIsFetchingLeaderboard(false);
    }
  };

  const fetchBreakLogs = async () => {
    if (!user?.id) return;
    setIsFetchingLogs(true);
    try {
      const { data, error } = await supabase
        .from('attendance_logs')
        .select('id, created_at, break_start_time, break_end_time, image_url, after_break_image_url, discipline_status, actual_in')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (!error && data) {
        const filteredLogs = data.filter(log => log.break_start_time);
        setBreakLogs(filteredLogs);
      }
    } catch (e) {
      console.error("Gagal memuat rekap log break:", e);
    } finally {
      setIsFetchingLogs(false);
    }
  };

  const fetchAllCrewLogs = async () => {
    setIsFetchingAllLogs(true);
    try {
      const { data: logs, error: lError } = await supabase
        .from('attendance_logs')
        .select('id, user_id, created_at, break_start_time, break_end_time, image_url, after_break_image_url, actual_in')
        .not('break_start_time', 'is', null)
        .order('created_at', { ascending: false });

      const { data: profiles, error: pError } = await supabase
        .from('user_profiles')
        .select('id, full_name, station_placement, role');

      if (!lError && !pError && logs && profiles) {
        const profileMap = {};
        const isManagerMap = {};
        
        profiles.forEach(p => { 
          profileMap[p.id] = p.full_name;
          const nameLower = (p.full_name || '').toLowerCase();
          const placementLower = (p.station_placement || '').toLowerCase();
          const roleLower = (p.role || '').toLowerCase();
          
          isManagerMap[p.id] = nameLower.includes('owner') || 
                               placementLower.includes('owner') || 
                               placementLower.includes('manager') || 
                               placementLower.includes('atasan') ||
                               roleLower === 'manager';
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

        const crewLogsArray = [];
        const managerLogsArray = [];

        logs.forEach(log => {
          let durationString = 'Sedang Istirahat';
          let isOver = false;

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
            isOverBreak: isOver
          };

          if (isManagerMap[log.user_id]) {
            managerLogsArray.push(processedLog);
          } else {
            crewLogsArray.push(processedLog);
          }
        });

        setAllCrewLogs(crewLogsArray);
        setManagerCrewLogs(managerLogsArray);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsFetchingAllLogs(false);
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
    const file = e.target.files[0];
    if (!file || !user?.id) return;
    
    try {
      setIsUpdatingProfile(true);
      const compressed = await imageCompression(file, { maxSizeMB: 0.2, maxWidthOrHeight: 400 });
      const filePath = `avatars/${user.id}-${Date.now()}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from('attendance-proofs')
        .upload(filePath, compressed, {
          contentType: 'image/jpeg',
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

  useEffect(() => {
    if (activeTab === 'history') {
      fetchBreakLogs();
    } else if (activeTab === 'live-break') {
      fetchLiveBreakData();
    } else if (activeTab === 'leaderboard') {
      fetchLeaderboard();
    } else if (activeTab === 'all-logs') {
      fetchAllCrewLogs();
    } else if (activeTab === 'profile' && profile) {
      setEditName(profile.full_name || '');
      setEditPhone(profile.whatsapp_number || '');
      setEditAvatar(profile.avatar || '');
    }
  }, [activeTab, profile]);

  const fetchAttendanceStatus = async () => {
    if (!user?.id) return;
    try {
      const { data: prof } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
        
      if (prof) {
        setProfile(prof);
        if (prof.station_placement) setSelectedStation(prof.station_placement);

        if (prof.company_id) {
          try {
            const { data: rulesData, error: rError } = await supabase
              .from('companies') 
              .select('latitude, longitude, radius_meter')
              .eq('id', prof.company_id)
              .maybeSingle();
              
            if (!rError && rulesData) {
              setOfficeRules(rulesData);
            }
          } catch (err) {
            console.error("Gagal sinkronisasi aturan:", err);
          }
        }
      }

      const { data: activeLogs } = await supabase
        .from('attendance_logs')
        .select('id, actual_in, actual_out, break_start_time, break_end_time, discipline_status, status_in') 
        .eq('user_id', user.id)
        .is('actual_out', null)
        .order('created_at', { ascending: false })
        .limit(1);

      let currentLog = null;
      if (activeLogs && activeLogs.length > 0) {
        currentLog = activeLogs[0];
      } else {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const { data: logs } = await supabase
          .from('attendance_logs')
          .select('id, actual_in, actual_out, break_start_time, break_end_time, discipline_status, status_in') 
          .eq('user_id', user.id)
          .gte('created_at', todayStart.toISOString())
          .order('created_at', { ascending: false })
          .limit(1);

        if (logs && logs.length > 0) {
          currentLog = logs[0];
        }
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
        
        const breaking = (!!currentLog.break_start_time && !currentLog.break_end_time) || currentLog.discipline_status === 'Sedang Istirahat';
        
        if (breaking) {
          setIsOnBreak(true);
          if (currentLog.break_start_time) {
            setBreakStartTime(new Date(currentLog.break_start_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Makassar' }) + ' WITA');
          } else {
            setBreakStartTime(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Makassar' }) + ' WITA');
          }
          
          let checkInHour = 0;
          try {
            const hourStr = currentLog.actual_in ? new Date(currentLog.actual_in).toLocaleTimeString('en-US', { hour: '2-digit', hour12: false, timeZone: 'Asia/Makassar' }) : '0';
            checkInHour = parseInt(hourStr);
          } catch(e) {
            checkInHour = currentLog.actual_in ? new Date(currentLog.actual_in).getHours() : 0;
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
  };

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
  }, [user]);

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
      (error) => {
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
    }

    try {
      const timestampIso = new Date().toISOString();
      const now = new Date();
      let publicUrl = null;

      if (cameraMode === 'START_BREAK' || cameraMode === 'END_BREAK' || cameraMode === 'IN' || cameraMode === 'OUT') {
        const res = await fetch(capturedImage);
        const blob = await res.blob();
        
        const compressed = await imageCompression(blob, { 
          maxSizeMB: 0.15, 
          maxWidthOrHeight: 800,
          useWebWorker: true 
        });
        
        const filePath = `logs/${user.id}-${Date.now()}.jpg`;
        const { error: uploadError } = await supabase.storage
          .from('attendance-proofs')
          .upload(filePath, compressed, {
            contentType: 'image/jpeg',
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

        // OTOMATIS LEVEL MANAGER MENJADI 'Manager'
        const actualStationPlacement = isManager ? 'Manager' : selectedStation;

        let statusInText = `Shift ${selectedShiftHour.toString().padStart(2, '0')}:00 (Tepat Waktu) - ${actualStationPlacement}`;
        let lateMinutes = 0;
        let financialLoss = 0;

        if (now > scheduledTime) {
          lateMinutes = Math.floor((now.getTime() - scheduledTime.getTime()) / 60000);
          statusInText = `Shift ${selectedShiftHour.toString().padStart(2, '0')}:00 (Terlambat ${lateMinutes}m) - ${actualStationPlacement}`;
          financialLoss = lateMinutes * 1000; 
        }

        // UPDATE PENEMPATAN STATION DI PROFIL USER
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

        // PEMOTONGAN POIN JUGA BERLAKU UNTUK MANAGER
        if (lateMinutes > 0) {
          const { data: currentProf } = await supabase
            .from('user_profiles')
            .select('total_points')
            .eq('id', user.id)
            .maybeSingle();

          const existingPts = currentProf?.total_points ?? 100;
          const updatedPts = Math.max(0, Number(existingPts) - lateMinutes);

          await supabase
            .from('user_profiles')
            .update({ total_points: updatedPts })
            .eq('id', user.id);
        }

      } else if (cameraMode === 'START_BREAK') {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

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
          setHasPlayedAlarm(false);
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

          // POIN KEDISIPLINAN JUGA DIHITUNG UNTUK MANAGER
          const { data: currentProf } = await supabase
            .from('user_profiles')
            .select('total_points')
            .eq('id', user.id)
            .maybeSingle();

          const existingPoints = currentProf?.total_points ?? 100;
          const updatedPoints = Math.max(0, Number(existingPoints) + pointChange);

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
        const { data: latestActiveLog } = await supabase
          .from('attendance_logs')
          .select('id')
          .eq('user_id', user.id)
          .is('actual_out', null)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        const targetLogId = latestActiveLog?.id || activeLogId;

        if (targetLogId) {
          await supabase.from('attendance_logs').update({
            actual_out: timestampIso,
            status_out: 'Sesuai Jadwal',
            discipline_status: 'Shift Selesai'
          }).eq('id', targetLogId);
        }
      }

      await fetchAttendanceStatus();
      if (activeTab === 'history') await fetchBreakLogs(); 
      await fetchLiveBreakData();
      await fetchLeaderboard(); 
      await fetchActiveShiftStats(); 
      
      setIsCameraOpen(false);
      setCapturedImage(null);
      alert("✓ Data Presensi & Poin Kedisiplinan Berhasil Diperbarui!");
    } catch (err) {
      alert(`Gagal sinkronisasi data: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const currentUserPoints = profile?.total_points !== null && profile?.total_points !== undefined ? Number(profile.total_points) : 100;
  const activeBadge = getCrewBadge(currentUserPoints);
  const activeLeaderboardData = (isManager && leaderboardCategory === 'manager') ? managerLeaderboard : leaderboard;
  const activeLogData = (isManager && logCategory === 'manager') ? managerCrewLogs : allCrewLogs;

  return (
    <div className="min-h-screen w-full bg-[#F8FAFC] flex justify-center font-sans antialiased text-slate-800">
      
      <style>{`
        header.sticky.top-0, 
        div.min-h-screen > header,
        body > div > header {
          display: none !important;
        }
      `}</style>

      {/* CONTAINER APLIKASI */}
      <div className="w-full max-w-md bg-[#F8FAFC] min-h-screen flex flex-col relative pb-20">
        
        {/* HEADER APLIKASI */}
        <div className="sticky top-0 w-full bg-white px-5 py-3.5 border-b border-slate-100 flex items-center justify-between z-30 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <img 
              src="/Diciplin-logo.png" 
              onError={(e) => { 
                e.target.onerror = null;
                e.target.src = "/logo.png";
              }} 
              alt="Diciplin Logo" 
              className="h-8 w-auto object-contain" 
            />
            <div className="flex flex-col">
              <span className="font-sans font-black text-base tracking-tight text-slate-900 leading-none">
                Diciplin<span className="text-indigo-600"></span>
              </span>
              <span className="text-[8px] font-bold text-slate-400 tracking-wider uppercase mt-0.5">Crew Attendance System</span>
            </div>
          </div>
          
          <button 
            onClick={async () => { await supabase.auth.signOut(); }} 
            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 text-[10px] font-extrabold rounded-xl border border-rose-100 uppercase tracking-wider transition-all active:scale-95"
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

            {/* WIDGET ELEGAN REKAP PERSONIL DI TIAP STATION (RESPONSIF & TEKS TIDAK TERPOTONG) */}
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

              {/* CARD REKAP ATAS (CREW & MANAGER) */}
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

              {/* DAFTAR GRID STATION BERSIH & RAPI */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <FiLayers className="text-indigo-600 text-xs"/> Personil Aktif per Station
                  </p>
                  <span className="text-[8px] font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">Live Counter</span>
                </div>

                {Object.keys(activeShiftStats.stationCounts).length === 0 ? (
                  <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl py-3 text-center text-[10px] font-semibold text-slate-400">
                    Tidak ada crew yang sedang standby di station (Sedang Break / Selesai Shift).
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

            {/* GPS GEOLOCATION LOADER */}
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
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] px-3 py-1.5 rounded-xl uppercase tracking-wider flex items-center gap-1 active:scale-95 transition-all"
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

            {/* PANEL MANAGER */}
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
                          {isFetchingProfiles ? 'Memuat Staff...' : '-- Pilih Staff --'}
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
                  <button type="submit" disabled={isSubmittingIzin} className="w-full bg-indigo-600 hover:bg-indigo-500 font-black py-2.5 rounded-xl text-xs uppercase tracking-wider shadow-sm flex items-center justify-center gap-1.5 transition-all active:scale-[0.98]">
                    <FiPlusCircle className="text-xs"/> Berikan Izin & Sync Radar
                  </button>
                </form>
              </div>
            )}

            {/* PRESENSI UTAMA CARD */}
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
                  disabled={!hasCheckedIn || hasCheckedOut || !isEligibleForCheckOut || isVerifyingLocation}
                  onClick={() => openCamera('OUT')}
                  className={`py-3.5 px-3 rounded-2xl border flex flex-col items-center justify-center gap-1.5 font-black text-xs transition-all duration-200 ${hasCheckedOut ? 'bg-slate-100 border-slate-200 text-slate-400' : !hasCheckedIn ? 'bg-slate-50 border-slate-200 text-slate-300' : !isEligibleForCheckOut ? 'bg-rose-50/50 border-rose-100 text-rose-400' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
                >
                  <div className={`p-2 rounded-xl ${hasCheckedOut ? 'bg-slate-200 text-slate-400' : isEligibleForCheckOut ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-300'}`}>
                    <FiLogOut className="text-lg" />
                  </div>
                  <span>Absen Pulang</span>
                </button>
              </div>

              {hasCheckedIn && !hasCheckedOut && !isEligibleForCheckOut && (
                <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-2.5 flex items-start gap-2">
                  <FiAlertCircle className="text-amber-600 mt-0.5 flex-shrink-0 text-sm" />
                  <p className="text-[10px] text-amber-900 font-bold leading-relaxed">Tombol checkout terkunci hingga Anda menyelesaikan total {requiredWorkHours} Jam Kerja.</p>
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
                    className="w-full bg-rose-600 hover:bg-rose-700 text-white font-black py-3 rounded-xl text-xs tracking-wider shadow-md shadow-rose-600/20 transition-all active:scale-[0.98]"
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
                    className={`w-full py-3.5 px-4 rounded-xl font-black text-xs tracking-wider transition-all duration-200 ${hasCheckedIn && !hasCheckedOut ? 'bg-slate-900 hover:bg-slate-800 text-white shadow-md active:scale-[0.98]' : 'bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed'}`}
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
                            className="bg-slate-900 hover:bg-slate-800 text-white font-black text-[9px] px-2 py-1 rounded-lg uppercase transition-colors"
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

        {/* ================= TAB 3: LEADERBOARD POIN ================= */}
        {activeTab === 'leaderboard' && (
          <div className="flex-1 px-4 py-4 space-y-4">
            <div className="flex flex-col space-y-0.5">
              <h2 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                <FiAward className="text-amber-500 text-lg" /> Status Kedisiplinan
              </h2>
              <p className="text-[10px] text-slate-400 font-medium">
                {isManager ? 'Pilih kategori daftar poin yang ingin ditampilkan.' : 'Rekapitulasi poin kedisiplinan crew.'}
              </p>
            </div>

            {isManager && (
              <div className="bg-slate-200/80 p-1 rounded-2xl flex gap-1 shadow-inner">
                <button
                  onClick={() => setLeaderboardCategory('crew')}
                  className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${leaderboardCategory === 'crew' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  Poin Crew
                </button>
                <button
                  onClick={() => setLeaderboardCategory('manager')}
                  className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${leaderboardCategory === 'manager' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  Poin Manager 🔒
                </button>
              </div>
            )}

            {isFetchingLeaderboard ? (
              <div className="text-center py-8 text-xs text-slate-400 font-medium animate-pulse">Menghitung matriks poin...</div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest flex items-center gap-1">
                    🌟 PALING RAJIN ({leaderboardCategory === 'manager' && isManager ? 'MANAGER' : 'CREW'})
                  </p>
                  <div className="bg-white border border-slate-200/70 rounded-2xl divide-y divide-slate-100 shadow-xs overflow-hidden">
                    {activeLeaderboardData.filter(c => !c.isBebal).length === 0 ? (
                      <div className="p-4 text-center text-xs font-bold text-slate-400">Belum ada user di Top Tier.</div>
                    ) : (
                      activeLeaderboardData.filter(c => !c.isBebal).map((person, index) => (
                        <div className="p-3.5 flex items-center justify-between w-full" key={person.id}>
                          <div className="flex items-center space-x-3">
                            <span className="font-mono text-xs font-bold text-slate-400 w-4">{index + 1}.</span>
                            <img src={person.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100"} className="w-9 h-9 rounded-xl object-cover border border-slate-100 shadow-xs" alt="Avatar" />
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
                    {activeLeaderboardData.filter(c => c.isBebal).length === 0 ? (
                      <div className="p-4 text-center text-xs font-bold text-slate-400">0 User dalam zona bahaya kedisiplinan.</div>
                    ) : (
                      activeLeaderboardData.filter(c => c.isBebal).map((person, index) => (
                        <div key={person.id} className="p-3.5 flex items-center justify-between bg-rose-50/20">
                          <div className="flex items-center space-x-3">
                            <span className="font-mono text-xs font-bold text-rose-500 w-4">{index + 1}.</span>
                            <img src={person.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100"} className="w-9 h-9 rounded-xl object-cover border border-rose-100 shadow-xs" alt="Avatar" />
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
            )}
          </div>
        )}

        {/* ================= TAB 4: LOG FOTO ISTIRAHAT ================= */}
        {activeTab === 'all-logs' && (
          <div className="flex-1 px-4 py-4 space-y-3">
            <div className="flex flex-col space-y-0.5">
              <h2 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                <FiImage className="text-indigo-600 text-lg" /> Log Foto Istirahat
              </h2>
              <p className="text-[10px] text-slate-400 font-medium">Data arsip foto verifikasi kamera cloud.</p>
            </div>

            {isManager && (
              <div className="bg-slate-200/80 p-1 rounded-2xl flex gap-1 shadow-inner">
                <button
                  onClick={() => setLogCategory('crew')}
                  className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${logCategory === 'crew' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  Log Crew
                </button>
                <button
                  onClick={() => setLogCategory('manager')}
                  className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${logCategory === 'manager' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  Log Manager 🔒
                </button>
              </div>
            )}

            {isFetchingAllLogs ? (
              <div className="text-center py-8 text-xs text-slate-400 font-medium animate-pulse">Menghubungkan cloud storage...</div>
            ) : activeLogData.length === 0 ? (
              <div className="bg-white border border-slate-200/70 rounded-2xl p-6 text-center text-xs text-slate-400 font-medium shadow-xs">
                Belum ada aktivitas log break {logCategory === 'manager' && isManager ? 'manager' : 'crew'} hari ini.
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
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">Foto Mulai</span>
                        {log.image_url ? (
                          <img src={log.image_url} className="w-full aspect-[3/4] rounded-xl object-cover border border-slate-100 shadow-xs" alt="Mulai" />
                        ) : (
                          <div className="w-full aspect-[3/4] rounded-xl bg-slate-50 border border-dashed flex items-center justify-center text-[9px] text-slate-400 font-bold">No Image</div>
                        )}
                      </div>
                      <div className="space-y-1">
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">Foto Selesai</span>
                        {log.after_break_image_url ? (
                          <img src={log.after_break_image_url} className="w-full aspect-[3/4] rounded-xl object-cover border border-slate-100 shadow-xs" alt="Selesai" />
                        ) : (
                          <div className="w-full aspect-[3/4] rounded-xl bg-slate-50 border border-dashed flex items-center justify-center text-[9px] text-slate-400 font-bold">In Progress</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
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

              <button type="submit" disabled={isUpdatingProfile} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-2xl text-xs tracking-wider shadow-md transition-all active:scale-[0.98]">
                {isUpdatingProfile ? 'Menyimpan...' : 'Simpan Pembaruan Profil'}
              </button>
            </form>
          </div>
        )}

        {/* ================= FIXED BOTTOM NAV BAR ================= */}
        <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/95 backdrop-blur-xl border-t border-slate-200/80 px-2 py-2 flex justify-between items-center z-40 shadow-[0_-4px_25px_rgba(0,0,0,0.05)]">
          <button onClick={() => setActiveTab('absen')} className={`flex-1 flex flex-col items-center gap-1 py-1 transition-all ${activeTab === 'absen' ? 'text-indigo-600 font-black scale-105' : 'text-slate-400 font-bold hover:text-slate-700'}`}>
            <FiLayout className="text-lg" /> <span className="text-[9px] tracking-tight">Absen</span>
          </button>
          <button onClick={() => setActiveTab('live-break')} className={`flex-1 flex flex-col items-center gap-1 py-1 transition-all ${activeTab === 'live-break' ? 'text-indigo-600 font-black scale-105' : 'text-slate-400 font-bold hover:text-slate-700'}`}>
            <FiUsers className="text-lg" /> <span className="text-[9px] tracking-tight">Live</span>
          </button>
          <button onClick={() => setActiveTab('leaderboard')} className={`flex-1 flex flex-col items-center gap-1 py-1 transition-all ${activeTab === 'leaderboard' ? 'text-indigo-600 font-black scale-105' : 'text-slate-400 font-bold hover:text-slate-700'}`}>
            <FiAward className="text-lg" /> <span className="text-[9px] tracking-tight">Poin</span>
          </button>
          <button onClick={() => setActiveTab('all-logs')} className={`flex-1 flex flex-col items-center gap-1 py-1 transition-all ${activeTab === 'all-logs' ? 'text-indigo-600 font-black scale-105' : 'text-slate-400 font-bold hover:text-slate-700'}`}>
            <FiRotateCcw className="text-lg" /> <span className="text-[9px] tracking-tight">Log</span>
          </button>
          <button onClick={() => setActiveTab('profile')} className={`flex-1 flex flex-col items-center gap-1 py-1 transition-all ${activeTab === 'profile' ? 'text-indigo-600 font-black scale-105' : 'text-slate-400 font-bold hover:text-slate-700'}`}>
            <FiSettings className="text-lg" /> <span className="text-[9px] tracking-tight">Profil</span>
          </button>
        </div>

        {/* MODAL PILIHAN JAM SHIFT & STATION KHUSUS CREW */}
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
                <button onClick={() => setShowShiftPicker(false)} className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
                  <FiX className="text-lg"/>
                </button>
              </div>

              {/* 1. PEMILIHAN STATION KHUSUS CREW */}
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
                          className={`px-3 py-2 rounded-xl text-left font-bold text-[10px] transition-all flex items-center justify-between border ${isSelected ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200/80'}`}
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

              {/* 2. PEMILIHAN JAM SHIFT */}
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
                        className={`p-2 rounded-xl border flex items-center justify-center gap-1.5 transition-all text-[10px] font-black ${isSelected ? 'bg-slate-900 text-white border-slate-900 shadow-sm' : 'bg-slate-50 text-slate-700 border-slate-200/80 hover:bg-indigo-50'}`}
                      >
                        <FiClock className="text-xs"/>
                        <span>{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ACTION FOOTER */}
              <div className="pt-2 space-y-2">
                <button 
                  type="button"
                  onClick={handleConfirmShiftAndOpenCamera} 
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-3 rounded-2xl text-xs uppercase tracking-wider shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5"
                >
                  <FiCamera className="text-sm" /> Lanjutkan Buka Kamera
                </button>
                <button 
                  type="button"
                  onClick={() => setShowShiftPicker(false)} 
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-2.5 rounded-xl text-xs transition-colors"
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
              <button type="button" onClick={closeCamera} className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-full transition-colors">
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
                        className="bg-indigo-600 hover:bg-indigo-500 text-white p-5 rounded-full shadow-2xl border-4 border-white/80 active:scale-95 transition-transform flex items-center justify-center"
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
                    className="flex-1 bg-slate-800 text-slate-200 font-bold py-3.5 rounded-2xl text-xs border border-slate-700 hover:bg-slate-700 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <FiRefreshCw /> Foto Ulang
                  </button>
                  <button 
                    type="button" 
                    disabled={isLoading} 
                    onClick={handleConfirmSubmission} 
                    className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-black py-3.5 rounded-2xl text-xs shadow-lg shadow-indigo-600/30 transition-colors flex items-center justify-center gap-1.5"
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