import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { TimeSeriesData } from '@/lib/dataService';

interface ApplyCorrectionsButtonProps {
  selectedProductGroup: string;
}

interface ForecastCorrection {
  product_group: string;
  month: string;
  correction_percent: number;
  explanation: string;
}

const ApplyCorrectionsButton: React.FC<ApplyCorrectionsButtonProps> = ({ selectedProductGroup }) => {
  const [isLoading, setIsLoading] = useState(false);

  const applyCorrections = async () => {
    try {
      setIsLoading(true);
      console.log('Starting to apply corrections');

      // Read the forecast adjustments from memory
      const response = await fetch('/api/forecast-adjustments');
      if (!response.ok) {
        throw new Error('Failed to read forecast adjustments');
      }

      const data = await response.json();
      console.log('Read forecast adjustments:', data);

      if (!data.adjustments || !Array.isArray(data.adjustments)) {
        throw new Error('Invalid forecast adjustments format');
      }

      // Filter corrections for the selected product group
      const corrections = data.adjustments.filter(
        (adjustment: ForecastCorrection) => adjustment.product_group === selectedProductGroup
      );

      if (corrections.length === 0) {
        toast.info('Ei löytynyt korjauksia valitulle tuoteryhmälle');
        return;
      }

      console.log('Applying corrections:', corrections);

      // Read the forecast data
      const forecastResponse = await fetch('/api/forecast-data');
      if (!forecastResponse.ok) {
        throw new Error('Failed to read forecast data');
      }

      const forecastData: TimeSeriesData[] = await forecastResponse.json();
      console.log('Read forecast data');

      // Create a map of corrections by product group and month
      const correctionsMap = new Map<string, ForecastCorrection>(
        corrections.map(c => [`${c.product_group}|${c.month}`, c])
      );
      console.log('Created corrections map');

      // Update the data with corrections
      const updatedData = forecastData.map((row: TimeSeriesData) => {
        const key = `${row['Product Group']}|${row['Year_Month']}`;
        const correction = correctionsMap.get(key);

        if (correction) {
          return {
            ...row,
            correction_percent: correction.correction_percent,
            explanation: correction.explanation
          };
        }
        return row;
      });
      console.log('Updated data with corrections');

      // Save the updated data to memory
      const saveResponse = await fetch('/api/forecast-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData)
      });

      if (!saveResponse.ok) {
        throw new Error('Failed to save updated forecast data');
      }

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
      Lisää korjausprosentit JSON:iin
    </Button>
  );
};

export default ApplyCorrectionsButton; 