import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Save, Loader2, RefreshCw, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { savePromptVersion, loadLatestPrompt } from "@/lib/firestoreService";

const PromptVersionManager: React.FC = () => {
  const { user } = useAuth();
  
  // States
  const [promptText, setPromptText] = useState('');
  const [selectedModel, setSelectedModel] = useState('google/gemini-2.5-flash');
  const [selectedTemperature, setSelectedTemperature] = useState(0.05);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [defaultPrompt, setDefaultPrompt] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  // Load latest prompt on mount
  useEffect(() => {
    loadPrompt();
    // Load default prompt from file
    fetch('/sample_promtp.md')
      .then(res => res.text())
      .then(text => setDefaultPrompt(text.trim()))
      .catch(err => console.error('Error loading default:', err));
  }, []);

  const loadPrompt = async () => {
    setIsLoading(true);
    try {
      const promptData = await loadLatestPrompt();
      if (promptData) {
        setPromptText(promptData.prompt);
        setSelectedModel(promptData.model);
        setSelectedTemperature(promptData.temperature);
      }
    } catch (error) {
      console.error('Error loading prompt:', error);
      toast.error('Failed to load prompt');
    } finally {
      setIsLoading(false);
    }
  };

  // Reset to default handler
  const handleReset = () => {
    if (defaultPrompt) {
      setPromptText(defaultPrompt);
      toast.success('Reset to default prompt');
    } else {
      toast.error('Default prompt not available');
    }
  };

  // Save handler - saves new version to professional_buyer_prompts collection
  const handleSave = async () => {
    if (!promptText.trim()) {
      toast.error('Please enter some text before saving');
      return;
    }

    setIsSaving(true);
    try {
      const version = await savePromptVersion(
        promptText,
        selectedModel,
        selectedTemperature
      );
      toast.success(`Prompt saved as version ${version}`);
    } catch (error) {
      console.error('Error saving prompt:', error);
      toast.error('Failed to save prompt');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Prompt Editor</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Loading state */}
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <>
            {/* Model selection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="model-select">Language Model</Label>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {selectedModel === 'google/gemini-2.5-flash' ? 'Gemini 2.5 Flash' :
                   selectedModel === 'google/gemini-3-pro-preview' ? 'Gemini 3 Pro' :
                   selectedModel === 'x-ai/grok-4-fast' ? 'Grok 4 Fast' :
                   selectedModel === 'moonshotai/kimi-k2-thinking' ? 'Kimi K2' :
                   selectedModel}
                </span>
              </div>
              <Select
                value={selectedModel}
                onValueChange={setSelectedModel}
                disabled={isSaving}
              >
                <SelectTrigger id="model-select" className="w-full">
                  <SelectValue placeholder="Select a model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="google/gemini-2.5-flash">Google Gemini 2.5 Flash</SelectItem>
                  <SelectItem value="google/gemini-3-pro-preview">Google Gemini 3 Pro Preview</SelectItem>
                  <SelectItem value="x-ai/grok-4-fast">X.AI Grok 4 Fast</SelectItem>
                  <SelectItem value="moonshotai/kimi-k2-thinking">Moonshot AI Kimi K2 Thinking</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Temperature selection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="temperature-select">Temperature</Label>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {selectedTemperature}
                </span>
              </div>
              <Select
                value={selectedTemperature.toString()}
                onValueChange={(value) => setSelectedTemperature(parseFloat(value))}
                disabled={isSaving}
              >
                <SelectTrigger id="temperature-select" className="w-full">
                  <SelectValue placeholder="Select temperature" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">0 (Most deterministic)</SelectItem>
                  <SelectItem value="0.05">0.05 (Recommended)</SelectItem>
                  <SelectItem value="0.1">0.1 (Balanced)</SelectItem>
                  <SelectItem value="0.2">0.2 (More creative)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Prompt editor with Markdown highlighting */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>System Prompt</Label>
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPreview(!showPreview)}
                    className="text-xs"
                  >
                    {showPreview ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
                    {showPreview ? 'Hide' : 'Show'} Preview
                  </Button>
                  <span className="text-xs text-gray-500">
                    {promptText.length} characters
                  </span>
                </div>
              </div>
              <Textarea
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                placeholder="Type your prompt here... Use # for headings and **text** for bold"
                className="min-h-[400px] font-mono text-sm"
                style={{
                  background: 'linear-gradient(to bottom, #fafafa 0%, #ffffff 100%)',
                  lineHeight: '1.6'
                }}
                disabled={isSaving}
              />
              {showPreview && (
                <div className="mt-2 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-md border border-blue-200 max-h-[300px] overflow-y-auto">
                  <div className="text-xs font-semibold text-blue-700 mb-3 flex items-center gap-2">
                    <Eye className="h-3 w-3" />
                    Markdown Preview
                  </div>
                  <div className="prose prose-sm max-w-none">
                    {promptText.split('\n').map((line, idx) => {
                      // Headings
                      if (line.startsWith('### ')) {
                        return <h3 key={idx} className="text-base font-bold text-gray-900 mt-2 mb-1">{line.substring(4)}</h3>;
                      } else if (line.startsWith('## ')) {
                        return <h2 key={idx} className="text-lg font-bold text-gray-900 mt-3 mb-1">{line.substring(3)}</h2>;
                      } else if (line.startsWith('# ')) {
                        return <h1 key={idx} className="text-xl font-bold text-gray-900 mt-4 mb-2">{line.substring(2)}</h1>;
                      }
                      // Bold text
                      const parts = line.split(/(\*\*.*?\*\*)/g);
                      return (
                        <p key={idx} className="text-sm text-gray-700 mb-1">
                          {parts.map((part, i) => {
                            if (part.startsWith('**') && part.endsWith('**')) {
                              return <strong key={i} className="font-bold text-gray-900">{part.slice(2, -2)}</strong>;
                            }
                            return part;
                          })}
                        </p>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Buttons in a row */}
            <div className="flex gap-2">
              <Button 
                onClick={handleReset}
                variant="outline"
                disabled={isSaving}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Reset to Default
              </Button>
              
              <Button 
                onClick={handleSave} 
                className="flex-1"
                disabled={isSaving || !promptText.trim()}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Prompt
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default PromptVersionManager;