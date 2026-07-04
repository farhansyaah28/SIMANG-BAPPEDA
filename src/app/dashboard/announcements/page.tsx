'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from '@/lib/SessionContext';
import { dataService } from '@/lib/dataService';

export default function AnnouncementsPage() {
  const { user } = useSession();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const list = await dataService.announcements.getAll();
      setAnnouncements(list);
    } catch (err) {
      console.error('Gagal memuat pengumuman:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    try {
      setSubmitting(true);
      await dataService.announcements.create({
        title,
        content,
        created_by: user.id
      });
      setTitle('');
      setContent('');
      await loadData();
      alert('Pengumuman berhasil dipublikasikan!');
    } catch (err) {
      alert('Gagal membuat pengumuman.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="py-10 text-center text-slate-500 font-semibold">Memuat data pengumuman...</div>;
  }

  // Safety check, although sidebar navigations already handles role visibility
  if (user.role !== 'admin') {
    return (
      <div className="bg-red-50 text-red-800 p-6 rounded-2xl border border-red-200 font-medium">
        ⚠️ Akses ditolak. Hanya administrator yang dapat mengelola pengumuman.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Kelola Pengumuman Instansi</h2>
        <p className="text-slate-500 mt-1 text-sm font-medium">
          Tulis dan publikasikan informasi penting terkait koordinasi magang Bappeda Aceh.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Write Announcement Form */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <span>📝</span> Buat Pengumuman Baru
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Judul Pengumuman
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Rapat Evaluasi Bulanan Magang"
                className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring focus:ring-emerald-500/20 text-slate-800 bg-slate-50 focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Isi / Deskripsi Pengumuman
              </label>
              <textarea
                required
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Tuliskan detail pengumuman secara rinci di sini..."
                className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring focus:ring-emerald-500/20 h-44 text-slate-800 resize-none bg-slate-50 focus:bg-white transition-all"
              ></textarea>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-600/10 cursor-pointer transition-all active:scale-98 disabled:opacity-50"
            >
              {submitting ? 'Mengirim...' : 'Publikasikan Pengumuman'}
            </button>
          </form>
        </div>

        {/* Existing Announcements List */}
        <div className="lg:col-span-2 space-y-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <span>📢</span> Riwayat Pengumuman
          </h3>

          {announcements.length === 0 ? (
            <p className="text-sm text-slate-450 font-semibold text-center py-12">Belum ada pengumuman yang dipublikasikan.</p>
          ) : (
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
              {announcements.map((ann) => (
                <div key={ann.id} className="p-4 bg-slate-50 border border-slate-150 rounded-xl space-y-2 hover:border-slate-300 transition-all">
                  <div className="flex justify-between items-center">
                    <h4 className="font-extrabold text-slate-900 text-base">{ann.title}</h4>
                    <span className="text-[10px] text-slate-400 font-bold">
                      {new Date(ann.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-slate-650 leading-relaxed whitespace-pre-line">{ann.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
