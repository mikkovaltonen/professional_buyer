
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Car, Home, Plane, Heart, Dog, Ship } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

const Products = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      <div className="container mx-auto px-4 py-12">
        <Link to="/" className="inline-flex items-center text-gray-600 hover:text-primary mb-8">
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("nav.backToHome")}
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
    </div>
  );
};

export default Products;
