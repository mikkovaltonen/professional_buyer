
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import Index from "./pages/Index";
import SecureStorage from "./pages/SecureStorage";
import AiOptimization from "./pages/AiOptimization";
import CostSavings from "./pages/CostSavings";
import CompleteProtection from "./pages/CompleteProtection";
import NotFound from "./pages/NotFound";

// Initialize i18n
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: {
          "hero": {
            "title": "Smart Insurance Management",
            "subtitle": "Store, manage, and optimize your insurance documents with AI-powered insights",
            "cta": "Get Started"
          },
          "features": {
            "secure": {
              "title": "Secure Document Storage",
              "description": "Safely store and access all your insurance documents in one secure location"
            },
            "ai": {
              "title": "AI-Powered Optimization",
              "description": "Our AI analyzes your needs to find the best protection plans for you"
            },
            "cost": {
              "title": "Cost Savings",
              "description": "Save money by comparing and optimizing your insurance coverage"
            },
            "protection": {
              "title": "Complete Protection",
              "description": "Get comprehensive coverage recommendations tailored to your needs"
            }
          },
          "cta": {
            "title": "Ready to Optimize Your Insurance?",
            "subtitle": "Join thousands of users who are already saving time and money with our platform",
            "button": "Start Now"
          },
          "footer": {
            "about": {
              "title": "About Us",
              "description": "PriceRobot Limited is dedicated to revolutionizing insurance management through AI-powered solutions. Our platform helps individuals and businesses optimize their insurance coverage while ensuring maximum protection."
            },
            "contact": {
              "title": "Contact Us"
            },
            "rights": "All rights reserved."
          }
        }
      }
    },
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
    },
  });

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
