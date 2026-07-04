/* eslint-disable @next/next/no-img-element */
import React from 'react';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#f7f9ff] text-[#001d32] flex flex-col font-sans">
      
      {/* TopNavBar */}
      <nav className="fixed top-0 w-full z-50 flex justify-between items-center px-6 sm:px-12 h-20 max-w-[1440px] left-1/2 -translate-x-1/2 bg-[#f7f9ff]/90 backdrop-blur-md border-b border-slate-200/60 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-11 h-11 overflow-hidden relative rounded-full bg-white flex items-center justify-center border border-slate-200/60 shadow-sm">
            <img 
              src="/logo-bappeda.png" 
              alt="Logo Bappeda" 
              className="w-20 h-20 max-w-none absolute object-contain"
              style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
            />
          </div>
          <div>
            <h1 className="font-black text-[#00152a] leading-tight text-sm sm:text-base">Bappeda Aceh</h1>
            <p className="text-[9px] text-slate-500 font-black tracking-widest uppercase mt-0.5">Sistem Manajemen Magang</p>
          </div>
        </div>
        
        <div className="hidden md:flex items-center gap-8">
          <a href="#" className="text-sm font-semibold text-[#00152a] border-b-2 border-[#00152a] pb-1 transition-all">Beranda</a>
          <a href="#features" className="text-sm font-semibold text-slate-500 hover:text-[#00152a] transition-all">Fitur</a>
          <a href="#about" className="text-sm font-semibold text-slate-500 hover:text-[#00152a] transition-all">Tentang</a>
        </div>
        
        <div className="flex items-center gap-3">
          <Link href="/register" className="text-sm font-bold border border-[#2a6a4b] text-[#2a6a4b] px-4 py-2 rounded-xl hover:bg-[#2a6a4b]/5 transition-all active:scale-95">
            Daftar Magang
          </Link>
          <Link href="/login" className="text-sm font-bold bg-[#2a6a4b] text-white px-5 py-2.5 rounded-xl hover:bg-opacity-95 transition-all shadow-md active:scale-95">
            Masuk
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative pt-32 pb-20 overflow-hidden bg-[radial-gradient(circle_at_2px_2px,#e2e8f0_1px,transparent_0)] bg-[size:32px_32px]">
        <div className="max-w-[1440px] mx-auto px-6 sm:px-12 flex flex-col lg:flex-row items-center gap-12 relative z-10">
          <div className="w-full lg:w-3/5 space-y-6">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-[#aff1ca] text-[#0a5135] text-xs font-semibold uppercase tracking-wider">
              🟢 Platform Resmi Magang
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#00152a] leading-tight">
              Transformasi Digital <br/>
              <span className="text-[#2a6a4b]">Manajemen Magang</span> <br/>
              Bappeda Aceh
            </h1>
            <p className="text-slate-600 text-sm sm:text-base max-w-xl leading-relaxed font-medium">
              Platform terpusat untuk mempermudah pendaftaran, pengelolaan, dan evaluasi mahasiswa magang di Badan Perencanaan Pembangunan Daerah Provinsi Aceh.
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <Link href="/register" className="bg-[#2a6a4b] text-white px-8 py-4 rounded-xl font-bold text-sm sm:text-base flex items-center gap-2 shadow-lg shadow-emerald-900/15 hover:shadow-xl hover:bg-opacity-95 transition-all active:scale-95">
                <span>Daftar Magang Mandiri</span>
                <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
              <Link href="/login" className="bg-white text-[#2a6a4b] px-8 py-4 rounded-xl font-bold text-sm sm:text-base border border-slate-200 hover:bg-slate-50 transition-all active:scale-95 shadow-sm">
                Masuk Ke Sistem
              </Link>
            </div>
          </div>
          
          <div className="w-full lg:w-2/5 flex justify-center">
            <div className="relative group">
              <div className="absolute -inset-4 bg-[#2a6a4b]/10 rounded-[2rem] blur-2xl group-hover:bg-[#2a6a4b]/20 transition-all"></div>
              <img
                alt="Workspace Bappeda Aceh"
                className="relative rounded-[2rem] shadow-2xl w-full max-w-md aspect-[4/5] object-cover border-8 border-white"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuD-YrL0lAxKIcByraBgPILfbuuaQ4CtjzNogQhzwN3hF-Hv7Wxr1gaJbAe9sfPEWys0PRdG_S45lsmtBpJIWniCmsJfnUqwbX_NzXKqkHpQelEt_MI0EIFX4-TAxH2dl0S9QWyabuRf3VCIiKZox_ltk-iD5m23JOA7XPlYjhfzjPRVz7wPblMX2eR202tK2J_ltW0fFnbzh93CHR0Ub8Gms2aJ4j_V9_D9M9_NY6OpSyzl4iTVTENr1tNCDfPqQdE78WRo-Uu5_9ak"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Key Features Section */}
      <section id="features" className="py-20 bg-slate-50 border-y border-slate-200/60">
        <div className="max-w-[1440px] mx-auto px-6 sm:px-12">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-black text-[#00152a] tracking-tight">Fitur Utama Platform</h2>
            <p className="text-slate-500 mt-2 text-sm sm:text-base font-semibold">
              Efisiensi operasional dan transparansi penilaian melalui sistem manajemen terintegrasi.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="bg-white p-8 rounded-2xl border border-slate-200/80 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
              <div className="w-16 h-16 bg-[#aff1ca]/30 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8 text-[#2a6a4b]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
              <h3 className="text-lg font-black text-[#00152a] mb-2.5">Pendaftaran Online</h3>
              <p className="text-slate-500 text-xs sm:text-sm font-semibold leading-relaxed">
                Proses pengajuan magang yang simpel dan cepat. Pendaftaran dilakukan secara terpusat oleh Admin Bappeda guna menjamin integrasi dokumen.
              </p>
            </div>
            
            {/* Card 2 */}
            <div className="bg-white p-8 rounded-2xl border border-slate-200/80 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
              <div className="w-16 h-16 bg-[#aff1ca]/30 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8 text-[#2a6a4b]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-black text-[#00152a] mb-2.5">Absensi Digital</h3>
              <p className="text-slate-500 text-xs sm:text-sm font-semibold leading-relaxed">
                Pencatatan kehadiran harian secara presisi lengkap dengan status ketidakhadiran (Sakit / Izin) beserta lampiran dokumen pendukung.
              </p>
            </div>
            
            {/* Card 3 */}
            <div className="bg-white p-8 rounded-2xl border border-slate-200/80 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
              <div className="w-16 h-16 bg-[#aff1ca]/30 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8 text-[#2a6a4b]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <h3 className="text-lg font-black text-[#00152a] mb-2.5">Penilaian & Lembar PDF</h3>
              <p className="text-slate-500 text-xs sm:text-sm font-semibold leading-relaxed">
                Kriteria evaluasi kinerja objektif oleh mentor pembimbing lapangan dan lembar sertifikat nilai resmi A4 yang dapat langsung dicetak.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* About the Program */}
      <section id="about" className="py-20 overflow-hidden bg-white">
        <div className="max-w-[1440px] mx-auto px-6 sm:px-12 flex flex-col md:flex-row items-center gap-12">
          <div className="w-full md:w-1/2 relative flex justify-center">
            <div className="relative">
              <img
                alt="Kolaborasi Bappeda Aceh"
                className="rounded-3xl shadow-xl aspect-square object-cover max-w-md w-full border border-slate-100"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuD_phvKAgS2rUbpUmtTnLF4LReNRD_zHwNxXw77cavhEsI44xA4xU2VYi79VbQAPUxQexozNzpSZsRt4kNavz5Z1J5kwokkrr82_jN4UwL7GYsVsV-vfaqRnCo7zM9DsXk0zALTstdhMHx1oh8fQ-Tj8IjNSo9EWSypRoZxUAJYhYgaZd3bBlDxprlgq4S2dihN_ieRco0udfO9W0SOdv3SsOIqTyTbAPuR7D6abjXtI7jqB5omwG-kelHXR2THB_Jy8ac04ouOfaaW"
              />
              <div className="absolute -bottom-6 -right-6 bg-[#00152a] p-6 rounded-2xl shadow-xl hidden lg:block border border-slate-800">
                <div className="text-white font-black text-2xl">500+</div>
                <div className="text-slate-400 font-bold text-xs">Alumni Magang</div>
              </div>
            </div>
          </div>
          
          <div className="w-full md:w-1/2 space-y-6">
            <h2 className="text-3xl font-black text-[#00152a]">Tentang Program Magang</h2>
            <div className="w-20 h-1.5 bg-[#2a6a4b] rounded-full"></div>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed font-semibold">
              Program Magang Bappeda Aceh dirancang untuk memberikan pengalaman praktis bagi mahasiswa dalam memahami proses perencanaan pembangunan daerah yang strategis. 
            </p>
            <p className="text-slate-500 text-xs sm:text-sm leading-relaxed font-medium">
              Kami percaya keterlibatan generasi muda dalam ekosistem perencanaan adalah kunci akselerasi inovasi daerah. Melalui bimbingan langsung para mentor profesional, peserta magang akan dilibatkan dalam analisis kebijakan pembangunan daerah dan pengerjaan jurnal dinas harian.
            </p>
            
            <ul className="space-y-3 pt-2">
              <li className="flex items-center gap-3 text-xs sm:text-sm text-slate-700 font-bold">
                <span className="text-[#2a6a4b] text-base">✓</span> Bimbingan langsung dari ASN profesional
              </li>
              <li className="flex items-center gap-3 text-xs sm:text-sm text-slate-700 font-bold">
                <span className="text-[#2a6a4b] text-base">✓</span> Akses pemahaman perencanaan pembangunan daerah
              </li>
              <li className="flex items-center gap-3 text-xs sm:text-sm text-slate-700 font-bold">
                <span className="text-[#2a6a4b] text-base">✓</span> Jejaring kerja sama profesional lintas bidang
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Partner Institutions */}

      {/* CTA Section */}
      <section className="py-20 px-6 sm:px-12 bg-white">
        <div className="max-w-[1200px] mx-auto relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#00152a] to-slate-900 px-8 py-16 text-center shadow-2xl border border-slate-800">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#022c22_1px,transparent_1px),linear-gradient(to_bottom,#022c22_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-15"></div>
          
          <div className="relative z-10 space-y-6">
            <h2 className="text-3xl sm:text-4xl font-black text-white">Siap Bergabung Bersama Kami?</h2>
            <p className="text-slate-400 max-w-2xl mx-auto text-xs sm:text-sm font-semibold leading-relaxed">
              Jangan lewatkan kesempatan untuk berkontribusi bagi pembangunan daerah. Mulai perjalanan karir Anda dari instansi perencanaan terbaik di Aceh.
            </p>
            <div className="pt-2 flex justify-center gap-4 flex-col sm:flex-row">
              <Link href="/login" className="bg-[#2a6a4b] text-white px-8 py-4 rounded-xl font-bold text-sm hover:bg-opacity-95 transition-all shadow-lg active:scale-95">
                Masuk ke SIMANG
              </Link>
              <a href="#about" className="bg-transparent border border-slate-700 text-slate-300 hover:text-white px-8 py-4 rounded-xl font-bold text-sm hover:bg-slate-800/40 transition-all active:scale-95">
                Panduan Pendaftaran
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#00152a] border-t border-slate-900 py-12 text-slate-400">
        <div className="max-w-[1440px] mx-auto px-6 sm:px-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col gap-1 items-center md:items-start">
            <div className="font-extrabold text-white text-lg tracking-wide">Bappeda Aceh</div>
            <div className="text-xs text-slate-500 font-medium">
              &copy; {new Date().getFullYear()} Bappeda Aceh. Hak Cipta Dilindungi. Sistem Manajemen Magang.
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-6 text-xs font-bold text-slate-500">
            <a href="#" className="hover:text-slate-350 transition-colors">Kebijakan Privasi</a>
            <a href="#" className="hover:text-slate-350 transition-colors">Ketentuan Layanan</a>
            <a href="#" className="hover:text-slate-350 transition-colors">Panduan Instansi</a>
            <a href="#" className="hover:text-slate-350 transition-colors">Pusat Bantuan</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
