import { Navbar } from "@/components/layout-nav";
import { useDashboardCourses } from "@/hooks/use-courses";
import { CourseCard } from "@/components/course-card";
import { Loader2, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function Dashboard() {
  const { data: courses, isLoading } = useDashboardCourses();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-10">
        <header className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight mb-2">My Learning</h1>
          <p className="text-muted-foreground">Continue where you left off.</p>
        </header>

        {isLoading ? (
          <div className="flex justify-center p-20">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        ) : courses?.length === 0 ? (
          <div className="text-center py-20 bg-muted/20 rounded-2xl border border-dashed border-border">
            <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold mb-2">No courses yet</h3>
            <p className="text-muted-foreground mb-6">You haven't enrolled in any courses yet.</p>
            <Link href="/browse">
              <Button>Browse Courses</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {courses?.map((course) => (
              <CourseCard key={course.id} course={course} isPurchased />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
