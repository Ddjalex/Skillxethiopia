import { Navbar } from "@/components/layout-nav";
import { useCourses, useCategories } from "@/hooks/use-courses";
import { CourseCard } from "@/components/course-card";
import { Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";

export default function Browse() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const initialSearch = searchParams.get("search") || "";
  const initialCat = searchParams.get("categoryId") ? Number(searchParams.get("categoryId")) : undefined;

  const [search, setSearch] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>(initialCat);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: courses, isLoading } = useCourses(debouncedSearch, selectedCategory);
  const { data: categories } = useCategories();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          
          {/* Filters Sidebar */}
          <aside className="w-full md:w-64 space-y-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Search</h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Keyword..." 
                  className="pl-10" 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Categories</h3>
              <div className="flex flex-col gap-2">
                <Button 
                  variant={selectedCategory === undefined ? "secondary" : "ghost"} 
                  className="justify-start"
                  onClick={() => setSelectedCategory(undefined)}
                >
                  All Categories
                </Button>
                {categories?.map((cat) => (
                  <Button 
                    key={cat.id}
                    variant={selectedCategory === cat.id ? "secondary" : "ghost"} 
                    className="justify-start"
                    onClick={() => setSelectedCategory(cat.id)}
                  >
                    {cat.name}
                  </Button>
                ))}
              </div>
            </div>
          </aside>

          {/* Results Grid */}
          <main className="flex-1">
            <div className="mb-6 flex items-center justify-between">
              <h1 className="text-2xl font-bold">
                {selectedCategory 
                  ? `${categories?.find(c => c.id === selectedCategory)?.name} Courses` 
                  : "All Courses"}
              </h1>
              <span className="text-muted-foreground text-sm">
                {courses?.length || 0} results
              </span>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1,2,3,4,5,6].map(i => (
                  <div key={i} className="h-80 rounded-xl bg-muted animate-pulse" />
                ))}
              </div>
            ) : courses?.length === 0 ? (
              <div className="text-center py-20 bg-muted/20 rounded-xl border border-dashed border-border">
                <p className="text-muted-foreground">No courses found matching your criteria.</p>
                <Button 
                  variant="link" 
                  onClick={() => { setSearch(""); setSelectedCategory(undefined); }}
                >
                  Clear filters
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses?.map((course) => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
