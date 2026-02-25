import { Navbar } from "@/components/layout-nav";
import { useEpisodeStream, useDashboardCourse } from "@/hooks/use-courses";
import { Loader2, ChevronLeft, ChevronRight, Menu, AlertCircle } from "lucide-react";
import { useRoute, Link } from "wouter";
import ReactPlayer from "react-player";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState } from "react";

export default function EpisodePlayer() {
  const [, params] = useRoute("/dashboard/course/:courseId/episode/:episodeId");
  const courseId = params?.courseId ? parseInt(params.courseId) : 0;
  const episodeId = params?.episodeId ? parseInt(params.episodeId) : 0;

  const { data: streamData, isLoading: streamLoading } = useEpisodeStream(episodeId);
  const { data: courseData } = useDashboardCourse(courseId);
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [playerError, setPlayerError] = useState<string | null>(null);

  // Find current episode index to determine next/prev
  let currentEpIndex = -1;
  let allEpisodes: any[] = [];
  
  if (courseData) {
    allEpisodes = courseData.seasons.flatMap(s => s.episodes);
    currentEpIndex = allEpisodes.findIndex(e => e.id === episodeId);
  }

  const prevEp = currentEpIndex > 0 ? allEpisodes[currentEpIndex - 1] : null;
  const nextEp = currentEpIndex < allEpisodes.length - 1 ? allEpisodes[currentEpIndex + 1] : null;
  const currentEp = allEpisodes[currentEpIndex];

  if (streamLoading) {
    return (
      <div className="h-screen flex flex-col bg-black">
        <Navbar />
        <div className="flex-1 flex items-center justify-center text-white">
          <Loader2 className="w-12 h-12 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      <Navbar />
      
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col bg-black overflow-y-auto">
          {/* Video Player Container */}
          <div className="w-full aspect-video bg-black relative shadow-2xl z-10">
            {playerError ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-4 text-center">
                <AlertCircle className="w-12 h-12 text-destructive mb-4" />
                <h3 className="text-xl font-bold mb-2">Video Playback Error</h3>
                <p className="text-muted-foreground max-w-md">
                  {playerError}. Please ensure the video reference is a valid Vimeo/YouTube video ID or URL. If you are using a Vimeo link, try using just the numeric ID.
                </p>
                <Button 
                  variant="outline" 
                  className="mt-4 border-white/20 text-white hover:bg-white/10"
                  onClick={() => setPlayerError(null)}
                >
                  Try Again
                </Button>
              </div>
            ) : streamData ? (
              <div className="w-full h-full">
                <ReactPlayer 
                  url={streamData.videoProvider === "VIMEO" 
                    ? (streamData.videoRef.startsWith("http") 
                        ? streamData.videoRef
                        : streamData.videoRef.includes("vimeo.com")
                          ? `https://${streamData.videoRef.replace(/^https?:\/\//, "")}`
                          : `https://vimeo.com/${streamData.videoRef}`)
                    : streamData.videoProvider === "YOUTUBE"
                      ? (streamData.videoRef.startsWith("http") 
                          ? streamData.videoRef 
                          : `https://www.youtube.com/watch?v=${streamData.videoRef}`)
                      : streamData.videoRef
                  } 
                  width="100%" 
                  height="100%" 
                  controls 
                  playing={true}
                  config={{
                    vimeo: { 
                      playerOptions: { 
                        responsive: true,
                        autoplay: true,
                        muted: false,
                        dnt: false,
                        title: true,
                        byline: true,
                        portrait: true
                      } 
                    },
                    youtube: {
                      embedOptions: {
                        autoplay: 1,
                        modestbranding: 1,
                        rel: 0
                      }
                    }
                  }}
                  onError={(e) => {
                    console.error("ReactPlayer Error:", e);
                    setPlayerError("Failed to load the video. This could be due to an invalid video ID, privacy settings, or a connection issue.");
                  }}
                  onReady={() => {
                    console.log("ReactPlayer Ready");
                    setPlayerError(null);
                  }}
                />
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-white/50">
                Failed to load video source
              </div>
            )}
          </div>

          {/* Episode Info & Controls */}
          <div className="p-6 bg-background border-b border-border">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h1 className="text-2xl font-bold mb-2">{currentEp?.title || "Loading..."}</h1>
                <p className="text-muted-foreground">{currentEp?.description}</p>
              </div>
              
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" className="lg:hidden">
                    <Menu className="w-4 h-4 mr-2" /> Episodes
                  </Button>
                </SheetTrigger>
                <SheetContent side="right">
                  <SheetHeader>
                    <SheetTitle>Course Content</SheetTitle>
                  </SheetHeader>
                  <ScrollArea className="h-[calc(100vh-100px)] mt-4">
                     <EpisodeList courseData={courseData} currentId={episodeId} courseId={courseId} />
                  </ScrollArea>
                </SheetContent>
              </Sheet>
            </div>

            <div className="flex items-center gap-4">
              <Link href={prevEp ? `/dashboard/course/${courseId}/episode/${prevEp.id}` : "#"}>
                <Button disabled={!prevEp} variant="outline">
                  <ChevronLeft className="w-4 h-4 mr-2" /> Previous
                </Button>
              </Link>
              <Link href={nextEp ? `/dashboard/course/${courseId}/episode/${nextEp.id}` : "#"}>
                <Button disabled={!nextEp || !nextEp.isUnlocked} className={!nextEp?.isUnlocked ? "opacity-50" : ""}>
                   Next <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Desktop Sidebar */}
        <div className="hidden lg:block w-96 border-l border-border bg-card flex-shrink-0">
          <div className="p-4 border-b border-border font-bold text-lg bg-muted/20">
            Course Content
          </div>
          <ScrollArea className="h-[calc(100vh-128px)]">
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
    <div className="p-4 space-y-6">
      {courseData.seasons.map((season: any) => (
        <div key={season.id}>
          <h4 className="font-semibold text-sm text-muted-foreground mb-2 uppercase tracking-wider">
            Season {season.seasonNumber}
          </h4>
          <div className="space-y-1">
            {season.episodes.map((ep: any) => (
              <Link 
                key={ep.id} 
                href={ep.isUnlocked ? `/dashboard/course/${courseId}/episode/${ep.id}` : "#"}
                className="block"
              >
                <div className={`p-3 rounded-lg text-sm transition-colors flex items-center justify-between ${
                  ep.id === currentId 
                    ? "bg-primary text-primary-foreground shadow-md" 
                    : ep.isUnlocked 
                      ? "hover:bg-muted cursor-pointer" 
                      : "opacity-50 cursor-not-allowed bg-muted/20"
                }`}>
                  <span className="truncate mr-2">
                    {ep.episodeNumber}. {ep.title}
                  </span>
                  {ep.id === currentId && <div className="w-2 h-2 rounded-full bg-white animate-pulse" />}
                  {!ep.isUnlocked && <span className="text-xs border px-1 rounded">Locked</span>}
                </div>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
