import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, Users, Star } from "lucide-react";
import { Link } from "wouter";
import { Course, Category } from "@shared/schema";
import { motion } from "framer-motion";

interface CourseCardProps {
  course: Course & { category?: Category };
  isPurchased?: boolean;
}

export function CourseCard({ course, isPurchased }: CourseCardProps) {
  return (
    <Link href={isPurchased ? `/dashboard/course/${course.id}` : `/course/${course.slug}`}>
      <motion.div
        whileHover={{ y: -8 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="cursor-pointer group h-full"
      >
        <Card className="h-full flex flex-col overflow-hidden border-white/5 bg-white/[0.02] backdrop-blur-sm group-hover:bg-white/[0.05] group-hover:border-primary/30 transition-all duration-500 rounded-2xl">
          <div className="relative aspect-video overflow-hidden bg-slate-900">
            <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-transparent to-transparent opacity-60 z-10"></div>
            {course.thumbnailUrl ? (
              <img 
                src={course.thumbnailUrl} 
                alt={course.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-secondary">
                <Play className="w-12 h-12 text-muted-foreground/50" />
              </div>
            )}
            
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-20">
              <div className="h-14 w-14 rounded-full bg-primary/90 text-white flex items-center justify-center shadow-2xl scale-75 group-hover:scale-100 transition-transform duration-500">
                <Play className="h-6 w-6 fill-current ml-1" />
              </div>
            </div>

            {course.category && (
              <Badge className="absolute top-4 left-4 z-20 bg-white/10 hover:bg-white/20 text-white border-none backdrop-blur-md px-3 py-1 rounded-lg font-bold">
                {course.category.name}
              </Badge>
            )}

            <Badge className="absolute top-4 right-4 z-20 bg-primary/20 hover:bg-primary/20 text-primary border-none backdrop-blur-md px-3 py-1 rounded-lg font-bold">
              {course.priceStrategy === "FREE" ? "FREE" : "PREMIUM"}
            </Badge>
          </div>

          <CardHeader className="p-6 pb-2 space-y-2">
            <h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors line-clamp-2">
              {course.title}
            </h3>
            <p className="text-sm text-slate-400 font-light">
              By {course.instructorName}
            </p>
          </CardHeader>

          <CardContent className="p-6 pt-2 flex-grow">
            <p className="text-sm text-slate-400 line-clamp-2 font-light leading-relaxed">
              {course.description}
            </p>
          </CardContent>

          <CardFooter className="p-6 pt-0 mt-auto border-t border-white/5">
            <div className="flex items-center justify-between w-full mt-4 text-slate-500 text-xs font-medium">
              <div className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" />
                <span>1.2k Learners</span>
              </div>
              <div className="flex items-center gap-1.5 text-amber-400/80">
                <Star className="h-3.5 w-3.5 fill-current" />
                <span>4.9</span>
              </div>
            </div>
          </CardFooter>
        </Card>
      </motion.div>
    </Link>
  );
}
