import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
// Card imports were here but are unused in the current context.
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; 
import { useNavigate, Link } from "react-router-dom";
import { LogOut, Settings } from "lucide-react"; // Added Settings icon
import { useAuth } from "@/hooks/useAuth";
import ForecastContent from "@/components/ForecastContent";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  // DialogFooter, // Optional: Uncomment if needed for a footer close button
  // DialogClose,  // Optional: Uncomment if needed for a footer close button
} from "@/components/ui/dialog";
import PromptEditor from "../components/PromptEditor"; // Path: src/pages/Workbench.tsx -> src/components/PromptEditor.tsx

const Workbench = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth(); // Destructure user from useAuth
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
        <div className="flex items-center space-x-2"> {/* Wrapper for buttons */}
          {user && ( // Conditionally render if user exists
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Settings className="mr-2 h-4 w-4" /> 
                  Muokkaa promptia
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]"> {/* Or any appropriate width */}
                <DialogHeader>
                  <DialogTitle>Järjestelmäpromptin muokkain</DialogTitle>
                </DialogHeader>
                <PromptEditor />
                {/* Example of DialogFooter and DialogClose, uncomment if needed
                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" variant="secondary">
                      Sulje
                    </Button>
                  </DialogClose>
                </DialogFooter>
                */}
              </DialogContent>
            </Dialog>
          )}
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Kirjaudu ulos
          </Button>
        </div>
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
