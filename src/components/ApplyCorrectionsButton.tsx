import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { DataService } from '@/lib/dataService';
import { Save } from "lucide-react";

interface ApplyCorrectionsButtonProps {
  chatContent: string;
  selectedProductGroup?: string;
  selectedProductCode?: string;
  selectedClass?: string;
  onCorrectionsApplied?: () => void;
}

interface ForecastCorrection {
  product_group?: string;
  product_code?: string;
  month: string;
  correction_percent: number;
  explanation: string;
  forecast_corrector?: string;
  prod_class?: string;
}

const ApplyCorrectionsButton: React.FC<ApplyCorrectionsButtonProps> = ({ 
  chatContent, 
  selectedProductGroup,
  selectedProductCode,
  selectedClass,
  onCorrectionsApplied 
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error' | 'none-found'>('idle');
  const [statusMessage, setStatusMessage] = useState('');



  const statusColors = {
    success: 'text-green-600',
    error: 'text-red-600',
    'none-found': 'text-gray-500',
  };

  const extractCorrectionsFromChat = (content: string): ForecastCorrection[] => {
    if (!content) {
      console.log('No chat content provided');
      return [];
    }

    try {
      // Find all JSON blocks (both arrays and objects)
      const codeBlockRegex = /```(?:json)?\s*(\[[\s\S]*?\]|\{[\s\S]*?\})\s*```/g;
      const codeBlockMatches = [];
      let match;
      
      while ((match = codeBlockRegex.exec(content)) !== null) {
        codeBlockMatches.push(match[1]);
      }
      
      if (codeBlockMatches.length > 0) {
        console.log('Found JSON in code blocks:', codeBlockMatches.length);
        
        // Process candidates from last to first (most recent first) and select the last valid dataset
        let lastValidDataset = null;
        
        for (let i = codeBlockMatches.length - 1; i >= 0; i--) {
          const jsonContent = codeBlockMatches[i];
          console.log(`Evaluating JSON candidate ${i + 1}/${codeBlockMatches.length} (from newest):`, jsonContent.substring(0, 100) + '...');
        
          try {
            const parsedCorrection = JSON.parse(jsonContent);
            
            let corrections = [];
            let isArray = false;
            
            if (Array.isArray(parsedCorrection)) {
              corrections = parsedCorrection;
              isArray = true;
              console.log(`Array found with ${corrections.length} items${corrections.length >= 12 ? ' (12+ months bonus!)' : ''}`);
            } else {
              corrections = [parsedCorrection];
              console.log('Single object detected');
            }
            
            // Validate the structure of each correction
            const hasRequiredFields = (item: any) => 
              typeof item.month === 'string' && item.month.trim() !== '' &&
              typeof item.explanation === 'string' && item.explanation.trim() !== '' &&
              (typeof item.correction_percent === 'number' || 
               (typeof item.correction_percent === 'string' && item.correction_percent.trim() !== '' && !isNaN(Number(item.correction_percent.trim()))));

            const validCorrections = corrections.filter(item => {
              const isProductSpecific = typeof item.product_code === 'string' && item.product_code.trim() !== '';
              const isGroupLevel = (!item.product_code || String(item.product_code).trim() === '') && (typeof item.product_group === 'string' && item.product_group.trim() !== '');
              const isClassLevel = (!item.product_code || String(item.product_code).trim() === '') && (!item.product_group || String(item.product_group).trim() === '') && (typeof item.prod_class === 'string' && item.prod_class.trim() !== '');
            
              const isValid = hasRequiredFields(item) && (isProductSpecific || isGroupLevel || isClassLevel);
              if (!isValid) {
                console.log('Invalid correction item (must be product-specific, group-level, or class-level and have all required fields):', item);
              }
              return isValid;
            });
            
            if (validCorrections.length > 0) {
              // Skip single-item arrays (likely examples) unless no other option
              if (isArray && corrections.length === 1 && lastValidDataset === null) {
                console.log('Single-item array detected (likely example) - will use as fallback if no better option found');
                lastValidDataset = validCorrections;
              } else if (!isArray && corrections.length === 1 && lastValidDataset === null) {
                console.log('Single object detected (likely example) - will use as fallback if no better option found');
                lastValidDataset = validCorrections;
              } else if (isArray && corrections.length > 1) {
                console.log(`Valid dataset found with ${corrections.length} items - selecting as latest valid dataset`);
                lastValidDataset = validCorrections;
                break; // Found a good dataset, stop looking (we want the most recent good one)
              }
            }
            
          } catch (parseError) {
            console.error('Failed to parse JSON candidate:', parseError);
          }
        }
        
        if (lastValidDataset) {
          console.log(`Selected most recent valid dataset:`, lastValidDataset);
          return lastValidDataset;
        }
      }

      // No valid JSON found
      console.log('No valid JSON found in code blocks');
      return [];
    } catch (error) {
      console.error('Error extracting corrections:', error);
      return [];
    }
  };

  const debugDatabaseData = async (productCode: string, months: string[]) => {
    try {
      const dataService = DataService.getInstance();
      console.log(`[DEBUG] Fetching current database state for ${productCode}:`);
      
      for (const month of months) {
        const url = `/api?where[prodcode]=${productCode}&where[Year_Month]=${month}-01`;
        console.log(`[DEBUG] GET request URL: ${url}`);
        
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${dataService.authToken}`,
            'Accept': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          const results = data.results || [];
          console.log(`[DEBUG] Database data for ${month}:`, {
            found: results.length > 0,
            data: results[0] || 'No data',
            new_forecast: results[0]?.new_forecast || 'null',
            new_forecast_manually_adjusted: results[0]?.new_forecast_manually_adjusted || 'null',
            correction_percent: results[0]?.correction_percent || 'null'
          });
        } else {
          console.log(`[DEBUG] Failed to fetch ${month}: ${response.status}`);
        }
      }
    } catch (error) {
      console.error('[DEBUG] Database fetch error:', error);
    }
  };

  const applyCorrections = async () => {
    try {
      setIsLoading(true);
      setStatus('saving');
      setStatusMessage('');
      console.log('Starting to apply corrections');
      console.log('Chat content:', chatContent);

      // Extract corrections from chat content
      const corrections = extractCorrectionsFromChat(chatContent);
      console.log('Extracted corrections:', corrections);

      // Debug: Compare with current database state
      if (corrections.length > 0) {
        const firstCorrection = corrections[0];
        if (firstCorrection.product_code) {
          const months = corrections.map(c => c.month);
          console.log(`[DEBUG] About to compare JSON input vs database for ${firstCorrection.product_code}`);
          await debugDatabaseData(firstCorrection.product_code, months);
        }
      }

      if (corrections.length === 0) {
        toast.error('Korjauksia ei löytynyt chat-sisällöstä');
        setStatus('none-found');
        setStatusMessage('Ei tallennettavia korjauksia.');
        setTimeout(() => setStatus('idle'), 4000);
        return;
      }

      const dataService = DataService.getInstance();
      const normalizeString = (str: string | undefined) => str ? str.replace(/\s+/g, ' ').trim() : '';
      
      let finalCorrectionsToSend: ForecastCorrection[] = [];

      if (selectedProductCode) {
        // Scenario 1: selectedProductCode is active. All corrections target this specific product.
        finalCorrectionsToSend = corrections.map(c => {
          const mappedCorrection: ForecastCorrection = {
            ...c,
            product_code: selectedProductCode,
            // Ensure correction_percent is a number
            correction_percent: typeof c.correction_percent === 'string' 
                                ? parseFloat(c.correction_percent.trim()) 
                                : c.correction_percent,
          };

          // ADD LOGGING HERE for mappedCorrection
          if (mappedCorrection.product_code) {
            const productDetails = dataService.getProductDetails(mappedCorrection.product_code);
            console.log(`[Debug Comparison] For Product Code: ${mappedCorrection.product_code}`);
            console.log(`  Data Sent -> prod_class: ${mappedCorrection.prod_class}, product_group: ${mappedCorrection.product_group}`);
            if (productDetails) {
                console.log(`  Actual Data (from DataService) -> prod_class: ${productDetails.prod_class}, product_group: ${productDetails.prodgroup}`);
                const classMatch = mappedCorrection.prod_class === productDetails.prod_class;
                const groupMatch = mappedCorrection.product_group === productDetails.prodgroup;
                console.log(`  Comparison -> Class Match: ${classMatch}, Group Match: ${groupMatch}`);
                if (!classMatch || !groupMatch) {
                    console.warn(`  Mismatch detected for ${mappedCorrection.product_code}: Sent (Class: ${mappedCorrection.prod_class}, Group: ${mappedCorrection.product_group}) vs Actual (Class: ${productDetails.prod_class}, Group: ${productDetails.prodgroup})`);
                }
            } else {
                console.warn(`  Actual Data (from DataService) -> Details not found in DataService for ${mappedCorrection.product_code}`);
            }
          }
          return mappedCorrection;
        }).filter(mc => mc.product_code && !isNaN(mc.correction_percent)); // Filter out if product_code became undefined or percent is NaN
        
        console.log(`Applying all ${finalCorrectionsToSend.length} valid chat corrections to selected product: ${selectedProductCode}`, finalCorrectionsToSend);
      } else {
        // Scenarios 2, 3, 4: No selectedProductCode. Corrections might need expansion.
        let candidateCorrections = corrections;

        if (selectedProductGroup) {
          // Filter by selectedProductGroup
          candidateCorrections = corrections.filter(c => {
            // Item is relevant if its product_group matches, or if it's product-specific and its group (if known) matches.
            // Or if it's class-level and its class contains this group (more complex, not handled here).
            // Simplified: if correction has a group, it must match. If product-specific, its actual group should match.
            // For now, only direct match on c.product_group or if it's a product specific correction that might be in this group.
            const correctionProductGroup = normalizeString(c.product_group);
            const uiSelectedGroup = normalizeString(selectedProductGroup);
            if (c.product_code && c.product_code.trim() !== '') {
                // If product specific, we assume it's relevant if its group matches.
                // This requires knowing the product's actual group. For now, allow if group matches or no group on item.
                return correctionProductGroup === uiSelectedGroup || !c.product_group;
            }
            return correctionProductGroup === uiSelectedGroup;
          });
          console.log(`Filtered ${corrections.length} chat corrections to ${candidateCorrections.length} by selected group: ${selectedProductGroup}`);
        } else if (selectedClass) {
          // Filter by selectedClass
          candidateCorrections = corrections.filter(c => {
            const correctionProdClass = normalizeString(c.prod_class);
            const uiSelectedClass = normalizeString(selectedClass);
             // Item is relevant if its prod_class matches.
            if (c.product_code && c.product_code.trim() !== '') {
                // If product specific, its actual class should match. Allow if class matches or no class on item.
                 return correctionProdClass === uiSelectedClass || !c.prod_class;
            }
            if (c.product_group && c.product_group.trim() !== '') {
                // If group specific, its actual class should match. Allow if class matches or no class on item.
                return correctionProdClass === uiSelectedClass || !c.prod_class;
            }
            return correctionProdClass === uiSelectedClass;
          });
          console.log(`Filtered ${corrections.length} chat corrections to ${candidateCorrections.length} by selected class: ${selectedClass}`);
        } else {
          console.log('No UI selection (product, group, or class), processing all valid chat corrections for potential expansion.');
        }

        for (const correction of candidateCorrections) {
          const currentCorrectionPercent = typeof correction.correction_percent === 'string' 
            ? parseFloat(correction.correction_percent.trim()) 
            : correction.correction_percent;

          if (isNaN(currentCorrectionPercent)) {
            console.warn('Skipping correction due to invalid correction_percent:', correction);
            continue; 
          }
          
          if (correction.product_code && correction.product_code.trim() !== '') {
            // Already product-specific
            const correctionToLog: ForecastCorrection = {
              ...correction,
              correction_percent: currentCorrectionPercent
            };

            // ADD LOGGING HERE for correctionToLog
            if (correctionToLog.product_code) {
                const productDetails = dataService.getProductDetails(correctionToLog.product_code);
                console.log(`[Debug Comparison] For Product Code: ${correctionToLog.product_code}`);
                console.log(`  Data Sent -> prod_class: ${correctionToLog.prod_class}, product_group: ${correctionToLog.product_group}`);
                if (productDetails) {
                    console.log(`  Actual Data (from DataService) -> prod_class: ${productDetails.prod_class}, product_group: ${productDetails.prodgroup}`);
                    const classMatch = correctionToLog.prod_class === productDetails.prod_class;
                    const groupMatch = correctionToLog.product_group === productDetails.prodgroup;
                    console.log(`  Comparison -> Class Match: ${classMatch}, Group Match: ${groupMatch}`);
                    if (!classMatch || !groupMatch) {
                        console.warn(`  Mismatch detected for ${correctionToLog.product_code}: Sent (Class: ${correctionToLog.prod_class}, Group: ${correctionToLog.product_group}) vs Actual (Class: ${productDetails.prod_class}, Group: ${productDetails.prodgroup})`);
                    }
                } else {
                    console.warn(`  Actual Data (from DataService) -> Details not found in DataService for ${correctionToLog.product_code}`);
                }
            }
            finalCorrectionsToSend.push(correctionToLog);
          } else {
            // Needs expansion
            let productCodesToCorrect: string[] = [];
            if (correction.product_group && correction.product_group.trim() !== '') {
              productCodesToCorrect = dataService.getUniqueProductCodesInGroup(correction.product_group.trim(), correction.prod_class?.trim());
            } else if (correction.prod_class && correction.prod_class.trim() !== '') {
              productCodesToCorrect = dataService.getUniqueProductCodesInClass(correction.prod_class.trim());
            }

            if (productCodesToCorrect.length > 0) {
              console.log(`Expanding group/class correction for '${normalizeString(correction.product_group) || normalizeString(correction.prod_class)}' into ${productCodesToCorrect.length} specific corrections.`);
              productCodesToCorrect.forEach(pCode => {
                const specificCorrection: ForecastCorrection = {
                  month: correction.month,
                  correction_percent: currentCorrectionPercent,
                  explanation: correction.explanation,
                  forecast_corrector: correction.forecast_corrector,
                  prod_class: correction.prod_class, // This is the prod_class from the original group/class level suggestion
                  product_group: correction.product_group, // This is the product_group from the original group level suggestion
                  product_code: pCode,
                };

                // ADD LOGGING HERE for specificCorrection
                if (specificCorrection.product_code) {
                    const productDetails = dataService.getProductDetails(specificCorrection.product_code);
                    console.log(`[Debug Comparison] For Product Code: ${specificCorrection.product_code}`);
                    console.log(`  Data Sent -> prod_class: ${specificCorrection.prod_class}, product_group: ${specificCorrection.product_group}`);
                    if (productDetails) {
                        console.log(`  Actual Data (from DataService) -> prod_class: ${productDetails.prod_class}, product_group: ${productDetails.prodgroup}`);
                        const classMatch = specificCorrection.prod_class === productDetails.prod_class;
                        const groupMatch = specificCorrection.product_group === productDetails.prodgroup;
                        console.log(`  Comparison -> Class Match: ${classMatch}, Group Match: ${groupMatch}`);
                        if (!classMatch || !groupMatch) {
                            console.warn(`  Mismatch detected for ${specificCorrection.product_code}: Sent (Class: ${specificCorrection.prod_class}, Group: ${specificCorrection.product_group}) vs Actual (Class: ${productDetails.prod_class}, Group: ${productDetails.prodgroup})`);
                        }
                    } else {
                        console.warn(`  Actual Data (from DataService) -> Details not found in DataService for ${specificCorrection.product_code}`);
                    }
                }
                finalCorrectionsToSend.push(specificCorrection);
              });
            } else {
              console.warn(`No product codes found for group/class correction: '${normalizeString(correction.product_group) || normalizeString(correction.prod_class)}'. This correction will be skipped.`);
              toast.warn(`Korjausta ei voitu kohdistaa tuotteisiin ryhmälle/luokalle: ${normalizeString(correction.product_group) || normalizeString(correction.prod_class)}`);
            }
          }
        }
      }
      
      if (finalCorrectionsToSend.length === 0) {
        const targetMessage = selectedProductCode ? `valitulle tuotteelle (${selectedProductCode})` 
          : selectedProductGroup ? `valitulle tuoteryhmälle (${selectedProductGroup})` 
          : selectedClass ? `valitulle tuoteluokalle (${selectedClass})` 
          : "annetuille ohjeille";
        toast.info(`Ei löytynyt prosessoitavia korjauksia ${targetMessage}.`);
        setStatus('none-found');
        setStatusMessage('Ei tallennettavia korjauksia.');
        setTimeout(() => setStatus('idle'), 4000);
        return;
      }
      
      console.log(`Sending ${finalCorrectionsToSend.length} product-specific corrections to DataService:`, finalCorrectionsToSend);
      try {
        await dataService.applyCorrections(finalCorrectionsToSend);
        console.log('Successfully applied corrections');
        toast.success('Korjaukset lisätty onnistuneesti');
        setStatus('success');
        setStatusMessage('Korjaukset tallennettu onnistuneesti.');
        setTimeout(() => setStatus('idle'), 4000);
        if (onCorrectionsApplied) {
          onCorrectionsApplied();
        }
      } catch (applyError) {
        console.error('Error from applyCorrections:', applyError);
        toast.error('Korjausten lisääminen epäonnistui: ' + (applyError.message || 'Tuntematon virhe'));
        setStatus('error');
        setStatusMessage('Tallennus epäonnistui.');
        setTimeout(() => setStatus('idle'), 4000);
      }
    } catch (err) {
      console.error('Error applying corrections:', err);
      toast.error('Korjausten käsittelyssä tapahtui virhe');
      setStatus('error');
      setStatusMessage('Tallennus epäonnistui.');
      setTimeout(() => setStatus('idle'), 4000);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-start gap-2">
      <div className="flex gap-2">
        <Button
          onClick={applyCorrections}
          disabled={isLoading}
          className="bg-[#4ADE80] hover:bg-[#22C55E] text-white"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Tallenna json
        </Button>
      </div>
      {status !== 'idle' && statusMessage && (
        <span className={`text-sm mt-1 ${statusColors[status] || ''}`}>{statusMessage}</span>
      )}
    </div>
  );
};

export default ApplyCorrectionsButton; 