import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Loader2, CheckCircle2, XCircle, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";

type Status = "loading" | "success" | "error";

export default function VerifyEmailPage() {
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<Status>("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const queryClient = useQueryClient();

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token");
    if (!token) {
      setStatus("error");
      setErrorMsg("No verification token found in the link.");
      return;
    }

    fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        const data = await res.json();
        if (res.ok && data.success) {
          queryClient.setQueryData([api.auth.me.path], data.user);
          setStatus("success");
          setTimeout(() => setLocation("/dashboard"), 2500);
        } else {
          setStatus("error");
          setErrorMsg(data.message || "Verification failed.");
        }
      })
      .catch(() => {
        setStatus("error");
        setErrorMsg("Something went wrong. Please try again.");
      });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md text-center space-y-6">
        {status === "loading" && (
          <>
            <div className="flex justify-center">
              <div className="h-16 w-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
              </div>
            </div>
            <div className="space-y-1">
              <h2 className="text-2xl font-bold">Verifying your email...</h2>
              <p className="text-muted-foreground text-sm">Please wait a moment.</p>
            </div>
          </>
        )}

        {status === "success" && (
          <>
            <div className="flex justify-center">
              <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
            </div>
            <div className="space-y-1">
              <h2 className="text-2xl font-bold">Email verified!</h2>
              <p className="text-muted-foreground text-sm">
                Your account is now active. Redirecting you to your dashboard...
              </p>
            </div>
            <Button asChild className="rounded-lg" data-testid="button-go-dashboard">
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
          </>
        )}

        {status === "error" && (
          <>
            <div className="flex justify-center">
              <div className="h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <XCircle className="h-8 w-8 text-red-500" />
              </div>
            </div>
            <div className="space-y-1">
              <h2 className="text-2xl font-bold">Verification failed</h2>
              <p className="text-muted-foreground text-sm" data-testid="error-verify">{errorMsg}</p>
            </div>
            <div className="flex flex-col gap-2">
              <Button asChild variant="outline" className="rounded-lg" data-testid="button-back-login">
                <Link href="/auth">Back to Sign In</Link>
              </Button>
              <p className="text-xs text-muted-foreground">
                Link expired?{" "}
                <Link href="/auth?tab=register" className="text-primary hover:underline font-medium">
                  Register again to get a new link
                </Link>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
