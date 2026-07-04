'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from '@/lib/SessionContext';
import { dataService, isDemoMode, setDemoMode } from '@/lib/dataService';

export default function GradesPage() {
  const { user } = useSession();
  const [interns, setInterns] = useState<any[]>([]);
  const [grades, setGrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form input states
  const [selectedIntern, setSelectedIntern] = useState<any | null>(null);
  const [discipline, setDiscipline] = useState<number | ''>('');
  const [responsibility, setResponsibility] = useState<number | ''>('');
  const [technicalSkills, setTechnicalSkills] = useState<number | ''>('');
  const [attitude, setAttitude] = useState<number | ''>('');
  const [showGradeModal, setShowGradeModal] = useState(false);

  // Print states
  const [printIntern, setPrintIntern] = useState<any | null>(null);
  const [printGrade, setPrintGrade] = useState<any | null>(null);
  const [printModeType, setPrintModeType] = useState<'grades' | 'certificate'>('grades');

  // Report Upload / Detail states
  const [internDetail, setInternDetail] = useState<any | null>(null);
  const [uploading, setUploading] = useState(false);

  // Review Report states
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewIntern, setReviewIntern] = useState<any | null>(null);
  const [reviewFeedback, setReviewFeedback] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  const [mentorsList, setMentorsList] = useState<any[]>([]);

  const loadData = async (retryWithDemo = true) => {
    try {
      setLoading(true);
      const allInterns = await dataService.interns.getAll();
      const allGrades = await dataService.grades.getAll();
      const allMentors = await dataService.mentors.getAll();
      
      setGrades(allGrades);
      setMentorsList(allMentors);

      if (user.role === 'admin') {
        setInterns(allInterns);
      } else if (user.role === 'mentor') {
        setInterns(allInterns.filter((i) => i.mentor_id === user.id));
      } else if (user.role === 'intern') {
        const myGrade = await dataService.grades.getForIntern(user.id);
        setPrintGrade(myGrade);
        setPrintIntern(user);

        // Ambil data intern lengkap untuk status laporan
        const me = allInterns.find((i) => i.id === user.id);
        setInternDetail(me || null);
      }
    } catch (err) {
      console.error('Gagal memuat data nilai:', err);
      if (retryWithDemo && !isDemoMode) {
        console.warn('Terjadi kesalahan koneksi database. Otomatis beralih ke Mode Demo...');
        setDemoMode(true);
        await loadData(false);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const handleOpenGradeModal = (intern: any) => {
    const existingGrade = grades.find((g) => g.intern_id === intern.id);
    setSelectedIntern(intern);
    if (existingGrade) {
      setDiscipline(existingGrade.discipline);
      setResponsibility(existingGrade.responsibility);
      setTechnicalSkills(existingGrade.technical_skills);
      setAttitude(existingGrade.attitude);
    } else {
      setDiscipline('');
      setResponsibility('');
      setTechnicalSkills('');
      setAttitude('');
    }
    setShowGradeModal(true);
  };

  const handleGradeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIntern) return;

    const disc = Number(discipline);
    const resp = Number(responsibility);
    const tech = Number(technicalSkills);
    const att = Number(attitude);

    if (disc < 0 || disc > 100 || resp < 0 || resp > 100 || tech < 0 || tech > 100 || att < 0 || att > 100) {
      alert('Nilai harus berada di antara range 0 hingga 100.');
      return;
    }

    try {
      await dataService.grades.save({
        intern_id: selectedIntern.id,
        discipline: disc,
        responsibility: resp,
        technical_skills: tech,
        attitude: att,
        graded_by: user.id
      });
      setShowGradeModal(false);
      setSelectedIntern(null);
      await loadData();
    } catch (err) {
      alert('Gagal menyimpan nilai.');
    }
  };

  const handleUploadReport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.type !== 'application/pdf') {
      alert('File harus berupa PDF.');
      return;
    }
    
    try {
      setUploading(true);
      // Simulate network latency
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const mockUrl = `https://bappeda.acehprov.go.id/reports/${user.full_name.toLowerCase().replace(/\s+/g, '_')}_laporan_akhir.pdf`;
      await dataService.interns.uploadReport(user.id, mockUrl);
      
      alert('Laporan akhir berhasil diunggah!');
      await loadData();
    } catch (err) {
      alert('Gagal mengunggah laporan.');
    } finally {
      setUploading(false);
    }
  };

  const handleOpenReviewModal = (intern: any) => {
    setReviewIntern(intern);
    setReviewFeedback(intern.report_feedback || '');
    setShowReviewModal(true);
  };

  const handleReviewReportSubmit = async (status: 'approved' | 'rejected') => {
    if (!reviewIntern) return;
    try {
      setReviewSubmitting(true);
      await dataService.interns.reviewReport(reviewIntern.id, status, reviewFeedback);
      alert(`Laporan akhir berhasil ${status === 'approved' ? 'disetujui' : 'ditolak'}!`);
      setShowReviewModal(false);
      setReviewIntern(null);
      setReviewFeedback('');
      await loadData();
    } catch (err) {
      alert('Gagal memproses review laporan.');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleTriggerPrint = (intern: any, type: 'grades' | 'certificate' = 'grades') => {
    const g = grades.find((gr) => gr.intern_id === intern.id);
    if (!g) {
      alert('Anak magang ini belum dinilai.');
      return;
    }
    setPrintModeType(type);
    setPrintIntern(intern);
    setPrintGrade(g);
    // Give state a small delay to render print view then open printer prompt
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const getLetterGrade = (score: number) => {
    if (score >= 85) return { letter: 'A', label: 'Sangat Memuaskan' };
    if (score >= 75) return { letter: 'B', label: 'Memuaskan' };
    if (score >= 60) return { letter: 'C', label: 'Cukup' };
    if (score >= 50) return { letter: 'D', label: 'Kurang' };
    return { letter: 'E', label: 'Sangat Kurang' };
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3">
        <svg className="animate-spin h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span className="text-slate-500 font-bold text-sm tracking-wide">Memuat data nilai...</span>
      </div>
    );
  }

  // Print Mode Layout Handler (hides everything else on screen)
  if (printIntern && printGrade) {
    const finalScore = printGrade.final_grade;
    const { letter, label } = getLetterGrade(finalScore);
    const formattedDuration = printIntern.internInfo 
      ? `${new Date(printIntern.internInfo.start_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} s.d. ${new Date(printIntern.internInfo.end_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`
      : `${new Date(printIntern.start_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} s.d. ${new Date(printIntern.end_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`;

    const certNum = String(printIntern.nim_nisn || printIntern.internInfo?.nim_nisn || printIntern.id || '123').replace(/[^0-9]/g, '').slice(-3) || '123';

    if (printModeType === 'certificate') {
      let predicate = 'CUKUP';
      if (finalScore >= 85) predicate = 'SANGAT BAIK (DENGAN PUJIAN)';
      else if (finalScore >= 75) predicate = 'BAIK (MEMUASKAN)';

      const matchedMentor = mentorsList.find(m => m.id === printIntern.mentor_id);
      const mentorName = matchedMentor?.full_name || printIntern.mentor_name || 'Budi Setiawan, M.Si';
      const mentorNip = matchedMentor?.nip || '19820512 201001 1 003';

      return (
        <div className="max-w-4xl mx-auto my-8 print:my-0 print:mx-0">
          {/* Inject dynamic landscape print settings */}
          <style dangerouslySetInnerHTML={{__html: `
            @media print {
              @page {
                size: landscape;
                margin: 8mm;
              }
              body {
                background: white;
              }
            }
          `}} />

          {/* Print Control Bar */}
          <div className="flex justify-between items-center bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-sm mb-6 print:hidden">
            <div className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-2 font-sans">
              <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
              </svg>
              <span>Sertifikat Kelulusan Magang ({printIntern.full_name})</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setPrintIntern(null);
                  setPrintGrade(null);
                  loadData();
                }}
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

          {/* Certificate sheet container (Landscape design) */}
          <div className="bg-white p-12 border-[12px] border-double border-emerald-800/80 font-serif text-slate-900 leading-relaxed shadow-2xl relative print:border-[12px] print:shadow-none print:p-10 w-full min-h-[580px] flex flex-col justify-between overflow-hidden">
            {/* Elegant corner patterns */}
            <div className="absolute top-2 left-2 w-14 h-14 border-t-4 border-l-4 border-amber-500/60 pointer-events-none"></div>
            <div className="absolute top-2 right-2 w-14 h-14 border-t-4 border-r-4 border-amber-500/60 pointer-events-none"></div>
            <div className="absolute bottom-2 left-2 w-14 h-14 border-b-4 border-l-4 border-amber-500/60 pointer-events-none"></div>
            <div className="absolute bottom-2 right-2 w-14 h-14 border-b-4 border-r-4 border-amber-500/60 pointer-events-none"></div>

            <div className="space-y-6 flex-1 flex flex-col justify-between">
              {/* Header Bappeda Aceh */}
              <div className="flex items-center justify-center border-b border-slate-300 pb-4 text-center gap-4">
                <img 
                  src="/logo-bappeda.png" 
                  alt="Logo Bappeda" 
                  className="w-20 h-20 object-contain"
                />
                <div className="text-center">
                  <h3 className="text-sm font-bold tracking-widest uppercase text-slate-700 font-sans">
                    Pemerintah Provinsi Aceh
                  </h3>
                  <h2 className="text-base font-black tracking-wide uppercase text-slate-900 font-sans">
                    Badan Perencanaan Pembangunan Daerah
                  </h2>
                  <p className="text-[9px] text-slate-500 font-semibold italic font-sans">
                    Jalan Tgk. H. Mohd. Daud Beureueh No. 26, Banda Aceh | Web: bappeda.acehprov.go.id
                  </p>
                </div>
              </div>

              {/* Certificate content core */}
              <div className="text-center my-auto space-y-4">
                <div className="space-y-1">
                  <h1 className="text-3xl font-extrabold tracking-widest uppercase text-emerald-900 font-serif">
                    Sertifikat Kelulusan
                  </h1>
                  <p className="text-xs font-bold font-mono tracking-widest text-amber-600 uppercase">
                    Nomor: BAPPEDA.042/MAGANG/{new Date().getFullYear()}/{certNum}
                  </p>
                </div>

                <div className="space-y-3">
                  <p className="text-sm italic font-serif text-slate-650">Diberikan kepada:</p>
                  <div>
                    <h2 className="text-2xl font-black tracking-wide text-slate-900 underline font-serif">
                      {printIntern.full_name}
                    </h2>
                    <p className="text-xs font-bold text-slate-500 font-sans mt-1">
                      NIM/NISN. {printIntern.nim_nisn || printIntern.internInfo?.nim_nisn || '-'} &bull; {printIntern.institution || printIntern.internInfo?.institution || '-'}
                    </p>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-700 max-w-2xl mx-auto leading-relaxed font-sans px-4">
                  Telah menyelesaikan Program Magang Kerja (KKP) pada <strong>Badan Perencanaan Pembangunan Daerah (BAPPEDA) Provinsi Aceh</strong> terhitung sejak <strong>{formattedDuration}</strong> dengan hasil evaluasi kinerja dinyatakan lulus predikat:
                </p>

                <div className="inline-block bg-emerald-50/50 border border-emerald-200 rounded-xl px-6 py-2 shadow-inner">
                  <span className="text-base font-black tracking-widest text-emerald-800 uppercase font-sans">
                    {predicate}
                  </span>
                </div>
              </div>

              {/* Signatures */}
              <div className="flex justify-between items-end text-xs px-8 pt-4">
                <div className="w-1/3 text-center space-y-14 font-sans">
                  <div>
                    <p className="text-slate-400 font-bold text-[9px] uppercase tracking-wider">Mengetahui,</p>
                    <p className="font-bold text-[10px] text-slate-700 uppercase tracking-wider mt-0.5">Kepala Bappeda Aceh / Admin,</p>
                  </div>
                  <div className="font-bold text-slate-900 space-y-0.5">
                    <p className="underline font-black">Dr. H. Ahmad Fauzi, M.Sc</p>
                    <p className="text-[8px] text-slate-450 font-extrabold tracking-widest uppercase font-mono">NIP. 19740315 199903 1 002</p>
                  </div>
                </div>

                {/* Gold Seal Decorative Stamp */}
                <div className="w-1/4 flex justify-center items-center pointer-events-none opacity-90 pb-2">
                  <div className="w-16 h-16 rounded-full border-4 border-double border-amber-500 flex items-center justify-center relative rotate-12 shadow-sm">
                    <div className="absolute inset-1 rounded-full border border-dashed border-amber-500"></div>
                    <span className="text-[7px] font-black uppercase text-amber-600 font-mono tracking-widest text-center">BAPPEDA<br/>ACEH<br/>SEAL</span>
                  </div>
                </div>

                <div className="w-1/3 text-center space-y-14 font-sans">
                  <div>
                    <p className="font-semibold text-slate-650 font-sans">Banda Aceh, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    <p className="text-slate-400 font-bold text-[9px] uppercase tracking-wider mt-0.5">Mentor Pembimbing Lapangan,</p>
                  </div>
                  <div className="font-bold text-slate-900 space-y-0.5">
                    <p className="underline font-black">{mentorName}</p>
                    <p className="text-[8px] text-slate-450 font-extrabold tracking-widest uppercase font-mono">NIP. {mentorNip}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="max-w-3xl mx-auto my-8 print:my-0 print:mx-0">
        
        {/* Print Control Bar */}
        <div className="flex justify-between items-center bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-sm mb-6 print:hidden">
          <div className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-2 font-sans">
            <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Hasil Evaluasi Kinerja Magang ({printIntern.full_name})</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setPrintIntern(null);
                setPrintGrade(null);
                loadData();
              }}
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

        {/* Certificate / Grading sheet content card */}
        <div className="bg-white p-8 sm:p-12 border border-slate-300 font-serif text-slate-900 leading-relaxed shadow-lg relative print:border-none print:shadow-none print:p-8">
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
            {/* Spacer to balance the layout for center alignment */}
            <div className="w-18 h-18 shrink-0 hidden sm:block"></div>
          </div>

          {/* Title */}
          <div className="text-center space-y-1">
            <h1 className="text-xl sm:text-2xl font-black tracking-wide uppercase underline text-slate-950 font-sans">
              Lembar Penilaian Hasil Magang
            </h1>
            <p className="text-[10px] sm:text-xs text-slate-500 font-bold tracking-widest uppercase font-sans">
              Nomor: BAP-MAG/2026/0{certNum}
            </p>
          </div>

          {/* Intern Info */}
          <div className="space-y-3 text-sm">
            <p className="font-semibold text-slate-800 leading-relaxed">
              Menyatakan bahwa mahasiswa/siswa yang tertera di bawah ini telah menyelesaikan program magang kerja:
            </p>
            
            <div className="grid grid-cols-3 gap-2 pl-4 pt-1 font-bold text-slate-700">
              <div className="text-slate-400 font-sans font-semibold">Nama Lengkap</div>
              <div className="col-span-2 text-slate-900">: {printIntern.full_name}</div>

              <div className="text-slate-400 font-sans font-semibold">NIM / NISN</div>
              <div className="col-span-2 text-slate-900">: {printIntern.nim_nisn || printIntern.internInfo?.nim_nisn}</div>

              <div className="text-slate-400 font-sans font-semibold">Universitas / Sekolah</div>
              <div className="col-span-2 text-slate-900">: {printIntern.institution || printIntern.internInfo?.institution}</div>

              <div className="text-slate-400 font-sans font-semibold">Program Studi / Jurusan</div>
              <div className="col-span-2 text-slate-900">: {printIntern.major || printIntern.internInfo?.major}</div>

              <div className="text-slate-400 font-sans font-semibold">Periode Magang</div>
              <div className="col-span-2 text-slate-900">: {formattedDuration}</div>
            </div>
          </div>

          {/* Grades Table */}
          <div className="border border-slate-500 overflow-hidden rounded-xl">
            <table className="min-w-full divide-y divide-slate-500 text-sm text-left">
              <thead className="bg-slate-55 font-bold uppercase text-[10px] border-b border-slate-500 text-slate-700 font-sans">
                <tr>
                  <th className="px-4 py-3 text-center w-12">No.</th>
                  <th className="px-4 py-3">Komponen Penilaian</th>
                  <th className="px-4 py-3 text-center w-28">Nilai Angka</th>
                  <th className="px-4 py-3 text-center w-32">Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-400 font-semibold text-slate-800">
                <tr>
                  <td className="px-4 py-2.5 text-center">1.</td>
                  <td className="px-4 py-2.5">Kedisiplinan & Ketepatan Waktu</td>
                  <td className="px-4 py-2.5 text-center font-bold text-slate-900">{printGrade.discipline}</td>
                  <td className="px-4 py-2.5 text-center text-xs text-slate-500 font-sans">{getLetterGrade(printGrade.discipline).label}</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 text-center">2.</td>
                  <td className="px-4 py-2.5">Tanggung Jawab & Penyelesaian Tugas</td>
                  <td className="px-4 py-2.5 text-center font-bold text-slate-900">{printGrade.responsibility}</td>
                  <td className="px-4 py-2.5 text-center text-xs text-slate-500 font-sans">{getLetterGrade(printGrade.responsibility).label}</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 text-center">3.</td>
                  <td className="px-4 py-2.5">Keahlian Teknis & Pemahaman Bidang Kerja</td>
                  <td className="px-4 py-2.5 text-center font-bold text-slate-900">{printGrade.technical_skills}</td>
                  <td className="px-4 py-2.5 text-center text-xs text-slate-500 font-sans">{getLetterGrade(printGrade.technical_skills).label}</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 text-center">4.</td>
                  <td className="px-4 py-2.5">Etika, Sopan Santun & Kerja Sama Tim</td>
                  <td className="px-4 py-2.5 text-center font-bold text-slate-900">{printGrade.attitude}</td>
                  <td className="px-4 py-2.5 text-center text-xs text-slate-500 font-sans">{getLetterGrade(printGrade.attitude).label}</td>
                </tr>
                <tr className="bg-slate-50 font-bold border-t border-slate-500 text-slate-950 font-sans">
                  <td colSpan={2} className="px-4 py-3 text-right">Nilai Rata-rata Akhir:</td>
                  <td className="px-4 py-3 text-center text-base font-black">{finalScore}</td>
                  <td className="px-4 py-3 text-center text-xs uppercase font-black tracking-wider text-emerald-800">{letter} ({label})</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Signature Area */}
          <div className="pt-8 flex justify-between gap-6 text-sm">
            <div className="w-1/3"></div>
            <div className="w-1/2 text-center space-y-14">
              <div>
                <p className="font-semibold">Banda Aceh, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                <p className="text-slate-450 font-bold text-xs uppercase tracking-wider mt-0.5 font-sans">Mentor Pembimbing Lapangan,</p>
              </div>
              
              <div className="font-bold text-slate-900 space-y-1 font-sans">
                <p className="underline font-black">Budi Setiawan, M.Si</p>
                <p className="text-[10px] text-slate-400 font-extrabold tracking-widest uppercase text-center border-t border-slate-200 mt-2.5 pt-1.5 font-mono">
                  NIP. 19820512 201001 1 003
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      </div>
    );
  }

  // STANDARD SCREEN PAGE (When not printing)
  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          {user.role === 'intern' ? 'Nilai Hasil Magang Saya' : 'Penilaian Akhir Kinerja Magang'}
        </h2>
        <p className="text-slate-500 mt-1 text-sm font-semibold">
          {user.role === 'intern' 
            ? 'Lihat lembar penilaian akhir dan cetak sertifikat nilai resmi Anda.'
            : 'Berikan evaluasi nilai kinerja anak magang di bawah bimbingan Anda secara transparan.'}
        </p>
      </div>

      {/* =========================================
          INTERN INTERFACE: SHOW RESULTS AND FINAL REPORT UPLOAD
         ========================================= */}
      {user.role === 'intern' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
            {!printGrade ? (
              <div className="text-center py-16 text-slate-400 font-bold border border-dashed border-slate-200 rounded-xl bg-slate-50/50 space-y-4 m-4">
                <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto text-3xl shadow-inner">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p>Nilai akhir Anda belum diinput oleh mentor pembimbing.</p>
                <p className="text-xs text-slate-400 max-w-xs mx-auto font-semibold leading-relaxed">Silakan koordinasikan dengan mentor Anda jika periode magang telah selesai.</p>
              </div>
            ) : (
              <div className="max-w-md mx-auto p-6 sm:p-8 bg-slate-50 border border-slate-200 rounded-3xl text-center space-y-5">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-lg">Evaluasi Kinerja Selesai</h3>
                  <p className="text-xs text-slate-400 mt-1 font-semibold">Mentor pembimbing lapangan Anda telah melayangkan penilaian.</p>
                </div>
                <div className="py-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
                  <span className="text-[10px] text-slate-450 font-bold uppercase tracking-wider block">Nilai Rata-rata</span>
                  <span className="text-4xl font-black text-emerald-700 block mt-1">{printGrade.final_grade}</span>
                  <span className="text-xs font-black text-emerald-600/80 mt-1 block">
                    Grade: {getLetterGrade(printGrade.final_grade).letter} ({getLetterGrade(printGrade.final_grade).label})
                  </span>
                </div>
                
                <div className="flex flex-col gap-2.5">
                  <button
                    onClick={() => handleTriggerPrint(user, 'grades')}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all cursor-pointer active:scale-98 flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>Cetak Lembar Nilai</span>
                  </button>

                  <button
                    onClick={() => handleTriggerPrint(user, 'certificate')}
                    className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all cursor-pointer active:scale-98 flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                    </svg>
                    <span>Cetak Sertifikat Kelulusan</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <span className="p-1.5 bg-emerald-50 rounded-lg text-emerald-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </span>
              <h3 className="text-lg font-bold text-slate-900">Dokumen Laporan Akhir Magang</h3>
            </div>

            {internDetail && (
              <div className="space-y-4">
                {internDetail.report_status === 'none' && (
                  <div className="bg-slate-50 border border-slate-200 text-slate-600 p-4 rounded-xl text-xs font-semibold leading-relaxed">
                    Anda belum mengunggah laporan akhir magang. Sebelum magang dinyatakan selesai, Anda wajib mengunggah file laporan akhir (format PDF).
                  </div>
                )}
                {internDetail.report_status === 'pending' && (
                  <div className="bg-amber-50 border border-amber-250 text-amber-850 p-4 rounded-xl text-xs font-semibold leading-relaxed flex items-center gap-2.5">
                    <span className="text-sm">⏳</span>
                    <span>Laporan akhir Anda sedang ditinjau oleh mentor pembimbing lapangan. Silakan tunggu persetujuan.</span>
                  </div>
                )}
                {internDetail.report_status === 'approved' && (
                  <div className="bg-emerald-50 border border-emerald-250 text-emerald-850 p-4 rounded-xl text-xs font-semibold leading-relaxed flex items-center gap-2.5">
                    <span className="text-sm">✅</span>
                    <span>Laporan akhir Anda telah disetujui! Anda telah menyelesaikan seluruh administrasi magang.</span>
                  </div>
                )}
                {internDetail.report_status === 'rejected' && (
                  <div className="bg-rose-50 border border-rose-205 text-rose-850 p-4 rounded-xl text-xs font-semibold leading-relaxed space-y-2">
                    <div className="flex items-center gap-2.5">
                      <span className="text-sm">❌</span>
                      <span className="font-extrabold text-rose-900">Laporan Akhir Ditolak</span>
                    </div>
                    {internDetail.report_feedback && (
                      <p className="text-xs text-rose-700 bg-white/50 p-2.5 rounded-lg border border-rose-100">
                        <strong>Catatan Koreksi Mentor:</strong> {internDetail.report_feedback}
                      </p>
                    )}
                    <p className="text-[11px] text-rose-600 font-semibold">Silakan lakukan revisi laporan dan unggah kembali berkas laporan baru di bawah ini.</p>
                  </div>
                )}

                {internDetail.report_url && (
                  <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                    <div className="flex items-center gap-2.5 text-xs text-slate-750 font-bold min-w-0">
                      <svg className="w-5 h-5 text-rose-650 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      <span className="truncate max-w-[150px] sm:max-w-xs">{internDetail.report_url.split('/').pop()}</span>
                    </div>
                    <a
                      href={internDetail.report_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-black shadow-inner cursor-pointer shrink-0"
                    >
                      Buka Dokumen
                    </a>
                  </div>
                )}

                {(internDetail.report_status === 'none' || internDetail.report_status === 'rejected') && (
                  <div className="space-y-2.5">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Unggah File Laporan Akhir (PDF)</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={handleUploadReport}
                        disabled={uploading}
                        className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-extrabold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer disabled:opacity-50"
                      />
                      {uploading && (
                        <span className="text-xs text-emerald-600 font-bold shrink-0 animate-pulse flex items-center gap-1">
                          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Mengunggah...
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================
          MENTOR & ADMIN INTERFACE: LIST OF INTERNS
         ========================================= */}
      {(user.role === 'admin' || user.role === 'mentor') && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          {interns.length === 0 ? (
            <div className="py-20 text-center text-slate-400 font-bold bg-slate-50/50 border border-dashed border-slate-200 m-4 rounded-xl">
              Belum ada data anak magang aktif yang terdaftar di bawah bimbingan Anda.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm text-left">
                <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4">Nama Lengkap</th>
                    <th className="px-6 py-4">Asal Instansi</th>
                    <th className="px-6 py-4">Jurusan</th>
                    <th className="px-6 py-4 text-center">Disiplin</th>
                    <th className="px-6 py-4 text-center">Tanggung Jawab</th>
                    <th className="px-6 py-4 text-center">Keahlian</th>
                    <th className="px-6 py-4 text-center">Sikap</th>
                    <th className="px-6 py-4 text-center">Rata-rata</th>
                    <th className="px-6 py-4 text-center">Laporan Akhir</th>
                    <th className="px-6 py-4 text-center">Pilihan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                  {interns.map((intern) => {
                    const grade = grades.find((g) => g.intern_id === intern.id);
                    return (
                      <tr key={intern.id} className="hover:bg-slate-50/40 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-900">{intern.full_name}</td>
                        <td className="px-6 py-4 text-slate-500 font-semibold">{intern.institution}</td>
                        <td className="px-6 py-4">{intern.major}</td>
                        <td className="px-6 py-4 text-center font-bold text-slate-800">{grade ? grade.discipline : '-'}</td>
                        <td className="px-6 py-4 text-center font-bold text-slate-800">{grade ? grade.responsibility : '-'}</td>
                        <td className="px-6 py-4 text-center font-bold text-slate-800">{grade ? grade.technical_skills : '-'}</td>
                        <td className="px-6 py-4 text-center font-bold text-slate-800">{grade ? grade.attitude : '-'}</td>
                        <td className="px-6 py-4 text-center whitespace-nowrap">
                          {grade ? (
                            <span className="text-xs font-black text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                              {grade.final_grade} ({getLetterGrade(grade.final_grade).letter})
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400 italic font-bold">Belum Dinilai</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center whitespace-nowrap">
                          {intern.report_status === 'none' && (
                            <span className="text-xs text-slate-400 font-bold">-</span>
                          )}
                          {intern.report_status === 'pending' && (
                            <button
                              onClick={() => handleOpenReviewModal(intern)}
                              className="inline-flex px-2.5 py-1 text-xs font-black rounded-lg border bg-amber-50 text-amber-805 border-amber-200 hover:bg-amber-100 transition-colors shadow-sm cursor-pointer"
                            >
                              Review PDF 📂
                            </button>
                          )}
                          {intern.report_status === 'approved' && (
                            <button
                              onClick={() => handleOpenReviewModal(intern)}
                              className="inline-flex px-2.5 py-1 text-xs font-bold rounded-lg border bg-emerald-50 text-emerald-805 border-emerald-200 hover:bg-emerald-100 transition-colors cursor-pointer"
                            >
                              Disetujui ✅
                            </button>
                          )}
                          {intern.report_status === 'rejected' && (
                            <button
                              onClick={() => handleOpenReviewModal(intern)}
                              className="inline-flex px-2.5 py-1 text-xs font-bold rounded-lg border bg-rose-50 text-rose-805 border-rose-200 hover:bg-rose-100 transition-colors cursor-pointer"
                            >
                              Ditolak ❌
                            </button>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center whitespace-nowrap">
                          <div className="flex justify-center gap-2">
                            {user.role === 'mentor' && (
                              <button
                                onClick={() => handleOpenGradeModal(intern)}
                                className="px-3.5 py-1.5 bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200 hover:text-slate-950 rounded-lg text-xs font-bold cursor-pointer transition-all"
                              >
                                {grade ? 'Ubah' : 'Nilai'}
                              </button>
                            )}
                            {grade && (
                              <div className="flex gap-1">
                                <button
                                  onClick={() => handleTriggerPrint(intern, 'grades')}
                                  className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-md cursor-pointer transition-all active:scale-95 whitespace-nowrap"
                                  title="Cetak Nilai Evaluasi Kinerja"
                                >
                                  Cetak Nilai
                                </button>
                                <button
                                  onClick={() => handleTriggerPrint(intern, 'certificate')}
                                  className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold shadow-md cursor-pointer transition-all active:scale-95 whitespace-nowrap"
                                  title="Cetak Sertifikat Kelulusan Resmi"
                                >
                                  Sertifikat
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Grade Modal (Mentor only) */}
      {showGradeModal && selectedIntern && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto backdrop-blur-sm">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 max-w-md w-full shadow-2xl relative my-8 animate-scale-up">
            <button
              onClick={() => {
                setShowGradeModal(false);
                setSelectedIntern(null);
              }}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-655 font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 transition-all cursor-pointer"
            >
              ✕
            </button>
            <h4 className="text-xl font-black text-slate-900 mb-1">Evaluasi Nilai Kinerja</h4>
            <p className="text-xs text-slate-400 mb-4 font-semibold">
              Nama Intern: <strong className="text-slate-800">{selectedIntern.full_name}</strong> ({selectedIntern.institution})
            </p>

            <form onSubmit={handleGradeSubmit} className="space-y-4">
              <div className="p-3.5 bg-amber-50 border border-amber-200 text-amber-800 text-[11px] leading-relaxed rounded-xl font-semibold flex items-start gap-1.5">
                <svg className="w-4.5 h-4.5 text-amber-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>Nilai berupa angka dengan range **0 sampai 100**. Rata-rata akhir akan dikalkulasikan secara otomatis.</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Kedisiplinan</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    required
                    value={discipline}
                    onChange={(e) => setDiscipline(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="0-100"
                    className="w-full border border-slate-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring focus:ring-emerald-500/20 text-slate-800 bg-slate-50 focus:bg-white font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Tanggung Jawab</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    required
                    value={responsibility}
                    onChange={(e) => setResponsibility(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="0-100"
                    className="w-full border border-slate-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring focus:ring-emerald-500/20 text-slate-800 bg-slate-50 focus:bg-white font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Keahlian Teknis</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    required
                    value={technicalSkills}
                    onChange={(e) => setTechnicalSkills(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="0-100"
                    className="w-full border border-slate-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring focus:ring-emerald-500/20 text-slate-800 bg-slate-50 focus:bg-white font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Sikap & Etika</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    required
                    value={attitude}
                    onChange={(e) => setAttitude(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="0-100"
                    className="w-full border border-slate-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring focus:ring-emerald-500/20 text-slate-800 bg-slate-50 focus:bg-white font-semibold"
                  />
                </div>
              </div>

              {/* Live Preview Average */}
              {discipline !== '' && responsibility !== '' && technicalSkills !== '' && attitude !== '' && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-100 rounded-2xl text-center">
                  <span className="text-[10px] text-emerald-600 font-extrabold uppercase tracking-wider block">Estimasi Rata-rata Akhir</span>
                  <span className="text-2xl font-black text-emerald-800 block mt-0.5">
                    {((Number(discipline) + Number(responsibility) + Number(technicalSkills) + Number(attitude)) / 4).toFixed(2)}
                  </span>
                </div>
              )}

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 mt-5">
                <button
                  type="button"
                  onClick={() => {
                    setShowGradeModal(false);
                    setSelectedIntern(null);
                  }}
                  className="px-4 py-2.5 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
                >
                  Simpan Nilai
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Review Modal (Mentor & Admin) */}
      {showReviewModal && reviewIntern && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto backdrop-blur-sm">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 max-w-md w-full shadow-2xl relative my-8 animate-scale-up">
            <button
              onClick={() => {
                setShowReviewModal(false);
                setReviewIntern(null);
                setReviewFeedback('');
              }}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-650 font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 transition-all cursor-pointer"
            >
              ✕
            </button>
            <h4 className="text-xl font-black text-slate-900 mb-1">Review Laporan Akhir</h4>
            <p className="text-xs text-slate-400 mb-4 font-semibold">
              Nama Intern: <strong className="text-slate-800">{reviewIntern.full_name}</strong> ({reviewIntern.institution})
            </p>

            <div className="space-y-5">
              {reviewIntern.report_url ? (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col gap-2 shadow-sm text-center">
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">File Laporan Akhir (PDF)</span>
                  <a
                    href={reviewIntern.report_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex justify-center items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black shadow-md cursor-pointer transition-all active:scale-95"
                  >
                    <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>Buka File Laporan (PDF)</span>
                  </a>
                </div>
              ) : (
                <div className="p-4 bg-slate-100 text-center text-slate-400 text-xs font-bold rounded-xl">
                  File laporan belum diunggah.
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Catatan Koreksi / Catatan Feedback</label>
                <textarea
                  value={reviewFeedback}
                  onChange={(e) => setReviewFeedback(e.target.value)}
                  placeholder="Tulis umpan balik koreksi untuk revisi, atau catatan persetujuan jika laporan sudah baik."
                  className="block w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring focus:ring-emerald-500/20 h-28 text-slate-800 bg-slate-50 focus:bg-white transition-all resize-none font-semibold animate-none"
                ></textarea>
              </div>

              <div className="flex gap-2.5 justify-end pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => handleReviewReportSubmit('rejected')}
                  disabled={reviewSubmitting}
                  className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-800 rounded-xl text-xs font-extrabold cursor-pointer transition-all disabled:opacity-50 active:scale-95 flex items-center gap-1"
                >
                  Tolak & Revisi
                </button>
                <button
                  type="button"
                  onClick={() => handleReviewReportSubmit('approved')}
                  disabled={reviewSubmitting}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold shadow-md cursor-pointer transition-all disabled:opacity-50 active:scale-95 flex items-center gap-1"
                >
                  Setujui Laporan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
