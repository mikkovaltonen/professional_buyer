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
import SaveForecastButton from "@/components/SaveForecastButton";
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
  const [chartData, setChartData] = useState<{ date: string; value: number | null; forecast?: number | null; old_forecast?: number | null; old_forecast_error?: number | null }[]>([]);
  const [chatContent, setChatContent] = useState<string>('');
  const [corrections, setCorrections] = useState<ForecastCorrection[]>([]);

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
    if (!group) return;
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
        value: item.Quantity,
        forecast: item.forecast_12m,
        old_forecast: item.old_forecast,
        old_forecast_error: item.old_forecast_error === null ? null : Number(item.old_forecast_error)
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

  // Add this function to extract corrections from chat content
  const extractCorrections = (content: string): ForecastCorrection[] => {
    try {
      console.log('Attempting to extract corrections from:', content);
      const jsonRegex = /\[\s*\{[\s\S]*?\}\s*\]/g;
      const matches = [...content.matchAll(jsonRegex)];
      console.log('Found JSON matches:', matches);
      
      if (matches.length === 0) {
        console.log('No JSON matches found');
        return [];
      }

      const jsonContent = matches[matches.length - 1][0];
      console.log('Extracted JSON content:', jsonContent);
      
      try {
        const parsedCorrections = JSON.parse(jsonContent);
        console.log('Successfully parsed corrections:', parsedCorrections);
        
        if (Array.isArray(parsedCorrections)) {
          // Validate the structure of each correction
          const validCorrections = parsedCorrections.filter(item => {
            const isValid = item.product_group && item.month && 
              (typeof item.correction_percent === 'number' || 
               (typeof item.correction_percent === 'string' && !isNaN(Number(item.correction_percent))));
            if (!isValid) {
              console.log('Invalid correction item:', item);
            }
            return isValid;
          });
          console.log('Valid corrections:', validCorrections);
          return validCorrections;
        }
      } catch (parseError) {
        console.error('JSON parsing error:', parseError);
      }
      
      return [];
    } catch (error) {
      console.error('Error extracting corrections:', error);
      return [];
    }
  };

  // Update chat content handler to also extract corrections
  const handleChatContentUpdate = (content: string) => {
    if (content !== chatContent) {
      console.log('Chat content updated:', content);
      setChatContent(content);
      const extractedCorrections = extractCorrections(content);
      console.log('Extracted corrections:', extractedCorrections);
      if (JSON.stringify(extractedCorrections) !== JSON.stringify(corrections)) {
        console.log('Setting new corrections:', extractedCorrections);
        setCorrections(extractedCorrections);
      }
    }
  };

  // Add useEffect to monitor corrections state
  useEffect(() => {
    console.log('Current corrections state:', corrections);
  }, [corrections]);

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
        <>
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
                onMessageUpdate={handleChatContentUpdate}
              />
            </CardContent>
          </Card>
          <div className="flex justify-end gap-4 mt-4">
            <SaveForecastButton 
              chatContent={chatContent} 
              selectedProductGroup={selectedGroup}
            />
            <ApplyCorrectionsButton 
              selectedProductGroup={selectedGroup}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default ProductGroupForecastContent; 