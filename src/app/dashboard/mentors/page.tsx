'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from '@/lib/SessionContext';
import { dataService, isDemoMode } from '@/lib/dataService';

export default function MentorsPage() {
  const { user } = useSession();
  const [mentors, setMentors] = useState<any[]>([]);
  const [interns, setInterns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Form states
  const [showAddMentorModal, setShowAddMentorModal] = useState(false);
  const [fullName, setFullName] = useState('');
  const [nip, setNip] = useState('');
  const [department, setDepartment] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const allMentors = await dataService.mentors.getAll();
      const allInterns = await dataService.interns.getAll();
      setMentors(allMentors);
      setInterns(allInterns);
    } catch (err) {
      console.error('Gagal memuat data mentor:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const handleAddMentorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !nip || !department || !email || !password) {
      alert('Semua kolom wajib diisi.');
      return;
    }

    try {
      setLoading(true);
      await dataService.mentors.signUp({
        full_name: fullName,
        nip,
        department,
        email,
        password
      });

      // Reset
      setFullName('');
      setNip('');
      setDepartment('');
      setEmail('');
      setPassword('');
      setShowAddMentorModal(false);

      await loadData();
      alert('Mentor baru berhasil ditambahkan!');
    } catch (err: any) {
      console.error('Gagal tambah mentor:', err);
      alert(err.message || 'Gagal mendaftar mentor.');
    } finally {
      setLoading(false);
    }
  };

  const filteredMentors = mentors.filter((m) => {
    const searchLower = search.toLowerCase();
    return (
      !search ||
      (m.full_name || '').toLowerCase().includes(searchLower) ||
      (m.nip || '').toLowerCase().includes(searchLower) ||
      (m.department || '').toLowerCase().includes(searchLower)
    );
  });

  if (user?.role !== 'admin') {
    return (
      <div className="py-20 text-center text-slate-500 font-bold">
        ⚠️ Anda tidak memiliki akses untuk melihat halaman ini.
      </div>
    );
  }

  if (loading && mentors.length === 0) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3">
        <svg className="animate-spin h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span className="text-slate-500 font-bold text-sm tracking-wide">Memuat data mentor...</span>
      </div>
    );
  }

  // Stats calculation
  const totalMentorsCount = mentors.length;
  const activeMentorsCount = mentors.filter((m) => interns.some((i) => i.mentor_id === m.id)).length;
  const uniqueDeptsCount = Array.from(new Set(mentors.map((m) => m.department))).length;

  return (
    <div className="space-y-6">
      {/* Top Banner Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            Manajemen Mentor Pembimbing
          </h2>
          <p className="text-slate-500 mt-1 text-sm font-semibold">
            Kelola keanggotaan, data NIP, bidang tugas, dan pendaftaran mentor pembimbing Bappeda Aceh.
          </p>
        </div>

        <button
          onClick={() => setShowAddMentorModal(true)}
          className="px-5 py-3 bg-[#1b4d32] hover:bg-[#2d7d52] text-white rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-emerald-950/15 cursor-pointer transition-all active:scale-95 flex items-center gap-2"
        >
          <svg className="w-4 h-4 sm:w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
          <span>Tambah Mentor Baru</span>
        </button>
      </div>

      {/* Stats Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4.5">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center text-xl font-bold border border-emerald-100">
            👥
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Total Mentor</span>
            <span className="text-2xl font-black text-slate-800">{totalMentorsCount} Pegawai</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4.5">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-650 rounded-xl flex items-center justify-center text-xl font-bold border border-indigo-100">
            🎓
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Membimbing Aktif</span>
            <span className="text-2xl font-black text-slate-800">{activeMentorsCount} Mentor</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4.5">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center text-xl font-bold border border-amber-100">
            🏢
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Total Bidang / Bagian</span>
            <span className="text-2xl font-black text-slate-800">{uniqueDeptsCount} Bidang</span>
          </div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="w-full md:w-1/3 relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama, NIP, atau bidang..."
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-350 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring focus:ring-emerald-500/20 text-slate-800 placeholder-slate-400 font-semibold"
          />
          <span className="absolute left-3.5 top-3 text-slate-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
        </div>
      </div>

      {/* Mentors Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {filteredMentors.length === 0 ? (
          <div className="py-20 text-center text-slate-400 font-bold bg-slate-50/50 border border-dashed border-slate-200 m-4 rounded-xl">
            Tidak ada data mentor pembimbing yang cocok.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm text-left">
              <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Nama Lengkap</th>
                  <th className="px-6 py-4">NIP</th>
                  <th className="px-6 py-4">Bidang / Departemen</th>
                  <th className="px-6 py-4 text-center">Jumlah Anak Bimbingan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {filteredMentors.map((m) => {
                  const assignedInterns = interns.filter((i) => i.mentor_id === m.id);
                  const assignedCount = assignedInterns.length;

                  return (
                    <tr key={m.id} className="hover:bg-slate-50/40 transition-colors">
                      <td className="px-6 py-4 flex items-center gap-3">
                        <div className="w-8.5 h-8.5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-black uppercase text-xs border border-emerald-150">
                          {m.full_name?.charAt(0) || 'M'}
                        </div>
                        <div>
                          <span className="font-extrabold text-slate-900 block">{m.full_name}</span>
                          <span className="text-[10px] text-slate-400 font-semibold block">{m.email || 'Email belum diset'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-slate-500 font-bold text-xs">{m.nip || '-'}</td>
                      <td className="px-6 py-4 text-slate-700 font-bold">{m.department || '-'}</td>
                      <td className="px-6 py-4 text-center">
                        {assignedCount > 0 ? (
                          <div className="inline-flex flex-col gap-1 items-center">
                            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 text-xs font-black rounded-lg border border-emerald-100">
                              👤 {assignedCount} Anak Bimbingan
                            </span>
                            <div className="text-[9px] text-slate-400 font-bold max-w-[200px] truncate">
                              ({assignedInterns.map((i) => i.full_name).join(', ')})
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs font-bold italic">Belum ada</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Mentor Modal */}
      {showAddMentorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto backdrop-blur-sm">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 max-w-lg w-full shadow-2xl relative my-8 animate-scale-up">
            <button
              onClick={() => {
                setShowAddMentorModal(false);
                setFullName('');
                setNip('');
                setDepartment('');
                setEmail('');
                setPassword('');
              }}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-650 font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 transition-all cursor-pointer"
            >
              ✕
            </button>
            <h4 className="text-xl font-black text-slate-900 mb-2 flex items-center gap-2">
              <span>Tambah Mentor Baru</span>
            </h4>
            <p className="text-xs text-slate-500 font-medium mb-5">
              Pendaftaran akun resmi untuk Mentor Pembimbing Magang di Bappeda Aceh.
            </p>

            <form onSubmit={handleAddMentorSubmit} className="space-y-4">
              <div>
                <label htmlFor="mentorFullName" className="block text-xs font-bold text-slate-505 uppercase tracking-wider mb-1.5">Nama Lengkap & Gelar</label>
                <input
                  id="mentorFullName"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Contoh: Budi Setiawan, M.Si"
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring focus:ring-emerald-500/20 text-slate-800 bg-slate-50 focus:bg-white font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="mentorNip" className="block text-xs font-bold text-slate-550 uppercase tracking-wider mb-1.5">NIP (Nomor Induk Pegawai)</label>
                  <input
                    id="mentorNip"
                    type="text"
                    required
                    value={nip}
                    onChange={(e) => setNip(e.target.value)}
                    placeholder="Contoh: 19820512..."
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring focus:ring-emerald-500/20 text-slate-800 bg-slate-50 focus:bg-white font-semibold"
                  />
                </div>
                <div>
                  <label htmlFor="mentorDept" className="block text-xs font-bold text-slate-550 uppercase tracking-wider mb-1.5">Bidang / Depatemen</label>
                  <input
                    id="mentorDept"
                    type="text"
                    required
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="Contoh: Bidang Infrastruktur"
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring focus:ring-emerald-500/20 text-slate-800 bg-slate-50 focus:bg-white font-semibold"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="mentorEmail" className="block text-xs font-bold text-slate-505 uppercase tracking-wider mb-1.5">Alamat Email Resmi</label>
                <input
                  id="mentorEmail"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="mentor@bappeda.go.id"
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring focus:ring-emerald-500/20 text-slate-800 bg-slate-50 focus:bg-white font-semibold"
                />
              </div>

              <div>
                <label htmlFor="mentorPass" className="block text-xs font-bold text-slate-555 uppercase tracking-wider mb-1.5">Kata Sandi Akun</label>
                <div className="relative">
                  <input
                    id="mentorPass"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    className="w-full border border-slate-300 rounded-xl pl-3.5 pr-10 py-2.5 text-sm focus:outline-none focus:ring focus:ring-emerald-500/20 text-slate-800 bg-slate-50 focus:bg-white font-semibold"
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

              <div className="flex gap-3 justify-end pt-5 border-t border-slate-100 mt-5">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddMentorModal(false);
                    setFullName('');
                    setNip('');
                    setDepartment('');
                    setEmail('');
                    setPassword('');
                    setShowPassword(false);
                  }}
                  className="px-4 py-2.5 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all active:scale-95"
                >
                  Daftarkan Mentor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
