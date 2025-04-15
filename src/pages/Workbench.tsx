import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { LogOut, Upload, Loader2, BarChart, Bot, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import ChatInterface from "@/components/ChatInterface";
import { fileService } from "@/lib/fileService";
import { toast } from "sonner";

const Workbench = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [currentFileId, setCurrentFileId] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const handleLogout = () => {
    if (currentFileId) {
      fileService.removeFile(currentFileId);
    }
    if (imageUrl) {
      URL.revokeObjectURL(imageUrl);
    }
    fileService.clearFiles();
    logout();
    navigate('/');
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Tarkista tiedostotyyppi
    if (file.type !== 'image/png') {
      toast.error('Vain PNG-tiedostot ovat tuettuja');
      return;
    }

    setIsLoading(true);
    try {
      // Poista vanha tiedosto ja URL jos sellainen on
      if (currentFileId) {
        fileService.removeFile(currentFileId);
      }
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }

      // Tallenna uusi tiedosto
      const fileId = fileService.storeFile(file);
      setCurrentFileId(fileId);
      
      // Luo URL kuvalle
      const url = URL.createObjectURL(file);
      setImageUrl(url);
      
      toast.success('Tiedosto ladattu onnistuneesti');
    } catch (error) {
      console.error('Tiedoston lataus epäonnistui:', error);
      toast.error('Tiedoston lataus epäonnistui');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveFile = () => {
    if (currentFileId) {
      fileService.removeFile(currentFileId);
      setCurrentFileId(null);
    }
    if (imageUrl) {
      URL.revokeObjectURL(imageUrl);
      setImageUrl(null);
    }
  };

  // Siivoa URL kun komponentti unmountataan
  useEffect(() => {
    return () => {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Kysynnänennusteavustaja</h1>
        <Button variant="outline" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Kirjaudu ulos
        </Button>
      </div>

      <div className="space-y-6">
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
                    accept=".png"
                  />
                  <Upload className="mr-2 h-4 w-4" />
                  {isLoading ? "Ladataan..." : "Valitse tiedosto"}
                </Button>
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              </div>
              <p className="text-sm text-gray-500">
                Tuetut tiedostomuodot: PNG
              </p>
              {imageUrl && (
                <div className="relative">
                  <Button
                    variant="outline"
                    size="icon"
                    className="absolute top-2 right-2 bg-white hover:bg-gray-100"
                    onClick={handleRemoveFile}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <img
                    src={imageUrl}
                    alt="Ladattu ennuste"
                    className="max-w-full h-auto rounded-lg border border-gray-200"
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
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