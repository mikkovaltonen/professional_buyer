import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import ProfessionalBuyerChat from "@/components/ProfessionalBuyerChat";
import PurchaseRequisitionList from "@/components/PurchaseRequisitionList";
import PurchaseRequisitionDetail from "@/components/PurchaseRequisitionDetail";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const Workbench = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [verificationVisible, setVerificationVisible] = React.useState(true);
  const [generationVisible, setGenerationVisible] = React.useState(true);
  const [openId, setOpenId] = React.useState<string | null>(null);
  const [refreshToken, setRefreshToken] = React.useState<number>(0);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <ProfessionalBuyerChat
        onLogout={handleLogout}
        leftPanelVisible={verificationVisible}
        generationVisible={generationVisible}
        leftPanel={
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Purchase Requisition Verification</CardTitle>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setRefreshToken((t) => t + 1)}>Refresh</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <PurchaseRequisitionList
                onOpen={(id) => setOpenId(id)}
                selectedId={openId}
                refreshToken={refreshToken}
                onDeleted={(id) => {
                  if (openId === id) setOpenId(null);
                }}
              />
              {openId && (
                <div className="border rounded-md">
                  <PurchaseRequisitionDetail id={openId} />
                </div>
              )}
            </CardContent>
          </Card>
        }
        leftToggleControl={
          <div className="flex items-center gap-2">
            <Label htmlFor="verify-toggle" className="text-xs text-gray-500">Show verification</Label>
            <Switch id="verify-toggle" checked={verificationVisible} onCheckedChange={setVerificationVisible} />
          </div>
        }
        topRightControls={
          <div className="flex items-center gap-2">
            <Label htmlFor="generation-toggle" className="text-xs text-gray-500">Show generation</Label>
            <Switch id="generation-toggle" checked={generationVisible} onCheckedChange={setGenerationVisible} />
          </div>
        }
      />
    </div>
  );
};

export default Workbench;