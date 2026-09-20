import { useAuth } from "@/hooks/useAuth";

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold text-slate-900">E-Learning Platform</h1>
        <p className="text-lg text-slate-600">Modern learning, simplified</p>
        {user ? (
          <a href={user.role === "teacher" ? "/teacher" : "/student"}>
            <button className="bg-slate-900 text-white px-6 py-2 rounded-md hover:bg-slate-800">Go to Dashboard</button>
          </a>
        ) : (
          <div className="space-x-4">
            <a href="/login"><button className="border border-slate-900 px-6 py-2 rounded-md hover:bg-slate-100">Login</button></a>
            <a href="/register"><button className="bg-slate-900 text-white px-6 py-2 rounded-md hover:bg-slate-800">Get Started</button></a>
          </div>
        )}
      </div>
    </div>
  );
}
