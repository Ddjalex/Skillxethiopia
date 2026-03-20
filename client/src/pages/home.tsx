import { Navbar } from "@/components/layout-nav";
import { Button } from "@/components/ui/button";
import { useCourses } from "@/hooks/use-courses";
import { CourseCard } from "@/components/course-card";
import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  ArrowRight, Sparkles, Zap, Globe, Loader2, MonitorPlay,
  Play, Star, TrendingUp, BookOpen, CheckCircle, ChevronRight
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.55, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }
  })
};

const stats = [
  { value: "50K+", label: "Active Learners" },
  { value: "200+", label: "Expert Courses" },
  { value: "98%", label: "Satisfaction Rate" },
  { value: "4.9", label: "Avg. Rating", icon: Star },
];

const features = [
  {
    icon: Globe,
    title: "Global Standards",
    desc: "Courses produced with international quality benchmarks built for Ethiopia's best.",
    iconBg: "bg-blue-50 text-blue-600",
  },
  {
    icon: Zap,
    title: "Practical Focus",
    desc: "Project-based learning with real-world assignments that get you hired faster.",
    iconBg: "bg-amber-50 text-amber-600",
  },
  {
    icon: MonitorPlay,
    title: "4K Video Content",
    desc: "Crystal-clear cinematic video lessons optimized for any device, anywhere.",
    iconBg: "bg-emerald-50 text-emerald-600",
  },
];

export default function Home() {
  const { data: courses, isLoading: coursesLoading } = useCourses();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      {/* ─── HERO ─────────────────────────────────────────────────────── */}
      <section className="relative pt-16 overflow-hidden">
        {/* Subtle background tint */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/[0.04] to-transparent" />

        <div className="container relative mx-auto px-4 lg:px-6 py-20 lg:py-28 text-center">
          {/* Badge */}
          <motion.div
            variants={fadeUp} initial="hidden" animate="show"
            className="mb-7 inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-4 py-2 text-sm font-medium text-primary"
          >
            <Sparkles className="h-3.5 w-3.5" />
            The Future of Learning in Ethiopia
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={fadeUp} initial="hidden" animate="show" custom={1}
            className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tight leading-[1.05] mb-7"
          >
            Master Skills with
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-blue-400 to-green-400">
              Premium Content
            </span>
          </motion.h1>

          {/* Subheading */}
          <motion.p
            variants={fadeUp} initial="hidden" animate="show" custom={2}
            className="mx-auto mb-10 max-w-2xl text-lg md:text-xl text-muted-foreground leading-relaxed"
          >
            High-quality, cinematic courses designed for the next generation of
            creators and professionals in Ethiopia.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            variants={fadeUp} initial="hidden" animate="show" custom={3}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10"
          >
            <Link href="/browse">
              <Button
                size="lg"
                className="h-13 px-10 text-base font-semibold rounded-xl gap-2 shadow-lg transition-all hover:scale-105 active:scale-95"
              >
                Start Learning Now
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/browse">
              <Button
                variant="outline"
                size="lg"
                className="h-13 px-10 text-base font-semibold rounded-xl gap-2 transition-all"
              >
                <Play className="h-4 w-4 fill-current" />
                Browse Courses
              </Button>
            </Link>
          </motion.div>

          {/* Trust Row */}
          <motion.div
            variants={fadeUp} initial="hidden" animate="show" custom={4}
            className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground"
          >
            {["No subscription fees", "Pay only for what you learn", "Lifetime access"].map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                {t}
              </span>
            ))}
          </motion.div>
        </div>

        {/* Platform Preview */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="container mx-auto px-4 lg:px-6 pb-0"
        >
          <div className="relative max-w-5xl mx-auto">
            <div className="rounded-2xl border border-border shadow-2xl overflow-hidden bg-card">
              <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent z-10 rounded-2xl pointer-events-none" />
              <img
                src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=2070&auto=format&fit=crop"
                alt="Platform Preview"
                className="w-full h-auto object-cover aspect-video"
              />
              <div className="absolute top-4 left-4 z-20 flex items-center gap-2 rounded-xl border border-border bg-card/90 px-3 py-2 backdrop-blur-sm text-sm font-semibold">
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Live Courses Available
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ─── STATS BAR ────────────────────────────────────────────────── */}
      <section className="border-y border-border bg-secondary/40 py-10 mt-0">
        <div className="container mx-auto px-4 lg:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {stats.map((s, i) => (
              <motion.div
                key={i}
                variants={fadeUp} initial="hidden" whileInView="show"
                viewport={{ once: false }} custom={i}
              >
                <p className="text-3xl font-black text-foreground mb-1 flex items-center justify-center gap-1.5">
                  {s.icon && <s.icon className="h-5 w-5 fill-amber-400 text-amber-400" />}
                  {s.value}
                </p>
                <p className="text-sm text-muted-foreground">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURES ─────────────────────────────────────────────────── */}
      <section className="py-24">
        <div className="container mx-auto px-4 lg:px-6">
          <motion.div
            variants={fadeUp} initial="hidden" whileInView="show"
            viewport={{ once: false }} className="text-center mb-14"
          >
            <p className="section-label mb-3">Why SkillXethiopia</p>
            <h2 className="text-4xl font-black">Unmatched Learning Experience</h2>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((f, i) => (
              <motion.div
                key={i}
                variants={fadeUp} initial="hidden" whileInView="show"
                viewport={{ once: false, margin: "-50px" }} custom={i}
                className="card-base p-6 hover:shadow-md transition-shadow"
              >
                <div className={`h-11 w-11 rounded-xl flex items-center justify-center mb-5 ${f.iconBg}`}>
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURED COURSES ─────────────────────────────────────────── */}
      <section className="py-20 bg-secondary/30 border-y border-border">
        <div className="container mx-auto px-4 lg:px-6">
          <motion.div
            variants={fadeUp} initial="hidden" whileInView="show"
            viewport={{ once: false }}
            className="flex flex-col md:flex-row items-end justify-between gap-4 mb-10"
          >
            <div>
              <p className="section-label mb-2">Explore</p>
              <h2 className="text-3xl font-black">Featured Courses</h2>
            </div>
            <Link href="/browse">
              <button className="group flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors text-sm font-semibold">
                View all courses
                <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
          </motion.div>

          {coursesLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
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
          ) : courses && courses.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {courses.slice(0, 4).map((course: any, i: number) => (
                <motion.div
                  key={course.id}
                  variants={fadeUp} initial="hidden" whileInView="show"
                  viewport={{ once: false }} custom={i}
                >
                  <CourseCard course={course} />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-14 text-muted-foreground">
              <BookOpen className="h-10 w-10 mx-auto mb-4 opacity-30" />
              <p className="text-sm">No courses yet — check back soon.</p>
            </div>
          )}
        </div>
      </section>

      {/* ─── HOW IT WORKS ─────────────────────────────────────────────── */}
      <section className="py-24">
        <div className="container mx-auto px-4 lg:px-6">
          <motion.div
            variants={fadeUp} initial="hidden" whileInView="show"
            viewport={{ once: false }} className="text-center mb-14"
          >
            <p className="section-label mb-3">Simple Process</p>
            <h2 className="text-4xl font-black">Start in 3 Steps</h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-3xl mx-auto">
            {[
              { step: "01", title: "Create Your Account", desc: "Sign up for free in under 30 seconds — no credit card required." },
              { step: "02", title: "Pick a Course", desc: "Browse hundreds of expert-led courses across every discipline." },
              { step: "03", title: "Start Learning", desc: "Pay once and get lifetime access to your course content." },
            ].map((s, i) => (
              <motion.div
                key={i}
                variants={fadeUp} initial="hidden" whileInView="show"
                viewport={{ once: false }} custom={i}
                className="text-center"
              >
                <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl border border-border bg-secondary text-xl font-black text-muted-foreground mb-5">
                  {s.step}
                </div>
                <h3 className="text-base font-bold mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ──────────────────────────────────────────────────────── */}
      <section className="py-20">
        <div className="container mx-auto px-4 lg:px-6">
          <motion.div
            variants={fadeUp} initial="hidden" whileInView="show"
            viewport={{ once: false }}
            className="relative max-w-4xl mx-auto overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-500 to-green-500 p-12 md:p-20 text-center text-white"
          >
            <div className="pointer-events-none absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full blur-3xl -mr-36 -mt-36" />
            <div className="pointer-events-none absolute bottom-0 left-0 w-72 h-72 bg-white/5 rounded-full blur-3xl -ml-36 -mb-36" />
            <div className="relative z-10">
              <TrendingUp className="h-9 w-9 mx-auto mb-5 text-white/60" />
              <h2 className="text-3xl md:text-5xl font-black mb-5 leading-tight">
                Ready to transform<br />your career?
              </h2>
              <p className="mb-9 max-w-xl mx-auto text-lg text-white/70 leading-relaxed">
                Join thousands of learners and start your journey with the best instructors in Ethiopia.
              </p>
              <Link href="/auth?tab=register">
                <Button
                  size="lg"
                  className="h-13 px-12 text-base font-bold rounded-xl bg-white text-primary hover:bg-white/90 shadow-xl transition-all hover:scale-105 active:scale-95 gap-2"
                >
                  Create Free Account
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── FOOTER ───────────────────────────────────────────────────── */}
      <footer className="border-t border-border bg-secondary/30 py-16">
        <div className="container mx-auto px-4 lg:px-6">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-2">
              <Link href="/" className="flex items-center gap-2.5 font-bold text-xl mb-4">
                <div className="flex items-center justify-center h-9 w-9 rounded-xl bg-primary text-white flex-shrink-0">
                  <span className="font-black text-base">SX</span>
                </div>
                <span className="tracking-tight text-foreground">SkillXethiopia</span>
              </Link>
              <p className="text-muted-foreground max-w-xs leading-relaxed text-sm">
                Empowering the youth of Ethiopia through world-class digital education and skill development.
              </p>
              <div className="flex items-center gap-2 mt-4">
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs text-muted-foreground">Platform is live and accepting students</span>
              </div>
            </div>
            <div>
              <h4 className="font-bold text-sm mb-4 text-foreground">Platform</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><Link href="/browse" className="hover:text-foreground transition-colors">All Courses</Link></li>
                <li><Link href="/dashboard" className="hover:text-foreground transition-colors">My Learning</Link></li>
                <li><Link href="/auth" className="hover:text-foreground transition-colors">Sign In</Link></li>
                <li><Link href="/auth?tab=register" className="hover:text-foreground transition-colors">Create Account</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-sm mb-4 text-foreground">Connect</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Telegram</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Facebook</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Instagram</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">YouTube</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-3 text-muted-foreground text-xs">
            <p>&copy; {new Date().getFullYear()} SkillXethiopia. All rights reserved.</p>
            <p>Elevating Ethiopian Excellence.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
