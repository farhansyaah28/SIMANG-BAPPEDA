import { supabase } from './supabase';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export let isDemoMode = 
  !supabaseUrl || 
  supabaseUrl.includes('your-project-id') || 
  !supabaseAnonKey || 
  supabaseAnonKey.includes('your-anon-key');

export function setDemoMode(val: boolean) {
  isDemoMode = val;
}

// ==========================================
// MOCK DATA INITIALIZATION (LOCAL STORAGE)
// ==========================================

const INITIAL_PROFILES = [
  { id: 'usr-admin', full_name: 'Drs. Mahdi Effendi', role: 'admin', avatar_url: '' },
  { id: 'usr-mentor1', full_name: 'Budi Setiawan, M.Si', role: 'mentor', avatar_url: '' },
  { id: 'usr-mentor2', full_name: 'Cut Mutia, S.E', role: 'mentor', avatar_url: '' },
  { id: 'usr-intern1', full_name: 'Farhan Ramadhan', role: 'intern', avatar_url: '' },
  { id: 'usr-intern2', full_name: 'Siti Sarah', role: 'intern', avatar_url: '' },
];

const INITIAL_MENTORS = [
  { id: 'usr-mentor1', nip: '19820512 201001 1 003', department: 'Bidang Perencanaan Pembangunan' },
  { id: 'usr-mentor2', nip: '19870923 201503 2 001', department: 'Bidang Infrastruktur & Kewilayahan' },
];

const INITIAL_INTERNS = [
  { 
    id: 'usr-intern1', 
    nim_nisn: '2108107010023', 
    institution: 'Universitas Syiah Kuala', 
    major: 'Informatika', 
    start_date: '2026-06-01', 
    end_date: '2026-08-31', 
    mentor_id: 'usr-mentor1', 
    status: 'active',
    report_url: null,
    report_status: 'none',
    report_feedback: null
  },
  { 
    id: 'usr-intern2', 
    nim_nisn: '1802102020042', 
    institution: 'UIN Ar-Raniry', 
    major: 'Sistem Informasi', 
    start_date: '2026-06-01', 
    end_date: '2026-08-31', 
    mentor_id: 'usr-mentor2', 
    status: 'active',
    report_url: 'https://bappeda.acehprov.go.id/reports/siti_sarah_final_report.pdf',
    report_status: 'pending',
    report_feedback: null
  },
];

// Set start dates in past for testing attendance percentages
// USK & UIN interns started 2026-06-01
// Today is 2026-06-12 (which is 10 workdays)
const INITIAL_ATTENDANCE = [
  // USK Intern: Farhan (7 present out of 10 workdays = 70% -> < 80% warning)
  { id: 'att-u1-1', intern_id: 'usr-intern1', date: '2026-06-01', check_in: '2026-06-01T08:00:12+07:00', check_out: '2026-06-01T16:30:00+07:00', status: 'present', notes: '' },
  { id: 'att-u1-2', intern_id: 'usr-intern1', date: '2026-06-02', check_in: '2026-06-02T08:05:12+07:00', check_out: '2026-06-02T16:30:00+07:00', status: 'present', notes: '' },
  { id: 'att-u1-3', intern_id: 'usr-intern1', date: '2026-06-03', check_in: '2026-06-03T08:12:12+07:00', check_out: '2026-06-03T16:30:00+07:00', status: 'present', notes: '' },
  { id: 'att-u1-4', intern_id: 'usr-intern1', date: '2026-06-04', check_in: '2026-06-04T08:00:12+07:00', check_out: '2026-06-04T16:30:00+07:00', status: 'present', notes: '' },
  { id: 'att-u1-5', intern_id: 'usr-intern1', date: '2026-06-05', check_in: '2026-06-05T08:00:12+07:00', check_out: '2026-06-05T16:30:00+07:00', status: 'present', notes: '' },
  // Farhan missed 2026-06-08 (absent)
  { id: 'att-u1-6', intern_id: 'usr-intern1', date: '2026-06-08', check_in: null, check_out: null, status: 'absent', notes: 'Tanpa Keterangan' },
  { id: 'att-u1-7', intern_id: 'usr-intern1', date: '2026-06-09', check_in: '2026-06-09T08:00:12+07:00', check_out: '2026-06-09T16:30:00+07:00', status: 'present', notes: '' },
  // Farhan missed 2026-06-10 (sick)
  { id: 'att-u1-8', intern_id: 'usr-intern1', date: '2026-06-10', check_in: null, check_out: null, status: 'sick', notes: 'Demam tinggi, istirahat dirumah.' },
  // Farhan missed 2026-06-11 (leave)
  { id: 'att-u1-9', intern_id: 'usr-intern1', date: '2026-06-11', check_in: null, check_out: null, status: 'leave', notes: 'Keperluan administrasi kampus Syiah Kuala.' },
  { id: 'att-u1-10', intern_id: 'usr-intern1', date: '2026-06-12', check_in: '2026-06-12T07:55:00+07:00', check_out: null, status: 'present', notes: '' },

  // UIN Intern: Siti Sarah (9 present out of 10 workdays = 90% -> > 80% OK)
  { id: 'att-u2-1', intern_id: 'usr-intern2', date: '2026-06-01', check_in: '2026-06-01T08:15:33+07:00', check_out: '2026-06-01T16:45:10+07:00', status: 'present', notes: '' },
  { id: 'att-u2-2', intern_id: 'usr-intern2', date: '2026-06-02', check_in: '2026-06-02T08:15:33+07:00', check_out: '2026-06-02T16:45:10+07:00', status: 'present', notes: '' },
  { id: 'att-u2-3', intern_id: 'usr-intern2', date: '2026-06-03', check_in: '2026-06-03T08:15:33+07:00', check_out: '2026-06-03T16:45:10+07:00', status: 'present', notes: '' },
  { id: 'att-u2-4', intern_id: 'usr-intern2', date: '2026-06-04', check_in: '2026-06-04T08:15:33+07:00', check_out: '2026-06-04T16:45:10+07:00', status: 'present', notes: '' },
  { id: 'att-u2-5', intern_id: 'usr-intern2', date: '2026-06-05', check_in: '2026-06-05T08:15:33+07:00', check_out: '2026-06-05T16:45:10+07:00', status: 'present', notes: '' },
  { id: 'att-u2-6', intern_id: 'usr-intern2', date: '2026-06-08', check_in: '2026-06-08T08:15:33+07:00', check_out: '2026-06-08T16:45:10+07:00', status: 'present', notes: '' },
  { id: 'att-u2-7', intern_id: 'usr-intern2', date: '2026-06-09', check_in: '2026-06-09T08:15:33+07:00', check_out: '2026-06-09T16:45:10+07:00', status: 'present', notes: '' },
  { id: 'att-u2-8', intern_id: 'usr-intern2', date: '2026-06-10', check_in: '2026-06-10T08:15:33+07:00', check_out: '2026-06-10T16:45:10+07:00', status: 'present', notes: '' },
  { id: 'att-u2-9', intern_id: 'usr-intern2', date: '2026-06-11', check_in: '2026-06-11T08:15:33+07:00', check_out: '2026-06-11T16:45:10+07:00', status: 'present', notes: '' },
  { id: 'att-u2-10', intern_id: 'usr-intern2', date: '2026-06-12', check_in: null, check_out: null, status: 'leave', notes: 'Sidang seminar kampus.' }
];

const INITIAL_ACTIVITIES = [
  { 
    id: 'act-1', 
    intern_id: 'usr-intern1', 
    date: '2026-06-11', 
    task_description: 'Merancang desain dashboard admin untuk aplikasi SIMANG Bappeda.', 
    status: 'approved', 
    feedback: 'Desain sangat rapi dan sesuai standar warna Bappeda. Pertahankan!' 
  },
  { 
    id: 'act-2', 
    intern_id: 'usr-intern2', 
    date: '2026-06-11', 
    task_description: 'Melakukan rekapitulasi data usulan program dari Bidang Infrastruktur.', 
    status: 'approved', 
    feedback: 'Kerja bagus, data sudah di-double check.' 
  },
  { 
    id: 'act-3', 
    intern_id: 'usr-intern1', 
    date: '2026-06-12', 
    task_description: 'Mengintegrasikan database local storage mock API ke frontend Next.js.', 
    status: 'pending', 
    feedback: null 
  },
];

const INITIAL_GRADES = [
  {
    id: 'grd-1',
    intern_id: 'usr-intern2',
    discipline: 90,
    responsibility: 88,
    technical_skills: 85,
    attitude: 92,
    final_grade: 88.75,
    graded_by: 'usr-mentor2'
  }
];

const INITIAL_ANNOUNCEMENTS = [
  {
    id: 'ann-1',
    title: 'Rapat Koordinasi Evaluasi Bulanan Magang',
    content: 'Diberitahukan kepada seluruh mahasiswa magang Bappeda Aceh bahwa rapat evaluasi bulanan akan diadakan pada hari Senin, 15 Juni 2026 pukul 09.00 WIB di Aula Bappeda Utama. Kehadiran bersifat wajib.',
    created_by: 'usr-admin',
    created_at: '2026-06-10T10:00:00+07:00'
  },
  {
    id: 'ann-2',
    title: 'Penggunaan Atribut Pakaian Kantor',
    content: 'Diingatkan kembali agar seluruh peserta magang menggunakan pakaian formal dan rapi serta memakai kartu pengenal (ID Card) selama berada di lingkungan kantor Bappeda Aceh.',
    created_by: 'usr-admin',
    created_at: '2026-06-08T08:30:00+07:00'
  }
];

const INITIAL_AUDIT_LOGS = [
  {
    id: 'log-1',
    user_id: 'usr-admin',
    email: 'admin@bappeda.go.id',
    role: 'admin',
    action: 'LOGIN',
    user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0.0.0 Safari/537.36',
    created_at: '2026-06-12T08:30:00+07:00'
  },
  {
    id: 'log-2',
    user_id: 'usr-intern1',
    email: 'intern1@bappeda.go.id',
    role: 'intern',
    action: 'LOGIN',
    user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0.0.0 Safari/537.36',
    created_at: '2026-06-12T07:54:10+07:00'
  }
];

// Helper to initialize local storage
const initLocalStorage = () => {
  if (typeof window === 'undefined') return;
  if (!localStorage.getItem('simang_profiles')) {
    localStorage.setItem('simang_profiles', JSON.stringify(INITIAL_PROFILES));
    localStorage.setItem('simang_mentors', JSON.stringify(INITIAL_MENTORS));
    localStorage.setItem('simang_interns', JSON.stringify(INITIAL_INTERNS));
    localStorage.setItem('simang_attendance', JSON.stringify(INITIAL_ATTENDANCE));
    localStorage.setItem('simang_activities', JSON.stringify(INITIAL_ACTIVITIES));
    localStorage.setItem('simang_grades', JSON.stringify(INITIAL_GRADES));
    localStorage.setItem('simang_announcements', JSON.stringify(INITIAL_ANNOUNCEMENTS));
    localStorage.setItem('simang_audit_logs', JSON.stringify(INITIAL_AUDIT_LOGS));
  }
};

// Call storage initializer
initLocalStorage();

// Getter helpers for local storage
const getFromStorage = <T>(key: string): T[] => {
  if (typeof window === 'undefined') return [];
  initLocalStorage();
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
};

const setToStorage = <T>(key: string, data: T[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(data));
};

// ==========================================
// DATA SERVICE API
// ==========================================

export const dataService = {
  // 1. AUTHENTICATION SERVICE WITH JWT TOKENS
  auth: {
    async getCurrentUser() {
      if (isDemoMode) {
        if (typeof window === 'undefined') return null;
        
        // 1. Dapatkan token JWT simulasi dari storage
        const token = localStorage.getItem('simang_jwt');
        if (!token) return null;
        
        try {
          // Decode JWT payload (bagian ke-2 token)
          const payloadBase64 = token.split('.')[1];
          const parsed = JSON.parse(atob(payloadBase64));

          const profiles = getFromStorage<any>('simang_profiles');
          const profile = profiles.find((p) => p.id === parsed.id);
          if (!profile) return null;

          let internInfo = null;
          if (profile.role === 'intern') {
            const interns = getFromStorage<any>('simang_interns');
            internInfo = interns.find((i) => i.id === profile.id);
          }

          let mentorInfo = null;
          if (profile.role === 'mentor') {
            const mentors = getFromStorage<any>('simang_mentors');
            mentorInfo = mentors.find((m) => m.id === profile.id);
          }

          return { ...profile, email: parsed.email || `${profile.id}@example.com`, internInfo, mentorInfo };
        } catch (e) {
          console.error('JWT Token rusak atau tidak valid');
          return null;
        }
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (!profile) return null;

        let internInfo = null;
        if (profile.role === 'intern') {
          const { data } = await supabase
            .from('interns')
            .select('*')
            .eq('id', profile.id)
            .single();
          internInfo = data;
        }

        let mentorInfo = null;
        if (profile.role === 'mentor') {
          const { data } = await supabase
            .from('mentors')
            .select('*')
            .eq('id', profile.id)
            .single();
          mentorInfo = data;
        }

        return { ...profile, email: user.email, internInfo, mentorInfo };
      }
    },

    async login(email: string, password?: string) {
      if (isDemoMode) {
        let user = null;
        if (email.startsWith('admin')) {
          user = { id: 'usr-admin', email, full_name: 'Drs. Mahdi Effendi', role: 'admin' };
        } else if (email.startsWith('mentor1')) {
          user = { id: 'usr-mentor1', email, full_name: 'Budi Setiawan, M.Si', role: 'mentor' };
        } else if (email.startsWith('mentor2')) {
          user = { id: 'usr-mentor2', email, full_name: 'Cut Mutia, S.E', role: 'mentor' };
        } else if (email.startsWith('intern1') || email.startsWith('magang1')) {
          user = { id: 'usr-intern1', email, full_name: 'Farhan Ramadhan', role: 'intern' };
        } else if (email.startsWith('intern2') || email.startsWith('magang2')) {
          user = { id: 'usr-intern2', email, full_name: 'Siti Sarah', role: 'intern' };
        } else {
          user = { id: 'usr-intern1', email, full_name: 'Farhan Ramadhan', role: 'intern' };
        }

        // Generate a mock JWT Token (signed simulation base64 format)
        const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
        const payload = btoa(JSON.stringify(user));
        const signature = 'mock_signature_bappeda_aceh';
        const jwtToken = `${header}.${payload}.${signature}`;

        localStorage.setItem('simang_jwt', jwtToken);
        localStorage.setItem('simang_session', JSON.stringify(user)); // Backward compatibility

        // RECORD AUDIT LOG FOR LOGIN
        await dataService.audit.create(user.id, user.email, user.role, 'LOGIN');

        return { data: { user, access_token: jwtToken }, error: null };
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password: password || 'password123',
        });

        if (!error && data?.user) {
          try {
            // Ambil profil untuk audit logs
            const { data: profile } = await supabase
              .from('profiles')
              .select('role')
              .eq('id', data.user.id)
              .single();

            // RECORD AUDIT LOG FOR LOGIN
            await dataService.audit.create(data.user.id, data.user.email || '', profile?.role || 'intern', 'LOGIN');
          } catch (auditErr) {
            console.warn('Gagal mencatat audit log login:', auditErr);
          }
        }

        return { data, error };
      }
    },

    async logout() {
      const currentUser = await dataService.auth.getCurrentUser();
      
      if (isDemoMode) {
        if (currentUser) {
          try {
            await dataService.audit.create(currentUser.id, currentUser.email || `${currentUser.id}@example.com`, currentUser.role, 'LOGOUT');
          } catch (auditError) {
            console.warn('Gagal mencatat audit log logout (Demo):', auditError);
          }
        }
        localStorage.removeItem('simang_jwt');
        localStorage.removeItem('simang_session');
        return { error: null };
      } else {
        if (currentUser) {
          try {
            await dataService.audit.create(currentUser.id, currentUser.email || '', currentUser.role, 'LOGOUT');
          } catch (auditError) {
            console.warn('Gagal mencatat audit log logout:', auditError);
          }
        }
        const { error } = await supabase.auth.signOut();
        return { error };
      }
    }
  },

  // 2. MENTORS SERVICE
  mentors: {
    async getAll() {
      if (isDemoMode) {
        const profiles = getFromStorage<any>('simang_profiles');
        const mentors = getFromStorage<any>('simang_mentors');

        return mentors.map((m) => {
          const profile = profiles.find((p) => p.id === m.id);
          return {
            ...m,
            full_name: profile ? profile.full_name : 'Unknown Mentor',
            avatar_url: profile ? profile.avatar_url : ''
          };
        });
      } else {
        const { data, error } = await supabase
          .from('mentors')
          .select(`
            id,
            nip,
            department,
            profiles (full_name, avatar_url)
          `);
        
        if (error) throw error;
        return data.map((m: any) => ({
          id: m.id,
          nip: m.nip,
          department: m.department,
          full_name: m.profiles?.full_name,
          avatar_url: m.profiles?.avatar_url
        }));
      }
    },

    async create(mentorData: { id: string; nip: string; department: string }) {
      if (isDemoMode) {
        const mentors = getFromStorage<any>('simang_mentors');
        const newMentor = { ...mentorData, created_at: new Date().toISOString() };
        mentors.push(newMentor);
        setToStorage('simang_mentors', mentors);
        return newMentor;
      } else {
        const { data, error } = await supabase
          .from('mentors')
          .insert([mentorData])
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },

    async signUp(mentorData: {
      full_name: string;
      nip: string;
      department: string;
      email: string;
      password?: string;
    }) {
      if (isDemoMode) {
        const newId = 'usr-mentor-' + Math.random().toString(36).substr(2, 9);
        
        const profiles = getFromStorage<any>('simang_profiles') || [];
        profiles.push({
          id: newId,
          full_name: mentorData.full_name,
          role: 'mentor',
          avatar_url: ''
        });
        setToStorage('simang_profiles', profiles);

        const mentors = getFromStorage<any>('simang_mentors') || [];
        const newMentor = {
          id: newId,
          nip: mentorData.nip,
          department: mentorData.department
        };
        mentors.push(newMentor);
        setToStorage('simang_mentors', mentors);

        return newMentor;
      } else {
        // Gunakan client sementara dengan persistSession: false agar tidak menimpa sesi Admin yang sedang aktif
        const tempClient = createClient(supabaseUrl, supabaseAnonKey, {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false
          }
        });

        const { data, error: authError } = await tempClient.auth.signUp({
          email: mentorData.email,
          password: mentorData.password || 'password123',
          options: {
            data: {
              full_name: mentorData.full_name,
              role: 'mentor',
              nip: mentorData.nip,
              department: mentorData.department
            }
          }
        });

        if (authError) throw authError;
        if (!data.user) throw new Error('Registrasi gagal.');

        const userId = data.user.id;

        // Tambahkan record ke public.mentors menggunakan client utama (Admin)
        const { error: mentorError } = await supabase
          .from('mentors')
          .insert([{
            id: userId,
            nip: mentorData.nip,
            department: mentorData.department
          }]);

        if (mentorError) throw mentorError;
        
        try {
          await dataService.audit.create(userId, mentorData.email, 'mentor', 'LOGIN');
        } catch (auditErr) {
          console.warn('Gagal mencatat audit log registrasi:', auditErr);
        }

        return data.user;
      }
    }
  },

  // 3. INTERNS SERVICE WITH REPORT FUNCTIONALITY
  interns: {
    async getAll() {
      if (isDemoMode) {
        const profiles = getFromStorage<any>('simang_profiles');
        const interns = getFromStorage<any>('simang_interns');
        const mentors = getFromStorage<any>('simang_mentors');

        return interns.map((i) => {
          const profile = profiles.find((p) => p.id === i.id);
          const mentor = mentors.find((m) => m.id === i.mentor_id);
          const mentorProfile = mentor ? profiles.find((p) => p.id === mentor.id) : null;

          return {
            ...i,
            full_name: profile ? profile.full_name : 'Unknown Intern',
            avatar_url: profile ? profile.avatar_url : '',
            mentor_name: mentorProfile ? mentorProfile.full_name : 'Belum Ditentukan'
          };
        });
      } else {
        const { data, error } = await supabase
          .from('interns')
          .select(`
            id,
            nim_nisn,
            institution,
            major,
            start_date,
            end_date,
            mentor_id,
            status,
            report_url,
            report_status,
            report_feedback,
            profiles!interns_id_fkey (full_name, avatar_url),
            mentors (id, profiles (full_name))
          `);
        
        if (error) throw error;
        return data.map((i: any) => ({
          id: i.id,
          nim_nisn: i.nim_nisn,
          institution: i.institution,
          major: i.major,
          start_date: i.start_date,
          end_date: i.end_date,
          mentor_id: i.mentor_id,
          status: i.status,
          report_url: i.report_url,
          report_status: i.report_status,
          report_feedback: i.report_feedback,
          full_name: i.profiles?.full_name,
          avatar_url: i.profiles?.avatar_url,
          mentor_name: i.mentors?.profiles?.full_name || 'Belum Ditentukan'
        }));
      }
    },

    async create(internData: { 
      full_name: string; 
      nim_nisn: string; 
      institution: string; 
      major: string; 
      start_date: string; 
      end_date: string; 
      mentor_id: string; 
      email: string;
      role: 'intern';
    }) {
      if (isDemoMode) {
        const newId = 'usr-intern-' + Math.random().toString(36).substr(2, 9);
        
        // 1. Simpan di profiles
        const profiles = getFromStorage<any>('simang_profiles');
        profiles.push({
          id: newId,
          full_name: internData.full_name,
          role: 'intern',
          avatar_url: ''
        });
        setToStorage('simang_profiles', profiles);

        // 2. Simpan di interns
        const interns = getFromStorage<any>('simang_interns');
        const newIntern = {
          id: newId,
          nim_nisn: internData.nim_nisn,
          institution: internData.institution,
          major: internData.major,
          start_date: internData.start_date,
          end_date: internData.end_date,
          mentor_id: internData.mentor_id || null,
          status: 'active',
          report_url: null,
          report_status: 'none',
          report_feedback: null
        };
        interns.push(newIntern);
        setToStorage('simang_interns', interns);

        return newIntern;
      } else {
        const mockAuthId = gen_random_uuid();
        
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([{
            id: mockAuthId,
            full_name: internData.full_name,
            role: 'intern'
          }]);
        if (profileError) throw profileError;

        const { data, error: internError } = await supabase
          .from('interns')
          .insert([{
            id: mockAuthId,
            nim_nisn: internData.nim_nisn,
            institution: internData.institution,
            major: internData.major,
            start_date: internData.start_date,
            end_date: internData.end_date,
            mentor_id: internData.mentor_id || null,
            status: 'active',
            report_status: 'none'
          }])
          .select()
          .single();
        
        if (internError) throw internError;
        return data;
      }
    },

    async signUp(internData: {
      full_name: string;
      nim_nisn: string;
      institution: string;
      major: string;
      start_date: string;
      end_date: string;
      email: string;
      password?: string;
    }) {
      if (isDemoMode) {
        const newId = 'usr-intern-' + Math.random().toString(36).substr(2, 9);
        const profiles = getFromStorage<any>('simang_profiles') || [];
        profiles.push({
          id: newId,
          full_name: internData.full_name,
          role: 'intern',
          avatar_url: ''
        });
        setToStorage('simang_profiles', profiles);

        const interns = getFromStorage<any>('simang_interns') || [];
        const newIntern = {
          id: newId,
          nim_nisn: internData.nim_nisn,
          institution: internData.institution,
          major: internData.major,
          start_date: internData.start_date,
          end_date: internData.end_date,
          mentor_id: null,
          status: 'pending',
          report_url: null,
          report_status: 'none',
          report_feedback: null
        };
        interns.push(newIntern);
        setToStorage('simang_interns', interns);

        return newIntern;
      } else {
        const { data, error: authError } = await supabase.auth.signUp({
          email: internData.email,
          password: internData.password || 'password123',
          options: {
            data: {
              full_name: internData.full_name,
              role: 'intern'
            }
          }
        });

        if (authError) throw authError;
        if (!data.user) throw new Error('Registrasi gagal.');

        const userId = data.user.id;

        const { error: internError } = await supabase
          .from('interns')
          .insert([{
            id: userId,
            nim_nisn: internData.nim_nisn,
            institution: internData.institution,
            major: internData.major,
            start_date: internData.start_date,
            end_date: internData.end_date,
            mentor_id: null,
            status: 'pending',
            report_status: 'none'
          }]);

        if (internError) throw internError;
        
        try {
          await dataService.audit.create(userId, internData.email, 'intern', 'LOGIN');
        } catch (auditErr) {
          console.warn('Gagal mencatat audit log registrasi:', auditErr);
        }

        return data.user;
      }
    },

    async update(id: string, updates: any) {
      if (isDemoMode) {
        const interns = getFromStorage<any>('simang_interns');
        const idx = interns.findIndex((i) => i.id === id);
        if (idx !== -1) {
          interns[idx] = { ...interns[idx], ...updates };
          setToStorage('simang_interns', interns);
        }
        
        if (updates.full_name) {
          const profiles = getFromStorage<any>('simang_profiles');
          const pIdx = profiles.findIndex((p) => p.id === id);
          if (pIdx !== -1) {
            profiles[pIdx].full_name = updates.full_name;
            setToStorage('simang_profiles', profiles);
          }
        }
        return interns[idx];
      } else {
        const { data, error } = await supabase
          .from('interns')
          .update(updates)
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },

    async uploadReport(id: string, reportUrl: string) {
      if (isDemoMode) {
        return this.update(id, {
          report_url: reportUrl,
          report_status: 'pending',
          report_feedback: null
        });
      } else {
        const { data, error } = await supabase
          .from('interns')
          .update({
            report_url: reportUrl,
            report_status: 'pending',
            report_feedback: null
          })
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },

    async reviewReport(id: string, status: 'approved' | 'rejected', feedback: string) {
      if (isDemoMode) {
        return this.update(id, {
          report_status: status,
          report_feedback: feedback || null
        });
      } else {
        const { data, error } = await supabase
          .from('interns')
          .update({
            report_status: status,
            report_feedback: feedback || null
          })
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    }
  },

  // 4. ATTENDANCE SERVICE WITH AUTO ATTENDANCE PERCENTAGE CALCULATOR
  attendance: {
    async getForIntern(internId: string) {
      if (isDemoMode) {
        const attendance = getFromStorage<any>('simang_attendance');
        return attendance.filter((a) => a.intern_id === internId).sort((a, b) => b.date.localeCompare(a.date));
      } else {
        const { data, error } = await supabase
          .from('attendance')
          .select('*')
          .eq('intern_id', internId)
          .order('date', { ascending: false });
        if (error) throw error;
        return data;
      }
    },

    async getAll() {
      if (isDemoMode) {
        const attendance = getFromStorage<any>('simang_attendance');
        const profiles = getFromStorage<any>('simang_profiles');
        const interns = getFromStorage<any>('simang_interns');

        return attendance.map((a) => {
          const intern = interns.find((i) => i.id === a.intern_id);
          const profile = intern ? profiles.find((p) => p.id === intern.id) : null;
          return {
            ...a,
            intern_name: profile ? profile.full_name : 'Unknown',
            institution: intern ? intern.institution : 'Unknown'
          };
        }).sort((a, b) => b.date.localeCompare(a.date));
      } else {
        const { data, error } = await supabase
          .from('attendance')
          .select(`
            *,
            interns (
              institution,
              profiles!interns_id_fkey (full_name)
            )
          `)
          .order('date', { ascending: false });
        
        if (error) throw error;
        return data.map((a: any) => ({
          ...a,
          intern_name: a.interns?.profiles?.full_name,
          institution: a.interns?.institution
        }));
      }
    },

    async getToday(internId: string) {
      const todayStr = new Date().toLocaleDateString('sv').split('T')[0]; // Format: YYYY-MM-DD
      if (isDemoMode) {
        const attendance = getFromStorage<any>('simang_attendance');
        const found = attendance.find((a) => a.intern_id === internId && a.date === todayStr);
        return found || null;
      } else {
        const { data, error } = await supabase
          .from('attendance')
          .select('*')
          .eq('intern_id', internId)
          .eq('date', todayStr)
          .maybeSingle();
        if (error) throw error;
        return data;
      }
    },

    async checkIn(
      internId: string, 
      status: 'present' | 'sick' | 'leave' = 'present', 
      notes: string = '', 
      attachmentUrl: string = '',
      latitude?: number | null,
      longitude?: number | null,
      isInRadius?: boolean | null
    ) {
      const todayStr = new Date().toLocaleDateString('sv').split('T')[0];
      const nowStr = new Date().toISOString();

      if (isDemoMode) {
        const attendance = getFromStorage<any>('simang_attendance');
        const existing = attendance.find((a) => a.intern_id === internId && a.date === todayStr);
        if (existing) return existing;

        const newRecord = {
          id: 'att-' + Math.random().toString(36).substr(2, 9),
          intern_id: internId,
          date: todayStr,
          check_in: nowStr,
          check_out: null,
          status,
          notes,
          attachment_url: attachmentUrl || null,
          latitude: latitude || null,
          longitude: longitude || null,
          is_in_radius: isInRadius !== undefined ? isInRadius : null
        };
        attendance.push(newRecord);
        setToStorage('simang_attendance', attendance);
        return newRecord;
      } else {
        const { data, error } = await supabase
          .from('attendance')
          .insert([{
            intern_id: internId,
            date: todayStr,
            check_in: nowStr,
            status,
            notes: notes || null,
            attachment_url: attachmentUrl || null,
            latitude: latitude || null,
            longitude: longitude || null,
            is_in_radius: isInRadius !== undefined ? isInRadius : null
          }])
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },

    async checkOut(internId: string) {
      const todayStr = new Date().toLocaleDateString('sv').split('T')[0];
      const nowStr = new Date().toISOString();

      if (isDemoMode) {
        const attendance = getFromStorage<any>('simang_attendance');
        const idx = attendance.findIndex((a) => a.intern_id === internId && a.date === todayStr);
        if (idx === -1) throw new Error('Anda belum check-in hari ini');
        attendance[idx].check_out = nowStr;
        setToStorage('simang_attendance', attendance);
        return attendance[idx];
      } else {
        const { data, error } = await supabase
          .from('attendance')
          .update({ check_out: nowStr })
          .eq('intern_id', internId)
          .eq('date', todayStr)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },

    // CALCULATION LOGIC FOR ELAPSED WORKDAYS & ATTENDANCE PERCENTAGE
    async getPercentage(internId: string) {
      try {
        const interns = await dataService.interns.getAll();
        const intern = interns.find((i) => i.id === internId);
        if (!intern) return 100;

        const myAtts = await this.getForIntern(internId);
        const presentDays = myAtts.filter((a) => a.status === 'present' && a.check_in).length;

        // Hitung hari kerja efektif yang telah terlewati (tidak termasuk Sabtu-Minggu)
        const start = new Date(intern.start_date);
        const today = new Date();
        const end = new Date(intern.end_date);

        // Batas akhir perhitungan adalah hari ini, atau tanggal selesai jika magang sudah berakhir
        const limitDate = today < end ? today : end;

        let totalWorkDays = 0;
        const curDate = new Date(start);

        while (curDate <= limitDate) {
          const day = curDate.getDay();
          if (day !== 0 && day !== 6) { // 0 = Minggu, 6 = Sabtu
            totalWorkDays++;
          }
          curDate.setDate(curDate.getDate() + 1);
        }

        if (totalWorkDays === 0) return 100;
        const pct = (presentDays / totalWorkDays) * 100;
        return Math.min(100, Math.round(pct));
      } catch (e) {
        console.error('Gagal kalkulasi persentase absensi:', e);
        return 100;
      }
    },

    getLatenessMinutes(checkInIsoStr: string | null) {
      if (!checkInIsoStr) return 0;
      try {
        const checkInDate = new Date(checkInIsoStr);
        const hours = checkInDate.getHours();
        const minutes = checkInDate.getMinutes();
        
        if (hours >= 12) return 0;
        
        const checkInMinutes = hours * 60 + minutes;
        const limitMinutes = 8 * 60 + 15; // 08:15 WIB
        
        if (checkInMinutes > limitMinutes) {
          return checkInMinutes - (8 * 60); // Terlambat dihitung dari pukul 08:00
        }
      } catch (e) {
        console.error('Gagal hitung waktu keterlambatan:', e);
      }
      return 0;
    }
  },

  // 5. ACTIVITIES SERVICE (JURNAL HARIAN)
  activities: {
    async getForIntern(internId: string) {
      if (isDemoMode) {
        const activities = getFromStorage<any>('simang_activities');
        return activities.filter((a) => a.intern_id === internId).sort((a, b) => b.date.localeCompare(a.date));
      } else {
        const { data, error } = await supabase
          .from('activities')
          .select('*')
          .eq('intern_id', internId)
          .order('date', { ascending: false });
        if (error) throw error;
        return data;
      }
    },

    async getAll() {
      if (isDemoMode) {
        const activities = getFromStorage<any>('simang_activities');
        const profiles = getFromStorage<any>('simang_profiles');
        const interns = getFromStorage<any>('simang_interns');

        return activities.map((a) => {
          const intern = interns.find((i) => i.id === a.intern_id);
          const profile = intern ? profiles.find((p) => p.id === intern.id) : null;
          return {
            ...a,
            intern_name: profile ? profile.full_name : 'Unknown',
            institution: intern ? intern.institution : 'Unknown',
            mentor_id: intern ? intern.mentor_id : null
          };
        }).sort((a, b) => b.date.localeCompare(a.date));
      } else {
        const { data, error } = await supabase
          .from('activities')
          .select(`
            *,
            interns (
              mentor_id,
              institution,
              profiles!interns_id_fkey (full_name)
            )
          `)
          .order('date', { ascending: false });
        
        if (error) throw error;
        return data.map((a: any) => ({
          ...a,
          intern_name: a.interns?.profiles?.full_name,
          institution: a.interns?.institution,
          mentor_id: a.interns?.mentor_id
        }));
      }
    },

    async create(internId: string, taskDescription: string) {
      const todayStr = new Date().toLocaleDateString('sv').split('T')[0];
      if (isDemoMode) {
        const activities = getFromStorage<any>('simang_activities');
        const newRecord = {
          id: 'act-' + Math.random().toString(36).substr(2, 9),
          intern_id: internId,
          date: todayStr,
          task_description: taskDescription,
          status: 'pending',
          feedback: null
        };
        activities.push(newRecord);
        setToStorage('simang_activities', activities);
        return newRecord;
      } else {
        const { data, error } = await supabase
          .from('activities')
          .insert([{
            intern_id: internId,
            date: todayStr,
            task_description: taskDescription,
            status: 'pending'
          }])
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },

    async review(activityId: string, status: 'approved' | 'rejected', feedback: string) {
      if (isDemoMode) {
        const activities = getFromStorage<any>('simang_activities');
        const idx = activities.findIndex((a) => a.id === activityId);
        if (idx !== -1) {
          activities[idx].status = status;
          activities[idx].feedback = feedback || null;
          setToStorage('simang_activities', activities);
        }
        return activities[idx];
      } else {
        const { data, error } = await supabase
          .from('activities')
          .update({ status, feedback: feedback || null })
          .eq('id', activityId)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    }
  },

  // 6. GRADES SERVICE
  grades: {
    async getForIntern(internId: string) {
      if (isDemoMode) {
        const grades = getFromStorage<any>('simang_grades');
        const found = grades.find((g) => g.intern_id === internId);
        return found || null;
      } else {
        const { data, error } = await supabase
          .from('grades')
          .select('*')
          .eq('intern_id', internId)
          .maybeSingle();
        if (error) throw error;
        return data;
      }
    },

    async getAll() {
      if (isDemoMode) {
        return getFromStorage<any>('simang_grades');
      } else {
        const { data, error } = await supabase
          .from('grades')
          .select('*');
        if (error) throw error;
        return data;
      }
    },

    async save(gradeData: {
      intern_id: string;
      discipline: number;
      responsibility: number;
      technical_skills: number;
      attitude: number;
      graded_by: string;
    }) {
      const finalGrade = (gradeData.discipline + gradeData.responsibility + gradeData.technical_skills + gradeData.attitude) / 4;
      
      if (isDemoMode) {
        const grades = getFromStorage<any>('simang_grades');
        const idx = grades.findIndex((g) => g.intern_id === gradeData.intern_id);
        const record = {
          id: idx !== -1 ? grades[idx].id : 'grd-' + Math.random().toString(36).substr(2, 9),
          ...gradeData,
          final_grade: finalGrade,
          created_at: idx !== -1 ? grades[idx].created_at : new Date().toISOString()
        };

        if (idx !== -1) {
          grades[idx] = record;
        } else {
          grades.push(record);
        }

        setToStorage('simang_grades', grades);
        return record;
      } else {
        // Check if grade exists
        const { data: existing } = await supabase
          .from('grades')
          .select('id')
          .eq('intern_id', gradeData.intern_id)
          .maybeSingle();

        if (existing) {
          const { data, error } = await supabase
            .from('grades')
            .update({
              discipline: gradeData.discipline,
              responsibility: gradeData.responsibility,
              technical_skills: gradeData.technical_skills,
              attitude: gradeData.attitude,
              final_grade: finalGrade,
              graded_by: gradeData.graded_by
            })
            .eq('id', existing.id)
            .select()
            .single();
          if (error) throw error;
          return data;
        } else {
          const { data, error } = await supabase
            .from('grades')
            .insert([{
              intern_id: gradeData.intern_id,
              discipline: gradeData.discipline,
              responsibility: gradeData.responsibility,
              technical_skills: gradeData.technical_skills,
              attitude: gradeData.attitude,
              final_grade: finalGrade,
              graded_by: gradeData.graded_by
            }])
            .select()
            .single();
          if (error) throw error;
          return data;
        }
      }
    }
  },

  // 7. ANNOUNCEMENTS SERVICE
  announcements: {
    async getAll() {
      if (isDemoMode) {
        const announcements = getFromStorage<any>('simang_announcements');
        return announcements.sort((a, b) => b.created_at.localeCompare(a.created_at));
      } else {
        const { data, error } = await supabase
          .from('announcements')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) throw error;
        return data;
      }
    },

    async create(announcementData: { title: string; content: string; created_by: string }) {
      const nowStr = new Date().toISOString();
      if (isDemoMode) {
        const announcements = getFromStorage<any>('simang_announcements');
        const newRecord = {
          id: 'ann-' + Math.random().toString(36).substr(2, 9),
          ...announcementData,
          created_at: nowStr
        };
        announcements.push(newRecord);
        setToStorage('simang_announcements', announcements);
        return newRecord;
      } else {
        const { data, error } = await supabase
          .from('announcements')
          .insert([{
            title: announcementData.title,
            content: announcementData.content,
            created_by: announcementData.created_by,
            created_at: nowStr
          }])
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    }
  },

  // 8. AUDIT LOGS SERVICE (V2)
  audit: {
    async getAll() {
      if (isDemoMode) {
        const logs = getFromStorage<any>('simang_audit_logs');
        return logs.sort((a, b) => b.created_at.localeCompare(a.created_at));
      } else {
        const { data, error } = await supabase
          .from('audit_logs')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) throw error;
        return data;
      }
    },

    async create(userId: string, email: string, role: string, action: 'LOGIN' | 'LOGOUT') {
      const nowStr = new Date().toISOString();
      const userAgent = typeof window !== 'undefined' ? window.navigator.userAgent : 'Server Side';
      
      if (isDemoMode) {
        const logs = getFromStorage<any>('simang_audit_logs');
        const newLog = {
          id: 'log-' + Math.random().toString(36).substr(2, 9),
          user_id: userId,
          email,
          role,
          action,
          user_agent: userAgent,
          created_at: nowStr
        };
        logs.push(newLog);
        setToStorage('simang_audit_logs', logs);
        return newLog;
      } else {
        const { data, error } = await supabase
          .rpc('create_audit_log', {
            p_user_id: userId,
            p_email: email,
            p_role: role,
            p_action: action,
            p_user_agent: userAgent
          });
        if (error) throw error;
        return data;
      }
    }
  }
};

// Simple helper function for generating uuid client-side
function gen_random_uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
