
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import SecureStorage from "./pages/SecureStorage";
import AiOptimization from "./pages/AiOptimization";
import CostSavings from "./pages/CostSavings";
import CompleteProtection from "./pages/CompleteProtection";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/secure-storage" element={<SecureStorage />} />
          <Route path="/ai-optimization" element={<AiOptimization />} />
          <Route path="/cost-savings" element={<CostSavings />} />
          <Route path="/complete-protection" element={<CompleteProtection />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
