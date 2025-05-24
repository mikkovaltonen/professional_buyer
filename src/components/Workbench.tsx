import React, { useEffect, useState } from 'react';
import { DataService } from '../lib/dataService';

const dataService = new DataService();

const Workbench: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [timeSeriesData, setTimeSeriesData] = useState([]);
  const [productGroups, setProductGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [filteredData, setFilteredData] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await dataService.loadForecastData();
        setTimeSeriesData(data);
        setLoading(false);
      } catch (error) {
        console.error('[Workbench] Error loading data:', error);
        setLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    if (timeSeriesData.length > 0) {
      const uniqueGroups = Array.from(new Set(timeSeriesData.map(item => item.prodgroup)));
      setProductGroups(uniqueGroups);
      if (uniqueGroups.length > 0) {
        setSelectedGroup(uniqueGroups[0]);
      }
    }
  }, [timeSeriesData]);

  useEffect(() => {
    if (selectedGroup && timeSeriesData.length > 0) {
      const filteredData = timeSeriesData.filter(item => item.prodgroup === selectedGroup);
      const uniqueProducts = Array.from(new Set(filteredData.map(item => item.prodcode)));
      setProducts(uniqueProducts);
      if (uniqueProducts.length > 0) {
        setSelectedProduct(uniqueProducts[0]);
      }
    }
  }, [selectedGroup, timeSeriesData]);

  useEffect(() => {
    if (selectedProduct && timeSeriesData.length > 0) {
      const filteredData = timeSeriesData.filter(item => 
        item.prodgroup === selectedGroup && 
        item.prodcode === selectedProduct
      );
      setFilteredData(filteredData);
    }
  }, [selectedProduct, selectedGroup, timeSeriesData]);

  return (
    <div>
      {/* Render your component content here */}
    </div>
  );
};

export default Workbench; 