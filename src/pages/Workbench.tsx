import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate, Link } from "react-router-dom";
import { LogOut, Archive } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { clearChatSession } from "@/api/chat";
import ProductSelectionContent from "@/components/ProductSelectionContent";

const Workbench = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("tuoteryhma");

  const handleLogout = () => {
    if (imageUrl) {
      URL.revokeObjectURL(imageUrl);
    }
    logout();
    navigate('/');
  };

  const handleRemoveFile = () => {
    if (imageUrl) {
      URL.revokeObjectURL(imageUrl);
      setImageUrl(null);
      setSelectedProduct(null);
      clearChatSession();
    }
  };

  // Clean up URL when component unmounts
  useEffect(() => {
    return () => {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [imageUrl]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex flex-col">
            <span className="text-3xl font-bold tracking-wider">WISESTEIN</span>
            <span className="text-[#4ADE80] text-sm">Supply Chain Management At Its Best.</span>
          </Link>
          <h1 className="text-2xl font-bold">Kysynnänennusteavustaja</h1>
        </div>
        <Button variant="outline" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Kirjaudu ulos
        </Button>
      </div>

      <Tabs defaultValue="tuoteryhma" className="space-y-6" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="tuoteryhma">Tuoteryhmäennustus</TabsTrigger>
          <TabsTrigger value="tuotekohtainen">Tuotekohtainen ennustus</TabsTrigger>
          <TabsTrigger value="arkisto">Arkisto</TabsTrigger>
        </TabsList>
        
        <TabsContent value="tuoteryhma">
          <ProductSelectionContent
            selectedProduct={selectedProduct}
            setSelectedProduct={setSelectedProduct}
            imageUrl={imageUrl}
            setImageUrl={setImageUrl}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
            handleRemoveFile={handleRemoveFile}
          />
        </TabsContent>
        
        <TabsContent value="tuotekohtainen">
          <ProductSelectionContent
            selectedProduct={selectedProduct}
            setSelectedProduct={setSelectedProduct}
            imageUrl={imageUrl}
            setImageUrl={setImageUrl}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
            handleRemoveFile={handleRemoveFile}
          />
        </TabsContent>
        
        <TabsContent value="arkisto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Archive className="h-5 w-5 text-[#4ADE80] mr-2" />
                Arkisto
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">
                Arkisto-ominaisuus on tulossa pian...
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Workbench; 