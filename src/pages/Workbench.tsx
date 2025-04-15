import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "react-i18next";
import { auth } from "@/lib/firebase";
import { useNavigate } from "react-router-dom";
import { Shield, Scale, FileText, TrendingDown, LogOut, User, Upload, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { updateUserPreferences, getUserPreferences } from "@/lib/userService";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import RiskAssessmentForm from "@/pages/RiskAssessmentForm";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { documentService } from '@/lib/documentService';
import { InsuranceDocument } from '@/types/documents';

const Workbench = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("risk-assessment");
  const [documents, setDocuments] = useState<InsuranceDocument[]>([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);

  useEffect(() => {
    const loadUserPreferences = async () => {
      if (user?.uid) {
        try {
          const prefs = await getUserPreferences(user.uid);
          if (prefs?.language) {
            i18n.changeLanguage(prefs.language);
          }
        } catch (error) {
          console.error('Error loading preferences:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    loadUserPreferences();
  }, [user, i18n]);

  useEffect(() => {
    const loadDocuments = async () => {
      if (!user?.uid) return;
      
      try {
        setLoadingDocuments(true);
        const userDocs = await documentService.getUserDocuments(user.uid);
        setDocuments(userDocs);
      } catch (error) {
        console.error('Error loading documents:', error);
        toast.error('Failed to load documents');
      } finally {
        setLoadingDocuments(false);
      }
    };

    loadDocuments();
  }, [user]);

  const handleLanguageChange = async (language: string) => {
    if (user?.uid) {
      try {
        await updateUserPreferences(user.uid, { language });
        i18n.changeLanguage(language);
        toast.success("Language preference saved");
      } catch (error) {
        toast.error("Failed to save language preference");
      }
    }
  };

  // Protect this route
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        navigate("/");
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logged out successfully");
    } catch (error) {
      toast.error("Failed to log out");
    }
  };

  const handleFileUpload = async (file: File, type: 'current' | 'proposal') => {
    if (!user?.uid) return;

    try {
      // For now, just store document metadata
      const newDoc: Omit<InsuranceDocument, 'id'> = {
        userId: user.uid,
        fileName: file.name,
        fileUrl: '', // We'll handle file storage in the next step
        fileType: type,
        uploadedAt: new Date().toISOString(),
        fileSize: file.size,
        mimeType: file.type
      };

      await documentService.addDocument(newDoc);
      toast.success('Document uploaded successfully');
      
      // Reload documents
      const userDocs = await documentService.getUserDocuments(user.uid);
      setDocuments(userDocs);
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error('Failed to upload document');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-bold text-gray-900">Insurance Workbench</h1>
            <div className="flex items-center gap-2 ml-4 text-gray-600">
              <User className="h-5 w-5" />
              <span>{user?.email}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Select
              value={i18n.language}
              onValueChange={handleLanguageChange}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select Language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="fi">Suomi</SelectItem>
                <SelectItem value="sv">Svenska</SelectItem>
                <SelectItem value="et">Eesti</SelectItem>
                <SelectItem value="da">Dansk</SelectItem>
                <SelectItem value="no">Norsk</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              variant="outline" 
              onClick={handleLogout}
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-4 gap-4 bg-transparent h-auto p-0">
            <TabsTrigger 
              value="risk-assessment"
              className="data-[state=active]:bg-white data-[state=active]:shadow-md flex items-center gap-2 py-3"
            >
              <Shield className="h-5 w-5" />
              <span>Safety & Preferences</span>
            </TabsTrigger>
            
            <TabsTrigger 
              value="comparison"
              className="data-[state=active]:bg-white data-[state=active]:shadow-md flex items-center gap-2 py-3"
            >
              <Scale className="h-5 w-5" />
              <span>Proposal Comparison</span>
            </TabsTrigger>
            
            <TabsTrigger 
              value="documents"
              className="data-[state=active]:bg-white data-[state=active]:shadow-md flex items-center gap-2 py-3"
            >
              <FileText className="h-5 w-5" />
              <span>Document Storage</span>
            </TabsTrigger>
            
            <TabsTrigger 
              value="optimization"
              className="data-[state=active]:bg-white data-[state=active]:shadow-md flex items-center gap-2 py-3"
            >
              <TrendingDown className="h-5 w-5" />
              <span>Cost Reduction</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="risk-assessment" className="p-6 bg-white rounded-lg shadow-lg">
            <h2 className="text-2xl font-semibold mb-4">My Safety Benefit/Cost Preferences</h2>
            <RiskAssessmentForm />
          </TabsContent>

          <TabsContent value="comparison" className="p-6 bg-white rounded-lg shadow-lg">
            <h2 className="text-2xl font-semibold mb-4">Insurance Proposal Comparison</h2>
            
            <Alert className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Upload your insurance documents here to compare different proposals and find the best coverage for your needs.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Current Insurance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <label className="block">
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file, 'current');
                      }}
                    />
                    <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-blue-500 transition-colors cursor-pointer">
                      {loadingDocuments ? (
                        <Loader2 className="h-8 w-8 mx-auto mb-2 text-gray-400 animate-spin" />
                      ) : (
                        <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      )}
                      <p className="text-sm text-gray-600 mb-1">
                        Upload your current insurance policy
                      </p>
                      <p className="text-xs text-gray-500">
                        Supports PDF, JPG, PNG (max 10MB)
                      </p>
                    </div>
                  </label>

                  <div>
                    <h3 className="text-sm font-medium mb-2">Uploaded Current Contracts</h3>
                    <div className="space-y-2">
                      {documents
                        .filter(doc => doc.fileType === 'current')
                        .map((doc) => (
                          <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-2">
                              <FileText className="h-5 w-5 text-gray-500" />
                              <div>
                                <p className="font-medium">{doc.fileName}</p>
                                <p className="text-sm text-gray-500">
                                  {new Date(doc.uploadedAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={async () => {
                                try {
                                  if (doc.id) {
                                    await documentService.deleteDocument(doc.id);
                                    const updatedDocs = await documentService.getUserDocuments(user!.uid);
                                    setDocuments(updatedDocs);
                                    toast.success('Document deleted successfully');
                                  }
                                } catch (error) {
                                  console.error('Error deleting document:', error);
                                  toast.error('Failed to delete document');
                                }
                              }}
                            >
                              Delete
                            </Button>
                          </div>
                        ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Scale className="h-5 w-5" />
                    New Proposals
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <label className="block">
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file, 'proposal');
                      }}
                    />
                    <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-blue-500 transition-colors cursor-pointer">
                      {loadingDocuments ? (
                        <Loader2 className="h-8 w-8 mx-auto mb-2 text-gray-400 animate-spin" />
                      ) : (
                        <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      )}
                      <p className="text-sm text-gray-600 mb-1">
                        Upload new insurance proposals
                      </p>
                      <p className="text-xs text-gray-500">
                        Supports PDF, JPG, PNG (max 10MB)
                      </p>
                    </div>
                  </label>

                  <div>
                    <h3 className="text-sm font-medium mb-2">New Insurance Deal Proposals</h3>
                    <div className="space-y-2">
                      {documents
                        .filter(doc => doc.fileType === 'proposal')
                        .map((doc) => (
                          <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-2">
                              <FileText className="h-5 w-5 text-gray-500" />
                              <div>
                                <p className="font-medium">{doc.fileName}</p>
                                <p className="text-sm text-gray-500">
                                  {new Date(doc.uploadedAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={async () => {
                                try {
                                  if (doc.id) {
                                    await documentService.deleteDocument(doc.id);
                                    const updatedDocs = await documentService.getUserDocuments(user!.uid);
                                    setDocuments(updatedDocs);
                                    toast.success('Document deleted successfully');
                                  }
                                } catch (error) {
                                  console.error('Error deleting document:', error);
                                  toast.error('Failed to delete document');
                                }
                              }}
                            >
                              Delete
                            </Button>
                          </div>
                        ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {documents.length > 0 && (
              <div className="mt-6 flex justify-center">
                <Button 
                  className="flex items-center gap-2 px-6 py-3"
                  onClick={() => {
                    // We'll implement the comparison logic later
                    toast.info('Analyzing documents...');
                  }}
                >
                  <Scale className="h-5 w-5" />
                  Identify protections and make structured comparison of options
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="documents" className="p-6 bg-white rounded-lg shadow-lg">
            <h2 className="text-2xl font-semibold mb-4">Insurance Document Storage</h2>
            
            <Alert className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Upload your current insurance contracts and new proposals here for comparison and analysis.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Current Contracts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-blue-500 transition-colors cursor-pointer">
                    <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-600 mb-1">
                      Drop your current insurance contracts here
                    </p>
                    <p className="text-xs text-gray-500">
                      Supports PDF, JPG, PNG (max 10MB)
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    New Proposals
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-blue-500 transition-colors cursor-pointer">
                    <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-600 mb-1">
                      Drop new insurance proposals here
                    </p>
                    <p className="text-xs text-gray-500">
                      Supports PDF, JPG, PNG (max 10MB)
                    </p>
                  </div>
                </CardContent>
              </Card>

              <div className="col-span-1 md:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Uploaded Documents</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center text-gray-500 py-8">
                      No documents uploaded yet
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="optimization" className="p-6 bg-white rounded-lg shadow-lg">
            <h2 className="text-2xl font-semibold mb-4">Continuous Cost Reduction</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Add cost optimization tools */}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Workbench; 