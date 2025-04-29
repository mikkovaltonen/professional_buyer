import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, BarChart, Bot, X } from "lucide-react";
import { toast } from "sonner";
import { clearChatSession } from "@/api/chat";
import ChatInterface from "@/components/ChatInterface";
import { DataService } from "@/lib/dataService";
import TimeChart from "@/components/TimeChart";
import { generateChartImage } from "@/lib/chartUtils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ProductSelectionContentProps {
  selectedProduct: string | null;
  setSelectedProduct: (product: string | null) => void;
  imageUrl: string | null;
  setImageUrl: (url: string | null) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  handleRemoveFile: () => void;
}

const ProductSelectionContent: React.FC<ProductSelectionContentProps> = ({
  selectedProduct,
  setSelectedProduct,
  imageUrl,
  setImageUrl,
  isLoading,
  setIsLoading,
  handleRemoveFile
}) => {
  const [productGroups, setProductGroups] = useState<string[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [products, setProducts] = useState<{ code: string; description: string }[]>([]);
  const [chartData, setChartData] = useState<{ date: string; value: number | null; forecast?: number | null; old_forecast?: number | null; old_forecast_error?: number | null; new_forecast_manually_adjusted?: number | null }[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const dataService = DataService.getInstance();
        await dataService.loadCSVData();
        const groups = dataService.getUniqueProductGroups();
        console.log('Loaded product groups (diagnostics):', groups);
        setProductGroups(groups);
      } catch (err) {
        console.error('Error loading data:', err);
        toast.error('Failed to load data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const handleGroupChange = (group: string) => {
    console.log('Group selected:', group);
    setSelectedGroup(group);
    setSelectedProduct(null);
    setProducts([]);
    if (imageUrl) {
      URL.revokeObjectURL(imageUrl);
      setImageUrl(null);
    }
    if (!group) return;
    const dataService = DataService.getInstance();
    const productsInGroup = dataService.getProductsInGroup(group);
    console.log('Products in group:', productsInGroup);
    setProducts(productsInGroup);
  };

  const handleProductChange = async (productCode: string) => {
    console.log('Product selected:', productCode);
    setSelectedProduct(productCode);
    try {
      setIsLoading(true);
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
      await clearChatSession();
      const dataService = DataService.getInstance();
      const productData = dataService.getProductData(productCode);
      
      // Transform the data for the chart
      const transformedData = productData
        .sort((a, b) => new Date(a.Year_Month).getTime() - new Date(b.Year_Month).getTime())
        .map(item => ({
          date: item.Year_Month,
          value: item.Quantity,
          forecast: item.forecast_12m,
          old_forecast: item.old_forecast,
          old_forecast_error: item.old_forecast_error === null ? null : Number(item.old_forecast_error),
          new_forecast_manually_adjusted: item.new_forecast_manually_adjusted
        }))
        .filter(item => 
          item.value !== null || 
          item.forecast !== null || 
          item.old_forecast !== null ||
          item.old_forecast_error !== null ||
          item.new_forecast_manually_adjusted !== null
        );

      console.log('Raw product data:', productData);
      console.log('Transformed chart data:', transformedData);
      setChartData(transformedData);

      // Generate chart image for chat
      const productDescription = products.find(p => p.code === productCode)?.description || 'Tuotteen kysyntä';
      const chartImageUrl = await generateChartImage(transformedData, productDescription);
      setImageUrl(chartImageUrl);
      
      toast.success('Product selected successfully');
    } catch (err) {
      console.error('Error loading product data:', err);
      toast.error('Failed to load product data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Product Group Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart className="h-5 w-5 text-[#4ADE80] mr-2" />
            Valitse tuoteryhmä
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Select
              value={selectedGroup}
              onValueChange={handleGroupChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Valitse tuoteryhmä" />
              </SelectTrigger>
              <SelectContent>
                {productGroups.map((group, idx) => {
                  console.log('Rendering dropdown option (diagnostics):', group, idx);
                  return (
                    <SelectItem key={group} value={group}>
                      {group}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Product Selection */}
      {selectedGroup && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart className="h-5 w-5 text-[#4ADE80] mr-2" />
              Valitse tuote
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Select
                value={selectedProduct || ''}
                onValueChange={handleProductChange}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Valitse tuote" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.code} value={product.code}>
                      {product.code} - {product.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Chart Display */}
      {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
      {selectedProduct && chartData.length > 0 && !isLoading && (
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Button
                variant="outline"
                size="icon"
                className="absolute top-2 right-2 bg-white hover:bg-gray-100"
                onClick={handleRemoveFile}
              >
                <X className="h-4 w-4" />
              </Button>
              <TimeChart 
                data={chartData}
                title={products.find(p => p.code === selectedProduct)?.description || 'Tuotteen kysyntä'}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Chat Interface */}
      {selectedProduct && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <Bot className="h-5 w-5 text-[#4ADE80] mr-2" />
                Keskustele tuotteesta
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRemoveFile}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChatInterface 
              selectedProduct={products.find(p => p.code === selectedProduct)?.description} 
              selectedImageUrl={imageUrl}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProductSelectionContent; 