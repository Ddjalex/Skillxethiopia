import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, PlayCircle, Users } from "lucide-react";
import { Link } from "wouter";
import { Course, Category } from "@shared/schema";

interface CourseCardProps {
  course: Course & { category?: Category };
  isPurchased?: boolean;
}

export function CourseCard({ course, isPurchased }: CourseCardProps) {
  return (
    <Link href={isPurchased ? `/dashboard/course/${course.id}` : `/course/${course.slug}`}>
      <div className="block group h-full cursor-pointer">
        <Card className="h-full flex flex-col overflow-hidden border-border/50 bg-card hover:shadow-xl hover:border-primary/30 transition-all duration-300">
          <div className="relative aspect-video overflow-hidden bg-muted">
            {course.thumbnailUrl ? (
              <img 
                src={course.thumbnailUrl} 
                alt={course.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-secondary">
                <PlayCircle className="w-12 h-12 text-muted-foreground/50" />
              </div>
            )}
            
            {course.category && (
              <Badge className="absolute top-3 left-3 bg-background/90 text-foreground backdrop-blur-sm shadow-sm hover:bg-background">
                {course.category.name}
              </Badge>
            )}

            {course.priceStrategy === "FREE" && (
              <Badge variant="secondary" className="absolute top-3 right-3 shadow-sm">
                Free
              </Badge>
            )}
          </div>

          <CardHeader className="p-4 pb-2 space-y-1">
            <h3 className="font-semibold text-lg leading-tight line-clamp-2 group-hover:text-primary transition-colors">
              {course.title}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-1">
              By {course.instructorName}
            </p>
          </CardHeader>

          <CardContent className="p-4 pt-2 flex-grow">
            <p className="text-sm text-muted-foreground line-clamp-2">
              {course.description}
            </p>
          </CardContent>

          <CardFooter className="p-4 pt-0 mt-auto border-t border-border/30 bg-muted/10">
            <div className="flex items-center justify-between w-full mt-3">
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" /> 1.2k
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" /> 4h 30m
                </span>
              </div>
              
              {isPurchased ? (
                <Button size="sm" variant="secondary" className="ml-auto">
                  Continue
                </Button>
              ) : (
                <span className="font-bold text-primary">
                  {course.priceStrategy === "FREE" ? "Start Learning" : "View Course"}
                </span>
              )}
            </div>
          </CardFooter>
        </Card>
      </div>
    </Link>
  );
}
