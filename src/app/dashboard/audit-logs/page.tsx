'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from '@/lib/SessionContext';
import { dataService } from '@/lib/dataService';
import { useRouter } from 'next/navigation';

export default function AuditLogsPage() {
  const { user, loading: sessionLoading } = useSession();
  const router = useRouter();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchEmail, setSearchEmail] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [limit, setLimit] = useState<number | 'all'>(25);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const list = await dataService.audit.getAll();
      setLogs(list);
    } catch (err) {
      console.error('Gagal memuat log audit:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!sessionLoading) {
      if (user && user.role === 'admin') {
        loadLogs();
      }
    }
  }, [user, sessionLoading]);

  if (sessionLoading || (user && user.role === 'admin' && loading)) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3">
        <svg className="animate-spin h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span className="text-slate-500 font-bold text-sm tracking-wide">Memuat log audit keamanan...</span>
      </div>
    );
  }

  // Access Denied Screen
  if (!user || user.role !== 'admin') {
    return (
      <div className="py-16 flex flex-col items-center justify-center max-w-md mx-auto text-center px-4">
        <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center text-rose-600 mb-5 border border-rose-100 shadow-md">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0-6V9m12 3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-xl font-extrabold text-slate-900">Akses Ditolak</h3>
        <p className="text-slate-500 mt-2 text-sm font-semibold leading-relaxed">
          Halaman log audit keamanan ini hanya dapat diakses oleh administrator sistem Bappeda Aceh.
        </p>
        <button
          onClick={() => router.push('/dashboard')}
          className="mt-6 px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs sm:text-sm font-extrabold shadow-md transition-all active:scale-95 cursor-pointer"
        >
          Kembali ke Dashboard
        </button>
      </div>
    );
  }

  // Filter logic
  const filteredLogs = logs.filter((log) => {
    const emailToMatch = (log.email || '').toLowerCase();
    const matchesEmail = !searchEmail || emailToMatch.includes(searchEmail.toLowerCase());
    const matchesAction = !actionFilter || log.action === actionFilter;

    return matchesEmail && matchesAction;
  });

  const displayedLogs = limit === 'all' ? filteredLogs : filteredLogs.slice(0, limit);

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-violet-50 text-violet-750 border-violet-200';
      case 'mentor':
        return 'bg-blue-50 text-blue-750 border-blue-200';
      case 'intern':
        return 'bg-emerald-50 text-emerald-755 border-emerald-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Admin';
      case 'mentor': return 'Mentor';
      case 'intern': return 'Magang';
      default: return role;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Log Audit Aktivitas</h2>
          <p className="text-slate-500 mt-1 text-sm font-semibold">
            Riwayat log masuk (login) dan keluar (logout) dari pengguna sistem manajemen magang Bappeda Aceh.
          </p>
        </div>
      </div>

      {/* Filters Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Cari Email Pengguna</label>
          <input
            type="text"
            value={searchEmail}
            onChange={(e) => setSearchEmail(e.target.value)}
            placeholder="Contoh: admin@bappeda.go.id..."
            className="w-full border border-slate-350 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring focus:ring-emerald-500/20 text-slate-800 bg-slate-50 focus:bg-white font-semibold"
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Aksi / Tindakan</label>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring focus:ring-emerald-500/20 text-slate-800 bg-slate-50 font-bold"
          >
            <option value="">Semua Tindakan</option>
            <option value="LOGIN">Masuk (LOGIN)</option>
            <option value="LOGOUT">Keluar (LOGOUT)</option>
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Batasan Tampilan</label>
          <select
            value={limit}
            onChange={(e) => setLimit(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring focus:ring-emerald-500/20 text-slate-800 bg-slate-50 font-bold"
          >
            <option value={10}>10 Log Terakhir</option>
            <option value={25}>25 Log Terakhir</option>
            <option value={50}>50 Log Terakhir</option>
            <option value={100}>100 Log Terakhir</option>
            <option value="all">Semua Log</option>
          </select>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/40">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Histori Aktivitas</span>
          <span className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-black rounded-lg">
            Tampil {displayedLogs.length} dari {filteredLogs.length} Baris
          </span>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="py-20 text-center text-slate-400 font-bold bg-slate-50/50 border border-dashed border-slate-200 m-4 rounded-xl">
            Tidak ada data log audit yang sesuai filter.
          </div>
        ) : (
          <div className="overflow-x-auto overflow-y-auto max-h-[480px]">
            <table className="min-w-full divide-y divide-slate-200 text-sm text-left">
              <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-4">Waktu Kejadian</th>
                  <th className="px-6 py-4">Pengguna</th>
                  <th className="px-6 py-4">Peran</th>
                  <th className="px-6 py-4">Aksi</th>
                  <th className="px-6 py-4">Perangkat / User-Agent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {displayedLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/40 transition-colors">
                    <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleDateString('id-ID', { 
                        day: 'numeric', 
                        month: 'short', 
                        year: 'numeric' 
                      })} - {new Date(log.created_at).toLocaleTimeString('id-ID', { 
                        hour: '2-digit', 
                        minute: '2-digit',
                        second: '2-digit'
                      })} WIB
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900">
                      {log.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold border ${getRoleBadge(log.role)}`}>
                        {getRoleLabel(log.role)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-md text-xs font-black border ${
                        log.action === 'LOGIN' 
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-100' 
                          : 'bg-amber-50 text-amber-800 border-amber-100'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400 font-semibold max-w-xs truncate" title={log.user_agent}>
                      {log.user_agent || 'Tidak Diketahui'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
