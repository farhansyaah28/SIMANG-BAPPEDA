'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from '@/lib/SessionContext';
import { dataService } from '@/lib/dataService';

export default function InternsPage() {
  const { user } = useSession();
  const [interns, setInterns] = useState<any[]>([]);
  const [mentors, setMentors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [institutionFilter, setInstitutionFilter] = useState('');

  // Form states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'approved' | 'pending'>('approved');
  const [selectedIntern, setSelectedIntern] = useState<any | null>(null);

  const [fullName, setFullName] = useState('');
  const [nimNisn, setNimNisn] = useState('');
  const [institution, setInstitution] = useState('');
  const [major, setMajor] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [mentorId, setMentorId] = useState('');
  const [status, setStatus] = useState('active');

  const loadData = async () => {
    try {
      setLoading(true);
      const allInterns = await dataService.interns.getAll();
      const allMentors = await dataService.mentors.getAll();
      setMentors(allMentors);

      const internsWithPercentage = await Promise.all(
        allInterns.map(async (intern) => {
          const percentage = await dataService.attendance.getPercentage(intern.id);
          return { ...intern, attendance_percentage: percentage };
        })
      );

      if (user.role === 'admin') {
        setInterns(internsWithPercentage);
      } else if (user.role === 'mentor') {
        setInterns(internsWithPercentage.filter((i) => i.mentor_id === user.id));
      }
    } catch (err) {
      console.error('Gagal memuat data anak magang:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await dataService.interns.create({
        full_name: fullName,
        nim_nisn: nimNisn,
        institution,
        major,
        start_date: startDate,
        end_date: endDate,
        mentor_id: mentorId || '',
        email: `${fullName.toLowerCase().replace(/\s+/g, '')}@example.com`,
        role: 'intern'
      });
      
      // Reset
      setFullName('');
      setNimNisn('');
      setInstitution('');
      setMajor('');
      setStartDate('');
      setEndDate('');
      setMentorId('');
      setShowAddModal(false);
      
      await loadData();
    } catch (err) {
      alert('Gagal menambahkan anak magang.');
    }
  };

  const handleApproveClick = (intern: any) => {
    setSelectedIntern(intern);
    setFullName(intern.full_name);
    setNimNisn(intern.nim_nisn);
    setInstitution(intern.institution);
    setMajor(intern.major);
    setStartDate(intern.start_date || '');
    setEndDate(intern.end_date || '');
    setMentorId('');
    setShowApproveModal(true);
  };

  const handleApproveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIntern) return;
    if (!mentorId) {
      alert('Silakan pilih Mentor Pembimbing terlebih dahulu.');
      return;
    }

    try {
      await dataService.interns.update(selectedIntern.id, {
        start_date: startDate,
        end_date: endDate,
        mentor_id: mentorId,
        status: 'active'
      });

      setShowApproveModal(false);
      setSelectedIntern(null);
      setMentorId('');
      await loadData();
    } catch (err) {
      alert('Gagal menyetujui pendaftaran anak magang.');
    }
  };

  const handleRejectClick = async (intern: any) => {
    if (confirm(`Apakah Anda yakin ingin menolak pendaftaran dari ${intern.full_name}?`)) {
      try {
        await dataService.interns.update(intern.id, {
          status: 'inactive'
        });
        await loadData();
      } catch (err) {
        alert('Gagal menolak pendaftaran.');
      }
    }
  };

  const handleEditClick = (intern: any) => {
    setSelectedIntern(intern);
    setFullName(intern.full_name);
    setNimNisn(intern.nim_nisn);
    setInstitution(intern.institution);
    setMajor(intern.major);
    setStartDate(intern.start_date);
    setEndDate(intern.end_date);
    setMentorId(intern.mentor_id || '');
    setStatus(intern.status);
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIntern) return;
    try {
      await dataService.interns.update(selectedIntern.id, {
        full_name: fullName,
        nim_nisn: nimNisn,
        institution,
        major,
        start_date: startDate,
        end_date: endDate,
        mentor_id: mentorId || null,
        status
      });
      
      setShowEditModal(false);
      setSelectedIntern(null);
      await loadData();
    } catch (err) {
      alert('Gagal mengubah data anak magang.');
    }
  };

  // Filters
  const filteredInterns = interns.filter((i) => {
    if (activeTab === 'approved' && i.status === 'pending') return false;
    if (activeTab === 'pending' && i.status !== 'pending') return false;

    const searchLower = search.toLowerCase();
    const matchesSearch = 
      !search ||
      i.full_name.toLowerCase().includes(searchLower) || 
      i.nim_nisn.toLowerCase().includes(searchLower) || 
      i.institution.toLowerCase().includes(searchLower) || 
      i.major.toLowerCase().includes(searchLower) || 
      (i.mentor_name || '').toLowerCase().includes(searchLower) ||
      i.status.toLowerCase().includes(searchLower);
    
    const matchesInst = 
      !institutionFilter || 
      i.institution.toLowerCase() === institutionFilter.toLowerCase();

    return matchesSearch && matchesInst;
  });

  const uniqueInstitutions = Array.from(new Set(interns.map((i) => i.institution)));

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3">
        <svg className="animate-spin h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span className="text-slate-500 font-bold text-sm tracking-wide">Memuat data magang...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {user.role === 'admin' ? 'Manajemen Anak Magang' : 'Daftar Anak Bimbingan'}
          </h2>
          <p className="text-slate-500 mt-1 text-sm font-semibold">
            {user.role === 'admin' 
              ? 'Kelola data diri, penugasan mentor pembimbing, dan status keaktifan anak magang Bappeda.' 
              : 'Daftar mahasiswa/siswa magang aktif yang berada di bawah bimbingan Anda.'}
          </p>
        </div>
        
        {user.role === 'admin' && (
          <button
            onClick={() => setShowAddModal(true)}
            className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-emerald-600/15 cursor-pointer transition-all active:scale-95 flex items-center gap-2"
          >
            <svg className="w-4 h-4 sm:w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            <span>Tambah Anak Magang</span>
          </button>
        )}
      </div>

      {/* Tab Navigation */}
      {user.role === 'admin' && (
        <div className="flex border-b border-slate-200 gap-6 mt-2">
          <button
            onClick={() => setActiveTab('approved')}
            className={`pb-3 font-bold text-sm transition-all border-b-2 cursor-pointer ${
              activeTab === 'approved'
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            Aktif & Selesai ({interns.filter(i => i.status !== 'pending').length})
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`pb-3 font-bold text-sm transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'pending'
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            Pendaftar Baru
            {interns.filter(i => i.status === 'pending').length > 0 && (
              <span className="bg-amber-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full animate-pulse">
                {interns.filter(i => i.status === 'pending').length}
              </span>
            )}
          </button>
        </div>
      )}

      {/* Filters Area */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="w-full md:w-1/3 relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama, NIM, atau jurusan..."
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-350 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring focus:ring-emerald-500/20 text-slate-800 placeholder-slate-400 font-semibold"
          />
          <span className="absolute left-3.5 top-3 text-slate-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
        </div>

        <div className="w-full md:w-auto flex gap-3 self-stretch md:self-auto">
          <select
            value={institutionFilter}
            onChange={(e) => setInstitutionFilter(e.target.value)}
            className="w-full md:w-56 border border-slate-300 rounded-xl px-3 py-2 text-sm bg-slate-50 focus:outline-none focus:ring focus:ring-emerald-500/20 text-slate-800 font-bold"
          >
            <option value="">Semua Universitas/Sekolah</option>
            {uniqueInstitutions.map((inst) => (
              <option key={inst} value={inst}>{inst}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Interns Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {filteredInterns.length === 0 ? (
          <div className="py-20 text-center text-slate-400 font-bold bg-slate-50/50 border border-dashed border-slate-200 m-4 rounded-xl">
            Tidak ada data anak magang yang cocok.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm text-left">
              <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Nama Lengkap</th>
                  <th className="px-6 py-4">NIM/NISN</th>
                  <th className="px-6 py-4">Asal Instansi</th>
                  <th className="px-6 py-4">Jurusan</th>
                  <th className="px-6 py-4">Absensi</th>
                  <th className="px-6 py-4">Durasi Magang</th>
                  <th className="px-6 py-4">Mentor Pembimbing</th>
                  <th className="px-6 py-4">Status</th>
                  {user.role === 'admin' && <th className="px-6 py-4 text-center">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {filteredInterns.map((intern) => (
                  <tr key={intern.id} className="hover:bg-slate-50/40 transition-colors">
                    <td className="px-6 py-4 flex items-center gap-3">
                      <div className="w-8.5 h-8.5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-black uppercase text-xs border border-emerald-150">
                        {intern.full_name.charAt(0)}
                      </div>
                      <div>
                        <span className="font-extrabold text-slate-900 block">{intern.full_name}</span>
                        <span className="text-[10px] text-slate-400 font-semibold block">{intern.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-500 font-bold text-xs">{intern.nim_nisn}</td>
                    <td className="px-6 py-4 text-slate-700 font-bold">{intern.institution}</td>
                    <td className="px-6 py-4 text-slate-550 font-semibold">{intern.major}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden border border-slate-200">
                          <div 
                            className={`h-full rounded-full transition-all ${
                              (intern.attendance_percentage || 0) >= 80 
                                ? 'bg-emerald-500' 
                                : (intern.attendance_percentage || 0) >= 50 
                                  ? 'bg-amber-500' 
                                  : 'bg-rose-500'
                            }`} 
                            style={{ width: `${intern.attendance_percentage || 0}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-extrabold text-slate-600">{intern.attendance_percentage || 0}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-xs font-bold leading-relaxed whitespace-nowrap">
                      {intern.start_date ? new Date(intern.start_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : '-'}
                      <span className="mx-1 text-slate-350 font-medium">s/d</span>
                      {intern.end_date ? new Date(intern.end_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : '-'}
                    </td>
                    <td className="px-6 py-4">
                      {intern.mentor_name ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-100">
                          👤 {intern.mentor_name}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs font-bold italic">Belum ditunjuk</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-black border ${
                        intern.status === 'active' 
                          ? 'bg-emerald-50 border-emerald-250 text-emerald-700' 
                          : intern.status === 'pending'
                            ? 'bg-amber-50 border-amber-250 text-amber-700'
                            : 'bg-slate-100 border-slate-200 text-slate-500'
                      }`}>
                        {intern.status === 'active' ? 'Aktif' : intern.status === 'pending' ? 'Persetujuan' : 'Selesai'}
                      </span>
                    </td>
                    {user.role === 'admin' && (
                      <td className="px-6 py-4 text-center">
                        {interns.filter(i => i.status === 'pending').some(i => i.id === intern.id) ? (
                          <div className="flex gap-2 justify-center">
                            <button
                              onClick={() => handleApproveClick(intern)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer transition-all active:scale-95 shadow-md shadow-emerald-600/10"
                            >
                              Setujui
                            </button>
                            <button
                              onClick={() => handleRejectClick(intern)}
                              className="px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-lg text-xs font-bold cursor-pointer transition-all active:scale-95"
                            >
                              Tolak
                            </button>
                          </div>
                        ) : (
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() => handleEditClick(intern)}
                              className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                              title="Ubah Data"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                            </button>
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto backdrop-blur-sm">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 max-w-lg w-full shadow-2xl relative my-8 animate-scale-up">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 transition-all cursor-pointer"
            >
              ✕
            </button>
            <h4 className="text-xl font-black text-slate-900 mb-5 flex items-center gap-2">
              <svg className="w-5.5 h-5.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              <span>Tambah Anak Magang Baru</span>
            </h4>
            
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Contoh: Muhammad Farhan"
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring focus:ring-emerald-500/20 text-slate-800 bg-slate-50 focus:bg-white transition-all font-semibold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">NIM / NISN</label>
                  <input
                    type="text"
                    required
                    value={nimNisn}
                    onChange={(e) => setNimNisn(e.target.value)}
                    placeholder="Contoh: 210810701004"
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring focus:ring-emerald-500/20 text-slate-800 bg-slate-50 focus:bg-white transition-all font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Jurusan</label>
                  <input
                    type="text"
                    required
                    value={major}
                    onChange={(e) => setMajor(e.target.value)}
                    placeholder="Contoh: S1 Informatika"
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring focus:ring-emerald-500/20 text-slate-800 bg-slate-50 focus:bg-white transition-all font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Asal Instansi (Universitas/Sekolah)</label>
                <input
                  type="text"
                  required
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  placeholder="Contoh: Universitas Syiah Kuala"
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring focus:ring-emerald-500/20 text-slate-800 bg-slate-50 focus:bg-white transition-all font-semibold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Mulai Magang</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring focus:ring-emerald-500/20 text-slate-800 bg-slate-50 focus:bg-white transition-all font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Selesai Magang</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring focus:ring-emerald-500/20 text-slate-800 bg-slate-50 focus:bg-white transition-all font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Mentor Pembimbing</label>
                <select
                  value={mentorId}
                  onChange={(e) => setMentorId(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring focus:ring-emerald-500/20 text-slate-800 bg-slate-50 font-bold"
                >
                  <option value="">Belum Ditentukan / Pilih Mentor</option>
                  {mentors.map((m) => (
                    <option key={m.id} value={m.id}>{m.full_name} ({m.department})</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 justify-end pt-5 border-t border-slate-100 mt-5">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all active:scale-95"
                >
                  Simpan Data
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto backdrop-blur-sm">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 max-w-lg w-full shadow-2xl relative my-8 animate-scale-up">
            <button
              onClick={() => {
                setShowEditModal(false);
                setSelectedIntern(null);
              }}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-650 font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 transition-all cursor-pointer"
            >
              ✕
            </button>
            <h4 className="text-xl font-black text-slate-900 mb-5 flex items-center gap-2">
              <svg className="w-5.5 h-5.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span>Ubah Data Anak Magang</span>
            </h4>
            
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring focus:ring-emerald-500/20 text-slate-800 bg-slate-50 focus:bg-white font-semibold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">NIM / NISN</label>
                  <input
                    type="text"
                    required
                    value={nimNisn}
                    onChange={(e) => setNimNisn(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring focus:ring-emerald-500/20 text-slate-800 bg-slate-50 focus:bg-white font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Jurusan</label>
                  <input
                    type="text"
                    required
                    value={major}
                    onChange={(e) => setMajor(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring focus:ring-emerald-500/20 text-slate-800 bg-slate-50 focus:bg-white font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Asal Instansi (Universitas/Sekolah)</label>
                <input
                  type="text"
                  required
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring focus:ring-emerald-500/20 text-slate-800 bg-slate-50 focus:bg-white font-semibold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Mulai Magang</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring focus:ring-emerald-500/20 text-slate-800 bg-slate-50 focus:bg-white font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Selesai Magang</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring focus:ring-emerald-500/20 text-slate-800 bg-slate-50 focus:bg-white font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Mentor Pembimbing</label>
                  <select
                    value={mentorId}
                    onChange={(e) => setMentorId(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring focus:ring-emerald-500/20 text-slate-800 bg-slate-50 font-bold"
                  >
                    <option value="">Belum Ditentukan / Pilih Mentor</option>
                    {mentors.map((m) => (
                      <option key={m.id} value={m.id}>{m.full_name} ({m.department})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Status Keaktifan</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring focus:ring-emerald-500/20 text-slate-800 bg-slate-50 font-bold"
                  >
                    <option value="active">Aktif</option>
                    <option value="completed">Selesai Magang</option>
                    <option value="inactive">Nonaktif</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-5 border-t border-slate-100 mt-5">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedIntern(null);
                  }}
                  className="px-4 py-2.5 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all active:scale-95"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Approve Modal */}
      {showApproveModal && selectedIntern && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto backdrop-blur-sm">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 max-w-lg w-full shadow-2xl relative my-8 animate-scale-up">
            <button
              onClick={() => {
                setShowApproveModal(false);
                setSelectedIntern(null);
              }}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 transition-all cursor-pointer"
            >
              ✕
            </button>
            <h4 className="text-xl font-black text-slate-900 mb-2 flex items-center gap-2">
              <svg className="w-5.5 h-5.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Persetujuan Pendaftaran Magang</span>
            </h4>
            <p className="text-xs text-slate-500 font-medium mb-5">
              Tinjau data pendaftaran, tentukan Mentor Pembimbing, dan sesuaikan periode magang resmi.
            </p>

            <form onSubmit={handleApproveSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Nama Lengkap</label>
                <div className="text-sm font-bold text-slate-800 bg-slate-50 p-2.5 rounded-xl border border-slate-200/60 font-sans">
                  {selectedIntern.full_name}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">NIM / NISN</label>
                  <div className="text-sm font-bold text-slate-800 bg-slate-50 p-2.5 rounded-xl border border-slate-200/60 font-sans">
                    {selectedIntern.nim_nisn}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Jurusan</label>
                  <div className="text-sm font-bold text-slate-800 bg-slate-50 p-2.5 rounded-xl border border-slate-200/60 font-sans">
                    {selectedIntern.major}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Universitas / Sekolah Asal</label>
                <div className="text-sm font-bold text-slate-800 bg-slate-50 p-2.5 rounded-xl border border-slate-200/60 font-sans">
                  {selectedIntern.institution}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-505 uppercase tracking-wider mb-1.5">Mulai Magang Resmi</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring focus:ring-emerald-500/20 text-slate-800 bg-slate-50 focus:bg-white font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-505 uppercase tracking-wider mb-1.5">Selesai Magang Resmi</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring focus:ring-emerald-500/20 text-slate-800 bg-slate-50 focus:bg-white font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-505 uppercase tracking-wider mb-1.5">Tunjuk Mentor Pembimbing</label>
                <select
                  required
                  value={mentorId}
                  onChange={(e) => setMentorId(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring focus:ring-emerald-500/20 text-slate-800 bg-slate-50 font-bold"
                >
                  <option value="">-- Pilih Mentor --</option>
                  {mentors.map((m) => (
                    <option key={m.id} value={m.id}>{m.full_name} ({m.department})</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 justify-end pt-5 border-t border-slate-100 mt-5">
                <button
                  type="button"
                  onClick={() => {
                    setShowApproveModal(false);
                    setSelectedIntern(null);
                  }}
                  className="px-4 py-2.5 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all active:scale-95"
                >
                  Setujui & Aktifkan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
