import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, useCallback, useRef } from "react";
import { X, Tag, Megaphone, Flame, Sparkles, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "wouter";
import { AnimatePresence, motion } from "framer-motion";

type Broadcast = {
  id: number;
  title: string;
  message: string;
  type: string;
  discountPercent: number | null;
  discountCode: string | null;
  ctaText: string | null;
  ctaUrl: string | null;
  bgColor: string;
  isActive: boolean;
};

const colorMap: Record<string, string> = {
  blue:   "bg-blue-600 text-white",
  green:  "bg-emerald-600 text-white",
  amber:  "bg-amber-500 text-white",
  red:    "bg-red-600 text-white",
  purple: "bg-violet-600 text-white",
};

const progressColorMap: Record<string, string> = {
  blue:   "bg-blue-300",
  green:  "bg-emerald-300",
  amber:  "bg-amber-200",
  red:    "bg-red-300",
  purple: "bg-violet-300",
};

const TypeIcon: Record<string, React.ComponentType<any>> = {
  DISCOUNT: Tag,
  SALE: Flame,
  ANNOUNCEMENT: Megaphone,
  UPDATE: Sparkles,
};

const SLIDE_INTERVAL = 4000;

export function BroadcastBanner() {
  const [dismissed, setDismissed] = useState(false);
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  const { data: broadcasts } = useQuery<Broadcast[]>({
    queryKey: ["/api/broadcasts/active"],
    staleTime: 60_000,
  });

  const active = Array.isArray(broadcasts) ? broadcasts.filter(b => b.isActive) : [];

  const goTo = useCallback((index: number, dir: number) => {
    setDirection(dir);
    setCurrent(index);
    setProgress(0);
    startTimeRef.current = Date.now();
  }, []);

  const goNext = useCallback(() => {
    if (active.length <= 1) return;
    setCurrent(prev => {
      const next = (prev + 1) % active.length;
      return next;
    });
    setDirection(1);
    setProgress(0);
    startTimeRef.current = Date.now();
  }, [active.length]);

  const goPrev = useCallback(() => {
    if (active.length <= 1) return;
    setCurrent(prev => (prev - 1 + active.length) % active.length);
    setDirection(-1);
    setProgress(0);
    startTimeRef.current = Date.now();
  }, [active.length]);

  useEffect(() => {
    if (active.length <= 1 || paused) return;

    timerRef.current = setInterval(() => {
      setDirection(1);
      setCurrent(prev => (prev + 1) % active.length);
      setProgress(0);
      startTimeRef.current = Date.now();
    }, SLIDE_INTERVAL);

    progressRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      setProgress(Math.min((elapsed / SLIDE_INTERVAL) * 100, 100));
    }, 30);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (progressRef.current) clearInterval(progressRef.current);
    };
  }, [active.length, paused]);

  useEffect(() => {
    if (!paused) {
      setProgress(0);
      startTimeRef.current = Date.now();
    }
  }, [paused]);

  useEffect(() => {
    if (current >= active.length && active.length > 0) {
      setCurrent(0);
    }
  }, [active.length, current]);

  if (!active.length || dismissed) return null;

  const safeIndex = Math.min(current, active.length - 1);
  const broadcast = active[safeIndex];
  const colorClass = colorMap[broadcast.bgColor] || colorMap.blue;
  const progressBarColor = progressColorMap[broadcast.bgColor] || progressColorMap.blue;
  const Icon = TypeIcon[broadcast.type] || Megaphone;

  const variants = {
    enter: (dir: number) => ({ x: dir > 0 ? "100%" : "-100%", opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? "-100%" : "100%", opacity: 0 }),
  };

  return (
    <div
      className={`relative z-[60] w-full overflow-hidden ${colorClass}`}
      data-testid="broadcast-banner"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={broadcast.id}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="container mx-auto py-2.5 flex items-center justify-center gap-3 text-sm flex-wrap"
          style={{ paddingLeft: active.length > 1 ? "3.5rem" : "2.5rem", paddingRight: "3.5rem" }}
        >
          <Icon className="h-4 w-4 flex-shrink-0 opacity-90" />

          <span className="font-semibold">{broadcast.title}</span>

          <span className="opacity-85">{broadcast.message}</span>

          {broadcast.discountPercent && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-bold">
              {broadcast.discountPercent}% OFF
            </span>
          )}

          {broadcast.discountCode && (
            <span className="inline-flex items-center gap-1 rounded bg-white/20 px-2.5 py-0.5 text-xs font-mono font-bold tracking-wider">
              {broadcast.discountCode}
            </span>
          )}

          {broadcast.ctaText && broadcast.ctaUrl && (
            broadcast.ctaUrl.startsWith("/") ? (
              <Link href={broadcast.ctaUrl}>
                <span className="underline underline-offset-2 font-semibold cursor-pointer hover:opacity-80 transition-opacity text-xs">
                  {broadcast.ctaText} →
                </span>
              </Link>
            ) : (
              <a
                href={broadcast.ctaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 font-semibold hover:opacity-80 transition-opacity text-xs"
              >
                {broadcast.ctaText} →
              </a>
            )
          )}
        </motion.div>
      </AnimatePresence>

      {active.length > 1 && (
        <>
          <button
            onClick={goPrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-white/20 transition-colors"
            aria-label="Previous"
            data-testid="button-broadcast-prev"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>

          <button
            onClick={goNext}
            className="absolute right-8 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-white/20 transition-colors"
            aria-label="Next"
            data-testid="button-broadcast-next"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </>
      )}

      <button
        onClick={() => setDismissed(true)}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-white/20 transition-colors"
        aria-label="Dismiss"
        data-testid="button-dismiss-banner"
      >
        <X className="h-3.5 w-3.5" />
      </button>

      {active.length > 1 && (
        <div className="flex items-center justify-center gap-1.5 pb-1">
          {active.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i, i > safeIndex ? 1 : -1)}
              className={`h-1 rounded-full transition-all duration-300 ${
                i === safeIndex ? "w-4 bg-white" : "w-1.5 bg-white/40"
              }`}
              aria-label={`Broadcast ${i + 1}`}
              data-testid={`button-broadcast-dot-${i}`}
            />
          ))}
        </div>
      )}

      {active.length > 1 && !paused && (
        <div className="absolute bottom-0 left-0 h-0.5 w-full bg-white/10">
          <motion.div
            className={`h-full ${progressBarColor} opacity-70`}
            style={{ width: `${progress}%` }}
            transition={{ ease: "linear" }}
          />
        </div>
      )}
    </div>
  );
}
