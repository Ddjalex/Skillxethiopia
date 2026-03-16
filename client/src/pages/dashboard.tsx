import { Navbar } from "@/components/layout-nav";
import { useDashboardCourses } from "@/hooks/use-courses";
import { CourseCard } from "@/components/course-card";
import { Loader2, BookOpen, Compass, GraduationCap, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";

export default function Dashboard() {
  const { data: courses, isLoading } = useDashboardCourses();
  const { user } = useAuth();

  const enrolledCount = courses?.length ?? 0;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="mt-16">
        {/* Page Header */}
        <div className="border-b border-border bg-card">
          <div className="container mx-auto px-4 lg:px-6 py-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="section-label mb-1">My Learning</p>
                <h1 className="text-2xl font-bold tracking-tight">
                  Welcome back{user?.name ? `, ${user.name.split(" ")[0]}` : ""}
                </h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Continue where you left off
                </p>
              </div>
              <Link href="/browse">
                <Button size="sm" variant="outline" className="gap-2 self-start">
                  <Compass className="h-4 w-4" />
                  Explore Courses
                </Button>
              </Link>
            </div>

            {/* Stats row */}
            {!isLoading && (
              <div className="flex items-center gap-6 mt-6 pt-5 border-t border-border">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <GraduationCap className="h-4.5 w-4.5 text-primary h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-lg font-bold leading-none">{enrolledCount}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Enrolled</p>
                  </div>
                </div>
                <div className="h-8 w-px bg-border" />
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-lg bg-emerald-50 flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-lg font-bold leading-none">Active</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Status</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 lg:px-6 py-8">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-xl border border-border bg-card overflow-hidden">
                  <div className="aspect-video skeleton" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 w-3/4 skeleton rounded" />
                    <div className="h-3 w-1/2 skeleton rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : courses?.length === 0 ? (
            <div className="empty-state border border-dashed border-border rounded-xl max-w-md mx-auto mt-4">
              <div className="empty-state-icon bg-secondary">
                <BookOpen className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-base font-semibold mb-1">No courses yet</h3>
              <p className="text-sm text-muted-foreground mb-5 max-w-xs">
                You haven't enrolled in any courses yet. Browse our catalog to get started.
              </p>
              <Link href="/browse">
                <Button size="sm" className="gap-2">
                  <Compass className="h-4 w-4" />
                  Browse Courses
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base font-semibold">My Courses</h2>
                <span className="text-xs text-muted-foreground">{enrolledCount} course{enrolledCount !== 1 ? "s" : ""}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {courses?.map((course) => (
                  <CourseCard key={course.id} course={course} isPurchased />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
