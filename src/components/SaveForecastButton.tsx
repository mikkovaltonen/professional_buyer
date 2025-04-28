import React from 'react';
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { toast } from "sonner";

interface SaveForecastButtonProps {
  chatContent: string;
  selectedProductGroup: string;
}

const SaveForecastButton: React.FC<SaveForecastButtonProps> = ({ chatContent, selectedProductGroup }) => {
  const extractAndSaveJSON = async () => {
    try {
      console.log('Chat content:', chatContent);
      console.log('Selected product group:', selectedProductGroup);
      
      // Find the last JSON content from chat by finding all matches and taking the last one
      const jsonRegex = /\[\s*\{[\s\S]*?\}\s*\]/g;
      const matches = [...chatContent.matchAll(jsonRegex)];
      console.log('Found JSON matches:', matches);
      
      if (matches.length === 0) {
        console.log('No JSON matches found in chat content');
        toast.error('JSON dataa ei löytynyt chatista');
        return;
      }

      // Take the last match
      const jsonContent = matches[matches.length - 1][0];
      console.log('Extracted JSON content:', jsonContent);
      
      let adjustments;
      try {
        adjustments = JSON.parse(jsonContent);
        console.log('Parsed adjustments:', adjustments);
      } catch (e) {
        console.error('JSON parsing error:', e);
        toast.error('JSON datan jäsentäminen epäonnistui');
        return;
      }

      // Validate the input structure
      if (!Array.isArray(adjustments) || !adjustments.every(item => {
        // Check required fields
        const hasValidMonth = typeof item.month === 'string';
        const hasValidCorrection = typeof item.correction_percent === 'number' || 
          (typeof item.correction_percent === 'string' && !isNaN(Number(item.correction_percent)));
        const hasValidProductGroup = typeof item.product_group === 'string';

        console.log('Validation for item:', {
          item,
          hasValidMonth,
          hasValidCorrection,
          hasValidProductGroup
        });

        return hasValidMonth && hasValidCorrection && hasValidProductGroup;
      })) {
        console.error('Invalid input data structure:', adjustments);
        toast.error('JSON data ei ole oikeassa muodossa (vaaditaan month, correction_percent ja product_group kentät)');
        return;
      }

      // Use the data as is since it's already in the correct format
      const transformedAdjustments = adjustments;

      // Save to file
      console.log('Sending request to save forecast...');
      const response = await fetch('/api/save-forecast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          adjustments: transformedAdjustments,
          timestamp: new Date().toISOString()
        })
      });

      console.log('Save forecast response:', response);
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`Tallentaminen epäonnistui: ${errorText}`);
      }

      const responseData = await response.json();
      console.log('Save forecast response data:', responseData);

      toast.success('Ennustekorjaukset tallennettu onnistuneesti');
    } catch (error) {
      console.error('Error saving forecast adjustments:', error);
      toast.error('Ennustekorjausten tallentaminen epäonnistui');
    }
  };

  return (
    <Button
      onClick={extractAndSaveJSON}
      className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white"
    >
      <Save className="h-4 w-4" />
      Tallenna ennustekorjaukset
    </Button>
  );
};

export default SaveForecastButton; 