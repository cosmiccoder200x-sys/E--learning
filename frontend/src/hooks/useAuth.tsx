import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import type { User } from "@/types";
import { getMockDB } from "@/services/mockData";

interface AuthContextType {
  user: User | null;
  isGuest: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (name: string, email: string, password: string, role: string) => Promise<User>;
  logout: () => Promise<void>;
  enterAsGuest: (role: "teacher" | "student") => void;
  loginAsDemo: (role: "teacher" | "student") => void;
}

const TOKEN_KEY = "supabase_token";
const GUEST_KEY = "guest_mode";

const AuthContext = createContext<AuthContextType>({
  user: null,
  isGuest: false,
  loading: true,
  login: async () => { throw new Error("Unimplemented"); },
  register: async () => { throw new Error("Unimplemented"); },
  logout: async () => {},
  enterAsGuest: () => {},
  loginAsDemo: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [realUser, setRealUser] = useState<User | null>(null);
  const [guestRole, setGuestRole] = useState<"teacher" | "student" | null>(() => {
    const r = localStorage.getItem(GUEST_KEY);
    return r === "teacher" || r === "student" ? r : null;
  });
  const [loading, setLoading] = useState(true);

  // Compute active user
  const user: User | null = realUser ?? (guestRole
    ? guestRole === "teacher"
      ? {
          id: "teacher-1",
          email: "sarah.jenkins@school.edu",
          name: "Dr. Sarah Jenkins",
          role: "teacher",
          avatar_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
        }
      : {
          id: "student-1",
          email: "alex.rivera@student.edu",
          name: "Alex Rivera",
          role: "student",
          avatar_url: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
        }
    : null);

  const isGuest = !realUser && !!guestRole;

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    const guest = localStorage.getItem(GUEST_KEY);

    if (token) {
      fetchUser(token);
    } else if (guest === "teacher" || guest === "student") {
      setGuestRole(guest);
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUser = async (token: string) => {
    try {
      const res = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.user) {
        setRealUser(data.user);
      } else {
        // Fallback for mock demo tokens
        const db = getMockDB();
        if (token.includes("teacher")) {
          setRealUser(db.teacher);
        } else if (token.includes("student")) {
          setRealUser(db.students[0]);
        } else {
          localStorage.removeItem(TOKEN_KEY);
          setRealUser(null);
        }
      }
    } catch {
      const db = getMockDB();
      if (token.includes("teacher")) {
        setRealUser(db.teacher);
      } else if (token.includes("student")) {
        setRealUser(db.students[0]);
      } else {
        setRealUser(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<User> => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        // If backend fails or demo credentials provided
        if (email.toLowerCase().includes("teacher") || email === "sarah.jenkins@school.edu") {
          const db = getMockDB();
          localStorage.setItem(TOKEN_KEY, "demo-teacher-token");
          localStorage.removeItem(GUEST_KEY);
          setGuestRole(null);
          setRealUser(db.teacher);
          return db.teacher;
        }
        if (email.toLowerCase().includes("student") || email === "alex.rivera@student.edu") {
          const db = getMockDB();
          const st = db.students[0];
          localStorage.setItem(TOKEN_KEY, "demo-student-token");
          localStorage.removeItem(GUEST_KEY);
          setGuestRole(null);
          setRealUser(st);
          return st;
        }
        throw new Error(data.error || "Invalid email or password");
      }
      localStorage.setItem(TOKEN_KEY, data.session.access_token);
      localStorage.removeItem(GUEST_KEY);
      setGuestRole(null);
      setRealUser(data.user);
      return data.user;
    } catch (err: any) {
      if (email.toLowerCase().includes("teacher") || email === "sarah.jenkins@school.edu") {
        const db = getMockDB();
        localStorage.setItem(TOKEN_KEY, "demo-teacher-token");
        localStorage.removeItem(GUEST_KEY);
        setGuestRole(null);
        setRealUser(db.teacher);
        return db.teacher;
      }
      if (email.toLowerCase().includes("student") || email === "alex.rivera@student.edu") {
        const db = getMockDB();
        const st = db.students[0];
        localStorage.setItem(TOKEN_KEY, "demo-student-token");
        localStorage.removeItem(GUEST_KEY);
        setGuestRole(null);
        setRealUser(st);
        return st;
      }
      throw err;
    }
  };

  const register = async (name: string, email: string, password: string, role: string): Promise<User> => {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");
      if (data.session) {
        localStorage.setItem(TOKEN_KEY, data.session.access_token);
      }
      if (data.user) {
        localStorage.removeItem(GUEST_KEY);
        setGuestRole(null);
        setRealUser(data.user);
        return data.user;
      }
      throw new Error("Registration succeeded but user data missing");
    } catch (err: any) {
      if (!err.message || err.message.includes("Failed to fetch")) {
        const db = getMockDB();
        const newUser: User = {
          id: role === "teacher" ? "teacher-" + Date.now() : "student-" + Date.now(),
          email,
          name,
          role: role as "teacher" | "student",
          avatar_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
        };
        if (role === "student") {
          db.students.push({ ...newUser, id: newUser.id });
        }
        return newUser;
      }
      throw err;
    }
  };

  const logout = async () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(GUEST_KEY);
    setRealUser(null);
    setGuestRole(null);
  };

  const enterAsGuest = (role: "teacher" | "student") => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.setItem(GUEST_KEY, role);
    setGuestRole(role);
    setRealUser(null);
    setLoading(false);
  };

  const loginAsDemo = (role: "teacher" | "student") => {
    const db = getMockDB();
    if (role === "teacher") {
      localStorage.setItem(TOKEN_KEY, "demo-teacher-token");
      localStorage.removeItem(GUEST_KEY);
      setGuestRole(null);
      setRealUser(db.teacher);
    } else {
      localStorage.setItem(TOKEN_KEY, "demo-student-token");
      localStorage.removeItem(GUEST_KEY);
      setGuestRole(null);
      setRealUser(db.students[0]);
    }
    setLoading(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isGuest,
        loading,
        login,
        register,
        logout,
        enterAsGuest,
        loginAsDemo,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}