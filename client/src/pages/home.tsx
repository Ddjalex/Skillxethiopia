import { Navbar } from "@/components/layout-nav";
import { Button } from "@/components/ui/button";
import { useCourses, useCategories } from "@/hooks/use-courses";
import { CourseCard } from "@/components/course-card";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Zap, Globe, Loader2, MonitorPlay, Play } from "lucide-react";

export default function Home() {
  const { data: courses, isLoading: coursesLoading } = useCourses();
  const { data: categories, isLoading: catsLoading } = useCategories();

  return (
    <div className="min-h-screen bg-[#020617] text-white selection:bg-primary/30">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden pt-20">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] animate-pulse"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[120px] animate-pulse delay-700"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
        </div>

        <div className="container relative z-10 mx-auto px-4">
          <div className="max-w-5xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm font-medium text-blue-400 mb-8 backdrop-blur-md">
                <Sparkles className="mr-2 h-4 w-4" />
                <span>The Future of Learning in Ethiopia</span>
              </div>
              
              <h1 className="text-5xl md:text-8xl font-black tracking-tight mb-8 leading-[1.1]">
                Master Skills with <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">
                  Premium Content
                </span>
              </h1>
              
              <p className="text-xl md:text-2xl text-slate-400 max-w-3xl mx-auto mb-12 leading-relaxed font-light">
                High-quality, cinematic courses designed for the next generation of creators and professionals.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                <Link href="/auth">
                  <Button size="lg" className="h-14 px-10 text-lg rounded-2xl bg-primary hover:bg-primary/90 text-white border-none shadow-[0_0_20px_rgba(59,130,246,0.5)] transition-all hover:scale-105 active:scale-95">
                    Start Learning Now
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Button variant="outline" size="lg" className="h-14 px-10 text-lg rounded-2xl bg-white/5 border-white/10 hover:bg-white/10 text-white backdrop-blur-md transition-all">
                  <Play className="mr-2 h-5 w-5 fill-current" />
                  Watch Demo
                </Button>
              </div>
            </motion.div>

            {/* Dashboard Preview */}
            <motion.div 
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="mt-20 relative"
            >
              <div className="relative rounded-3xl border border-white/10 bg-slate-900/50 p-2 backdrop-blur-2xl shadow-2xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent z-10"></div>
                <img 
                  src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=2070&auto=format&fit=crop" 
                  alt="Platform Preview" 
                  className="rounded-2xl w-full h-auto object-cover aspect-video opacity-80"
                />
              </div>
              {/* Floating Elements */}
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl"></div>
              <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl"></div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-24 relative">
        <div className="container mx-auto px-4">
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-sm font-bold tracking-widest text-blue-500 uppercase mb-4">Why Skillxethiopia</h2>
            <p className="text-3xl md:text-5xl font-bold">Unmatched Learning Experience</p>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-10">
            {[
              { icon: Globe, title: "Global Standards", desc: "Courses produced with international quality benchmarks." },
              { icon: Zap, title: "Practical Focus", desc: "Project-based learning that gets you hired." },
              { icon: MonitorPlay, title: "4K Content", desc: "Crystal clear video lessons for better retention." }
            ].map((feature, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                whileHover={{ y: -10 }}
                className="group p-8 rounded-3xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-all"
              >
                <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <feature.icon className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-slate-400 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Courses */}
      <section className="py-24 bg-white/[0.02] border-y border-white/5">
        <div className="container mx-auto px-4">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex flex-col md:flex-row items-end justify-between mb-16 gap-4"
          >
            <div>
              <h2 className="text-sm font-bold tracking-widest text-blue-500 uppercase mb-4">Explore</h2>
              <p className="text-3xl md:text-5xl font-bold">Featured Courses</p>
            </div>
            <Link href="/browse" className="group text-white/60 hover:text-white transition-colors flex items-center text-lg font-medium">
              View All Courses <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>

          {coursesLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {courses?.slice(0, 4).map((course: any, i: number) => (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                >
                  <CourseCard course={course} />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto rounded-[3rem] bg-gradient-to-br from-primary to-indigo-600 p-12 md:p-20 text-center relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
            <h2 className="text-3xl md:text-6xl font-black mb-8">Ready to transform your career?</h2>
            <p className="text-xl text-white/80 mb-12 max-w-2xl mx-auto font-light">
              Join thousands of learners and start your journey today with the best instructors in Ethiopia.
            </p>
            <Link href="/auth?tab=register">
              <Button size="lg" className="h-16 px-12 text-xl rounded-2xl bg-white text-primary hover:bg-white/90 shadow-2xl transition-all hover:scale-105 active:scale-95">
                Create Free Account
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="border-t border-white/5 py-20 bg-[#020617]">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-12 mb-20">
            <div className="col-span-2">
              <Link href="/" className="flex items-center gap-2 font-bold text-2xl mb-6">
                <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-primary text-white">
                  <span className="font-black text-xl">SX</span>
                </div>
                <span className="tracking-tighter">Skillxethiopia</span>
              </Link>
              <p className="text-slate-400 max-w-sm leading-relaxed">
                Empowering the youth of Ethiopia through world-class digital education and skill development.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-6">Platform</h4>
              <ul className="space-y-4 text-slate-400">
                <li><Link href="/browse" className="hover:text-white transition-colors">Courses</Link></li>
                <li><Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link></li>
                <li><Link href="/auth" className="hover:text-white transition-colors">Sign In</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-6">Connect</h4>
              <ul className="space-y-4 text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">Telegram</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Facebook</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Instagram</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-10 border-t border-white/5 text-center text-slate-500 text-sm">
            <p>&copy; {new Date().getFullYear()} Skillxethiopia. Elevating Ethiopian Excellence.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
