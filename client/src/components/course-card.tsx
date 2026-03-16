import { Badge } from "@/components/ui/badge";
import { Play, Users, Star, Lock } from "lucide-react";
import { Link } from "wouter";
import { Course, Category } from "@shared/schema";
import { motion } from "framer-motion";

interface CourseCardProps {
  course: Course & { category?: Category };
  isPurchased?: boolean;
}

export function CourseCard({ course, isPurchased }: CourseCardProps) {
  const href = isPurchased ? `/dashboard/course/${course.id}` : `/course/${course.slug}`;
  const isFree = course.priceStrategy === "FREE";

  return (
    <Link href={href}>
      <motion.div
        whileHover={{ y: -4 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="cursor-pointer group h-full"
      >
        <div className="h-full flex flex-col rounded-xl border border-border bg-card shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-200 overflow-hidden">

          {/* Thumbnail */}
          <div className="relative aspect-video overflow-hidden bg-secondary flex-shrink-0">
            {course.thumbnailUrl ? (
              <img
                src={course.thumbnailUrl}
                alt={course.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                <Play className="w-10 h-10 text-primary/30" />
              </div>
            )}

            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="h-12 w-12 rounded-full bg-white/95 flex items-center justify-center shadow-lg">
                <Play className="h-5 w-5 fill-primary text-primary ml-0.5" />
              </div>
            </div>

            {/* Badges */}
            <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2 z-10">
              {course.category && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-black/50 text-white backdrop-blur-sm">
                  {course.category.name}
                </span>
              )}
              <span className={`ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold backdrop-blur-sm ${
                isFree
                  ? "bg-emerald-500/90 text-white"
                  : "bg-primary/90 text-white"
              }`}>
                {isFree ? "FREE" : "PREMIUM"}
              </span>
            </div>

            {isPurchased && (
              <div className="absolute bottom-3 left-3">
                <span className="badge-success">Enrolled</span>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex flex-col flex-1 p-4 gap-2">
            <h3 className="font-semibold text-sm leading-snug line-clamp-2 text-foreground group-hover:text-primary transition-colors">
              {course.title}
            </h3>
            <p className="text-xs text-muted-foreground">
              by {course.instructorName}
            </p>
            {course.description && (
              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed flex-1">
                {course.description}
              </p>
            )}

            {/* Footer stats */}
            <div className="flex items-center justify-between pt-2 mt-auto border-t border-border">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Users className="h-3.5 w-3.5" />
                <span className="text-xs font-medium">1.2k learners</span>
              </div>
              <div className="flex items-center gap-1 text-amber-500">
                <Star className="h-3.5 w-3.5 fill-current" />
                <span className="text-xs font-semibold">4.9</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
