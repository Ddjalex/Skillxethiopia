import { Navbar } from "@/components/layout-nav";
import { useDashboardCourse, useBuyItem } from "@/hooks/use-courses";
import { Button } from "@/components/ui/button";
import { Loader2, PlayCircle, Lock, ChevronLeft, CheckCircle, AlertCircle, BookOpen, Play } from "lucide-react";
import { Link, useRoute } from "wouter";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import { PaymentPanel } from "@/components/payment-panel";
import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";

export default function DashboardCourse() {
  const [, params] = useRoute("/dashboard/course/:id");
  const id = params?.id ? parseInt(params.id) : 0;

  const { data, isLoading } = useDashboardCourse(id);
  const buyMutation = useBuyItem();
  const { toast } = useToast();
  const prevPendingRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!data?.seasons) return;
    const currentPending = new Set<string>();
    const currentUnlocked = new Set<string>();

    data.seasons.forEach((s: any) => {
      if (s.isPending) currentPending.add(`season-${s.id}`);
      if (s.isUnlocked) currentUnlocked.add(`season-${s.id}`);
      s.episodes?.forEach((e: any) => {
        if (e.isPending) currentPending.add(`episode-${e.id}`);
        if (e.isUnlocked) currentUnlocked.add(`episode-${e.id}`);
      });
    });

    const prev = prevPendingRef.current;
    const newlyUnlocked = [...prev].filter(key => currentUnlocked.has(key));

    if (newlyUnlocked.length > 0) {
      toast({
        title: "Access Granted!",
        description: `${newlyUnlocked.length === 1 ? "Your purchase" : `${newlyUnlocked.length} purchases`} approved — content is now unlocked.`,
      });
    }

    prevPendingRef.current = currentPending;
  }, [data]);

  const [paymentState, setPaymentState] = useState<{
    isOpen: boolean;
    itemType: "SEASON" | "EPISODE" | null;
    itemId: number | null;
    amount: string;
  }>({ isOpen: false, itemType: null, itemId: null, amount: "" });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Course not found.</p>
        </div>
      </div>
    );
  }

  const { course, seasons } = data;

  const totalEpisodes = seasons.reduce((acc: number, s: any) => acc + s.episodes.length, 0);
  const unlockedEpisodes = seasons.reduce(
    (acc: number, s: any) => acc + s.episodes.filter((e: any) => e.isUnlocked).length,
    0
  );
  const progressPct = totalEpisodes > 0 ? Math.round((unlockedEpisodes / totalEpisodes) * 100) : 0;

  const handleBuyInitiate = (itemType: "SEASON" | "EPISODE", itemId: number, amount: string) => {
    setPaymentState({ isOpen: true, itemType, itemId, amount });
  };

  const handlePaymentConfirm = (transactionRef: string) => {
    if (!paymentState.itemType || !paymentState.itemId) return;
    buyMutation.mutate(
      { itemType: paymentState.itemType, itemId: paymentState.itemId, amount: paymentState.amount },
      { onSuccess: () => setPaymentState(prev => ({ ...prev, isOpen: false })) }
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <PaymentPanel
        isOpen={paymentState.isOpen}
        onClose={() => setPaymentState(prev => ({ ...prev, isOpen: false }))}
        itemType={paymentState.itemType || "SEASON"}
        itemId={paymentState.itemId || 0}
        amount={paymentState.amount}
        onConfirm={handlePaymentConfirm}
        isPending={buyMutation.isPending}
      />

      <div className="mt-16">
        {/* Header */}
        <div className="border-b border-border bg-card">
          <div className="container mx-auto px-4 lg:px-6 py-7">
            <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors mb-4">
              <ChevronLeft className="h-3.5 w-3.5" />
              Back to My Learning
            </Link>

            <h1 className="text-2xl font-bold tracking-tight mb-4">{course.title}</h1>

            {/* Progress */}
            <div className="max-w-sm space-y-1.5">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{unlockedEpisodes} of {totalEpisodes} episodes unlocked</span>
                <span className="font-semibold text-foreground">{progressPct}%</span>
              </div>
              <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 lg:px-6 py-8">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-5">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <BookOpen className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h2 className="text-base font-bold">Course Content</h2>
                <p className="text-xs text-muted-foreground">{seasons.length} seasons</p>
              </div>
            </div>

            <Accordion type="single" collapsible className="space-y-3">
              {seasons.map((season: any) => (
                <AccordionItem
                  key={season.id}
                  value={`season-${season.id}`}
                  className="border border-border rounded-xl px-0 overflow-hidden bg-card shadow-sm"
                >
                  <AccordionTrigger className="hover:no-underline px-5 py-4 hover:bg-secondary/50 transition-colors">
                    <div className="flex flex-1 items-center justify-between mr-4 gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                          {season.seasonNumber}
                        </div>
                        <span className="font-semibold text-sm text-left truncate">{season.title}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {season.isUnlocked ? (
                          <span className="badge-success">
                            <CheckCircle className="w-3 h-3" /> Unlocked
                          </span>
                        ) : season.isPending ? (
                          <span className="badge-warning">
                            <AlertCircle className="w-3 h-3" /> Pending
                          </span>
                        ) : (
                          <Button
                            size="sm"
                            className="h-7 text-xs px-3 rounded-lg"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleBuyInitiate("SEASON", season.id, season.price);
                            }}
                            disabled={buyMutation.isPending}
                          >
                            Unlock — {season.price} ETB
                          </Button>
                        )}
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-5 pb-4 pt-1">
                    <Separator className="mb-3" />
                    <div className="space-y-1.5">
                      {season.episodes.map((ep: any) => (
                        <div
                          key={ep.id}
                          className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                            ep.isUnlocked || ep.isPreview ? "hover:bg-secondary/60" : "opacity-60"
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${
                              ep.isUnlocked || ep.isPreview
                                ? "bg-primary/10 text-primary"
                                : "bg-secondary text-muted-foreground"
                            }`}>
                              {ep.isUnlocked || ep.isPreview ? <PlayCircle className="h-4 w-4" /> : ep.episodeNumber}
                            </div>
                            <div className="min-w-0">
                              <span className="text-sm font-medium truncate block">{ep.title}</span>
                              {ep.isPreview && !ep.isUnlocked && (
                                <span className="badge-info text-[10px]">Free Preview</span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                            {ep.isUnlocked ? (
                              <Link href={`/dashboard/course/${course.id}/episode/${ep.id}`}>
                                <Button size="sm" className="h-7 text-xs gap-1">
                                  <PlayCircle className="h-3 w-3" /> Watch
                                </Button>
                              </Link>
                            ) : ep.isPreview ? (
                              <Link href={`/video/${ep.id}`}>
                                <Button size="sm" variant="ghost" className="h-7 text-xs text-primary hover:text-primary gap-1">
                                  <Play className="w-3 h-3 fill-current" /> Preview
                                </Button>
                              </Link>
                            ) : ep.isPending ? (
                              <span className="badge-warning text-[10px]">
                                <AlertCircle className="w-3 h-3" /> Pending
                              </span>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs gap-1"
                                onClick={() => handleBuyInitiate("EPISODE", ep.id, ep.price)}
                                disabled={buyMutation.isPending}
                              >
                                <Lock className="w-3 h-3" /> {ep.price} ETB
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </div>
    </div>
  );
}
