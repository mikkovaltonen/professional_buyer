import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Upload, Check, AlertCircle, Database } from 'lucide-react';
import { samplePurchaseOrderService } from '../lib/samplePurchaseOrderService';
import { useAuth } from '../hooks/useAuth';

export const SamplePurchaseOrderLoader: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderCount, setOrderCount] = useState<number | null>(null);

  const loadSampleData = async () => {
    if (!user) {
      setError('Please log in to load sample data');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await samplePurchaseOrderService.loadSampleData(user.uid);
      
      // Get count of loaded orders
      const orders = await samplePurchaseOrderService.getUserPurchaseOrders(user.uid);
      setOrderCount(orders.length);
      setSuccess(true);
      
      setTimeout(() => {
        setSuccess(false);
      }, 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sample data');
    } finally {
      setLoading(false);
    }
  };

  const checkExistingData = async () => {
    if (!user) return;
    
    try {
      const orders = await samplePurchaseOrderService.getUserPurchaseOrders(user.uid);
      if (orders.length > 0) {
        setOrderCount(orders.length);
      }
    } catch (err) {
      console.error('Error checking existing data:', err);
    }
  };

  React.useEffect(() => {
    checkExistingData();
  }, [user]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Sample Purchase Orders
        </CardTitle>
        <CardDescription>
          Load sample purchase order data for testing and development
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {orderCount !== null && orderCount > 0 && !success && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You currently have {orderCount} purchase orders in the database.
              Loading new sample data will replace them.
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="bg-green-50 border-green-200">
            <Check className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Successfully loaded {orderCount} purchase orders to Firestore collection 'sample_purchase_orders'
            </AlertDescription>
          </Alert>
        )}

        <Button
          onClick={loadSampleData}
          disabled={loading || !user}
          className="w-full"
        >
          {loading ? (
            <>
              <Upload className="mr-2 h-4 w-4 animate-spin" />
              Loading Sample Data...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Load Sample Purchase Orders
            </>
          )}
        </Button>

        <div className="text-sm text-gray-600">
          <p className="font-medium mb-1">Sample data includes:</p>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li>100 purchase order records</li>
            <li>Multiple suppliers (Nippon Tools, TechParts GmbH, Nordic Supply AB, etc.)</li>
            <li>All product categories (BUDAPEST, TOKYO, LONDON, etc.)</li>
            <li>Various buyers and dates</li>
            <li>Each row saved as separate Firestore document</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};