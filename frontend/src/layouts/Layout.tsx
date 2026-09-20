import { Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

export default function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50">
      <aside className="fixed left-0 top-0 h-full w-64 bg-slate-900 text-white p-6 z-50 hidden md:block">
        <div className="mb-8">
          <h2 className="text-xl font-bold">E-Learn</h2>
        </div>
        <nav className="space-y-2">
          {user?.role === "teacher" ? (
            <>
              <a href="/teacher" className="block px-3 py-2 rounded-md hover:bg-slate-800">Dashboard</a>
              <a href="/teacher/classes" className="block px-3 py-2 rounded-md hover:bg-slate-800">Classes</a>
              <a href="/teacher/students" className="block px-3 py-2 rounded-md hover:bg-slate-800">Students</a>
              <a href="/teacher/sessions" className="block px-3 py-2 rounded-md hover:bg-slate-800">Sessions</a>
              <a href="/teacher/materials" className="block px-3 py-2 rounded-md hover:bg-slate-800">Materials</a>
              <a href="/teacher/assignments" className="block px-3 py-2 rounded-md hover:bg-slate-800">Assignments</a>
              <a href="/teacher/attendance" className="block px-3 py-2 rounded-md hover:bg-slate-800">Attendance</a>
              <a href="/teacher/announcements" className="block px-3 py-2 rounded-md hover:bg-slate-800">Announcements</a>
            </>
          ) : (
            <>
              <a href="/student" className="block px-3 py-2 rounded-md hover:bg-slate-800">Dashboard</a>
              <a href="/student/class" className="block px-3 py-2 rounded-md hover:bg-slate-800">My Class</a>
              <a href="/student/sessions" className="block px-3 py-2 rounded-md hover:bg-slate-800">Sessions</a>
              <a href="/student/materials" className="block px-3 py-2 rounded-md hover:bg-slate-800">Materials</a>
              <a href="/student/assignments" className="block px-3 py-2 rounded-md hover:bg-slate-800">Assignments</a>
              <a href="/student/attendance" className="block px-3 py-2 rounded-md hover:bg-slate-800">Attendance</a>
              <a href="/student/progress" className="block px-3 py-2 rounded-md hover:bg-slate-800">Progress</a>
              <a href="/student/announcements" className="block px-3 py-2 rounded-md hover:bg-slate-800">Announcements</a>
            </>
          )}
          <a href="/student/profile" className="block px-3 py-2 rounded-md hover:bg-slate-800">Profile</a>
        </nav>
      </aside>

      <main className="md:ml-64 min-h-screen">
        <header className="bg-white border-b sticky top-0 z-40 px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold text-slate-900 hidden md:block">E-Learning Platform</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-600">{user?.name}</span>
              <Button variant="ghost" size="sm" onClick={logout}>Logout</Button>
            </div>
          </div>
        </header>
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
