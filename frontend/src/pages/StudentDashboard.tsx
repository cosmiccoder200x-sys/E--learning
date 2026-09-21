import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icons";
import { api } from "@/services/api";

interface Cls {
  id: string;
  name: string;
  subject: string;
  description?: string;
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [enrolled, setEnrolled] = useState<Cls[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStudentDashboard();
  }, []);

  const loadStudentDashboard = async () => {
    try {
      const [cRes, sRes, subRes, attRes] = await Promise.all([
        api.getClasses(),
        api.getSessions(),
        api.getMySubmissions(),
        api.getMyAttendance(),
      ]);
      setEnrolled(cRes.classes || []);
      setSessions(sRes.sessions || []);
      setSubmissions(subRes.submissions || []);
      setAttendance(attRes.attendance || []);
    } catch {}
    finally {
      setLoading(false);
    }
  };

  const nextSession = sessions[0];
  const gradedList = submissions.filter((s) => s.marks !== null && s.marks !== undefined);
  const avgGrade =
    gradedList.length > 0
      ? Math.round(gradedList.reduce((acc, curr) => acc + (curr.marks || 0), 0) / gradedList.length)
      : 92;

  const totalAtt = attendance.length;
  const presentCount = attendance.filter((a) => a.status === "present" || a.status === "late").length;
  const attRate = totalAtt > 0 ? Math.round((presentCount / totalAtt) * 100) : 100;

  return (
    <div className="space-y-6">
      <div className="rounded-[24px] bg-gradient-to-br from-brand-600 via-indigo-600 to-violet-700 p-6 md:p-8 text-white shadow-card">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-white/80 bg-white/10 px-2.5 py-1 rounded-full">
              Student Workspace
            </span>
            <h1 className="mt-3 font-display text-2xl md:text-[32px] font-extrabold leading-tight">
              Good morning, {user?.name?.split(" ")[0]} 👋
            </h1>
            <p className="mt-2 text-sm text-white/85 max-w-[560px] leading-relaxed">
              Your courses, upcoming live lectures, assignments, and grades in one organized view.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              className="bg-white text-slate-900 hover:bg-slate-100 font-semibold shadow-sm"
              onClick={() => navigate("/student/assignments")}
            >
              <Icons.clipboard className="h-4 w-4 mr-1.5" /> View Assignments
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card
          className="hover:shadow-card hover:border-brand-200 transition duration-200 cursor-pointer"
          onClick={() => navigate("/student/class")}
        >
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Enrolled Classes</p>
              <span className="h-8 w-8 rounded-lg bg-brand-50 text-brand-700 grid place-items-center">
                <Icons.book className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-2 font-display text-3xl font-extrabold text-slate-900">{enrolled.length}</p>
            <p className="text-xs text-slate-500 mt-0.5 flex items-center justify-between">
              <span>View subjects & materials</span>
              <Icons.arrow className="h-3.5 w-3.5 text-slate-400" />
            </p>
          </CardContent>
        </Card>

        <Card
          className="hover:shadow-card hover:border-indigo-200 transition duration-200 cursor-pointer"
          onClick={() => navigate("/student/sessions")}
        >
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Next Live Class</p>
              <span className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-700 grid place-items-center">
                <Icons.video className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-2 font-display text-base font-bold text-slate-900 truncate">
              {nextSession?.title || "No sessions scheduled"}
            </p>
            <p className="text-xs text-slate-500 mt-0.5 flex items-center justify-between">
              <span>{nextSession ? `${nextSession.session_date} · ${nextSession.start_time}` : "Check back later"}</span>
              <Icons.arrow className="h-3.5 w-3.5 text-slate-400" />
            </p>
          </CardContent>
        </Card>

        <Card
          className="hover:shadow-card hover:border-emerald-200 transition duration-200 cursor-pointer"
          onClick={() => navigate("/student/progress")}
        >
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Academic Grade</p>
              <span className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-700 grid place-items-center">
                <Icons.spark className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-2 font-display text-3xl font-extrabold text-slate-900">{avgGrade}%</p>
            <p className="text-xs text-slate-500 mt-0.5 flex items-center justify-between">
              <span>{attRate}% attendance rate</span>
              <Icons.arrow className="h-3.5 w-3.5 text-slate-400" />
            </p>
          </CardContent>
        </Card>
      </div>

      {nextSession && (
        <Card className="overflow-hidden border-indigo-200 bg-gradient-to-r from-indigo-50/40 via-white to-white">
          <div className="h-1 bg-gradient-to-r from-indigo-600 to-violet-600" />
          <CardContent className="p-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-700">Upcoming Live Class</span>
              <h3 className="text-lg font-bold text-slate-900 mt-0.5">{nextSession.title}</h3>
              <p className="text-xs text-slate-600 mt-1 flex items-center gap-2">
                <Icons.calendar className="h-3.5 w-3.5 text-indigo-600" />
                {nextSession.session_date} at {nextSession.start_time}
                {nextSession.end_time ? ` – ${nextSession.end_time}` : ""}
              </p>
            </div>
            <div className="flex gap-2">
              {nextSession.meet_link ? (
                <a href={nextSession.meet_link} target="_blank" rel="noreferrer">
                  <Button className="font-semibold shadow-sm">
                    <Icons.video className="h-4 w-4 mr-1.5" /> Join Google Meet
                  </Button>
                </a>
              ) : (
                <Button onClick={() => navigate("/student/sessions")}>View Schedule</Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card>
          <CardHeader className="flex-row items-center justify-between pb-3">
            <CardTitle className="text-lg font-display font-bold">Your Enrolled Courses</CardTitle>
            <Badge variant="slate">{enrolled.length} classes</Badge>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-slate-500 py-6 text-center">Loading classes…</p>
            ) : enrolled.length === 0 ? (
              <p className="rounded-xl bg-slate-50 p-6 text-center text-sm text-slate-500">
                You are not enrolled in any classes yet.
              </p>
            ) : (
              <div className="grid gap-3">
                {enrolled.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => navigate("/student/class")}
                    className="flex items-center justify-between rounded-xl border border-slate-200/80 p-3.5 hover:bg-slate-50 hover:border-brand-300 transition duration-150 cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-brand-50 text-brand-700 grid place-items-center shrink-0">
                        <Icons.book className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{c.name}</p>
                        <p className="text-xs text-slate-500">{c.subject}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="text-xs text-brand-600">
                      Open <Icons.arrow className="h-3.5 w-3.5 ml-1" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-display font-bold">Quick Navigation</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2.5">
            {[
              { label: "Course Materials", to: "/student/materials", icon: Icons.file, desc: "Download lecture notes and study guides" },
              { label: "Submit Assignments", to: "/student/assignments", icon: Icons.clipboard, desc: "Upload problem sets and view marks" },
              { label: "Live Sessions", to: "/student/sessions", icon: Icons.video, desc: "Google Meet schedule and active classes" },
              { label: "My Progress & Grades", to: "/student/progress", icon: Icons.spark, desc: "Detailed breakdown of test scores" },
              { label: "Class Announcements", to: "/student/announcements", icon: Icons.megaphone, desc: "Latest alerts from your instructors" },
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
      </div>
    </div>
  );
}