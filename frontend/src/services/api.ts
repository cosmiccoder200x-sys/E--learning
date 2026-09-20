const BASE = "/api";

async function request(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem("supabase_token") || "";
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${BASE}${url}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

export const api = {
  // Auth
  login: (email: string, password: string) => request("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  register: (name: string, email: string, password: string, role: string) => request("/auth/register", { method: "POST", body: JSON.stringify({ name, email, password, role }) }),
  getMe: () => request("/auth/me"),

  // Classes
  getClasses: () => request("/classes"),
  createClass: (data: { name: string; subject: string; description: string }) => request("/classes", { method: "POST", body: JSON.stringify(data) }),
  deleteClass: (id: string) => request(`/classes/${id}`, { method: "DELETE" }),
  getClassStudents: (classId: string) => request(`/classes/${classId}/students`),
  addStudent: (classId: string, email: string) => request(`/classes/${classId}/students`, { method: "POST", body: JSON.stringify({ student_email: email }) }),

  // Sessions
  getSessions: (classId?: string) => request(`/sessions${classId ? `?class_id=${classId}` : ""}`),
  createSession: (data: any) => request("/sessions", { method: "POST", body: JSON.stringify(data) }),

  // Materials
  getMaterials: (classId?: string) => request(`/materials${classId ? `?class_id=${classId}` : ""}`),
  uploadMaterial: (data: any) => request("/materials", { method: "POST", body: JSON.stringify(data) }),

  // Assignments
  getAssignments: (classId?: string) => request(`/assignments${classId ? `?class_id=${classId}` : ""}`),
  createAssignment: (data: any) => request("/assignments", { method: "POST", body: JSON.stringify(data) }),
  submitAssignment: (assignId: string, data: any) => request(`/assignments/${assignId}/submit`, { method: "POST", body: JSON.stringify(data) }),

  // Submissions
  getSubmissions: (classId?: string) => request(`/submissions${classId ? `?class_id=${classId}` : ""}`),
  gradeSubmission: (subId: string, data: any) => request(`/submissions/${subId}/grade`, { method: "PUT", body: JSON.stringify(data) }),
  getMySubmissions: () => request("/submissions/me"),

  // Attendance
  getAttendance: (sessionId?: string) => request(`/attendance${sessionId ? `?session_id=${sessionId}` : ""}`),
  markAttendance: (data: any) => request("/attendance", { method: "POST", body: JSON.stringify(data) }),

  // Announcements
  getAnnouncements: (classId?: string) => request(`/announcements${classId ? `?class_id=${classId}` : ""}`),
  createAnnouncement: (data: any) => request("/announcements", { method: "POST", body: JSON.stringify(data) }),
};
