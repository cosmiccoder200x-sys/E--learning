import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Icons } from "@/components/ui/icons";
import { useToast } from "@/components/ui/use-toast";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"student" | "teacher">("student");
  const [loading, setLoading] = useState(false);
  const { register, loginAsDemo } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(name, email, password, role);
      toast({
        title: "Account created!",
        description: "You're signed in. Redirecting…",
      });
      navigate(role === "teacher" ? "/teacher" : "/student");
    } catch (err: any) {
      toast({
        title: "Registration note",
        description: err.message || "Account ready. Please sign in.",
      });
      navigate("/login");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSignIn = (demoRole: "teacher" | "student") => {
    loginAsDemo(demoRole);
    toast({
      title: `Welcome to ${demoRole === "teacher" ? "Teacher" : "Student"} Demo`,
      description: "You're all set to explore.",
    });
    navigate(demoRole === "teacher" ? "/teacher" : "/student");
  };

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      <div className="flex items-center justify-center bg-[#f8fafc] p-6 order-2 md:order-1">
        <Card className="w-full max-w-[440px] shadow-card border-slate-200/80">
          <CardHeader className="pb-3">
            <CardTitle className="text-[24px] font-display font-extrabold">Create account</CardTitle>
            <CardDescription>Pick your role to get started immediately.</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full name</Label>
                <Input
                  id="name"
                  placeholder="Ava Johnson"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="ava.johnson@school.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <div className="space-y-2">
                <Label>I am joining as a</Label>
                <div className="grid grid-cols-2 gap-2">
                  {(["student", "teacher"] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={`rounded-xl border p-3 text-left transition-all ${
                        role === r
                          ? "border-brand-600 bg-brand-50 text-brand-900 shadow-2xs font-semibold ring-1 ring-brand-500"
                          : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      <p className="text-sm capitalize">{r}</p>
                      <p className="text-[11px] text-slate-500 font-normal">
                        {r === "teacher" ? "Create & grade classes" : "Join & submit work"}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              <Button type="submit" className="w-full h-10 font-semibold" disabled={loading}>
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Creating account…
                  </span>
                ) : (
                  "Create account"
                )}
              </Button>

              <div className="relative my-3">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-slate-400 font-medium">Or skip with Demo</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full text-xs"
                  onClick={() => handleDemoSignIn("teacher")}
                >
                  Teacher Demo
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full text-xs"
                  onClick={() => handleDemoSignIn("student")}
                >
                  Student Demo
                </Button>
              </div>

              <p className="text-center text-xs text-slate-600 pt-1">
                Already registered?{" "}
                <Link to="/login" className="font-semibold text-brand-600 hover:underline">
                  Sign in
                </Link>{" "}
                ·{" "}
                <Link to="/" className="font-medium text-slate-500 hover:underline">
                  Home
                </Link>
              </p>
            </CardContent>
          </form>
        </Card>
      </div>

      <div className="hidden md:flex flex-col justify-between bg-gradient-to-br from-brand-600 via-indigo-600 to-violet-700 p-10 text-white order-1 md:order-2">
        <Link to="/" className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-white text-brand-600 grid place-items-center shadow-md">
            <Icons.spark className="h-5 w-5" />
          </div>
          <span className="font-display font-extrabold text-lg">E-Learn</span>
        </Link>
        <div>
          <h1 className="font-display text-[44px] font-extrabold leading-[1.05]">
            Start <br />
            learning <br />
            today.
          </h1>
          <p className="mt-4 max-w-[420px] text-white/80 leading-relaxed text-sm">
            Set up or join a class in seconds. Seamless Meet sessions, material downloads, and contextual grading feedback.
          </p>
        </div>
        <p className="text-xs text-white/60">Designed for clarity and focus.</p>
      </div>
    </div>
  );
}