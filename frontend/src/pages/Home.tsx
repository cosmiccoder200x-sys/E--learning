import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Icons } from "@/components/ui/icons";
import { Badge } from "@/components/ui/badge";

export default function Home() {
  const { user, loginAsDemo } = useAuth();
  const navigate = useNavigate();

  const goDemo = (role: "teacher" | "student") => {
    loginAsDemo(role);
    navigate(role === "teacher" ? "/teacher" : "/student");
  };

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <header className="sticky top-0 z-20 border-b border-slate-200/60 bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-[64px] max-w-[1200px] items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-brand-600 to-indigo-600 grid place-items-center text-white shadow-sm">
              <Icons.spark className="h-5 w-5" />
            </div>
            <span className="font-display text-lg font-extrabold tracking-tight">E-Learn</span>
          </Link>
          <div className="flex items-center gap-2">
            {!user ? (
              <>
                <Button variant="ghost" onClick={() => navigate("/login")}>
                  Sign in
                </Button>
                <Button onClick={() => navigate("/register")}>
                  Get started <Icons.arrow className="h-4 w-4 ml-1" />
                </Button>
              </>
            ) : (
              <Button onClick={() => navigate(user.role === "teacher" ? "/teacher" : "/student")}>
                Go to workspace <Icons.arrow className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-[1200px] px-6 pt-10 md:pt-16">
          <div className="grid gap-10 md:grid-cols-[1.15fr_0.85fr] items-center">
            <div>
              <Badge variant="brand" className="mb-4">
                Live classes with Google Meet & Supabase
              </Badge>
              <h1 className="font-display text-4xl md:text-[54px] font-extrabold leading-[1.02] tracking-tight text-slate-900">
                Learning that
                <span className="bg-gradient-to-r from-brand-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent">
                  {" "}
                  feels alive.
                </span>
              </h1>
              <p className="mt-4 max-w-[560px] text-[17px] leading-relaxed text-slate-600">
                Create classes, schedule live video sessions, share slide decks, take attendance, and grade assignments — all in one calm, lightning-fast workspace for teachers and students.
              </p>

              {!user ? (
                <div className="mt-8 flex flex-wrap gap-3">
                  <Button size="lg" onClick={() => navigate("/register")} className="shadow-md">
                    Create your account <Icons.arrow className="h-4 w-4 ml-1" />
                  </Button>
                  <Button size="lg" variant="outline" onClick={() => navigate("/login")}>
                    Sign in
                  </Button>
                </div>
              ) : (
                <div className="mt-8">
                  <Button
                    size="lg"
                    onClick={() => navigate(user.role === "teacher" ? "/teacher" : "/student")}
                    className="shadow-md"
                  >
                    Continue to {user.role === "teacher" ? "Teacher" : "Student"} Workspace{" "}
                    <Icons.arrow className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              )}

              <div className="mt-6 flex flex-wrap gap-2 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1.5 font-medium text-slate-700">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" /> Instant Setup
                </span>
                <span>·</span>
                <span>Google Meet Integrated</span>
                <span>·</span>
                <span>Full Role-Based Workspaces</span>
              </div>

              <Card className="mt-8 p-4 flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-slate-50 to-indigo-50/40 border-slate-200">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Explore demo workspaces instantly</p>
                  <p className="text-xs text-slate-500">No registration needed to test all features.</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => goDemo("teacher")} className="bg-white">
                    <Icons.book className="h-3.5 w-3.5 mr-1 text-brand-600" /> Teacher Demo
                  </Button>
                  <Button variant="subtle" size="sm" onClick={() => goDemo("student")} className="bg-brand-600 text-white hover:bg-brand-700">
                    <Icons.users className="h-3.5 w-3.5 mr-1" /> Student Demo
                  </Button>
                </div>
              </Card>
            </div>

            <div className="relative">
              <div className="absolute -inset-6 -z-10 rounded-[32px] bg-gradient-to-br from-brand-100 via-violet-100 to-amber-100 blur-2xl opacity-60" />
              <div className="rounded-[24px] border border-slate-200/90 bg-white p-4 shadow-card">
                <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 p-5 text-white shadow-md">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-indigo-300 uppercase tracking-wider">Active Session</span>
                      <p className="text-base font-bold mt-0.5">Physics 101: Wave Mechanics</p>
                    </div>
                    <span className="rounded-full bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/40 px-2.5 py-0.5 text-xs font-semibold flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live now
                    </span>
                  </div>
                  <p className="mt-3 text-xs text-white/75 flex items-center gap-1.5">
                    <Icons.calendar className="h-3.5 w-3.5" /> 10:00 — 11:15 · Google Meet
                  </p>
                  <div className="mt-4 flex gap-2">
                    <Button
                      size="sm"
                      className="bg-white text-slate-900 hover:bg-slate-100 font-semibold"
                      onClick={() => goDemo("student")}
                    >
                      <Icons.video className="h-3.5 w-3.5 mr-1" /> Join session
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="bg-white/10 text-white hover:bg-white/20"
                      onClick={() => goDemo("student")}
                    >
                      <Icons.file className="h-3.5 w-3.5 mr-1" /> View materials
                    </Button>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-3">
                  {[
                    { k: "Active Classes", v: "3", sub: "Mechanics, Calc, Chem" },
                    { k: "Class Avg", v: "92%", sub: "Top quartile" },
                    { k: "Attendance", v: "96%", sub: "Live sessions" },
                  ].map((s) => (
                    <div key={s.k} className="rounded-2xl bg-slate-50 border border-slate-100 p-3 text-center">
                      <p className="text-[11px] font-medium text-slate-500">{s.k}</p>
                      <p className="font-display text-xl font-bold text-slate-900 mt-0.5">{s.v}</p>
                      <p className="text-[10px] text-slate-400 truncate">{s.sub}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1200px] px-6 py-14">
          <div className="grid gap-5 md:grid-cols-3">
            {[
              {
                title: "Live Classrooms & Meet",
                desc: "Schedule sessions with automatic Google Meet integration. Students join with a single click.",
                icon: Icons.video,
                tone: "bg-indigo-50 text-indigo-600",
              },
              {
                title: "Classes & Student Rosters",
                desc: "Create courses, invite students with school emails, and manage attendance in real time.",
                icon: Icons.book,
                tone: "bg-brand-50 text-brand-600",
              },
              {
                title: "Grading & Progress Feedback",
                desc: "Receive homework submissions, assign marks, and provide qualitative feedback instantly.",
                icon: Icons.clipboard,
                tone: "bg-emerald-50 text-emerald-600",
              },
            ].map((f) => (
              <Card key={f.title} className="p-6 hover:shadow-card transition duration-200">
                <div className={`h-11 w-11 rounded-xl ${f.tone} grid place-items-center shadow-2xs`}>
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-display text-lg font-bold text-slate-900">{f.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{f.desc}</p>
              </Card>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200/70 py-8 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} E-Learn Platform · Focused, modern classroom management
      </footer>
    </div>
  );
}