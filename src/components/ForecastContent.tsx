import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, BarChart, X } from "lucide-react";
import { toast } from "sonner";
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
import GeminiChat from "@/components/GeminiChat";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import ForecastErrorChart from "./ForecastErrorChart";

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
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedProductGroup, setSelectedProductGroup] = useState<string>('');
  const [selectedProductSubclass, setSelectedProductSubclass] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [chartLevel, setChartLevel] = useState<'class' | 'group' | 'product'>('class');
  const [activeTab, setActiveTab] = useState<'history' | 'error'>('history');
  const [rawData, setRawData] = useState<any[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const dataService = DataService.getInstance();
        await dataService.loadForecastData();
        const classes = dataService.getUniqueProductClasses();
        console.log('Loaded product classes:', classes);
        setProductClasses(classes.map(String));
        
        // Load initial aggregated data
        const allData = dataService.getAllData();
        setRawData(allData);
        const aggregatedData = aggregateData(allData);
        setChartData(aggregatedData);
        // Generate initial chart image
        const chartImageUrl = await generateChartImage(aggregatedData, 'Kaikki tuoteluokat');
        setImageUrl(chartImageUrl);
      } catch (err) {
        console.error('Error loading data:', err);
        toast.error('Failed to load data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    // Päivitä chartLevel valitun tason mukaan
    if (selectedProduct) {
      setChartLevel('product');
    } else if (selectedGroup) {
      setChartLevel('group');
    } else if (selectedClass) {
      setChartLevel('class');
    } else {
      setChartLevel('class'); // Oletus
    }
  }, [selectedProduct, selectedGroup, selectedClass]);

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
      setRawData(allData);
      const aggregatedData = aggregateData(allData);
      setChartData(aggregatedData);
      // Luo kuva koko datasta
      const chartImageUrl = await generateChartImage(aggregatedData, 'Kaikki tuoteluokat');
      setImageUrl(chartImageUrl);
      return;
    }
    
    try {
      const dataService = DataService.getInstance();
      // Hae ja aggregoi valitun tuoteluokan data
      const classData = dataService.getDataByClass(productClass);
      setRawData(classData);
      const aggregatedData = aggregateData(classData);
      setChartData(aggregatedData);
      // Luo kuva valitun luokan datasta
      const chartImageUrl = await generateChartImage(aggregatedData, productClass);
      setImageUrl(chartImageUrl);
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
    if (!group) {
      // If no group selected, show class aggregated data
      const dataService = DataService.getInstance();
      const classData = dataService.getDataByClass(selectedClass);
      setRawData(classData);
      const aggregatedData = aggregateData(classData);
      setChartData(aggregatedData);
      // Luo kuva valitun luokan datasta
      const chartImageUrl = await generateChartImage(aggregatedData, selectedClass || '');
      setImageUrl(chartImageUrl);
      return;
    }
    
    try {
      const dataService = DataService.getInstance();
      const groupProducts = dataService.getProductsInGroup(group);
      setProducts(groupProducts);
      // Luo pilkulla eroteltu lista tuoteryhmän tuotteista
      const productDescriptions = groupProducts.map(p => `${p.code} ${p.description}`);
      // Show group aggregated data (so that forecast error is included)
      const groupData = dataService.getProductGroupData(group);
      setRawData(groupData);
      const aggregatedData = aggregateData(groupData);
      setChartData(aggregatedData);
      // Luo kuva valitun ryhmän datasta
      const chartImageUrl = await generateChartImage(aggregatedData, group);
      setImageUrl(chartImageUrl);
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
      setRawData(groupData);
      const aggregatedData = aggregateData(groupData);
      setChartData(aggregatedData);
      return;
    }

    try {
      setIsLoading(true);
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
      const dataService = DataService.getInstance();
      const productData = dataService.getProductData(productCode);
      setRawData(productData);
      
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

      // Generate chart image
      const productDescription = products.find(p => p.code === productCode)?.description || 'Tuotteen kysyntä';
      const chartImageUrl = await generateChartImage(transformedData, productDescription);
      console.log('setImageUrl chartImageUrl:', chartImageUrl.slice(0, 100), 'length:', chartImageUrl.length);
      setImageUrl(chartImageUrl);
      
      toast.success('Product data loaded successfully');
    } catch (err) {
      console.error('Error loading product data:', err);
      toast.error('Failed to load product data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Chart refresh callback for corrections
  const handleCorrectionsApplied = async () => {
    try {
      setIsLoading(true);
      const dataService = DataService.getInstance();
      dataService.data = []; // Tyhjennä cache, jotta saadaan tuore data Firestoresta
      await dataService.loadForecastData();
      let data: any[] = [];
      if (selectedProduct) {
        data = dataService.getProductData(selectedProduct);
      } else if (selectedGroup) {
        data = dataService.getProductGroupData(selectedGroup);
      } else if (selectedClass) {
        data = dataService.getDataByClass(selectedClass);
      } else {
        data = dataService.getAllData();
      }
      setRawData(data);
      const aggregatedData = aggregateData(data);
      setChartData(aggregatedData);
      // Päivitä myös kuva
      const chartImageUrl = await generateChartImage(aggregatedData, selectedProduct || selectedGroup || selectedClass || 'Kaikki tuoteluokat');
      setImageUrl(chartImageUrl);
      toast.success('Graafi päivitetty korjausten jälkeen');
    } catch (err) {
      console.error('Error refreshing chart after corrections:', err);
      toast.error('Graafin päivitys epäonnistui');
    } finally {
      setIsLoading(false);
    }
  };

  // Laske ennustevirhedata (kpl ja %)
  const calculateForecastErrorData = (data: any[]): { date: string, meanAbsError: number, percentBelow20: number }[] => {
    // Suodata pois rivit, joissa sekä Quantity että old_forecast ovat null/undefined/0
    const filtered = data.filter(row => {
      const q = row.Quantity;
      const f = row.old_forecast;
      // Jos molemmat null/undefined/0, jätetään pois
      if ((q === null || q === undefined || q === 0) && (f === null || f === undefined || f === 0)) return false;
      return true;
    });
    // Ryhmitellään päivämäärän mukaan
    const dates = [...new Set(filtered.map(row => row.Year_Month || row.date))];
    let result = dates.map(date => {
      // Etsi kaikki rivit tälle päivälle
      const rows = filtered.filter(row => (row.Year_Month || row.date) === date);
      // Lasketaan vain rivit, joilla on sekä toteutunut että ennuste
      const validRows = rows.filter(row => row.Quantity !== null && row.old_forecast !== null && row.Quantity !== undefined && row.old_forecast !== undefined && row.Quantity !== 0 && row.old_forecast !== 0);
      const absErrors = validRows.map(row => Math.abs(row.Quantity - row.old_forecast));
      const meanAbsError = absErrors.length > 0 ? absErrors.reduce((a, b) => a + b, 0) / absErrors.length : 0;
      const percentBelow20 = validRows.length > 0 ? 100 * validRows.filter(row => Math.abs(row.Quantity - row.old_forecast) / (row.Quantity === 0 ? 1 : Math.abs(row.Quantity)) < 0.2).length / validRows.length : 0;
      if (validRows.length === 0) return null;
      return {
        date,
        meanAbsError,
        percentBelow20
      };
    }).filter(Boolean);
    // Järjestä aikajärjestykseen ja ota vain viimeiset 36 kuukautta
    result = result.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    if (result.length > 36) {
      result = result.slice(result.length - 36);
    }
    return result;
  };

  return (
    <div className="space-y-4">
      {/* Product Selection Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Ennustettavan kokonaisuuden valinta</CardTitle>
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

      {/* Tabs for chart views */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'history' | 'error')} className="w-full">
        <TabsList>
          <TabsTrigger value="history">Kysynnän historia ja ennuste</TabsTrigger>
          <TabsTrigger value="error">Ennustevirhe</TabsTrigger>
        </TabsList>
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <BarChart className="h-5 w-5 text-[#4ADE80] mr-2" />
                  Kysynnän historia ja ennusteet
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TimeChart 
                data={chartData}
                title={
                  selectedProduct
                    ? products.find(p => p.code === selectedProduct)?.description || 'Tuotteen kysyntä'
                    : selectedGroup
                      ? selectedGroup
                      : selectedClass
                        ? selectedClass
                        : 'Kaikki tuoteluokat'
                }
                subtitle={
                  selectedProduct
                    ? 'Tuotetaso'
                    : selectedGroup
                      ? `Tuoteryhmätaso - ${products.map(p => `${p.code} ${p.description}`).join(', ')}`
                      : selectedClass
                        ? 'Tuoteluokkataso'
                        : 'Kaikki tuoteluokat'
                }
              />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="error">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <BarChart className="h-5 w-5 text-[#ef4444] mr-2" />
                  Ennustevirhe
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ForecastErrorChart 
                data={calculateForecastErrorData(rawData)}
                title={
                  selectedProduct
                    ? products.find(p => p.code === selectedProduct)?.description || 'Tuotteen ennustevirhe'
                    : selectedGroup
                      ? selectedGroup
                      : selectedClass
                        ? selectedClass
                        : 'Kaikki tuoteluokat'
                }
                subtitle={
                  selectedProduct
                    ? 'Tuotetaso'
                    : selectedGroup
                      ? `Tuoteryhmätaso - ${products.map(p => `${p.code} ${p.description}`).join(', ')}`
                      : selectedClass
                        ? 'Tuoteluokkataso'
                        : 'Kaikki tuoteluokat'
                }
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Väli ja harmaa yläreunus chatin ja graafin väliin */}
      <div className="my-20 border-t border-gray-200" />

      {/* Chat wrapper */}
      <div className="bg-white shadow rounded-lg p-4 mt-0">
        <GeminiChat 
          imageUrl={imageUrl}
          chartLevel={chartLevel}
          onCorrectionsApplied={handleCorrectionsApplied}
          selectedClass={selectedClass}
          selectedGroups={
            selectedGroup
              ? [selectedGroup]
              : !selectedProduct && productGroups.length > 0
                ? productGroups
                : []
          }
          selectedProducts={
            selectedProduct
              ? products.filter(p => p.code === selectedProduct)
              : selectedGroup
                ? products
                : []
          }
        />
      </div>
    </div>
  );
};

export default ForecastContent; 