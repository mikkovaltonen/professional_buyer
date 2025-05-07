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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ForecastContentProps {
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
  forecast?: number | null;
  old_forecast?: number | null;
  old_forecast_error?: number | null;
  new_forecast_manually_adjusted?: number | null;
  explanation?: string;
}

const ForecastContent: React.FC<ForecastContentProps> = ({
  selectedProduct,
  setSelectedProduct,
  imageUrl,
  setImageUrl,
  isLoading,
  setIsLoading,
  handleRemoveFile
}) => {
  const [productClasses, setProductClasses] = useState<string[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [productGroups, setProductGroups] = useState<string[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [products, setProducts] = useState<{ code: string; description: string }[]>([]);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [chatContent, setChatContent] = useState<string>('');
  const [productDescriptions, setProductDescriptions] = useState<string[]>([]);
  const [shouldInitializeChat, setShouldInitializeChat] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedProductGroup, setSelectedProductGroup] = useState<string>('');
  const [selectedProductSubclass, setSelectedProductSubclass] = useState<string>('');
  const [chatKey, setChatKey] = useState<number>(0);
  const [classGroupsForChat, setClassGroupsForChat] = useState<string[]>([]);
  const [isChatInitialized, setIsChatInitialized] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const dataService = DataService.getInstance();
        await dataService.loadCSVData();
        const classes = dataService.getUniqueProductClasses();
        console.log('Loaded product classes:', classes);
        setProductClasses(classes.map(String));
        
        // Load initial aggregated data
        const allData = dataService.getAllData();
        const aggregatedData = aggregateData(allData);
        setChartData(aggregatedData);
      } catch (err) {
        console.error('Error loading data:', err);
        toast.error('Failed to load data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const aggregateData = (data: any[]): ChartDataPoint[] => {
    const dates = [...new Set(data.map(row => row.Year_Month))];
    return dates.map(date => {
      const rowsForDate = data.filter(row => row.Year_Month === date);
      
      // Toteutunut kysyntä
      const hasQuantity = rowsForDate.some(row => row.Quantity !== null && row.Quantity !== undefined);
      const totalQuantity = hasQuantity
        ? rowsForDate.filter(row => row.Quantity !== null)
            .reduce((sum, row) => sum + (row.Quantity || 0), 0)
        : null;

      // Tilastollinen ennuste
      const hasNewForecast = rowsForDate.some(row => row.new_forecast !== null && row.new_forecast !== undefined);
      const totalNewForecast = hasNewForecast
        ? rowsForDate.filter(row => row.new_forecast !== null)
            .reduce((sum, row) => sum + (row.new_forecast || 0), 0)
        : null;

      // Korjattu ennuste: näytetään vain jos kaikilla tuoteryhmillä on arvo
      // Selvitetään montako uniikkia tuoteryhmää on rivillä
      const uniqueGroups = [...new Set(rowsForDate.map(row => row["Product Group"]))];
      const groupsWithAdjustment = [...new Set(rowsForDate.filter(row => row.new_forecast_manually_adjusted !== null && row.new_forecast_manually_adjusted !== undefined).map(row => row["Product Group"]))];
      const showAdjusted = uniqueGroups.length > 0 && uniqueGroups.every(g => groupsWithAdjustment.includes(g));
      const totalNewForecastAdjusted = showAdjusted
        ? rowsForDate.filter(row => row.new_forecast_manually_adjusted !== null)
            .reduce((sum, row) => sum + (row.new_forecast_manually_adjusted || 0), 0)
        : null;

      // Vanha ennuste
      const hasOldForecast = rowsForDate.some(row => row.old_forecast !== null && row.old_forecast !== undefined);
      const totalOldForecast = hasOldForecast
        ? rowsForDate.filter(row => row.old_forecast !== null)
            .reduce((sum, row) => sum + (row.old_forecast || 0), 0)
        : null;

      // Ennustevirhe summatasolla: (summa kysyntä - summa vanha ennuste), jos molemmat on olemassa
      const oldForecastError =
        totalQuantity !== null && totalOldForecast !== null &&
        !isNaN(totalQuantity) && !isNaN(totalOldForecast)
          ? totalQuantity - totalOldForecast
          : null;

      return {
        date,
        value: totalQuantity,
        new_forecast: totalNewForecast,
        old_forecast: totalOldForecast,
        new_forecast_manually_adjusted: showAdjusted ? totalNewForecastAdjusted : null,
        old_forecast_error: oldForecastError
      };
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const handleClassChange = async (productClass: string) => {
    console.log('Class selected:', productClass);
    setSelectedClass(productClass);
    setSelectedGroup('');
    setSelectedProduct(null);
    setChartData([]);
    if (!productClass) {
      // If no class selected, show aggregated data
      const dataService = DataService.getInstance();
      const allData = dataService.getAllData();
      const aggregatedData = aggregateData(allData);
      setChartData(aggregatedData);
      setProductDescriptions([]);
      return;
    }
    
    try {
      const dataService = DataService.getInstance();
      // Hae ja aggregoi valitun tuoteluokan data
      const classData = dataService.getDataByClass(productClass);
      const aggregatedData = aggregateData(classData);
      setChartData(aggregatedData);
      setProductDescriptions([]);
      const groups = dataService.getProductGroupsInClass(productClass);
      console.log('Loaded product groups for class:', groups);
      setProductGroups(groups.map(String));
    } catch (err) {
      console.error('Error loading product groups:', err);
      toast.error('Failed to load product groups. Please try again.');
    }
  };

  const handleGroupChange = async (group: string) => {
    setSelectedGroup(group);
    setSelectedProduct(null);
    setChartData([]);
    setShouldInitializeChat(false); // Reset chat initialization state
    setIsChatInitialized(false); // Reset chat initialized state
    if (!group) {
      // If no group selected, show class aggregated data
      const dataService = DataService.getInstance();
      const classData = dataService.getDataByClass(selectedClass);
      const aggregatedData = aggregateData(classData);
      setChartData(aggregatedData);
      setProductDescriptions([]);
      return;
    }
    
    try {
      const dataService = DataService.getInstance();
      const groupProducts = dataService.getProductsInGroup(group);
      setProducts(groupProducts);
      // Luo pilkulla eroteltu lista tuoteryhmän tuotteista
      setProductDescriptions(groupProducts.map(p => `${p.code} ${p.description}`));
      // Show group aggregated data (so that forecast error is included)
      const groupData = dataService.getProductGroupData(group);
      const aggregatedData = aggregateData(groupData);
      setChartData(aggregatedData);
    } catch (err) {
      console.error('Error loading products:', err);
      toast.error('Failed to load products. Please try again.');
    }
  };

  const handleProductChange = async (productCode: string) => {
    console.log('Product selected:', productCode);
    setSelectedProduct(productCode);
    if (!productCode) {
      // If no product selected, show group aggregated data (so that forecast error is included)
      const dataService = DataService.getInstance();
      const groupData = dataService.getProductGroupData(selectedGroup);
      const aggregatedData = aggregateData(groupData);
      setChartData(aggregatedData);
      return;
    }

    try {
      setIsLoading(true);
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
      await clearChatSession();
      const dataService = DataService.getInstance();
      const productData = dataService.getProductData(productCode);
      
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
        }));

      setChartData(transformedData);

      // Generate chart image for chat
      const productDescription = products.find(p => p.code === productCode)?.description || 'Tuotteen kysyntä';
      const chartImageUrl = await generateChartImage(transformedData, productDescription);
      setImageUrl(chartImageUrl);
      
      toast.success('Product data loaded successfully');
    } catch (err) {
      console.error('Error loading product data:', err);
      toast.error('Failed to load product data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartChat = async () => {
    // Salli chat myös tuoteluokkatasolla
    if (!selectedProduct && !selectedGroup && !selectedClass) {
      toast.error('Valitse ensin tuote, tuoteryhmä tai tuoteluokka');
      return;
    }

    try {
      setIsLoading(true);
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
      await clearChatSession();

      let chatTitle = '';
      let chatImageUrl = imageUrl;
      let classGroups: string[] = [];

      if (selectedProduct) {
        chatTitle = products.find(p => p.code === selectedProduct)?.description || 'Tuotteen kysyntä';
      } else if (selectedGroup) {
        chatTitle = `${selectedGroup} Trendi`;
      } else if (selectedClass) {
        chatTitle = `${selectedClass} - Trendi`;
        // Hae kaikki tuoteluokan tuoteryhmät
        const dataService = DataService.getInstance();
        classGroups = dataService.getProductGroupsInClass(selectedClass);
      }

      // Generate chart image for chat
      chatImageUrl = await generateChartImage(
        chartData,
        chatTitle
      );
      setImageUrl(chatImageUrl);
      
      setShouldInitializeChat(true);
      setClassGroupsForChat(classGroups);
      setIsChatInitialized(true);
      toast.success('Chat aloitettu');
    } catch (err) {
      console.error('Error starting chat:', err);
      toast.error('Failed to start chat. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    clearChatSession();
    setChatKey(prev => prev + 1);
    setShouldInitializeChat(false);
    setIsChatInitialized(false); // chat ei ole enää initialisoitu
  };

  const handleChatContentUpdate = (content: string) => {
    if (content !== chatContent) {
      console.log('Chat content updated:', content);
      setChatContent(content);
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-col items-start">
            <div className="flex items-center mb-1">
              <BarChart className="h-4 w-4 text-[#4ADE80] mr-2" />
              <span className="text-lg font-semibold">Valitse tarkastelutaso ja arvo(t)</span>
            </div>
            <span className="text-sm text-gray-500">Voit suodattaa ennustetta valitsemalla tason ja arvon pudotusvalikoista.</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            {/* Tuoteluokka */}
            <div className="flex-1 flex items-center gap-2">
              <Select
                value={selectedClass}
                onValueChange={handleClassChange}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Valitse tuoteluokka" />
                </SelectTrigger>
                <SelectContent>
                  {productClasses.map((productClass) => (
                    <SelectItem key={productClass} value={productClass}>
                      {productClass}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedClass && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleClassChange("")}
                  aria-label="Poista tuoteluokka valinta"
                >
                  <X className="w-4 h-4 text-gray-400 hover:text-red-500" />
                </Button>
              )}
            </div>
            {/* Tuoteryhmä */}
            <div className="flex-1 flex items-center gap-2">
              <Select
                value={selectedGroup}
                onValueChange={handleGroupChange}
                disabled={!selectedClass}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Valitse tuoteryhmä" />
                </SelectTrigger>
                <SelectContent>
                  {productGroups.map((group) => (
                    <SelectItem key={group} value={group}>
                      {group}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedGroup && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleGroupChange("")}
                  aria-label="Poista tuoteryhmä valinta"
                >
                  <X className="w-4 h-4 text-gray-400 hover:text-red-500" />
                </Button>
              )}
            </div>
            {/* Tuote */}
            <div className="flex-1 flex items-center gap-2">
              <Select
                value={selectedProduct || ''}
                onValueChange={handleProductChange}
                disabled={!selectedGroup}
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
              {selectedProduct && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleProductChange("")}
                  aria-label="Poista tuote valinta"
                >
                  <X className="w-4 h-4 text-gray-400 hover:text-red-500" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chart Display */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <TimeChart 
              data={chartData}
              title={
                selectedProduct
                  ? products.find(p => p.code === selectedProduct)?.description || 'Tuotteen kysyntä'
                  : selectedGroup
                    ? `${selectedGroup} Trendi`
                    : selectedClass
                      ? `${selectedClass} - Trendi`
                      : 'Kaikki tuoteluokat - Trendi'
              }
              subtitle={
                selectedProduct
                  ? undefined
                  : selectedGroup && productDescriptions.length > 0
                    ? productDescriptions.join(' | ')
                    : !selectedClass && productClasses.length > 0
                      ? productClasses.join(' | ')
                      : undefined
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Chat Interface */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Bot className="h-5 w-5 text-[#4ADE80] mr-2" />
              Sparraa AI markkinatutkijan kanssa ennusteesta
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={handleStartChat}
                disabled={isLoading || isChatInitialized || (!selectedProduct && !selectedGroup && !selectedClass)}
              >
                Aloita chat
              </Button>
              <Button 
                variant="outline" 
                onClick={handleClearChat}
                disabled={isLoading || !isChatInitialized}
              >
                Puhdista chat
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent style={{ minHeight: '500px' }}>
          <ChatInterface 
            key={chatKey}
            selectedProduct={
              selectedProduct 
                ? products.find(p => p.code === selectedProduct)?.description || 'Tuotteen kysyntä'
                : `${selectedGroup} Trendi`
            }
            selectedImageUrl={imageUrl}
            onMessageUpdate={handleChatContentUpdate}
            shouldInitialize={shouldInitializeChat}
            classGroups={classGroupsForChat}
          />
        </CardContent>
      </Card>

      {/* Apply Corrections Button */}
      {(selectedProduct || selectedGroup || selectedClass) && (
        <div className="flex justify-end gap-4 mt-4">
          <ApplyCorrectionsButton
            chatContent={chatContent}
            selectedProductGroup={selectedGroup}
            selectedProductCode={selectedProduct}
            selectedClass={selectedClass}
            onCorrectionsApplied={() => {
              if (selectedProduct) {
                handleProductChange(selectedProduct);
              } else if (selectedGroup) {
                handleGroupChange(selectedGroup);
              } else if (selectedClass) {
                handleClassChange(selectedClass);
              }
            }}
          />
        </div>
      )}
    </div>
  );
};

export default ForecastContent; 