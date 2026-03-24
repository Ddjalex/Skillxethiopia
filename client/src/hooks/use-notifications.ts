import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./use-auth";
import { useToast } from "./use-toast";
import { api } from "@shared/routes";

export function useNotifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const sourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!user) {
      if (sourceRef.current) {
        sourceRef.current.close();
        sourceRef.current = null;
      }
      return;
    }

    function connect() {
      if (sourceRef.current) sourceRef.current.close();

      const source = new EventSource("/api/notifications/stream");
      sourceRef.current = source;

      source.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === "payment_approved") {
            // Invalidate all relevant caches so content unlocks immediately
            queryClient.invalidateQueries({ queryKey: [api.protected.dashboardCourse.path] });
            queryClient.invalidateQueries({ queryKey: [api.protected.dashboard.path] });
            queryClient.invalidateQueries({ queryKey: [api.protected.purchases.path] });
            queryClient.invalidateQueries({ queryKey: [api.public.courseDetail.path] });

            toast({
              title: "Payment Approved!",
              description: "Your payment was approved. Your course is now unlocked — enjoy learning!",
            });
          }
        } catch (_) {}
      };

      source.onerror = () => {
        source.close();
        sourceRef.current = null;
        // Reconnect after 5 seconds on error
        setTimeout(connect, 5000);
      };
    }

    connect();

    return () => {
      sourceRef.current?.close();
      sourceRef.current = null;
    };
  }, [user?.id]);
}
