import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import { AuthProvider } from "@/context/AuthContext";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Users from "@/pages/users";
import UserDetail from "@/pages/user-detail";
import Courses from "@/pages/courses";
import CourseDetail from "@/pages/course-detail";
import Settings from "@/pages/settings";
import ResetPassword from "@/pages/reset-password";

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/users" component={Users} />
      <Route path="/users/:id" component={UserDetail} />
      <Route path="/courses" component={Courses} />
      <Route path="/courses/:id" component={CourseDetail} />
      <Route path="/settings" component={Settings} />
      <Route path="/" component={() => {
        // Redirect to dashboard as the default route
        window.location.href = "/dashboard";
        return null;
      }} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
