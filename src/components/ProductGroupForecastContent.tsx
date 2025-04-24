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
  const [chartData, setChartData] = useState<{ date: string; value: number | null; forecast?: number | null; old_forecast?: number | null; old_forecast_error?: number | null }[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const dataService = DataService.getInstance();
        await dataService.loadCSVData();
        const groups = dataService.getUniqueProductGroups();
        console.log('Loaded product groups:', groups);
        setProductGroups(groups);
        if (groups.length > 0 && !selectedGroup) {
          handleGroupChange(groups[0]);
        }
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
    try {
      setIsLoading(true);
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
      await clearChatSession();
      const dataService = DataService.getInstance();
      const groupData = dataService.getProductGroupData(group);
      
      // Transform the data for the chart
      const transformedData = groupData.map(item => ({
        date: item.Year_Month,
        value: item.Quantity === '' ? null : parseFloat(item.Quantity),
        forecast: item.forecast_12m === '' ? null : parseFloat(item.forecast_12m),
        old_forecast: item.old_forecast === '' ? null : parseFloat(item.old_forecast),
        old_forecast_error: item.old_forecast_error === '' ? null : parseFloat(item.old_forecast_error)
      }))
      .filter(item => 
        item.value !== null || 
        item.forecast !== null || 
        item.old_forecast !== null ||
        item.old_forecast_error !== null
      );

      console.log('Transformed chart data:', transformedData);
      setChartData(transformedData);

      // Generate chart image for chat
      const chartImageUrl = await generateChartImage(transformedData, `${group} Total Demand`);
      setImageUrl(chartImageUrl);
      
      toast.success('Product group data loaded successfully');
    } catch (err) {
      console.error('Error loading product group data:', err);
      toast.error('Failed to load product group data. Please try again.');
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
            <div className="space-y-2">
              {productGroups.map((group, index) => (
                <div key={`group-${group}-${index}`} className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id={`group-${group}-${index}`}
                    name="productGroup"
                    value={group}
                    checked={selectedGroup === group}
                    onChange={() => handleGroupChange(group)}
                    className="h-4 w-4 text-[#4ADE80] focus:ring-[#4ADE80]"
                  />
                  <label htmlFor={`group-${group}-${index}`} className="text-sm">
                    {group}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chart Display */}
      {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
      {selectedGroup && chartData.length > 0 && !isLoading && (
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
                title={`${selectedGroup} Total Demand`}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Chat Interface */}
      {selectedGroup && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <Bot className="h-5 w-5 text-[#4ADE80] mr-2" />
                Keskustele tuoteryhmästä
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
              selectedProduct={`${selectedGroup} Total Demand`}
              selectedImageUrl={imageUrl}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProductGroupForecastContent; 