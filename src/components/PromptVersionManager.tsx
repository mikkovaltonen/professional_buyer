import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Save, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { saveUserPrompt, loadUserPrompt } from "@/lib/firestoreService";

const PromptVersionManager: React.FC = () => {
  const { user } = useAuth();
  
  // States
  const [promptText, setPromptText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [defaultPrompt, setDefaultPrompt] = useState('');

  // Load latest prompt on mount
  useEffect(() => {
    if (user?.uid) {
      loadPrompt();
    }
    // Load default prompt
    fetch('/sample_promtp.md')
      .then(res => res.text())
      .then(text => setDefaultPrompt(text.trim()))
      .catch(err => console.error('Error loading default:', err));
  }, [user?.uid]);

  const loadPrompt = async () => {
    if (!user?.uid) return;
    
    setIsLoading(true);
    try {
      const userPrompt = await loadUserPrompt(user.uid);
      if (userPrompt) {
        setPromptText(userPrompt);
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

  // Save handler with Firebase (single prompt per user)
  const handleSave = async () => {
    if (!user?.uid) {
      toast.error('Please log in to save');
      return;
    }
    
    if (!promptText.trim()) {
      toast.error('Please enter some text before saving');
      return;
    }
    
    setIsSaving(true);
    try {
      await saveUserPrompt(
        user.uid,
        promptText,
        'gemini-2.5-flash' // Default model
      );
      toast.success('Prompt saved successfully');
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
            {/* Just a simple textarea */}
            <div>
              <Textarea
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                placeholder="Type your prompt here..."
                className="min-h-[400px] font-mono"
                disabled={isSaving}
              />
            </div>

            {/* Character count */}
            <div className="text-sm text-gray-500">
              {promptText.length} characters
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