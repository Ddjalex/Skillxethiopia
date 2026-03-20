import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema } from "@shared/routes";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { Loader2, ShieldCheck, Lock } from "lucide-react";
import { Link } from "wouter";

export default function AdminLoginPage() {
  const { user, loginMutation } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (user && user.role === "ADMIN") {
      setLocation("/admin");
    }
  }, [user, setLocation]);

  const form = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const handleSubmit = form.handleSubmit((data) => {
    loginMutation.mutate(data, {
      onSuccess: (loggedInUser: any) => {
        if (loggedInUser?.role !== "ADMIN") {
          form.setError("email", { message: "This account does not have admin access." });
        }
      },
    });
  });

  return (
    <div className="min-h-screen flex">
      {/* Left Panel — Brand */}
      <div className="hidden lg:flex w-[46%] flex-col bg-[#020617] text-white relative overflow-hidden p-10 xl:p-16">
        <div className="absolute top-[-15%] left-[-10%] w-[60%] h-[60%] bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[50%] h-[50%] bg-amber-600/10 rounded-full blur-[100px] pointer-events-none" />

        <Link href="/" className="flex items-center gap-2.5 mb-auto">
          <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-primary shadow-lg">
            <span className="text-lg font-black">SX</span>
          </div>
          <span className="font-extrabold text-xl tracking-tight">
            <span style={{ color: "#078930" }}>Skill</span><span style={{ color: "#FCDD09" }}>X</span><span style={{ color: "#DA121A" }}>ethiopia</span>
          </span>
        </Link>

        <div className="mt-16 mb-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-xs font-semibold text-amber-400">
            <ShieldCheck className="h-3.5 w-3.5" />
            Admin Access Only
          </div>
          <h1 className="text-4xl xl:text-5xl font-black leading-tight tracking-tight">
            Admin
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-300 to-red-400">
              Control Panel
            </span>
          </h1>
          <p className="text-slate-400 text-base leading-relaxed max-w-sm">
            Restricted access for platform administrators only. Manage courses, users, and content from one place.
          </p>
        </div>

        <div className="space-y-4 mb-auto">
          {[
            { icon: ShieldCheck, label: "Secure Admin Portal", desc: "Separate from student login" },
            { icon: Lock, label: "Role-Restricted", desc: "Only verified admins can access" },
          ].map(({ icon: Icon, label, desc }) => (
            <div key={label} className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5">
              <div className="h-10 w-10 rounded-lg bg-amber-500/15 flex items-center justify-center flex-shrink-0">
                <Icon className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <p className="font-semibold text-sm">{label}</p>
                <p className="text-xs text-slate-400">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-8 text-xs text-slate-500">
          © {new Date().getFullYear()} SkillXethiopia — Administrator Portal
        </p>
      </div>

      {/* Right Panel — Form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-[420px] space-y-8">

          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2.5">
            <div className="flex items-center justify-center h-9 w-9 rounded-xl bg-primary text-white">
              <span className="text-base font-black">SX</span>
            </div>
            <span className="font-extrabold text-lg tracking-tight text-foreground">
              SkillXethiopia
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-8 w-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <ShieldCheck className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400">Admin Portal</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Administrator Login</h2>
            <p className="text-sm text-muted-foreground">Sign in with your admin credentials to access the dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="admin-email" className="text-sm font-semibold">Email address</Label>
              <Input
                id="admin-email"
                type="email"
                placeholder="admin@example.com"
                className="h-10 rounded-lg"
                data-testid="input-admin-email"
                {...form.register("email")}
              />
              {form.formState.errors.email && (
                <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="admin-password" className="text-sm font-semibold">Password</Label>
              <Input
                id="admin-password"
                type="password"
                placeholder="••••••••"
                className="h-10 rounded-lg"
                data-testid="input-admin-password"
                {...form.register("password")}
              />
              {form.formState.errors.password && (
                <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
              )}
            </div>
            <Button
              type="submit"
              className="w-full h-10 rounded-lg font-semibold bg-amber-600 hover:bg-amber-700 text-white"
              disabled={loginMutation.isPending}
              data-testid="button-admin-login"
            >
              {loginMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  Sign In as Admin
                </>
              )}
            </Button>
            {loginMutation.isError && (
              <p className="text-center text-xs text-destructive">
                Invalid credentials. Please try again.
              </p>
            )}
          </form>

          <div className="text-center">
            <Link href="/auth" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              ← Back to student login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
