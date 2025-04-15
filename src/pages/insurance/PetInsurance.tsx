
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Dog, Shield, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

const PetInsurance = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      <div className="container mx-auto px-4 py-12">
        <Link to="/" className="inline-flex items-center text-gray-600 hover:text-primary mb-8">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Link>

        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="h-20 w-20 bg-purple-100 rounded-full mx-auto mb-6 flex items-center justify-center">
              <Dog className="h-10 w-10 text-purple-600" />
            </div>
            <h1 className="text-4xl font-bold mb-6">Pet Insurance</h1>
            <p className="text-xl text-gray-600">
              Comprehensive coverage for your beloved pets
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <Card className="p-6">
              <CardContent className="space-y-4">
                <Shield className="h-8 w-8 text-purple-600" />
                <h3 className="text-xl font-semibold">Veterinary Care</h3>
                <p className="text-gray-600">
                  Coverage for accidents, illnesses, and routine check-ups
                </p>
              </CardContent>
            </Card>
            <Card className="p-6">
              <CardContent className="space-y-4">
                <CheckCircle className="h-8 w-8 text-purple-600" />
                <h3 className="text-xl font-semibold">24/7 Support</h3>
                <p className="text-gray-600">
                  Round-the-clock veterinary helpline and claims assistance
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="text-center">
            <Button size="lg" className="px-8 bg-[#9b87f5] hover:bg-[#7E69AB]">
              Get a Quote
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PetInsurance;
