import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, insertUserSchema } from "@shared/routes";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { Loader2, Sparkles, BookOpen, Users, Trophy } from "lucide-react";
import { Link } from "wouter";

const features = [
  { icon: BookOpen, label: "Premium Courses", desc: "Hand-crafted by expert instructors" },
  { icon: Users, label: "50K+ Learners", desc: "Growing community of professionals" },
  { icon: Trophy, label: "Certificates", desc: "Industry-recognized credentials" },
];

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (user) {
      setLocation(user.role === "ADMIN" ? "/admin" : "/dashboard");
    }
  }, [user, setLocation]);

  const searchParams = new URLSearchParams(window.location.search);
  const defaultTab = searchParams.get("tab") === "register" ? "register" : "login";

  return (
    <div className="min-h-screen flex">
      {/* Left Panel — Brand */}
      <div className="hidden lg:flex w-[46%] flex-col bg-[#020617] text-white relative overflow-hidden p-10 xl:p-16">
        {/* Background blobs */}
        <div className="absolute top-[-15%] left-[-10%] w-[60%] h-[60%] bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[50%] h-[50%] bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 mb-auto">
          <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-primary shadow-lg">
            <span className="text-lg font-black">SX</span>
          </div>
          <span className="font-extrabold text-xl tracking-tight">
            Skillx<span className="text-slate-400">ethiopia</span>
          </span>
        </Link>

        {/* Tagline */}
        <div className="mt-16 mb-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-xs font-semibold text-blue-400">
            <Sparkles className="h-3.5 w-3.5" />
            The Future of Learning in Ethiopia
          </div>
          <h1 className="text-4xl xl:text-5xl font-black leading-tight tracking-tight">
            Master Skills with
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">
              Premium Content
            </span>
          </h1>
          <p className="text-slate-400 text-base leading-relaxed max-w-sm">
            High-quality, cinematic courses designed for the next generation of creators and professionals.
          </p>
        </div>

        {/* Features */}
        <div className="space-y-4 mb-auto">
          {features.map(({ icon: Icon, label, desc }) => (
            <div key={label} className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5">
              <div className="h-10 w-10 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm">{label}</p>
                <p className="text-xs text-slate-400">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Footer note */}
        <p className="mt-8 text-xs text-slate-500">
          © {new Date().getFullYear()} Skillxethiopia — Elevating Ethiopian Excellence
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
              Skillxethiopia
            </span>
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Welcome back</h2>
            <p className="text-sm text-muted-foreground">Sign in to continue your learning journey</p>
          </div>

          <Tabs defaultValue={defaultTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6 h-10 rounded-lg bg-secondary">
              <TabsTrigger value="login" className="rounded-md text-sm font-semibold">Sign In</TabsTrigger>
              <TabsTrigger value="register" className="rounded-md text-sm font-semibold">Create Account</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <LoginForm />
            </TabsContent>

            <TabsContent value="register">
              <RegisterForm />
            </TabsContent>
          </Tabs>

          <p className="text-center text-xs text-muted-foreground">
            By continuing, you agree to our{" "}
            <a href="#" className="text-primary hover:underline font-medium">Terms of Service</a>
            {" "}and{" "}
            <a href="#" className="text-primary hover:underline font-medium">Privacy Policy</a>.
          </p>
        </div>
      </div>
    </div>
  );
}

function LoginForm() {
  const { loginMutation } = useAuth();
  const form = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  return (
    <form onSubmit={form.handleSubmit((data) => loginMutation.mutate(data))} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="login-email" className="text-sm font-semibold">Email address</Label>
        <Input
          id="login-email"
          type="email"
          placeholder="you@example.com"
          className="h-10 rounded-lg"
          {...form.register("email")}
        />
        {form.formState.errors.email && (
          <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
        )}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="login-password" className="text-sm font-semibold">Password</Label>
        <Input
          id="login-password"
          type="password"
          placeholder="••••••••"
          className="h-10 rounded-lg"
          {...form.register("password")}
        />
        {form.formState.errors.password && (
          <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
        )}
      </div>
      <Button
        type="submit"
        className="w-full h-10 rounded-lg font-semibold"
        disabled={loginMutation.isPending}
      >
        {loginMutation.isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Signing in...
          </>
        ) : (
          "Sign In"
        )}
      </Button>
      {loginMutation.isError && (
        <p className="text-center text-xs text-destructive">
          Invalid credentials. Please try again.
        </p>
      )}
    </form>
  );
}

function RegisterForm() {
  const { registerMutation } = useAuth();
  const form = useForm({
    resolver: zodResolver(insertUserSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  return (
    <form onSubmit={form.handleSubmit((data) => registerMutation.mutate(data))} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="reg-name" className="text-sm font-semibold">Full Name</Label>
        <Input
          id="reg-name"
          placeholder="Your full name"
          className="h-10 rounded-lg"
          {...form.register("name")}
        />
        {form.formState.errors.name && (
          <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
        )}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="reg-email" className="text-sm font-semibold">Email address</Label>
        <Input
          id="reg-email"
          type="email"
          placeholder="you@example.com"
          className="h-10 rounded-lg"
          {...form.register("email")}
        />
        {form.formState.errors.email && (
          <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
        )}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="reg-password" className="text-sm font-semibold">Password</Label>
        <Input
          id="reg-password"
          type="password"
          placeholder="Create a password"
          className="h-10 rounded-lg"
          {...form.register("password")}
        />
        {form.formState.errors.password && (
          <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
        )}
      </div>
      <Button
        type="submit"
        className="w-full h-10 rounded-lg font-semibold"
        disabled={registerMutation.isPending}
      >
        {registerMutation.isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating account...
          </>
        ) : (
          "Create Free Account"
        )}
      </Button>
      {registerMutation.isError && (
        <p className="text-center text-xs text-destructive">
          Registration failed. This email may already be in use.
        </p>
      )}
    </form>
  );
}
