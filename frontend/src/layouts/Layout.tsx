import { useState } from "react";
import { Outlet, NavLink, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icons";

const teacherNav = [
  { to: "/teacher", label: "Dashboard", icon: Icons.layout, end: true },
  { to: "/teacher/classes", label: "Classes", icon: Icons.book },
  { to: "/teacher/sessions", label: "Sessions", icon: Icons.video },
  { to: "/teacher/materials", label: "Materials", icon: Icons.file },
  { to: "/teacher/assignments", label: "Assignments", icon: Icons.clipboard },
  { to: "/teacher/attendance", label: "Attendance", icon: Icons.calendar },
  { to: "/teacher/announcements", label: "Announcements", icon: Icons.megaphone },
  { to: "/teacher/profile", label: "Profile", icon: Icons.users },
];

const studentNav = [
  { to: "/student", label: "Dashboard", icon: Icons.layout, end: true },
  { to: "/student/class", label: "My Classes", icon: Icons.book },
  { to: "/student/sessions", label: "Sessions", icon: Icons.video },
  { to: "/student/materials", label: "Materials", icon: Icons.file },
  { to: "/student/assignments", label: "Assignments", icon: Icons.clipboard },
  { to: "/student/attendance", label: "Attendance", icon: Icons.calendar },
  { to: "/student/progress", label: "Progress", icon: Icons.spark },
  { to: "/student/announcements", label: "Announcements", icon: Icons.megaphone },
  { to: "/student/profile", label: "Profile", icon: Icons.users },
];

export default function Layout() {
  const { user, logout, isGuest } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const nav = user?.role === "teacher" ? teacherNav : studentNav;

  const onLogout = async () => {
    await logout();
    navigate("/");
  };

  const Sidebar = () => (
    <div className="flex h-full flex-col">
      <div className="px-6 py-6 border-b border-white/10">
        <Link to="/" className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-brand-500 to-indigo-600 grid place-items-center text-white shadow-md">
            <Icons.spark className="h-5 w-5" />
          </div>
          <div>
            <p className="font-display font-extrabold text-white text-lg leading-tight">E-Learn</p>
            <p className="text-xs text-white/60 capitalize">
              {user?.role} {isGuest ? "(Demo)" : "Workspace"}
            </p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={!!item.end}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-150 ${
                isActive
                  ? "bg-white text-slate-900 shadow-soft font-semibold"
                  : "text-white/75 hover:bg-white/10 hover:text-white"
              }`
            }
          >
            <item.icon className="h-[18px] w-[18px] shrink-0" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-white/10">
        <div className="rounded-2xl bg-white/10 p-3.5 backdrop-blur">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-full bg-brand-500 text-white grid place-items-center text-xs font-bold shrink-0">
              {user?.name?.[0] || "?"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
              <p className="text-[11px] text-white/60 truncate">{user?.email}</p>
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            className="mt-3 w-full bg-white text-slate-900 hover:bg-slate-100 text-xs font-medium"
            onClick={onLogout}
          >
            <Icons.logout className="h-3.5 w-3.5" /> Sign out
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Desktop sidebar */}
      <aside className="fixed left-0 top-0 hidden h-screen w-[270px] bg-[#0f172a] md:block z-40">
        <Sidebar />
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-[84%] max-w-[300px] bg-[#0f172a] shadow-2xl animate-scale-in">
            <Sidebar />
          </div>
        </div>
      )}

      <div className="md:pl-[270px]">
        <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/80 backdrop-blur">
          <div className="flex h-[64px] items-center justify-between gap-4 px-4 md:px-8">
            <div className="flex items-center gap-3">
              <button
                className="md:hidden rounded-xl border border-slate-200 bg-white p-2 text-slate-700 hover:bg-slate-50 transition"
                onClick={() => setOpen(true)}
                aria-label="Open menu"
              >
                <Icons.menu className="h-5 w-5" />
              </button>
              <div className="hidden md:block">
                <p className="text-sm font-semibold text-slate-900">
                  Welcome back, {user?.name?.split(" ")[0]}
                </p>
                <p className="text-xs text-slate-500">Here's your live academic workspace</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 shadow-2xs">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-semibold text-slate-700 capitalize">
                  {user?.role} {isGuest && "· Demo"}
                </span>
              </div>
              <Button variant="ghost" size="sm" onClick={onLogout} className="text-xs font-medium text-slate-600 hover:text-slate-900">
                Sign out
              </Button>
            </div>
          </div>
        </header>

        <main className="px-4 py-6 md:px-8 md:py-8">
          <div className="mx-auto max-w-[1200px] animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}