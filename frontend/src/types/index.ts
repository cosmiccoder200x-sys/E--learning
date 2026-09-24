export interface User {
  id: string;
  email: string;
  name: string;
  role: "teacher" | "student" | "admin";
  avatar_url?: string;
}

export interface Class {
  id: string;
  name: string;
  subject: string;
  description: string;
  teacher_id: string;
  created_at: string;
  updated_at: string;
}

export interface Session {
  id: string;
  class_id: string;
  title: string;
  description: string;
  session_date: string;
  start_time: string;
  end_time: string;
  meet_link: string;
  created_at: string;
}

export interface Material {
  id: string;
  class_id: string;
  title: string;
  description: string;
  file_url: string;
  file_name: string;
  uploaded_by: string;
  created_at: string;
}

export interface Assignment {
  id: string;
  class_id: string;
  title: string;
  description: string;
  due_date: string;
  attachment_url: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Submission {
  id: string;
  assignment_id: string;
  student_id: string;
  file_url: string;
  text_answer: string;
  submitted_at: string;
  marks: number | null;
  feedback: string;
  graded_at: string | null;
}

export interface Announcement {
  id: string;
  class_id: string;
  teacher_id: string;
  title: string;
  message: string;
  created_at: string;
  profiles?: { name: string };
  classes?: { name: string; subject: string };
}

export interface Submission {
  id: string;
  assignment_id: string;
  student_id: string;
  file_url: string;
  text_answer: string;
  submitted_at: string;
  marks: number | null;
  feedback: string;
  graded_at: string | null;
  profiles?: { name: string; email?: string };
  assignments?: { title: string };
}
