import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Icons } from "@/components/ui/icons";
import { useToast } from "@/components/ui/use-toast";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, loginAsDemo } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const signedInUser = await login(email, password);
      toast({
        title: "Welcome back!",
        description: `Signed in as ${signedInUser.name || signedInUser.email}.`,
      });
      navigate(signedInUser.role === "teacher" ? "/teacher" : "/student");
    } catch (err: any) {
      toast({
        title: "Sign in failed",
        description: err.message || "Please check your email and password.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSignIn = (role: "teacher" | "student") => {
    loginAsDemo(role);
    toast({
      title: `Signed in as ${role === "teacher" ? "Teacher (Demo)" : "Student (Demo)"}`,
      description: "You have full access to create, edit, grade, and explore.",
    });
    navigate(role === "teacher" ? "/teacher" : "/student");
  };

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      <div className="hidden md:flex flex-col justify-between bg-[#0f172a] p-10 text-white">
        <Link to="/" className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-brand-500 to-indigo-600 text-white grid place-items-center shadow-md">
            <Icons.spark className="h-5 w-5" />
          </div>
          <span className="font-display font-extrabold text-lg">E-Learn</span>
        </Link>
        <div>
          <h1 className="font-display text-[44px] font-extrabold leading-[1.05]">
            Welcome <br />
            back.
          </h1>
          <p className="mt-4 max-w-[420px] text-white/70 leading-relaxed text-sm">
            Sign in to continue teaching and learning. Your classes, live sessions, materials, and gradebook are ready.
          </p>
          <div className="mt-8 grid grid-cols-3 gap-3 text-sm">
            <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
              <p className="font-bold text-white">Live</p>
              <p className="text-xs text-white/60 mt-0.5">Meet sessions</p>
            </div>
            <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
              <p className="font-bold text-white">Fast</p>
              <p className="text-xs text-white/60 mt-0.5">Grading flow</p>
            </div>
            <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
              <p className="font-bold text-white">Calm</p>
              <p className="text-xs text-white/60 mt-0.5">No clutter</p>
            </div>
          </div>
        </div>
        <p className="text-xs text-white/50">© {new Date().getFullYear()} E-Learn Platform</p>
      </div>

      <div className="flex items-center justify-center bg-[#f8fafc] p-6">
        <Card className="w-full max-w-[440px] shadow-card border-slate-200/80">
          <CardHeader className="pb-4">
            <CardTitle className="text-[24px] font-display font-extrabold">Sign in</CardTitle>
            <CardDescription>Enter your school email and password below.</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="sarah.jenkins@school.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full h-10 font-semibold" disabled={loading}>
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Signing in…
                  </span>
                ) : (
                  "Sign in"
                )}
              </Button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-slate-400 font-medium">Quick 1-Click Demo</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full text-xs hover:bg-brand-50 hover:text-brand-700 hover:border-brand-200"
                  onClick={() => handleDemoSignIn("teacher")}
                >
                  <Icons.book className="h-3.5 w-3.5 mr-1 text-brand-600" /> Teacher Demo
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full text-xs hover:bg-violet-50 hover:text-violet-700 hover:border-violet-200"
                  onClick={() => handleDemoSignIn("student")}
                >
                  <Icons.users className="h-3.5 w-3.5 mr-1 text-violet-600" /> Student Demo
                </Button>
              </div>

              <p className="text-center text-xs text-slate-600 pt-2">
                Don't have an account?{" "}
                <Link to="/register" className="font-semibold text-brand-600 hover:underline">
                  Create one
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
    </div>
  );
}