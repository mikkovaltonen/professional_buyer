import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getPurchaseRequisition, updatePurchaseRequisition } from '@/lib/firestoreService';
import { PurchaseRequisition, PurchaseRequisitionLine } from '@/types/purchaseRequisition';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface Props {
  id: string;
}

const PurchaseRequisitionDetail: React.FC<Props> = ({ id }) => {
  const { data, isLoading } = useQuery<PurchaseRequisition | null>({
    queryKey: ['purchaseRequisition', id],
    queryFn: async () => await getPurchaseRequisition(id)
  });

  const [local, setLocal] = React.useState<PurchaseRequisition | null>(null);

  React.useEffect(() => {
    if (data) setLocal(data);
  }, [data]);

  const updateLine = (index: number, patch: Partial<PurchaseRequisitionLine>) => {
    if (!local) return;
    const lines = local.lines.map((l, i) => i === index ? { ...l, ...patch } : l);
    setLocal({ ...local, lines });
  };

  const save = async () => {
    if (!local?.id) return;
    try {
      await updatePurchaseRequisition(local.id, { header: local.header, lines: local.lines });
      toast.success('Saved');
    } catch (e) {
      toast.error('Save failed');
    }
  };

  if (isLoading || !local) return <div>Loading...</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Requisition {local.header.templateBatchName}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Template batch name</Label>
            <Input value={local.header.templateBatchName} onChange={e => setLocal({ ...local, header: { ...local.header, templateBatchName: e.target.value } })} />
          </div>
          <div>
            <Label>Warehouse / location</Label>
            <Input value={local.header.locationCode} onChange={e => setLocal({ ...local, header: { ...local.header, locationCode: e.target.value } })} />
          </div>
          <div>
            <Label>Date range - Start</Label>
            <Input type="date" value={local.header.startDate} onChange={e => setLocal({ ...local, header: { ...local.header, startDate: e.target.value } })} />
          </div>
          <div>
            <Label>Date range - End</Label>
            <Input type="date" value={local.header.endDate} onChange={e => setLocal({ ...local, header: { ...local.header, endDate: e.target.value } })} />
          </div>
          <div className="md:col-span-2">
            <Label>Responsible person / buyer</Label>
            <Input value={local.header.responsibilityCenterOrBuyer} onChange={e => setLocal({ ...local, header: { ...local.header, responsibilityCenterOrBuyer: e.target.value } })} />
          </div>
          <div className="md:col-span-2">
            <Label>Justification / note</Label>
            <Textarea value={local.header.notes || ''} onChange={e => setLocal({ ...local, header: { ...local.header, notes: e.target.value } })} />
          </div>
        </div>

        <div className="space-y-3">
          {local.lines.map((line, idx) => (
            <div key={idx} className="grid grid-cols-1 md:grid-cols-6 gap-3 border rounded-md p-3">
              <div className="md:col-span-2">
                <Label>Item / description</Label>
                <Input value={line.itemNoOrDescription} onChange={e => updateLine(idx, { itemNoOrDescription: e.target.value })} />
              </div>
              <div>
                <Label>Quantity</Label>
                <Input type="number" value={line.quantity} onChange={e => updateLine(idx, { quantity: Number(e.target.value) })} />
              </div>
              <div>
                <Label>Unit of measure</Label>
                <Input value={line.unitOfMeasure} onChange={e => updateLine(idx, { unitOfMeasure: e.target.value })} />
              </div>
              <div>
                <Label>Requested date</Label>
                <Input type="date" value={line.requestedDate} onChange={e => updateLine(idx, { requestedDate: e.target.value })} />
              </div>
              <div>
                <Label>Supplier suggestion</Label>
                <Input value={line.vendorNoOrName || ''} onChange={e => updateLine(idx, { vendorNoOrName: e.target.value })} />
              </div>
              <div>
                <Label>Unit price</Label>
                <Input type="number" step="0.01" value={line.directUnitCost ?? ''} onChange={e => updateLine(idx, { directUnitCost: e.target.value ? Number(e.target.value) : undefined })} />
              </div>
              <div>
                <Label>Currency</Label>
                <Input value={line.currency || 'EUR'} onChange={e => updateLine(idx, { currency: e.target.value })} />
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end">
          <Button onClick={save}>Save</Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PurchaseRequisitionDetail;


