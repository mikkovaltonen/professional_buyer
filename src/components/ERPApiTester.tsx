import React, { useState } from 'react';
import { erpApiService, SearchCriteria, SearchResult } from '../lib/erpApiService';
import { erpSampleDataService } from '../lib/erpSampleDataService';
import { useAuth } from '../hooks/useAuth';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Search, Database, Clock, FileText, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';

export const ERPApiTester: React.FC = () => {
  const [searchCriteria, setSearchCriteria] = useState<SearchCriteria>({});
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableFields, setAvailableFields] = useState<string[]>([]);
  const { user } = useAuth();

  const handleInputChange = (field: keyof SearchCriteria, value: string) => {
    setSearchCriteria(prev => ({
      ...prev,
      [field]: value || undefined
    }));
  };

  const handleSearch = async () => {
    if (!user) {
      setError('Please log in to test the API');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await erpApiService.searchRecords(searchCriteria);
      setSearchResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableFields = async () => {
    try {
      // Get headers from sample data service
      const headers = erpSampleDataService.getHeaders();
      setAvailableFields(headers);
    } catch (err) {
      console.error('Failed to load available fields:', err);
    }
  };

  const loadSampleData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Get sample data directly from the service
      const { records } = await erpSampleDataService.getSampleData();
      const sampleRecords = records.slice(0, 3); // Get first 3 records
      
      const sampleResult: SearchResult = {
        records: sampleRecords,
        totalCount: sampleRecords.length,
        searchCriteria: {},
        executedAt: new Date(),
        processingTimeMs: 0
      };
      setSearchResult(sampleResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sample data');
    } finally {
      setLoading(false);
    }
  };

  const runTestSuite = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      console.log('🧪 Starting ERP API Test Suite...');
      
      // Test 1: Get all records
      console.log('Test 1: Getting all records...');
      const allRecords = await erpApiService.searchRecords({});
      console.log(`✅ Found ${allRecords.totalCount} total records`);

      // Test 2: Search by supplier (using sample data suppliers)
      console.log('Test 2: Searching by supplier...');
      const supplierTest = await erpApiService.searchRecords({ supplierName: 'TechParts' });
      console.log(`✅ Supplier search: ${supplierTest.totalCount} records found`);

      // Test 3: Search by product (using sample data products)
      console.log('Test 3: Searching by product...');
      const productTest = await erpApiService.searchRecords({ productDescription: 'MILAN' });
      console.log(`✅ Product search: ${productTest.totalCount} records found`);

      // Test 4: Search by buyer (using sample data buyers)
      console.log('Test 4: Searching by buyer...');
      const buyerTest = await erpApiService.searchRecords({ buyerName: 'Mikael' });
      console.log(`✅ Buyer search: ${buyerTest.totalCount} records found`);

      // Test 5: Date range search
      console.log('Test 5: Searching by date range...');
      const dateTest = await erpApiService.searchRecords({ 
        dateFrom: '2025-01-01', 
        dateTo: '2025-12-31' 
      });
      console.log(`✅ Date search: ${dateTest.totalCount} records found`);

      // Test 6: Combined search
      console.log('Test 6: Combined search...');
      const combinedTest = await erpApiService.searchRecords({ 
        supplierName: 'Nippon',
        productDescription: 'hylly'
      });
      console.log(`✅ Combined search: ${combinedTest.totalCount} records found`);

      console.log('🎉 All tests completed successfully!');
      setSearchResult(allRecords);
    } catch (err) {
      console.error('❌ Test suite failed:', err);
      setError(err instanceof Error ? err.message : 'Test suite failed');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (user) {
      loadAvailableFields();
    }
  }, [user]);

  if (!user) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-gray-600">Please log in to test the ERP API</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            ERP API Tester
          </CardTitle>
          <CardDescription>
            Test the internal ERP API with different search criteria
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Filter Documentation */}
          <div className="p-4 bg-green-50 border border-green-200 rounded">
            <h4 className="font-medium text-green-800 mb-3">📋 Sample Data Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h5 className="font-medium text-green-700 mb-2">🏭 Example Suppliers</h5>
                <p className="text-green-600 text-xs">
                  Nippon Tools Co., TechParts GmbH, Nordic Supply AB, Acme Corporation
                </p>
              </div>
              
              <div>
                <h5 className="font-medium text-green-700 mb-2">🛍️ Example Products</h5>
                <p className="text-green-600 text-xs">
                  BUDAPEST-hyllystö, TOKYO-hylly, LONDON-kaappi, MILAN-tuoli, BERLIN-lipasto
                </p>
              </div>
              
              <div>
                <h5 className="font-medium text-green-700 mb-2">📅 Date Range</h5>
                <p className="text-green-600 text-xs">
                  Sample data contains dates in 2025 (mostly April 2025)
                </p>
              </div>
              
              <div>
                <h5 className="font-medium text-green-700 mb-2">👤 Example Buyers</h5>
                <p className="text-green-600 text-xs">
                  Mikael Järvinen, Erika Sundström, Sari Rautakorpi, Anna Mäkelä
                </p>
              </div>
            </div>
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
              <p className="text-blue-700 text-sm">
                <strong>💡 Note:</strong> Using shared sample data with 100 purchase order records from /sample_purchase_orders.json
              </p>
            </div>
          </div>

          {/* Available Fields Info */}
          {availableFields.length > 0 && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded">
              <h4 className="font-medium text-blue-800 mb-2">📊 Available Fields in Your Data:</h4>
              <div className="flex flex-wrap gap-2">
                {availableFields.map((field, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {field}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Search Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="supplier" className="flex items-center gap-2">
                📦 Supplier Name
                <span className="text-xs text-gray-500">(searches: "Supplier Name" column)</span>
              </Label>
              <Input
                id="supplier"
                placeholder="e.g., Nippon, TechParts, Nordic Supply"
                value={searchCriteria.supplierName || ''}
                onChange={(e) => handleInputChange('supplierName', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="product" className="flex items-center gap-2">
                🛍️ Product Description
                <span className="text-xs text-gray-500">(searches: "Description" column)</span>
              </Label>
              <Input
                id="product"
                placeholder="e.g., MILAN, BUDAPEST, hylly, tuoli"
                value={searchCriteria.productDescription || ''}
                onChange={(e) => handleInputChange('productDescription', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="buyer" className="flex items-center gap-2">
                👤 Buyer Name
                <span className="text-xs text-gray-500">(searches: "Buyer Name" column)</span>
              </Label>
              <Input
                id="buyer"
                placeholder="e.g., John, Smith, part of buyer name"
                value={searchCriteria.buyerName || ''}
                onChange={(e) => handleInputChange('buyerName', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="dateFrom">Date From (Receive By)</Label>
              <Input
                id="dateFrom"
                type="date"
                value={searchCriteria.dateFrom || ''}
                onChange={(e) => handleInputChange('dateFrom', e.target.value)}
              />
              <p className="text-xs text-gray-500">Filters by "Receive By" column</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="dateTo">Date To (Receive By)</Label>
              <Input
                id="dateTo"
                type="date"
                value={searchCriteria.dateTo || ''}
                onChange={(e) => handleInputChange('dateTo', e.target.value)}
              />
              <p className="text-xs text-gray-500">Filters by "Receive By" column</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <Button 
              onClick={handleSearch} 
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Search className="w-4 h-4 mr-2" />
              Search Records
            </Button>
            
            <Button 
              onClick={loadSampleData} 
              disabled={loading}
              variant="outline"
            >
              <FileText className="w-4 h-4 mr-2" />
              Load Sample Data
            </Button>
            
            <Button 
              onClick={runTestSuite} 
              disabled={loading}
              variant="outline"
              className="text-green-600 border-green-200 hover:bg-green-50"
            >
              🧪 Run Test Suite
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Search Results */}
      {searchResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Search Results
            </CardTitle>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>Found: <strong>{searchResult.totalCount}</strong> records</span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {searchResult.processingTimeMs}ms
              </span>
              <span>{searchResult.executedAt.toLocaleTimeString()}</span>
            </div>
          </CardHeader>
          <CardContent>
            {searchResult.records.length === 0 ? (
              <p className="text-gray-600 text-center py-4">No records found matching the search criteria</p>
            ) : (
              <div className="space-y-4">
                {searchResult.records.slice(0, 10).map((record, index) => (
                  <div key={index} className="p-4 border rounded-lg bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline">Row {record.rowIndex}</Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
                      {Object.entries(record).map(([key, value]) => {
                        if (key === 'rowIndex') return null;
                        return (
                          <div key={key} className="truncate">
                            <strong>{key}:</strong> {String(value)}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
                
                {searchResult.records.length > 10 && (
                  <p className="text-center text-gray-600 text-sm">
                    Showing first 10 of {searchResult.totalCount} results
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};