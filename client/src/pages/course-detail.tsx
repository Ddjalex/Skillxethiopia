import { Navbar } from "@/components/layout-nav";
import { useCourseDetail, useBuyItem, useDashboardCourse } from "@/hooks/use-courses";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Loader2, Lock, Play, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { Link, useRoute } from "wouter";
import { PaymentPanel } from "@/components/payment-panel";
import { useState } from "react";

export default function CourseDetailPage() {
  const [, params] = useRoute("/course/:slug");
  const slug = params?.slug || "";
  
  const { data, isLoading } = useCourseDetail(slug);
  const { user } = useAuth();
  const buyMutation = useBuyItem();
  const { data: dashboardData } = useDashboardCourse(data?.course?.id || 0);

  const [paymentState, setPaymentState] = useState<{
    isOpen: boolean;
    itemType: "SEASON" | "EPISODE" | null;
    itemId: number | null;
    amount: string;
  }>({
    isOpen: false,
    itemType: null,
    itemId: null,
    amount: ""
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <p>Course not found</p>
        </div>
      </div>
    );
  }

  const { course, seasons, category } = data;
  
  const enrichedSeasons = seasons.map(s => {
    const dashboardSeason = dashboardData?.seasons.find(ds => ds.id === s.id);
    return {
      ...s,
      isUnlocked: dashboardSeason?.isUnlocked || false,
      isPending: dashboardSeason?.isPending || false,
      episodes: s.episodes.map(e => {
        const dashboardEp = dashboardSeason?.episodes.find(de => de.id === e.id);
        return {
          ...e,
          isUnlocked: dashboardEp?.isUnlocked || e.isPreview || e.price === "0",
          isPending: dashboardEp?.isPending || false
        };
      })
    };
  });

  const handleBuyInitiate = (itemType: "SEASON" | "EPISODE", itemId: number, amount: string) => {
    if (!user) {
      window.location.href = "/auth";
      return;
    }
    setPaymentState({
      isOpen: true,
      itemType,
      itemId,
      amount
    });
  };

  const handlePaymentConfirm = (transactionRef: string, paymentProofUrl?: string) => {
    if (!paymentState.itemType || !paymentState.itemId) return;
    
    buyMutation.mutate({ 
      itemType: paymentState.itemType, 
      itemId: paymentState.itemId, 
      amount: paymentState.amount,
      transactionRef,
      paymentProofUrl,
    }, {
      onSuccess: () => {
        setPaymentState(prev => ({ ...prev, isOpen: false }));
      }
    });
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

      {/* Hero Header */}
      <div className="bg-muted/30 border-b border-border">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="flex-1 space-y-6">
              <div className="flex items-center gap-3">
                {category && (
                  <Badge variant="outline" className="border-primary/50 text-primary">
                    {category.name}
                  </Badge>
                )}
                <Badge variant="secondary">
                  {seasons.length} Seasons
                </Badge>
              </div>

              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
                {course.title}
              </h1>

              <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl">
                {course.description}
              </p>

              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" /> Last updated recently
                </span>
                <span>•</span>
                <span>By <span className="text-foreground font-medium">{course.instructorName}</span></span>
              </div>
            </div>

            {/* Course Thumbnail Card */}
            <div className="w-full md:w-96 flex-shrink-0">
              <div className="rounded-xl overflow-hidden border border-border shadow-2xl bg-card">
                <div className="aspect-video bg-muted relative">
                  {course.thumbnailUrl && (
                    <img 
                      src={course.thumbnailUrl} 
                      alt={course.title} 
                      className="w-full h-full object-cover"
                    />
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <Play className="w-16 h-16 text-white opacity-80" />
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-2xl">
                      {course.priceStrategy === "FREE" ? "Free" : "Premium"}
                    </span>
                  </div>
                  <Button className="w-full size-lg text-lg font-bold" disabled>
                    Scroll down to purchase
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">
                    30-Day Money-Back Guarantee
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Curriculum Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl">
          <h2 className="text-2xl font-bold mb-6">Course Content</h2>
          
          <Accordion type="single" collapsible className="w-full space-y-4">
            {enrichedSeasons.map((season) => (
              <AccordionItem key={season.id} value={`season-${season.id}`} className="border rounded-lg px-4 bg-card">
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex flex-1 items-center justify-between mr-4">
                    <span className="font-semibold text-lg">
                      Season {season.seasonNumber}: {season.title}
                    </span>
                    <div className="flex items-center gap-4">
                      <Badge variant="outline">{season.episodes.length} Episodes</Badge>
                      {season.isUnlocked ? (
                        <Badge variant="outline" className="text-green-500 border-green-500">
                          <CheckCircle className="w-3 h-3 mr-1" /> Unlocked
                        </Badge>
                      ) : season.isPending ? (
                        <Badge variant="outline" className="text-orange-500 border-orange-500">
                          <AlertCircle className="w-3 h-3 mr-1" /> Pending Approval
                        </Badge>
                      ) : (
                        <Button 
                          size="sm" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleBuyInitiate("SEASON", season.id, season.price);
                          }}
                          disabled={buyMutation.isPending}
                        >
                          Buy Season ({season.price} ETB)
                        </Button>
                      )}
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-2 pb-6">
                  <div className="space-y-2">
                    {season.episodes.map((ep) => (
                      <div 
                        key={ep.id} 
                        className="flex items-center justify-between p-3 rounded-md hover:bg-muted/50 transition-colors border border-transparent hover:border-border/50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground">
                            {ep.episodeNumber}
                          </div>
                          <div>
                            <p className="font-medium text-sm flex items-center gap-2">
                              {ep.title}
                              {ep.isPreview && <Badge variant="secondary" className="text-[10px] h-4">Preview</Badge>}
                            </p>
                            <p className="text-xs text-muted-foreground">{Math.floor(ep.durationSec / 60)} mins</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {ep.isUnlocked ? (
                            <Link href={`/dashboard/course/${course.id}/episode/${ep.id}`}>
                              <Button size="sm" variant="ghost" className="text-primary hover:text-primary/80">
                                <Play className="w-4 h-4 mr-2" /> {ep.isPreview ? "Watch Preview" : "Watch"}
                              </Button>
                            </Link>
                          ) : ep.isPending ? (
                            <Badge variant="outline" className="text-orange-500 border-orange-500">
                              <AlertCircle className="w-3 h-3 mr-1" /> Pending Approval
                            </Badge>
                          ) : (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => handleBuyInitiate("EPISODE", ep.id, ep.price)}
                              disabled={buyMutation.isPending}
                            >
                              <Lock className="w-3 h-3 mr-2" /> Buy ({ep.price} ETB)
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
  );
}
