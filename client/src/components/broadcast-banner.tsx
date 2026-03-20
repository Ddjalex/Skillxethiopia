import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { X, Tag, Megaphone, Flame, Sparkles } from "lucide-react";
import { Link } from "wouter";

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

  const { data: broadcast } = useQuery<Broadcast | null>({
    queryKey: ["/api/broadcasts/active"],
    staleTime: 60_000,
  });

  if (!broadcast || dismissed) return null;

  const colorClass = colorMap[broadcast.bgColor] || colorMap.blue;
  const Icon = TypeIcon[broadcast.type] || Megaphone;

  return (
    <div className={`relative z-[60] w-full ${colorClass}`} data-testid="broadcast-banner">
      <div className="container mx-auto px-4 lg:px-6 py-2.5 flex items-center justify-center gap-3 text-sm flex-wrap">
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

        <button
          onClick={() => setDismissed(true)}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-white/20 transition-colors"
          aria-label="Dismiss"
          data-testid="button-dismiss-banner"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
