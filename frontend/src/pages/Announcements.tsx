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
}

interface AnnouncementItem {
  id: string;
  class_id: string;
  title: string;
  message: string;
  created_at: string;
}

export default function Announcements() {
  const { user } = useAuth();
  const { toast } = useToast();
  const isTeacher = user?.role === "teacher";

  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [items, setItems] = useState<AnnouncementItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ class_id: "", title: "", message: "" });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const [cRes, aRes] = await Promise.all([api.getClasses(), api.getAnnouncements()]);
      const classList = cRes.classes || [];
      setClasses(classList);
      setItems(aRes.announcements || []);
      if (classList.length > 0 && !form.class_id) {
        setForm((prev) => ({ ...prev, class_id: classList[0].id }));
      }
    } catch (err: any) {
      toast({ title: "Note", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.message.trim()) {
      toast({ title: "Please fill in title and message", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      await api.createAnnouncement(form);
      toast({ title: "Announcement Posted!", description: `${form.title} shared with class.` });
      setShowForm(false);
      setForm({ class_id: classes[0]?.id || "", title: "", message: "" });
      load();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const sorted = [...items].sort((a, b) => b.created_at.localeCompare(a.created_at));
  const className = (id: string) => classes.find((c) => c.id === id)?.name || "All Classes";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-slate-900">
            Class Announcements & Bulletins
          </h1>
          <p className="text-sm text-slate-500">
            {isTeacher
              ? "Post exam alerts, schedule changes, and reminders for your cohorts."
              : "Latest updates and critical notices from your instructors."}{" "}
            · <span className="font-semibold text-slate-700">{items.length} announcements</span>
          </p>
        </div>
        {isTeacher && (
          <Button
            onClick={() => {
              setForm({ class_id: classes[0]?.id || "", title: "", message: "" });
              setShowForm(!showForm);
            }}
            className="shadow-sm"
          >
            <Icons.plus className="h-4 w-4 mr-1.5" /> {showForm ? "Close Form" : "New Announcement"}
          </Button>
        )}
      </div>

      {showForm && (
        <Card className="border-amber-300 shadow-card bg-gradient-to-b from-amber-50/20 to-white animate-scale-in">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Publish Class Announcement</CardTitle>
            <CardDescription>Broadcast important news or deadline updates to students.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Target Class</Label>
                  <select
                    className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                    value={form.class_id}
                    onChange={(e) => setForm({ ...form, class_id: e.target.value })}
                  >
                    <option value="">All My Classes</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Headline / Title</Label>
                  <Input
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g. Midterm moved to next Friday"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Announcement Message</Label>
                <textarea
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="Provide full details, required preparation, or links…"
                  rows={4}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Posting…" : "Post Announcement"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
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
          <p className="text-sm">Loading announcements…</p>
        </div>
      ) : sorted.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="mx-auto h-12 w-12 rounded-2xl bg-amber-50 text-amber-600 grid place-items-center mb-3">
              <Icons.megaphone className="h-6 w-6" />
            </div>
            <p className="font-display font-bold text-slate-900 text-lg">No announcements posted</p>
            <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
              {isTeacher
                ? "Click 'New Announcement' to broadcast an update to your students."
                : "You're all caught up with your courses."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sorted.map((a) => (
            <Card key={a.id} className="border-slate-200/90 hover:shadow-card transition duration-200">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-700 grid place-items-center shrink-0 shadow-2xs">
                      <Icons.megaphone className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-base text-slate-900 leading-snug">
                        {a.title}
                      </h3>
                      <p className="text-sm text-slate-700 mt-1.5 leading-relaxed whitespace-pre-wrap">
                        {a.message}
                      </p>
                      <p className="mt-3 text-xs text-slate-400 flex items-center gap-1.5">
                        <Icons.calendar className="h-3 w-3" />
                        {new Date(a.created_at).toLocaleString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                  <Badge variant="slate" className="text-xs shrink-0 truncate max-w-[160px]">
                    {className(a.class_id)}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}