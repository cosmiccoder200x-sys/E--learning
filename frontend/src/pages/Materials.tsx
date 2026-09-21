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

interface MaterialItem {
  id: string;
  class_id: string;
  title: string;
  description: string;
  file_url: string;
  file_name: string;
  created_at: string;
}

const emptyForm = {
  class_id: "",
  title: "",
  description: "",
  file_url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
  file_name: "lecture_slides.pdf",
};

export default function Materials() {
  const { user } = useAuth();
  const { toast } = useToast();
  const isTeacher = user?.role === "teacher";

  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [cRes, mRes] = await Promise.all([api.getClasses(), api.getMaterials()]);
      const classList = cRes.classes || [];
      setClasses(classList);
      setMaterials(mRes.materials || []);
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
      await api.uploadMaterial(form);
      toast({ title: "Material Uploaded!", description: `${form.title} shared with class.` });
      setShowForm(false);
      setForm({ ...emptyForm, class_id: classes[0]?.id || "" });
      loadData();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Delete material "${title}"?`)) return;
    try {
      await api.deleteMaterial(id);
      toast({ title: "Material Deleted", description: `"${title}" removed.` });
      loadData();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const className = (id: string) => classes.find((c) => c.id === id)?.name || "Course Material";
  const sorted = [...materials].sort((a, b) => b.created_at.localeCompare(a.created_at));

  const fileIcon = (name: string) => {
    const ext = name.split(".").pop()?.toLowerCase();
    if (ext === "pdf") return "📄 PDF";
    if (ext === "pptx" || ext === "ppt") return "📊 Slides";
    if (ext === "mp4" || ext === "mov") return "🎬 Video";
    if (ext === "docx" || ext === "doc") return "📝 Doc";
    return "📎 File";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-slate-900">
            Course Materials & Resources
          </h1>
          <p className="text-sm text-slate-500">
            {isTeacher
              ? "Upload syllabus, lecture slide decks, and study guides for your classes."
              : "Download notes, reading material, and lecture resources."}{" "}
            · <span className="font-semibold text-slate-700">{materials.length} files</span>
          </p>
        </div>
        {isTeacher && (
          <Button
            onClick={() => {
              setForm({ ...emptyForm, class_id: classes[0]?.id || "" });
              setShowForm(!showForm);
            }}
            className="shadow-sm"
          >
            <Icons.plus className="h-4 w-4 mr-1.5" /> {showForm ? "Close Form" : "Upload Material"}
          </Button>
        )}
      </div>

      {showForm && (
        <Card className="border-brand-300 shadow-card bg-gradient-to-b from-brand-50/20 to-white animate-scale-in">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Upload Lecture Material</CardTitle>
            <CardDescription>Share files and resources with students in a specific class.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Class / Course</Label>
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
                  <Label>Material Title</Label>
                  <Input
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g. Chapter 3: Fluid Dynamics Lecture Slides"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description (Optional)</Label>
                <Input
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Overview of the key formulas or topics in this document"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>File Name</Label>
                  <Input
                    value={form.file_name}
                    onChange={(e) => setForm({ ...form, file_name: e.target.value })}
                    placeholder="fluid_dynamics_notes.pdf"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>File Download / Cloud URL</Label>
                  <Input
                    value={form.file_url}
                    onChange={(e) => setForm({ ...form, file_url: e.target.value })}
                    placeholder="https://…"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Uploading…" : "Share Material"}
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
          <p className="text-sm">Loading materials…</p>
        </div>
      ) : sorted.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="mx-auto h-12 w-12 rounded-2xl bg-brand-50 text-brand-600 grid place-items-center mb-3">
              <Icons.file className="h-6 w-6" />
            </div>
            <p className="font-display font-bold text-slate-900 text-lg">No materials available</p>
            <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
              {isTeacher
                ? "Click 'Upload Material' above to share your first PDF or slide deck."
                : "Your teachers haven't uploaded study resources for your classes yet."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {sorted.map((m) => (
            <Card
              key={m.id}
              className="overflow-hidden border-slate-200/90 hover:shadow-lift transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                <CardContent className="p-5 pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="rounded-lg bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white">
                      {fileIcon(m.file_name || "")}
                    </span>
                    <Badge variant="slate" className="text-xs truncate max-w-[150px]">
                      {className(m.class_id)}
                    </Badge>
                  </div>
                  <h3 className="mt-4 font-display font-bold text-base text-slate-900 leading-snug">
                    {m.title}
                  </h3>
                  {m.description && (
                    <p className="mt-1.5 text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {m.description}
                    </p>
                  )}
                  {m.file_name && (
                    <p className="mt-3 text-[11px] font-mono text-slate-400 truncate">
                      {m.file_name}
                    </p>
                  )}
                </CardContent>
              </div>

              <div className="p-5 pt-0 border-t border-slate-100 mt-3 pt-3 flex items-center justify-between gap-2">
                {m.file_url ? (
                  <a href={m.file_url} target="_blank" rel="noreferrer" className="flex-1">
                    <Button size="sm" className="w-full text-xs font-semibold">
                      <Icons.file className="h-3.5 w-3.5 mr-1" /> Open File
                    </Button>
                  </a>
                ) : (
                  <span className="flex-1 rounded-xl bg-slate-50 py-1.5 text-center text-xs text-slate-400">
                    No Link
                  </span>
                )}
                {isTeacher && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-rose-600 hover:bg-rose-50"
                    onClick={() => handleDelete(m.id, m.title)}
                  >
                    Delete
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}