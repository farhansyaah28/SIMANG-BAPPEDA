'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from '@/lib/SessionContext';
import { dataService } from '@/lib/dataService';

export default function AttendancePage() {
  const { user } = useSession();
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchName, setSearchName] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      if (user.role === 'admin' || user.role === 'mentor') {
        const list = await dataService.attendance.getAll();
        if (user.role === 'mentor') {
          // Filter to only their interns
          const interns = await dataService.interns.getAll();
          const myInternIds = interns.filter(i => i.mentor_id === user.id).map(i => i.id);
          setAttendance(list.filter(a => myInternIds.includes(a.intern_id)));
        } else {
          setAttendance(list);
        }
      } else {
        const list = await dataService.attendance.getForIntern(user.id);
        setAttendance(list);
      }
    } catch (err) {
      console.error('Gagal memuat data absensi:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['Nama Intern', 'Universitas/Instansi', 'Tanggal', 'Jam Masuk', 'Jam Keluar', 'Status', 'Catatan'];
    const rows = filteredAttendance.map((a) => [
      a.intern_name || user.full_name,
      a.institution || user.internInfo?.institution || '',
      a.date,
      a.check_in ? new Date(a.check_in).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-',
      a.check_out ? new Date(a.check_out).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-',
      a.status === 'present' ? 'Hadir' : a.status === 'sick' ? 'Sakit' : a.status === 'leave' ? 'Izin' : 'Alpa',
      a.notes || ''
    ]);

    const csvContent = [headers, ...rows]
      .map((e) => e.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `rekap-absensi-magang-${new Date().toLocaleDateString('sv')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter logic
  const filteredAttendance = attendance.filter((a) => {
    const searchLower = searchName.toLowerCase();
    const matchesName = 
      !searchName || 
      (a.intern_name || '').toLowerCase().includes(searchLower) ||
      (a.institution || '').toLowerCase().includes(searchLower) ||
      (a.notes || '').toLowerCase().includes(searchLower) ||
      (a.status === 'present' ? 'hadir' : a.status === 'sick' ? 'sakit' : a.status === 'leave' ? 'izin' : 'alpa').includes(searchLower);
    const matchesStatus = !statusFilter || a.status === statusFilter;
    const matchesDate = !dateFilter || a.date === dateFilter;

    return matchesName && matchesStatus && matchesDate;
  });

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'present': return { label: 'Hadir', classes: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'sick': return { label: 'Sakit', classes: 'bg-rose-50 text-rose-700 border-rose-200' };
      case 'leave': return { label: 'Izin', classes: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'absent': return { label: 'Alpa', classes: 'bg-slate-100 text-slate-700 border-slate-200' };
      default: return { label: status, classes: 'bg-slate-50 text-slate-650' };
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3">
        <svg className="animate-spin h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span className="text-slate-500 font-bold text-sm tracking-wide">Memuat data absensi...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {user.role === 'intern' ? 'Riwayat Absensi Saya' : 'Rekapitulasi Kehadiran Magang'}
          </h2>
          <p className="text-slate-500 mt-1 text-sm font-semibold">
            {user.role === 'intern' 
              ? 'Tinjau kembali log absensi masuk dan pulang Anda selama periode magang.'
              : 'Pantau keaktifan harian anak magang di lingkungan kantor Bappeda Aceh.'}
          </p>
        </div>
        
        {(user.role === 'admin' || user.role === 'mentor') && (
          <button
            onClick={handleExportCSV}
            className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-emerald-600/15 cursor-pointer transition-all active:scale-95 flex items-center gap-2"
          >
            <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>Ekspor Rekap (.csv)</span>
          </button>
        )}
      </div>

      {/* Filters Section (Only for Admin/Mentor) */}
      {(user.role === 'admin' || user.role === 'mentor') && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Cari Nama</label>
            <input
              type="text"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              placeholder="Masukkan nama..."
              className="w-full border border-slate-350 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring focus:ring-emerald-500/20 text-slate-800 bg-slate-50 focus:bg-white font-semibold"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Status Kehadiran</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring focus:ring-emerald-500/20 text-slate-800 bg-slate-50 font-bold"
            >
              <option value="">Semua Status</option>
              <option value="present">Hadir</option>
              <option value="sick">Sakit</option>
              <option value="leave">Izin</option>
              <option value="absent">Alpa</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Filter Tanggal</label>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring focus:ring-emerald-500/20 text-slate-800 bg-slate-50 font-semibold"
            />
          </div>
        </div>
      )}

      {/* Attendance Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {filteredAttendance.length === 0 ? (
          <div className="py-20 text-center text-slate-400 font-bold bg-slate-50/50 border border-dashed border-slate-200 m-4 rounded-xl">
            Tidak ada riwayat kehadiran tercatat.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm text-left">
              <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  {(user.role === 'admin' || user.role === 'mentor') && <th className="px-6 py-4">Nama Lengkap</th>}
                  {(user.role === 'admin' || user.role === 'mentor') && <th className="px-6 py-4">Universitas</th>}
                  <th className="px-6 py-4">Tanggal</th>
                  <th className="px-6 py-4">Jam Masuk</th>
                  <th className="px-6 py-4">Jam Keluar</th>
                  <th className="px-6 py-4">Lokasi</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Lampiran</th>
                  <th className="px-6 py-4">Catatan / Alasan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {filteredAttendance.map((a) => {
                  const statusInfo = getStatusLabel(a.status);
                  return (
                    <tr key={a.id} className="hover:bg-slate-50/40 transition-colors">
                      {(user.role === 'admin' || user.role === 'mentor') && (
                        <td className="px-6 py-4 font-bold text-slate-900">{a.intern_name}</td>
                      )}
                      {(user.role === 'admin' || user.role === 'mentor') && (
                        <td className="px-6 py-4 text-slate-500 font-semibold">{a.institution}</td>
                      )}
                      <td className="px-6 py-4 text-slate-500">
                        {new Date(a.date).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-4 text-slate-900 font-black">
                        {a.check_in ? (
                          <div className="flex items-center gap-2">
                            <span>{new Date(a.check_in).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                            {dataService.attendance.getLatenessMinutes(a.check_in) > 0 && (
                              <span className="inline-flex px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200 rounded">
                                Terlambat {dataService.attendance.getLatenessMinutes(a.check_in)}m
                              </span>
                            )}
                          </div>
                        ) : '--:--'}
                      </td>
                      <td className="px-6 py-4 text-slate-900 font-black">
                        {a.check_out ? new Date(a.check_out).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                      </td>
                      <td className="px-6 py-4">
                        {a.latitude && a.longitude ? (
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${a.latitude},${a.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 hover:underline cursor-pointer group"
                            title={`Koordinat: ${a.latitude}, ${a.longitude}`}
                          >
                            {a.is_in_radius ? (
                              <span className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                📍 Dalam Radius
                              </span>
                            ) : (
                              <span className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-250 animate-pulse">
                                📍 Luar Radius
                              </span>
                            )}
                          </a>
                        ) : (
                          <span className="text-slate-400 font-normal italic text-xs">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusInfo.classes}`}>
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {a.attachment_url ? (
                          <a
                            href={a.attachment_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-emerald-700 hover:text-emerald-800 hover:underline font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[10px] shrink-0"
                            title={a.status === 'present' ? 'Buka Foto Selfie' : 'Buka Surat Bukti'}
                          >
                            <span>{a.status === 'present' ? '📸' : '📄'}</span>
                            <span>{a.status === 'present' ? 'Foto Selfie' : 'Surat Bukti'}</span>
                          </a>
                        ) : (
                          <span className="text-slate-400 font-normal italic text-xs">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs font-semibold text-slate-500 italic">
                        {a.notes || '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
