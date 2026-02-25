import { Navbar } from "@/components/layout-nav";
import { useEpisodeStream } from "@/hooks/use-courses";
import { useRoute } from "wouter";
import { Loader2, AlertCircle } from "lucide-react";
import ReactPlayer from "react-player";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function VideoOnlyPage() {
  const [, params] = useRoute("/video/:id");
  const id = parseInt(params?.id || "0");
  const { data, isLoading, error } = useEpisodeStream(id);
  const [playerError, setPlayerError] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-white" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white p-4">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h1 className="text-xl font-bold">Access Denied</h1>
        <p className="text-muted-foreground text-center mt-2 max-w-md">
          {error?.message || "You don't have access to this video or it doesn't exist."}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center overflow-hidden">
      <div className="w-full h-full max-w-[100vw] max-h-[100vh] aspect-video">
        {playerError ? (
          <div className="flex flex-col items-center justify-center h-full text-white p-8 text-center bg-zinc-900/50">
            <AlertCircle className="h-16 w-16 text-destructive mb-6" />
            <h2 className="text-2xl font-bold mb-4">Playback Error</h2>
            <p className="text-muted-foreground max-w-xl mb-8 text-lg">
              {playerError}. If this is a Vimeo video, please check if it's a video ID or a direct link. Ensure the video is not restricted or private without the correct access hash.
            </p>
            <Button 
              variant="outline" 
              className="border-white/20 text-white hover:bg-white/10 px-8 py-6 text-lg"
              onClick={() => setPlayerError(null)}
            >
              Reload Player
            </Button>
          </div>
        ) : (
          <ReactPlayer
            url={data.videoProvider === "VIMEO" 
              ? (data.videoRef.startsWith("http") 
                  ? data.videoRef 
                  : data.videoRef.includes("vimeo.com")
                    ? `https://${data.videoRef.replace(/^https?:\/\//, "")}`
                    : `https://vimeo.com/${data.videoRef}`)
              : data.videoProvider === "YOUTUBE"
                ? (data.videoRef.startsWith("http") ? data.videoRef : `https://www.youtube.com/watch?v=${data.videoRef}`)
                : data.videoRef
            }
            width="100%"
            height="100%"
            controls
            playing
            config={{
              vimeo: { 
                playerOptions: { 
                  responsive: true,
                  autoplay: true,
                  dnt: true
                } 
              },
              youtube: {
                playerVars: { showinfo: 1, autoplay: 1 }
              }
            }}
            onReady={() => setPlayerError(null)}
            onError={(e) => {
              console.error("ReactPlayer Error:", e);
              setPlayerError("This video could not be loaded. Please verify the video ID or URL and check privacy settings.");
            }}
          />
        )}
      </div>
    </div>
  );
}
