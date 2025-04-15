import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { LogOut, Upload, AlertCircle, Loader2, BarChart, Bot } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import ChatInterface from "@/components/ChatInterface";

const Workbench = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    try {
      // Tiedoston käsittelylogiikka tähän
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simuloi latausta
    } catch (error) {
      console.error('Tiedoston lataus epäonnistui:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Kysynnänennusteavustaja</h1>
        <Button variant="outline" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Kirjaudu ulos
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart className="h-5 w-5 text-[#4ADE80] mr-2" />
                Ennuste visualisoinnin lataus
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <Button
                    variant="outline"
                    className="relative"
                    disabled={isLoading}
                  >
                    <input
                      type="file"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      onChange={handleFileUpload}
                      accept=".csv,.xlsx,.xls"
                    />
                    <Upload className="mr-2 h-4 w-4" />
                    {isLoading ? "Ladataan..." : "Valitse tiedosto"}
                  </Button>
                  {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                </div>
                <p className="text-sm text-gray-500">
                  Tuetut tiedostomuodot: CSV, Excel
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Ohjeet</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start space-x-4">
                  <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Tiedoston muoto</p>
                    <p className="text-sm text-gray-500">
                      Varmista, että tiedostosi noudattaa vaadittua muotoa. Tarvittavat sarakkeet:
                      tuotekoodi, määrä, päivämäärä.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="h-full">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bot className="h-5 w-5 text-[#4ADE80] mr-2" />
              Ennusteavustaja
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChatInterface />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Workbench; 