import React, { useState, useEffect } from 'react';
import { loadPrompt, savePrompt } from '../lib/firestoreService';
import { useToast } from "@/components/ui/use-toast"; // Assuming this path is correct
import { Button } from "@/components/ui/button"; // Assuming this path is correct
import { Textarea } from "@/components/ui/textarea"; // Assuming this path is correct
import { useAuth } from '../hooks/useAuth'; // Import useAuth

const PromptEditor: React.FC = () => {
  const [promptText, setPromptText] = useState<string>('');
  const [isEditorLoading, setIsEditorLoading] = useState<boolean>(false); // Renamed to avoid conflict
  const { user, loading: authLoading } = useAuth(); // Use useAuth hook
  const userId = user?.email || null; // Get userId from user.email
  const { toast } = useToast();

  useEffect(() => {
    const fetchPrompt = async () => {
      if (!userId) { // Only run if userId is present
        setPromptText(''); // Clear prompt text if no user
        // Optionally, load a default prompt for non-logged-in users or guide them to log in
        // For now, we clear it or you could set a specific message.
        // If you want to load the default prompt even for non-logged in users, remove this check.
        // However, the requirement implies prompts are user-specific.
        try {
          const response = await fetch('/docs/gemini_instructions.md');
          if (!response.ok) {
            throw new Error(`Failed to fetch default prompt: ${response.statusText}`);
          }
          const text = await response.text();
          setPromptText(text);
        } catch (fetchError) {
          console.error("Error fetching default prompt:", fetchError);
          toast({
            title: "Error",
            description: "Failed to load default prompt.",
            variant: "destructive",
          });
          setPromptText("Failed to load default prompt. Please try again later.");
        }
        return;
      }
      setIsEditorLoading(true);
      try {
        const savedPrompt = await loadPrompt(userId);
        if (savedPrompt !== null) {
          setPromptText(savedPrompt);
        } else {
          // Fetch default prompt if no saved prompt for the user
          try {
            const response = await fetch('/docs/gemini_instructions.md');
            if (!response.ok) {
              throw new Error(`Failed to fetch default prompt: ${response.statusText}`);
            }
            const text = await response.text();
            setPromptText(text);
          } catch (fetchError) {
            console.error("Error fetching default prompt:", fetchError);
            toast({
              title: "Error",
              description: "Failed to load default prompt.",
              variant: "destructive",
            });
            setPromptText("Failed to load default prompt. Please try again later.");
          }
        }
      } catch (error) {
        console.error("Error loading prompt:", error);
        toast({
          title: "Error",
          description: "Failed to load prompt from database.",
          variant: "destructive",
        });
         // Attempt to load default prompt as a fallback if DB load fails
        try {
          const response = await fetch('/docs/gemini_instructions.md');
          if (!response.ok) {
            throw new Error(`Failed to fetch default prompt: ${response.statusText}`);
          }
          const text = await response.text();
          setPromptText(text);
        } catch (fetchError) {
          console.error("Error fetching default prompt after DB error:", fetchError);
          setPromptText("Failed to load any prompt. Please try again later.");
        }
      } finally {
        setIsEditorLoading(false);
      }
    };

    fetchPrompt();
  }, [userId, toast]); // Add userId to dependency array

  const handleSave = async () => {
    if (!userId) { // Do not save if userId is missing
      toast({
        title: "Not logged in",
        description: "You must be logged in to save a prompt.",
        variant: "destructive",
      });
      return;
    }
    setIsEditorLoading(true);
    try {
      await savePrompt(userId, promptText);
      toast({
        title: "Prompt saved!",
        description: "Your prompt has been successfully saved.",
      });
    } catch (error) {
      console.error("Error saving prompt:", error);
      toast({
        title: "Error",
        description: "Failed to save prompt.",
        variant: "destructive",
      });
    } finally {
      setIsEditorLoading(false);
    }
  };

  if (authLoading) {
    return <p>Loading user information...</p>;
  }

  if (!user && !authLoading) {
    return <p>Please log in to edit the prompt.</p>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {isEditorLoading && !promptText && <p>Loading prompt...</p>}
      <Textarea
        value={promptText}
        onChange={(e) => setPromptText(e.target.value)}
        placeholder="Enter your prompt here..."
        style={{ minHeight: '200px', width: '100%' }}
        disabled={isEditorLoading && !promptText} // Disable textarea if loading initial prompt
      />
      <Button onClick={handleSave} disabled={isEditorLoading || !userId}>
        {isEditorLoading ? "Saving..." : "Save Prompt"}
      </Button>
    </div>
  );
};

export default PromptEditor;
