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
import ApplyCorrectionsButton from "@/components/ApplyCorrectionsButton";
import { ForecastCorrection } from "@/lib/dataService";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ProductGroupForecastContentProps {
  imageUrl: string | null;
  setImageUrl: (url: string | null) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  handleRemoveFile: () => void;
}

const ProductGroupForecastContent: React.FC<ProductGroupForecastContentProps> = ({
  imageUrl,
  setImageUrl,
  isLoading,
  setIsLoading,
  handleRemoveFile
}) => {
  const [productGroups, setProductGroups] = useState<string[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [chartData, setChartData] = useState<{ date: string; value: number | null; forecast?: number | null; old_forecast?: number | null; old_forecast_error?: number | null; new_forecast_manually_adjusted?: number | null }[]>([]);
  const [chatContent, setChatContent] = useState<string>('');
  const [productDescriptions, setProductDescriptions] = useState<string[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const dataService = DataService.getInstance();
        await dataService.loadCSVData();
        const groups = dataService.getUniqueProductGroups();
        console.log('Loaded product groups:', groups);
        setProductGroups(groups.map(String));
      } catch (err) {
        console.error('Error loading data:', err);
        toast.error('Failed to load data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const handleGroupChange = async (group: string) => {
    console.log('Group selected:', group);
    setSelectedGroup(group);
    setChartData([]);
    setProductDescriptions([]);
    if (!group) return;
    try {
      setIsLoading(true);
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
      await clearChatSession();
      const dataService = DataService.getInstance();
      const groupData = dataService.getProductGroupData(group);
      // Fetch product descriptions for subtitle
      const products = dataService.getProductsInGroup(group);
      setProductDescriptions(products.map(p => p.description));
      // Transform the data for the chart
      const transformedData = groupData.map(item => ({
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

      console.log('Transformed chart data:', transformedData);
      setChartData(transformedData);

      // Generate chart image for chat
      const chartImageUrl = await generateChartImage(transformedData, `${group} Kokonaiskysyntä`);
      setImageUrl(chartImageUrl);
      
      toast.success('Product group data loaded successfully');
    } catch (err) {
      console.error('Error loading product group data:', err);
      toast.error('Failed to load product group data. Please try again.');
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
                {productGroups.map((group, idx) => (
                  <SelectItem key={String(group)} value={String(group)}>
                    {group}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Chart Display */}
      {selectedGroup && chartData.length > 0 && !isLoading && (
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <TimeChart 
                data={chartData}
                title={`${selectedGroup} Kokonaiskysyntä`}
                subtitle={productDescriptions.join(', ')}
                showForecastErrorLine={false}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add extra margin between chart and chat */}
      <div style={{ marginTop: '2.5rem' }} />

      {/* Chat Interface */}
      {selectedGroup && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Bot className="h-5 w-5 text-[#4ADE80] mr-2" />
                  Keskustele tuoteryhmästä
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent style={{ minHeight: '500px' }}>
              <ChatInterface 
                selectedProduct={`${selectedGroup} Kokonaiskysyntä`}
                selectedImageUrl={imageUrl}
                onMessageUpdate={handleChatContentUpdate}
              />
            </CardContent>
          </Card>
          <div className="flex justify-end gap-4 mt-4">
            <ApplyCorrectionsButton
              chatContent={chatContent}
              selectedProductGroup={selectedGroup}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default ProductGroupForecastContent; 