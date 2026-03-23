import { useEffect } from "react";
import { useLocation } from "wouter";

export default function VerifyEmailPage() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    setLocation("/auth?tab=register");
  }, []);

  return null;
}
