'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { isDemoMode } from '@/lib/dataService';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Extract parameters if in demo mode
  const emailParam = searchParams.get('email') || '';
  const isDemoParam = searchParams.get('demo') === 'true';

  useEffect(() => {
    if (!isDemoMode && !window.location.hash.includes('access_token')) {
      console.log('Reset Password loaded. Token should be present in hash for cloud authentication.');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (password.length < 6) {
      setErrorMsg('Kata sandi harus minimal 6 karakter.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    setLoading(true);

    try {
      if (isDemoMode || isDemoParam) {
        setSuccessMsg(`Kata sandi untuk akun ${emailParam || 'demo@bappeda.go.id'} berhasil diubah secara lokal!`);
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } else {
        const { error } = await supabase.auth.updateUser({
          password: password
        });

        if (error) throw error;
        
        setSuccessMsg('Kata sandi Anda berhasil diperbarui! Mengalihkan ke halaman masuk...');
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      }
    } catch (err: any) {
      console.error('Gagal mereset kata sandi:', err);
      setErrorMsg(err.message || 'Gagal mengubah kata sandi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      {errorMsg && (
        <div className="mb-5 p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-bold flex items-center gap-2 animate-shake">
          <span>⚠️</span> {errorMsg}
        </div>
      )}

      {successMsg && (
        <div className="mb-5 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2 animate-pulse">
          <span>✅</span> {successMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {emailParam && (
          <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
            <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider block">Akun yang direset:</span>
            <span className="text-xs font-extrabold text-slate-800 block mt-0.5">{emailParam}</span>
          </div>
        )}

        <div>
          <label htmlFor="pass" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Kata Sandi Baru</label>
          <div className="relative">
            <input
              id="pass"
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
          <label htmlFor="confirmPass" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Konfirmasi Kata Sandi Baru</label>
          <div className="relative">
            <input
              id="confirmPass"
              type={showConfirmPassword ? 'text' : 'password'}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Ulangi Kata Sandi"
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

        <div className="flex flex-col gap-3 pt-3">
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 bg-[#1b4d32] hover:bg-[#2d7d52] text-white rounded-xl font-bold shadow-lg shadow-emerald-950/15 text-sm transition-all active:scale-98 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Menyimpan Sandi Baru...
              </span>
            ) : 'Simpan Sandi Baru'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans relative overflow-hidden">
      {/* Ambient Decorative Glowing Elements */}
      <div className="absolute top-1/10 left-1/10 bg-emerald-500/5 w-[500px] h-[500px] rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 z-0"></div>
      <div className="absolute bottom-1/10 right-1/10 bg-teal-500/5 w-[500px] h-[500px] rounded-full blur-3xl translate-x-1/2 translate-y-1/2 z-0"></div>

      <div className="relative z-10 max-w-md w-full mx-auto bg-white rounded-3xl shadow-2xl border border-slate-200/85 overflow-hidden p-8 sm:p-10">
        {/* Branding & Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 overflow-hidden relative rounded-full bg-white flex items-center justify-center border border-slate-200 shadow-md">
            <img 
              src="/logo-bappeda.png" 
              alt="Logo Bappeda" 
              className="w-36 h-36 max-w-none absolute object-contain"
              style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
            />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 mt-4 text-center">Bappeda Aceh</h2>
          <p className="text-xs text-slate-450 font-bold tracking-wider uppercase mt-1">Ubah Kata Sandi Baru</p>
        </div>

        <Suspense fallback={
          <div className="py-10 text-center font-bold text-sm text-slate-500">
            Memuat formulir pemulihan...
          </div>
        }>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
