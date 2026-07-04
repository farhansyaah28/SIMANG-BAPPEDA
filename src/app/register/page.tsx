'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { dataService, isDemoMode } from '@/lib/dataService';

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState<'intern' | 'mentor'>('intern');
  const [fullName, setFullName] = useState('');
  
  // Intern fields
  const [nimNisn, setNimNisn] = useState('');
  const [institution, setInstitution] = useState('');
  const [major, setMajor] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Mentor fields
  const [nip, setNip] = useState('');
  const [department, setDepartment] = useState('');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (password !== confirmPassword) {
      setErrorMsg('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Kata sandi harus minimal 6 karakter.');
      return;
    }

    setLoading(true);

    try {
      if (role === 'intern') {
        await dataService.interns.signUp({
          full_name: fullName,
          nim_nisn: nimNisn,
          institution,
          major,
          start_date: startDate,
          end_date: endDate,
          email,
          password
        });
      } else {
        await dataService.mentors.signUp({
          full_name: fullName,
          nip,
          department,
          email,
          password
        });
      }
      setSuccess(true);
    } catch (err: any) {
      console.error('Registration error:', err);
      let message = err.message || 'Gagal mendaftar. Pastikan email belum digunakan.';
      if (message.toLowerCase().includes('already registered') || message.toLowerCase().includes('already exists')) {
        message = 'Email ini sudah terdaftar. Silakan gunakan email lain atau masuk ke akun Anda.';
      }
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans relative overflow-hidden">
        {/* Ambient Blur Backgrounds */}
        <div className="absolute top-1/4 left-1/4 bg-emerald-500/10 w-96 h-96 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 z-0"></div>
        <div className="absolute bottom-1/4 right-1/4 bg-teal-500/10 w-96 h-96 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 z-0"></div>

        <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md text-center">
          <div className="mx-auto w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center border border-emerald-200/80 shadow-md shadow-emerald-500/5">
            <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="mt-5 text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Pendaftaran Berhasil!
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-slate-500 font-semibold leading-relaxed max-w-sm mx-auto">
            Akun magang Anda berhasil diajukan dan saat ini sedang menunggu persetujuan dari Admin Bappeda Aceh.
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
          <div className="bg-white/80 backdrop-blur-md py-7 px-6 shadow-xl shadow-slate-200/80 rounded-2xl sm:px-8 border border-slate-200/60 text-center space-y-6">
            
            {/* Timeline Process (Visual Stepper) */}
            <div className="space-y-4 text-left">
              <h3 className="text-[10px] font-black text-slate-450 uppercase tracking-widest block border-b border-slate-100 pb-2">Alur Proses Pendaftaran</h3>
              
              {/* Step 1: Done */}
              <div className="flex gap-3.5 items-start">
                <div className="shrink-0 w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center text-xs font-bold shadow-sm">
                  ✓
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-slate-900">1. Data Pendaftaran Terkirim</h4>
                  <p className="text-[10.5px] text-slate-500 font-medium">Akun Anda dengan email <span className="font-semibold text-emerald-700">{email}</span> telah tersimpan di sistem.</p>
                </div>
              </div>

              {/* Connector line */}
              <div className="w-0.5 h-3 bg-emerald-100 ml-3 -mt-2"></div>

              {/* Step 2: Active */}
              <div className="flex gap-3.5 items-start">
                <div className="shrink-0 w-6 h-6 rounded-full bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center text-xs font-bold shadow-sm">
                  ➔
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    2. Verifikasi & Penunjukan Mentor
                    <span className="inline-flex px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-amber-50 text-amber-700 border border-amber-200 tracking-wider">Proses</span>
                  </h4>
                  <p className="text-[10.5px] text-slate-500 font-medium">Admin Bappeda Aceh akan meninjau berkas Anda, memverifikasi instansi asal, serta menunjuk Mentor Pembimbing resmi Anda.</p>
                </div>
              </div>

              {/* Connector line */}
              <div className="w-0.5 h-3 bg-slate-100 ml-3 -mt-2"></div>

              {/* Step 3: Locked */}
              <div className="flex gap-3.5 items-start opacity-55">
                <div className="shrink-0 w-6 h-6 rounded-full bg-slate-50 text-slate-400 border border-slate-200 flex items-center justify-center text-xs font-bold shadow-sm">
                  🔒
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-slate-900">3. Akun Aktif & Akses Dashboard</h4>
                  <p className="text-[10.5px] text-slate-500 font-medium">Setelah disetujui, Anda dapat masuk (login) ke SIMANG menggunakan akun Anda untuk melakukan absensi & laporan jurnal.</p>
                </div>
              </div>
            </div>

            <Link
              href="/login"
              className="block w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl font-bold shadow-md shadow-emerald-600/10 text-xs tracking-wide transition-all hover:shadow-lg active:scale-98 cursor-pointer"
            >
              Kembali ke Halaman Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans relative overflow-hidden">
      {/* Ambient Decorative Glowing Elements */}
      <div className="absolute top-1/10 left-1/10 bg-emerald-500/5 w-[500px] h-[500px] rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 z-0"></div>
      <div className="absolute bottom-1/10 right-1/10 bg-teal-500/5 w-[500px] h-[500px] rounded-full blur-3xl translate-x-1/2 translate-y-1/2 z-0"></div>

      <div className="relative z-10 max-w-4xl w-full mx-auto bg-white rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden grid grid-cols-1 md:grid-cols-12">
        
        {/* Left Side: Dynamic Branding & Timeline Guide (col-span-5) */}
        <div className="md:col-span-5 bg-gradient-to-br from-[#1b4d32] to-[#2d7d52] p-8 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-white/5 w-64 h-64 rounded-full translate-x-12 -translate-y-12 blur-2xl"></div>
          <div className="absolute bottom-0 left-0 bg-emerald-400/5 w-64 h-64 rounded-full -translate-x-12 translate-y-12 blur-2xl"></div>
          
          <div className="relative z-10 space-y-6">
            <Link href="/" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/15 border border-white/15 text-white rounded-xl transition-all text-xs font-bold mb-8 group active:scale-95 cursor-pointer">
              <svg className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Kembali ke Beranda</span>
            </Link>

            <div className="flex items-center space-x-3.5">
              <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center border border-white/20 shadow-md p-1">
                <img 
                  src="/logo-bappeda.png" 
                  alt="Logo Bappeda" 
                  className="w-10 h-10 object-contain"
                />
              </div>
              <div>
                <h1 className="font-extrabold text-white leading-tight text-base">Bappeda Aceh</h1>
                <p className="text-[9px] text-emerald-250 font-bold tracking-widest uppercase mt-0.5">Sistem Informasi Magang</p>
              </div>
            </div>

            <div className="space-y-3 pt-6">
              <h2 className="text-2xl font-black leading-snug">
                Langkah Awal <br/>
                Karir Anda Dimulai!
              </h2>
              <p className="text-xs text-emerald-100 font-semibold leading-relaxed">
                Bergabunglah dengan program magang di Bappeda Provinsi Aceh. Isi data diri Anda dan tunggu persetujuan dari Admin.
              </p>
            </div>
          </div>

          {/* Registration Timeline Timeline */}
          <div className="relative z-10 space-y-5 pt-8 md:pt-0 pb-4">
            <h4 className="text-[10px] text-emerald-250 font-extrabold uppercase tracking-wider block mb-1">Alur Onboarding Magang:</h4>
            
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-emerald-500/25 border border-emerald-400 text-[10px] flex items-center justify-center font-bold shrink-0 mt-0.5">1</div>
              <div>
                <h5 className="text-xs font-bold text-white">Isi Formulir</h5>
                <p className="text-[10px] text-emerald-150 font-semibold">Lengkapi profil diri dan tanggal rencana magang.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-white/10 border border-white/20 text-[10px] flex items-center justify-center font-bold shrink-0 mt-0.5">2</div>
              <div>
                <h5 className="text-xs font-bold text-emerald-100">Review & Persetujuan</h5>
                <p className="text-[10px] text-emerald-200 font-semibold">Admin memverifikasi berkas dan keabsahan data.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-white/10 border border-white/20 text-[10px] flex items-center justify-center font-bold shrink-0 mt-0.5">3</div>
              <div>
                <h5 className="text-xs font-bold text-emerald-100">Penunjukan Mentor</h5>
                <p className="text-[10px] text-emerald-200 font-semibold">Admin menugaskan Mentor Pembimbing sesuai bidang.</p>
              </div>
            </div>
          </div>

          <div className="relative z-10 text-[10px] text-emerald-250 font-bold border-t border-white/10 pt-4">
            © 2026 Bappeda Aceh. All Rights Reserved.
          </div>
        </div>

        {/* Right Side: Onboarding Register Form (col-span-7) */}
        <div className="md:col-span-7 p-6 sm:p-10">
          {isDemoMode && (
            <div className="mb-6 p-4 bg-amber-50 rounded-2xl border border-amber-200 text-amber-800 text-xs leading-relaxed font-semibold">
              <div className="flex items-center gap-1.5 font-bold mb-1 text-amber-905">
                <span>⚠️</span> Mode Demo Aktif
              </div>
              Aplikasi berjalan dalam mode simulasi/demo. Data yang Anda daftarkan akan disimpan sementara di LocalStorage.
            </div>
          )}

          {errorMsg && (
            <div className="mb-5 p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-bold flex items-center gap-2 animate-shake">
              <span>⚠️</span> {errorMsg}
            </div>
          )}          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <h3 className="text-sm font-black text-slate-900">Form Pendaftaran Magang</h3>
              <p className="text-xs text-slate-450 font-semibold mt-0.5">Harap isi seluruh kolom pendaftaran dengan informasi yang valid.</p>
            </div>

            {/* Part 1: Data Diri */}
            <div className="space-y-3.5">
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block border-b border-slate-100 pb-1.5">1. Profil Akademik</span>
              
              <div>
                <label htmlFor="fullName" className="block text-xs font-bold text-slate-550 uppercase tracking-wider mb-1.5">Nama Lengkap</label>
                <input
                  id="fullName"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Contoh: Muhammad Farhan"
                  className="w-full border border-slate-300 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring focus:ring-emerald-500/20 text-slate-800 bg-slate-50 focus:bg-white transition-all font-semibold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="nimNisn" className="block text-xs font-bold text-slate-550 uppercase tracking-wider mb-1.5">NIM / NISN</label>
                  <input
                    id="nimNisn"
                    type="text"
                    required
                    value={nimNisn}
                    onChange={(e) => setNimNisn(e.target.value)}
                    placeholder="NIM Mahasiswa"
                    className="w-full border border-slate-300 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring focus:ring-emerald-500/20 text-slate-800 bg-slate-50 focus:bg-white transition-all font-semibold"
                  />
                </div>
                <div>
                  <label htmlFor="major" className="block text-xs font-bold text-slate-550 uppercase tracking-wider mb-1.5">Jurusan / Program Studi</label>
                  <input
                    id="major"
                    type="text"
                    required
                    value={major}
                    onChange={(e) => setMajor(e.target.value)}
                    placeholder="Contoh: S1 Informatika"
                    className="w-full border border-slate-300 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring focus:ring-emerald-500/20 text-slate-800 bg-slate-50 focus:bg-white transition-all font-semibold"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="institution" className="block text-xs font-bold text-slate-550 uppercase tracking-wider mb-1.5">Asal Kampus / Sekolah</label>
                <input
                  id="institution"
                  type="text"
                  required
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  placeholder="Contoh: Universitas Syiah Kuala"
                  className="w-full border border-slate-300 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring focus:ring-emerald-500/20 text-slate-800 bg-slate-50 focus:bg-white transition-all font-semibold"
                />
              </div>
            </div>

            {/* Part 2: Rencana Magang */}
            <div className="space-y-3.5 pt-1">
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block border-b border-slate-100 pb-1.5">2. Rencana Waktu Magang</span>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="startDate" className="block text-xs font-bold text-slate-555 uppercase tracking-wider mb-1.5">Mulai Rencana</label>
                  <input
                    id="startDate"
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full border border-slate-300 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring focus:ring-emerald-500/20 text-slate-800 bg-slate-50 focus:bg-white transition-all font-semibold"
                  />
                </div>
                <div>
                  <label htmlFor="endDate" className="block text-xs font-bold text-slate-555 uppercase tracking-wider mb-1.5">Selesai Rencana</label>
                  <input
                    id="endDate"
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full border border-slate-300 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring focus:ring-emerald-500/20 text-slate-800 bg-slate-50 focus:bg-white transition-all font-semibold"
                  />
                </div>
              </div>
            </div>

            {/* Part 3: Kredensial */}
            <div className="space-y-3.5 pt-1">
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block border-b border-slate-100 pb-1.5">3. Kredensial Masuk</span>
              
              <div>
                <label htmlFor="email" className="block text-xs font-bold text-slate-550 uppercase tracking-wider mb-1.5">Alamat Email Resmi</label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  className="w-full border border-slate-300 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring focus:ring-emerald-500/20 text-slate-800 bg-slate-50 focus:bg-white transition-all font-semibold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="password" className="block text-xs font-bold text-slate-550 uppercase tracking-wider mb-1.5">Kata Sandi</label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min 6 Karakter"
                      className="w-full border border-slate-300 focus:border-emerald-500 rounded-xl pl-3.5 pr-10 py-2.5 text-sm focus:outline-none focus:ring focus:ring-emerald-500/20 text-slate-800 bg-slate-50 focus:bg-white transition-all font-semibold"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-650 cursor-pointer"
                    >
                      {showPassword ? (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
                <div>
                  <label htmlFor="confirmPassword" className="block text-xs font-bold text-slate-555 uppercase tracking-wider mb-1.5">Konfirmasi Sandi</label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Ulangi Sandi"
                      className="w-full border border-slate-300 focus:border-emerald-500 rounded-xl pl-3.5 pr-10 py-2.5 text-sm focus:outline-none focus:ring focus:ring-emerald-500/20 text-slate-800 bg-slate-50 focus:bg-white transition-all font-semibold"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-650 cursor-pointer"
                    >
                      {showConfirmPassword ? (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 flex flex-col gap-3 relative z-10">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-[#2a6a4b] to-emerald-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl font-bold shadow-lg shadow-emerald-600/25 text-sm transition-all hover:shadow-xl active:scale-98 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Memproses Pendaftaran...
                  </span>
                ) : 'Kirim Pendaftaran'}
              </button>

              <div className="text-center text-xs text-slate-550 font-bold mt-2">
                Sudah punya akun?{' '}
                <Link href="/login" className="text-[#2a6a4b] hover:text-[#1b4d32] underline cursor-pointer">
                  Masuk di sini
                </Link>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
