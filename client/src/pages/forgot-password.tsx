import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "wouter";
import { Loader2, Mail, ArrowLeft, CheckCircle2 } from "lucide-react";

const schema = z.object({ email: z.string().email("Please enter a valid email address") });

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [sentEmail, setSentEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const form = useForm({ resolver: zodResolver(schema), defaultValues: { email: "" } });

  const onSubmit = async (data: { email: string }) => {
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message || "Something went wrong");
      setSentEmail(data.email);
      setSent(true);
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md space-y-8">
        <Link href="/auth" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="link-back-login">
          <ArrowLeft className="h-4 w-4" />
          Back to Sign In
        </Link>

        {!sent ? (
          <>
            <div className="space-y-2">
              <div className="h-12 w-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Mail className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight">Forgot your password?</h1>
              <p className="text-sm text-muted-foreground">
                Enter your email address and we'll send you a link to reset your password.
              </p>
            </div>

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="fp-email" className="text-sm font-semibold">Email address</Label>
                <Input
                  id="fp-email"
                  type="email"
                  placeholder="you@example.com"
                  className="h-10 rounded-lg"
                  data-testid="input-forgot-email"
                  {...form.register("email")}
                />
                {form.formState.errors.email && (
                  <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
                )}
              </div>

              {error && (
                <p className="text-xs text-destructive text-center" data-testid="error-forgot">{error}</p>
              )}

              <Button
                type="submit"
                className="w-full h-10 rounded-lg font-semibold"
                disabled={isLoading}
                data-testid="button-send-reset"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send Reset Link"
                )}
              </Button>
            </form>
          </>
        ) : (
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="h-12 w-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight">Check your inbox</h1>
              <p className="text-sm text-muted-foreground">
                If an account exists for <span className="font-semibold text-foreground">{sentEmail}</span>, we've sent a password reset link. It expires in 1 hour.
              </p>
            </div>

            <div className="space-y-3">
              <Button asChild variant="outline" className="w-full h-10 rounded-lg" data-testid="button-back-login-success">
                <Link href="/auth">Back to Sign In</Link>
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                Didn't get it?{" "}
                <button
                  className="text-primary hover:underline font-medium"
                  onClick={() => { setSent(false); setError(""); }}
                  data-testid="button-try-again"
                >
                  Try again
                </button>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
