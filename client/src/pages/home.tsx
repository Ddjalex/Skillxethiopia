import { Navbar } from "@/components/layout-nav";
import { Button } from "@/components/ui/button";
import { useCourses } from "@/hooks/use-courses";
import { CourseCard } from "@/components/course-card";
import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  ArrowRight, Sparkles, Zap, Globe, Loader2, MonitorPlay,
  Play, Star, TrendingUp, Award, BookOpen, CheckCircle, ChevronRight
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.65, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] } })
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
    color: "from-blue-500/20 to-blue-600/5",
    iconBg: "bg-blue-500/10 text-blue-400",
  },
  {
    icon: Zap,
    title: "Practical Focus",
    desc: "Project-based learning with real-world assignments that get you hired faster.",
    color: "from-amber-500/20 to-amber-600/5",
    iconBg: "bg-amber-500/10 text-amber-400",
  },
  {
    icon: MonitorPlay,
    title: "4K Video Content",
    desc: "Crystal-clear cinematic video lessons optimized for any device, anywhere.",
    color: "from-emerald-500/20 to-emerald-600/5",
    iconBg: "bg-emerald-500/10 text-emerald-400",
  },
  {
    icon: Award,
    title: "Earn Certificates",
    desc: "Industry-recognized credentials you can share with employers and clients.",
    color: "from-purple-500/20 to-purple-600/5",
    iconBg: "bg-purple-500/10 text-purple-400",
  },
];

export default function Home() {
  const { data: courses, isLoading: coursesLoading } = useCourses();

  return (
    <div className="min-h-screen bg-[#020617] text-white selection:bg-primary/30">
      <Navbar />

      {/* ─── HERO ─────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-16">
        {/* Background glows */}
        <div className="pointer-events-none absolute inset-0 z-0">
          <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-primary/15 rounded-full blur-[160px]" />
          <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-purple-700/10 rounded-full blur-[160px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />
          {/* Grid */}
          <div className="absolute inset-0"
            style={{
              backgroundImage: "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)",
              backgroundSize: "80px 80px"
            }}
          />
        </div>

        <div className="container relative z-10 mx-auto px-4 py-20 lg:py-28 text-center">
          {/* Badge */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-blue-300 backdrop-blur-md"
          >
            <Sparkles className="h-3.5 w-3.5" />
            The Future of Learning in Ethiopia
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={1}
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[1.05] mb-8"
          >
            Master Skills with
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400">
              Premium Content
            </span>
          </motion.h1>

          {/* Subheading */}
          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={2}
            className="mx-auto mb-12 max-w-2xl text-lg md:text-xl text-slate-400 leading-relaxed font-light"
          >
            High-quality, cinematic courses designed for the next generation of
            creators and professionals in Ethiopia.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={3}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
          >
            <Link href="/browse">
              <Button
                size="lg"
                className="h-14 px-10 text-base font-semibold rounded-2xl bg-primary hover:bg-primary/90 text-white shadow-[0_0_30px_rgba(59,130,246,0.4)] transition-all hover:scale-105 active:scale-95 gap-2"
              >
                Start Learning Now
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/browse">
              <Button
                variant="ghost"
                size="lg"
                className="h-14 px-10 text-base font-semibold rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-white backdrop-blur-md transition-all gap-2"
              >
                <Play className="h-4 w-4 fill-current" />
                Browse Courses
              </Button>
            </Link>
          </motion.div>

          {/* Trust Row */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={4}
            className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-slate-400"
          >
            {["No subscription fees", "Pay only for what you learn", "Lifetime access"].map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                {t}
              </span>
            ))}
          </motion.div>
        </div>

        {/* Platform Preview */}
        <motion.div
          initial={{ opacity: 0, y: 80 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.1, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="container relative z-10 mx-auto px-4 pb-24"
        >
          <div className="relative max-w-5xl mx-auto">
            {/* Glow behind image */}
            <div className="absolute -inset-4 bg-primary/10 rounded-[2.5rem] blur-2xl" />
            <div className="relative rounded-3xl border border-white/10 bg-white/[0.03] p-1.5 backdrop-blur-xl shadow-2xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-transparent to-transparent z-10 rounded-3xl" />
              <img
                src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=2070&auto=format&fit=crop"
                alt="Platform Preview"
                className="rounded-2xl w-full h-auto object-cover aspect-video opacity-70"
              />
              {/* Floating badge */}
              <div className="absolute top-4 left-4 z-20 flex items-center gap-2 rounded-xl border border-white/10 bg-slate-900/80 px-3 py-2 backdrop-blur-md text-sm font-semibold">
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                Live Courses Available
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ─── STATS BAR ────────────────────────────────────────────────── */}
      <section className="border-y border-white/5 bg-white/[0.02] py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((s, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                custom={i}
              >
                <p className="text-3xl md:text-4xl font-black text-white mb-1 flex items-center justify-center gap-1.5">
                  {s.icon && <s.icon className="h-6 w-6 fill-amber-400 text-amber-400" />}
                  {s.value}
                </p>
                <p className="text-sm text-slate-400">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURES ─────────────────────────────────────────────────── */}
      <section className="py-28 relative">
        <div className="container mx-auto px-4">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <p className="text-xs font-bold tracking-[0.25em] text-blue-400 uppercase mb-4">
              Why Skillxethiopia
            </p>
            <h2 className="text-4xl md:text-5xl font-black">
              Unmatched Learning Experience
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((f, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-50px" }}
                custom={i}
                whileHover={{ y: -6 }}
                className={`group relative rounded-2xl border border-white/5 bg-gradient-to-b ${f.color} p-6 transition-all hover:border-white/10`}
              >
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center mb-5 ${f.iconBg}`}>
                  <f.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold mb-2">{f.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURED COURSES ─────────────────────────────────────────── */}
      <section className="py-24 bg-white/[0.02] border-y border-white/5">
        <div className="container mx-auto px-4">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="flex flex-col md:flex-row items-end justify-between gap-4 mb-12"
          >
            <div>
              <p className="text-xs font-bold tracking-[0.25em] text-blue-400 uppercase mb-3">
                Explore
              </p>
              <h2 className="text-4xl md:text-5xl font-black">Featured Courses</h2>
            </div>
            <Link href="/browse">
              <button className="group flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors text-sm font-semibold">
                View all courses
                <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
          </motion.div>

          {coursesLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-2xl border border-white/5 bg-white/[0.03] overflow-hidden">
                  <div className="aspect-video skeleton opacity-30" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 w-3/4 skeleton opacity-20 rounded" />
                    <div className="h-3 w-1/2 skeleton opacity-20 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : courses && courses.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {courses.slice(0, 4).map((course: any, i: number) => (
                <motion.div
                  key={course.id}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true }}
                  custom={i}
                >
                  <CourseCard course={course} dark />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-slate-500">
              <BookOpen className="h-10 w-10 mx-auto mb-4 opacity-30" />
              <p>No courses yet — check back soon.</p>
            </div>
          )}
        </div>
      </section>

      {/* ─── HOW IT WORKS ─────────────────────────────────────────────── */}
      <section className="py-28">
        <div className="container mx-auto px-4">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <p className="text-xs font-bold tracking-[0.25em] text-blue-400 uppercase mb-4">
              Simple Process
            </p>
            <h2 className="text-4xl md:text-5xl font-black">Start in 3 Steps</h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { step: "01", title: "Create Your Account", desc: "Sign up for free in under 30 seconds — no credit card required." },
              { step: "02", title: "Pick a Course", desc: "Browse hundreds of expert-led courses across every discipline." },
              { step: "03", title: "Start Learning", desc: "Pay once and get lifetime access to your course content." },
            ].map((s, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                custom={i}
                className="relative text-center"
              >
                {i < 2 && (
                  <div className="hidden md:block absolute top-6 left-[calc(50%+2rem)] right-0 h-px bg-gradient-to-r from-white/10 to-transparent" />
                )}
                <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl border border-white/10 bg-white/[0.04] text-2xl font-black text-slate-400 mb-5">
                  {s.step}
                </div>
                <h3 className="text-lg font-bold mb-3">{s.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ──────────────────────────────────────────────────────── */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="relative max-w-4xl mx-auto overflow-hidden rounded-[2rem] bg-gradient-to-br from-primary via-indigo-600 to-purple-700 p-12 md:p-20 text-center"
          >
            {/* Background blobs */}
            <div className="pointer-events-none absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -mr-40 -mt-40" />
            <div className="pointer-events-none absolute bottom-0 left-0 w-80 h-80 bg-white/5 rounded-full blur-3xl -ml-40 -mb-40" />

            <div className="relative z-10">
              <TrendingUp className="h-10 w-10 mx-auto mb-6 text-white/60" />
              <h2 className="text-3xl md:text-5xl font-black mb-6 leading-tight">
                Ready to transform<br />your career?
              </h2>
              <p className="mb-10 max-w-xl mx-auto text-lg text-white/70 leading-relaxed">
                Join thousands of learners and start your journey with the best instructors in Ethiopia.
              </p>
              <Link href="/auth?tab=register">
                <Button
                  size="lg"
                  className="h-14 px-12 text-base font-bold rounded-2xl bg-white text-primary hover:bg-white/90 shadow-2xl transition-all hover:scale-105 active:scale-95"
                >
                  Create Free Account
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── FOOTER ───────────────────────────────────────────────────── */}
      <footer className="border-t border-white/5 bg-[#020617] py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-2">
              <Link href="/" className="flex items-center gap-2.5 font-bold text-xl mb-5">
                <div className="flex items-center justify-center h-9 w-9 rounded-xl bg-primary text-white flex-shrink-0">
                  <span className="font-black text-lg">SX</span>
                </div>
                <span className="tracking-tight">Skillxethiopia</span>
              </Link>
              <p className="text-slate-400 max-w-sm leading-relaxed text-sm">
                Empowering the youth of Ethiopia through world-class digital education and skill development.
              </p>
              <div className="flex items-center gap-2 mt-5">
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs text-slate-500">Platform is live and accepting students</span>
              </div>
            </div>
            <div>
              <h4 className="font-bold text-sm mb-5">Platform</h4>
              <ul className="space-y-3 text-sm text-slate-400">
                <li><Link href="/browse" className="hover:text-white transition-colors">All Courses</Link></li>
                <li><Link href="/dashboard" className="hover:text-white transition-colors">My Learning</Link></li>
                <li><Link href="/auth" className="hover:text-white transition-colors">Sign In</Link></li>
                <li><Link href="/auth?tab=register" className="hover:text-white transition-colors">Create Account</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-sm mb-5">Connect</h4>
              <ul className="space-y-3 text-sm text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">Telegram</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Facebook</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Instagram</a></li>
                <li><a href="#" className="hover:text-white transition-colors">YouTube</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-3 text-slate-500 text-xs">
            <p>&copy; {new Date().getFullYear()} Skillxethiopia. All rights reserved.</p>
            <p>Elevating Ethiopian Excellence.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
