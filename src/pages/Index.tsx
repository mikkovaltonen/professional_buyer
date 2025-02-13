
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, FileSearch, PiggyBank, Brain, ArrowRight, Mail } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useEffect } from "react";
import LanguageSelector from "@/components/LanguageSelector";
import RegisterForm from "@/components/RegisterForm";

const Index = () => {
  const { t, i18n } = useTranslation();
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    const lang = path === '/' ? 'en' : path.slice(1);
    if (lang && i18n.languages.includes(lang)) {
      i18n.changeLanguage(lang);
    }
  }, [location.pathname, i18n]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      <div className="flex justify-between items-center p-4 relative z-50">
        <Link to="/" className="flex items-center gap-2">
          <div className="bg-gradient-to-r from-[#9b87f5] to-[#7E69AB] p-2 rounded-lg">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <div className="flex flex-col items-start">
            <span className="font-bold text-xl text-[#1A1F2C]">Insurance Vault</span>
            <span className="text-xs text-[#8E9196]">Secure. Smart. Simple.</span>
          </div>
        </Link>
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            className="bg-white hover:bg-gray-50"
            asChild
          >
            <Link to="/about">{t("nav.about")}</Link>
          </Button>
          <Button 
            variant="outline" 
            className="bg-white hover:bg-gray-50"
            asChild
          >
            <Link to="/products">{t("nav.products")}</Link>
          </Button>
          <Button 
            variant="outline" 
            className="bg-white hover:bg-gray-50"
          >
            Login
          </Button>
          <RegisterForm />
          <LanguageSelector />
        </div>
      </div>

      <section className="container mx-auto px-4 pt-20 pb-16 text-center relative">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d')] bg-cover bg-center opacity-5 z-0"></div>
        <div className="relative z-10">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-[#9b87f5] to-[#7E69AB] bg-clip-text text-transparent animate-fade-in">
            {t("hero.title")}
          </h1>
          <p className="text-xl text-[#1A1F2C] mb-8 max-w-2xl mx-auto animate-fade-in">
            {t("hero.subtitle")}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button className="text-lg px-8 py-6 bg-[#9b87f5] hover:bg-[#7E69AB] transition-colors animate-fade-in">
              {t("hero.cta")} <ArrowRight className="ml-2" />
            </Button>
            <Button variant="outline" className="text-lg px-8 py-6 border-[#9b87f5] text-[#9b87f5] hover:bg-[#9b87f5] hover:text-white transition-colors animate-fade-in">
              {t("hero.demo")}
            </Button>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-[#1A1F2C]">{t("benefits.title")}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
            <Link to="/secure-storage">
              <Card className="p-6 hover:shadow-lg transition-shadow duration-300 animate-fade-in border-[#E5DEFF] hover:border-[#9b87f5]">
                <CardContent className="space-y-4">
                  <div className="h-12 w-12 bg-[#E5DEFF] rounded-lg flex items-center justify-center">
                    <FileSearch className="h-6 w-6 text-[#7E69AB]" />
                  </div>
                  <h3 className="text-xl font-semibold text-[#1A1F2C]">{t("features.secure.title")}</h3>
                  <p className="text-[#8E9196]">{t("features.secure.description")}</p>
                </CardContent>
              </Card>
            </Link>

            <Link to="/ai-optimization">
              <Card className="p-6 hover:shadow-lg transition-shadow duration-300 animate-fade-in border-[#E5DEFF] hover:border-[#9b87f5]">
                <CardContent className="space-y-4">
                  <div className="h-12 w-12 bg-[#E5DEFF] rounded-lg flex items-center justify-center">
                    <Brain className="h-6 w-6 text-[#7E69AB]" />
                  </div>
                  <h3 className="text-xl font-semibold text-[#1A1F2C]">{t("features.ai.title")}</h3>
                  <p className="text-[#8E9196]">{t("features.ai.description")}</p>
                </CardContent>
              </Card>
            </Link>

            <Link to="/cost-savings">
              <Card className="p-6 hover:shadow-lg transition-shadow duration-300 animate-fade-in border-[#E5DEFF] hover:border-[#9b87f5]">
                <CardContent className="space-y-4">
                  <div className="h-12 w-12 bg-[#E5DEFF] rounded-lg flex items-center justify-center">
                    <PiggyBank className="h-6 w-6 text-[#7E69AB]" />
                  </div>
                  <h3 className="text-xl font-semibold text-[#1A1F2C]">{t("features.cost.title")}</h3>
                  <p className="text-[#8E9196]">{t("features.cost.description")}</p>
                </CardContent>
              </Card>
            </Link>

            <Link to="/complete-protection">
              <Card className="p-6 hover:shadow-lg transition-shadow duration-300 animate-fade-in border-[#E5DEFF] hover:border-[#9b87f5]">
                <CardContent className="space-y-4">
                  <div className="h-12 w-12 bg-[#E5DEFF] rounded-lg flex items-center justify-center">
                    <Shield className="h-6 w-6 text-[#7E69AB]" />
                  </div>
                  <h3 className="text-xl font-semibold text-[#1A1F2C]">{t("features.protection.title")}</h3>
                  <p className="text-[#8E9196]">{t("features.protection.description")}</p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16 text-center">
        <div className="bg-gradient-to-r from-[#E5DEFF] to-[#D3E4FD] rounded-2xl p-12 border border-[#9b87f5]/20">
          <h2 className="text-3xl font-bold mb-6 text-[#1A1F2C]">{t("cta.title")}</h2>
          <p className="text-xl text-[#8E9196] mb-8 max-w-2xl mx-auto">
            {t("cta.subtitle")}
          </p>
          <Button variant="default" size="lg" className="bg-[#9b87f5] hover:bg-[#7E69AB] transition-colors">
            {t("cta.button")} <ArrowRight className="ml-2" />
          </Button>
        </div>
      </section>

      <footer className="container mx-auto px-4 py-12 border-t border-[#E5DEFF]">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <Link to="/" className="flex items-center gap-2 mb-6">
                <div className="bg-gradient-to-r from-[#9b87f5] to-[#7E69AB] p-2 rounded-lg">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <span className="font-bold text-xl text-[#1A1F2C]">Insurance Vault</span>
              </Link>
            </div>
            <div className="md:text-right">
              <h3 className="text-xl font-semibold mb-4 text-[#1A1F2C]">{t("footer.contact.title")}</h3>
              <div className="flex items-center justify-start md:justify-end text-[#8E9196]">
                <Mail className="h-5 w-5 mr-2" />
                <a href="mailto:info@insurancevault.com" className="hover:text-[#9b87f5] transition-colors">
                  info@insurancevault.com
                </a>
              </div>
            </div>
          </div>
          <div className="text-center mt-8 pt-8 border-t border-[#E5DEFF]">
            <p className="text-[#8E9196]">
              © {new Date().getFullYear()} Insurance Vault. {t("footer.rights")}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
