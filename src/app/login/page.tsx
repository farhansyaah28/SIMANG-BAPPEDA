'use client';

import React, { useState } from 'react';
import { useSession } from '@/lib/SessionContext';
import Link from 'next/link';

export default function LoginPage() {
  const { login, loading, demoMode } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email) {
      setErrorMsg('Email wajib diisi.');
      return;
    }

    const { success, error } = await login(email, password);
    if (!success) {
      setErrorMsg(error?.message || 'Gagal masuk. Silakan periksa kembali email dan kata sandi Anda.');
    }
  };

  const handleQuickSelect = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('password123');
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="mx-auto w-24 h-24 rounded-full bg-white flex items-center justify-center border border-slate-200 shadow-md mb-4 animate-fade-in p-2">
          <img 
            src="/logo-bappeda.png" 
            alt="Logo Bappeda" 
            className="w-20 h-20 object-contain"
          />
        </div>
        <h2 className="mt-5 text-3xl font-extrabold text-slate-900 tracking-tight">
          Masuk ke SIMANG
        </h2>
        <p className="mt-2 text-xs text-slate-500 font-bold tracking-widest uppercase">
          Sistem Informasi Magang Bappeda Aceh
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl shadow-slate-200/50 rounded-2xl sm:px-10 border border-slate-200">
          
          {demoMode && (
            <div className="mb-6 p-4 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-xs leading-relaxed">
              <div className="flex items-center gap-2 font-bold mb-1 text-amber-900">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Mode Demo Aktif</span>
              </div>
              Supabase belum dihubungkan. Silakan gunakan email di bawah ini untuk mencoba role yang berbeda:
              <div className="mt-2 flex flex-col gap-1">
                <button 
                  type="button"
                  onClick={() => handleQuickSelect('admin@bappeda.go.id')}
                  className="text-left font-semibold text-emerald-700 hover:text-emerald-800 underline cursor-pointer"
                >
                  • admin@bappeda.go.id (Administrator)
                </button>
                <button 
                  type="button"
                  onClick={() => handleQuickSelect('mentor1@bappeda.go.id')}
                  className="text-left font-semibold text-emerald-700 hover:text-emerald-800 underline cursor-pointer"
                >
                  • mentor1@bappeda.go.id (Mentor - Budi)
                </button>
                <button 
                  type="button"
                  onClick={() => handleQuickSelect('intern1@bappeda.go.id')}
                  className="text-left font-semibold text-emerald-700 hover:text-emerald-800 underline cursor-pointer"
                >
                  • intern1@bappeda.go.id (Anak Magang - Farhan)
                </button>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-sm font-medium">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-1.5">
                Alamat Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Masukkan email Anda"
                className="appearance-none block w-full px-3.5 py-2.5 border border-slate-300 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm bg-slate-50 focus:bg-white transition-all text-slate-800"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-1.5">
                Kata Sandi
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="appearance-none block w-full pl-3.5 pr-10 py-2.5 border border-slate-300 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm bg-slate-50 focus:bg-white transition-all text-slate-800"
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
              <div className="flex items-center justify-end mt-2 text-xs">
                <Link 
                  href="/forgot-password" 
                  className="font-bold text-emerald-600 hover:text-emerald-700 underline transition-all cursor-pointer"
                >
                  Lupa kata sandi?
                </Link>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg shadow-emerald-600/10 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-98"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Memuat...
                  </span>
                ) : (
                  'Masuk ke Sistem'
                )}
              </button>

              <Link
                href="/"
                className="w-full py-2.5 px-4 border border-slate-200 hover:bg-slate-55 text-slate-650 hover:text-slate-900 rounded-xl text-xs font-bold text-center transition-all cursor-pointer block"
              >
                Kembali ke Beranda
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
