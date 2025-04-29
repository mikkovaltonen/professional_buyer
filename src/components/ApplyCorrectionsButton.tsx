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
      // First try to find JSON in code blocks
      const codeBlockRegex = /```(?:json)?\s*(\{[\s\S]*?\})\s*```/g;
      const codeBlockMatches = content.match(codeBlockRegex);
      
      if (codeBlockMatches) {
        console.log('Found JSON in code blocks:', codeBlockMatches);
        // Extract JSON from the last code block
        const jsonContent = codeBlockMatches[codeBlockMatches.length - 1].replace(/```(?:json)?\s*([\s\S]*?)\s*```/, '$1');
        console.log('Extracted JSON content:', jsonContent);
        
        try {
          const parsedCorrection = JSON.parse(jsonContent);
          console.log('Parsed correction:', parsedCorrection);
          
          // If it's a single object, wrap it in an array
          const corrections = Array.isArray(parsedCorrection) ? parsedCorrection : [parsedCorrection];
          
          // Validate the structure of each correction
          const validCorrections = corrections.filter(item => {
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
        } catch (parseError) {
          console.error('JSON parsing error:', parseError);
        }
      }
      
      // Fallback: try to find JSON arrays in the content
      const jsonArrayRegex = /\[\s*\{[\s\S]*?\}\s*\]/g;
      const arrayMatches = content.match(jsonArrayRegex);
      
      if (arrayMatches) {
        console.log('Found JSON arrays:', arrayMatches);
        const jsonContent = arrayMatches[arrayMatches.length - 1];
        
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
      }
      
      console.log('No valid JSON found in content');
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
      const normalizeString = (str: string) => str.replace(/\s+/g, ' ').trim();
      console.log('Comparing product groups:', {
        corrections: corrections.map(c => c.product_group),
        selected: selectedProductGroup,
        normalizedCorrections: corrections.map(c => normalizeString(c.product_group)),
        normalizedSelected: normalizeString(selectedProductGroup)
      });
      
      const relevantCorrections = corrections.filter(
        correction => normalizeString(correction.product_group) === normalizeString(selectedProductGroup)
      );
      console.log('Filtered corrections for product group:', selectedProductGroup, relevantCorrections);

      if (relevantCorrections.length === 0) {
        toast.info('Ei löytynyt korjauksia valitulle tuoteryhmälle');
        return;
      }

      // Get DataService instance and apply corrections
      console.log('Getting DataService instance...');
      const dataService = DataService.getInstance();
      console.log('Calling applyCorrections...');
      try {
        await dataService.applyCorrections(relevantCorrections);
        console.log('Successfully applied corrections');
        toast.success('Korjaukset lisätty onnistuneesti');
      } catch (applyError) {
        console.error('Error from applyCorrections:', applyError);
        toast.error('Korjausten lisääminen epäonnistui: ' + (applyError.message || 'Tuntematon virhe'));
      }
    } catch (error) {
      console.error('Error in applyCorrections button handler:', error);
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
      Tallenna ehdotetut manuaaliset korjaukset
    </Button>
  );
};

export default ApplyCorrectionsButton; 