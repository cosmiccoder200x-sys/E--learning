import { getMockDB, saveMockDB } from "./mockData";

const BASE = "/api";

async function request(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem("supabase_token") || "";
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  try {
    const res = await fetch(`${BASE}${url}`, { ...options, headers });
    const data = await res.json();
    if (!res.ok) {
      const err: any = new Error(data.error || "Request failed");
      err.status = res.status;
      throw err;
    }
    return data;
  } catch (err: any) {
    throw err;
  }
}

function isNetworkError(err: any): boolean {
  return !err.status && (err.message?.includes("Failed to fetch") || err.name === "TypeError");
}

function isMockMode(): boolean {
  const token = localStorage.getItem("supabase_token");
  const guest = localStorage.getItem("guest_mode");
  return !token || !!guest;
}

export const api = {
  // Auth
  login: async (email: string, password: string) => {
    try {
      return await request("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
    } catch (err: any) { if (!isNetworkError(err)) throw err;
      // If backend offline or demo user
      if (email.includes("teacher") || email === "sarah.jenkins@school.edu") {
        return {
          user: { id: "teacher-1", email, name: "Dr. Sarah Jenkins", role: "teacher" },
          session: { access_token: "demo-teacher-token" },
        };
      }
      if (email.includes("student") || email === "alex.rivera@student.edu") {
        return {
          user: { id: "student-1", email, name: "Alex Rivera", role: "student" },
          session: { access_token: "demo-student-token" },
        };
      }
      throw err;
    }
  },

  register: async (name: string, email: string, password: string, role: string) => {
    try {
      return await request("/auth/register", {
        method: "POST",
        body: JSON.stringify({ name, email, password, role }),
      });
    } catch (err: any) { if (!isNetworkError(err)) throw err;
      if (!isNetworkError(err)) throw err;
      return { message: "User registered successfully", user_id: "demo-" + Date.now() };
    }
  },

  getMe: async () => {
    if (isMockMode()) {
      const guestRole = localStorage.getItem("guest_mode") || "teacher";
      const db = getMockDB();
      const user = guestRole === "teacher" ? db.teacher : db.students[0];
      return { user };
    }
    return request("/auth/me");
  },

  // Classes
  getClasses: async () => {
    if (isMockMode()) {
      const db = getMockDB();
      return { classes: db.classes };
    }
    try {
      return await request("/classes");
    } catch (err) { if (!isNetworkError(err)) throw err; if (!isNetworkError(err)) throw err;
      return { classes: getMockDB().classes };
    }
  },

  createClass: async (data: { name: string; subject: string; description: string }) => {
    if (isMockMode()) {
      const db = getMockDB();
      const newClass = {
        id: "class-" + Date.now(),
        name: data.name,
        subject: data.subject,
        description: data.description || "",
        teacher_id: db.teacher.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      db.classes.unshift(newClass);
      saveMockDB(db);
      return { class: newClass };
    }
    try {
      return await request("/classes", { method: "POST", body: JSON.stringify(data) });
    } catch (err) { if (!isNetworkError(err)) throw err; if (!isNetworkError(err)) throw err;
      const db = getMockDB();
      const newClass = {
        id: "class-" + Date.now(),
        name: data.name,
        subject: data.subject,
        description: data.description || "",
        teacher_id: db.teacher.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      db.classes.unshift(newClass);
      saveMockDB(db);
      return { class: newClass };
    }
  },

  deleteClass: async (id: string) => {
    if (isMockMode()) {
      const db = getMockDB();
      db.classes = db.classes.filter((c) => c.id !== id);
      db.sessions = db.sessions.filter((s) => s.class_id !== id);
      db.materials = db.materials.filter((m) => m.class_id !== id);
      db.assignments = db.assignments.filter((a) => a.class_id !== id);
      db.announcements = db.announcements.filter((a) => a.class_id !== id);
      saveMockDB(db);
      return { message: "Class deleted" };
    }
    try {
      return await request(`/classes/${id}`, { method: "DELETE" });
    } catch (err) { if (!isNetworkError(err)) throw err; if (!isNetworkError(err)) throw err;
      const db = getMockDB();
      db.classes = db.classes.filter((c) => c.id !== id);
      saveMockDB(db);
      return { message: "Class deleted" };
    }
  },

  getClassStudents: async (classId: string) => {
    if (isMockMode()) {
      const db = getMockDB();
      const list = db.class_students.filter((cs) => cs.class_id === classId);
      return { students: list };
    }
    try {
      return await request(`/classes/${classId}/students`);
    } catch (err) { if (!isNetworkError(err)) throw err; if (!isNetworkError(err)) throw err;
      const db = getMockDB();
      return { students: db.class_students.filter((cs) => cs.class_id === classId) };
    }
  },

  addStudent: async (classId: string, email: string) => {
    if (isMockMode()) {
      const db = getMockDB();
      let student = db.students.find((s) => s.email.toLowerCase() === email.toLowerCase());
      if (!student) {
        student = {
          id: "student-" + Date.now(),
          name: email.split("@")[0].replace(".", " ").replace(/\b\w/g, (l) => l.toUpperCase()),
          email: email,
          role: "student",
        };
        db.students.push(student);
      }
      const existing = db.class_students.find((cs) => cs.class_id === classId && cs.student_id === student?.id);
      if (!existing && student) {
        db.class_students.push({
          id: "cs-" + Date.now(),
          class_id: classId,
          student_id: student.id,
          profiles: student,
        });
        saveMockDB(db);
      }
      return { message: "Student added" };
    }
    try {
      return await request(`/classes/${classId}/students`, {
        method: "POST",
        body: JSON.stringify({ student_email: email }),
      });
    } catch (err) { if (!isNetworkError(err)) throw err; if (!isNetworkError(err)) throw err;
      const db = getMockDB();
      let student = db.students.find((s) => s.email.toLowerCase() === email.toLowerCase());
      if (!student) {
        student = {
          id: "student-" + Date.now(),
          name: email.split("@")[0],
          email: email,
          role: "student",
        };
        db.students.push(student);
      }
      db.class_students.push({
        id: "cs-" + Date.now(),
        class_id: classId,
        student_id: student.id,
        profiles: student,
      });
      saveMockDB(db);
      return { message: "Student added" };
    }
  },

  // Sessions
  getSessions: async (classId?: string) => {
    if (isMockMode()) {
      const db = getMockDB();
      const list = classId ? db.sessions.filter((s) => s.class_id === classId) : db.sessions;
      return { sessions: list };
    }
    try {
      return await request(`/sessions${classId ? `?class_id=${classId}` : ""}`);
    } catch (err) { if (!isNetworkError(err)) throw err; if (!isNetworkError(err)) throw err;
      const db = getMockDB();
      return { sessions: classId ? db.sessions.filter((s) => s.class_id === classId) : db.sessions };
    }
  },

  createSession: async (data: any) => {
    if (isMockMode()) {
      const db = getMockDB();
      const newSession = {
        id: "session-" + Date.now(),
        class_id: data.class_id,
        title: data.title,
        description: data.description || "",
        session_date: data.session_date,
        start_time: data.start_time,
        end_time: data.end_time || "",
        meet_link: data.meet_link || "https://meet.google.com/new",
        created_at: new Date().toISOString(),
      };
      db.sessions.unshift(newSession);
      saveMockDB(db);
      return { session: newSession };
    }
    try {
      return await request("/sessions", { method: "POST", body: JSON.stringify(data) });
    } catch (err) { if (!isNetworkError(err)) throw err; if (!isNetworkError(err)) throw err;
      const db = getMockDB();
      const newSession = {
        id: "session-" + Date.now(),
        class_id: data.class_id,
        title: data.title,
        description: data.description || "",
        session_date: data.session_date,
        start_time: data.start_time,
        end_time: data.end_time || "",
        meet_link: data.meet_link || "https://meet.google.com/new",
        created_at: new Date().toISOString(),
      };
      db.sessions.unshift(newSession);
      saveMockDB(db);
      return { session: newSession };
    }
  },

  updateSession: async (sessionId: string, data: any) => {
    if (isMockMode()) {
      const db = getMockDB();
      const idx = db.sessions.findIndex((s) => s.id === sessionId);
      if (idx !== -1) {
        db.sessions[idx] = { ...db.sessions[idx], ...data };
        saveMockDB(db);
        return { session: db.sessions[idx] };
      }
      return { message: "Updated" };
    }
    try {
      return await request(`/sessions/${sessionId}`, { method: "PUT", body: JSON.stringify(data) });
    } catch (err) { if (!isNetworkError(err)) throw err; if (!isNetworkError(err)) throw err;
      const db = getMockDB();
      const idx = db.sessions.findIndex((s) => s.id === sessionId);
      if (idx !== -1) {
        db.sessions[idx] = { ...db.sessions[idx], ...data };
        saveMockDB(db);
      }
      return { message: "Updated" };
    }
  },

  deleteSession: async (sessionId: string) => {
    if (isMockMode()) {
      const db = getMockDB();
      db.sessions = db.sessions.filter((s) => s.id !== sessionId);
      saveMockDB(db);
      return { message: "Session deleted" };
    }
    try {
      return await request(`/sessions/${sessionId}`, { method: "DELETE" });
    } catch (err) { if (!isNetworkError(err)) throw err; if (!isNetworkError(err)) throw err;
      const db = getMockDB();
      db.sessions = db.sessions.filter((s) => s.id !== sessionId);
      saveMockDB(db);
      return { message: "Session deleted" };
    }
  },

  // Materials
  getMaterials: async (classId?: string) => {
    if (isMockMode()) {
      const db = getMockDB();
      const list = classId ? db.materials.filter((m) => m.class_id === classId) : db.materials;
      return { materials: list };
    }
    try {
      return await request(`/materials${classId ? `?class_id=${classId}` : ""}`);
    } catch (err) { if (!isNetworkError(err)) throw err; if (!isNetworkError(err)) throw err;
      const db = getMockDB();
      return { materials: classId ? db.materials.filter((m) => m.class_id === classId) : db.materials };
    }
  },

  uploadMaterial: async (data: any) => {
    if (isMockMode()) {
      const db = getMockDB();
      const newMat = {
        id: "mat-" + Date.now(),
        class_id: data.class_id,
        title: data.title,
        description: data.description || "",
        file_url: data.file_url || "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        file_name: data.file_name || "document.pdf",
        uploaded_by: db.teacher.id,
        created_at: new Date().toISOString(),
      };
      db.materials.unshift(newMat);
      saveMockDB(db);
      return { material: newMat };
    }
    try {
      return await request("/materials", { method: "POST", body: JSON.stringify(data) });
    } catch (err) { if (!isNetworkError(err)) throw err; if (!isNetworkError(err)) throw err;
      const db = getMockDB();
      const newMat = {
        id: "mat-" + Date.now(),
        class_id: data.class_id,
        title: data.title,
        description: data.description || "",
        file_url: data.file_url || "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        file_name: data.file_name || "document.pdf",
        uploaded_by: db.teacher.id,
        created_at: new Date().toISOString(),
      };
      db.materials.unshift(newMat);
      saveMockDB(db);
      return { material: newMat };
    }
  },

  deleteMaterial: async (materialId: string) => {
    if (isMockMode()) {
      const db = getMockDB();
      db.materials = db.materials.filter((m) => m.id !== materialId);
      saveMockDB(db);
      return { message: "Material deleted" };
    }
    try {
      return await request(`/materials/${materialId}`, { method: "DELETE" });
    } catch (err) { if (!isNetworkError(err)) throw err; if (!isNetworkError(err)) throw err;
      const db = getMockDB();
      db.materials = db.materials.filter((m) => m.id !== materialId);
      saveMockDB(db);
      return { message: "Material deleted" };
    }
  },

  // Assignments
  getAssignments: async (classId?: string) => {
    if (isMockMode()) {
      const db = getMockDB();
      const list = classId ? db.assignments.filter((a) => a.class_id === classId) : db.assignments;
      return { assignments: list };
    }
    try {
      return await request(`/assignments${classId ? `?class_id=${classId}` : ""}`);
    } catch (err) { if (!isNetworkError(err)) throw err; if (!isNetworkError(err)) throw err;
      const db = getMockDB();
      return { assignments: classId ? db.assignments.filter((a) => a.class_id === classId) : db.assignments };
    }
  },

  getAssignment: async (assignId: string) => {
    if (isMockMode()) {
      const db = getMockDB();
      const a = db.assignments.find((item) => item.id === assignId);
      return { assignment: a };
    }
    return request(`/assignments/${assignId}`);
  },

  createAssignment: async (data: any) => {
    if (isMockMode()) {
      const db = getMockDB();
      const newAssign = {
        id: "assign-" + Date.now(),
        class_id: data.class_id,
        title: data.title,
        description: data.description || "",
        due_date: data.due_date || "",
        attachment_url: data.attachment_url || "",
        created_by: db.teacher.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      db.assignments.unshift(newAssign);
      saveMockDB(db);
      return { assignment: newAssign };
    }
    try {
      return await request("/assignments", { method: "POST", body: JSON.stringify(data) });
    } catch (err) { if (!isNetworkError(err)) throw err; if (!isNetworkError(err)) throw err;
      const db = getMockDB();
      const newAssign = {
        id: "assign-" + Date.now(),
        class_id: data.class_id,
        title: data.title,
        description: data.description || "",
        due_date: data.due_date || "",
        attachment_url: data.attachment_url || "",
        created_by: db.teacher.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      db.assignments.unshift(newAssign);
      saveMockDB(db);
      return { assignment: newAssign };
    }
  },

  deleteAssignment: async (assignId: string) => {
    if (isMockMode()) {
      const db = getMockDB();
      db.assignments = db.assignments.filter((a) => a.id !== assignId);
      db.submissions = db.submissions.filter((s) => s.assignment_id !== assignId);
      saveMockDB(db);
      return { message: "Assignment deleted" };
    }
    try {
      return await request(`/assignments/${assignId}`, { method: "DELETE" });
    } catch (err) { if (!isNetworkError(err)) throw err; if (!isNetworkError(err)) throw err;
      const db = getMockDB();
      db.assignments = db.assignments.filter((a) => a.id !== assignId);
      saveMockDB(db);
      return { message: "Assignment deleted" };
    }
  },

  submitAssignment: async (assignId: string, data: any) => {
    if (isMockMode()) {
      const db = getMockDB();
      const student = db.students[0];
      const assign = db.assignments.find((a) => a.id === assignId);
      const existingIdx = db.submissions.findIndex((s) => s.assignment_id === assignId && s.student_id === student.id);
      const subRecord = {
        id: existingIdx !== -1 ? db.submissions[existingIdx].id : "sub-" + Date.now(),
        assignment_id: assignId,
        student_id: student.id,
        file_url: data.file_url || "",
        text_answer: data.text_answer || "",
        submitted_at: new Date().toISOString(),
        marks: null,
        feedback: "",
        graded_at: null,
        profiles: { name: student.name, email: student.email },
        assignments: { title: assign?.title || "Assignment" },
      };
      if (existingIdx !== -1) {
        db.submissions[existingIdx] = subRecord;
      } else {
        db.submissions.unshift(subRecord);
      }
      saveMockDB(db);
      return { submission: subRecord };
    }
    try {
      return await request(`/assignments/${assignId}/submit`, { method: "POST", body: JSON.stringify(data) });
    } catch (err) { if (!isNetworkError(err)) throw err; if (!isNetworkError(err)) throw err;
      const db = getMockDB();
      const student = db.students[0];
      const subRecord = {
        id: "sub-" + Date.now(),
        assignment_id: assignId,
        student_id: student.id,
        file_url: data.file_url || "",
        text_answer: data.text_answer || "",
        submitted_at: new Date().toISOString(),
        marks: null,
        feedback: "",
        graded_at: null,
        profiles: { name: student.name, email: student.email },
        assignments: { title: "Assignment" },
      };
      db.submissions.unshift(subRecord);
      saveMockDB(db);
      return { submission: subRecord };
    }
  },

  // Submissions
  getSubmissions: async (classId?: string) => {
    if (isMockMode()) {
      const db = getMockDB();
      return { submissions: db.submissions };
    }
    try {
      return await request(`/submissions${classId ? `?class_id=${classId}` : ""}`);
    } catch (err) { if (!isNetworkError(err)) throw err; if (!isNetworkError(err)) throw err;
      return { submissions: getMockDB().submissions };
    }
  },

  gradeSubmission: async (subId: string, data: any) => {
    if (isMockMode()) {
      const db = getMockDB();
      const idx = db.submissions.findIndex((s) => s.id === subId);
      if (idx !== -1) {
        db.submissions[idx].marks = data.marks !== undefined ? Number(data.marks) : null;
        db.submissions[idx].feedback = data.feedback || "";
        db.submissions[idx].graded_at = new Date().toISOString();
        saveMockDB(db);
        return { submission: db.submissions[idx] };
      }
      return { message: "Graded" };
    }
    try {
      return await request(`/submissions/${subId}/grade`, { method: "PUT", body: JSON.stringify(data) });
    } catch (err) { if (!isNetworkError(err)) throw err; if (!isNetworkError(err)) throw err;
      const db = getMockDB();
      const idx = db.submissions.findIndex((s) => s.id === subId);
      if (idx !== -1) {
        db.submissions[idx].marks = data.marks !== undefined ? Number(data.marks) : null;
        db.submissions[idx].feedback = data.feedback || "";
        db.submissions[idx].graded_at = new Date().toISOString();
        saveMockDB(db);
      }
      return { message: "Graded" };
    }
  },

  getMySubmissions: async () => {
    if (isMockMode()) {
      const db = getMockDB();
      return { submissions: db.submissions.filter((s) => s.student_id === "student-1") };
    }
    try {
      return await request("/submissions/me");
    } catch (err) { if (!isNetworkError(err)) throw err; if (!isNetworkError(err)) throw err;
      return { submissions: getMockDB().submissions.filter((s) => s.student_id === "student-1") };
    }
  },

  // Attendance
  getAttendance: async (sessionId?: string) => {
    if (isMockMode()) {
      const db = getMockDB();
      const list = sessionId ? db.attendance.filter((a) => a.session_id === sessionId) : db.attendance;
      return { attendance: list };
    }
    try {
      return await request(`/attendance${sessionId ? `?session_id=${sessionId}` : ""}`);
    } catch (err) { if (!isNetworkError(err)) throw err; if (!isNetworkError(err)) throw err;
      const db = getMockDB();
      return { attendance: sessionId ? db.attendance.filter((a) => a.session_id === sessionId) : db.attendance };
    }
  },

  getMyAttendance: async () => {
    if (isMockMode()) {
      const db = getMockDB();
      return { attendance: db.attendance.filter((a) => a.student_id === "student-1") };
    }
    try {
      return await request("/attendance/me");
    } catch (err) { if (!isNetworkError(err)) throw err; if (!isNetworkError(err)) throw err;
      return { attendance: getMockDB().attendance.filter((a) => a.student_id === "student-1") };
    }
  },

  markAttendance: async (data: { session_id: string; student_id: string; status: "present" | "absent" | "late" }) => {
    if (isMockMode()) {
      const db = getMockDB();
      const existingIdx = db.attendance.findIndex(
        (a) => a.session_id === data.session_id && a.student_id === data.student_id
      );
      const student = db.students.find((s) => s.id === data.student_id);
      const session = db.sessions.find((s) => s.id === data.session_id);
      const record = {
        id: existingIdx !== -1 ? db.attendance[existingIdx].id : "att-" + Date.now(),
        session_id: data.session_id,
        student_id: data.student_id,
        status: data.status,
        marked_at: new Date().toISOString(),
        profiles: { name: student?.name || "Student", email: student?.email || "" },
        sessions: { title: session?.title || "Session", session_date: session?.session_date || "" },
      };
      if (existingIdx !== -1) {
        db.attendance[existingIdx] = record;
      } else {
        db.attendance.unshift(record);
      }
      saveMockDB(db);
      return { attendance: record };
    }
    try {
      return await request("/attendance", { method: "POST", body: JSON.stringify(data) });
    } catch (err) { if (!isNetworkError(err)) throw err; if (!isNetworkError(err)) throw err;
      const db = getMockDB();
      const existingIdx = db.attendance.findIndex(
        (a) => a.session_id === data.session_id && a.student_id === data.student_id
      );
      const student = db.students.find((s) => s.id === data.student_id);
      const session = db.sessions.find((s) => s.id === data.session_id);
      const record = {
        id: existingIdx !== -1 ? db.attendance[existingIdx].id : "att-" + Date.now(),
        session_id: data.session_id,
        student_id: data.student_id,
        status: data.status,
        marked_at: new Date().toISOString(),
        profiles: { name: student?.name || "Student", email: student?.email || "" },
        sessions: { title: session?.title || "Session", session_date: session?.session_date || "" },
      };
      if (existingIdx !== -1) {
        db.attendance[existingIdx] = record;
      } else {
        db.attendance.unshift(record);
      }
      saveMockDB(db);
      return { attendance: record };
    }
  },

  // Announcements
  getAnnouncements: async (classId?: string) => {
    if (isMockMode()) {
      const db = getMockDB();
      const list = classId ? db.announcements.filter((a) => a.class_id === classId) : db.announcements;
      return { announcements: list };
    }
    try {
      return await request(`/announcements${classId ? `?class_id=${classId}` : ""}`);
    } catch (err) { if (!isNetworkError(err)) throw err; if (!isNetworkError(err)) throw err;
      const db = getMockDB();
      return { announcements: classId ? db.announcements.filter((a) => a.class_id === classId) : db.announcements };
    }
  },

  createAnnouncement: async (data: any) => {
    if (isMockMode()) {
      const db = getMockDB();
      const newAnn = {
        id: "ann-" + Date.now(),
        class_id: data.class_id || "",
        teacher_id: db.teacher.id,
        title: data.title,
        message: data.message,
        created_at: new Date().toISOString(),
      };
      db.announcements.unshift(newAnn);
      saveMockDB(db);
      return { announcement: newAnn };
    }
    try {
      return await request("/announcements", { method: "POST", body: JSON.stringify(data) });
    } catch (err) { if (!isNetworkError(err)) throw err; if (!isNetworkError(err)) throw err;
      const db = getMockDB();
      const newAnn = {
        id: "ann-" + Date.now(),
        class_id: data.class_id || "",
        teacher_id: db.teacher.id,
        title: data.title,
        message: data.message,
        created_at: new Date().toISOString(),
      };
      db.announcements.unshift(newAnn);
      saveMockDB(db);
      return { announcement: newAnn };
    }
  },
};
