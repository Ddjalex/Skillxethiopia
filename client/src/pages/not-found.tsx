import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="space-y-2">
          <p className="text-8xl font-black text-primary/20 leading-none">404</p>
          <h1 className="text-2xl font-bold tracking-tight">Page not found</h1>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        <div className="flex items-center justify-center gap-3">
          <Link href="/">
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Go Home
            </Button>
          </Link>
          <Link href="/browse">
            <Button size="sm" className="gap-2">
              <Compass className="h-4 w-4" />
              Browse Courses
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
