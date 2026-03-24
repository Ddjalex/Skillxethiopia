import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import { useNotifications } from "@/hooks/use-notifications";

import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import AuthPage from "@/pages/auth";
import Browse from "@/pages/browse";
import CourseDetail from "@/pages/course-detail";
import Dashboard from "@/pages/dashboard";
import DashboardCourse from "@/pages/dashboard-course";
import EpisodePlayer from "@/pages/episode-player";
import AdminDashboard from "@/pages/admin-dashboard";
import AdminLoginPage from "@/pages/admin-login";
import VideoOnly from "@/pages/video-only";
import VerifyEmailPage from "@/pages/verify-email";
import ForgotPasswordPage from "@/pages/forgot-password";
import ResetPasswordPage from "@/pages/reset-password";

function NotificationListener() {
  useNotifications();
  return null;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/verify-email" component={VerifyEmailPage} />
      <Route path="/forgot-password" component={ForgotPasswordPage} />
      <Route path="/reset-password" component={ResetPasswordPage} />
      <Route path="/browse" component={Browse} />
      <Route path="/course/:slug" component={CourseDetail} />
      <Route path="/video/:id" component={VideoOnly} />
      
      {/* Protected User Routes */}
      <ProtectedRoute path="/dashboard" component={Dashboard} />
      <ProtectedRoute path="/dashboard/course/:id" component={DashboardCourse} />
      <ProtectedRoute path="/dashboard/course/:courseId/episode/:episodeId" component={EpisodePlayer} />
      
      {/* Admin Routes */}
      <Route path="/admin/login" component={AdminLoginPage} />
      <ProtectedRoute path="/admin" component={AdminDashboard} adminOnly />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <NotificationListener />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
