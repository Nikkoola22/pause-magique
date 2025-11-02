import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import NewLoginPage from "./pages/NewLoginPage";
import DebugDashboard from "./pages/DebugDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import WorkingManagerDashboard from "./pages/WorkingManagerDashboard";
import WorkingAgentDashboard from "./pages/WorkingAgentDashboard";
import NewAgentDashboard from "./pages/NewAgentDashboard";
import TestPage from "./pages/TestPage";
import Dashboard from "./pages/Dashboard";
import AgentPage from "./pages/AgentPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  // Determine basename based on environment
  const basename = import.meta.env.MODE === 'production' ? '/pause-magique' : '/';
  
  return (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter
        basename={basename}
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true
        }}
      >
        <Routes>
          <Route path="/" element={<NewLoginPage />} />
          <Route path="/test" element={<TestPage />} />
          <Route path="/debug" element={<DebugDashboard />} />
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
          <Route path="/manager-dashboard" element={<WorkingManagerDashboard />} />
          <Route path="/agent-dashboard" element={<WorkingAgentDashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/agent/:id" element={<AgentPage />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  );
};

export default App;
