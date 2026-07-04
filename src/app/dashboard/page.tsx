'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSession } from '@/lib/SessionContext';
import { dataService, isDemoMode, setDemoMode } from '@/lib/dataService';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

const BAPPEDA_LAT = 5.559385;
const BAPPEDA_LNG = 95.318464;
const ALLOWED_RADIUS_M = 100;



export default function DashboardPage() {
  const { user, logout } = useSession();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [interns, setInterns] = useState<any[]>([]);
  const [mentors, setMentors] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [grades, setGrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Intern specific state
  const [todayAttendance, setTodayAttendance] = useState<any | null>(null);
  const [timeStr, setTimeStr] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<'present' | 'sick' | 'leave'>('present');
  const [showCheckInForm, setShowCheckInForm] = useState(false);
  const [attendancePercentage, setAttendancePercentage] = useState<number>(100);

  // GPS Geofencing states
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [distanceMeters, setDistanceMeters] = useState<number | null>(null);
  const [isInRadius, setIsInRadius] = useState<boolean | null>(null);

  // File upload states
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Development GPS Mocking
  const [isLocalhost, setIsLocalhost] = useState(false);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsLocalhost(window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    }
  }, []);

  // Camera & selfie states
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);

  const startCamera = async () => {
    setUploadError(null);
    setCameraActive(true);
    setSelfiePreview(null);
    setAttachmentUrl('');

    try {
      const constraints = {
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setMediaStream(stream);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch (err: any) {
      console.error('Gagal mengakses kamera:', err);
      setCameraActive(false);
      setUploadError('Tidak dapat mengakses kamera. Pastikan izin kamera telah diberikan.');
    }
  };

  const stopCamera = () => {
    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop());
      setMediaStream(null);
    }
    setCameraActive(false);
  };

  const capturePhoto = async () => {
    if (!videoRef.current) return;

    setUploading(true);
    setUploadError(null);

    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;

      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Gagal inisialisasi context canvas.');

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const dataUrl = canvas.toDataURL('image/jpeg');
      setSelfiePreview(dataUrl);

      stopCamera();

      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const file = new File([blob], `selfie-${user?.id || 'unknown'}-${Date.now()}.jpg`, { type: 'image/jpeg' });

      const fileName = `selfie-${user?.id || 'unknown'}-${Date.now()}.jpg`;
      const filePath = `${fileName}`;

      if (isDemoMode) {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        setAttachmentUrl(`https://demo-mode.bappeda/proofs/${fileName}`);
      } else {
        const { data, error } = await supabase.storage
          .from('attendance-proofs')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
          .from('attendance-proofs')
          .getPublicUrl(filePath);

        setAttachmentUrl(publicUrl);
      }
    } catch (err: any) {
      console.error('Gagal menangkap foto:', err);
      setUploadError(err.message || 'Gagal mengambil foto. Silakan coba lagi.');
    } finally {
      setUploading(false);
    }
  };

  const handleCloseForm = () => {
    stopCamera();
    setShowCheckInForm(false);
    setNotes('');
    setStatus('present');
    setAttachmentUrl('');
    setSelfiePreview(null);
    setUploading(false);
    setUploadError(null);
    setUserCoords(null);
    setDistanceMeters(null);
    setIsInRadius(null);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Ukuran file maksimal adalah 5MB.');
      setUploading(false);
      return;
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `proof-${user.id}-${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    try {
      if (isDemoMode) {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        setAttachmentUrl(`https://demo-mode.bappeda/proofs/${fileName}`);
      } else {
        const { data, error } = await supabase.storage
          .from('attendance-proofs')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
          .from('attendance-proofs')
          .getPublicUrl(filePath);

        setAttachmentUrl(publicUrl);
      }
    } catch (err: any) {
      console.error('Gagal mengunggah dokumen:', err);
      setUploadError(err.message || 'Gagal mengunggah file. Silakan coba lagi.');
    } finally {
      setUploading(false);
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // Earth radius in meters
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) *
        Math.cos(phi2) *
        Math.sin(deltaLambda / 2) *
        Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // distance in meters
  };

  const fetchLocation = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setGpsError('Browser Anda tidak mendukung deteksi lokasi.');
      return;
    }

    setGpsLoading(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserCoords({ latitude, longitude });

        const dist = calculateDistance(latitude, longitude, BAPPEDA_LAT, BAPPEDA_LNG);
        setDistanceMeters(Math.round(dist));
        setIsInRadius(dist <= ALLOWED_RADIUS_M);
        setGpsLoading(false);
      },
      (error) => {
        console.error('Error fetching GPS:', error);
        let errMsg = 'Gagal mendeteksi lokasi GPS.';
        if (error.code === error.PERMISSION_DENIED) {
          errMsg = 'Akses lokasi ditolak. Harap izinkan GPS di browser Anda.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errMsg = 'Informasi lokasi tidak tersedia.';
        } else if (error.code === error.TIMEOUT) {
          errMsg = 'Waktu permintaan lokasi habis (timeout).';
        }
        setGpsError(errMsg);
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const simulateAtBappeda = () => {
    setGpsLoading(true);
    setGpsError(null);
    setTimeout(() => {
      setUserCoords({ latitude: BAPPEDA_LAT, longitude: BAPPEDA_LNG });
      setDistanceMeters(0);
      setIsInRadius(true);
      setGpsLoading(false);
    }, 500);
  };

  useEffect(() => {
    // Clock helper
    const timer = setInterval(() => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB');
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const loadDashboardData = async (retryWithDemo = true) => {
    try {
      setLoading(true);
      const annList = await dataService.announcements.getAll();
      setAnnouncements(annList);

      if (user.role === 'admin') {
        const intList = await dataService.interns.getAll();
        const menList = await dataService.mentors.getAll();
        const attList = await dataService.attendance.getAll();
        const actList = await dataService.activities.getAll();
        const grdList = await dataService.grades.getAll();

        setInterns(intList);
        setMentors(menList);
        setAttendance(attList);
        setActivities(actList);
        setGrades(grdList);
      } else if (user.role === 'mentor') {
        const intList = await dataService.interns.getAll();
        // Filter interns under this mentor
        const filteredInt = intList.filter((i) => i.mentor_id === user.id);
        const attList = await dataService.attendance.getAll();
        const actList = await dataService.activities.getAll();
        const grdList = await dataService.grades.getAll();

        setInterns(filteredInt);
        setAttendance(attList.filter((a) => filteredInt.some((i) => i.id === a.intern_id)));
        setActivities(actList.filter((a) => filteredInt.some((i) => i.id === a.intern_id)));
        setGrades(grdList.filter((g) => filteredInt.some((i) => i.id === g.intern_id)));
      } else if (user.role === 'intern') {
        const todayAtt = await dataService.attendance.getToday(user.id);
        setTodayAttendance(todayAtt);
        
        const myAtt = await dataService.attendance.getForIntern(user.id);
        const myAct = await dataService.activities.getForIntern(user.id);
        setAttendance(myAtt);
        setActivities(myAct);

        const pct = await dataService.attendance.getPercentage(user.id);
        setAttendancePercentage(pct);
      }
    } catch (err) {
      console.error('Gagal memuat data dasbor:', err);
      if (retryWithDemo && !isDemoMode) {
        console.warn('Terjadi kesalahan koneksi database. Otomatis beralih ke Mode Demo...');
        setDemoMode(true);
        await loadDashboardData(false);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  // Check in action
  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await dataService.attendance.checkIn(
        user.id, 
        status, 
        notes, 
        attachmentUrl || '', 
        userCoords?.latitude || null, 
        userCoords?.longitude || null, 
        isInRadius
      );
      handleCloseForm();
      await loadDashboardData();
    } catch (err) {
      alert('Gagal check-in. Silakan coba lagi.');
    }
  };

  // Check out action
  const handleCheckOut = async () => {
    if (confirm('Apakah Anda yakin ingin check-out pulang hari ini?')) {
      try {
        await dataService.attendance.checkOut(user.id);
        await loadDashboardData();
      } catch (err: any) {
        alert(err.message || 'Gagal check-out.');
      }
    }
  };

  // Quick Approve Activity
  const handleApproveActivity = async (actId: string) => {
    try {
      await dataService.activities.review(actId, 'approved', 'Disetujui via dashboard.');
      await loadDashboardData();
    } catch (err) {
      alert('Gagal menyetujui jurnal.');
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3">
        <svg className="animate-spin h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span className="text-slate-500 font-bold text-sm tracking-wide">Memuat Dasbor...</span>
      </div>
    );
  }

  const todayStr = new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  // 1. Intern Attendance Donut Chart Constants
  const presentCount = attendance.filter((a) => a.status === 'present').length;
  const leaveCount = attendance.filter((a) => a.status === 'leave').length;
  const sickCount = attendance.filter((a) => a.status === 'sick').length;
  const totalAtt = presentCount + leaveCount + sickCount;

  const circ = 2 * Math.PI * 50; // 314.159 (radius = 50)
  const presentPct = totalAtt > 0 ? (presentCount / totalAtt) : 0;
  const leavePct = totalAtt > 0 ? (leaveCount / totalAtt) : 0;
  const sickPct = totalAtt > 0 ? (sickCount / totalAtt) : 0;

  const presentStroke = circ * presentPct;
  const leaveStroke = circ * leavePct;
  const sickStroke = circ * sickPct;

  const presentOffset = 0;
  const leaveOffset = presentStroke;
  const sickOffset = presentStroke + leaveStroke;

  // 2. Admin & Mentor Weekly Attendance Bar Chart Constants
  const getLast5Days = () => {
    const days = [];
    for (let i = 4; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d);
    }
    return days;
  };
  const last5Days = getLast5Days();
  const dayLabels = last5Days.map(d => d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' }));
  const dayKeys = last5Days.map(d => d.toLocaleDateString('sv').split('T')[0]);
  const dayCounts = dayKeys.map(key => {
    return attendance.filter(a => a.date === key && a.status === 'present').length;
  });
  const maxCount = Math.max(...dayCounts, 1);

  // 3. Admin & Mentor Grade Distribution Donut Chart Constants
  const gradeA = grades.filter(g => g.final_grade >= 85).length;
  const gradeB = grades.filter(g => g.final_grade >= 75 && g.final_grade < 85).length;
  const gradeC = grades.filter(g => g.final_grade >= 60 && g.final_grade < 75).length;
  const gradeD = grades.filter(g => g.final_grade < 60).length;
  const totalGrades = gradeA + gradeB + gradeC + gradeD;

  const gCirc = 2 * Math.PI * 45; // 282.743 (radius = 45)
  const pctA = totalGrades > 0 ? (gradeA / totalGrades) : 0;
  const pctB = totalGrades > 0 ? (gradeB / totalGrades) : 0;
  const pctC = totalGrades > 0 ? (gradeC / totalGrades) : 0;
  const pctD = totalGrades > 0 ? (gradeD / totalGrades) : 0;

  const strokeA = gCirc * pctA;
  const strokeB = gCirc * pctB;
  const strokeC = gCirc * pctC;
  const strokeD = gCirc * pctD;

  const offsetA = 0;
  const offsetB = strokeA;
  const offsetC = strokeA + strokeB;
  const offsetD = strokeA + strokeB + strokeC;

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Header Greeting */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-950 p-5 sm:p-6 rounded-2xl text-white shadow-xl shadow-slate-900/10 relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f766e_1px,transparent_1px),linear-gradient(to_bottom,#0f766e_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20"></div>
        <div className="relative z-10 space-y-1.5">
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
            Selamat Datang, <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">{user.full_name}</span>
          </h2>
          <p className="text-slate-350 text-xs font-semibold flex items-center gap-2">
            <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>{todayStr}</span>
            <span className="text-slate-600">|</span>
            <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-mono">{timeStr || 'Memuat waktu...'}</span>
          </p>
        </div>
        <div className="relative z-10 shrink-0">
          <span className="inline-flex items-center px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider bg-white/10 backdrop-blur border border-white/20 text-emerald-300 gap-1.5 shadow-inner">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            {user.role === 'admin' ? 'Administrator' : user.role === 'mentor' ? 'Mentor Instansi' : 'Anak Magang'}
          </span>
        </div>
      </div>

      {/* ====================================================
          1. ADMINISTRATOR DASHBOARD
         ==================================================== */}
      {user.role === 'admin' && (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4.5">
            
            {/* Card 1 */}
            <div className="bg-white p-4.5 rounded-xl border border-slate-200/80 shadow-sm flex items-center gap-4 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
              <div className="w-10.5 h-10.5 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-inner group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300">
                <svg className="w-5.5 h-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <p className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider">Total Anak Magang</p>
                <h4 className="text-xl font-black text-slate-900 mt-0.5">{interns.length} Anak</h4>
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-white p-4.5 rounded-xl border border-slate-200/80 shadow-sm flex items-center gap-4 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
              <div className="w-10.5 h-10.5 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shadow-inner group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                <svg className="w-5.5 h-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider">Mentor Aktif</p>
                <h4 className="text-xl font-black text-slate-900 mt-0.5">{mentors.length} Staf</h4>
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-white p-4.5 rounded-xl border border-slate-200/80 shadow-sm flex items-center gap-4 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
              <div className="w-10.5 h-10.5 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shadow-inner group-hover:bg-amber-600 group-hover:text-white transition-all duration-300">
                <svg className="w-5.5 h-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <p className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider">Jurnal Perlu Tinjauan</p>
                <h4 className="text-xl font-black text-slate-900 mt-0.5">{activities.filter((a) => a.status === 'pending').length} Log</h4>
              </div>
            </div>

            {/* Card 4 */}
            <div className="bg-white p-4.5 rounded-xl border border-slate-200/80 shadow-sm flex items-center gap-4 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
              <div className="w-10.5 h-10.5 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-inner group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                <svg className="w-5.5 h-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider">Hadir Hari Ini</p>
                <h4 className="text-xl font-black text-slate-900 mt-0.5">
                  {attendance.filter((a) => a.date === new Date().toLocaleDateString('sv').split('T')[0] && a.status === 'present').length} Orang
                </h4>
              </div>
            </div>
          </div>

          {/* Visual Analytics Charts Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4.5 mt-5">
            {/* Chart 1: Attendance Trend */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between min-h-[220px]">
              <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-2">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 font-sans">
                  📈 Tren Kehadiran Mingguan (Orang)
                </span>
                <span className="text-[10px] text-slate-400 font-extrabold uppercase font-sans">Last 5 Days</span>
              </div>
              <div className="flex items-end justify-around h-32 pt-4 px-2 w-full">
                {dayLabels.map((label, idx) => {
                  const count = dayCounts[idx];
                  const heightPct = maxCount > 0 ? (count / maxCount) * 100 : 0;
                  return (
                    <div key={idx} className="flex flex-col items-center gap-2 flex-1 group">
                      <div className="relative w-7 sm:w-10 bg-slate-50 rounded-md h-24 flex items-end shadow-inner overflow-hidden border border-slate-150">
                        <div 
                          className="bg-emerald-500 hover:bg-emerald-600 w-full rounded-b-md transition-all duration-500 ease-out group-hover:opacity-90 relative"
                          style={{ height: `${heightPct}%` }}
                        >
                          <span className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white text-[9px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity font-bold pointer-events-none whitespace-nowrap z-20 shadow-md">
                            {count} Orang
                          </span>
                        </div>
                      </div>
                      <span className="text-[9px] font-extrabold text-slate-550 uppercase tracking-tight text-center truncate w-full">
                        {label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Chart 2: Grade Distribution */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between min-h-[220px] gap-6">
              <div className="flex-1 w-full space-y-4">
                <div className="mb-2 border-b border-slate-100 pb-2 flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 font-sans">
                    🏆 Distribusi Nilai Kelulusan Magang
                  </span>
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase font-sans">{totalGrades} Total</span>
                </div>
                
                <div className="space-y-2 text-[10px] font-extrabold uppercase tracking-wide">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded bg-[#10b981]"></span>
                      <span className="text-slate-600">Sangat Baik (A)</span>
                    </div>
                    <span className="text-slate-800 font-black">{gradeA} Anak ({totalGrades > 0 ? Math.round((gradeA/totalGrades)*100) : 0}%)</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded bg-[#f59e0b]"></span>
                      <span className="text-slate-600">Baik (B)</span>
                    </div>
                    <span className="text-slate-800 font-black">{gradeB} Anak ({totalGrades > 0 ? Math.round((gradeB/totalGrades)*100) : 0}%)</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded bg-[#ef4444]"></span>
                      <span className="text-slate-600">Cukup (C)</span>
                    </div>
                    <span className="text-slate-800 font-black">{gradeC} Anak ({totalGrades > 0 ? Math.round((gradeC/totalGrades)*100) : 0}%)</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded bg-[#6b7280]"></span>
                      <span className="text-slate-600">Kurang (D/E)</span>
                    </div>
                    <span className="text-slate-800 font-black">{gradeD} Anak ({totalGrades > 0 ? Math.round((gradeD/totalGrades)*100) : 0}%)</span>
                  </div>
                </div>
              </div>

              {/* SVG Donut */}
              <div className="relative w-32 h-32 flex items-center justify-center shrink-0">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="45"
                    className="stroke-slate-100"
                    strokeWidth="8"
                    fill="transparent"
                  />
                  {totalGrades > 0 ? (
                    <>
                      <circle
                        cx="64"
                        cy="64"
                        r="45"
                        className="stroke-[#10b981] transition-all duration-500"
                        strokeWidth="8"
                        fill="transparent"
                        strokeDasharray={`${strokeA} ${gCirc}`}
                        strokeDashoffset={-offsetA}
                      />
                      <circle
                        cx="64"
                        cy="64"
                        r="45"
                        className="stroke-[#f59e0b] transition-all duration-500"
                        strokeWidth="8"
                        fill="transparent"
                        strokeDasharray={`${strokeB} ${gCirc}`}
                        strokeDashoffset={-offsetB}
                      />
                      <circle
                        cx="64"
                        cy="64"
                        r="45"
                        className="stroke-[#ef4444] transition-all duration-500"
                        strokeWidth="8"
                        fill="transparent"
                        strokeDasharray={`${strokeC} ${gCirc}`}
                        strokeDashoffset={-offsetC}
                      />
                      <circle
                        cx="64"
                        cy="64"
                        r="45"
                        className="stroke-[#6b7280] transition-all duration-500"
                        strokeWidth="8"
                        fill="transparent"
                        strokeDasharray={`${strokeD} ${gCirc}`}
                        strokeDashoffset={-offsetD}
                      />
                    </>
                  ) : (
                    <circle
                      cx="64"
                      cy="64"
                      r="45"
                      className="stroke-slate-200"
                      strokeWidth="8"
                      fill="transparent"
                    />
                  )}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-sm font-black text-slate-800">
                    Grade
                  </span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Sebaran</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Quick Actions & Recent Interns */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-1.5 bg-emerald-50 rounded-lg text-emerald-600">
                    <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                  </div>
                  <h3 className="text-base font-bold text-slate-900">
                    Pendaftaran Anak Magang Terbaru
                  </h3>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 text-sm text-left">
                    <thead>
                      <tr>
                        <th className="font-bold text-slate-400 pb-3 uppercase tracking-wider text-[10px]">Nama</th>
                        <th className="font-bold text-slate-400 pb-3 uppercase tracking-wider text-[10px]">Universitas/Sekolah</th>
                        <th className="font-bold text-slate-400 pb-3 uppercase tracking-wider text-[10px]">Mentor</th>
                        <th className="font-bold text-slate-400 pb-3 uppercase tracking-wider text-[10px]">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                      {interns.slice(0, 5).map((i) => (
                        <tr key={i.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-3.5 font-bold text-slate-900">{i.full_name}</td>
                          <td className="py-3.5 text-slate-550">{i.institution}</td>
                          <td className="py-3.5 text-slate-550">{i.mentor_name}</td>
                          <td className="py-3.5">
                            <span className="inline-flex px-2.5 py-0.5 text-xs font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                              Aktif
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-5 text-right border-t border-slate-100 pt-4">
                  <Link href="/dashboard/interns" className="text-sm font-bold text-emerald-600 hover:text-emerald-700 transition-colors hover:underline flex items-center justify-end gap-1.5 cursor-pointer">
                    <span>Lihat Seluruh Data Anak Magang</span>
                    <span>&rarr;</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* Announcements Side Panel */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-emerald-50 rounded-lg text-emerald-600">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Pengumuman
                  </h3>
                </div>
                <Link href="/dashboard/announcements" className="text-xs font-bold text-emerald-650 hover:text-emerald-750 transition-colors cursor-pointer border border-emerald-200 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100">
                  Tulis Baru
                </Link>
              </div>
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                {announcements.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-10 font-semibold">Tidak ada pengumuman terbaru.</p>
                ) : (
                  announcements.map((ann) => (
                    <div key={ann.id} className="p-4 bg-slate-50 hover:bg-slate-100/75 rounded-xl border border-slate-150 transition-all">
                      <h4 className="font-extrabold text-slate-900 text-sm leading-snug">{ann.title}</h4>
                      <p className="text-xs text-slate-550 mt-1.5 leading-relaxed line-clamp-3 font-medium">{ann.content}</p>
                      <div className="text-[10px] text-slate-400 mt-3 font-bold flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {new Date(ann.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ====================================================
          2. MENTOR DASHBOARD
         ==================================================== */}
      {user.role === 'mentor' && (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            
            {/* Card 1 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-inner group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Anak Bimbingan Aktif</p>
                <h4 className="text-2xl font-black text-slate-900 mt-1">{interns.length} Anak Magang</h4>
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-inner group-hover:bg-amber-600 group-hover:text-white transition-all duration-300">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Jurnal Perlu Tinjauan</p>
                <h4 className="text-2xl font-black text-slate-900 mt-1">
                  {activities.filter((a) => a.status === 'pending').length} Jurnal
                </h4>
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-inner group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Hadir Hari Ini</p>
                <h4 className="text-2xl font-black text-slate-900 mt-1">
                  {attendance.filter((a) => a.date === new Date().toLocaleDateString('sv').split('T')[0] && a.status === 'present').length} Anak
                </h4>
              </div>
            </div>
          </div>

          {/* Visual Analytics Charts Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4.5 mt-5">
            {/* Chart 1: Attendance Trend */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between min-h-[220px]">
              <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-2">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 font-sans">
                  📈 Tren Kehadiran Mingguan (Orang)
                </span>
                <span className="text-[10px] text-slate-400 font-extrabold uppercase font-sans">Last 5 Days</span>
              </div>
              <div className="flex items-end justify-around h-32 pt-4 px-2 w-full">
                {dayLabels.map((label, idx) => {
                  const count = dayCounts[idx];
                  const heightPct = maxCount > 0 ? (count / maxCount) * 100 : 0;
                  return (
                    <div key={idx} className="flex flex-col items-center gap-2 flex-1 group">
                      <div className="relative w-7 sm:w-10 bg-slate-50 rounded-md h-24 flex items-end shadow-inner overflow-hidden border border-slate-150">
                        <div 
                          className="bg-emerald-500 hover:bg-emerald-600 w-full rounded-b-md transition-all duration-500 ease-out group-hover:opacity-90 relative"
                          style={{ height: `${heightPct}%` }}
                        >
                          <span className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white text-[9px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity font-bold pointer-events-none whitespace-nowrap z-20 shadow-md">
                            {count} Orang
                          </span>
                        </div>
                      </div>
                      <span className="text-[9px] font-extrabold text-slate-550 uppercase tracking-tight text-center truncate w-full">
                        {label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Chart 2: Grade Distribution */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between min-h-[220px] gap-6">
              <div className="flex-1 w-full space-y-4">
                <div className="mb-2 border-b border-slate-100 pb-2 flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 font-sans">
                    🏆 Distribusi Nilai Kelulusan Anak Bimbingan
                  </span>
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase font-sans">{totalGrades} Total</span>
                </div>
                
                <div className="space-y-2 text-[10px] font-extrabold uppercase tracking-wide">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded bg-[#10b981]"></span>
                      <span className="text-slate-600">Sangat Baik (A)</span>
                    </div>
                    <span className="text-slate-800 font-black">{gradeA} Anak ({totalGrades > 0 ? Math.round((gradeA/totalGrades)*100) : 0}%)</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded bg-[#f59e0b]"></span>
                      <span className="text-slate-600">Baik (B)</span>
                    </div>
                    <span className="text-slate-800 font-black">{gradeB} Anak ({totalGrades > 0 ? Math.round((gradeB/totalGrades)*100) : 0}%)</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded bg-[#ef4444]"></span>
                      <span className="text-slate-600">Cukup (C)</span>
                    </div>
                    <span className="text-slate-800 font-black">{gradeC} Anak ({totalGrades > 0 ? Math.round((gradeC/totalGrades)*100) : 0}%)</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded bg-[#6b7280]"></span>
                      <span className="text-slate-600">Kurang (D/E)</span>
                    </div>
                    <span className="text-slate-800 font-black">{gradeD} Anak ({totalGrades > 0 ? Math.round((gradeD/totalGrades)*100) : 0}%)</span>
                  </div>
                </div>
              </div>

              {/* SVG Donut */}
              <div className="relative w-32 h-32 flex items-center justify-center shrink-0">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="45"
                    className="stroke-slate-100"
                    strokeWidth="8"
                    fill="transparent"
                  />
                  {totalGrades > 0 ? (
                    <>
                      <circle
                        cx="64"
                        cy="64"
                        r="45"
                        className="stroke-[#10b981] transition-all duration-500"
                        strokeWidth="8"
                        fill="transparent"
                        strokeDasharray={`${strokeA} ${gCirc}`}
                        strokeDashoffset={-offsetA}
                      />
                      <circle
                        cx="64"
                        cy="64"
                        r="45"
                        className="stroke-[#f59e0b] transition-all duration-500"
                        strokeWidth="8"
                        fill="transparent"
                        strokeDasharray={`${strokeB} ${gCirc}`}
                        strokeDashoffset={-offsetB}
                      />
                      <circle
                        cx="64"
                        cy="64"
                        r="45"
                        className="stroke-[#ef4444] transition-all duration-500"
                        strokeWidth="8"
                        fill="transparent"
                        strokeDasharray={`${strokeC} ${gCirc}`}
                        strokeDashoffset={-offsetC}
                      />
                      <circle
                        cx="64"
                        cy="64"
                        r="45"
                        className="stroke-[#6b7280] transition-all duration-500"
                        strokeWidth="8"
                        fill="transparent"
                        strokeDasharray={`${strokeD} ${gCirc}`}
                        strokeDashoffset={-offsetD}
                      />
                    </>
                  ) : (
                    <circle
                      cx="64"
                      cy="64"
                      r="45"
                      className="stroke-slate-200"
                      strokeWidth="8"
                      fill="transparent"
                    />
                  )}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-sm font-black text-slate-800">
                    Grade
                  </span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Sebaran</span>
                </div>
              </div>
            </div>
          </div>

          {/* Pending Journals (Verifikasi Cepat) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                
                <div className="flex items-center gap-2 mb-6">
                  <div className="p-1.5 bg-emerald-50 rounded-lg text-emerald-600">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Verifikasi Jurnal Harian (Pending)
                  </h3>
                </div>

                {activities.filter((a) => a.status === 'pending').length === 0 ? (
                  <div className="py-12 text-center text-slate-400 font-bold border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                    🙌 Semua jurnal bimbingan Anda sudah diverifikasi!
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activities.filter((a) => a.status === 'pending').map((act) => {
                      const internObj = interns.find((i) => i.id === act.intern_id);
                      return (
                        <div key={act.id} className="p-4 bg-slate-50 border border-slate-150 hover:border-slate-300 rounded-2xl flex flex-col sm:flex-row justify-between sm:items-center gap-4 transition-all duration-200">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black text-emerald-800 bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded-md">
                                {internObj?.full_name || 'Anak Magang'}
                              </span>
                              <span className="text-[10px] text-slate-400 font-extrabold flex items-center gap-1">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                {new Date(act.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                              </span>
                            </div>
                            <p className="text-slate-700 text-sm mt-3 font-semibold leading-relaxed">
                              {act.task_description}
                            </p>
                          </div>
                          <div className="flex gap-2 shrink-0 self-end sm:self-center">
                            <button
                              onClick={() => handleApproveActivity(act.id)}
                              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all active:scale-95"
                            >
                              Setujui
                            </button>
                            <Link
                              href="/dashboard/activities"
                              className="px-4 py-2 border border-slate-200 hover:bg-slate-150 text-slate-700 bg-white rounded-xl text-xs font-bold cursor-pointer transition-all active:scale-95"
                            >
                              Beri Catatan
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Announcements Panel */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <div className="p-1.5 bg-emerald-50 rounded-lg text-emerald-600">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  Pengumuman Instansi
                </h3>
              </div>
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                {announcements.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-10 font-semibold">Tidak ada pengumuman terbaru.</p>
                ) : (
                  announcements.map((ann) => (
                    <div key={ann.id} className="p-4 bg-slate-50 hover:bg-slate-100/75 rounded-xl border border-slate-150 transition-all">
                      <h4 className="font-extrabold text-slate-900 text-sm leading-snug">{ann.title}</h4>
                      <p className="text-xs text-slate-550 mt-1.5 leading-relaxed line-clamp-3 font-medium">{ann.content}</p>
                      <div className="text-[10px] text-slate-400 mt-3 font-bold flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {new Date(ann.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ====================================================
          3. INTERN (ANAK MAGANG) DASHBOARD
         ==================================================== */}
      {user.role === 'intern' && user?.internInfo?.status === 'pending' && (
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-md text-center max-w-xl mx-auto space-y-6 my-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-emerald-500/5 w-32 h-32 rounded-full translate-x-8 -translate-y-8 blur-xl"></div>
          <div className="mx-auto w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 text-3xl shadow-inner animate-pulse">
            ⏳
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-black text-slate-900">Menunggu Persetujuan Akun</h3>
            <p className="text-slate-500 text-sm font-semibold leading-relaxed">
              Halo <strong className="text-slate-800">{user.full_name}</strong>, akun magang Anda saat ini sedang berada dalam proses peninjauan oleh Admin Bappeda Aceh.
            </p>
          </div>

          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-150 text-left text-xs text-slate-600 space-y-3">
            <div className="font-extrabold text-slate-800 uppercase tracking-wider text-[10px]">Detail Pengajuan:</div>
            <div className="grid grid-cols-2 gap-y-2.5 gap-x-4 font-semibold">
              <div>
                <span className="text-slate-450 block text-[9px] uppercase font-bold">NIM / NISN</span>
                <span className="text-slate-800">{user.internInfo?.nim_nisn}</span>
              </div>
              <div>
                <span className="text-slate-450 block text-[9px] uppercase font-bold">Jurusan</span>
                <span className="text-slate-800">{user.internInfo?.major}</span>
              </div>
              <div>
                <span className="text-slate-450 block text-[9px] uppercase font-bold">Universitas/Sekolah</span>
                <span className="text-slate-800">{user.internInfo?.institution}</span>
              </div>
              <div>
                <span className="text-slate-450 block text-[9px] uppercase font-bold">Periode</span>
                <span className="text-slate-800">
                  {user.internInfo?.start_date ? new Date(user.internInfo.start_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : '-'} - {user.internInfo?.end_date ? new Date(user.internInfo.end_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                </span>
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-455 font-bold leading-normal max-w-sm mx-auto">
            Anda akan dapat melakukan absensi harian dan mencatat jurnal magang setelah Admin menyetujui akun dan menunjuk Mentor Pembimbing untuk Anda.
          </p>

          <div className="pt-2">
            <button
              onClick={logout}
              className="px-6 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 bg-white rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              Keluar Sesi
            </button>
          </div>
        </div>
      )}

      {user.role === 'intern' && user?.internInfo?.status !== 'pending' && (
        <>
          {attendancePercentage < 80 && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 p-5 rounded-2xl flex items-start gap-4.5 mb-6 animate-pulse shadow-sm">
              <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center text-rose-600 font-extrabold text-lg shadow-inner shrink-0">
                ⚠️
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-rose-900">Peringatan Kehadiran Rendah</h4>
                <p className="text-xs text-rose-700 mt-1 font-semibold leading-relaxed">
                  Tingkat kehadiran Anda saat ini adalah <strong className="font-black text-rose-900">{attendancePercentage}%</strong> yang mana berada di bawah batas minimal kelulusan magang (<strong className="font-black">80%</strong>). Harap segera lakukan koordinasi dengan Mentor pembimbing Anda dan perbaiki kehadiran Anda.
                </p>
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Attendance Check-in/Check-out Panel */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-md relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-emerald-500/5 w-48 h-48 rounded-full translate-x-12 -translate-y-12 blur-2xl"></div>
                <div className="absolute -bottom-8 -left-8 bg-teal-500/5 w-48 h-48 rounded-full blur-2xl"></div>
                
                <div className="flex items-center gap-2 mb-2 relative z-10">
                  <div className="p-1.5 bg-emerald-50 rounded-lg text-emerald-600">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Presensi Kehadiran Harian
                  </h3>
                </div>
                <p className="text-slate-400 text-xs font-semibold mb-8 relative z-10">
                  Lakukan check-in masuk saat memulai jam magang dan check-out pulang di sore hari.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-center relative z-10">
                  
                  {/* Status Display */}
                  <div className="space-y-1.5 text-center sm:text-left">
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Status Hari Ini</span>
                    {todayAttendance ? (
                      <span className={`inline-flex px-3.5 py-1.5 rounded-full text-xs font-black border mt-1.5 capitalize ${
                        todayAttendance.status === 'present' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        todayAttendance.status === 'sick' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                        'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {todayAttendance.status === 'present' ? 'Hadir' : todayAttendance.status === 'sick' ? 'Sakit' : 'Izin'}
                      </span>
                    ) : (
                      <span className="inline-flex px-3.5 py-1.5 rounded-full text-xs font-black bg-slate-100 text-slate-500 border border-slate-200 mt-1.5">
                        Belum Presensi
                      </span>
                    )}
                  </div>

                  {/* Jam Kerja Log */}
                  <div className="grid grid-cols-2 gap-4 text-xs font-bold text-slate-500 bg-slate-50 p-3.5 rounded-2xl border border-slate-150">
                    <div>
                      <span className="text-slate-400 block font-bold uppercase tracking-wider text-[9px]">Jam Masuk</span>
                      <span className="text-slate-900 text-sm mt-1 block font-black">
                        {todayAttendance?.check_in ? (
                          <>
                            {new Date(todayAttendance.check_in).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                            {dataService.attendance.getLatenessMinutes(todayAttendance.check_in) > 0 && (
                              <span className="block text-[10px] text-amber-700 font-extrabold mt-0.5 animate-pulse">
                                ⚠️ Terlambat {dataService.attendance.getLatenessMinutes(todayAttendance.check_in)}m
                              </span>
                            )}
                          </>
                        ) : '--:--'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-bold uppercase tracking-wider text-[9px]">Jam Pulang</span>
                      <span className="text-slate-900 text-sm mt-1 block font-black">
                        {todayAttendance?.check_out ? new Date(todayAttendance.check_out).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-3">
                    {!todayAttendance ? (
                      <button
                        onClick={() => {
                          setShowCheckInForm(true);
                          fetchLocation();
                        }}
                        className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl font-bold shadow-lg shadow-emerald-600/20 text-sm active:scale-98 hover:shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span>Presensi Masuk / Izin</span>
                      </button>
                    ) : !todayAttendance.check_out && todayAttendance.status === 'present' ? (
                      <button
                        onClick={handleCheckOut}
                        className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl font-bold shadow-lg shadow-amber-500/20 text-sm active:scale-98 hover:shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span>Check-out Pulang</span>
                      </button>
                    ) : (
                      <div className="p-4 bg-emerald-50/50 border border-emerald-100 text-center text-emerald-800 text-xs font-bold rounded-2xl leading-relaxed flex items-center justify-center gap-2">
                        <span>🎉</span>
                        <span>Presensi kehadiran Anda hari ini telah terekam lengkap.</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Form Check-in Modal */}
                {showCheckInForm && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                    <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 max-w-md w-full shadow-2xl relative animate-scale-up max-h-[90vh] overflow-y-auto">
                      <button
                        onClick={handleCloseForm}
                        className="absolute top-5 right-5 text-slate-400 hover:text-slate-650 font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 transition-all cursor-pointer"
                      >
                        ✕
                      </button>
                      <h4 className="text-xl font-black text-slate-900 mb-5 flex items-center gap-2">
                        <span>📝</span> Formulir Presensi
                      </h4>
                      <form onSubmit={handleCheckIn} className="space-y-5">
                        {/* Status GPS */}
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                          <div className="flex justify-between items-center mb-1.5">
                            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Lokasi Presensi</span>
                            <div className="flex items-center gap-2.5">
                              {isLocalhost && (
                                <button
                                  type="button"
                                  onClick={simulateAtBappeda}
                                  className="text-[10px] font-extrabold text-blue-600 hover:text-blue-700 underline cursor-pointer"
                                >
                                  📌 Simulasi di Kantor
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={fetchLocation}
                                disabled={gpsLoading}
                                className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 underline disabled:text-slate-400 cursor-pointer"
                              >
                                {gpsLoading ? 'Mencari...' : 'Dapatkan Ulang'}
                              </button>
                            </div>
                          </div>
                          
                          {gpsLoading && (
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 py-1">
                              <svg className="animate-spin h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              <span>Mendeteksi koordinat GPS...</span>
                            </div>
                          )}

                          {!gpsLoading && userCoords && (
                            <div className="space-y-1 py-0.5">
                              <div className="flex items-center gap-1.5 text-xs font-black">
                                {isInRadius ? (
                                  <span className="text-emerald-700">✅ Terdeteksi di Kantor Bappeda</span>
                                ) : (
                                  <span className="text-rose-700">⚠️ Di Luar Radius Kantor</span>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-500 font-semibold">
                                Jarak: ~{distanceMeters} meter ({isInRadius ? 'Dalam batas 100m' : 'Batas radius: 100m'})
                              </p>
                              <p className="text-[9px] font-mono text-slate-400">
                                Koord: {userCoords.latitude.toFixed(6)}, {userCoords.longitude.toFixed(6)}
                              </p>
                            </div>
                          )}

                          {!gpsLoading && gpsError && (
                            <div className="text-xs font-bold text-rose-600 py-0.5 space-y-1">
                              <div>❌ {gpsError}</div>
                              <p className="text-[9px] text-slate-400 font-normal normal-case leading-snug">
                                Catatan: Untuk status &quot;Hadir Aktif&quot;, pastikan izin lokasi aktif agar kehadiran Anda terverifikasi dengan benar.
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Warnings if outside radius and status is present */}
                        {status === 'present' && !gpsLoading && !isInRadius && (
                          <div className="bg-rose-50 border border-rose-200 p-3.5 rounded-xl text-[11px] text-rose-800 font-semibold leading-relaxed">
                            🚫 <strong>Presensi Masuk Ditolak:</strong> Anda terdeteksi di luar radius kantor Bappeda Aceh. Status <strong>Hadir Aktif</strong> hanya diperbolehkan di dalam area kantor (maks 100m). Silakan gunakan status <strong>Izin / Dinas Luar</strong> jika Anda ditugaskan di lapangan.
                          </div>
                        )}

                        {/* Warnings if document is missing for sick/leave */}
                        {(status === 'sick' || status === 'leave') && !attachmentUrl && !uploading && (
                          <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-xl text-[11px] text-amber-800 font-semibold leading-relaxed">
                            ⚠️ <strong>Surat Bukti Wajib:</strong> Harap unggah surat keterangan atau dokumen penunjang untuk mengajukan status {status === 'sick' ? 'Sakit' : 'Izin / Dinas Luar'}.
                          </div>
                        )}

                        {/* Warnings if selfie is missing for present status */}
                        {status === 'present' && !gpsLoading && isInRadius && !attachmentUrl && !uploading && (
                          <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-xl text-[11px] text-amber-800 font-semibold leading-relaxed">
                            ⚠️ <strong>Selfie Wajib:</strong> Anda terdeteksi di dalam radius kantor. Silakan ambil foto selfie wajah Anda terlebih dahulu.
                          </div>
                        )}

                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Pilih Status Kehadiran</label>
                          <select
                            value={status}
                            onChange={(e) => {
                              setStatus(e.target.value as any);
                              // Reset attachment and camera states when changing status
                              setAttachmentUrl('');
                              setSelfiePreview(null);
                              stopCamera();
                            }}
                            className="block w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring focus:ring-emerald-500/20 text-slate-800 bg-slate-50"
                          >
                            <option value="present">Hadir Aktif</option>
                            <option value="sick">Sakit (Butuh Surat Keterangan)</option>
                            <option value="leave">Izin / Dinas Luar</option>
                          </select>
                        </div>

                        {/* File Upload Section for Sick or Leave */}
                        {(status === 'sick' || status === 'leave') && (
                          <div className="space-y-2">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                              Unggah Surat Bukti ({status === 'sick' ? 'Sakit' : 'Dinas Luar'})
                            </label>
                            
                            <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center bg-slate-50 hover:bg-slate-100/50 transition-all relative">
                              <input
                                type="file"
                                accept="image/*,application/pdf"
                                onChange={handleFileUpload}
                                disabled={uploading}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                              />
                              
                              {uploading ? (
                                <div className="flex flex-col items-center gap-2 text-xs font-bold text-slate-550 py-2">
                                  <svg className="animate-spin h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                  <span>Mengunggah dokumen...</span>
                                </div>
                              ) : attachmentUrl ? (
                                <div className="space-y-1.5 py-1 text-xs">
                                  <div className="text-emerald-700 font-bold flex items-center justify-center gap-1">
                                    <span>📄</span> Dokumen Berhasil Diunggah!
                                  </div>
                                  <p className="text-[10px] text-slate-400 font-medium truncate px-6">
                                    {attachmentUrl.split('/').pop()}
                                  </p>
                                </div>
                              ) : (
                                <div className="space-y-1 py-1 text-slate-500">
                                  <div className="text-xl">📁</div>
                                  <div className="text-xs font-bold">Pilih File PDF atau Gambar</div>
                                  <p className="text-[10px] text-slate-400">Maksimal ukuran file 5MB</p>
                                </div>
                              )}
                            </div>
                            
                            {uploadError && (
                              <p className="text-[10px] text-rose-600 font-bold">{uploadError}</p>
                            )}
                          </div>
                        )}

                        {/* Selfie Section for Present Status */}
                        {status === 'present' && (
                          <div className="space-y-2">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                              Ambil Foto Selfie Masuk
                            </label>

                            {cameraActive ? (
                              <div className="relative border border-slate-200 rounded-xl overflow-hidden bg-black shadow-inner">
                                <video
                                  ref={videoRef}
                                  autoPlay
                                  playsInline
                                  className="w-full h-36 object-cover transform -scale-x-100"
                                ></video>
                                <div className="absolute bottom-3 inset-x-0 flex justify-center gap-3">
                                  <button
                                    type="button"
                                    onClick={capturePhoto}
                                    disabled={uploading}
                                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                                  >
                                    <span>📸</span> Ambil Foto
                                  </button>
                                  <button
                                    type="button"
                                    onClick={stopCamera}
                                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                                  >
                                    <span>✕</span> Matikan
                                  </button>
                                </div>
                              </div>
                            ) : selfiePreview ? (
                              <div className="relative border border-slate-200 rounded-xl overflow-hidden bg-slate-50 shadow-sm">
                                <img
                                  src={selfiePreview}
                                  alt="Selfie Preview"
                                  className="w-full h-36 object-cover transform -scale-x-100"
                                />
                                {uploading ? (
                                  <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center gap-2 text-xs font-bold text-slate-650">
                                    <svg className="animate-spin h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span>Mengunggah foto...</span>
                                  </div>
                                ) : (
                                  <div className="absolute bottom-3 inset-x-0 flex justify-center">
                                    <button
                                      type="button"
                                      onClick={startCamera}
                                      className="px-3.5 py-1.5 bg-slate-900/80 hover:bg-slate-900 text-white rounded-lg text-[11px] font-bold shadow-md transition-all flex items-center gap-1.5 cursor-pointer backdrop-blur-sm"
                                    >
                                      <span>🔄</span> Foto Ulang
                                    </button>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="border border-slate-200 rounded-xl p-6 text-center bg-slate-50 flex flex-col items-center gap-3">
                                <div className="text-3xl text-slate-400">📷</div>
                                <div className="text-xs font-bold text-slate-600">Kamera Selfie Belum Aktif</div>
                                <p className="text-[10px] text-slate-450 max-w-xs -mt-1 leading-normal">
                                  Anda wajib mengambil foto selfie wajah secara live sebelum mengirimkan kehadiran.
                                </p>
                                <button
                                  type="button"
                                  onClick={startCamera}
                                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-extrabold shadow-md transition-all cursor-pointer"
                                >
                                  Buka Kamera
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {status !== 'present' && (
                          <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Keterangan / Alasan Tambahan</label>
                            <textarea
                              value={notes}
                              onChange={(e) => setNotes(e.target.value)}
                              placeholder="Tuliskan alasan izin atau sakit secara mendetail"
                              className="block w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring focus:ring-emerald-500/20 h-28 text-slate-800 bg-slate-50 focus:bg-white transition-all resize-none"
                              required
                            ></textarea>
                          </div>
                        )}

                        <div className="flex gap-3 justify-end pt-3 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={handleCloseForm}
                            className="px-4 py-2.5 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-55 transition-all cursor-pointer"
                          >
                            Batal
                          </button>
                          <button
                            type="submit"
                            disabled={
                              gpsLoading || 
                              uploading || 
                              (status === 'present' && (!isInRadius || !attachmentUrl)) || 
                              (status !== 'present' && !attachmentUrl)
                            }
                            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Kirim Kehadiran
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
              </div>

              {/* Stats & Overview Layout */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center gap-8">
                {/* Visual Chart */}
                <div className="flex flex-col items-center justify-center shrink-0 w-44">
                  <div className="relative w-32 h-32 flex items-center justify-center">
                    <svg className="w-32 h-32 transform -rotate-90">
                      <circle
                        cx="64"
                        cy="64"
                        r="50"
                        className="stroke-slate-100"
                        strokeWidth="10"
                        fill="transparent"
                      />
                      {totalAtt > 0 ? (
                        <>
                          <circle
                            cx="64"
                            cy="64"
                            r="50"
                            className="stroke-emerald-500 transition-all duration-500"
                            strokeWidth="10"
                            fill="transparent"
                            strokeDasharray={`${presentStroke} ${circ}`}
                            strokeDashoffset={-presentOffset}
                          />
                          <circle
                            cx="64"
                            cy="64"
                            r="50"
                            className="stroke-amber-500 transition-all duration-500"
                            strokeWidth="10"
                            fill="transparent"
                            strokeDasharray={`${leaveStroke} ${circ}`}
                            strokeDashoffset={-leaveOffset}
                          />
                          <circle
                            cx="64"
                            cy="64"
                            r="50"
                            className="stroke-rose-500 transition-all duration-500"
                            strokeWidth="10"
                            fill="transparent"
                            strokeDasharray={`${sickStroke} ${circ}`}
                            strokeDashoffset={-sickOffset}
                          />
                        </>
                      ) : (
                        <circle
                          cx="64"
                          cy="64"
                          r="50"
                          className="stroke-slate-200"
                          strokeWidth="10"
                          fill="transparent"
                        />
                      )}
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className={`text-xl font-black ${attendancePercentage < 80 ? 'text-rose-600' : 'text-emerald-700'} leading-none`}>
                        {attendancePercentage}%
                      </span>
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Kehadiran</span>
                    </div>
                  </div>

                  <div className="flex gap-2.5 mt-3 justify-center text-[9px] font-extrabold uppercase tracking-wide flex-wrap">
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded bg-emerald-500"></span>
                      <span className="text-slate-500">Hadir</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded bg-amber-500"></span>
                      <span className="text-slate-500">Izin</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded bg-rose-500"></span>
                      <span className="text-slate-500">Sakit</span>
                    </div>
                  </div>
                </div>

                {/* Info Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full">
                  <div className="bg-slate-50 p-4.5 rounded-2xl border border-slate-200/50 hover:bg-slate-100/50 transition-all flex flex-col justify-center shadow-sm">
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Hadir</span>
                    <span className="text-xl font-black text-emerald-750 mt-1 block">
                      {presentCount} Hari
                    </span>
                    <span className="text-[9px] text-slate-450 mt-0.5 font-bold">Terhitung aktif kerja</span>
                  </div>
                  <div className="bg-slate-50 p-4.5 rounded-2xl border border-slate-200/50 hover:bg-slate-100/50 transition-all flex flex-col justify-center shadow-sm">
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Izin</span>
                    <span className="text-xl font-black text-amber-700 mt-1 block">
                      {leaveCount} Hari
                    </span>
                    <span className="text-[9px] text-slate-455 mt-0.5 font-bold">Izin resmi disetujui</span>
                  </div>
                  <div className="bg-slate-50 p-4.5 rounded-2xl border border-slate-200/50 hover:bg-slate-100/50 transition-all flex flex-col justify-center shadow-sm">
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Sakit</span>
                    <span className="text-xl font-black text-rose-700 mt-1 block">
                      {sickCount} Hari
                    </span>
                    <span className="text-[9px] text-slate-455 mt-0.5 font-bold">Dilampirkan surat sakit</span>
                  </div>
                  <div className="bg-slate-50 p-4.5 rounded-2xl border border-slate-200/50 hover:bg-slate-100/50 transition-all flex flex-col justify-center shadow-sm">
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Jurnal Disetujui</span>
                    <span className="text-xl font-black text-slate-900 mt-1 block">
                      {activities.filter((a) => a.status === 'approved').length} Log
                    </span>
                    <span className="text-[9px] text-slate-455 mt-0.5 font-bold">Logbook terverifikasi</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Announcements Panel */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <div className="p-1.5 bg-emerald-50 rounded-lg text-emerald-600">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  Pengumuman Instansi
                </h3>
              </div>
              <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
                {announcements.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-10 font-semibold">Tidak ada pengumuman terbaru.</p>
                ) : (
                  announcements.map((ann) => (
                    <div key={ann.id} className="p-4 bg-slate-50 hover:bg-slate-100/75 rounded-xl border border-slate-150 transition-all">
                      <h4 className="font-extrabold text-slate-900 text-sm leading-snug">{ann.title}</h4>
                      <p className="text-xs text-slate-550 mt-1.5 leading-relaxed line-clamp-4 font-medium">{ann.content}</p>
                      <div className="text-[10px] text-slate-400 mt-3 font-bold flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {new Date(ann.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
