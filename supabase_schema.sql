-- ==========================================
-- SQL SCHEMA FOR SISTEM MANAJEMEN MAGANG BAPPEDA ACEH (V2)
-- Copy and run this script in your Supabase SQL Editor
-- ==========================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. PROFILES TABLE (Linked with Supabase Auth)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text not null,
  role text not null check (role in ('admin', 'mentor', 'intern')),
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for Profiles
alter table public.profiles enable row level security;

-- 2. MENTORS TABLE
create table public.mentors (
  id uuid references public.profiles(id) on delete cascade primary key,
  nip text,
  department text not null, -- Bidang/Bagian di Bappeda
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for Mentors
alter table public.mentors enable row level security;

-- 3. INTERNS TABLE
create table public.interns (
  id uuid references public.profiles(id) on delete cascade primary key,
  nim_nisn text not null,
  institution text not null, -- Universitas/Sekolah asal
  major text not null, -- Jurusan
  start_date date not null,
  end_date date not null,
  mentor_id uuid references public.mentors(id) on delete set null,
  status text not null check (status in ('active', 'completed', 'inactive')) default 'active',
  
  -- V2 Report Integration columns
  report_url text,
  report_status text not null check (report_status in ('none', 'pending', 'approved', 'rejected')) default 'none',
  report_feedback text,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for Interns
alter table public.interns enable row level security;

-- 4. ATTENDANCE TABLE
create table public.attendance (
  id uuid default gen_random_uuid() primary key,
  intern_id uuid references public.interns(id) on delete cascade not null,
  date date default current_date not null,
  check_in timestamp with time zone not null,
  check_out timestamp with time zone,
  status text not null check (status in ('present', 'sick', 'leave', 'absent')) default 'present',
  notes text, -- Keterangan jika sakit atau izin
  attachment_url text, -- Dokumen bukti sakit/izin
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(intern_id, date) -- Memastikan satu absensi per hari per anak magang
);

-- Enable RLS for Attendance
alter table public.attendance enable row level security;

-- 5. ACTIVITIES TABLE (Jurnal Harian)
create table public.activities (
  id uuid default gen_random_uuid() primary key,
  intern_id uuid references public.interns(id) on delete cascade not null,
  date date default current_date not null,
  task_description text not null,
  status text not null check (status in ('pending', 'approved', 'rejected')) default 'pending',
  feedback text, -- Masukan dari mentor
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for Activities
alter table public.activities enable row level security;

-- 6. GRADES TABLE (Penilaian Akhir)
create table public.grades (
  id uuid default gen_random_uuid() primary key,
  intern_id uuid references public.interns(id) on delete cascade not null unique,
  discipline integer not null check (discipline between 0 and 100),
  responsibility integer not null check (responsibility between 0 and 100),
  technical_skills integer not null check (technical_skills between 0 and 100),
  attitude integer not null check (attitude between 0 and 100),
  final_grade numeric(5,2) not null,
  graded_by uuid references public.mentors(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for Grades
alter table public.grades enable row level security;

-- 7. ANNOUNCEMENTS TABLE
create table public.announcements (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  content text not null,
  created_by uuid references public.profiles(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for Announcements
alter table public.announcements enable row level security;

-- 8. AUDIT LOGS TABLE (V2)
create table public.audit_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  email text not null,
  role text not null,
  action text not null check (action in ('LOGIN', 'LOGOUT')),
  user_agent text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for Audit Logs
alter table public.audit_logs enable row level security;


-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

-- Profiles Policies
create policy "Users can view all profiles"
  on public.profiles for select
  using (true);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Mentors Policies
create policy "Anyone can view mentors"
  on public.mentors for select
  using (true);

-- Admins can manage mentors
create policy "Admins can insert/update/delete mentors"
  on public.mentors for all
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- Interns Policies
create policy "Anyone can view interns"
  on public.interns for select
  using (true);

-- Admins and Mentors can manage interns
create policy "Admins and Mentors can manage interns"
  on public.interns for all
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role in ('admin', 'mentor')
    )
  );

create policy "Interns can update their own details"
  on public.interns for update
  using (auth.uid() = id);

-- Attendance Policies
create policy "Interns can view their own attendance"
  on public.attendance for select
  using (auth.uid() = intern_id);

create policy "Interns can check-in/out and apply for leave"
  on public.attendance for insert
  with check (auth.uid() = intern_id);

create policy "Interns can update their own attendance (checkout)"
  on public.attendance for update
  using (auth.uid() = intern_id);

create policy "Admins and Mentors can view all attendance"
  on public.attendance for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role in ('admin', 'mentor')
    )
  );

create policy "Admins and Mentors can update attendance status (approval)"
  on public.attendance for update
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role in ('admin', 'mentor')
    )
  );

-- Activities (Jurnal) Policies
create policy "Interns can manage their own activities"
  on public.activities for all
  using (auth.uid() = intern_id);

create policy "Mentors and Admins can view all activities"
  on public.activities for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role in ('admin', 'mentor')
    )
  );

create policy "Mentors can update activity status (approval & feedback)"
  on public.activities for update
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'mentor'
    )
  );

-- Grades Policies
create policy "Interns can view their own grades"
  on public.grades for select
  using (auth.uid() = intern_id);

create policy "Mentors and Admins can manage grades"
  on public.grades for all
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role in ('admin', 'mentor')
    )
  );

-- Announcements Policies
create policy "Anyone can view announcements"
  on public.announcements for select
  using (true);

create policy "Admins can manage announcements"
  on public.announcements for all
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- Audit Logs Policies (V2)
create policy "Hanya Admin yang dapat membaca log audit"
  on public.audit_logs for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

create policy "Pengguna yang terautentikasi dapat merekam log audit"
  on public.audit_logs for insert
  with check (auth.uid() = user_id);


-- ==========================================
-- TRIGGER ON USER SIGNUP (AUTOMATIC PROFILE CREATION)
-- ==========================================

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    coalesce(new.raw_user_meta_data->>'role', 'intern')
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger execution
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
