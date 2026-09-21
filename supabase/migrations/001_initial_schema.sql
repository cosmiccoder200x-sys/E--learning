-- Create profiles table
create table profiles (
  id uuid default gen_random_uuid() primary key,
  auth_user_id uuid references auth.users(id) on delete cascade unique,
  name text not null,
  email text not null,
  role text not null check (role in ('teacher', 'student', 'admin')),
  avatar_url text,
  created_at timestamptz default now()
);

-- Create classes table
create table classes (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  subject text not null,
  description text,
  teacher_id uuid references profiles(id) on delete cascade,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create class_students table
create table class_students (
  id uuid default gen_random_uuid() primary key,
  class_id uuid references classes(id) on delete cascade,
  student_id uuid references profiles(id) on delete cascade,
  joined_at timestamptz default now(),
  unique(class_id, student_id)
);

-- Create sessions table
create table sessions (
  id uuid default gen_random_uuid() primary key,
  class_id uuid references classes(id) on delete cascade,
  title text not null,
  description text,
  session_date date not null,
  start_time time not null,
  end_time time,
  meet_link text,
  created_at timestamptz default now()
);

-- Create materials table
create table materials (
  id uuid default gen_random_uuid() primary key,
  class_id uuid references classes(id) on delete cascade,
  title text not null,
  description text,
  file_url text,
  file_name text,
  uploaded_by uuid references profiles(id) on delete cascade,
  created_at timestamptz default now()
);

-- Create assignments table
create table assignments (
  id uuid default gen_random_uuid() primary key,
  class_id uuid references classes(id) on delete cascade,
  title text not null,
  description text,
  due_date date,
  attachment_url text,
  created_by uuid references profiles(id) on delete cascade,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create submissions table
create table submissions (
  id uuid default gen_random_uuid() primary key,
  assignment_id uuid references assignments(id) on delete cascade,
  student_id uuid references profiles(id) on delete cascade,
  file_url text,
  text_answer text,
  submitted_at timestamptz default now(),
  marks integer check (marks >= 0),
  feedback text,
  graded_at timestamptz,
  unique(assignment_id, student_id)
);

-- Create attendance table
create table attendance (
  id uuid default gen_random_uuid() primary key,
  session_id uuid references sessions(id) on delete cascade,
  student_id uuid references profiles(id) on delete cascade,
  status text not null check (status in ('present', 'absent', 'late')),
  marked_at timestamptz default now(),
  unique(session_id, student_id)
);

-- Create announcements table
create table announcements (
  id uuid default gen_random_uuid() primary key,
  class_id uuid references classes(id) on delete cascade,
  teacher_id uuid references profiles(id) on delete cascade,
  title text not null,
  message text not null,
  created_at timestamptz default now()
);

-- Enable RLS
alter table profiles enable row level security;
alter table classes enable row level security;
alter table class_students enable row level security;
alter table sessions enable row level security;
alter table materials enable row level security;
alter table assignments enable row level security;
alter table submissions enable row level security;
alter table attendance enable row level security;
alter table announcements enable row level security;

-- RLS Policies for profiles
create policy "Public read access to profiles" on profiles for select using (true);
create policy "Users can update own profile" on profiles for update using (auth.uid() = auth_user_id);

-- RLS Policies for classes
create policy "Teachers can read own classes" on classes for select using (auth.uid() = teacher_id);
create policy "Teachers can insert own classes" on classes for insert with check (auth.uid() = teacher_id);
create policy "Teachers can update own classes" on classes for update using (auth.uid() = teacher_id);
create policy "Teachers can delete own classes" on classes for delete using (auth.uid() = teacher_id);

-- RLS Policies for class_students
create policy "Teachers can view enrolled students" on class_students for select using (
  exists (select 1 from classes where id = class_id and teacher_id = auth.uid())
);
create policy "Teachers can add students" on class_students for insert with check (
  exists (select 1 from classes where id = class_id and teacher_id = auth.uid())
);

-- RLS Policies for sessions
create policy "Teachers can manage own sessions" on sessions for all using (
  exists (select 1 from classes c where c.id = class_id and c.teacher_id = auth.uid())
);

-- RLS Policies for materials
create policy "Teachers can manage own materials" on materials for all using (
  exists (select 1 from classes c where c.id = class_id and c.teacher_id = auth.uid())
);
create policy "Students can view class materials" on materials for select using (
  exists (select 1 from class_students cs join classes c on c.id = cs.class_id where c.id = class_id and cs.student_id = auth.uid())
);

-- RLS Policies for assignments
create policy "Teachers can manage own assignments" on assignments for all using (
  exists (select 1 from classes c where c.id = class_id and c.teacher_id = auth.uid())
);
create policy "Students can view enrolled class assignments" on assignments for select using (
  exists (select 1 from class_students cs join classes c on c.id = cs.class_id where c.id = class_id and cs.student_id = auth.uid())
);

-- RLS Policies for submissions
create policy "Teachers can view submissions for their classes" on submissions for select using (
  exists (select 1 from assignments a join classes c on c.id = a.class_id where a.id = assignment_id and c.teacher_id = auth.uid())
);
create policy "Students can view own submissions" on submissions for select using (
  student_id = auth.uid()
);
create policy "Students can insert own submissions" on submissions for insert with check (
  student_id = auth.uid()
);

-- RLS Policies for attendance
create policy "Teachers can manage attendance for their classes" on attendance for all using (
  exists (select 1 from sessions s join classes c on c.id = s.class_id where s.id = session_id and c.teacher_id = auth.uid())
);
create policy "Students can view own attendance" on attendance for select using (
  student_id = auth.uid()
);

-- RLS Policies for announcements
create policy "Teachers can manage own announcements" on announcements for all using (
  teacher_id = auth.uid()
);
create policy "Students can view enrolled class announcements" on announcements for select using (
  exists (select 1 from class_students cs join classes c on c.id = cs.class_id where c.id = class_id and cs.student_id = auth.uid())
);

-- Indexes
create index idx_classes_teacher on classes(teacher_id);
create index idx_class_students_class on class_students(class_id);
create index idx_class_students_student on class_students(student_id);
create index idx_sessions_class on sessions(class_id);
create index idx_materials_class on materials(class_id);
create index idx_assignments_class on assignments(class_id);
create index idx_submissions_assignment on submissions(assignment_id);
create index idx_submissions_student on submissions(student_id);
create index idx_attendance_session on attendance(session_id);
create index idx_attendance_student on attendance(student_id);
create index idx_announcements_class on announcements(class_id);
