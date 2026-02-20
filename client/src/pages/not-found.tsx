import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background">
      <Card className="w-full max-w-md mx-4 border-none shadow-none bg-transparent text-center">
        <CardContent className="pt-6">
          <div className="flex mb-6 justify-center">
            <AlertCircle className="h-16 w-16 text-destructive opacity-80" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">404 Page Not Found</h1>
          <p className="text-muted-foreground mb-8">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <Link href="/">
            <Button size="lg" className="rounded-full px-8">Return Home</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
