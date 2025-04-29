import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { DataService } from '@/lib/dataService';

interface ApplyCorrectionsButtonProps {
  chatContent: string;
  selectedProductGroup: string;
}

interface ForecastCorrection {
  product_group: string;
  month: string;
  correction_percent: number;
  explanation: string;
}

const ApplyCorrectionsButton: React.FC<ApplyCorrectionsButtonProps> = ({ chatContent, selectedProductGroup }) => {
  const [isLoading, setIsLoading] = useState(false);

  const extractCorrectionsFromChat = (content: string): ForecastCorrection[] => {
    if (!content) {
      console.log('No chat content provided');
      return [];
    }

    try {
      // Find JSON arrays in the chat content
      const jsonRegex = /\[\s*\{[\s\S]*?\}\s*\]/g;
      const matches = content.match(jsonRegex);
      
      if (!matches || matches.length === 0) {
        console.log('No JSON matches found in chat content');
        return [];
      }

      // Take the last match (most recent correction)
      const jsonContent = matches[matches.length - 1];
      console.log('Found JSON content:', jsonContent);
      
      try {
        const parsedCorrections = JSON.parse(jsonContent);
        console.log('Parsed corrections:', parsedCorrections);
        
        if (Array.isArray(parsedCorrections)) {
          // Validate the structure of each correction
          const validCorrections = parsedCorrections.filter(item => {
            const isValid = item.product_group && 
                          item.month && 
                          (typeof item.correction_percent === 'number' || 
                           (typeof item.correction_percent === 'string' && !isNaN(Number(item.correction_percent)))) &&
                          item.explanation;
            if (!isValid) {
              console.log('Invalid correction item:', item);
            }
            return isValid;
          });
          console.log('Valid corrections:', validCorrections);
          return validCorrections;
        }
      } catch (parseError) {
        console.error('JSON parsing error:', parseError);
      }
      
      return [];
    } catch (error) {
      console.error('Error extracting corrections:', error);
      return [];
    }
  };

  const applyCorrections = async () => {
    try {
      setIsLoading(true);
      console.log('Starting to apply corrections');
      console.log('Chat content:', chatContent);

      // Extract corrections from chat content
      const corrections = extractCorrectionsFromChat(chatContent);
      console.log('Extracted corrections:', corrections);

      if (corrections.length === 0) {
        toast.error('Korjauksia ei löytynyt chat-sisällöstä');
        return;
      }

      // Filter corrections for the selected product group
      const relevantCorrections = corrections.filter(
        correction => correction.product_group === selectedProductGroup
      );

      if (relevantCorrections.length === 0) {
        toast.info('Ei löytynyt korjauksia valitulle tuoteryhmälle');
        return;
      }

      // Get DataService instance and apply corrections
      const dataService = DataService.getInstance();
      await dataService.applyCorrections(relevantCorrections);

      toast.success('Korjaukset lisätty onnistuneesti');
    } catch (error) {
      console.error('Error applying corrections:', error);
      toast.error('Korjausten lisääminen epäonnistui');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={applyCorrections}
      disabled={isLoading}
      className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white"
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : null}
      Lisää korjausprosentit
    </Button>
  );
};

export default ApplyCorrectionsButton; 