import { Navbar } from "@/components/layout-nav";
import { useDashboardCourse, useBuyItem } from "@/hooks/use-courses";
import { Button } from "@/components/ui/button";
import { Loader2, PlayCircle, Lock } from "lucide-react";
import { Link, useRoute } from "wouter";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

export default function DashboardCourse() {
  const [, params] = useRoute("/dashboard/course/:id");
  const id = params?.id ? parseInt(params.id) : 0;
  
  const { data, isLoading } = useDashboardCourse(id);
  const buyMutation = useBuyItem();

  if (isLoading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
  if (!data) return <div>Not found</div>;

  const { course, seasons } = data;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="bg-muted/30 border-b border-border py-12">
        <div className="container mx-auto px-4">
          <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-block">
            &larr; Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold mb-4">{course.title}</h1>
          <div className="h-2 w-full max-w-xl bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary w-[35%]" /> {/* Mock progress */}
          </div>
          <p className="text-sm text-muted-foreground mt-2">35% Complete</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Accordion type="single" collapsible className="space-y-4 max-w-4xl">
          {seasons.map((season) => (
            <AccordionItem key={season.id} value={`season-${season.id}`} className="border rounded-lg px-4 bg-card">
              <AccordionTrigger className="hover:no-underline py-4">
                <div className="flex flex-1 items-center justify-between mr-4">
                  <span className="font-semibold text-lg">
                    Season {season.seasonNumber}: {season.title}
                  </span>
                  {!season.isUnlocked && (
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-orange-500 border-orange-500">
                        Pending Approval
                      </Badge>
                      <Button 
                        size="sm" 
                        onClick={(e) => {
                          e.stopPropagation();
                          buyMutation.mutate({ itemType: "SEASON", itemId: season.id });
                        }}
                        disabled={buyMutation.isPending}
                      >
                        Unlock Season ({season.price})
                      </Button>
                    </div>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-4 pt-2">
                <div className="space-y-2">
                  {season.episodes.map((ep) => (
                    <div 
                      key={ep.id} 
                      className={`flex items-center justify-between p-3 rounded-md border ${
                        ep.isUnlocked ? "bg-muted/30 border-transparent hover:bg-muted/50" : "bg-muted/10 border-border/40 opacity-70"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-medium ${
                          ep.isUnlocked ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                        }`}>
                          {ep.episodeNumber}
                        </div>
                        <span className="font-medium">{ep.title}</span>
                      </div>

                      {ep.isUnlocked ? (
                        <Link href={`/dashboard/course/${course.id}/episode/${ep.id}`}>
                          <Button size="sm">
                            <PlayCircle className="w-4 h-4 mr-2" /> Watch
                          </Button>
                        </Link>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-orange-500 border-orange-500">
                            Pending Approval
                          </Badge>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => buyMutation.mutate({ itemType: "EPISODE", itemId: ep.id })}
                            disabled={buyMutation.isPending}
                          >
                            <Lock className="w-3 h-3 mr-2" /> Buy ({ep.price})
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
}
