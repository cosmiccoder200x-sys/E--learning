import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Icons } from "@/components/ui/icons";
import { api } from "@/services/api";
import { useToast } from "@/components/ui/use-toast";

interface ClassItem {
  id: string;
  name: string;
  subject: string;
}

interface SessionItem {
  id: string;
  class_id: string;
  title: string;
  description: string;
  session_date: string;
  start_time: string;
  end_time: string;
  meet_link: string;
  created_at: string;
}

const emptyForm = {
  class_id: "",
  title: "",
  description: "",
  session_date: new Date().toISOString().split("T")[0],
  start_time: "10:00",
  end_time: "11:00",
  meet_link: "https://meet.google.com/new",
};

export default function Sessions() {
  const { user } = useAuth();
  const { toast } = useToast();
  const isTeacher = user?.role === "teacher";

  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<SessionItem | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [cRes, sRes] = await Promise.all([api.getClasses(), api.getSessions()]);
      const classList = cRes.classes || [];
      setClasses(classList);
      setSessions(sRes.sessions || []);
      if (classList.length > 0 && !form.class_id) {
        setForm((prev) => ({ ...prev, class_id: classList[0].id }));
      }
    } catch (err: any) {
      toast({ title: "Note", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.class_id) {
      toast({ title: "Please fill required fields", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      if (editing) {
        await api.updateSession(editing.id, form);
        toast({ title: "Session Updated", description: `${form.title} has been updated.` });
      } else {
        await api.createSession(form);
        toast({ title: "Session Scheduled!", description: `${form.title} scheduled for ${form.session_date}.` });
      }
      setShowForm(false);
      setEditing(null);
      setForm({ ...emptyForm, class_id: classes[0]?.id || "" });
      loadData();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (s: SessionItem) => {
    setEditing(s);
    setForm({
      class_id: s.class_id,
      title: s.title,
      description: s.description || "",
      session_date: s.session_date,
      start_time: s.start_time,
      end_time: s.end_time || "",
      meet_link: s.meet_link || "https://meet.google.com/new",
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Delete session "${title}"?`)) return;
    try {
      await api.deleteSession(id);
      toast({ title: "Session Deleted", description: `"${title}" removed.` });
      loadData();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const fmtDate = (d: string) => {
    try {
      return new Date(`${d}T00:00:00`).toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
    } catch {
      return d;
    }
  };

  const className = (id: string) => classes.find((c) => c.id === id)?.name || "Class";
  const sorted = [...sessions].sort((a, b) =>
    `${b.session_date} ${b.start_time}`.localeCompare(`${a.session_date} ${a.start_time}`)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-slate-900">
            Live Video Sessions
          </h1>
          <p className="text-sm text-slate-500">
            {isTeacher
              ? "Schedule Google Meet lectures and live office hours."
              : "Join live class video meetings in one click."}{" "}
            · <span className="font-semibold text-slate-700">{sessions.length} sessions</span>
          </p>
        </div>
        {isTeacher && (
          <Button
            onClick={() => {
              setEditing(null);
              setForm({ ...emptyForm, class_id: classes[0]?.id || "" });
              setShowForm(!showForm);
            }}
            className="shadow-sm"
          >
            <Icons.plus className="h-4 w-4 mr-1.5" /> {showForm ? "Close Form" : "Schedule Session"}
          </Button>
        )}
      </div>

      {showForm && (
        <Card className="border-indigo-300 shadow-card bg-gradient-to-b from-indigo-50/20 to-white animate-scale-in">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">
              {editing ? "Edit Scheduled Session" : "Schedule New Live Session"}
            </CardTitle>
            <CardDescription>Configure lecture timing and Google Meet video link.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Associated Class</Label>
                  <select
                    className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                    value={form.class_id}
                    onChange={(e) => setForm({ ...form, class_id: e.target.value })}
                    required
                  >
                    <option value="">Select class</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} · {c.subject}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Session Title</Label>
                  <Input
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g. Chapter 4: Resonance and Doppler Shift"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description / Agenda (Optional)</Label>
                <Input
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="What topics or exercises will be covered?"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={form.session_date}
                    onChange={(e) => setForm({ ...form, session_date: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Start Time</Label>
                  <Input
                    type="time"
                    value={form.start_time}
                    onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Time</Label>
                  <Input
                    type="time"
                    value={form.end_time}
                    onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Google Meet Link</Label>
                <div className="flex gap-2">
                  <Input
                    value={form.meet_link}
                    onChange={(e) => setForm({ ...form, meet_link: e.target.value })}
                    placeholder="https://meet.google.com/xxx-yyyy-zzz"
                    required
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      setForm({
                        ...form,
                        meet_link: `https://meet.google.com/${Math.random().toString(36).substring(2, 5)}-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 5)}`,
                      })
                    }
                  >
                    Generate
                  </Button>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Saving…" : editing ? "Update Session" : "Schedule Live Session"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setEditing(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="py-12 text-center text-slate-500">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent mx-auto mb-2" />
          <p className="text-sm">Loading sessions…</p>
        </div>
      ) : sorted.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="mx-auto h-12 w-12 rounded-2xl bg-indigo-50 text-indigo-600 grid place-items-center mb-3">
              <Icons.video className="h-6 w-6" />
            </div>
            <p className="font-display font-bold text-slate-900 text-lg">No sessions scheduled</p>
            <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
              {isTeacher
                ? "Click 'Schedule Session' above to create a live Google Meet class."
                : "Your instructors haven't scheduled live sessions yet."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {sorted.map((s) => (
            <Card
              key={s.id}
              className="overflow-hidden border-slate-200/90 hover:shadow-lift transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between px-5 pt-4">
                  <Badge variant="brand" className="font-medium">
                    {fmtDate(s.session_date)}
                  </Badge>
                  <span className="text-xs text-slate-500 font-medium truncate max-w-[140px]">
                    {className(s.class_id)}
                  </span>
                </div>
                <CardContent className="p-5 pt-3">
                  <h3 className="font-display font-bold text-base text-slate-900 leading-snug">
                    {s.title}
                  </h3>
                  {s.description && (
                    <p className="mt-1.5 text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {s.description}
                    </p>
                  )}
                  <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                    <Icons.calendar className="h-3.5 w-3.5 text-indigo-600" />
                    {s.start_time}
                    {s.end_time ? ` – ${s.end_time}` : ""}
                  </div>
                </CardContent>
              </div>

              <div className="p-5 pt-0 border-t border-slate-100 mt-3 pt-3">
                {isTeacher ? (
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="text-xs" onClick={() => startEdit(s)}>
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-rose-600 hover:bg-rose-50"
                        onClick={() => handleDelete(s.id, s.title)}
                      >
                        Delete
                      </Button>
                    </div>
                    {s.meet_link && (
                      <a href={s.meet_link} target="_blank" rel="noreferrer">
                        <Button size="sm" className="text-xs bg-indigo-600 hover:bg-indigo-700">
                          <Icons.video className="h-3.5 w-3.5 mr-1" /> Start
                        </Button>
                      </a>
                    )}
                  </div>
                ) : s.meet_link ? (
                  <a href={s.meet_link} target="_blank" rel="noreferrer" className="block">
                    <Button className="w-full font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs">
                      <Icons.video className="h-4 w-4 mr-1.5" /> Join Google Meet
                    </Button>
                  </a>
                ) : (
                  <div className="rounded-xl bg-slate-50 py-2 text-center text-xs text-slate-500">
                    Meet link pending
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}