import { createBrowserRouter, RouterProvider } from "react-router-dom";
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
import Profile from "@/pages/Profile";
import { AuthProvider } from "@/hooks/useAuth";
import Layout from "@/layouts/Layout";

function ProtectedRoute({ allowedRoles }: { allowedRoles: string[] }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>;
  if (!user) return <Login />;
  if (!allowedRoles.includes(user.role)) return <div className="flex items-center justify-center h-screen">Access Denied</div>;
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
      { path: "students", element: <Classes /> },
      { path: "sessions", element: <Sessions /> },
      { path: "materials", element: <Materials /> },
      { path: "assignments", element: <Assignments /> },
      { path: "attendance", element: <Assignments /> },
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
      { path: "sessions", element: <Sessions /> },
      { path: "materials", element: <Materials /> },
      { path: "assignments", element: <Assignments /> },
      { path: "attendance", element: <Assignments /> },
      { path: "progress", element: <Assignments /> },
      { path: "announcements", element: <Announcements /> },
      { path: "profile", element: <Profile /> },
    ],
  },
]);

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}
