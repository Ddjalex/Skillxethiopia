import { Navbar } from "@/components/layout-nav";
import { useCourseDetail, useBuyItem, useDashboardCourse } from "@/hooks/use-courses";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Loader2, Lock, Play, Clock, CheckCircle, AlertCircle,
  Users, Star, BookOpen, ChevronRight,
  ShieldCheck, Infinity, Smartphone, Trophy, Globe
} from "lucide-react";
import { Link, useRoute, useLocation } from "wouter";
import { PaymentPanel } from "@/components/payment-panel";
import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

function StarRating({ rating, size = "md" }: { rating: number; size?: "sm" | "md" }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  const sz = size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4";
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          className={`${sz} ${
            i <= full
              ? "fill-amber-400 text-amber-400"
              : i === full + 1 && half
                ? "fill-amber-200 text-amber-400"
                : "fill-gray-600 text-gray-600"
          }`}
        />
      ))}
    </div>
  );
}

function InteractiveStarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  const display = hovered || value;
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(i => (
        <button
          key={i}
          type="button"
          onMouseEnter={() => setHovered(i)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(i)}
          className="focus:outline-none"
          data-testid={`star-rating-${i}`}
        >
          <Star className={`w-7 h-7 transition-colors ${i <= display ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30 hover:text-amber-300"}`} />
        </button>
      ))}
    </div>
  );
}

function VideoPreview({ course }: { course: any }) {
  if (course.introVideoRef) {
    const src = course.introVideoProvider === "BUNNY"
      ? (course.introVideoRef.startsWith("http") ? course.introVideoRef : `https://iframe.mediadelivery.net/embed/${course.introVideoRef}?autoplay=false&loop=false&muted=false&preload=true`)
      : course.introVideoProvider === "YOUTUBE"
        ? (course.introVideoRef.startsWith("http") ? course.introVideoRef : `https://www.youtube.com/embed/${course.introVideoRef}`)
      : course.introVideoProvider === "VIMEO"
        ? (course.introVideoRef.startsWith("http") ? course.introVideoRef : `https://player.vimeo.com/video/${course.introVideoRef}`)
      : course.introVideoRef;
    return (
      <iframe
        src={src}
        className="w-full h-full"
        allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
        allowFullScreen
      />
    );
  }
  if (course.thumbnailUrl) {
    return (
      <>
        <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40">
          <div className="h-16 w-16 rounded-full bg-white/90 flex items-center justify-center shadow-xl mb-3">
            <Play className="h-7 w-7 fill-gray-900 text-gray-900 ml-1" />
          </div>
          <span className="text-white text-sm font-medium drop-shadow">Preview this course</span>
        </div>
      </>
    );
  }
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-gray-800 gap-3">
      <Play className="w-12 h-12 text-white/30" />
      <span className="text-white/50 text-sm">No preview available</span>
    </div>
  );
}

export default function CourseDetailPage() {
  const [, params] = useRoute("/course/:slug");
  const slug = params?.slug || "";
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const { data, isLoading } = useCourseDetail(slug);
  const { user } = useAuth();
  const buyMutation = useBuyItem();
  const { data: dashboardData } = useDashboardCourse(data?.course?.id || 0);

  const sidebarRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);

  const [paymentState, setPaymentState] = useState<{
    isOpen: boolean;
    itemType: "SEASON" | "EPISODE" | null;
    itemId: number | null;
    amount: string;
  }>({ isOpen: false, itemType: null, itemId: null, amount: "" });

  const [userRatingVal, setUserRatingVal] = useState<number>(0);
  const [ratingInitialized, setRatingInitialized] = useState(false);

  const rateMutation = useMutation({
    mutationFn: async ({ courseId, rating }: { courseId: number; rating: number }) => {
      return apiRequest("POST", `/api/courses/${courseId}/rate`, { rating });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/public/course", slug] });
      toast({ title: "Rating submitted", description: "Thank you for rating this course!" });
    },
    onError: (err: any) => {
      toast({ title: "Cannot rate", description: err.message || "You must purchase this course first.", variant: "destructive" });
    }
  });

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

  const { course, seasons, category, userRating } = data as any;
  const courseAny = course as any;

  if (!ratingInitialized && userRating) {
    setUserRatingVal(userRating);
    setRatingInitialized(true);
  }

  const enrichedSeasons = seasons.map((s: any) => {
    const dashboardSeason = dashboardData?.seasons.find((ds: any) => ds.id === s.id);
    return {
      ...s,
      isUnlocked: dashboardSeason?.isUnlocked || false,
      isPending: dashboardSeason?.isPending || false,
      episodes: s.episodes.map((e: any) => {
        const dashboardEp = dashboardSeason?.episodes.find((de: any) => de.id === e.id);
        return { ...e, isUnlocked: dashboardEp?.isUnlocked || false, isPending: dashboardEp?.isPending || false };
      })
    };
  });

  const totalEpisodes = enrichedSeasons.reduce((acc: number, s: any) => acc + s.episodes.length, 0);
  const isFree = course?.priceStrategy === "FREE";
  const avgRating: number = courseAny.avgRating || 0;
  const totalStudents: number = courseAny.totalStudents || 0;
  const hasRating = avgRating > 0;
  const hasInstructor = !!(courseAny.instructorImageUrl || courseAny.instructorBio);
  const hasPurchasedAnything = enrichedSeasons.some((s: any) => s.isUnlocked || s.episodes.some((e: any) => e.isUnlocked));

  const handleBuyInitiate = (itemType: "SEASON" | "EPISODE", itemId: number, amount: string) => {
    if (!user) { window.location.href = "/auth"; return; }
    setPaymentState({ isOpen: true, itemType, itemId, amount });
  };

  const handlePaymentConfirm = (transactionRef: string, paymentProofUrl?: string) => {
    if (!paymentState.itemType || !paymentState.itemId) return;
    buyMutation.mutate(
      { itemType: paymentState.itemType, itemId: paymentState.itemId, amount: paymentState.amount, transactionRef, paymentProofUrl },
      {
        onSuccess: () => {
          setPaymentState(prev => ({ ...prev, isOpen: false }));
          navigate(`/dashboard/course/${(data as any)?.course?.id}`);
        }
      }
    );
  };

  // Find the lowest season price for the CTA
  const firstUnlockedSeason = enrichedSeasons.find((s: any) => !s.isUnlocked && !s.isPending);
  const ctaPrice = firstUnlockedSeason?.price || null;

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

      {/* ── DARK HERO HEADER ── */}
      <div ref={heroRef} className="bg-[#1c1d1f] mt-16">
        <div className="max-w-[1340px] mx-auto px-4 lg:px-8">
          <div className="flex gap-8">
            {/* Left hero content */}
            <div className="flex-1 min-w-0 py-10 pr-0 lg:pr-8 xl:pr-[380px]">

              {/* Breadcrumb */}
              <nav className="flex items-center gap-1.5 mb-5 text-xs text-gray-400" data-testid="breadcrumb">
                <Link href="/" className="hover:text-white transition-colors">Home</Link>
                <ChevronRight className="h-3 w-3 flex-shrink-0" />
                <Link href="/browse" className="hover:text-white transition-colors">Courses</Link>
                {category && (
                  <>
                    <ChevronRight className="h-3 w-3 flex-shrink-0" />
                    <Link href={`/browse?categoryId=${category.id}`} className="hover:text-white transition-colors truncate max-w-[120px]">
                      {category.name}
                    </Link>
                  </>
                )}
                <ChevronRight className="h-3 w-3 flex-shrink-0" />
                <span className="text-gray-300 truncate max-w-[160px]">{course.title}</span>
              </nav>

              {/* Category badge */}
              {category && (
                <div className="mb-3">
                  <span className="inline-block bg-amber-400/20 text-amber-300 text-xs font-semibold px-2.5 py-1 rounded" data-testid="category-badge">
                    {category.name}
                  </span>
                </div>
              )}

              {/* Title */}
              <h1 className="text-2xl sm:text-3xl lg:text-[2rem] font-bold text-white leading-tight mb-4" data-testid="course-title">
                {course.title}
              </h1>

              {/* Description */}
              <p className="text-gray-300 text-base leading-relaxed mb-5 max-w-2xl" data-testid="course-description">
                {course.description}
              </p>

              {/* Rating row */}
              <div className="flex flex-wrap items-center gap-3 mb-4">
                {hasRating && (
                  <div className="flex items-center gap-2">
                    <span className="text-amber-400 font-bold text-sm" data-testid="avg-rating">{avgRating.toFixed(1)}</span>
                    <StarRating rating={avgRating} />
                    {totalStudents > 0 && (
                      <span className="text-gray-400 text-sm underline underline-offset-2 cursor-default" data-testid="total-students">
                        ({totalStudents >= 1000 ? `${(totalStudents / 1000).toFixed(1)}k` : totalStudents} learners)
                      </span>
                    )}
                  </div>
                )}
                <div className="flex items-center gap-1.5 text-gray-400 text-sm">
                  <Users className="w-3.5 h-3.5" />
                  <span>{seasons.length} Season{seasons.length !== 1 ? "s" : ""} · {totalEpisodes} Episodes</span>
                </div>
              </div>

              {/* Instructor + meta */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-400">
                <span>
                  Created by{" "}
                  <span className="text-blue-400 font-medium" data-testid="instructor-name">{course.instructorName}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Recently updated
                </span>
                <span className="flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5" />
                  Amharic / English
                </span>
              </div>

              {/* Free badge */}
              {isFree && (
                <div className="mt-5 inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-sm font-semibold px-4 py-2 rounded-lg">
                  <CheckCircle className="w-4 h-4" />
                  Free Course — All content unlocked
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── MAIN BODY: two-column layout ── */}
      <div className="max-w-[1340px] mx-auto px-4 lg:px-8">
        <div className="flex gap-8 relative">

          {/* LEFT MAIN COLUMN */}
          <div className="flex-1 min-w-0 py-10 space-y-12 lg:pr-8 xl:pr-[380px]">

            {/* What you'll learn */}
            <section data-testid="section-learn">
              <h2 className="text-xl font-bold mb-5 pb-3 border-b border-border">What you'll learn</h2>
              <div className="border border-border rounded-xl p-6 grid sm:grid-cols-2 gap-3">
                {[
                  "Expert-led video lessons",
                  "Hands-on projects & exercises",
                  "Lifetime access to content",
                  "Certificate of completion",
                  "Community support",
                  "Mobile-friendly access",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-2.5 text-sm">
                    <CheckCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Course Description */}
            <section data-testid="section-description">
              <h2 className="text-xl font-bold mb-5 pb-3 border-b border-border">About this course</h2>
              <div className="prose prose-sm max-w-none text-muted-foreground leading-relaxed">
                <p>{course.description}</p>
              </div>
            </section>

            {/* Curriculum */}
            <section data-testid="section-curriculum">
              <div className="flex items-start justify-between mb-5 pb-3 border-b border-border">
                <div>
                  <h2 className="text-xl font-bold">Course Content</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    {seasons.length} section{seasons.length !== 1 ? "s" : ""} · {totalEpisodes} lessons
                  </p>
                </div>
              </div>

              <Accordion type="single" collapsible className="space-y-2">
                {enrichedSeasons.map((season: any) => (
                  <AccordionItem
                    key={season.id}
                    value={`season-${season.id}`}
                    className="border border-border rounded-xl px-0 overflow-hidden bg-card"
                    data-testid={`season-${season.id}`}
                  >
                    <AccordionTrigger className="hover:no-underline px-5 py-4 hover:bg-secondary/50 transition-colors">
                      <div className="flex flex-1 items-center justify-between mr-4 gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 text-xs font-bold text-primary">
                            {season.seasonNumber}
                          </div>
                          <div className="min-w-0 text-left">
                            <span className="font-semibold text-sm block truncate">{season.title}</span>
                            {season.instructorName && (
                              <span className="text-xs text-muted-foreground">By {season.instructorName}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-xs text-muted-foreground">{season.episodes.length} ep</span>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-5 pb-4 pt-1">
                      <Separator className="mb-3" />
                      <div className="space-y-1">
                        {season.episodes.map((ep: any) => (
                          <div key={ep.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary/60 transition-colors" data-testid={`episode-${ep.id}`}>
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="h-7 w-7 rounded-full bg-secondary border border-border flex items-center justify-center text-xs font-semibold text-muted-foreground flex-shrink-0">
                                {ep.episodeNumber}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium truncate flex items-center gap-1.5">
                                  <Play className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                                  {ep.title}
                                  {ep.isPreview && (
                                    <span className="text-[10px] bg-blue-50 text-blue-600 border border-blue-200 rounded px-1.5 py-0.5 font-medium">Preview</span>
                                  )}
                                </p>
                                <p className="text-xs text-muted-foreground pl-4">
                                  {ep.durationSec >= 60 ? `${Math.floor(ep.durationSec / 60)} min` : `${ep.durationSec} sec`}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                              {isFree || ep.isUnlocked || ep.isPreview ? (
                                <Link href={ep.isPreview && !ep.isUnlocked ? `/video/${ep.id}` : `/dashboard/course/${course.id}/episode/${ep.id}`}>
                                  <Button size="sm" variant="ghost" className="h-7 text-xs text-primary hover:text-primary gap-1" data-testid={`watch-ep-${ep.id}`}>
                                    <Play className="w-3 h-3 fill-current" />
                                    {ep.isPreview ? "Preview" : "Watch"}
                                  </Button>
                                </Link>
                              ) : ep.isPending ? (
                                <span className="inline-flex items-center gap-1 text-[10px] bg-amber-50 text-amber-700 border border-amber-200 rounded px-2 py-0.5">
                                  <AlertCircle className="w-3 h-3" /> Pending
                                </span>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-xs gap-1"
                                  onClick={() => handleBuyInitiate("EPISODE", ep.id, ep.price)}
                                  disabled={buyMutation.isPending}
                                  data-testid={`buy-ep-${ep.id}`}
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
            </section>

            {/* Rate this course */}
            {user && hasPurchasedAnything && (
              <section data-testid="section-rating">
                <h2 className="text-xl font-bold mb-5 pb-3 border-b border-border">Rate this Course</h2>
                <div className="bg-card border border-border rounded-xl p-6">
                  <p className="text-sm text-muted-foreground mb-4">
                    {userRatingVal
                      ? "You've already rated this course — you can update your rating."
                      : "Share your experience with other learners."}
                  </p>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <InteractiveStarRating value={userRatingVal} onChange={setUserRatingVal} />
                    <Button
                      size="sm"
                      className="gap-1.5"
                      disabled={!userRatingVal || rateMutation.isPending}
                      onClick={() => rateMutation.mutate({ courseId: course.id, rating: userRatingVal })}
                      data-testid="submit-rating"
                    >
                      {rateMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Star className="w-3.5 h-3.5 fill-current" />}
                      {userRatingVal ? `Submit ${userRatingVal}-star rating` : "Select a rating"}
                    </Button>
                  </div>
                </div>
              </section>
            )}

            {/* Instructor */}
            {hasInstructor && (
              <section data-testid="section-instructor">
                <h2 className="text-xl font-bold mb-5 pb-3 border-b border-border">Your Instructor</h2>
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
                    <h3 className="text-lg font-bold text-blue-600 hover:underline cursor-pointer">{course.instructorName}</h3>
                    {hasRating && (
                      <div className="flex items-center gap-1.5 mt-1">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span className="text-sm font-semibold">{avgRating.toFixed(1)} Instructor Rating</span>
                      </div>
                    )}
                    {totalStudents > 0 && (
                      <div className="flex items-center gap-1.5 mt-1 text-sm text-muted-foreground">
                        <Users className="w-3.5 h-3.5" />
                        <span>{totalStudents >= 1000 ? `${(totalStudents / 1000).toFixed(1)}k` : totalStudents} Students</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 mt-1 text-sm text-muted-foreground">
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>{seasons.length} Course{seasons.length !== 1 ? "s" : ""}</span>
                    </div>
                    {courseAny.instructorBio && (
                      <p className="text-sm text-muted-foreground mt-4 leading-relaxed">{courseAny.instructorBio}</p>
                    )}
                  </div>
                </div>
              </section>
            )}

          </div>

          {/* RIGHT STICKY SIDEBAR */}
          <div className="hidden xl:block absolute right-0 top-0 w-[360px]" ref={sidebarRef}>
            <div className="sticky top-20 w-[360px]">
              <div className="bg-card border border-border rounded-xl shadow-xl overflow-hidden -mt-32">

                {/* Video preview */}
                <div className="aspect-video relative bg-gray-900 overflow-hidden">
                  <VideoPreview course={course} />
                </div>

                {/* Price + CTA */}
                <div className="p-6 space-y-4">
                  {isFree ? (
                    <>
                      <div className="text-center">
                        <span className="text-4xl font-bold text-emerald-600" data-testid="sidebar-price">Free</span>
                      </div>
                      <Button className="w-full h-12 text-base font-bold bg-emerald-600 hover:bg-emerald-700 text-white" data-testid="sidebar-cta">
                        <Play className="w-4 h-4 mr-2 fill-current" />
                        Start Learning Free
                      </Button>
                    </>
                  ) : (
                    <>
                      <div>
                        {ctaPrice ? (
                          <div className="flex items-baseline gap-2" data-testid="sidebar-price">
                            <span className="text-4xl font-bold">{ctaPrice}</span>
                            <span className="text-lg text-muted-foreground font-medium">ETB</span>
                          </div>
                        ) : (
                          <div className="text-center" data-testid="sidebar-price">
                            <span className="text-2xl font-bold text-emerald-600">All Purchased</span>
                          </div>
                        )}
                      </div>
                      {ctaPrice ? (
                        <>
                          <Button
                            className="w-full h-12 text-base font-bold"
                            onClick={() => firstUnlockedSeason && handleBuyInitiate("SEASON", firstUnlockedSeason.id, firstUnlockedSeason.price)}
                            disabled={buyMutation.isPending}
                            data-testid="sidebar-cta"
                          >
                            {buyMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            Enroll Now
                          </Button>
                          <p className="text-xs text-center text-muted-foreground">30-Day Money-Back Guarantee</p>
                        </>
                      ) : (
                        <Link href={`/dashboard`}>
                          <Button className="w-full h-12 text-base font-bold bg-emerald-600 hover:bg-emerald-700" data-testid="sidebar-cta">
                            Go to My Learning
                          </Button>
                        </Link>
                      )}
                    </>
                  )}

                  {/* Course includes */}
                  <Separator />
                  <div>
                    <p className="text-sm font-bold mb-3">This course includes:</p>
                    <ul className="space-y-2.5">
                      {[
                        { icon: Play, text: `${totalEpisodes} on-demand video lessons` },
                        { icon: Infinity, text: "Full lifetime access" },
                        { icon: Smartphone, text: "Access on mobile and desktop" },
                        { icon: Trophy, text: "Certificate of completion" },
                        { icon: ShieldCheck, text: "30-Day money-back guarantee" },
                      ].map(({ icon: Icon, text }) => (
                        <li key={text} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                          <Icon className="w-4 h-4 flex-shrink-0 text-foreground" />
                          {text}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Share / Gift row */}
                  <Separator />
                  <div className="flex justify-center gap-4 text-xs text-blue-600 font-medium">
                    <button className="hover:underline">Share</button>
                    <button className="hover:underline">Gift this course</button>
                    <button className="hover:underline">Apply coupon</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
