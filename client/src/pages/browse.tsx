import { Navbar } from "@/components/layout-nav";
import { useCourses, useCategories } from "@/hooks/use-courses";
import { CourseCard } from "@/components/course-card";
import { Loader2, Search, SlidersHorizontal, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export default function Browse() {
  const searchParams = new URLSearchParams(window.location.search);
  const initialSearch = searchParams.get("search") || "";
  const initialCat = searchParams.get("categoryId") ? Number(searchParams.get("categoryId")) : undefined;

  const [search, setSearch] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>(initialCat);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: courses, isLoading } = useCourses(debouncedSearch, selectedCategory);
  const { data: categories } = useCategories();

  const hasFilters = search || selectedCategory !== undefined;

  const clearFilters = () => {
    setSearch("");
    setSelectedCategory(undefined);
  };

  const selectedCatName = categories?.find(c => c.id === selectedCategory)?.name;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Page Header */}
      <div className="border-b border-border bg-card mt-16">
        <div className="container mx-auto px-4 lg:px-6 py-8">
          <div className="max-w-xl">
            <h1 className="text-2xl font-bold tracking-tight mb-1">
              {selectedCatName ? `${selectedCatName} Courses` : "Browse Courses"}
            </h1>
            <p className="text-sm text-muted-foreground">
              Discover curated courses across all disciplines
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 lg:px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* Filters Sidebar */}
          <aside className="w-full lg:w-60 flex-shrink-0 space-y-6">
            {/* Search */}
            <div className="space-y-2">
              <p className="section-label">Search</p>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Keywords..."
                  className="pl-9 h-10 rounded-lg"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {search && (
                  <button
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setSearch("")}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Categories */}
            <div className="space-y-2">
              <p className="section-label">Categories</p>
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => setSelectedCategory(undefined)}
                  className={cn(
                    "sidebar-nav-item text-left",
                    selectedCategory === undefined && "sidebar-nav-item-active"
                  )}
                >
                  All Categories
                </button>
                {categories?.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={cn(
                      "sidebar-nav-item text-left",
                      selectedCategory === cat.id && "sidebar-nav-item-active"
                    )}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Active filters */}
            {hasFilters && (
              <div className="pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-muted-foreground hover:text-foreground gap-1.5 h-8 px-2 text-xs"
                >
                  <X className="h-3 w-3" />
                  Clear all filters
                </Button>
              </div>
            )}
          </aside>

          {/* Results */}
          <main className="flex-1 min-w-0">
            {/* Results bar */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2 flex-wrap">
                {hasFilters ? (
                  <p className="text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">{courses?.length ?? 0}</span> results
                    {debouncedSearch && (
                      <> for &ldquo;<span className="font-medium text-foreground">{debouncedSearch}</span>&rdquo;</>
                    )}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">{courses?.length ?? 0}</span> courses available
                  </p>
                )}
              </div>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="rounded-xl border border-border bg-card overflow-hidden">
                    <div className="aspect-video skeleton" />
                    <div className="p-4 space-y-2">
                      <div className="h-4 w-3/4 skeleton rounded" />
                      <div className="h-3 w-1/2 skeleton rounded" />
                      <div className="h-3 w-full skeleton rounded" />
                      <div className="h-3 w-2/3 skeleton rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : courses?.length === 0 ? (
              <div className="empty-state border border-dashed border-border rounded-xl">
                <div className="empty-state-icon bg-secondary">
                  <Search className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="text-base font-semibold mb-1">No courses found</h3>
                <p className="text-sm text-muted-foreground mb-4 max-w-xs">
                  No courses match your current filters. Try adjusting your search.
                </p>
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  Clear filters
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
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
