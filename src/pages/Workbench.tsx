import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { LogOut, Loader2, BarChart, Bot, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import ChatInterface from "@/components/ChatInterface";
import { fileService } from "@/lib/fileService";
import { toast } from "sonner";

const demoProducts = [
  {
    id: "minarctig",
    name: "MINARCTIG EVO 200MLP POWER SOURCE",
    image: "/demo_data/MINARCTIG EVO 200MLP POWER SOURCE.png"
  },
  {
    id: "x3p",
    name: "X3P POWER SOURCE PULSE 450 W",
    image: "/demo_data/X3P POWER SOURCE PULSE 450 W.png"
  },
  {
    id: "x5",
    name: "X5 POWER SOURCE 400 PULSE WP",
    image: "/demo_data/X5 POWER SOURCE 400 PULSE WP.png"
  }
];

const Workbench = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const handleLogout = () => {
    if (imageUrl) {
      URL.revokeObjectURL(imageUrl);
    }
    logout();
    navigate('/');
  };

  const handleProductSelect = (productId: string) => {
    setIsLoading(true);
    try {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
      
      const product = demoProducts.find(p => p.id === productId);
      if (product) {
        setSelectedProduct(productId);
        setImageUrl(product.image);
        toast.success('Tuote valittu onnistuneesti');
      }
    } catch (error) {
      console.error('Tuotteen valinta epäonnistui:', error);
      toast.error('Tuotteen valinta epäonnistui');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveFile = () => {
    if (imageUrl) {
      URL.revokeObjectURL(imageUrl);
      setImageUrl(null);
      setSelectedProduct(null);
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
              Valitse ennustettava tuote
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                {demoProducts.map((product) => (
                  <div key={product.id} className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id={product.id}
                      name="product"
                      value={product.id}
                      checked={selectedProduct === product.id}
                      onChange={() => handleProductSelect(product.id)}
                      className="h-4 w-4 text-[#4ADE80] focus:ring-[#4ADE80]"
                    />
                    <label htmlFor={product.id} className="text-sm">
                      {product.name}
                    </label>
                  </div>
                ))}
              </div>
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
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
                    alt="Valittu tuote"
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