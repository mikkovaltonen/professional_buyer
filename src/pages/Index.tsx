
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, FileSearch, PiggyBank, Brain, ArrowRight, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import LanguageSelector from "@/components/LanguageSelector";

const Index = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Language Selector */}
      <div className="absolute top-4 right-4 z-50">
        <LanguageSelector />
      </div>

      {/* Hero Section */}
      <section className="container mx-auto px-4 pt-20 pb-16 text-center">
        <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent animate-fade-in">
          {t("hero.title")}
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto animate-fade-in">
          {t("hero.subtitle")}
        </p>
        <Button className="text-lg px-8 py-6 animate-fade-in">
          {t("hero.cta")} <ArrowRight className="ml-2" />
        </Button>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
          {/* Feature 1 */}
          <Link to="/secure-storage">
            <Card className="p-6 hover:shadow-lg transition-shadow duration-300 animate-fade-in">
              <CardContent className="space-y-4">
                <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <FileSearch className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold">{t("features.secure.title")}</h3>
                <p className="text-gray-600">{t("features.secure.description")}</p>
              </CardContent>
            </Card>
          </Link>

          {/* Feature 2 */}
          <Link to="/ai-optimization">
            <Card className="p-6 hover:shadow-lg transition-shadow duration-300 animate-fade-in">
              <CardContent className="space-y-4">
                <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Brain className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold">{t("features.ai.title")}</h3>
                <p className="text-gray-600">{t("features.ai.description")}</p>
              </CardContent>
            </Card>
          </Link>

          {/* Feature 3 */}
          <Link to="/cost-savings">
            <Card className="p-6 hover:shadow-lg transition-shadow duration-300 animate-fade-in">
              <CardContent className="space-y-4">
                <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <PiggyBank className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold">{t("features.cost.title")}</h3>
                <p className="text-gray-600">{t("features.cost.description")}</p>
              </CardContent>
            </Card>
          </Link>

          {/* Feature 4 */}
          <Link to="/complete-protection">
            <Card className="p-6 hover:shadow-lg transition-shadow duration-300 animate-fade-in">
              <CardContent className="space-y-4">
                <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Shield className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold">{t("features.protection.title")}</h3>
                <p className="text-gray-600">{t("features.protection.description")}</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-2xl p-12">
          <h2 className="text-3xl font-bold mb-6">{t("cta.title")}</h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            {t("cta.subtitle")}
          </p>
          <Button variant="default" size="lg">
            {t("cta.button")} <ArrowRight className="ml-2" />
          </Button>
        </div>
      </section>

      {/* Footer with Contact Info */}
      <footer className="container mx-auto px-4 py-12 border-t border-gray-200">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold mb-4">{t("footer.about.title")}</h3>
              <p className="text-gray-600 mb-4">
                {t("footer.about.description")}
              </p>
            </div>
            <div className="md:text-right">
              <h3 className="text-xl font-semibold mb-4">{t("footer.contact.title")}</h3>
              <div className="flex items-center justify-start md:justify-end text-gray-600">
                <Mail className="h-5 w-5 mr-2" />
                <a href="mailto:info@pricerobot.ai" className="hover:text-primary transition-colors">
                  info@pricerobot.ai
                </a>
              </div>
            </div>
          </div>
          <div className="text-center mt-8 pt-8 border-t border-gray-200">
            <p className="text-gray-600">
              © {new Date().getFullYear()} PriceRobot Limited. {t("footer.rights")}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
