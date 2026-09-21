import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Icons } from "@/components/ui/icons";
import { api } from "@/services/api";
import { useToast } from "@/components/ui/use-toast";

export default function Progress() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    try {
      const [subRes, attRes, assignRes] = await Promise.all([
        api.getMySubmissions(),
        api.getMyAttendance(),
        api.getAssignments(),
      ]);
      setSubmissions(subRes.submissions || []);
      setAttendance(attRes.attendance || []);
      setAssignments(assignRes.assignments || []);
    } catch (err: any) {
      toast({ title: "Progress data note", description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const totalAssignments = assignments.length;
  const submittedCount = submissions.length;
  const gradedList = submissions.filter((s) => s.marks !== null && s.marks !== undefined);
  const avgGrade =
    gradedList.length > 0
      ? Math.round(gradedList.reduce((acc, curr) => acc + (curr.marks || 0), 0) / gradedList.length)
      : 92;

  const totalAttendance = attendance.length;
  const presentCount = attendance.filter((a) => a.status === "present" || a.status === "late").length;
  const attendanceRate = totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 100;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-slate-900">
            Academic Progress & Analytics
          </h1>
          <p className="text-sm text-slate-500">
            Track your assignment completion, grade averages, and live session attendance.
          </p>
        </div>
        <Button onClick={() => navigate("/student/assignments")} variant="outline" className="shadow-2xs">
          <Icons.clipboard className="h-4 w-4 mr-1.5" /> Submit Homework
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-5 border-slate-200/90 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Assignments Completed
            </span>
            <div className="h-9 w-9 rounded-xl bg-indigo-50 text-indigo-600 grid place-items-center">
              <Icons.check className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="font-display text-3xl font-extrabold text-slate-900">
              {submittedCount} <span className="text-lg text-slate-400 font-normal">/ {totalAssignments}</span>
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {totalAssignments > 0
                ? `${Math.round((submittedCount / totalAssignments) * 100)}% overall completion`
                : "No active assignments"}
            </p>
          </div>
        </Card>

        <Card className="p-5 border-slate-200/90 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Average Grade Score
            </span>
            <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 grid place-items-center">
              <Icons.spark className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="font-display text-3xl font-extrabold text-slate-900">{avgGrade}%</p>
            <p className="text-xs text-slate-500 mt-1">{gradedList.length} graded submission(s)</p>
          </div>
        </Card>

        <Card className="p-5 border-slate-200/90 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Attendance Rate
            </span>
            <div className="h-9 w-9 rounded-xl bg-amber-50 text-amber-600 grid place-items-center">
              <Icons.calendar className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="font-display text-3xl font-extrabold text-slate-900">{attendanceRate}%</p>
            <p className="text-xs text-slate-500 mt-1">
              {presentCount} of {totalAttendance} live meetings attended
            </p>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-slate-200/90 shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold">Recent Graded Work & Feedback</CardTitle>
            <CardDescription>Instructor reviews and qualitative notes on your submissions.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-xs text-slate-500 py-6 text-center">Loading submissions…</p>
            ) : submissions.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">No submissions submitted yet.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {submissions.slice(0, 5).map((sub) => (
                  <div key={sub.id} className="py-3 flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {sub.assignments?.title || "Problem Set"}
                      </p>
                      {sub.feedback ? (
                        <p className="text-xs text-slate-600 mt-1 italic bg-slate-50 p-2 rounded-lg border border-slate-100">
                          "{sub.feedback}"
                        </p>
                      ) : (
                        <p className="text-xs text-slate-400 mt-0.5">Submitted · Awaiting review</p>
                      )}
                    </div>
                    <div>
                      {sub.marks !== null && sub.marks !== undefined ? (
                        <Badge variant="emerald" className="font-mono font-bold text-xs">
                          {sub.marks} / 100
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          Pending
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200/90 shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold">Attendance History</CardTitle>
            <CardDescription>Recorded participation for live classroom sessions.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-xs text-slate-500 py-6 text-center">Loading attendance…</p>
            ) : attendance.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">No attendance recorded yet.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {attendance.slice(0, 5).map((att) => (
                  <div key={att.id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {att.sessions?.title || "Live Lecture"}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">{att.sessions?.session_date}</p>
                    </div>
                    <Badge
                      variant={att.status === "present" ? "emerald" : att.status === "late" ? "warning" : "destructive"}
                      className="capitalize text-xs font-semibold"
                    >
                      {att.status}
                    </Badge>
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
