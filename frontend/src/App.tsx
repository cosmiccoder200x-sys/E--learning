import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import TeacherDashboard from "@/pages/TeacherDashboard";
import StudentDashboard from "@/pages/StudentDashboard";
import Classes from "@/pages/Classes";
import Materials from "@/pages/Materials";
import Assignments from "@/pages/Assignments";
import Sessions from "@/pages/Sessions";
import Announcements from "@/pages/Announcements";
import Attendance from "@/pages/Attendance";
import Progress from "@/pages/Progress";
import Profile from "@/pages/Profile";
import { AuthProvider } from "@/hooks/useAuth";
import Layout from "@/layouts/Layout";
import { Toaster } from "@/components/ui/use-toast";

function ProtectedRoute({ allowedRoles }: { allowedRoles: string[] }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-[#f8fafc]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
          <p className="text-sm font-medium text-slate-500">Loading workspace…</p>
        </div>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen grid place-items-center bg-[#f8fafc] p-6">
        <div className="rounded-2xl border bg-white p-8 text-center shadow-soft max-w-sm">
          <p className="font-display font-bold text-lg text-slate-900">Access Restricted</p>
          <p className="mt-2 text-sm text-slate-500">
            This workspace is intended for {allowedRoles.join("/")}s only.
          </p>
          <a
            href={user.role === "teacher" ? "/teacher" : "/student"}
            className="mt-5 inline-flex rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-slate-800 transition"
          >
            Go to your workspace
          </a>
        </div>
      </div>
    );
  }
  return <Layout />;
}

const router = createBrowserRouter([
  { path: "/", element: <Home /> },
  { path: "/login", element: <Login /> },
  { path: "/register", element: <Register /> },
  {
    path: "/teacher",
    element: <ProtectedRoute allowedRoles={["teacher", "admin"]} />,
    children: [
      { index: true, element: <TeacherDashboard /> },
      { path: "classes", element: <Classes /> },
      { path: "class-students", element: <Classes /> },
      { path: "sessions", element: <Sessions /> },
      { path: "materials", element: <Materials /> },
      { path: "assignments", element: <Assignments /> },
      { path: "attendance", element: <Attendance /> },
      { path: "announcements", element: <Announcements /> },
      { path: "profile", element: <Profile /> },
    ],
  },
  {
    path: "/student",
    element: <ProtectedRoute allowedRoles={["student"]} />,
    children: [
      { index: true, element: <StudentDashboard /> },
      { path: "class", element: <Classes /> },
      { path: "classes", element: <Classes /> },
      { path: "sessions", element: <Sessions /> },
      { path: "materials", element: <Materials /> },
      { path: "assignments", element: <Assignments /> },
      { path: "attendance", element: <Attendance /> },
      { path: "progress", element: <Progress /> },
      { path: "announcements", element: <Announcements /> },
      { path: "profile", element: <Profile /> },
    ],
  },
  { path: "*", element: <Navigate to="/" replace /> },
]);

export default function App() {
  return (
    <AuthProvider>
      <Toaster richColors position="top-right" />
      <RouterProvider router={router} />
    </AuthProvider>
  );
}
