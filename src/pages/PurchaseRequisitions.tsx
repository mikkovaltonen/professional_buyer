import React from 'react';
import PurchaseRequisitionForm from '@/components/PurchaseRequisitionForm';
import PurchaseRequisitionList from '@/components/PurchaseRequisitionList';
import PurchaseRequisitionDetail from '@/components/PurchaseRequisitionDetail';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

const PurchaseRequisitionsPage: React.FC = () => {
  const [openId, setOpenId] = React.useState<string | null>(null);
  const [verificationVisible, setVerificationVisible] = React.useState(true);
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-end gap-2">
        <Label htmlFor="toggle-verify">Show verification</Label>
        <Switch id="toggle-verify" checked={verificationVisible} onCheckedChange={setVerificationVisible} />
      </div>
      <Tabs defaultValue="generation">
        <TabsList>
          <TabsTrigger value="generation">Generation</TabsTrigger>
          {verificationVisible && <TabsTrigger value="verification">Verification</TabsTrigger>}
        </TabsList>
        <TabsContent value="generation" className="space-y-6">
          <PurchaseRequisitionForm onCreated={(id) => setOpenId(id)} />
        </TabsContent>
        {verificationVisible && (
          <TabsContent value="verification" className="space-y-6">
            <PurchaseRequisitionList onOpen={(id) => setOpenId(id)} />
            {openId && (
              <div>
                <PurchaseRequisitionDetail id={openId} />
              </div>
            )}
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default PurchaseRequisitionsPage;


