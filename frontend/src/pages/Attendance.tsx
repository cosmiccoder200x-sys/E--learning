import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Icons } from "@/components/ui/icons";
import { api } from "@/services/api";
import { useToast } from "@/components/ui/use-toast";

interface SessionItem {
  id: string;
  class_id: string;
  title: string;
  session_date: string;
  start_time: string;
}

interface StudentItem {
  student_id: string;
  profiles?: {
    id: string;
    name: string;
    email: string;
  };
  name?: string;
  email?: string;
}

interface AttendanceRecord {
  id: string;
  session_id: string;
  student_id: string;
  status: "present" | "absent" | "late";
  marked_at: string;
  profiles?: {
    name: string;
    email: string;
  };
  sessions?: {
    title: string;
    session_date: string;
  };
}

export default function Attendance() {
  const { user } = useAuth();
  const { toast } = useToast();
  const isTeacher = user?.role === "teacher";

  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isTeacher) {
      loadTeacherSessions();
    } else {
      loadStudentAttendance();
    }
  }, [isTeacher]);

  useEffect(() => {
    if (isTeacher && selectedSessionId) {
      loadSessionAttendance(selectedSessionId);
    }
  }, [selectedSessionId]);

  const loadTeacherSessions = async () => {
    try {
      const res = await api.getSessions();
      const list = res.sessions || [];
      setSessions(list);
      if (list.length > 0) {
        setSelectedSessionId(list[0].id);
      }
    } catch (err: any) {
      toast({ title: "Note", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const loadSessionAttendance = async (sessionId: string) => {
    setLoading(true);
    try {
      const session = sessions.find((s) => s.id === sessionId);
      const [attRes, stdRes] = await Promise.all([
        api.getAttendance(sessionId),
        session ? api.getClassStudents(session.class_id) : Promise.resolve({ students: [] }),
      ]);
      setRecords(attRes.attendance || []);
      setStudents(stdRes.students || []);
    } catch (err: any) {
      toast({ title: "Note", description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const loadStudentAttendance = async () => {
    setLoading(true);
    try {
      const res = await api.getMyAttendance();
      setRecords(res.attendance || []);
    } catch (err: any) {
      toast({ title: "Note", description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleMark = async (studentId: string, status: "present" | "absent" | "late") => {
    if (!selectedSessionId) return;
    try {
      await api.markAttendance({
        session_id: selectedSessionId,
        student_id: studentId,
        status,
      });
      toast({ title: "Attendance Saved", description: `Marked student as ${status}.` });
      loadSessionAttendance(selectedSessionId);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const totalSessions = records.length;
  const presentSessions = records.filter((r) => r.status === "present" || r.status === "late").length;
  const rate = totalSessions > 0 ? Math.round((presentSessions / totalSessions) * 100) : 100;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-slate-900">
            Attendance Tracking
          </h1>
          <p className="text-sm text-slate-500">
            {isTeacher
              ? "Mark live session participation for enrolled student cohorts."
              : "Review your class session attendance and participation rate."}
          </p>
        </div>
        {!isTeacher && (
          <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 shadow-2xs">
            <span className="text-xs text-slate-500 font-medium">Overall Rate:</span>
            <span className="font-display font-bold text-sm text-emerald-700">{rate}%</span>
          </div>
        )}
      </div>

      {isTeacher ? (
        <div className="space-y-6">
          <Card className="border-slate-200/90 shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold">1. Select Live Session</CardTitle>
              <CardDescription>Choose a scheduled session to view or record roster attendance.</CardDescription>
            </CardHeader>
            <CardContent>
              {sessions.length === 0 ? (
                <p className="text-xs text-slate-500 py-2">
                  No sessions created yet. Schedule a session first to record attendance.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {sessions.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSelectedSessionId(s.id)}
                      className={`rounded-xl border px-3.5 py-2 text-xs font-semibold transition-all ${
                        selectedSessionId === s.id
                          ? "border-brand-600 bg-brand-50 text-brand-900 ring-1 ring-brand-500 shadow-2xs"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <span>{s.title}</span>
                      <span className="ml-1.5 opacity-70 font-normal">({s.session_date})</span>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {selectedSessionId && (
            <Card className="border-slate-200/90 shadow-card">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-bold">2. Enrolled Students Attendance</CardTitle>
                    <CardDescription>Click a status button to record attendance in real time.</CardDescription>
                  </div>
                  <Badge variant="brand" className="text-xs font-semibold">
                    {students.length} Students
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-xs text-slate-500 py-6 text-center">Loading roster data…</p>
                ) : students.length === 0 ? (
                  <p className="rounded-xl bg-slate-50 p-6 text-center text-xs text-slate-500">
                    No students currently enrolled in this session's class. Add students from the Classes tab.
                  </p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {students.map((st) => {
                      const studentId = (st as any).student_id || (st as any).id;
                      const profileName = st.profiles?.name || st.name || "Student";
                      const profileEmail = st.profiles?.email || st.email || "";
                      const rec = records.find((r) => r.student_id === studentId);
                      const currentStatus = rec?.status;

                      return (
                        <div
                          key={studentId}
                          className="flex flex-wrap items-center justify-between gap-4 py-3 hover:bg-slate-50/60 transition px-2 rounded-xl"
                        >
                          <div className="flex items-center gap-3">
                            <span className="h-8 w-8 rounded-full bg-slate-900 text-white grid place-items-center text-xs font-bold shrink-0">
                              {profileName[0]?.toUpperCase()}
                            </span>
                            <div>
                              <p className="text-sm font-semibold text-slate-900">{profileName}</p>
                              <p className="text-xs text-slate-500">{profileEmail}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {(["present", "late", "absent"] as const).map((stt) => {
                              const isSelected = currentStatus === stt;
                              let btnClass = "border-slate-200 text-slate-700 bg-white hover:bg-slate-50";
                              if (isSelected) {
                                if (stt === "present") btnClass = "bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700";
                                if (stt === "late") btnClass = "bg-amber-600 text-white border-amber-600 hover:bg-amber-700";
                                if (stt === "absent") btnClass = "bg-rose-600 text-white border-rose-600 hover:bg-rose-700";
                              }

                              return (
                                <Button
                                  key={stt}
                                  size="sm"
                                  variant="outline"
                                  className={`capitalize text-xs h-8 px-3 transition-all ${btnClass}`}
                                  onClick={() => handleMark(studentId, stt)}
                                >
                                  {stt === "present" && "✓ "}
                                  {stt}
                                </Button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <Card className="border-slate-200/90 shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold">Your Live Session Attendance</CardTitle>
            <CardDescription>Complete log of recorded sessions and presence status.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-xs text-slate-500 py-6 text-center">Loading your records…</p>
            ) : records.length === 0 ? (
              <div className="py-12 text-center text-slate-500">
                <Icons.calendar className="mx-auto h-8 w-8 text-slate-400 mb-2" />
                <p className="text-sm font-medium text-slate-700">No attendance records found</p>
                <p className="text-xs text-slate-500 mt-1">Your instructor will mark attendance during live lectures.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {records.map((r) => (
                  <div key={r.id} className="flex items-center justify-between py-3.5">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{r.sessions?.title || "Class Session"}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{r.sessions?.session_date}</p>
                    </div>
                    <Badge
                      variant={r.status === "present" ? "emerald" : r.status === "late" ? "warning" : "destructive"}
                      className="capitalize text-xs font-semibold"
                    >
                      {r.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
