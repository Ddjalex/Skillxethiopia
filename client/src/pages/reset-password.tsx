import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useLocation } from "wouter";
import { Loader2, KeyRound, CheckCircle2, Eye, EyeOff, ArrowLeft } from "lucide-react";

const schema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

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
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

export default function ResetPasswordPage() {
  const [, setLocation] = useLocation();
  const [done, setDone] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const token = new URLSearchParams(window.location.search).get("token") || "";

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const onSubmit = async (data: { password: string; confirmPassword: string }) => {
    if (!token) {
      setError("Invalid reset link. Please request a new one.");
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: data.password }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message || "Something went wrong");
      setDone(true);
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md space-y-8">
        {!done ? (
          <>
            <Link href="/auth" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="link-back-login">
              <ArrowLeft className="h-4 w-4" />
              Back to Sign In
            </Link>

            <div className="space-y-2">
              <div className="h-12 w-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <KeyRound className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight">Reset your password</h1>
              <p className="text-sm text-muted-foreground">
                Choose a new password for your account.
              </p>
            </div>

            {!token && (
              <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
                Invalid or missing reset token. Please{" "}
                <Link href="/forgot-password" className="underline font-medium">request a new link</Link>.
              </div>
            )}

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="rp-password" className="text-sm font-semibold">New Password</Label>
                <PasswordInput
                  id="rp-password"
                  placeholder="At least 6 characters"
                  registration={form.register("password")}
                  testId="input-new-password"
                />
                {form.formState.errors.password && (
                  <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="rp-confirm" className="text-sm font-semibold">Confirm New Password</Label>
                <PasswordInput
                  id="rp-confirm"
                  placeholder="Repeat your new password"
                  registration={form.register("confirmPassword")}
                  testId="input-confirm-new-password"
                />
                {form.formState.errors.confirmPassword && (
                  <p className="text-xs text-destructive">{form.formState.errors.confirmPassword.message}</p>
                )}
              </div>

              {error && (
                <p className="text-xs text-destructive text-center" data-testid="error-reset">{error}</p>
              )}

              <Button
                type="submit"
                className="w-full h-10 rounded-lg font-semibold"
                disabled={isLoading || !token}
                data-testid="button-reset-password"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Resetting...
                  </>
                ) : (
                  "Reset Password"
                )}
              </Button>
            </form>
          </>
        ) : (
          <div className="space-y-6 text-center">
            <div className="flex justify-center">
              <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
            </div>
            <div className="space-y-1">
              <h2 className="text-2xl font-bold">Password reset!</h2>
              <p className="text-sm text-muted-foreground">
                Your password has been updated successfully. You can now sign in with your new password.
              </p>
            </div>
            <Button asChild className="rounded-lg" data-testid="button-go-login">
              <Link href="/auth">Sign In</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
