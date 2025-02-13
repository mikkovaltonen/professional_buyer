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
import CarInsurance from "./pages/insurance/CarInsurance";
import HomeInsurance from "./pages/insurance/HomeInsurance";
import TravelInsurance from "./pages/insurance/TravelInsurance";
import HealthInsurance from "./pages/insurance/HealthInsurance";
import LifeInsurance from "./pages/insurance/LifeInsurance";
import PetInsurance from "./pages/insurance/PetInsurance";
import BoatInsurance from "./pages/insurance/BoatInsurance";
import Workbench from "./pages/Workbench";
import { checkEnvVariables } from '@/lib/env';

checkEnvVariables();

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
          },
          "vision": {
            "title": "Our Vision for the Future",
            "description": "We envision a world where managing insurance is effortless, transparent, and personalized. Through innovative technology and AI, we're making this vision a reality for everyone."
          },
          "mission": {
            "title": "Our Mission",
            "description": "To revolutionize insurance management by providing smart, accessible, and secure solutions that empower individuals and businesses to make informed decisions about their protection."
          },
          "values": {
            "title": "Our Values",
            "description": "Innovation, transparency, security, and customer-centricity guide everything we do. We believe in making insurance simple, understandable, and accessible to all."
          },
          "insurance": {
            "types": {
              "title": "Insurance Solutions"
            },
            "car": {
              "title": "Car Insurance",
              "short": "Comprehensive coverage for your vehicle"
            },
            "home": {
              "title": "Home Insurance",
              "short": "Protect your home and belongings"
            },
            "travel": {
              "title": "Travel Insurance",
              "short": "Worry-free worldwide coverage"
            },
            "health": {
              "title": "Health Insurance",
              "short": "Quality healthcare coverage"
            },
            "life": {
              "title": "Life Insurance",
              "short": "Secure your family's future"
            },
            "pet": {
              "title": "Pet Insurance",
              "short": "Care for your furry friends"
            },
            "boat": {
              "title": "Boat Insurance",
              "short": "Maritime protection solutions"
            }
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
            "subtitle": "Liity tuhansien käyttäjatega, jotka jo säästavad aikaa ja rahaa alustamme avulla",
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
          },
          "vision": {
            "title": "Meidän tavoitteemme tulevaisuudessa",
            "description": "Olemme tarkastelevat, että vakuutushallinta on helppompi, yleistä ja yksityiskohtainen. Tekoäly ja innovaatiot ovat tehtyä tämän tavoitteen realistiselle."
          },
          "mission": {
            "title": "Meidän tavoitteemme",
            "description": "Olemme tarkastelevat, että vakuutushallinta on uudistettava innovaatiolla ja tekoälyllä, jotta voimme auttaa yksityishenkilöitä ja yrityksiä tekemään päätöksensä vakuutusturvasta."
          },
          "values": {
            "title": "Meidän arvot",
            "description": "Innovatiivisuus, yleistys ja turvallisuus ovat kaikkiin tehtäviin liittyvät. Olemme tarkastelevat, että vakuutus on helppompi, yleistä ja yksityiskohtainen kaikille."
          },
          "insurance": {
            "types": {
              "title": "Vakuutusratkaisut"
            },
            "car": {
              "title": "Vakuutusauto",
              "short": "Kokoelma vakuutusten yleistä"
            },
            "home": {
              "title": "Koti vakuutus",
              "short": "Säilytä ja turvaa kotiin ja asioihin"
            },
            "travel": {
              "title": "Vakuutusmatkustelu",
              "short": "Vakuutusmatkustelu kaikille maalle"
            },
            "health": {
              "title": "Terveydenhuolto vakuutus",
              "short": "Kokonaisvakiintunut terveydenhuolto"
            },
            "life": {
              "title": "Eläkelu vakuutus",
              "short": "Turvaa eläkeluun"
            },
            "pet": {
              "title": "Koiravakuutus",
              "short": "Vakuutuskoiraan"
            },
            "boat": {
              "title": "Lautavakuutus",
              "short": "Lautavakuutusratkaisut"
            }
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
              "description": "Saat põhjalikud kindlustussoovitused, mis on kohandatud sinu vajadustele"
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
          },
          "vision": {
            "title": "Meidän tavoitteemme tulevaisuudessa",
            "description": "Olemme tarkastelevat, että vakuutushallinta on helppompi, yleistä ja yksityiskohtainen. Tekoäly ja innovaatiot ovat tehtyä tämän tavoitteen realistiselle."
          },
          "mission": {
            "title": "Meidän tavoitteemme",
            "description": "Olemme tarkastelevat, että vakuutushallinta on uudistettava innovaatiolla ja tekoälyllä, jotta voimme auttaa yksityishenkilöitä ja yrityksiä tekemään päätöksensä vakuutusturvasta."
          },
          "values": {
            "title": "Meidän arvot",
            "description": "Innovatiivisuus, yleistys ja turvallisuus ovat kaikkiin tehtäviin liittyvät. Olemme tarkastelevat, että vakuutus on helppompi, yleistä ja yksityiskohtainen kaikille."
          },
          "insurance": {
            "types": {
              "title": "Kindlustusratkaisut"
            },
            "car": {
              "title": "Kindlustusauto",
              "short": "Kokoelma kindlustusten yleistä"
            },
            "home": {
              "title": "Koti kindlustus",
              "short": "Säilytä ja turvaa kotiin ja asioihin"
            },
            "travel": {
              "title": "Kindlustusmatkustelu",
              "short": "Kindlustusmatkustelu kaikille maalle"
            },
            "health": {
              "title": "Terveydenhuolto kindlustus",
              "short": "Kokonaisvakiintunut terveydenhuolto"
            },
            "life": {
              "title": "Eläkelu kindlustus",
              "short": "Turvaa eläkeluun"
            },
            "pet": {
              "title": "Koirakindlustus",
              "short": "Kindlustuskoiraan"
            },
            "boat": {
              "title": "Lautakindlustus",
              "short": "Lautakindlustusratkaisut"
            }
          }
        }
      },
      da: {
        translation: {
          "hero": {
            "title": "Smart forsikringsstyring",
            "subtitle": "Opbevar, administrer og optimer dine forsikringsdokumenter med AI-drevet indsigt",
            "cta": "Kom i gang"
          },
          "features": {
            "secure": {
              "title": "Sikker dokumentopbevaring",
              "description": "Opbevar og få adgang til alle dine forsikringsdokumenter sikkert ét sted"
            },
            "ai": {
              "title": "AI-drevet optimering",
              "description": "Vores AI analyserer dine behov for at finde de bedste forsikringsplaner til dig"
            },
            "cost": {
              "title": "Omkostningsbesparelser",
              "description": "Spar penge ved at sammenligne og optimere din forsikringsdækning"
            },
            "protection": {
              "title": "Komplet beskyttelse",
              "description": "Få omfattende dækningsanbefalinger skræddersyet til dine behov"
            }
          },
          "cta": {
            "title": "Klar til at optimere din forsikring?",
            "subtitle": "Tilslut dig tusindvis af brugere, der allerede sparer tid og penge med vores platform",
            "button": "Start nu"
          },
          "footer": {
            "about": {
              "title": "Om os",
              "description": "PriceRobot Limited er dedikeret til at revolutionere forsikringsstyring gennem AI-drevne løsninger. Vores platform hjælper enkeltpersoner og virksomheder med at optimere deres forsikringsdækning."
            },
            "contact": {
              "title": "Kontakt os"
            },
            "rights": "Alle rettigheder forbeholdes."
          },
          "vision": {
            "title": "Meidans tænkte",
            "description": "Vi tænker på en verden, hvor forsikringsstyring er nemt, åben og personlig. Med innovative teknologi og AI, gør vi dette tænket verden for alle."
          },
          "mission": {
            "title": "Meidans mål",
            "description": "At revolutionere forsikringsstyring ved at tilbyde smarte, tilgængelige og sikre løsninger, der hjælper individuer og virksomheder med at gøre informerede beslutninger om deres beskyttelse."
          },
          "values": {
            "title": "Meidans værdier",
            "description": "Innovativitet, åbenhed, sikkerhed og kundekentlig orientering guide alle vores handlinger. Vi tror på at gøre forsikringen nemt, forståelig og tilgængelig til alle."
          },
          "insurance": {
            "types": {
              "title": "Forsikringsløsninger"
            },
            "car": {
              "title": "Forsikringsauto",
              "short": "Kompakt forsikring for din bil"
            },
            "home": {
              "title": "Hjem forsikring",
              "short": "Beskyt ditt hjem og ting"
            },
            "travel": {
              "title": "Forsikringsmatkustel",
              "short": "Forsikringsmatkustel for hele verden"
            },
            "health": {
              "title": "Helse forsikring",
              "short": "Kvalitativ helsebeskyttelse"
            },
            "life": {
              "title": "Liv forsikring",
              "short": "Sikre din familjens fremtid"
            },
            "pet": {
              "title": "Hund forsikring",
              "short": "Beskyt dine hunde"
            },
            "boat": {
              "title": "Bådforsikring",
              "short": "Maritim beskyttelse"
            }
          }
        }
      },
      sv: {
        translation: {
          "hero": {
            "title": "Smart försäkringshantering",
            "subtitle": "Lagra, hantera och optimera dina försäkringsdokument med AI-driven insikt",
            "cta": "Kom igång"
          },
          "features": {
            "secure": {
              "title": "Säker dokumentförvaring",
              "description": "Lagra och få åtkomst till alla dina försäkringsdokument säkert på ett ställe"
            },
            "ai": {
              "title": "AI-driven optimering",
              "description": "Vår AI analyserar dina behov för att hitta de bästa försäkringsplanerna för dig"
            },
            "cost": {
              "title": "Kostnadsbesparingar",
              "description": "Spara pengar genom att jämföra och optimera ditt försäkringsskydd"
            },
            "protection": {
              "title": "Komplett skydd",
              "description": "Få omfattande skyddsrekommendationer skräddarsydda för dina behov"
            }
          },
          "cta": {
            "title": "Redo att optimera din försäkring?",
            "subtitle": "Gå med tusentals användare som redan sparar tid och pengar med vår plattform",
            "button": "Börja nu"
          },
          "footer": {
            "about": {
              "title": "Om oss",
              "description": "PriceRobot Limited är dedikerat till att revolutionera försäkringshantering genom AI-drivne lösninger. Vår plattform hjälper individer och företag att optimera sitt försäkringsskydd."
            },
            "contact": {
              "title": "Kontakta oss"
            },
            "rights": "Alla rättigheter förbehållna."
          },
          "vision": {
            "title": "Meidans tænkte",
            "description": "Vi tænker på en verden, hvor försäkringshantering er nemt, åben og personlig. Med innovative teknologi og AI, gør vi dette tænket verden for alle."
          },
          "mission": {
            "title": "Meidans mål",
            "description": "At revolutionere försäkringshantering ved at tilbyde smarte, tilgængelige og sikre løsninger, der hjælper individuer og virksomheder med at gøre informerede beslutninger om deres beskyttelse."
          },
          "values": {
            "title": "Meidans værdier",
            "description": "Innovativitet, åbenhed, sikkerhed og kundekentlig orientering guide alle vores handlinger. Vi tror på at gøre forsikringen nemt, forståelig og tilgængelig til alle."
          },
          "insurance": {
            "types": {
              "title": "Försäkringsløsninger"
            },
            "car": {
              "title": "Försäkringsauto",
              "short": "Kompakt forsikring for din bil"
            },
            "home": {
              "title": "Hjem forsikring",
              "short": "Beskyt ditt hjem og ting"
            },
            "travel": {
              "title": "Forsikringsmatkustel",
              "short": "Forsikringsmatkustel for hele verden"
            },
            "health": {
              "title": "Helse forsikring",
              "short": "Kvalitativ helsebeskyttelse"
            },
            "life": {
              "title": "Liv forsikring",
              "short": "Sikre din familjens fremtid"
            },
            "pet": {
              "title": "Hund forsikring",
              "short": "Beskyt dine hunde"
            },
            "boat": {
              "title": "Bådforsikring",
              "short": "Maritim beskyttelse"
            }
          }
        }
      },
      no: {
        translation: {
          "hero": {
            "title": "Smart forsikringsstyring",
            "subtitle": "Lagre, administrer og optimer forsikringsdokumentene dine med AI-drevet innsikt",
            "cta": "Kom i gang"
          },
          "features": {
            "secure": {
              "title": "Sikker dokumentlagring",
              "description": "Lagre og få tilgang til alle forsikringsdokumentene dine trygt på ett sted"
            },
            "ai": {
              "title": "AI-drevet optimalisering",
              "description": "Vår AI analyserer dine behov for å finne de beste forsikringsplanene for deg"
            },
            "cost": {
              "title": "Kostnadsbesparelser",
              "description": "Spar penger ved å sammenligne og optimalisere forsikringsdekningen din"
            },
            "protection": {
              "title": "Komplett beskyttelse",
              "description": "Få omfattende deknningsanbefalinger skreddersydd for dine behov"
            }
          },
          "cta": {
            "title": "Klar til å optimalisere forsikringen din?",
            "subtitle": "Bli med tusenvis av brukere som allerede sparer tid og penger med vår plattform",
            "button": "Start nå"
          },
          "footer": {
            "about": {
              "title": "Om oss",
              "description": "PriceRobot Limited er dedikert til å revolusjonere forsikringsstyring gjennom AI-drevne løsninger. Vår plattform hjelper enkeltpersoner og bedrifter med å optimalisere forsikringsdekningen sin."
            },
            "contact": {
              "title": "Kontakt oss"
            },
            "rights": "Alle rettigheter forbeholdt."
          },
          "vision": {
            "title": "Meidans tænkte",
            "description": "Vi tænker på en verden, hvor forsikringsstyring er nemt, åben og personlig. Med innovative teknologi og AI, gør vi dette tænket verden for alle."
          },
          "mission": {
            "title": "Meidans mål",
            "description": "At revolutionere forsikringsstyring ved at tilbyde smarte, tilgængelige og sikre løsninger, der hjælper individuer og virksomheder med at gjøre informerede beslutninger om deres beskyttelse."
          },
          "values": {
            "title": "Meidans værdier",
            "description": "Innovativitet, åbenhed, sikkerhed og kundekentlig orientering guide alle vores handlinger. Vi tror på at gøre forsikringen nemt, forståelig og tilgængelig til alle."
          },
          "insurance": {
            "types": {
              "title": "Forsikringsløsninger"
            },
            "car": {
              "title": "Forsikringsauto",
              "short": "Kompakt forsikring for din bil"
            },
            "home": {
              "title": "Hjem forsikring",
              "short": "Beskyt ditt hjem og ting"
            },
            "travel": {
              "title": "Forsikringsmatkustel",
              "short": "Forsikringsmatkustel for hele verden"
            },
            "health": {
              "title": "Helse forsikring",
              "short": "Kvalitativ helsebeskyttelse"
            },
            "life": {
              "title": "Liv forsikring",
              "short": "Sikre din familjens fremtid"
            },
            "pet": {
              "title": "Hund forsikring",
              "short": "Beskyt dine hunde"
            },
            "boat": {
              "title": "Bådforsikring",
              "short": "Maritim beskyttelse"
            }
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

import About from "./pages/About";
import Products from "./pages/Products";

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
          <Route path="/da" element={<Index />} />
          <Route path="/sv" element={<Index />} />
          <Route path="/no" element={<Index />} />
          <Route path="/about" element={<About />} />
          <Route path="/products" element={<Products />} />
          <Route path="/secure-storage" element={<SecureStorage />} />
          <Route path="/ai-optimization" element={<AiOptimization />} />
          <Route path="/cost-savings" element={<CostSavings />} />
          <Route path="/complete-protection" element={<CompleteProtection />} />
          <Route path="/car-insurance" element={<CarInsurance />} />
          <Route path="/home-insurance" element={<HomeInsurance />} />
          <Route path="/travel-insurance" element={<TravelInsurance />} />
          <Route path="/health-insurance" element={<HealthInsurance />} />
          <Route path="/life-insurance" element={<LifeInsurance />} />
          <Route path="/pet-insurance" element={<PetInsurance />} />
          <Route path="/boat-insurance" element={<BoatInsurance />} />
          <Route path="/workbench" element={<Workbench />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
