'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from '@/lib/SessionContext';
import { dataService } from '@/lib/dataService';

export default function ActivitiesPage() {
  const { user } = useSession();
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [interns, setInterns] = useState<any[]>([]);
  const [mentors, setMentors] = useState<any[]>([]);
  const [selectedInternId, setSelectedInternId] = useState<string>('');
  const [isPrintView, setIsPrintView] = useState(false);

  // Intern Form states
  const [taskDescription, setTaskDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Mentor feedback modal states
  const [selectedActivity, setSelectedActivity] = useState<any | null>(null);
  const [feedback, setFeedback] = useState('');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewStatus, setReviewStatus] = useState<'approved' | 'rejected'>('approved');

  const loadData = async () => {
    try {
      setLoading(true);
      const allInterns = await dataService.interns.getAll();
      setInterns(allInterns);

      const allMentors = await dataService.mentors.getAll();
      setMentors(allMentors);

      if (user.role === 'admin' || user.role === 'mentor') {
        const allActs = await dataService.activities.getAll();
        if (user.role === 'mentor') {
          // Filter to only their interns
          const myInternIds = allInterns.filter(i => i.mentor_id === user.id).map(i => i.id);
          setActivities(allActs.filter(a => myInternIds.includes(a.intern_id)));
        } else {
          setActivities(allActs);
        }
      } else {
        const myActs = await dataService.activities.getForIntern(user.id);
        setActivities(myActs);
      }
    } catch (err) {
      console.error('Gagal memuat data jurnal:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  // Submit new journal log
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskDescription.trim()) return;

    try {
      setSubmitting(true);
      await dataService.activities.create(user.id, taskDescription);
      setTaskDescription('');
      await loadData();
    } catch (err) {
      alert('Gagal mengirim log jurnal.');
    } finally {
      setSubmitting(false);
    }
  };

  const openReviewModal = (act: any, status: 'approved' | 'rejected') => {
    setSelectedActivity(act);
    setReviewStatus(status);
    setFeedback('');
    setShowReviewModal(true);
  };

  // Submit review approval/rejection
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedActivity) return;

    try {
      await dataService.activities.review(selectedActivity.id, reviewStatus, feedback);
      setShowReviewModal(false);
      setSelectedActivity(null);
      await loadData();
    } catch (err) {
      alert('Gagal memproses verifikasi jurnal.');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'rejected': return 'bg-rose-50 text-rose-700 border border-rose-200';
      default: return 'bg-amber-50 text-amber-700 border border-amber-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'approved': return 'Disetujui';
      case 'rejected': return 'Ditolak';
      default: return 'Pending';
    }
  };

  const getBorderLeft = (status: string) => {
    switch (status) {
      case 'approved': return 'border-l-4 border-l-emerald-500';
      case 'rejected': return 'border-l-4 border-l-rose-500';
      default: return 'border-l-4 border-l-amber-500';
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3">
        <svg className="animate-spin h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span className="text-slate-500 font-bold text-sm tracking-wide">Memuat data jurnal harian...</span>
      </div>
    );
  }

  const filteredActivities = selectedInternId 
    ? activities.filter(a => a.intern_id === selectedInternId)
    : activities;

  // Print Mode Layout Handler
  if (isPrintView) {
    const targetInternId = selectedInternId || user.id;
    const selectedIntern = interns.find(i => i.id === targetInternId);
    const selectedMentor = selectedIntern ? mentors.find(m => m.id === selectedIntern.mentor_id) : null;
    const formattedDuration = selectedIntern
      ? `${new Date(selectedIntern.start_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} s.d. ${new Date(selectedIntern.end_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`
      : '-';

    return (
      <div className="max-w-4xl mx-auto my-8 print:my-0 print:mx-0">
        {/* Print Control Bar */}
        <div className="flex justify-between items-center bg-white p-4.5 rounded-2xl border border-slate-200 shadow-sm mb-6 print:hidden">
          <div className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-2 font-sans">
            <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Logbook Harian Magang {selectedIntern ? `(${selectedIntern.full_name})` : ''}</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setIsPrintView(false)}
              className="px-4 py-2 border border-slate-350 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer font-sans"
            >
              Kembali
            </button>
            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md flex items-center gap-1.5 font-sans"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-3a2 2 0 00-2-2H5a2 2 0 00-2 2v3a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              <span>Cetak / Simpan PDF</span>
            </button>
          </div>
        </div>

        {/* Logbook Page Content Card */}
        {selectedIntern ? (
          <div className="bg-white p-8 sm:p-12 border border-slate-300 font-sans text-slate-900 leading-relaxed shadow-lg relative print:border-none print:shadow-none print:p-8">
            <div className="space-y-7">
              {/* Header Bappeda Aceh */}
              <div className="flex items-center justify-between border-b-4 border-double border-slate-800 pb-5 text-center">
                {/* Logo Bappeda Aceh */}
                <div className="w-24 h-24 shrink-0 flex items-center justify-center">
                  <img 
                    src="/logo-bappeda.png" 
                    alt="Logo Bappeda" 
                    className="w-22 h-22 object-contain"
                  />
                </div>
                <div className="flex-1 px-4">
                  <h3 className="text-base sm:text-lg font-bold tracking-wider uppercase text-slate-900 font-sans">
                    Pemerintah Provinsi Aceh
                  </h3>
                  <h2 className="text-lg sm:text-xl font-black tracking-wide uppercase text-slate-900 mt-0.5 font-sans">
                    Badan Perencanaan Pembangunan Daerah (BAPPEDA)
                  </h2>
                  <p className="text-[8px] sm:text-xs text-slate-650 font-semibold italic mt-1 font-sans">
                    Jalan Tgk. H. Mohd. Daud Beureueh No. 26, Banda Aceh | Telp: (0651) 21440 | Web: bappeda.acehprov.go.id | Email: bappeda@acehprov.go.id
                  </p>
                </div>
                <div className="w-18 h-18 shrink-0 hidden sm:block"></div>
              </div>

              {/* Title */}
              <div className="text-center space-y-1">
                <h1 className="text-xl sm:text-2xl font-black tracking-wide uppercase underline text-slate-950">
                  Logbook Harian Kegiatan Magang
                </h1>
              </div>

              {/* Intern Info Metadata */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-bold text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-200 print:bg-white print:border-none print:p-0 print:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <span className="w-28 text-slate-400 font-semibold">Nama Lengkap</span>
                    <span className="text-slate-900">: {selectedIntern.full_name}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="w-28 text-slate-400 font-semibold">NIM / NISN</span>
                    <span className="text-slate-900">: {selectedIntern.nim_nisn}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="w-28 text-slate-400 font-semibold">Asal Instansi</span>
                    <span className="text-slate-900">: {selectedIntern.institution}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <span className="w-28 text-slate-400 font-semibold">Jurusan / Prodi</span>
                    <span className="text-slate-900">: {selectedIntern.major}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="w-28 text-slate-400 font-semibold">Periode Magang</span>
                    <span className="text-slate-900">: {formattedDuration}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="w-28 text-slate-400 font-semibold">Pembimbing</span>
                    <span className="text-slate-900">: {selectedIntern.mentor_name}</span>
                  </div>
                </div>
              </div>

              {/* Activities Table */}
              <div className="overflow-hidden border border-slate-300 rounded-xl mt-4 print:border-slate-400">
                <table className="min-w-full divide-y divide-slate-300 text-xs text-left">
                  <thead className="bg-slate-50 text-slate-800 font-bold uppercase tracking-wider text-[9px] border-b border-slate-300 print:bg-slate-100">
                    <tr>
                      <th className="px-4 py-3 text-center w-10">No</th>
                      <th className="px-4 py-3 w-32">Hari / Tanggal</th>
                      <th className="px-4 py-3">Deskripsi Kegiatan Harian</th>
                      <th className="px-4 py-3 w-44">Umpan Balik Pembimbing</th>
                      <th className="px-4 py-3 text-center w-24">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-700 font-medium bg-white print:divide-slate-300">
                    {filteredActivities.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-10 text-center font-bold text-slate-400 italic">
                          Belum ada kegiatan yang tercatat.
                        </td>
                      </tr>
                    ) : (
                      filteredActivities.map((act, index) => (
                        <tr key={act.id} className="hover:bg-slate-50/40">
                          <td className="px-4 py-3 text-center font-bold text-slate-400">{index + 1}</td>
                          <td className="px-4 py-3 font-semibold text-slate-900 whitespace-nowrap">
                            {new Date(act.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="px-4 py-3 leading-relaxed whitespace-pre-line text-slate-850 font-semibold">{act.task_description}</td>
                          <td className="px-4 py-3 text-slate-600 leading-relaxed italic">{act.feedback || '-'}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border ${
                              act.status === 'approved' 
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-700 print:text-emerald-800' 
                                : act.status === 'rejected'
                                  ? 'bg-rose-50 border-rose-200 text-rose-700 print:text-rose-800'
                                  : 'bg-amber-50 border-amber-200 text-amber-700 print:text-amber-800'
                            }`}>
                              {act.status === 'approved' ? 'Disetujui' : act.status === 'rejected' ? 'Ditolak' : 'Pending'}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Signature Block */}
              <div className="pt-10 flex justify-between gap-6 text-xs">
                <div className="w-1/3"></div>
                <div className="w-1/2 text-center space-y-16">
                  <div>
                    <p className="font-semibold">Banda Aceh, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    <p className="text-slate-450 font-bold text-[10px] uppercase tracking-wider mt-0.5">Mentor Pembimbing Lapangan,</p>
                  </div>
                  
                  <div className="font-bold text-slate-900 space-y-1">
                    <p className="underline font-black">{selectedIntern.mentor_name}</p>
                    {selectedMentor && selectedMentor.nip && (
                      <p className="text-[9px] text-slate-400 font-extrabold tracking-wider font-mono">
                        NIP. {selectedMentor.nip}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-10 text-center font-bold text-slate-400">Intern data not found.</div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {user.role === 'intern' ? 'Jurnal Harian Magang' : user.role === 'mentor' ? 'Verifikasi Jurnal Bimbingan' : 'Rekapitulasi Jurnal Anak Magang'}
          </h2>
          <p className="text-slate-500 mt-1 text-sm font-semibold">
            {user.role === 'intern' 
              ? 'Tuliskan rincian tugas, proyek, dan pencapaian Anda setiap harinya untuk ditinjau oleh mentor.'
              : 'Tinjau, beri saran, dan setujui jurnal kegiatan harian anak magang di bawah bimbingan Anda.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Intern selector for mentor/admin */}
          {(user.role === 'mentor' || user.role === 'admin') && (
            <select
              value={selectedInternId}
              onChange={(e) => setSelectedInternId(e.target.value)}
              className="border border-slate-300 rounded-xl px-3.5 py-2 text-sm bg-white focus:outline-none focus:ring focus:ring-emerald-500/20 text-slate-800 font-bold"
            >
              <option value="">Semua Anak Magang</option>
              {user.role === 'mentor' ? (
                interns.filter(i => i.mentor_id === user.id).map(i => (
                  <option key={i.id} value={i.id}>{i.full_name}</option>
                ))
              ) : (
                interns.map(i => (
                  <option key={i.id} value={i.id}>{i.full_name}</option>
                ))
              )}
            </select>
          )}

          {/* Cetak Logbook button */}
          {(user.role === 'intern' || selectedInternId) && (
            <button
              onClick={() => setIsPrintView(true)}
              className="px-4 py-2 bg-[#1b4d32] hover:bg-[#2d7d52] text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all active:scale-95 flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-3a2 2 0 00-2-2H5a2 2 0 00-2 2v3a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              <span>Cetak Logbook PDF</span>
            </button>
          )}
        </div>
      </div>

      {/* Quick Stats Summary Banner */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-11 h-11 bg-slate-50 text-slate-600 rounded-xl flex items-center justify-center font-bold text-lg border border-slate-100 shadow-inner">
            📝
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Jurnal</div>
            <div className="text-lg font-black text-slate-800">{filteredActivities.length}</div>
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-11 h-11 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center font-bold text-lg border border-emerald-100 shadow-inner">
            ✓
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Disetujui</div>
            <div className="text-lg font-black text-slate-855">
              {filteredActivities.filter(a => a.status === 'approved').length}
            </div>
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-11 h-11 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center font-bold text-lg border border-amber-100 shadow-inner">
            ⏳
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Pending</div>
            <div className="text-lg font-black text-slate-855">
              {filteredActivities.filter(a => a.status === 'pending').length}
            </div>
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-11 h-11 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center font-bold text-lg border border-rose-100 shadow-inner">
            ✕
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Ditolak</div>
            <div className="text-lg font-black text-slate-855">
              {filteredActivities.filter(a => a.status === 'rejected').length}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* =========================================
            LEFT COLUMN: FORM INPUT (INTERN ONLY)
           ========================================= */}
        {user.role === 'intern' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span>Tulis Jurnal Hari Ini</span>
              </h3>
              
              <div className="p-3.5 bg-emerald-50/60 border border-emerald-100/60 rounded-xl text-xs leading-relaxed text-emerald-800 font-medium">
                💡 <strong>Petunjuk Penulisan:</strong> Deskripsikan pekerjaan Anda secara spesifik (nama modul/dokumen/tugas), jelaskan bidang atau divisi terkait, serta hasil yang dicapai agar memudahkan penilaian mentor.
              </div>

              <form onSubmit={handleAddSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Tanggal Kegiatan
                  </label>
                  <input
                    type="text"
                    disabled
                    value={new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-slate-50 text-slate-500 font-bold cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Deskripsi Pekerjaan / Tugas
                  </label>
                  <textarea
                    required
                    value={taskDescription}
                    onChange={(e) => setTaskDescription(e.target.value)}
                    placeholder="Contoh: Membantu memvalidasi data usulan infrastruktur jalan raya dari dinas kabupaten/kota, serta menyusun notulensi rapat pleno tahunan."
                    className="w-full border border-slate-350 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring focus:ring-emerald-500/20 text-slate-800 placeholder-slate-400 h-36 bg-slate-50 focus:bg-white transition-all resize-none font-semibold leading-relaxed"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={submitting || !taskDescription.trim()}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-650/15 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-98"
                >
                  {submitting ? 'Mengirim...' : 'Kirim Log Jurnal'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* =========================================
            RIGHT COLUMN: LOG LISTINGS (TIMELINE STYLED)
           ========================================= */}
        <div className={`${user.role === 'intern' ? 'lg:col-span-2' : 'lg:col-span-3'} space-y-4`}>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-4">
              <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Alur Riwayat Jurnal</span>
            </h3>

            {filteredActivities.length === 0 ? (
              <div className="py-20 text-center text-slate-400 font-bold border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                Belum ada catatan log jurnal kegiatan.
              </div>
            ) : (
              <div className="relative border-l border-slate-200 ml-4 pl-6 space-y-6">
                {filteredActivities.map((act) => {
                  let dotColor = 'bg-amber-400 ring-amber-100/80';
                  if (act.status === 'approved') dotColor = 'bg-emerald-500 ring-emerald-100/80';
                  if (act.status === 'rejected') dotColor = 'bg-rose-500 ring-rose-100/80';

                  return (
                    <div key={act.id} className="relative group">
                      {/* Timeline Dot Indicator */}
                      <span className={`absolute -left-[33px] top-1.5 flex h-4.5 w-4.5 items-center justify-center rounded-full ${dotColor} ring-4 transition-all duration-300 group-hover:scale-125`}>
                        <span className="h-1.5 w-1.5 rounded-full bg-white"></span>
                      </span>

                      {/* Log Entry Card */}
                      <div className="bg-slate-50/40 hover:bg-slate-50/80 p-5 rounded-2xl border border-slate-200 hover:border-slate-350/80 shadow-sm hover:shadow-md transition-all duration-300 space-y-3.5 relative overflow-hidden">
                        
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/50 pb-2.5">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-450 font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                              <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {new Date(act.date).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                            
                            {(user.role === 'admin' || user.role === 'mentor') && (
                              <span className="text-xs font-black text-emerald-800 bg-emerald-50 border border-emerald-100/50 px-2.5 py-0.5 rounded-md">
                                {act.intern_name} ({act.institution})
                              </span>
                            )}
                          </div>

                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${getStatusBadge(act.status)}`}>
                            {getStatusLabel(act.status)}
                          </span>
                        </div>

                        <p className="text-sm font-semibold text-slate-800 leading-relaxed">
                          {act.task_description}
                        </p>

                        {/* Mentor Feedback comments */}
                        {act.feedback && (
                          <div className="p-3.5 bg-amber-50/70 border border-amber-100/80 rounded-xl text-xs leading-relaxed text-slate-700 font-medium">
                            <span className="font-extrabold text-amber-950 block mb-1 flex items-center gap-1">
                              <svg className="w-3.5 h-3.5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                              </svg>
                              <span>Catatan Pembimbing:</span>
                            </span>
                            {act.feedback}
                          </div>
                        )}

                        {/* Review Actions (Mentor only, and only if pending) */}
                        {user.role === 'mentor' && act.status === 'pending' && (
                          <div className="flex gap-2 justify-end pt-1">
                            <button
                              onClick={() => openReviewModal(act, 'approved')}
                              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all active:scale-95"
                            >
                              Setujui
                            </button>
                            <button
                              onClick={() => openReviewModal(act, 'rejected')}
                              className="px-4 py-2 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold cursor-pointer transition-all active:scale-95"
                            >
                              Tolak
                            </button>
                          </div>
                        )}

                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Review Dialog/Modal */}
      {showReviewModal && selectedActivity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 max-w-md w-full shadow-2xl relative animate-scale-up">
            <button
              onClick={() => {
                setShowReviewModal(false);
                setSelectedActivity(null);
              }}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-650 font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 transition-all cursor-pointer"
            >
              ✕
            </button>
            
            <h4 className="text-lg font-black text-slate-900 mb-2">
              {reviewStatus === 'approved' ? 'Setujui Jurnal Harian' : 'Tolak Jurnal Harian'}
            </h4>
            <p className="text-xs text-slate-500 mb-4 font-semibold">
              Anak magang: <strong className="text-slate-800">{selectedActivity.intern_name}</strong>
            </p>

            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 rounded-2xl max-h-28 overflow-y-auto leading-relaxed italic">
                &ldquo;{selectedActivity.task_description}&rdquo;
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Umpan Balik / Catatan Ulasan
                </label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder={reviewStatus === 'approved' ? 'Tuliskan catatan apresiasi atau masukan tambahan...' : 'Tuliskan alasan penolakan secara jelas...'}
                  className="w-full border border-slate-350 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring focus:ring-emerald-500/20 h-28 text-slate-800 bg-slate-50 focus:bg-white resize-none font-semibold"
                  required={reviewStatus === 'rejected'}
                ></textarea>
              </div>

              <div className="flex gap-3 justify-end pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowReviewModal(false);
                    setSelectedActivity(null);
                  }}
                  className="px-4 py-2.5 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2.5 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer ${
                    reviewStatus === 'approved' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  Kirim Keputusan
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
