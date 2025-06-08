import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Save, History, Star, Clock } from "lucide-react";
import { toast } from "sonner";
import { 
  SystemPromptVersion, 
  savePromptVersion, 
  loadLatestPrompt, 
  getPromptHistory,
  updatePromptEvaluation,
  getPromptVersion
} from "@/lib/firestoreService";
import { useAuth } from "@/hooks/useAuth";

interface PromptVersionManagerProps {
  onPromptChange?: (prompt: string) => void;
  currentPrompt?: string;
}

const PromptVersionManager: React.FC<PromptVersionManagerProps> = ({ 
  onPromptChange, 
  currentPrompt = '' 
}) => {
  const { user } = useAuth();
  const [prompt, setPrompt] = useState(currentPrompt);
  const [evaluation, setEvaluation] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [versions, setVersions] = useState<SystemPromptVersion[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<SystemPromptVersion | null>(null);
  const [activeTab, setActiveTab] = useState<'editor' | 'history'>('editor');
  const [aiModel, setAiModel] = useState('gemini-2.5-flash-preview-04-17');

  // Load initial data
  useEffect(() => {
    if (user?.uid) {
      loadInitialData();
    }
  }, [user?.uid]);

  // Update parent when prompt changes
  useEffect(() => {
    if (onPromptChange) {
      onPromptChange(prompt);
    }
  }, [prompt, onPromptChange]);

  const loadInitialData = async () => {
    if (!user?.uid) return;

    setIsLoading(true);
    try {
      // Load latest prompt for this user
      const latestPrompt = await loadLatestPrompt(user.uid);
      if (latestPrompt) {
        setPrompt(latestPrompt);
      } else {
        // Set default prompt if no saved version exists
        const defaultPrompt = `You are a Professional Buyer AI Assistant with advanced capabilities including real-time access to ERP/purchase order data through function calling.

## Core Capabilities:
- **ERP Data Access**: Use the search_erp_data function to query purchase orders, suppliers, products, and buyer information
- **Procurement Intelligence**: Analyze supplier performance, pricing trends, and purchase patterns
- **Strategic Guidance**: Provide data-driven procurement recommendations
- **Contract Analysis**: Evaluate supplier agreements and identify optimization opportunities
- **Cost Intelligence**: Analyze spending patterns and identify savings opportunities

## When to Use ERP Data Search:
- User asks about specific suppliers, orders, or purchases
- Questions about pricing, costs, or spending patterns
- Requests for purchase history or supplier analysis
- Date-specific procurement queries
- Buyer performance or activity questions

## Response Guidelines:
- Always search ERP data when relevant to the user's question
- Provide specific data points and examples from search results
- Combine ERP data with procurement best practices
- Offer actionable insights based on actual data
- Explain your data sources and methodology

## Professional Standards:
- Use precise, data-driven language
- Provide specific recommendations with supporting evidence
- Maintain confidentiality and professional discretion
- Focus on practical, implementable solutions
- Ask clarifying questions when context is needed

Remember: You have access to real procurement data - use it to provide specific, actionable insights rather than generic advice.`;
        setPrompt(defaultPrompt);
      }

      // Load version history
      await loadVersionHistory();
    } catch (error) {
      console.error('Error loading initial data:', error);
      toast.error('Failed to load prompt data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadVersionHistory = async () => {
    if (!user?.uid) return;

    try {
      const history = await getPromptHistory(user.uid);
      setVersions(history);
    } catch (error) {
      console.error('Error loading version history:', error);
    }
  };

  const handleSaveVersion = async () => {
    if (!user?.uid) {
      toast.error('User not authenticated');
      return;
    }

    if (!prompt.trim()) {
      toast.error('Prompt cannot be empty');
      return;
    }

    setIsLoading(true);
    try {
      const versionNumber = await savePromptVersion(
        user.uid,
        prompt,
        evaluation,
        aiModel
      );
      
      toast.success(`Saved as version ${versionNumber}`);
      setEvaluation(''); // Clear evaluation after saving
      await loadVersionHistory(); // Reload history
    } catch (error) {
      console.error('Error saving prompt version:', error);
      toast.error('Failed to save prompt version');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadVersion = async (version: SystemPromptVersion) => {
    setSelectedVersion(version);
    setPrompt(version.systemPrompt);
    setEvaluation(version.evaluation);
    setAiModel(version.aiModel);
    setActiveTab('editor');
    toast.success(`Loaded version ${version.version}`);
  };

  const handleUpdateEvaluation = async () => {
    if (!selectedVersion?.id) {
      toast.error('No version selected');
      return;
    }

    setIsLoading(true);
    try {
      await updatePromptEvaluation(selectedVersion.id, evaluation);
      toast.success('Evaluation updated');
      await loadVersionHistory(); // Reload to show updated evaluation
    } catch (error) {
      console.error('Error updating evaluation:', error);
      toast.error('Failed to update evaluation');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'editor' | 'history')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="editor">Prompt Editor</TabsTrigger>
          <TabsTrigger value="history">Version History</TabsTrigger>
        </TabsList>

        <TabsContent value="editor" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Save className="h-5 w-5" />
                System Prompt Editor
                {selectedVersion && (
                  <Badge variant="outline">
                    Version {selectedVersion.version}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="aiModel">AI Model</Label>
                <Select value={aiModel} onValueChange={setAiModel}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select AI model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gemini-2.5-flash-preview-04-17">Gemini 2.5 Flash</SelectItem>
                    <SelectItem value="gemini-2.5-pro-preview-03-25">Gemini 2.5 Pro</SelectItem>
                    <SelectItem value="gemini-1.5-pro">Gemini 1.5 Pro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="prompt">System Prompt</Label>
                <Textarea
                  id="prompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Enter your system prompt for the AI agent..."
                  className="min-h-[200px] font-mono text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="evaluation">Evaluation Notes</Label>
                <Textarea
                  id="evaluation"
                  value={evaluation}
                  onChange={(e) => setEvaluation(e.target.value)}
                  placeholder="Add your evaluation notes for this prompt version..."
                  className="min-h-[100px]"
                />
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={handleSaveVersion} 
                  disabled={isLoading || !prompt.trim()}
                  className="flex-1"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save New Version
                    </>
                  )}
                </Button>
                
                {selectedVersion && (
                  <Button 
                    onClick={handleUpdateEvaluation} 
                    disabled={isLoading}
                    variant="outline"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Star className="mr-2 h-4 w-4" />
                        Update Evaluation
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Version History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : versions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No versions saved yet. Create your first version in the editor.
                </div>
              ) : (
                <div className="space-y-3">
                  {versions.map((version) => (
                    <Card 
                      key={version.id} 
                      className={`cursor-pointer transition-colors hover:bg-gray-50 ${
                        selectedVersion?.id === version.id ? 'ring-2 ring-blue-500' : ''
                      }`}
                      onClick={() => handleLoadVersion(version)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-2">
                              <Badge>v{version.version}</Badge>
                              <Badge variant="outline">{version.aiModel}</Badge>
                              {version.version === Math.max(...versions.map(v => v.version)) && (
                                <Badge variant="default">Latest</Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <Clock className="h-4 w-4" />
                              {formatDate(version.savedDate)}
                            </div>
                            {version.evaluation && (
                              <div className="text-sm text-gray-700 mt-2">
                                <strong>Evaluation:</strong> {version.evaluation.substring(0, 100)}
                                {version.evaluation.length > 100 && '...'}
                              </div>
                            )}
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleLoadVersion(version);
                            }}
                          >
                            Load
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PromptVersionManager;