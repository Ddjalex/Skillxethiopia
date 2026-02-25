import { Navbar } from "@/components/layout-nav";
import { useEpisodeStream } from "@/hooks/use-courses";
import { useRoute } from "wouter";
import { Loader2, AlertCircle } from "lucide-react";
import ReactPlayer from "react-player";

export default function VideoOnlyPage() {
  const [, params] = useRoute("/video/:id");
  const id = parseInt(params?.id || "0");
  const { data, isLoading, error } = useEpisodeStream(id);

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
        <ReactPlayer
          url={data.videoProvider === "VIMEO" 
            ? `https://vimeo.com/${data.videoRef}` 
            : data.videoRef
          }
          width="100%"
          height="100%"
          controls
          playing
        />
      </div>
    </div>
  );
}
