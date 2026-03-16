import { Navbar } from "@/components/layout-nav";
import { useEpisodeStream, useDashboardCourse } from "@/hooks/use-courses";
import { Loader2, ChevronLeft, ChevronRight, Menu, AlertCircle, Lock, PlayCircle } from "lucide-react";
import { useRoute, Link } from "wouter";
import ReactPlayer from "react-player";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useState } from "react";

export default function EpisodePlayer() {
  const [, params] = useRoute("/dashboard/course/:courseId/episode/:episodeId");
  const courseId = params?.courseId ? parseInt(params.courseId) : 0;
  const episodeId = params?.episodeId ? parseInt(params.episodeId) : 0;

  const { data: streamData, isLoading: streamLoading } = useEpisodeStream(episodeId);
  const { data: courseData } = useDashboardCourse(courseId);

  const [playerError, setPlayerError] = useState<string | null>(null);

  let currentEpIndex = -1;
  let allEpisodes: any[] = [];

  if (courseData) {
    allEpisodes = courseData.seasons.flatMap((s: any) => s.episodes);
    currentEpIndex = allEpisodes.findIndex((e: any) => e.id === episodeId);
  }

  const prevEp = currentEpIndex > 0 ? allEpisodes[currentEpIndex - 1] : null;
  const nextEp = currentEpIndex < allEpisodes.length - 1 ? allEpisodes[currentEpIndex + 1] : null;
  const currentEp = allEpisodes[currentEpIndex];

  if (streamLoading) {
    return (
      <div className="h-screen flex flex-col bg-[#0a0a0f]">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  const buildVideoUrl = () => {
    if (!streamData) return "";
    const { videoProvider, videoRef } = streamData;
    if (videoProvider === "VIMEO") {
      return videoRef.startsWith("http") ? videoRef : `https://vimeo.com/${videoRef}`;
    }
    if (videoProvider === "YOUTUBE") {
      return videoRef.startsWith("http") ? videoRef : `https://www.youtube.com/watch?v=${videoRef}`;
    }
    if (videoProvider === "DAILYMOTION") {
      return videoRef.startsWith("http") ? videoRef : `https://www.dailymotion.com/video/${videoRef}`;
    }
    return videoRef;
  };

  return (
    <div className="h-screen flex flex-col bg-[#0a0a0f] overflow-hidden">
      <Navbar />

      <div className="flex-1 flex overflow-hidden mt-16">
        {/* Main Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Video */}
          <div className="w-full aspect-video bg-black flex-shrink-0 relative">
            {playerError ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-6 text-center">
                <div className="h-14 w-14 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                  <AlertCircle className="w-7 h-7 text-destructive" />
                </div>
                <h3 className="text-lg font-bold mb-2">Playback Error</h3>
                <p className="text-sm text-white/60 max-w-sm mb-4">
                  Unable to load this video. Please check the video reference or try again.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-white/20 text-white hover:bg-white/10"
                  onClick={() => setPlayerError(null)}
                >
                  Try Again
                </Button>
              </div>
            ) : streamData ? (
              <ReactPlayer
                url={buildVideoUrl()}
                width="100%"
                height="100%"
                controls
                playing
                config={{
                  vimeo: { playerOptions: { responsive: true, autoplay: true, muted: false } },
                  youtube: { embedOptions: { autoplay: 1, modestbranding: 1, rel: 0 } }
                }}
                onError={(e) => {
                  console.error("Player error:", e);
                  setPlayerError("Failed to load video.");
                }}
                onReady={() => setPlayerError(null)}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-white/40 text-sm">
                Video source unavailable
              </div>
            )}
          </div>

          {/* Episode Info */}
          <div className="flex-1 overflow-y-auto bg-background border-t border-border">
            <div className="max-w-3xl mx-auto px-5 py-5">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="min-w-0">
                  <h1 className="text-lg font-bold truncate">{currentEp?.title || "Loading..."}</h1>
                  {currentEp?.description && (
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{currentEp.description}</p>
                  )}
                </div>
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="lg:hidden flex-shrink-0 gap-2">
                      <Menu className="w-4 h-4" /> Episodes
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-80 p-0">
                    <SheetHeader className="px-5 py-4 border-b border-border">
                      <SheetTitle className="text-base">Course Content</SheetTitle>
                    </SheetHeader>
                    <ScrollArea className="h-[calc(100vh-70px)]">
                      <EpisodeList courseData={courseData} currentId={episodeId} courseId={courseId} />
                    </ScrollArea>
                  </SheetContent>
                </Sheet>
              </div>

              <div className="flex items-center gap-3 pt-3 border-t border-border">
                <Link href={prevEp ? `/dashboard/course/${courseId}/episode/${prevEp.id}` : "#"}>
                  <Button
                    disabled={!prevEp}
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                  >
                    <ChevronLeft className="w-4 h-4" /> Previous
                  </Button>
                </Link>
                <Link href={nextEp && nextEp.isUnlocked ? `/dashboard/course/${courseId}/episode/${nextEp.id}` : "#"}>
                  <Button
                    disabled={!nextEp || !nextEp.isUnlocked}
                    size="sm"
                    className="gap-1.5"
                  >
                    Next <ChevronRight className="w-4 h-4" />
                  </Button>
                </Link>
                {nextEp && !nextEp.isUnlocked && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Lock className="h-3 w-3" /> Next episode locked
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Sidebar */}
        <div className="hidden lg:flex flex-col w-80 xl:w-96 border-l border-border bg-card flex-shrink-0">
          <div className="px-4 py-3.5 border-b border-border">
            <h2 className="font-semibold text-sm">Course Content</h2>
            {courseData && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {courseData.course.title}
              </p>
            )}
          </div>
          <ScrollArea className="flex-1">
            <EpisodeList courseData={courseData} currentId={episodeId} courseId={courseId} />
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}

function EpisodeList({ courseData, currentId, courseId }: any) {
  if (!courseData) return null;

  return (
    <div className="p-3 space-y-4">
      {courseData.seasons.map((season: any) => (
        <div key={season.id}>
          <div className="flex items-center gap-2 px-2 mb-2">
            <div className="h-5 w-5 rounded-md bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary flex-shrink-0">
              {season.seasonNumber}
            </div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">
              {season.title}
            </p>
          </div>
          <div className="space-y-0.5">
            {season.episodes.map((ep: any) => {
              const isCurrent = ep.id === currentId;
              return (
                <Link
                  key={ep.id}
                  href={ep.isUnlocked ? `/dashboard/course/${courseId}/episode/${ep.id}` : "#"}
                  className="block"
                >
                  <div className={cn(
                    "flex items-center gap-3 p-2.5 rounded-lg text-sm transition-colors",
                    isCurrent
                      ? "bg-primary text-primary-foreground"
                      : ep.isUnlocked
                        ? "hover:bg-secondary cursor-pointer text-foreground"
                        : "cursor-not-allowed text-muted-foreground opacity-50"
                  )}>
                    <div className={cn(
                      "h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-semibold",
                      isCurrent
                        ? "bg-white/20"
                        : ep.isUnlocked
                          ? "bg-secondary"
                          : "bg-secondary/50"
                    )}>
                      {isCurrent ? (
                        <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      ) : ep.isUnlocked ? (
                        <PlayCircle className="h-3.5 w-3.5 text-primary" />
                      ) : (
                        <Lock className="h-3 w-3" />
                      )}
                    </div>
                    <span className="truncate text-xs font-medium">
                      {ep.episodeNumber}. {ep.title}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
