import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

// ============================================
// PUBLIC
// ============================================

export function useCategories() {
  return useQuery({
    queryKey: [api.public.categories.path],
    queryFn: async () => {
      const res = await fetch(api.public.categories.path);
      if (!res.ok) throw new Error("Failed to fetch categories");
      return api.public.categories.responses[200].parse(await res.json());
    },
  });
}

export function useCourses(search?: string, categoryId?: number) {
  const queryKey = [api.public.courses.path, search, categoryId];
  return useQuery({
    queryKey,
    queryFn: async () => {
      const url = new URL(api.public.courses.path, window.location.origin);
      if (search) url.searchParams.set("search", search);
      if (categoryId) url.searchParams.set("categoryId", categoryId.toString());
      
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("Failed to fetch courses");
      return api.public.courses.responses[200].parse(await res.json());
    },
  });
}

export function useCourseDetail(slug: string) {
  return useQuery({
    queryKey: [api.public.courseDetail.path, slug],
    queryFn: async () => {
      const url = buildUrl(api.public.courseDetail.path, { slug });
      const res = await fetch(url);
      if (!res.ok) {
        if (res.status === 404) return null;
        throw new Error("Failed to fetch course details");
      }
      return api.public.courseDetail.responses[200].parse(await res.json());
    },
    enabled: !!slug,
  });
}

// ============================================
// PROTECTED / DASHBOARD
// ============================================

export function useDashboardCourses() {
  return useQuery({
    queryKey: [api.protected.dashboard.path],
    queryFn: async () => {
      const res = await fetch(api.protected.dashboard.path);
      if (res.status === 401) throw new Error("Unauthorized");
      if (!res.ok) throw new Error("Failed to fetch dashboard");
      return api.protected.dashboard.responses[200].parse(await res.json());
    },
  });
}

export function useDashboardCourse(id: number) {
  return useQuery({
    queryKey: [api.protected.dashboardCourse.path, id],
    queryFn: async () => {
      const url = buildUrl(api.protected.dashboardCourse.path, { id });
      const res = await fetch(url);
      if (res.status === 401) throw new Error("Unauthorized");
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch course content");
      return api.protected.dashboardCourse.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function usePurchases() {
  return useQuery({
    queryKey: [api.protected.purchases.path],
    queryFn: async () => {
      const res = await fetch(api.protected.purchases.path);
      if (res.status === 401) throw new Error("Unauthorized");
      if (!res.ok) throw new Error("Failed to fetch purchases");
      return api.protected.purchases.responses[200].parse(await res.json());
    },
  });
}

export function useBuyItem() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ itemType, itemId }: { itemType: "SEASON" | "EPISODE", itemId: number }) => {
      const res = await fetch(api.protected.buy.path, {
        method: api.protected.buy.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemType, itemId }),
      });
      
      if (!res.ok) {
        if (res.status === 401) throw new Error("Please login to purchase");
        const error = await res.json();
        throw new Error(error.message || "Purchase failed");
      }
      return api.protected.buy.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      toast({ 
        title: "Order Placed", 
        description: "Your request is pending admin approval. Content will unlock once approved." 
      });
      queryClient.invalidateQueries({ queryKey: [api.protected.dashboard.path] });
      queryClient.invalidateQueries({ queryKey: [api.protected.dashboardCourse.path] });
      queryClient.invalidateQueries({ queryKey: [api.protected.purchases.path] });
      // Invalidate public detail too so locks update if user revisits
      queryClient.invalidateQueries({ queryKey: [api.public.courseDetail.path] });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  });
}

export function useEpisodeStream(id: number) {
  return useQuery({
    queryKey: [api.protected.stream.path, id],
    queryFn: async () => {
      const url = buildUrl(api.protected.stream.path, { id });
      const res = await fetch(url);
      if (res.status === 401) throw new Error("Unauthorized");
      if (res.status === 403) throw new Error("You do not have access to this episode");
      if (!res.ok) throw new Error("Failed to load stream");
      return api.protected.stream.responses[200].parse(await res.json());
    },
    enabled: !!id,
    retry: false,
  });
}
