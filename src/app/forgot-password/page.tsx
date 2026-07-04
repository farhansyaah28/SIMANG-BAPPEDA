'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { isDemoMode } from '@/lib/dataService';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [demoResetUrl, setDemoResetUrl] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setDemoResetUrl('');
    setLoading(true);

    try {
      if (isDemoMode) {
        // Simulasi cari user di localStorage
        const profiles = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('simang_profiles') || '[]') : [];
        const emails = [
          'admin@bappeda.go.id',
          'mentor1@bappeda.go.id',
          'intern1@bappeda.go.id',
          ...profiles.map((p: any) => p.email).filter(Boolean)
        ];

        // Sebenarnya di demo mode kita bebaskan saja agar bisa ditest
        const mockUrl = `${window.location.origin}/reset-password?email=${encodeURIComponent(email)}&demo=true`;
        setDemoResetUrl(mockUrl);
        setSuccessMsg('Simulasi: Permintaan reset sandi berhasil diterima.');
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`
        });
        if (error) throw error;
        setSuccessMsg('Tautan untuk mereset kata sandi telah dikirim ke email Anda. Silakan periksa folder masuk atau spam email Anda.');
      }
    } catch (err: any) {
      console.error('Reset password error:', err);
      setErrorMsg(err.message || 'Gagal mengirim email reset kata sandi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans relative overflow-hidden">
      {/* Ambient Decorative Glowing Elements */}
      <div className="absolute top-1/10 left-1/10 bg-emerald-500/5 w-[500px] h-[500px] rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 z-0"></div>
      <div className="absolute bottom-1/10 right-1/10 bg-teal-500/5 w-[500px] h-[500px] rounded-full blur-3xl translate-x-1/2 translate-y-1/2 z-0"></div>

      <div className="relative z-10 max-w-md w-full mx-auto bg-white rounded-3xl shadow-2xl border border-slate-200/85 overflow-hidden p-8 sm:p-10">
        {/* Branding & Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center border border-slate-200 shadow-md p-1.5">
            <img 
              src="/logo-bappeda.png" 
              alt="Logo Bappeda" 
              className="w-16 h-16 object-contain"
            />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 mt-4 text-center">Bappeda Aceh</h2>
          <p className="text-xs text-slate-450 font-bold tracking-wider uppercase mt-1">Lupa Kata Sandi</p>
        </div>

        {errorMsg && (
          <div className="mb-5 p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-bold flex items-center gap-2 animate-shake">
            <span>⚠️</span> {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="mb-5 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold leading-relaxed space-y-3">
            <div className="flex items-center gap-2 text-emerald-900">
              <span>✅</span> {successMsg}
            </div>
            {demoResetUrl && (
              <div className="bg-white p-3 rounded-xl border border-emerald-150 text-[11px] font-semibold text-slate-700 mt-2 space-y-2">
                <span className="text-amber-700 font-extrabold block">⚙️ MODE DEMO SIMULASI EMAIL:</span>
                <p>Karena menggunakan mode simulasi, silakan klik tautan di bawah ini untuk mensimulasikan klik pada email reset:</p>
                <Link 
                  href={demoResetUrl}
                  className="inline-block mt-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-center text-xs w-full transition-all active:scale-98"
                >
                  Buka Halaman Reset Sandi ➔
                </Link>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Alamat Email Terdaftar</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Masukkan email resmi Anda"
              className="w-full border border-slate-300 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring focus:ring-emerald-500/20 text-slate-800 bg-slate-50 focus:bg-white transition-all font-semibold"
            />
            <p className="text-[10px] text-slate-400 mt-1.5 font-medium leading-relaxed">
              Kami akan mengirimkan instruksi dan tautan perubahan kata sandi baru ke alamat email di atas.
            </p>
          </div>

          <div className="flex flex-col gap-3 pt-2">
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
                  Mengirim Permintaan...
                </span>
              ) : 'Kirim Tautan Reset'}
            </button>

            <Link 
              href="/login" 
              className="w-full py-3 px-4 border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 rounded-xl text-xs font-bold text-center transition-all cursor-pointer block"
            >
              Kembali ke Halaman Masuk
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
