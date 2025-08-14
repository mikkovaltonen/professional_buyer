import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { PurchaseRequisition, PurchaseRequisitionHeader, PurchaseRequisitionLine } from '@/types/purchaseRequisition';
import { createPurchaseRequisition } from '@/lib/firestoreService';
import { toast } from 'sonner';

interface Props {
  onCreated?: (id: string) => void;
}

const emptyHeader: PurchaseRequisitionHeader = {
  templateBatchName: '',
  locationCode: '',
  startDate: '',
  endDate: '',
  responsibilityCenterOrBuyer: '',
  notes: ''
};

const emptyLine: PurchaseRequisitionLine = {
  itemNoOrDescription: '',
  quantity: 0,
  unitOfMeasure: '',
  requestedDate: '',
  vendorNoOrName: '',
  directUnitCost: undefined,
  currency: 'EUR'
};

const PurchaseRequisitionForm: React.FC<Props> = ({ onCreated }) => {
  const { user } = useAuth();
  const [header, setHeader] = useState<PurchaseRequisitionHeader>({ ...emptyHeader });
  const [lines, setLines] = useState<PurchaseRequisitionLine[]>([{ ...emptyLine }]);
  const [submitting, setSubmitting] = useState(false);

  const addLine = () => setLines(prev => [...prev, { ...emptyLine }]);
  const removeLine = (index: number) => setLines(prev => prev.filter((_, i) => i !== index));

  const updateLine = (index: number, patch: Partial<PurchaseRequisitionLine>) => {
    setLines(prev => prev.map((l, i) => i === index ? { ...l, ...patch } : l));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please login');
      return;
    }
    if (!header.templateBatchName || !header.locationCode || !header.startDate || !header.endDate || !header.responsibilityCenterOrBuyer) {
      toast.error('Fill all header fields');
      return;
    }
    if (lines.length === 0 || lines.some(l => !l.itemNoOrDescription || !l.quantity || !l.unitOfMeasure || !l.requestedDate)) {
      toast.error('Fill all required line fields');
      return;
    }
    try {
      setSubmitting(true);
      const pr: Omit<PurchaseRequisition, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
        status: 'draft',
        header,
        lines
      } as any;
      const id = await createPurchaseRequisition(user.uid, pr);
      toast.success('Purchase requisition created');
      setHeader({ ...emptyHeader });
      setLines([{ ...emptyLine }]);
      onCreated?.(id);
    } catch (err) {
      toast.error('Failed to create requisition');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Purchase Requisition</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Template batch name</Label>
              <Input value={header.templateBatchName} onChange={e => setHeader({ ...header, templateBatchName: e.target.value })} placeholder="PURCH_2025W33" />
            </div>
            <div>
              <Label>Warehouse / location</Label>
              <Input value={header.locationCode} onChange={e => setHeader({ ...header, locationCode: e.target.value })} placeholder="HELSINKI" />
            </div>
            <div>
              <Label>Date range - Start</Label>
              <Input type="date" value={header.startDate} onChange={e => setHeader({ ...header, startDate: e.target.value })} />
            </div>
            <div>
              <Label>Date range - End</Label>
              <Input type="date" value={header.endDate} onChange={e => setHeader({ ...header, endDate: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <Label>Responsible person / buyer</Label>
              <Input value={header.responsibilityCenterOrBuyer} onChange={e => setHeader({ ...header, responsibilityCenterOrBuyer: e.target.value })} placeholder="Buyer name" />
            </div>
            <div className="md:col-span-2">
              <Label>Justification / note</Label>
              <Textarea value={header.notes} onChange={e => setHeader({ ...header, notes: e.target.value })} placeholder="Autumn replenishment" />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Lines</h3>
              <Button type="button" variant="outline" onClick={addLine}>Add line</Button>
            </div>
            {lines.map((line, idx) => (
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
                <div className="flex items-end">
                  <Button type="button" variant="ghost" onClick={() => removeLine(idx)}>Remove</Button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={submitting}>{submitting ? 'Creating...' : 'Create requisition'}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default PurchaseRequisitionForm;


