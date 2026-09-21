export interface MockProfile {
  id: string;
  name: string;
  email: string;
  role: "teacher" | "student" | "admin";
  avatar_url?: string;
}

export interface MockAttendanceRecord {
  id: string;
  session_id: string;
  student_id: string;
  status: "present" | "late" | "absent";
  marked_at: string;
  profiles: { name: string; email: string };
  sessions: { title: string; session_date: string };
}

const INITIAL_TEACHER: MockProfile = {
  id: "teacher-1",
  name: "Dr. Sarah Jenkins",
  email: "sarah.jenkins@school.edu",
  role: "teacher",
  avatar_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
};

const INITIAL_STUDENTS: MockProfile[] = [
  { id: "student-1", name: "Alex Rivera", email: "alex.rivera@student.edu", role: "student" },
  { id: "student-2", name: "Emma Watson", email: "emma.watson@student.edu", role: "student" },
  { id: "student-3", name: "Liam Chen", email: "liam.chen@student.edu", role: "student" },
  { id: "student-4", name: "Sophia Patel", email: "sophia.patel@student.edu", role: "student" },
];

const INITIAL_CLASSES = [
  {
    id: "class-1",
    name: "Physics 101: Mechanics & Waves",
    subject: "Physics",
    description: "Foundational principles of Newtonian physics, harmonic motion, and wave dynamics.",
    teacher_id: "teacher-1",
    created_at: new Date(Date.now() - 14 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "class-2",
    name: "Calculus AB: Differential Calculus",
    subject: "Math",
    description: "Limits, derivatives, and continuous optimization applications in science and engineering.",
    teacher_id: "teacher-1",
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "class-3",
    name: "Introductory Organic Chemistry",
    subject: "Chemistry",
    description: "Molecular structure, stereochemistry, and reaction mechanisms for hydrocarbon compounds.",
    teacher_id: "teacher-1",
    created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const INITIAL_CLASS_STUDENTS = [
  { id: "cs-1", class_id: "class-1", student_id: "student-1", profiles: INITIAL_STUDENTS[0] },
  { id: "cs-2", class_id: "class-1", student_id: "student-2", profiles: INITIAL_STUDENTS[1] },
  { id: "cs-3", class_id: "class-1", student_id: "student-3", profiles: INITIAL_STUDENTS[2] },
  { id: "cs-4", class_id: "class-1", student_id: "student-4", profiles: INITIAL_STUDENTS[3] },
  { id: "cs-5", class_id: "class-2", student_id: "student-1", profiles: INITIAL_STUDENTS[0] },
  { id: "cs-6", class_id: "class-2", student_id: "student-3", profiles: INITIAL_STUDENTS[2] },
  { id: "cs-7", class_id: "class-3", student_id: "student-1", profiles: INITIAL_STUDENTS[0] },
  { id: "cs-8", class_id: "class-3", student_id: "student-2", profiles: INITIAL_STUDENTS[1] },
];

const todayStr = new Date().toISOString().split("T")[0];
const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split("T")[0];
const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split("T")[0];

const INITIAL_SESSIONS = [
  {
    id: "session-1",
    class_id: "class-1",
    title: "Wave Mechanics & Doppler Effect",
    description: "Live problem solving on acoustic wave propagation and Doppler shift formulas.",
    session_date: todayStr,
    start_time: "10:00",
    end_time: "11:15",
    meet_link: "https://meet.google.com/abc-defg-hij",
    created_at: new Date().toISOString(),
  },
  {
    id: "session-2",
    class_id: "class-2",
    title: "Chain Rule & Implicit Differentiation",
    description: "Mastering complex composite derivatives with step-by-step whiteboard walkthrough.",
    session_date: tomorrowStr,
    start_time: "13:00",
    end_time: "14:30",
    meet_link: "https://meet.google.com/xyz-uvwx-rst",
    created_at: new Date().toISOString(),
  },
  {
    id: "session-3",
    class_id: "class-3",
    title: "Reaction Mechanisms Review",
    description: "Interactive session examining nucleophilic substitution kinetics.",
    session_date: yesterdayStr,
    start_time: "09:30",
    end_time: "10:45",
    meet_link: "https://meet.google.com/qwe-rtyu-iop",
    created_at: new Date().toISOString(),
  },
];

const INITIAL_MATERIALS = [
  {
    id: "mat-1",
    class_id: "class-1",
    title: "Wave Mechanics Lecture Slides",
    description: "Complete slide deck covering wave amplitude, frequency, and harmonic resonance.",
    file_name: "lecture_04_waves.pdf",
    file_url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    uploaded_by: "teacher-1",
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: "mat-2",
    class_id: "class-2",
    title: "Derivative Reference Sheet",
    description: "Cheat sheet with standard derivative rules and trigonometric formulas.",
    file_name: "calculus_formulas_sheet.pdf",
    file_url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    uploaded_by: "teacher-1",
    created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
  },
  {
    id: "mat-3",
    class_id: "class-3",
    title: "Stereochemistry 3D Models Guide",
    description: "Supplementary reading on chiral centers and enantiomers.",
    file_name: "stereochem_guide.pdf",
    file_url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    uploaded_by: "teacher-1",
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
];

const INITIAL_ASSIGNMENTS = [
  {
    id: "assign-1",
    class_id: "class-1",
    title: "Problem Set 3: Harmonic Oscillators",
    description: "Solve problems 1-12 from Chapter 4. Show all working steps clearly.",
    due_date: new Date(Date.now() + 3 * 86400000).toISOString().split("T")[0],
    attachment_url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    created_by: "teacher-1",
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "assign-2",
    class_id: "class-2",
    title: "Optimization Modeling Project",
    description: "Construct a real-world optimization model maximizing box volume given surface constraints.",
    due_date: new Date(Date.now() + 5 * 86400000).toISOString().split("T")[0],
    attachment_url: "",
    created_by: "teacher-1",
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "assign-3",
    class_id: "class-3",
    title: "SN1 vs SN2 Reaction Rate Analysis",
    description: "Write a short 1-page summary comparing solvent effects on substitution reactions.",
    due_date: yesterdayStr,
    attachment_url: "",
    created_by: "teacher-1",
    created_at: new Date(Date.now() - 6 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const INITIAL_SUBMISSIONS = [
  {
    id: "sub-1",
    assignment_id: "assign-3",
    student_id: "student-1",
    file_url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    text_answer: "Polar protic solvents stabilize carbocations, favoring SN1 pathways significantly.",
    submitted_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    marks: 95,
    feedback: "Excellent analysis and clear distinction between polar protic and aprotic solvents!",
    graded_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    profiles: { name: "Alex Rivera", email: "alex.rivera@student.edu" },
    assignments: { title: "SN1 vs SN2 Reaction Rate Analysis" },
  },
  {
    id: "sub-2",
    assignment_id: "assign-1",
    student_id: "student-1",
    file_url: "",
    text_answer: "Calculated natural frequency = 4.25 Hz. Damping coefficient zeta = 0.15.",
    submitted_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    marks: null as number | null,
    feedback: "",
    graded_at: null as string | null,
    profiles: { name: "Alex Rivera", email: "alex.rivera@student.edu" },
    assignments: { title: "Problem Set 3: Harmonic Oscillators" },
  },
  {
    id: "sub-3",
    assignment_id: "assign-1",
    student_id: "student-2",
    file_url: "https://example.com/homework.pdf",
    text_answer: "All 12 problems solved with graphical representations.",
    submitted_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    marks: 88 as number | null,
    feedback: "Great work overall. Double check problem 7 units.",
    graded_at: new Date().toISOString(),
    profiles: { name: "Emma Watson", email: "emma.watson@student.edu" },
    assignments: { title: "Problem Set 3: Harmonic Oscillators" },
  },
];

const INITIAL_ATTENDANCE: MockAttendanceRecord[] = [
  {
    id: "att-1",
    session_id: "session-3",
    student_id: "student-1",
    status: "present",
    marked_at: new Date(Date.now() - 86400000).toISOString(),
    profiles: { name: "Alex Rivera", email: "alex.rivera@student.edu" },
    sessions: { title: "Reaction Mechanisms Review", session_date: yesterdayStr },
  },
  {
    id: "att-2",
    session_id: "session-3",
    student_id: "student-2",
    status: "late",
    marked_at: new Date(Date.now() - 86400000).toISOString(),
    profiles: { name: "Emma Watson", email: "emma.watson@student.edu" },
    sessions: { title: "Reaction Mechanisms Review", session_date: yesterdayStr },
  },
  {
    id: "att-3",
    session_id: "session-1",
    student_id: "student-1",
    status: "present",
    marked_at: new Date().toISOString(),
    profiles: { name: "Alex Rivera", email: "alex.rivera@student.edu" },
    sessions: { title: "Wave Mechanics & Doppler Effect", session_date: todayStr },
  },
];

const INITIAL_ANNOUNCEMENTS = [
  {
    id: "ann-1",
    class_id: "class-1",
    teacher_id: "teacher-1",
    title: "Midterm Exam Date Confirmed",
    message: "The physics midterm exam will take place next Wednesday at 10:00 AM. Study chapters 1 through 5.",
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: "ann-2",
    class_id: "class-2",
    teacher_id: "teacher-1",
    title: "Office Hours Shifted to 3 PM",
    message: "Today's calculus office hours have been moved 1 hour later to 3:00 PM on Google Meet.",
    created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
];

const STORAGE_KEY = "elearn_mock_db_v1";

interface MockDB {
  teacher: MockProfile;
  students: MockProfile[];
  classes: typeof INITIAL_CLASSES;
  class_students: typeof INITIAL_CLASS_STUDENTS;
  sessions: typeof INITIAL_SESSIONS;
  materials: typeof INITIAL_MATERIALS;
  assignments: typeof INITIAL_ASSIGNMENTS;
  submissions: typeof INITIAL_SUBMISSIONS;
  attendance: MockAttendanceRecord[];
  announcements: typeof INITIAL_ANNOUNCEMENTS;
}

function getInitialDB(): MockDB {
  return {
    teacher: INITIAL_TEACHER,
    students: INITIAL_STUDENTS,
    classes: INITIAL_CLASSES,
    class_students: INITIAL_CLASS_STUDENTS,
    sessions: INITIAL_SESSIONS,
    materials: INITIAL_MATERIALS,
    assignments: INITIAL_ASSIGNMENTS,
    submissions: INITIAL_SUBMISSIONS,
    attendance: INITIAL_ATTENDANCE,
    announcements: INITIAL_ANNOUNCEMENTS,
  };
}

export function getMockDB(): MockDB {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const init = getInitialDB();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(init));
      return init;
    }
    return JSON.parse(raw);
  } catch {
    return getInitialDB();
  }
}

export function saveMockDB(db: MockDB) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch {}
}

export function resetMockDB() {
  const init = getInitialDB();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(init));
  return init;
}
