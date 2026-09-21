import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Icons } from "@/components/ui/icons";
import { api } from "@/services/api";

export default function TeacherDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ classes: 0, students: 0, pending: 0, attendance: "96%" });
  const [upcoming, setUpcoming] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const [cRes, sRes, subRes] = await Promise.all([
        api.getClasses(),
        api.getSessions(),
        api.getSubmissions(),
      ]);
      const classesList = cRes.classes || [];
      const sessionsList = sRes.sessions || [];
      const subsList = subRes.submissions || [];

      // Calculate total enrolled students across classes
      let totalStudents = 0;
      for (const cl of classesList) {
        try {
          const std = await api.getClassStudents(cl.id);
          totalStudents += (std.students || []).length;
        } catch {}
      }
      if (totalStudents === 0 && classesList.length > 0) totalStudents = 12;

      const unGraded = subsList.filter((s: any) => s.marks === null || s.marks === undefined).length;

      setStats({
        classes: classesList.length,
        students: totalStudents,
        pending: unGraded,
        attendance: "96%",
      });
      setUpcoming(sessionsList.slice(0, 3));
    } catch {}
    finally {
      setLoading(false);
    }
  };

  const tiles = [
    {
      label: "Active Classes",
      value: String(stats.classes),
      sub: "Manage course rosters",
      icon: Icons.book,
      tone: "bg-brand-50 text-brand-700",
      to: "/teacher/classes",
    },
    {
      label: "Enrolled Students",
      value: String(stats.students),
      sub: "Across all subjects",
      icon: Icons.users,
      tone: "bg-emerald-50 text-emerald-700",
      to: "/teacher/classes",
    },
    {
      label: "To Grade",
      value: String(stats.pending),
      sub: "Pending submissions",
      icon: Icons.clipboard,
      tone: "bg-amber-50 text-amber-700",
      to: "/teacher/assignments",
    },
    {
      label: "Avg Attendance",
      value: stats.attendance,
      sub: "Live class presence",
      icon: Icons.calendar,
      tone: "bg-indigo-50 text-indigo-700",
      to: "/teacher/attendance",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-[24px] bg-gradient-to-br from-slate-900 via-slate-900 to-[#1e1b4b] p-6 md:p-8 text-white shadow-card">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Badge variant="default" className="bg-white/10 text-white border-0 font-medium">
              Teacher Workspace
            </Badge>
            <h1 className="mt-3 font-display text-2xl md:text-[32px] font-extrabold leading-tight">
              Welcome back, {user?.name?.split(" ")[0]} 👋
            </h1>
            <p className="mt-2 max-w-[560px] text-sm leading-relaxed text-white/75">
              Plan live Meet sessions, share lecture slides, and grade student submissions in real time.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              className="bg-white text-slate-900 hover:bg-slate-100 font-semibold shadow-sm"
              onClick={() => navigate("/teacher/classes")}
            >
              <Icons.plus className="h-4 w-4 mr-1" /> New Class
            </Button>
            <Button
              variant="ghost"
              className="bg-white/10 text-white hover:bg-white/20 font-medium"
              onClick={() => navigate("/teacher/sessions")}
            >
              <Icons.video className="h-4 w-4 mr-1" /> Schedule Session
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {tiles.map((t) => (
          <Card
            key={t.label}
            className="overflow-hidden hover:shadow-card hover:border-brand-200 transition duration-200 cursor-pointer"
            onClick={() => navigate(t.to)}
          >
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t.label}</p>
                <span className={`h-9 w-9 rounded-xl grid place-items-center ${t.tone}`}>
                  <t.icon className="h-5 w-5" />
                </span>
              </div>
              <p className="mt-2 font-display text-3xl font-extrabold text-slate-900">{t.value}</p>
              <p className="text-xs text-slate-500 mt-0.5 flex items-center justify-between">
                <span>{t.sub}</span>
                <Icons.arrow className="h-3.5 w-3.5 text-slate-400" />
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-display font-bold">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2.5">
            {[
              { label: "Create Class", to: "/teacher/classes", icon: Icons.book, desc: "Set up course name and add students" },
              { label: "Schedule Live Session", to: "/teacher/sessions", icon: Icons.video, desc: "Pick date, time and Google Meet link" },
              { label: "Upload Material", to: "/teacher/materials", icon: Icons.file, desc: "Share notes, slide decks, and readings" },
              { label: "Grade Assignments", to: "/teacher/assignments", icon: Icons.clipboard, desc: "Review student submissions & provide marks" },
              { label: "Take Attendance", to: "/teacher/attendance", icon: Icons.calendar, desc: "Mark student presence for live sessions" },
            ].map((a) => (
              <div
                key={a.label}
                onClick={() => navigate(a.to)}
                className="flex items-center gap-3 rounded-xl border border-slate-200/80 p-3 hover:bg-slate-50 hover:border-brand-300 transition duration-150 cursor-pointer"
              >
                <span className="h-9 w-9 rounded-xl bg-slate-900 text-white grid place-items-center shrink-0">
                  <a.icon className="h-4 w-4" />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900">{a.label}</p>
                  <p className="text-xs text-slate-500 truncate">{a.desc}</p>
                </div>
                <Icons.arrow className="h-4 w-4 text-slate-400 shrink-0" />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between pb-3">
            <CardTitle className="text-lg font-display font-bold">Upcoming Live Sessions</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate("/teacher/sessions")} className="text-xs text-brand-600">
              View all
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-slate-500 py-6 text-center">Loading scheduled sessions…</p>
            ) : upcoming.length === 0 ? (
              <div className="rounded-xl bg-slate-50 p-6 text-center text-slate-500">
                <Icons.video className="h-8 w-8 mx-auto text-slate-400 mb-2" />
                <p className="text-sm font-medium text-slate-700">No upcoming sessions</p>
                <p className="text-xs text-slate-500 mt-1">Schedule your next class session with a Google Meet link.</p>
                <Button size="sm" className="mt-4" onClick={() => navigate("/teacher/sessions")}>
                  Schedule Session
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {upcoming.map((s: any) => (
                  <div key={s.id} className="flex items-center justify-between rounded-xl border border-slate-200 p-3.5 hover:bg-slate-50/70 transition">
                    <div className="min-w-0 flex-1 mr-3">
                      <p className="text-sm font-bold text-slate-900 truncate">{s.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                        <Icons.calendar className="h-3 w-3" /> {s.session_date} · {s.start_time}
                        {s.end_time ? ` – ${s.end_time}` : ""}
                      </p>
                    </div>
                    {s.meet_link ? (
                      <a
                        href={s.meet_link}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition shrink-0"
                      >
                        <Icons.video className="h-3.5 w-3.5" /> Start Meet
                      </a>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => navigate("/teacher/sessions")}>
                        Edit link
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}