import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { listPurchaseRequisitions, setPurchaseRequisitionStatus, deletePurchaseRequisition } from '@/lib/firestoreService';
import { PurchaseRequisition } from '@/types/purchaseRequisition';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface Props {
  onOpen?: (id: string) => void;
}

const PurchaseRequisitionList: React.FC<Props> = ({ onOpen }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['purchaseRequisitions', user?.uid],
    queryFn: async () => user ? await listPurchaseRequisitions(user.uid) : [],
    enabled: !!user
  });

  const updateStatus = async (id: string, status: PurchaseRequisition['status']) => {
    try {
      await setPurchaseRequisitionStatus(id, status);
      toast.success('Status updated');
      queryClient.invalidateQueries({ queryKey: ['purchaseRequisitions', user?.uid] });
    } catch (e) {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deletePurchaseRequisition(id);
      toast.success('Requisition deleted');
      queryClient.invalidateQueries({ queryKey: ['purchaseRequisitions', user?.uid] });
    } catch (e) {
      toast.error('Failed to delete');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Purchase Requisitions</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div>Loading...</div>
        ) : (
          <div className="space-y-3">
            {data && data.length > 0 ? data.map(pr => (
              <div key={pr.id} className="border rounded-md p-3 flex items-center justify-between hover:bg-gray-50 cursor-pointer" onClick={() => onOpen?.(pr.id!)}>
                <div className="space-y-1">
                  <div className="font-medium">{pr.header.templateBatchName} • {pr.header.locationCode}</div>
                  <div className="text-sm text-gray-500">{pr.header.startDate} → {pr.header.endDate} • {pr.status}</div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={(e) => { e.stopPropagation(); handleDelete(pr.id!); }}>Delete</Button>
                  <Button onClick={(e) => { e.stopPropagation(); updateStatus(pr.id!, 'approved'); }}>Send to ERP</Button>
                </div>
              </div>
            )) : (
              <div className="text-sm text-gray-500">No requisitions yet</div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PurchaseRequisitionList;


