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
import ApplyCorrectionsButton from "@/components/ApplyCorrectionsButton";

interface ProductSelectionContentProps {
  selectedProduct: string | null;
  setSelectedProduct: (product: string | null) => void;
  imageUrl: string | null;
  setImageUrl: (url: string | null) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  handleRemoveFile: () => void;
}

interface ChartDataPoint {
  date: string;
  value: number | null;
  new_forecast?: number | null;
  old_forecast?: number | null;
  old_forecast_error?: number | null;
  new_forecast_manually_adjusted?: number | null;
  explanation?: string;
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
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [chatContent, setChatContent] = useState<string>('');
  const [productGroups, setProductGroups] = useState<string[]>([]);
  const [products, setProducts] = useState<{ code: string; description: string }[]>([]);

  useEffect(() => {
    const dataService = DataService.getInstance();
    const groups = dataService.getUniqueProductGroups();
    setProductGroups(groups);
  }, []);

  const handleGroupChange = async (group: string) => {
    setSelectedGroup(group);
    setSelectedProduct(null);
    setChartData([]);
    if (!group) return;
    
    try {
      const dataService = DataService.getInstance();
      const groupProducts = dataService.getProductsInGroup(group);
      setProducts(groupProducts);
    } catch (err) {
      console.error('Error loading products:', err);
      toast.error('Failed to load products. Please try again.');
    }
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
          new_forecast: item.new_forecast,
          old_forecast: item.old_forecast,
          old_forecast_error: item.old_forecast_error === null ? null : Number(item.old_forecast_error),
          new_forecast_manually_adjusted: item.new_forecast_manually_adjusted,
          explanation: item.explanation
        }))
        .filter(item => 
          item.value !== null || 
          item.new_forecast !== null || 
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

  // Päivitetään chatin sisältö vain setChatContentilla
  const handleChatContentUpdate = (content: string) => {
    if (content !== chatContent) {
      console.log('Chat content updated:', content);
      setChatContent(content);
    }
  };

  const handleRefreshChart = async () => {
    if (!selectedProduct) return;
    
    try {
      setIsLoading(true);
      const dataService = DataService.getInstance();
      const productData = dataService.getProductData(selectedProduct);
      
      // Transform the data for the chart
      const transformedData = productData
        .sort((a, b) => new Date(a.Year_Month).getTime() - new Date(b.Year_Month).getTime())
        .map(item => ({
          date: item.Year_Month,
          value: item.Quantity,
          new_forecast: item.new_forecast,
          old_forecast: item.old_forecast,
          old_forecast_error: item.old_forecast_error === null ? null : Number(item.old_forecast_error),
          new_forecast_manually_adjusted: item.new_forecast_manually_adjusted,
          explanation: item.explanation
        }))
        .filter(item => 
          item.value !== null || 
          item.new_forecast !== null || 
          item.old_forecast !== null ||
          item.old_forecast_error !== null ||
          item.new_forecast_manually_adjusted !== null
        );

      setChartData(transformedData);

      // Generate new chart image for chat
      const productDescription = products.find(p => p.code === selectedProduct)?.description || 'Tuotteen kysyntä';
      const chartImageUrl = await generateChartImage(transformedData, productDescription);
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
      setImageUrl(chartImageUrl);
      
      toast.success('Chart data refreshed successfully');
    } catch (err) {
      console.error('Error refreshing chart data:', err);
      toast.error('Failed to refresh chart data');
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
      {selectedProduct && chartData.length > 0 && !isLoading && (
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
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
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Bot className="h-5 w-5 text-[#4ADE80] mr-2" />
                  Keskustele tuotteesta
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent style={{ minHeight: '500px' }}>
              <ChatInterface 
                selectedProduct={selectedProduct}
                selectedImageUrl={imageUrl}
                onMessageUpdate={handleChatContentUpdate}
              />
            </CardContent>
          </Card>
          <div className="flex justify-end gap-4 mt-4">
            <ApplyCorrectionsButton
              chatContent={chatContent}
              selectedProduct={selectedProduct}
              onCorrectionsApplied={handleRefreshChart}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default ProductSelectionContent; 