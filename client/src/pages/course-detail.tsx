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
import {
  Loader2, Lock, Play, Clock, CheckCircle, AlertCircle,
  Users, Star, BookOpen, ChevronRight, GraduationCap
} from "lucide-react";
import { Link, useRoute } from "wouter";
import { PaymentPanel } from "@/components/payment-panel";
import { useState } from "react";

function StarRating({ rating }: { rating: string | null | undefined }) {
  const val = parseFloat(rating || "0");
  if (!val) return null;
  const full = Math.floor(val);
  const half = val - full >= 0.5;
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          className={`w-4 h-4 ${
            i <= full
              ? "fill-amber-400 text-amber-400"
              : i === full + 1 && half
                ? "fill-amber-200 text-amber-400"
                : "text-muted-foreground/30"
          }`}
        />
      ))}
    </div>
  );
}

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
          <div className="text-center">
            <p className="text-lg font-semibold text-foreground mb-1">Course not found</p>
            <p className="text-sm text-muted-foreground">This course may have been removed.</p>
            <Link href="/browse">
              <Button size="sm" variant="outline" className="mt-4">Browse Courses</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { course, seasons, category } = data;
  const courseAny = course as any;

  const enrichedSeasons = seasons.map(s => {
    const dashboardSeason = dashboardData?.seasons.find(ds => ds.id === s.id);
    return {
      ...s,
      isUnlocked: dashboardSeason?.isUnlocked || false,
      isPending: dashboardSeason?.isPending || false,
      episodes: s.episodes.map(e => {
        const dashboardEp = dashboardSeason?.episodes.find(de => de.id === e.id);
        return { ...e, isUnlocked: dashboardEp?.isUnlocked || false, isPending: dashboardEp?.isPending || false };
      })
    };
  });

  const totalEpisodes = enrichedSeasons.reduce((acc, s) => acc + s.episodes.length, 0);
  const isFree = course?.priceStrategy === "FREE";
  const ratingVal = parseFloat(courseAny.rating || "0");
  const hasRating = ratingVal > 0;
  const totalStudents = courseAny.totalStudents || 0;
  const hasInstructor = !!(courseAny.instructorImageUrl || courseAny.instructorBio);

  const handleBuyInitiate = (itemType: "SEASON" | "EPISODE", itemId: number, amount: string) => {
    if (!user) { window.location.href = "/auth"; return; }
    setPaymentState({ isOpen: true, itemType, itemId, amount });
  };

  const handlePaymentConfirm = (transactionRef: string, paymentProofUrl?: string) => {
    if (!paymentState.itemType || !paymentState.itemId) return;
    buyMutation.mutate(
      { itemType: paymentState.itemType, itemId: paymentState.itemId, amount: paymentState.amount, transactionRef, paymentProofUrl },
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

      {/* Breadcrumb + Hero */}
      <div className="mt-16 border-b border-border bg-card">
        <div className="container mx-auto px-4 lg:px-6">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 py-4 text-xs text-muted-foreground">
            <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
            <ChevronRight className="h-3 w-3" />
            <Link href="/browse" className="hover:text-foreground transition-colors">Courses</Link>
            {category && (
              <>
                <ChevronRight className="h-3 w-3" />
                <Link href={`/browse?categoryId=${category.id}`} className="hover:text-foreground transition-colors">
                  {category.name}
                </Link>
              </>
            )}
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground font-medium truncate max-w-[150px]">{course.title}</span>
          </nav>

          {/* Hero */}
          <div className="py-8 flex flex-col lg:flex-row gap-8 items-start">
            <div className="flex-1 space-y-5">
              <div className="flex flex-wrap items-center gap-2">
                {category && (
                  <Badge variant="secondary" className="font-semibold">{category.name}</Badge>
                )}
                <Badge variant="outline">{seasons.length} Season{seasons.length !== 1 ? "s" : ""}</Badge>
                <Badge variant="outline">{totalEpisodes} Episodes</Badge>
              </div>

              <h1 className="text-3xl lg:text-4xl font-bold tracking-tight leading-tight">
                {course.title}
              </h1>

              <p className="text-muted-foreground leading-relaxed max-w-2xl">
                {course.description}
              </p>

              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground pt-1">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" /> Recently updated
                </span>
                {totalStudents > 0 && (
                  <span className="flex items-center gap-1.5">
                    <Users className="w-4 h-4" />
                    {totalStudents >= 1000
                      ? `${(totalStudents / 1000).toFixed(1)}k`
                      : totalStudents} learners
                  </span>
                )}
                {hasRating && (
                  <span className="flex items-center gap-2">
                    <StarRating rating={courseAny.rating} />
                    <span className="font-semibold text-amber-600">{ratingVal.toFixed(1)}</span>
                  </span>
                )}
                <Separator orientation="vertical" className="h-4" />
                <span>
                  By <span className="text-foreground font-semibold">{course.instructorName}</span>
                </span>
              </div>
            </div>

            {/* Sticky course card */}
            <div className="w-full lg:w-80 xl:w-96 flex-shrink-0">
              <div className="rounded-xl border border-border shadow-md bg-card overflow-hidden">
                <div className="aspect-video relative bg-secondary">
                  {course.introVideoRef ? (
                    <iframe
                      src={
                        course.introVideoProvider === "BUNNY"
                          ? (course.introVideoRef.startsWith("http")
                              ? course.introVideoRef
                              : `https://iframe.mediadelivery.net/embed/${course.introVideoRef}?autoplay=false&loop=false&muted=false&preload=true`)
                          : course.introVideoProvider === "YOUTUBE"
                            ? (course.introVideoRef.startsWith("http")
                                ? course.introVideoRef
                                : `https://www.youtube.com/embed/${course.introVideoRef}`)
                          : course.introVideoProvider === "VIMEO"
                            ? (course.introVideoRef.startsWith("http")
                                ? course.introVideoRef
                                : `https://player.vimeo.com/video/${course.introVideoRef}`)
                          : course.introVideoRef
                      }
                      className="w-full h-full"
                      allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
                      allowFullScreen
                    />
                  ) : course.thumbnailUrl ? (
                    <>
                      <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <div className="h-14 w-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                          <Play className="h-6 w-6 fill-primary text-primary ml-0.5" />
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                      <Play className="w-12 h-12 text-primary/30" />
                    </div>
                  )}
                </div>
                <div className="p-5 space-y-4">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xl font-bold">
                      {isFree ? "Free" : "Premium Content"}
                    </span>
                    {isFree && (
                      <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 font-semibold">FREE</Badge>
                    )}
                  </div>
                  {hasRating && (
                    <div className="flex items-center gap-2">
                      <StarRating rating={courseAny.rating} />
                      <span className="text-sm font-semibold text-amber-600">{ratingVal.toFixed(1)}</span>
                      {totalStudents > 0 && (
                        <span className="text-xs text-muted-foreground">
                          ({totalStudents >= 1000 ? `${(totalStudents / 1000).toFixed(1)}k` : totalStudents} learners)
                        </span>
                      )}
                    </div>
                  )}
                  {isFree ? (
                    <p className="text-xs text-center text-green-700 bg-green-50 border border-green-200 rounded-lg py-3 px-2 font-medium">
                      All content is free — watch any episode below
                    </p>
                  ) : (
                    <>
                      <p className="text-xs text-muted-foreground text-center border border-dashed border-border rounded-lg py-3 px-2">
                        Purchase individual seasons or episodes below
                      </p>
                      <p className="text-xs text-center text-muted-foreground">
                        30-Day Money-Back Guarantee
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="container mx-auto px-4 lg:px-6 py-10 space-y-12">

        {/* Curriculum */}
        <div className="max-w-3xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <BookOpen className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Course Curriculum</h2>
              <p className="text-xs text-muted-foreground">{totalEpisodes} lessons across {seasons.length} seasons</p>
            </div>
          </div>

          <Accordion type="single" collapsible className="space-y-3">
            {enrichedSeasons.map((season) => (
              <AccordionItem
                key={season.id}
                value={`season-${season.id}`}
                className="border border-border rounded-xl px-0 overflow-hidden bg-card shadow-sm"
              >
                <AccordionTrigger className="hover:no-underline px-5 py-4 hover:bg-secondary/50 transition-colors">
                  <div className="flex flex-1 items-center justify-between mr-4 gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 text-xs font-bold text-primary">
                        {season.seasonNumber}
                      </div>
                      <div className="min-w-0 text-left">
                        <span className="font-semibold text-sm block truncate">
                          {season.title}
                        </span>
                        {season.instructorName && (
                          <span className="text-xs text-muted-foreground">
                            By {season.instructorName}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs text-muted-foreground">{season.episodes.length} ep</span>
                      {isFree ? (
                        <span className="badge-success">
                          <CheckCircle className="w-3 h-3" /> Free
                        </span>
                      ) : season.isUnlocked ? (
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
                          {season.price} ETB
                        </Button>
                      )}
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-5 pb-4 pt-1">
                  <Separator className="mb-3" />
                  <div className="space-y-1.5">
                    {season.episodes.map((ep) => (
                      <div
                        key={ep.id}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary/60 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-7 w-7 rounded-full bg-secondary border border-border flex items-center justify-center text-xs font-semibold text-muted-foreground flex-shrink-0">
                            {ep.episodeNumber}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate flex items-center gap-1.5">
                              {ep.title}
                              {ep.isPreview && (
                                <span className="badge-info text-[10px]">Preview</span>
                              )}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {ep.durationSec >= 60
                                ? `${Math.floor(ep.durationSec / 60)} min`
                                : `${ep.durationSec} sec`}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                          {isFree || ep.isUnlocked || ep.isPreview ? (
                            <Link href={ep.isPreview && !ep.isUnlocked ? `/video/${ep.id}` : `/dashboard/course/${course.id}/episode/${ep.id}`}>
                              <Button size="sm" variant="ghost" className="h-7 text-xs text-primary hover:text-primary gap-1">
                                <Play className="w-3 h-3 fill-current" />
                                {ep.isPreview ? "Preview" : "Watch"}
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

        {/* Instructor Section */}
        {hasInstructor && (
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <GraduationCap className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-bold">Your Instructor</h2>
                <p className="text-xs text-muted-foreground">Meet the person teaching this course</p>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-start gap-5">
                {courseAny.instructorImageUrl ? (
                  <img
                    src={courseAny.instructorImageUrl}
                    alt={course.instructorName}
                    className="w-20 h-20 rounded-full object-cover flex-shrink-0 border-2 border-border shadow-sm"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 border-2 border-border text-2xl font-bold text-primary">
                    {course.instructorName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-bold">{course.instructorName}</h3>
                  {hasRating && (
                    <div className="flex items-center gap-1.5 mt-1">
                      <StarRating rating={courseAny.rating} />
                      <span className="text-sm font-semibold text-amber-600">{ratingVal.toFixed(1)}</span>
                      <span className="text-xs text-muted-foreground">Instructor Rating</span>
                    </div>
                  )}
                  {totalStudents > 0 && (
                    <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                      <Users className="w-3.5 h-3.5" />
                      <span>
                        {totalStudents >= 1000
                          ? `${(totalStudents / 1000).toFixed(1)}k`
                          : totalStudents} Students
                      </span>
                    </div>
                  )}
                  {courseAny.instructorBio && (
                    <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
                      {courseAny.instructorBio}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
