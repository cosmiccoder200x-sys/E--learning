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

interface AssignmentItem {
  id: string;
  class_id: string;
  title: string;
  description: string;
  due_date: string;
  attachment_url: string;
  created_at: string;
}

interface SubmissionItem {
  id: string;
  assignment_id: string;
  student_id: string;
  file_url: string;
  text_answer: string;
  submitted_at: string;
  marks: number | null;
  feedback: string;
  profiles?: { name: string; email?: string };
}

const emptyCreate = {
  class_id: "",
  title: "",
  description: "",
  due_date: new Date(Date.now() + 3 * 86400000).toISOString().split("T")[0],
  attachment_url: "",
};

const emptySubmit = { file_url: "", text_answer: "" };

export default function Assignments() {
  const { user } = useAuth();
  const { toast } = useToast();
  const isTeacher = user?.role === "teacher";

  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [mySubs, setMySubs] = useState<SubmissionItem[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ ...emptyCreate });
  const [submitForm, setSubmitForm] = useState({ ...emptySubmit });
  const [submittingFor, setSubmittingFor] = useState("");
  const [subsByAssignment, setSubsByAssignment] = useState<Record<string, SubmissionItem[]>>({});
  const [viewingSubs, setViewingSubs] = useState("");
  const [gradeInputs, setGradeInputs] = useState<Record<string, { marks: string; feedback: string }>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [cRes, aRes] = await Promise.all([api.getClasses(), api.getAssignments()]);
      const classList = cRes.classes || [];
      setClasses(classList);
      setAssignments(aRes.assignments || []);
      if (classList.length > 0 && !createForm.class_id) {
        setCreateForm((prev) => ({ ...prev, class_id: classList[0].id }));
      }

      if (!isTeacher) {
        try {
          const m = await api.getMySubmissions();
          setMySubs(m.submissions || []);
        } catch {}
      }
    } catch (err: any) {
      toast({ title: "Note", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.title.trim() || !createForm.class_id) {
      toast({ title: "Please fill required fields", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      await api.createAssignment(createForm);
      toast({ title: "Assignment Published!", description: `${createForm.title} posted.` });
      setShowCreate(false);
      setCreateForm({ ...emptyCreate, class_id: classes[0]?.id || "" });
      loadData();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Delete assignment "${title}"?`)) return;
    try {
      await api.deleteAssignment(id);
      toast({ title: "Assignment Deleted", description: `"${title}" removed.` });
      loadData();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleSubmitWork = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submittingFor) return;
    if (!submitForm.text_answer.trim() && !submitForm.file_url.trim()) {
      toast({ title: "Please provide an answer or file link", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      await api.submitAssignment(submittingFor, submitForm);
      toast({ title: "Assignment Submitted!", description: "Your teacher has received your work." });
      setSubmittingFor("");
      setSubmitForm({ ...emptySubmit });
      loadData();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const loadSubmissionsForAssignment = async (aid: string) => {
    if (viewingSubs === aid) {
      setViewingSubs("");
      return;
    }
    try {
      const d = await api.getSubmissions();
      const list = (d.submissions || []).filter((s: any) => s.assignment_id === aid);
      setSubsByAssignment((p) => ({ ...p, [aid]: list }));
      setViewingSubs(aid);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleGrade = async (sid: string) => {
    const inp = gradeInputs[sid];
    if (!inp || !inp.marks) {
      toast({ title: "Please enter a grade score", variant: "destructive" });
      return;
    }
    try {
      await api.gradeSubmission(sid, {
        marks: Number(inp.marks),
        feedback: inp.feedback || "",
      });
      toast({ title: "Grade Saved!", description: `Score: ${inp.marks}/100 with feedback.` });
      if (viewingSubs) {
        const d = await api.getSubmissions();
        const list = (d.submissions || []).filter((s: any) => s.assignment_id === viewingSubs);
        setSubsByAssignment((p) => ({ ...p, [viewingSubs]: list }));
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const className = (id: string) => classes.find((c) => c.id === id)?.name || "Course";
  const mySubFor = (aid: string) => mySubs.find((s) => s.assignment_id === aid);
  const sorted = [...assignments].sort((a, b) => b.created_at.localeCompare(a.created_at));

  const dueTone = (d: string) => {
    if (!d) return "slate";
    const diff = (new Date(d).getTime() - Date.now()) / 86400000;
    if (diff < 0) return "destructive";
    if (diff < 2) return "warning";
    return "brand";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-slate-900">
            Assignments & Gradebook
          </h1>
          <p className="text-sm text-slate-500">
            {isTeacher
              ? "Create problem sets, review submissions, and provide scores & qualitative feedback."
              : "Submit your coursework, track due dates, and view instructor reviews."}{" "}
            · <span className="font-semibold text-slate-700">{assignments.length} assignments</span>
          </p>
        </div>
        {isTeacher && (
          <Button
            onClick={() => {
              setCreateForm({ ...emptyCreate, class_id: classes[0]?.id || "" });
              setShowCreate(!showCreate);
            }}
            className="shadow-sm"
          >
            <Icons.plus className="h-4 w-4 mr-1.5" /> {showCreate ? "Close Form" : "New Assignment"}
          </Button>
        )}
      </div>

      {showCreate && (
        <Card className="border-amber-300 shadow-card bg-gradient-to-b from-amber-50/20 to-white animate-scale-in">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Publish New Assignment</CardTitle>
            <CardDescription>Assign coursework, specify instructions, and set a due date.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Class</Label>
                  <select
                    className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                    value={createForm.class_id}
                    onChange={(e) => setCreateForm({ ...createForm, class_id: e.target.value })}
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
                  <Label>Assignment Title</Label>
                  <Input
                    value={createForm.title}
                    onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                    placeholder="e.g. Problem Set 4: Harmonic Oscillators"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Instructions / Description</Label>
                <textarea
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  placeholder="Detailed guidelines, question numbers, and submission requirements…"
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Due Date</Label>
                  <Input
                    type="date"
                    value={createForm.due_date}
                    onChange={(e) => setCreateForm({ ...createForm, due_date: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Attachment / Prompt URL (Optional)</Label>
                  <Input
                    value={createForm.attachment_url}
                    onChange={(e) => setCreateForm({ ...createForm, attachment_url: e.target.value })}
                    placeholder="https://example.com/handout.pdf"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Publishing…" : "Publish Assignment"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>
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
          <p className="text-sm">Loading assignments…</p>
        </div>
      ) : sorted.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="mx-auto h-12 w-12 rounded-2xl bg-amber-50 text-amber-600 grid place-items-center mb-3">
              <Icons.clipboard className="h-6 w-6" />
            </div>
            <p className="font-display font-bold text-slate-900 text-lg">No assignments posted</p>
            <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
              {isTeacher
                ? "Click 'New Assignment' to post problem sets or homework."
                : "Your instructors haven't posted any homework assignments yet."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {sorted.map((a) => {
            const mySub = mySubFor(a.id);
            const subsList = subsByAssignment[a.id] || [];

            return (
              <Card
                key={a.id}
                className="overflow-hidden border-slate-200/90 hover:shadow-lift transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between px-5 pt-4">
                    <Badge variant={dueTone(a.due_date) as any}>
                      {a.due_date
                        ? `Due ${new Date(`${a.due_date}T00:00:00`).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                          })}`
                        : "No deadline"}
                    </Badge>
                    <span className="text-xs text-slate-500 font-medium truncate max-w-[140px]">
                      {className(a.class_id)}
                    </span>
                  </div>

                  <CardContent className="p-5 pt-3">
                    <h3 className="font-display font-bold text-base text-slate-900 leading-snug">
                      {a.title}
                    </h3>
                    {a.description && (
                      <p className="mt-1.5 text-xs text-slate-600 line-clamp-3 leading-relaxed">
                        {a.description}
                      </p>
                    )}
                    {a.attachment_url && (
                      <a
                        href={a.attachment_url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2.5 inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:underline"
                      >
                        <Icons.file className="h-3.5 w-3.5" /> View Handout Attachment →
                      </a>
                    )}
                  </CardContent>
                </div>

                <div className="p-5 pt-0 border-t border-slate-100 mt-3 pt-3">
                  {isTeacher ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs font-medium"
                          onClick={() => loadSubmissionsForAssignment(a.id)}
                        >
                          {viewingSubs === a.id ? "Hide Submissions" : "Review Submissions"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs text-rose-600 hover:bg-rose-50"
                          onClick={() => handleDelete(a.id, a.title)}
                        >
                          Delete
                        </Button>
                      </div>

                      {viewingSubs === a.id && (
                        <div className="space-y-3 pt-2 border-t border-slate-100 animate-scale-in">
                          <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                            Student Submissions ({subsList.length})
                          </p>
                          {subsList.length === 0 ? (
                            <p className="rounded-xl bg-slate-50 p-3 text-xs text-slate-500 italic">
                              No submissions received for this assignment yet.
                            </p>
                          ) : (
                            subsList.map((s) => {
                              const g = gradeInputs[s.id] || {
                                marks: s.marks !== null ? String(s.marks) : "",
                                feedback: s.feedback || "",
                              };
                              return (
                                <div
                                  key={s.id}
                                  className="rounded-xl border border-slate-200 bg-slate-50/50 p-3 space-y-2"
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-900">
                                      {s.profiles?.name || "Student"}
                                    </span>
                                    {s.marks !== null ? (
                                      <Badge variant="emerald" className="text-xs font-mono font-bold">
                                        {s.marks}/100
                                      </Badge>
                                    ) : (
                                      <Badge variant="warning" className="text-xs">
                                        Needs Grading
                                      </Badge>
                                    )}
                                  </div>

                                  {s.text_answer && (
                                    <div className="rounded-lg bg-white p-2.5 text-xs text-slate-700 border border-slate-200/70">
                                      {s.text_answer}
                                    </div>
                                  )}

                                  {s.file_url && (
                                    <a
                                      href={s.file_url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="inline-flex items-center gap-1 text-[11px] font-medium text-brand-600 hover:underline"
                                    >
                                      <Icons.file className="h-3 w-3" /> Submitted File
                                    </a>
                                  )}

                                  <div className="flex gap-2 pt-1">
                                    <Input
                                      placeholder="Marks (0-100)"
                                      type="number"
                                      className="w-24 h-8 text-xs"
                                      value={g.marks}
                                      onChange={(e) =>
                                        setGradeInputs({
                                          ...gradeInputs,
                                          [s.id]: { ...g, marks: e.target.value },
                                        })
                                      }
                                    />
                                    <Input
                                      placeholder="Teacher feedback…"
                                      className="flex-1 h-8 text-xs"
                                      value={g.feedback}
                                      onChange={(e) =>
                                        setGradeInputs({
                                          ...gradeInputs,
                                          [s.id]: { ...g, feedback: e.target.value },
                                        })
                                      }
                                    />
                                    <Button size="sm" className="h-8 text-xs" onClick={() => handleGrade(s.id)}>
                                      Grade
                                    </Button>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      {mySub ? (
                        <div className="rounded-xl bg-slate-50 p-3 text-xs border border-slate-200/80 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-600">
                              Submitted {new Date(mySub.submitted_at).toLocaleDateString()}
                            </span>
                            {mySub.marks !== null ? (
                              <Badge variant="emerald" className="font-mono font-bold">
                                {mySub.marks} / 100
                              </Badge>
                            ) : (
                              <Badge variant="outline">Awaiting Grade</Badge>
                            )}
                          </div>
                          {mySub.feedback && (
                            <p className="text-slate-700 font-medium pt-1 italic">
                              Teacher feedback: "{mySub.feedback}"
                            </p>
                          )}
                        </div>
                      ) : submittingFor === a.id ? (
                        <form onSubmit={handleSubmitWork} className="space-y-2 animate-scale-in">
                          <textarea
                            value={submitForm.text_answer}
                            onChange={(e) =>
                              setSubmitForm({ ...submitForm, text_answer: e.target.value })
                            }
                            placeholder="Type your solution or text answer here…"
                            rows={3}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                            required
                          />
                          <Input
                            value={submitForm.file_url}
                            onChange={(e) =>
                              setSubmitForm({ ...submitForm, file_url: e.target.value })
                            }
                            placeholder="File URL / Google Drive link (Optional)"
                            className="text-xs h-8"
                          />
                          <div className="flex gap-2">
                            <Button type="submit" size="sm" className="text-xs" disabled={submitting}>
                              {submitting ? "Submitting…" : "Turn In Work"}
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="text-xs"
                              onClick={() => {
                                setSubmittingFor("");
                                setSubmitForm({ ...emptySubmit });
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </form>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full font-semibold text-xs hover:bg-brand-50 hover:text-brand-700 hover:border-brand-200"
                          onClick={() => setSubmittingFor(a.id)}
                        >
                          <Icons.clipboard className="h-3.5 w-3.5 mr-1 text-brand-600" /> Submit Homework
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}