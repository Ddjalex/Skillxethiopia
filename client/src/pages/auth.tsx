import { useAuth } from "@/hooks/use-auth";
import logoImg from "@assets/ChatGPT_Image_Mar_20,_2026,_03_44_07_PM_1774010974208.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, insertUserSchema } from "@shared/routes";
import { useLocation, Link } from "wouter";
import { useEffect, useState } from "react";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { api } from "@shared/routes";
import { Loader2, Sparkles, BookOpen, Users, Eye, EyeOff, CheckCircle2, Mail, RefreshCw } from "lucide-react";

const features = [
  { icon: BookOpen, label: "Premium Courses", desc: "Hand-crafted by expert instructors" },
  { icon: Users, label: "50K+ Learners", desc: "Growing community of professionals" },
];

export default function AuthPage() {
  const { user } = useAuth();
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
        <div className="absolute top-[-15%] left-[-10%] w-[60%] h-[60%] bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[50%] h-[50%] bg-green-600/10 rounded-full blur-[100px] pointer-events-none" />

        <Link href="/" className="flex items-center gap-2.5 mb-auto">
          <div className="flex items-center justify-center h-10 w-10 rounded-xl overflow-hidden shadow-lg bg-white">
            <img src={logoImg} alt="SkillXethiopia" className="h-full w-full object-contain" />
          </div>
          <span className="font-extrabold text-xl tracking-tight">
            <span style={{ color: "#078930" }}>Skill</span><span style={{ color: "#FCDD09" }}>X</span><span style={{ color: "#DA121A" }}>ethiopia</span>
          </span>
        </Link>

        <div className="mt-16 mb-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-xs font-semibold text-blue-400">
            <Sparkles className="h-3.5 w-3.5" />
            The Future of Learning in Ethiopia
          </div>
          <h1 className="text-4xl xl:text-5xl font-black leading-tight tracking-tight">
            Master Skills with
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-blue-300 to-green-400">
              Premium Content
            </span>
          </h1>
          <p className="text-slate-400 text-base leading-relaxed max-w-sm">
            High-quality, cinematic courses designed for the next generation of creators and professionals.
          </p>
        </div>

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

        <p className="mt-8 text-xs text-slate-500">
          © {new Date().getFullYear()} SkillXethiopia — Elevating Ethiopian Excellence
        </p>
      </div>

      {/* Right Panel — Form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-[420px] space-y-8">

          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2.5">
            <div className="flex items-center justify-center h-9 w-9 rounded-xl overflow-hidden bg-white">
              <img src={logoImg} alt="SkillXethiopia" className="h-full w-full object-contain" />
            </div>
            <span className="font-extrabold text-lg tracking-tight text-foreground">
              SkillXethiopia
            </span>
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Welcome back</h2>
            <p className="text-sm text-muted-foreground">Sign in to continue your learning journey</p>
          </div>

          <Tabs defaultValue={defaultTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6 h-10 rounded-lg bg-secondary">
              <TabsTrigger value="login" className="rounded-md text-sm font-semibold" data-testid="tab-login">Sign In</TabsTrigger>
              <TabsTrigger value="register" className="rounded-md text-sm font-semibold" data-testid="tab-register">Create Account</TabsTrigger>
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

function PasswordInput({ id, placeholder, registration, testId }: {
  id: string;
  placeholder: string;
  registration: any;
  testId?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input
        id={id}
        type={show ? "text" : "password"}
        placeholder={placeholder}
        className="h-10 rounded-lg pr-10"
        data-testid={testId}
        {...registration}
      />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
        tabIndex={-1}
        data-testid={`${testId}-toggle`}
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
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
          data-testid="input-login-email"
          {...form.register("email")}
        />
        {form.formState.errors.email && (
          <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
        )}
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="login-password" className="text-sm font-semibold">Password</Label>
          <Link
            href="/forgot-password"
            className="text-xs text-primary hover:underline font-medium"
            data-testid="link-forgot-password"
          >
            Forgot password?
          </Link>
        </div>
        <PasswordInput
          id="login-password"
          placeholder="••••••••"
          registration={form.register("password")}
          testId="input-login-password"
        />
        {form.formState.errors.password && (
          <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
        )}
      </div>
      <Button
        type="submit"
        className="w-full h-10 rounded-lg font-semibold"
        disabled={loginMutation.isPending}
        data-testid="button-login"
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
        <p className="text-center text-xs text-destructive" data-testid="error-login">
          {(loginMutation.error as Error)?.message || "Invalid credentials. Please try again."}
        </p>
      )}
    </form>
  );
}

const registerSchema = insertUserSchema.extend({
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

function VerifyCodeForm({ email, onBack }: { email: string; onBack: () => void }) {
  const [, setLocation] = useLocation();
  const [code, setCode] = useState("");
  const [resent, setResent] = useState(false);

  function parseApiError(err: unknown): string {
    const msg = (err as Error)?.message || "";
    const match = msg.match(/^\d+: (.+)$/);
    if (match) {
      try { return JSON.parse(match[1])?.message || match[1]; } catch { return match[1]; }
    }
    return msg || "Something went wrong. Please try again.";
  }

  const verifyMutation = useMutation({
    mutationFn: async (data: { email: string; code: string }) => {
      const res = await apiRequest("POST", "/api/auth/verify-email", data);
      return res.json();
    },
    onSuccess: (data) => {
      if (data.success && data.user) {
        queryClient.setQueryData([api.auth.me.path], data.user);
        setLocation("/dashboard");
      }
    },
  });

  const resendMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/auth/resend-verification", { email });
      return res.json();
    },
    onSuccess: () => setResent(true),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length === 6) {
      verifyMutation.mutate({ email, code });
    }
  };

  return (
    <div className="space-y-5" data-testid="verify-code-form">
      <div className="text-center space-y-3 py-2">
        <div className="flex justify-center">
          <div className="h-14 w-14 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <Mail className="h-7 w-7 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
        <div className="space-y-1">
          <h3 className="font-bold text-lg">Check your inbox</h3>
          <p className="text-sm text-muted-foreground">
            We sent a 6-digit code to <span className="font-semibold text-foreground">{email}</span>.
            Enter it below to activate your account.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col items-center gap-2">
          <InputOTP
            maxLength={6}
            value={code}
            onChange={setCode}
            data-testid="input-verify-code"
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
          {verifyMutation.isError && (
            <p className="text-xs text-destructive text-center" data-testid="error-verify-code">
              {parseApiError(verifyMutation.error)}
            </p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full h-10 rounded-lg font-semibold"
          disabled={code.length < 6 || verifyMutation.isPending}
          data-testid="button-verify-code"
        >
          {verifyMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Verifying...
            </>
          ) : (
            "Verify & Activate Account"
          )}
        </Button>
      </form>

      <div className="text-center space-y-2">
        {resent ? (
          <p className="text-xs text-green-600 dark:text-green-400 flex items-center justify-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5" /> New code sent!
          </p>
        ) : (
          <button
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 mx-auto disabled:opacity-50"
            onClick={() => resendMutation.mutate()}
            disabled={resendMutation.isPending}
            data-testid="button-resend-code"
            type="button"
          >
            {resendMutation.isPending ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <RefreshCw className="h-3 w-3" />
            )}
            Didn't get it? Resend code
          </button>
        )}
        <button
          className="text-xs text-muted-foreground hover:text-primary"
          onClick={onBack}
          type="button"
          data-testid="button-back-register"
        >
          Use a different email
        </button>
      </div>
    </div>
  );
}

function RegisterForm() {
  const { registerMutation } = useAuth();
  const [showVerify, setShowVerify] = useState(false);
  const [sentEmail, setSentEmail] = useState("");

  const form = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
  });

  const onSubmit = (data: any) => {
    setSentEmail(data.email);
    registerMutation.mutate(
      { name: data.name, email: data.email, password: data.password },
      { onSuccess: () => setShowVerify(true) }
    );
  };

  if (showVerify) {
    return <VerifyCodeForm email={sentEmail} onBack={() => setShowVerify(false)} />;
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="reg-name" className="text-sm font-semibold">Full Name</Label>
        <Input
          id="reg-name"
          placeholder="Your full name"
          className="h-10 rounded-lg"
          data-testid="input-register-name"
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
          data-testid="input-register-email"
          {...form.register("email")}
        />
        {form.formState.errors.email && (
          <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
        )}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="reg-password" className="text-sm font-semibold">Password</Label>
        <PasswordInput
          id="reg-password"
          placeholder="Create a password (min. 6 characters)"
          registration={form.register("password")}
          testId="input-register-password"
        />
        {form.formState.errors.password && (
          <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
        )}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="reg-confirm-password" className="text-sm font-semibold">Confirm Password</Label>
        <PasswordInput
          id="reg-confirm-password"
          placeholder="Repeat your password"
          registration={form.register("confirmPassword")}
          testId="input-register-confirm-password"
        />
        {form.formState.errors.confirmPassword && (
          <p className="text-xs text-destructive">{form.formState.errors.confirmPassword.message}</p>
        )}
      </div>
      <Button
        type="submit"
        className="w-full h-10 rounded-lg font-semibold"
        disabled={registerMutation.isPending}
        data-testid="button-register"
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
        <p className="text-center text-xs text-destructive" data-testid="error-register">
          {(registerMutation.error as Error)?.message || "Registration failed. This email may already be in use."}
        </p>
      )}
    </form>
  );
}
