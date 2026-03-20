import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, useCallback } from "react";
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

const TypeIcon: Record<string, React.ComponentType<any>> = {
  DISCOUNT: Tag,
  SALE: Flame,
  ANNOUNCEMENT: Megaphone,
  UPDATE: Sparkles,
};

export function BroadcastBanner() {
  const [dismissed, setDismissed] = useState(false);
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);

  const { data: broadcasts } = useQuery<Broadcast[]>({
    queryKey: ["/api/broadcasts/active"],
    staleTime: 60_000,
  });

  const active = Array.isArray(broadcasts) ? broadcasts.filter(b => b.isActive) : [];

  const goTo = useCallback((index: number, dir: number) => {
    setDirection(dir);
    setCurrent(index);
  }, []);

  const goNext = useCallback(() => {
    if (active.length <= 1) return;
    goTo((current + 1) % active.length, 1);
  }, [current, active.length, goTo]);

  const goPrev = useCallback(() => {
    if (active.length <= 1) return;
    goTo((current - 1 + active.length) % active.length, -1);
  }, [current, active.length, goTo]);

  useEffect(() => {
    if (active.length <= 1) return;
    const timer = setInterval(goNext, 10000);
    return () => clearInterval(timer);
  }, [active.length, goNext]);

  useEffect(() => {
    if (current >= active.length && active.length > 0) {
      setCurrent(0);
    }
  }, [active.length, current]);

  if (!active.length || dismissed) return null;

  const safeIndex = Math.min(current, active.length - 1);
  const broadcast = active[safeIndex];
  const colorClass = colorMap[broadcast.bgColor] || colorMap.blue;
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
    >
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={broadcast.id}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.35, ease: "easeInOut" }}
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
        <button
          onClick={goPrev}
          className="absolute left-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-white/20 transition-colors"
          aria-label="Previous"
          data-testid="button-broadcast-prev"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
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
        <button
          onClick={goNext}
          className="absolute right-8 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-white/20 transition-colors"
          aria-label="Next"
          data-testid="button-broadcast-next"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      )}

      {active.length > 1 && (
        <div className="flex items-center justify-center gap-1 pb-1">
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
    </div>
  );
}
