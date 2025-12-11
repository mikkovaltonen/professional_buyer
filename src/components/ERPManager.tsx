import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Database, Construction } from 'lucide-react';

export const ERPManager: React.FC = () => {
  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="w-5 h-5" />
          ERP Integration
        </CardTitle>
        <CardDescription>
          Connect your ERP system for real-time data access
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12">
          <Construction className="w-16 h-16 mx-auto mb-4 text-amber-500" />
          <h3 className="text-xl font-semibold mb-2">ERP Integration Coming Soon</h3>
          <p className="text-gray-600 max-w-md mx-auto">
            Direct ERP integration is under development. This feature will allow real-time
            connection to your procurement and inventory systems.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
