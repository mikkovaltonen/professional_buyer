
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
      },
      fi: {
        translation: {
          "hero": {
            "title": "Älykäs vakuutushallinta",
            "subtitle": "Säilytä, hallitse ja optimoi vakuutusasiakirjasi tekoälyn avulla",
            "cta": "Aloita nyt"
          },
          "features": {
            "secure": {
              "title": "Turvallinen asiakirjojen säilytys",
              "description": "Säilytä ja käytä kaikkia vakuutusasiakirjojasi turvallisesti yhdessä paikassa"
            },
            "ai": {
              "title": "Tekoälypohjainen optimointi",
              "description": "Tekoälymme analysoi tarpeesi löytääkseen sinulle parhaat vakuutusratkaisut"
            },
            "cost": {
              "title": "Kustannussäästöt",
              "description": "Säästä rahaa vertaamalla ja optimoimalla vakuutusturvaasi"
            },
            "protection": {
              "title": "Kattava suoja",
              "description": "Saat tarpeisiisi räätälöidyt kattavat vakuutussuositukset"
            }
          },
          "cta": {
            "title": "Valmis optimoimaan vakuutuksesi?",
            "subtitle": "Liity tuhansien käyttäjien joukkoon, jotka jo säästävät aikaa ja rahaa alustamme avulla",
            "button": "Aloita nyt"
          },
          "footer": {
            "about": {
              "title": "Tietoa meistä",
              "description": "PriceRobot Limited on omistautunut uudistamaan vakuutushallintaa tekoälypohjaisilla ratkaisuilla. Alustamme auttaa yksityishenkilöitä ja yrityksiä optimoimaan vakuutusturvansa."
            },
            "contact": {
              "title": "Ota yhteyttä"
            },
            "rights": "Kaikki oikeudet pidätetään."
          }
        }
      },
      et: {
        translation: {
          "hero": {
            "title": "Nutikas kindlustushaldus",
            "subtitle": "Salvesta, halda ja optimeeri oma kindlustusdokumente tehisintellekti abil",
            "cta": "Alusta"
          },
          "features": {
            "secure": {
              "title": "Turvaline dokumentide hoiustamine",
              "description": "Salvesta ja kasuta kõiki oma kindlustusdokumente turvaliselt ühes kohas"
            },
            "ai": {
              "title": "Tehisintellektil põhinev optimeerimine",
              "description": "Meie tehisintellekt analüüsib sinu vajadusi, et leida parimad kindlustusplaanid"
            },
            "cost": {
              "title": "Kulude kokkuhoid",
              "description": "Säästa raha võrreldes ja optimeerides oma kindlustuskaitset"
            },
            "protection": {
              "title": "Täielik kaitse",
              "description": "Saa põhjalikud kindlustussoovitused, mis on kohandatud sinu vajadustele"
            }
          },
          "cta": {
            "title": "Valmis oma kindlustust optimeerima?",
            "subtitle": "Liitu tuhandete kasutajatega, kes juba säästavad aega ja raha meie platvormi abil",
            "button": "Alusta kohe"
          },
          "footer": {
            "about": {
              "title": "Meist",
              "description": "PriceRobot Limited on pühendunud kindlustushalduse uuendamisele tehisintellekti lahendustega. Meie platvorm aitab üksikisikutel ja ettevõtetel optimeerida oma kindlustuskaitset."
            },
            "contact": {
              "title": "Võta ühendust"
            },
            "rights": "Kõik õigused kaitstud."
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
          <Route path="/fi" element={<Index />} />
          <Route path="/et" element={<Index />} />
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
