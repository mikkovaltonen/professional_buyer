import React, { useEffect, useState, useCallback } from 'react';
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
import { generateErrorChartImage } from "@/lib/chartUtils";
import ForecastErrorChart from "./ForecastErrorChart";
import { generateTruncatedListString } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

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

interface ErrorOverviewRow {
  prod_class?: string;
  prodgroup?: string;
  prodcode?: string;
  proddesc1?: string;
  avgAbsPercentError: number;
  avgAbsError: number;
  level: 'class' | 'group' | 'product';
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
  const [activeTab, setActiveTab] = useState<'history' | 'error' | 'overview'>('history');
  const [rawData, setRawData] = useState<any[]>([]);
  const [errorImageUrl, setErrorImageUrl] = useState<string | null>(null);
  const [currentClassProductGroupDetails, setCurrentClassProductGroupDetails] = useState<{ code: string; description: string; }[]>([]);
  const [errorOverviewData, setErrorOverviewData] = useState<ErrorOverviewRow[]>([]);
  const [sortField, setSortField] = useState<keyof ErrorOverviewRow>('avgAbsError');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('[ForecastContent] useEffect (initial load): Starting initial data load.');
        setIsLoading(true);
        const dataService = DataService.getInstance();
        await dataService.loadForecastData();
        const classes = dataService.getUniqueProductClasses();
        console.log(`[ForecastContent] useEffect (initial load): Loaded ${classes.length} unique product classes.`);
        setProductClasses(classes.map(String).sort((a, b) => a.localeCompare(b)));
        
        const allData = dataService.getAllData();
        setRawData(allData);
        console.log(`[ForecastContent] useEffect (initial load): Processing ${allData.length} raw data rows for initial aggregation.`);
        const aggregatedData = aggregateData(allData);
        setChartData(aggregatedData);
        console.log(`[ForecastContent] useEffect (initial load): Aggregated data set (${aggregatedData.length} points). Generating initial chart image for 'Kaikki tuoteluokat'.`);
        const chartImageUrl = await generateChartImage(aggregatedData, 'Kaikki tuoteluokat');
        setImageUrl(chartImageUrl);
        console.log('[ForecastContent] useEffect (initial load): Initial chart image generated and set.');
      } catch (err) {
        console.error('[ForecastContent] useEffect (initial load): Error loading initial data:', err);
        toast.error('Failed to load data. Please try again.');
      } finally {
        setIsLoading(false);
        console.log('[ForecastContent] useEffect (initial load): Initial data load process finished.');
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    let newChartLevel: 'class' | 'group' | 'product' = 'class';
    if (selectedProduct) {
      newChartLevel = 'product';
    } else if (selectedGroup) {
      newChartLevel = 'group';
    } else if (selectedClass) {
      newChartLevel = 'class';
    }
    setChartLevel(newChartLevel);
  }, [selectedProduct, selectedGroup, selectedClass]);

  const aggregateData = (
    data: any[], 
    aggregationLevel?: string, 
    expectedProductGroups?: string[]
  ): ChartDataPoint[] => {
    // Debug: Check if MTP23X data exists in the dataset being aggregated
    const mtp23xData = data.filter(d => d.prodcode === 'MTP23X');
    console.log(`[ForecastContent] aggregateData: Found ${mtp23xData.length} MTP23X records in dataset of ${data.length}`);
    
    if (mtp23xData.length > 0) {
      const aug2025 = mtp23xData.find(d => d.Year_Month === '2025-08-01');
      if (aug2025) {
        console.log('[ForecastContent] aggregateData: MTP23X 2025-08-01 data:', {
          prodcode: aug2025.prodcode,
          Year_Month: aug2025.Year_Month,
          new_forecast_manually_adjusted: aug2025.new_forecast_manually_adjusted,
          prodgroup: aug2025.prodgroup
        });
      } else {
        console.log('[ForecastContent] aggregateData: No MTP23X 2025-08-01 data found. Available months:', 
          mtp23xData.map(d => d.Year_Month).sort());
      }
    }

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

      // Korjattu ennuste
      const adjustedRows = rowsForDate.filter(row => 
        row.new_forecast_manually_adjusted !== null && 
        row.new_forecast_manually_adjusted !== undefined
      );
      
      const groupsWithAdjustment = [...new Set(adjustedRows.map(row => row.prodgroup))];

      // Show adjusted forecast if ANY product has a manual adjustment
      const showAdjusted = groupsWithAdjustment.length > 0;
      
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

      const result = {
        date,
        value: totalQuantity,
        new_forecast: totalNewForecast,
        old_forecast: totalOldForecast,
        new_forecast_manually_adjusted: showAdjusted ? totalNewForecastAdjusted : null,
        old_forecast_error: oldForecastError
      };

      // Debug for 2025-08-01
      if (date === '2025-08-01') {
        console.log(`[ForecastContent] Final result for 2025-08-01:`, {
          showAdjusted,
          totalNewForecastAdjusted,
          finalAdjustedValue: result.new_forecast_manually_adjusted
        });
      }

      return result;
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const handleClassChange = async (productClass: string) => {
    console.log(`[ForecastContent] handleClassChange: Class selected: '${productClass}'. Resetting group and product.`);
    setSelectedClass(productClass);
    setSelectedGroup('');
    setSelectedProduct(null);
    setChartData([]);
    setImageUrl(null);
    setIsLoading(true);
    try {
      const dataService = DataService.getInstance();
      let dataToAggregate;
      let chartTitle;
      let expectedGroupsForClass: string[] | undefined = undefined;

      if (!productClass) {
        console.log('[ForecastContent] handleClassChange: No class selected, showing aggregated data for all classes.');
        dataToAggregate = dataService.getAllData();
        chartTitle = 'Kaikki tuoteluokat';
        setProductGroups([]); 
        setProducts([]);
        setCurrentClassProductGroupDetails([]);
      } else {
        console.log(`[ForecastContent] handleClassChange: Fetching data for class: '${productClass}'.`);
        dataToAggregate = dataService.getDataByClass(productClass);
        chartTitle = productClass;
        const groups = dataService.getProductGroupsInClass(productClass);
        expectedGroupsForClass = groups.map(String);
        expectedGroupsForClass.sort((a, b) => a.localeCompare(b)); // Sort here
        console.log(`[ForecastContent] handleClassChange: Loaded ${expectedGroupsForClass.length} product groups for class '${productClass}'. These are the expected groups for adjusted forecast aggregation.`);
        setProductGroups(expectedGroupsForClass);
        setProducts([]);
        const groupDetails = dataService.getProductGroupDetailsInClass(productClass);
        setCurrentClassProductGroupDetails(groupDetails);
        console.log(`[ForecastContent] handleClassChange: Loaded ${groupDetails.length} product group details for class '${productClass}'.`);
      }
      setRawData(dataToAggregate);
      const aggregatedData = aggregateData(dataToAggregate, productClass || 'All Classes', expectedGroupsForClass);
      setChartData(aggregatedData);
      console.log(`[ForecastContent] handleClassChange: Aggregated data set (${aggregatedData.length} points for '${chartTitle}'). Generating chart image.`);
      const chartImageUrl = await generateChartImage(aggregatedData, chartTitle);
      setImageUrl(chartImageUrl);
      console.log(`[ForecastContent] handleClassChange: Chart image for '${chartTitle}' generated and set.`);
    } catch (err) {
      console.error(`[ForecastContent] handleClassChange: Error processing class change for '${productClass}':`, err);
      toast.error('Failed to update data for selected class. Please try again.');
      setImageUrl(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGroupChange = async (group: string) => {
    console.log(`[ForecastContent] handleGroupChange: Group selected: '${group}' (under class '${selectedClass}'). Resetting product.`);
    setSelectedGroup(group);
    setSelectedProduct(null);
    setChartData([]);
    setImageUrl(null);
    setIsLoading(true);
    try {
      const dataService = DataService.getInstance();
      let dataToAggregate;
      let chartTitle;
      if (!group) {
        console.log(`[ForecastContent] handleGroupChange: No group selected, showing aggregated data for class: '${selectedClass}'.`);
        dataToAggregate = dataService.getDataByClass(selectedClass);
        chartTitle = selectedClass || 'Valitse luokka';
        setProducts([]);
      } else {
        console.log(`[ForecastContent] handleGroupChange: Fetching data for group: '${group}' within class '${selectedClass}'.`);
      const groupProducts = dataService.getProductsInGroup(group, selectedClass);
      groupProducts.sort((a, b) => {
        const descA = a.description.toLowerCase();
        const descB = b.description.toLowerCase();
        const codeA = a.code.toLowerCase();
        const codeB = b.code.toLowerCase();

        if (descA < descB) return -1;
        if (descA > descB) return 1;
        if (codeA < codeB) return -1;
        if (codeA > codeB) return 1;
        return 0;
      });
      setProducts(groupProducts);
        console.log(`[ForecastContent] handleGroupChange: Loaded ${groupProducts.length} products for group '${group}' in class '${selectedClass}'.`);
        dataToAggregate = dataService.getProductGroupData(group, selectedClass);
        chartTitle = group;
      }
      setRawData(dataToAggregate);
      const aggregatedData = aggregateData(dataToAggregate, group || selectedClass || 'Selected Group/Class');
      setChartData(aggregatedData);
      console.log(`[ForecastContent] handleGroupChange: Aggregated data set (${aggregatedData.length} points for '${chartTitle}'). Generating chart image.`);
      const chartImageUrl = await generateChartImage(aggregatedData, chartTitle);
      setImageUrl(chartImageUrl);
      console.log(`[ForecastContent] handleGroupChange: Chart image for '${chartTitle}' generated and set.`);
    } catch (err) {
      console.error(`[ForecastContent] handleGroupChange: Error processing group change for '${group}':`, err);
      toast.error('Failed to update data for selected group. Please try again.');
      setImageUrl(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProductChange = async (productCode: string) => {
    console.log(`[ForecastContent] handleProductChange: Product selected: '${productCode}' (under group '${selectedGroup}').`);
    setSelectedProduct(productCode);
    setChartData([]);
    setImageUrl(null);
    setIsLoading(true);
    try {
      const dataService = DataService.getInstance();
      let dataToChart;
      let chartTitle;
      if (!productCode) {
        console.log(`[ForecastContent] handleProductChange: No product selected, showing aggregated data for group: '${selectedGroup}' within class '${selectedClass}'.`);
        dataToChart = dataService.getProductGroupData(selectedGroup, selectedClass);
        chartTitle = selectedGroup || 'Valitse ryhmä';
        // Kun tuotevalinta poistetaan, näytetään ryhmän aggregoitu data, joka vaatii aggregointifunktion
        const aggregatedGroupData = aggregateData(dataToChart, chartTitle);
        setChartData(aggregatedGroupData);
        setRawData(dataToChart); // Set rawData for the group
        console.log(`[ForecastContent] handleProductChange: Data set for '${chartTitle}' (${aggregatedGroupData.length} points). Generating chart image.`);
        const chartImageUrl = await generateChartImage(aggregatedGroupData, chartTitle); // Use local variable
        setImageUrl(chartImageUrl);
      } else {
        console.log(`[ForecastContent] handleProductChange: Fetching data for product: '${productCode}'.`);
        dataToChart = dataService.getProductData(productCode);
        const productDetails = products.find(p => p.code === productCode);
        chartTitle = productDetails ? `${productDetails.description} (${productCode})` : productCode;
        // Tuotetasolla data on jo valmiiksi tuotekohtaista, muunnetaan vain ChartDataPoint-muotoon
        const productChartDataPoints = dataToChart.map(row => ({
          date: row.Year_Month,
          value: row.Quantity,
          new_forecast: row.new_forecast,
          old_forecast: row.old_forecast,
          new_forecast_manually_adjusted: row.new_forecast_manually_adjusted,
          old_forecast_error: typeof row.old_forecast_error === 'string' ? parseFloat(row.old_forecast_error) : row.old_forecast_error,
          explanation: row.explanation
        })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        setChartData(productChartDataPoints);
        setRawData(dataToChart); // Set rawData for the product
        console.log(`[ForecastContent] handleProductChange: Data set for '${chartTitle}' (${productChartDataPoints.length} points). Generating chart image.`);
        const chartImageUrl = await generateChartImage(productChartDataPoints, chartTitle); // Use local variable
        setImageUrl(chartImageUrl);
      }
      console.log(`[ForecastContent] handleProductChange: Chart image for '${chartTitle}' generated and set.`);
    } catch (err) {
      console.error(`[ForecastContent] handleProductChange: Error processing product change for '${productCode}':`, err);
      toast.error('Failed to update data for selected product. Please try again.');
      setImageUrl(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCorrectionsApplied = async () => {
    console.log('[ForecastContent] handleCorrectionsApplied: Corrections have been applied. Refreshing data and chart...');
    setIsLoading(true);
    try {
      const dataService = DataService.getInstance();
      dataService.clearCache(); 
      await dataService.loadForecastData();
      console.log('[ForecastContent] handleCorrectionsApplied: Data reloaded from DataService.');

      let currentData;
      let chartTitleToRefresh = "Data";
      let processedChartData: ChartDataPoint[];
      
      if (selectedProduct) {
        console.log(`[ForecastContent] handleCorrectionsApplied: Refreshing product view for '${selectedProduct}'.`);
        currentData = dataService.getProductData(selectedProduct);
        const productDetails = products.find(p => p.code === selectedProduct);
        chartTitleToRefresh = productDetails ? `${productDetails.description} (${selectedProduct})` : selectedProduct;
        processedChartData = currentData.map(row => ({
            date: row.Year_Month,
            value: row.Quantity,
            new_forecast: row.new_forecast,
            old_forecast: row.old_forecast,
            new_forecast_manually_adjusted: row.new_forecast_manually_adjusted,
            old_forecast_error: typeof row.old_forecast_error === 'string' ? parseFloat(row.old_forecast_error) : row.old_forecast_error,
            explanation: row.explanation
        })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      } else if (selectedGroup) {
        console.log(`[ForecastContent] handleCorrectionsApplied: Refreshing group view for '${selectedGroup}' within class '${selectedClass}'.`);
        currentData = dataService.getProductGroupData(selectedGroup, selectedClass);
        chartTitleToRefresh = selectedGroup;
        // Note: aggregateData for group level doesn't strictly need expectedProductGroups, 
        // as its own logic for adjusted forecast relies on unique groups within its data.
        processedChartData = aggregateData(currentData, selectedGroup);
      } else if (selectedClass) {
        console.log(`[ForecastContent] handleCorrectionsApplied: Refreshing class view for '${selectedClass}'.`);
        currentData = dataService.getDataByClass(selectedClass);
        chartTitleToRefresh = selectedClass;
        const expectedGroupsForClass = dataService.getProductGroupsInClass(selectedClass).map(String);
        console.log(`[ForecastContent] handleCorrectionsApplied: For class '${selectedClass}', expecting ${expectedGroupsForClass.length} groups for adjusted forecast aggregation: ${expectedGroupsForClass.join(', ')}`);
        processedChartData = aggregateData(currentData, selectedClass, expectedGroupsForClass);
      } else {
        console.log('[ForecastContent] handleCorrectionsApplied: Refreshing view for all classes.');
        currentData = dataService.getAllData();
        chartTitleToRefresh = 'Kaikki tuoteluokat';
        processedChartData = aggregateData(currentData, 'All Classes'); // No expected groups for "All classes"
      }
      setChartData(processedChartData);
      setRawData(currentData); 
      console.log(`[ForecastContent] handleCorrectionsApplied: New chart data set for '${chartTitleToRefresh}' (${processedChartData.length} points). Generating chart image.`);
      const chartImageUrl = await generateChartImage(processedChartData, chartTitleToRefresh);
      setImageUrl(chartImageUrl);
      console.log(`[ForecastContent] handleCorrectionsApplied: Chart for '${chartTitleToRefresh}' refreshed after corrections.`);
      toast.success("Forecast data and chart refreshed after applying corrections.");

      if (activeTab === 'error') {
        await generateErrorImage(currentData, chartTitleToRefresh);
      }

    } catch (err) {
      console.error('[ForecastContent] handleCorrectionsApplied: Error refreshing data/chart after corrections:', err);
      toast.error("Failed to refresh data after corrections. Please try again or reload the page.");
    } finally {
      setIsLoading(false);
    }
  };

  const calculateErrorOverviewData = (data: any[]): ErrorOverviewRow[] => {
    if (!data || data.length === 0) return [];
    
    console.log(`[calculateErrorOverviewData] Processing ${data.length} rows for top 10 product classes`);
    
    // Näytetään aina top 10 tuoteluokkaa
    const classMap = new Map<string, {
      prod_class: string;
      errors: number[];
      percentErrors: number[];
    }>();

    data.forEach(row => {
      const quantity = row.Quantity;
      const oldForecast = row.old_forecast;
      
      if (quantity !== null && quantity !== undefined && 
          oldForecast !== null && oldForecast !== undefined && 
          quantity !== 0) {
        
        const classKey = row.prod_class;
        
        if (!classMap.has(classKey)) {
          classMap.set(classKey, {
            prod_class: row.prod_class,
            errors: [],
            percentErrors: []
          });
        }
        
        const classData = classMap.get(classKey)!;
        const absError = Math.abs(quantity - oldForecast);
        const absPercentError = Math.abs((quantity - oldForecast) / quantity) * 100;
        
        classData.errors.push(absError);
        classData.percentErrors.push(absPercentError);
      }
    });

    const result: ErrorOverviewRow[] = [];
    classMap.forEach((classData) => {
      if (classData.errors.length > 0) {
        const avgAbsError = classData.errors.reduce((sum, err) => sum + err, 0) / classData.errors.length;
        const avgAbsPercentError = classData.percentErrors.reduce((sum, err) => sum + err, 0) / classData.percentErrors.length;
        
        result.push({
          prod_class: classData.prod_class,
          avgAbsError,
          avgAbsPercentError,
          level: 'class'
        });
      }
    });

    const sortedResult = result.sort((a, b) => b.avgAbsError - a.avgAbsError).slice(0, 10);
    console.log(`[calculateErrorOverviewData] Found ${classMap.size} unique classes, returning top ${sortedResult.length}`);
    
    return sortedResult;
  };

  const handleSort = (field: keyof ErrorOverviewRow) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getSortedErrorData = (data: ErrorOverviewRow[]): ErrorOverviewRow[] => {
    if (!data || data.length === 0) return [];
    
    return [...data].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.localeCompare(bValue);
        return sortDirection === 'asc' ? comparison : -comparison;
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        const comparison = aValue - bValue;
        return sortDirection === 'asc' ? comparison : -comparison;
      }
      return 0;
    });
  };

  const updateErrorOverviewData = () => {
    console.log(`[updateErrorOverviewData] Using rawData length: ${rawData.length}`);
    if (rawData.length === 0) {
      console.log('[updateErrorOverviewData] No data available yet, skipping update');
      return;
    }
    const errorData = calculateErrorOverviewData(rawData);
    setErrorOverviewData(errorData);
  };

  const calculateForecastErrorData = (data: any[]): { date: string, meanAbsError: number | null, percentBelow20: number | null }[] => {
    if (!data || data.length === 0) return [];
    console.log(`[ForecastContent] calculateForecastErrorData: Calculating errors for ${data.length} data points.`);
    const errorsByMonth: { [key: string]: { sumAbsError: number, count: number, below20Count: number } } = {};
    data.forEach(row => {
        const quantity = row.Quantity;
        const oldForecast = row.old_forecast;
        if (quantity !== null && quantity !== undefined && oldForecast !== null && oldForecast !== undefined) {
            const absError = Math.abs(quantity - oldForecast);
            const month = row.Year_Month;
            if (!errorsByMonth[month]) {
                errorsByMonth[month] = { sumAbsError: 0, count: 0, below20Count: 0 };
            }
            errorsByMonth[month].sumAbsError += absError;
            errorsByMonth[month].count++;
            if (quantity !== 0 && Math.abs((quantity - oldForecast) / quantity) * 100 < 20) {
                errorsByMonth[month].below20Count++;
            }
        }
    });
    const result = Object.keys(errorsByMonth).map(month => {
        const { sumAbsError, count, below20Count } = errorsByMonth[month];
        const meanAbsError = count > 0 ? sumAbsError / count : null;
        const percentBelow20 = count > 0 ? (below20Count / count) * 100 : null;
        return { date: month, meanAbsError, percentBelow20 };
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    console.log(`[ForecastContent] calculateForecastErrorData: Calculated ${result.length} monthly error data points.`);
    return result;
  };

  const generateErrorImage = async (currentDataToUse?: any[], title?: string) => {
    const dataForErrorChart = currentDataToUse && currentDataToUse.length > 0 ? currentDataToUse : rawData;
    const chartTitleForError = title || (selectedProduct || selectedGroup || selectedClass || "Kokonaisennuste");
    if (!dataForErrorChart || dataForErrorChart.length === 0) {
        console.warn('[ForecastContent] generateErrorImage: No data available to generate error chart.');
        setErrorImageUrl(null);
        return;
    }
    console.log(`[ForecastContent] generateErrorImage: Generating error chart for '${chartTitleForError}' with ${dataForErrorChart.length} data points.`);
    setIsLoading(true);
    try {
        const errorDataPoints = calculateForecastErrorData(dataForErrorChart);
        if (errorDataPoints.length === 0) {
            console.warn(`[ForecastContent] generateErrorImage: No error data points calculated for '${chartTitleForError}'. Cannot generate error chart.`);
            setErrorImageUrl(null);
            toast.info("Not enough data to generate forecast error chart for the current selection.");
            return;
        }
        const imgUrl = await generateErrorChartImage(errorDataPoints, `Ennustevirheet: ${chartTitleForError}`);
        setErrorImageUrl(imgUrl);
        console.log(`[ForecastContent] generateErrorImage: Error chart image generated and set for '${chartTitleForError}'. URL length: ${imgUrl?.length || 0}`);
    } catch (err) {
        console.error(`[ForecastContent] generateErrorImage: Error generating error chart for '${chartTitleForError}':`, err);
        toast.error("Failed to generate forecast error chart.");
        setErrorImageUrl(null);
    } finally {
        setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'error') {
        let currentLevelDataForErrorTab;
        let titleSuffixForErrorTab;
        if (selectedProduct) {
            currentLevelDataForErrorTab = rawData.filter(d => d['Product code'] === selectedProduct);
            const pDetail = products.find(p=>p.code === selectedProduct);
            titleSuffixForErrorTab = pDetail ? `${pDetail.description} (${selectedProduct})` : selectedProduct;
        } else if (selectedGroup) {
            currentLevelDataForErrorTab = rawData.filter(d => d['Product Group'] === selectedGroup);
            titleSuffixForErrorTab = selectedGroup;
        } else if (selectedClass) {
            currentLevelDataForErrorTab = rawData.filter(d => d.prod_class === selectedClass);
            titleSuffixForErrorTab = selectedClass;
        } else {
            currentLevelDataForErrorTab = rawData;
            titleSuffixForErrorTab = "Kaikki tuoteluokat";
        }
        console.log(`[ForecastContent] useEffect (activeTab='error' or selection change): Triggering error image generation for '${titleSuffixForErrorTab}'.`);
        generateErrorImage(currentLevelDataForErrorTab, titleSuffixForErrorTab);
    } else {
        setErrorImageUrl(null); 
    }
  }, [activeTab, selectedClass, selectedGroup, selectedProduct, rawData]);


  // Renamed from applyCorrectionFromChat
  async function applyBatchCorrectionsFromChat(corrections: DataService.ForecastCorrection[]) { 
    console.log(`[ForecastContent] applyBatchCorrectionsFromChat: Received ${corrections?.length || 0} corrections.`);
    
    if (!corrections || corrections.length === 0) {
      toast.info("No valid corrections to apply.");
      return;
    }

    setIsLoading(true);
    let appliedCount = 0;
    let skippedCount = 0;
    const successfullyAppliedCorrectionsForDataService: DataService.ForecastCorrection[] = [];
    const dataService = DataService.getInstance();

    try {
      for (const correction of corrections) {
        // Light validation for individual correction object
        // Main validation is assumed to be done by GeminiChat.tsx before calling this.
        if (!correction.product_code || !correction.month || typeof correction.correction_percent !== 'number' || !correction.explanation || !correction.prod_class || !correction.product_group) {
          console.warn("[ForecastContent] applyBatchCorrectionsFromChat: Skipping invalid or incomplete correction object:", correction);
          skippedCount++;
          continue;
        }
         // Year-Month validation
        const monthPattern = /^\d{4}-\d{2}$/;
        if (!monthPattern.test(correction.month)) {
            toast.error(`Korjauspyyntö tuotteelle ${correction.product_code} ohitettu: Virheellinen kuukausimuoto (${correction.month}). Käytä YYYY-MM.`);
            console.warn(`[ForecastContent] applyBatchCorrectionsFromChat: Invalid month format for product ${correction.product_code}:`, correction.month);
            skippedCount++;
            continue;
        }


        const productData = await dataService.getProductData(correction.product_code);
        const monthData = productData.find(row => row.Year_Month === correction.month);
        const currentForecast = monthData ? (monthData.new_forecast_manually_adjusted ?? monthData.new_forecast) : null;

        if (currentForecast === null || currentForecast === 0) {
          console.log(`[ForecastContent] applyBatchCorrectionsFromChat: Skipping correction for ${correction.product_code} in ${correction.month}: current forecast is zero or null.`);
          skippedCount++;
          continue;
        }

        // The 'correction' object should already match the ForecastCorrection interface.
        // It includes product_code, month, correction_percent, explanation, prod_class, product_group.
        // DataService.applyCorrections will add 'correction_timestamp' and 'forecast_corrector' if needed.
        successfullyAppliedCorrectionsForDataService.push(correction);
        // appliedCount is incremented after successful DataService call, or here if we want to count attempts.
        // Let's count successful preparations here for now.
      }

      if (successfullyAppliedCorrectionsForDataService.length > 0) {
        // At this point, successfullyAppliedCorrectionsForDataService contains corrections that passed the zero-forecast check.
        appliedCount = successfullyAppliedCorrectionsForDataService.length; 
        await dataService.applyCorrections(successfullyAppliedCorrectionsForDataService);
        toast.success(`${appliedCount} forecast correction(s) sent to be applied.` + 
                      (skippedCount > 0 ? ` ${skippedCount} correction(s) were skipped (invalid data or zero forecast).` : ""));
        await handleCorrectionsApplied(); // This reloads data and chart
      } else if (skippedCount > 0) {
        toast.info(`All ${skippedCount} potential corrections were skipped (due to invalid data or zero forecast). No changes applied.`);
      } else { 
        toast.info("No corrections were ultimately applied or sent.");
      }

    } catch (error) {
      console.error("[ForecastContent] applyBatchCorrectionsFromChat: Error applying batch corrections:", error);
      toast.error("Failed to apply some or all corrections. Please check console for details.");
    } finally {
      setIsLoading(false);
    }
  }

  async function prepareProductListForGeminiPrompt(): Promise<{ productCode: string; productGroupCode: string; productClassCode: string; }[] | null> {
    const dataService = DataService.getInstance();
    console.log(`[ForecastContent] prepareProductListForGeminiPrompt: Called with chartLevel: ${chartLevel}, selectedClass: ${selectedClass}, selectedGroup: ${selectedGroup}, selectedProduct: ${selectedProduct}`);

    if (chartLevel === 'class') {
      if (!selectedClass) {
        console.error("[ForecastContent] prepareProductListForGeminiPrompt: 'class' level selected, but selectedClass is missing.");
        toast.error("Tuoteluokkaa ei ole valittu kontekstin muodostamiseksi.");
        return null;
      }
      try {
        const classData = dataService.getDataByClass(selectedClass); // This is TimeSeriesData[]
        const productMap = new Map<string, { productCode: string; productGroupCode: string; productClassCode: string; }>();
        classData.forEach(row => {
          if (row.prodcode && !productMap.has(row.prodcode)) {
            productMap.set(row.prodcode, {
              productCode: row.prodcode,
              productGroupCode: row.prodgroup,
              productClassCode: selectedClass 
            });
          }
        });
        const productList = Array.from(productMap.values());
        console.log(`[ForecastContent] prepareProductListForGeminiPrompt: Prepared ${productList.length} products for class ${selectedClass}.`);
        return productList.length > 0 ? productList : null;
      } catch (error) {
        console.error(`[ForecastContent] prepareProductListForGeminiPrompt: Error fetching/processing data for class ${selectedClass}:`, error);
        toast.error(`Virhe haettaessa tuotteita luokalle ${selectedClass}.`);
        return null;
      }

    } else if (chartLevel === 'group') {
      if (!selectedGroup || !selectedClass) {
        console.error("[ForecastContent] prepareProductListForGeminiPrompt: 'group' level selected, but selectedGroup or selectedClass is missing.");
        toast.error("Tuoteryhmää tai tuoteluokkaa ei ole valittu kontekstin muodostamiseksi.");
        return null;
      }
      try {
        // getProductsInGroup returns { code: string; description: string }[]
        const groupProducts = dataService.getProductsInGroup(selectedGroup, selectedClass); 
        const productList = groupProducts.map(p => ({
          productCode: p.code,
          productGroupCode: selectedGroup,
          productClassCode: selectedClass
        }));
        console.log(`[ForecastContent] prepareProductListForGeminiPrompt: Prepared ${productList.length} products for group ${selectedGroup} in class ${selectedClass}.`);
        return productList.length > 0 ? productList : null;
      } catch (error) {
        console.error(`[ForecastContent] prepareProductListForGeminiPrompt: Error fetching/processing data for group ${selectedGroup}:`, error);
        toast.error(`Virhe haettaessa tuotteita ryhmälle ${selectedGroup}.`);
        return null;
      }

    } else if (chartLevel === 'product') {
      if (!selectedProduct || !selectedGroup || !selectedClass) {
        console.error("[ForecastContent] prepareProductListForGeminiPrompt: 'product' level selected, but selectedProduct, selectedGroup, or selectedClass is missing.");
        toast.error("Tuotetta, tuoteryhmää tai tuoteluokkaa ei ole valittu kontekstin muodostamiseksi.");
        return null;
      }
      // Assuming selectedProduct (code), selectedGroup (code), and selectedClass (code) from state are authoritative.
      const productList = [{
        productCode: selectedProduct,
        productGroupCode: selectedGroup,
        productClassCode: selectedClass
      }];
      console.log(`[ForecastContent] prepareProductListForGeminiPrompt: Prepared 1 product: ${selectedProduct}.`);
      return productList;

    } else {
      console.error(`[ForecastContent] prepareProductListForGeminiPrompt: Unknown or unsupported chartLevel: ${chartLevel}`);
      toast.error("Tuntematon valintataso kontekstin muodostamiseksi.");
      return null;
    }
  }

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
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'history' | 'error' | 'overview')} className="w-full">
        <TabsList>
          <TabsTrigger value="history">Kysynnän historia ja ennuste</TabsTrigger>
          <TabsTrigger value="error">Ennustevirhe</TabsTrigger>
          <TabsTrigger value="overview">Virhe yleisnäkymä</TabsTrigger>
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
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-64">
                  <Loader2 className="h-10 w-10 animate-spin text-gray-400 mb-2" />
                  <span className="text-gray-500">Ladataan dataa, odota hetki...</span>
                </div>
              ) : (
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
                        ? (() => {
                            const productStrings = products.map(p => `${p.code} ${p.description}`);
                            if (productStrings.length === 0) {
                              return 'Tuoteryhmätaso';
                            }
                            const productListStr = generateTruncatedListString(productStrings, "tuote", "tuotetta", 3);
                            return `Tuoteryhmätaso - Sisältää: ${productListStr}`;
                          })()
                        : selectedClass
                          ? (() => {
                              const groupCodes = currentClassProductGroupDetails.map(g => g.code);
                              if (groupCodes.length === 0) {
                                return 'Tuoteluokkataso';
                              }
                              const groupListStr = generateTruncatedListString(groupCodes, "tuoteryhmä", "tuoteryhmää", 3);
                              return `Tuoteluokkataso - Sisältää: ${groupListStr}`;
                            })()
                          : 'Kaikki tuoteluokat'
                  }
                />
              )}
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
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-64">
                  <Loader2 className="h-10 w-10 animate-spin text-gray-400 mb-2" />
                  <span className="text-gray-500">Ladataan dataa, odota hetki...</span>
                </div>
              ) : (
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
                        ? (() => {
                            const productStrings = products.map(p => `${p.code} ${p.description}`);
                            if (productStrings.length === 0) {
                              return 'Tuoteryhmätaso';
                            }
                            const productListStr = generateTruncatedListString(productStrings, "tuote", "tuotetta", 3);
                            return `Tuoteryhmätaso - Sisältää: ${productListStr}`;
                          })()
                        : selectedClass
                          ? (() => {
                              const groupCodes = currentClassProductGroupDetails.map(g => g.code);
                              if (groupCodes.length === 0) {
                                return 'Tuoteluokkataso';
                              }
                              const groupListStr = generateTruncatedListString(groupCodes, "tuoteryhmä", "tuoteryhmää", 3);
                              return `Tuoteluokkataso - Sisältää: ${groupListStr}`;
                            })()
                          : 'Kaikki tuoteluokat'
                  }
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <BarChart className="h-5 w-5 text-[#f59e0b] mr-2" />
                  Virhe yleisnäkymä
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => rawData.length > 0 && updateErrorOverviewData()}
                  disabled={rawData.length === 0}
                >
                  Päivitä data
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-64">
                  <Loader2 className="h-10 w-10 animate-spin text-gray-400 mb-2" />
                  <span className="text-gray-500">Ladataan dataa, odota hetki...</span>
                </div>
              ) : errorOverviewData.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-lg font-medium text-gray-700 mb-2">
                    Top 10 virheanalyysi
                  </div>
                  <div className="text-sm text-gray-500 mb-4">
                    Näyttää top 10 tuoteluokkaa suurimpien keskimääräisten absoluuttisten virheiden mukaan.
                  </div>
                  <div className="mt-6">
                    <div className="text-xs text-gray-400">
                      Klikkaa "Päivitä data" -nappia nähdäksesi tulokset
                    </div>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[200px]">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleSort('prod_class')}
                            className="h-auto p-0 font-medium hover:bg-transparent"
                          >
                            Tuoteluokka
                            {sortField === 'prod_class' && (
                              sortDirection === 'asc' ? <ArrowUp className="ml-1 h-4 w-4" /> : <ArrowDown className="ml-1 h-4 w-4" />
                            )}
                            {sortField !== 'prod_class' && <ArrowUpDown className="ml-1 h-4 w-4 text-gray-400" />}
                          </Button>
                        </TableHead>
                        <TableHead className="w-[120px] text-right">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleSort('avgAbsPercentError')}
                            className="h-auto p-0 font-medium hover:bg-transparent"
                          >
                            Keskim. ABS % virhe
                            {sortField === 'avgAbsPercentError' && (
                              sortDirection === 'asc' ? <ArrowUp className="ml-1 h-4 w-4" /> : <ArrowDown className="ml-1 h-4 w-4" />
                            )}
                            {sortField !== 'avgAbsPercentError' && <ArrowUpDown className="ml-1 h-4 w-4 text-gray-400" />}
                          </Button>
                        </TableHead>
                        <TableHead className="w-[120px] text-right">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleSort('avgAbsError')}
                            className="h-auto p-0 font-medium hover:bg-transparent"
                          >
                            Keskim. ABS virhe
                            {sortField === 'avgAbsError' && (
                              sortDirection === 'asc' ? <ArrowUp className="ml-1 h-4 w-4" /> : <ArrowDown className="ml-1 h-4 w-4" />
                            )}
                            {sortField !== 'avgAbsError' && <ArrowUpDown className="ml-1 h-4 w-4 text-gray-400" />}
                          </Button>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getSortedErrorData(errorOverviewData).map((row, index) => (
                        <TableRow key={`${row.prod_class || 'all'}-${index}`}>
                          <TableCell className="font-medium">{row.prod_class}</TableCell>
                          <TableCell className="text-right">
                            {row.avgAbsPercentError.toFixed(1)}%
                          </TableCell>
                          <TableCell className="text-right">
                            {row.avgAbsError.toFixed(0)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {errorOverviewData.length === 10 && (
                    <div className="mt-4 text-center text-sm text-gray-500">
                      Näytetään top 10 tulosta suurimman keskimääräisen virheen mukaan
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Väli ja harmaa yläreunus chatin ja graafin väliin - piilotetaan overview-välilehdellä */}
      {activeTab !== 'overview' && <div className="my-20 border-t border-gray-200" />}

      {/* Chat wrapper - piilotetaan overview-välilehdellä */}
      {activeTab !== 'overview' && (
        <div className="bg-white shadow rounded-lg p-4 mt-0">
        <GeminiChat 
          imageUrl={imageUrl}
          errorImageUrl={errorImageUrl}
          chartLevel={chartLevel}
          onCorrectionsApplied={handleCorrectionsApplied}
          applyBatchCorrectionsFromChat={applyBatchCorrectionsFromChat} // Updated prop name
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
      )}
    </div>
  );
};

export default ForecastContent; 