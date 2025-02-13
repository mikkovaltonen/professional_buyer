
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Car, Home, Plane, Heart, Dog, Ship, Shield, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import LanguageSelector from "@/components/LanguageSelector";
import RegisterForm from "@/components/RegisterForm";

const Products = () => {
  const { t } = useTranslation();

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
          <Button variant="outline" className="bg-white hover:bg-gray-50" asChild>
            <Link to="/about">About</Link>
          </Button>
          <Button variant="outline" className="bg-white hover:bg-gray-50" asChild>
            <Link to="/products">Products</Link>
          </Button>
          <Button variant="outline" className="bg-white hover:bg-gray-50">
            Login
          </Button>
          <RegisterForm />
          <LanguageSelector />
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <Link to="/" className="inline-flex items-center text-[#8E9196] hover:text-[#1A1F2C] mb-8 transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Link>

        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-12 text-center">{t("insurance.types.title")}</h1>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Link to="/car-insurance" className="group">
              <Card className="hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-6 text-center">
                  <Car className="h-12 w-12 mx-auto mb-4 text-[#7E69AB] group-hover:text-[#9b87f5] transition-colors" />
                  <h3 className="text-xl font-semibold mb-2">{t("insurance.car.title")}</h3>
                  <p className="text-[#8E9196]">{t("insurance.car.short")}</p>
                </CardContent>
              </Card>
            </Link>

            <Link to="/home-insurance" className="group">
              <Card className="hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-6 text-center">
                  <Home className="h-12 w-12 mx-auto mb-4 text-[#7E69AB] group-hover:text-[#9b87f5] transition-colors" />
                  <h3 className="text-xl font-semibold mb-2">{t("insurance.home.title")}</h3>
                  <p className="text-[#8E9196]">{t("insurance.home.short")}</p>
                </CardContent>
              </Card>
            </Link>

            <Link to="/travel-insurance" className="group">
              <Card className="hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-6 text-center">
                  <Plane className="h-12 w-12 mx-auto mb-4 text-[#7E69AB] group-hover:text-[#9b87f5] transition-colors" />
                  <h3 className="text-xl font-semibold mb-2">{t("insurance.travel.title")}</h3>
                  <p className="text-[#8E9196]">{t("insurance.travel.short")}</p>
                </CardContent>
              </Card>
            </Link>

            <Link to="/health-insurance" className="group">
              <Card className="hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-6 text-center">
                  <Heart className="h-12 w-12 mx-auto mb-4 text-[#7E69AB] group-hover:text-[#9b87f5] transition-colors" />
                  <h3 className="text-xl font-semibold mb-2">{t("insurance.health.title")}</h3>
                  <p className="text-[#8E9196]">{t("insurance.health.short")}</p>
                </CardContent>
              </Card>
            </Link>

            <Link to="/pet-insurance" className="group">
              <Card className="hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-6 text-center">
                  <Dog className="h-12 w-12 mx-auto mb-4 text-[#7E69AB] group-hover:text-[#9b87f5] transition-colors" />
                  <h3 className="text-xl font-semibold mb-2">{t("insurance.pet.title")}</h3>
                  <p className="text-[#8E9196]">{t("insurance.pet.short")}</p>
                </CardContent>
              </Card>
            </Link>

            <Link to="/boat-insurance" className="group">
              <Card className="hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-6 text-center">
                  <Ship className="h-12 w-12 mx-auto mb-4 text-[#7E69AB] group-hover:text-[#9b87f5] transition-colors" />
                  <h3 className="text-xl font-semibold mb-2">{t("insurance.boat.title")}</h3>
                  <p className="text-[#8E9196]">{t("insurance.boat.short")}</p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </div>

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

export default Products;
