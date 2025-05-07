import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate, Link } from "react-router-dom";
import { LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import ForecastContent from "@/components/ForecastContent";

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

  const handleRemoveFile = () => {
    if (imageUrl) {
      URL.revokeObjectURL(imageUrl);
    }
    console.log('setImageUrl(null) called from handleRemoveFile');
    setImageUrl(null);
    setSelectedProduct(null);
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

      <ForecastContent
        selectedProduct={selectedProduct}
        setSelectedProduct={setSelectedProduct}
        imageUrl={imageUrl}
        setImageUrl={setImageUrl}
        isLoading={isLoading}
        setIsLoading={setIsLoading}
        handleRemoveFile={handleRemoveFile}
      />
    </div>
  );
};

export default Workbench; 