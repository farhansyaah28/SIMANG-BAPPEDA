'use client';

import React, { useState } from 'react';
import { useSession } from '@/lib/SessionContext';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout, demoMode } = useSession();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-10 w-10 text-emerald-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-slate-500 font-bold text-sm tracking-wide">Menyiapkan dasbor...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Akan diredirect oleh SessionProvider
  }

  // Navigation Links based on role with custom SVG paths
  const getNavLinks = () => {
    const common = [
      { 
        name: 'Dashboard', 
        href: '/dashboard', 
        icon: (
          <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
          </svg>
        ) 
      },
    ];

    if (user.role === 'admin') {
      return [
        ...common,
        { 
          name: 'Anak Magang', 
          href: '/dashboard/interns', 
          icon: (
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 025.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          ) 
        },
        { 
          name: 'Mentor Pembimbing', 
          href: '/dashboard/mentors', 
          icon: (
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          ) 
        },
        { 
          name: 'Absensi Magang', 
          href: '/dashboard/attendance', 
          icon: (
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) 
        },
        { 
          name: 'Jurnal Kegiatan', 
          href: '/dashboard/activities', 
          icon: (
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          ) 
        },
        { 
          name: 'Penilaian Akhir', 
          href: '/dashboard/grades', 
          icon: (
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          ) 
        },
        { 
          name: 'Pengumuman', 
          href: '/dashboard/announcements', 
          icon: (
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          ) 
        },
        { 
          name: 'Log Audit', 
          href: '/dashboard/audit-logs', 
          icon: (
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          ) 
        },
      ];
    } else if (user.role === 'mentor') {
      return [
        ...common,
        { 
          name: 'Anak Bimbingan', 
          href: '/dashboard/interns', 
          icon: (
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 025.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          ) 
        },
        { 
          name: 'Absensi Bimbingan', 
          href: '/dashboard/attendance', 
          icon: (
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) 
        },
        { 
          name: 'Verifikasi Jurnal', 
          href: '/dashboard/activities', 
          icon: (
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          ) 
        },
        { 
          name: 'Penilaian Magang', 
          href: '/dashboard/grades', 
          icon: (
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          ) 
        },
      ];
    } else {
      // Intern/Magang
      return [
        ...common,
        { 
          name: 'Absensi Saya', 
          href: '/dashboard/attendance', 
          icon: (
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) 
        },
        { 
          name: 'Jurnal Kegiatan', 
          href: '/dashboard/activities', 
          icon: (
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          ) 
        },
        { 
          name: 'Nilai & Sertifikat', 
          href: '/dashboard/grades', 
          icon: (
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          ) 
        },
      ];
    }
  };

  const navLinks = getNavLinks();

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrator';
      case 'mentor': return 'Mentor Bappeda';
      case 'intern': return 'Anak Magang';
      default: return role;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-800">
      
      {/* Demo Warning Banner */}
      {demoMode && (
        <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-600 text-white text-center py-2.5 px-4 text-xs font-bold flex items-center justify-center gap-2 relative z-50 shadow-md print:hidden">
          <svg className="w-4 h-4 flex-shrink-0 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>Aplikasi berjalan dalam <strong>Mode Demo</strong> (Penyimpanan Sementara di Browser). Konfigurasi Supabase Anda pada berkas <code>.env.local</code> untuk menggunakan database cloud asli.</span>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        
        {/* Desktop Sidebar (Glassmorphism inspired dark theme) */}
        <aside className="hidden md:flex md:w-56 md:flex-col bg-slate-950 text-slate-300 border-r border-slate-900 relative print:hidden">
          
          {/* Logo Section */}
          <div className="p-4.5 flex items-center gap-3 border-b border-slate-900/60 bg-slate-950 sticky top-0 z-20">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-slate-800 shadow-md p-1">
              <img 
                src="/logo-bappeda.png" 
                alt="Logo Bappeda" 
                className="w-8 h-8 object-contain"
              />
            </div>
            <div>
              <h1 className="font-black text-white leading-tight text-xs tracking-wide">Bappeda Aceh</h1>
              <p className="text-[7.5px] text-slate-500 font-black tracking-widest uppercase mt-0.5">Sistem Informasi Magang</p>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="flex-1 overflow-y-auto py-5 px-3.5 space-y-1 scrollbar-thin">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition-all duration-300 ease-out group cursor-pointer relative ${
                    isActive 
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 border-l-4 border-emerald-400 scale-[1.01]' 
                      : 'hover:bg-slate-900 hover:text-white hover:translate-x-1'
                  }`}
                >
                  <span className={`${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white transition-colors'}`}>
                    {link.icon}
                  </span>
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </div>

          {/* User Info & Logout (Bottom Panel) */}
          <div className="p-3.5 border-t border-slate-900/80 bg-slate-950/70 backdrop-blur-md">
            <div className="flex items-center gap-2.5 mb-3 bg-slate-900/40 p-2.5 rounded-xl border border-slate-900">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white font-black uppercase text-xs border border-emerald-400/20 shadow-md">
                {user.full_name?.charAt(0) || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-white truncate">{user.full_name}</p>
                <p className="text-[9px] text-slate-550 font-bold truncate mt-0.5">{getRoleLabel(user.role)}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-slate-800 hover:border-slate-700 hover:bg-slate-900 hover:text-white text-[11px] font-extrabold transition-all text-slate-400 cursor-pointer active:scale-95 shadow-inner"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Keluar Sesi</span>
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          
          {/* Header Mobile Menu */}
          <header className="md:hidden bg-slate-950 text-white h-16 flex items-center justify-between px-6 border-b border-slate-900 z-40 shadow-md print:hidden">
            <div className="flex items-center gap-2.5">
              <div className="w-9.5 h-9.5 rounded-full bg-white flex items-center justify-center border border-slate-800 shadow-md p-1">
                <img 
                  src="/logo-bappeda.png" 
                  alt="Logo Bappeda" 
                  className="w-7.5 h-7.5 object-contain"
                />
              </div>
              <span className="font-extrabold text-xs tracking-wider uppercase text-slate-200">Bappeda Aceh</span>
            </div>
            
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 focus:outline-none cursor-pointer"
            >
              <svg className="h-6.5 w-6.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </header>

          {/* Mobile Dropdown Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden bg-slate-950 border-b border-slate-900 z-35 px-6 py-5 space-y-2.5 text-slate-300 shadow-2xl animate-fade-in">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-900 mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center font-black text-white uppercase text-base border border-emerald-450/20">
                  {user.full_name?.charAt(0)}
                </div>
                <div>
                  <h4 className="font-black text-white text-sm leading-tight">{user.full_name}</h4>
                  <p className="text-[10px] text-slate-500 font-bold mt-1">{getRoleLabel(user.role)}</p>
                </div>
              </div>
              
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${
                      isActive 
                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 border-l-4 border-emerald-400' 
                        : 'hover:bg-slate-900 hover:text-white'
                    }`}
                  >
                    <span className={`${isActive ? 'text-white' : 'text-slate-400'}`}>
                      {link.icon}
                    </span>
                    <span>{link.name}</span>
                  </Link>
                );
              })}

              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  logout();
                }}
                className="w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl hover:bg-slate-900 hover:text-white text-slate-400 font-bold text-sm transition-all text-left mt-5 border-t border-slate-900 pt-5 cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Keluar dari Aplikasi</span>
              </button>
            </div>
          )}

          {/* Page Body Wrap */}
          <main className="flex-1 overflow-y-auto p-3 sm:p-4.5 lg:p-5.5 bg-slate-50 print:p-0 print:bg-white">
            <div className="max-w-6xl mx-auto print:max-w-full">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
