import { Navbar } from "@/components/layout-nav";
import { Button } from "@/components/ui/button";
import { useCourses, useCategories } from "@/hooks/use-courses";
import { CourseCard } from "@/components/course-card";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Zap, Globe, Loader2 } from "lucide-react";

export default function Home() {
  const { data: courses, isLoading: coursesLoading } = useCourses();
  const { data: categories, isLoading: catsLoading } = useCategories();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-32">
        {/* Background Gradients */}
        <div className="absolute inset-0 bg-background">
          <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute top-0 -right-4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>

        <div className="container relative z-10 mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-medium text-primary mb-6 backdrop-blur-sm">
              <Sparkles className="mr-2 h-4 w-4" />
              <span>Re-imagining online education</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6">
              Master new skills with <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-500 to-blue-500">
                Cinematic Learning
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              Unlock your potential with our premium library of high-quality courses. 
              Learn from industry experts in a distraction-free environment.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/browse">
                <Button size="lg" className="h-12 px-8 text-base rounded-full shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all">
                  Browse Courses
                </Button>
              </Link>
              <Link href="/auth">
                <Button variant="outline" size="lg" className="h-12 px-8 text-base rounded-full backdrop-blur-sm bg-background/50">
                  Get Started Free
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-12 bg-muted/30 border-y border-border/50">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-background border border-border/50 shadow-sm">
              <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center mb-4">
                <Globe className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-lg mb-2">Learn Anywhere</h3>
              <p className="text-muted-foreground">Access your courses on any device, anytime. Your progress syncs automatically.</p>
            </div>
            <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-background border border-border/50 shadow-sm">
              <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900/20 text-purple-600 flex items-center justify-center mb-4">
                <Zap className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-lg mb-2">Expert Instructors</h3>
              <p className="text-muted-foreground">Learn from industry leaders who have actual real-world experience.</p>
            </div>
            <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-background border border-border/50 shadow-sm">
              <div className="h-12 w-12 rounded-full bg-pink-100 dark:bg-pink-900/20 text-pink-600 flex items-center justify-center mb-4">
                <MonitorPlay className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-lg mb-2">High Quality Video</h3>
              <p className="text-muted-foreground">Crystal clear 4K video lessons with professional audio and easy navigation.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold">Browse Categories</h2>
          <Link href="/browse" className="text-primary text-sm font-medium hover:underline flex items-center">
            View all <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>
        
        {catsLoading ? (
          <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
        ) : (
          <div className="flex flex-wrap gap-3">
            {categories?.map((cat: any) => (
              <Link key={cat.id} href={`/browse?categoryId=${cat.id}`}>
                <div className="px-6 py-3 rounded-full border border-border bg-card hover:border-primary hover:bg-primary/5 cursor-pointer transition-all">
                  <span className="font-medium">{cat.name}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Featured Courses */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold">Featured Courses</h2>
            <Link href="/browse" className="hidden md:flex text-primary font-medium hover:underline items-center">
              Explore library <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>

          {coursesLoading ? (
            <div className="flex justify-center p-20"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {courses?.slice(0, 4).map((course: any) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          )}
          
          <div className="mt-8 text-center md:hidden">
            <Link href="/browse">
              <Button variant="outline" className="w-full">Explore Library</Button>
            </Link>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="bg-card border-t border-border py-12">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} CourseFlix. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
