import React, { useState, useRef } from 'react';
import { GoogleGenerativeAI, Part } from '@google/generative-ai';
import { Loader2 } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import ApplyCorrectionsButton from './ApplyCorrectionsButton';
import { Button } from '@/components/ui/button';
import { DataService } from '@/lib/dataService';
import { useAuth } from '../hooks/useAuth'; // Import useAuth
import { loadPrompt } from '../lib/firestoreService'; // Import loadPrompt

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
const geminiModel = import.meta.env.VITE_GEMINI_MODEL || 'gemini-2.5-pro-preview-03-25';

const genAI = new GoogleGenerativeAI(apiKey);

interface CitationSource {
  startIndex?: number;
  endIndex?: number;
  uri?: string;
  groundingMetadata?: GroundingSupport;
}

interface GroundingSupport {
  groundingChunkIndices: number[];
  uri?: string;
  license?: string;
  segment?: {
    startIndex?: string;
    endIndex?: string;
  };
}

interface GroundingChunk {
  web?: {
    uri?: string;
  };
  uri?: string;
}

interface Message {
  role: 'user' | 'model';
  parts: Part[];
  citationMetadata?: {
    citationSources: CitationSource[];
  };
}

const processTextWithCitations = (text: string, citationSources?: CitationSource[]) => {
  if (!citationSources || citationSources.length === 0) {
    return { processedText: text, sourceMap: new Map() };
  }

  let resultText = "";
  let lastProcessedEnd = 0;
  let citationNumber = 1;

  const sortedSources = [...citationSources].sort((a, b) => (a.startIndex || 0) - (b.startIndex || 0));

  sortedSources.forEach((source) => {
    if (source.startIndex !== undefined && source.endIndex !== undefined && source.uri) {
      if (source.startIndex > lastProcessedEnd) {
        resultText += text.substring(lastProcessedEnd, source.startIndex);
      }
      let currentWordEndIndex = source.endIndex;
      while (currentWordEndIndex < text.length && text[currentWordEndIndex].trim() !== '') {
        currentWordEndIndex++;
      }
      const wordCited = text.substring(source.startIndex, currentWordEndIndex);
      const linkText = `[lähde ${citationNumber++}]`;
      const linkMarkdown = `(${linkText}(${source.uri}))`;
      resultText += wordCited;
      resultText += linkMarkdown;
      lastProcessedEnd = currentWordEndIndex;
    } else {
      console.warn("[GeminiChat] processTextWithCitations: Invalid citation source (missing startIndex, endIndex, or uri):", source);
    }
  });

  if (lastProcessedEnd < text.length) {
    resultText += text.substring(lastProcessedEnd);
  }

  return { processedText: resultText, sourceMap: new Map() };
};

interface GeminiChatProps {
  imageUrl?: string | null;
  errorImageUrl?: string | null;
  chartLevel?: 'class' | 'group' | 'product';
  onCorrectionsApplied?: () => void;
  selectedClass?: string | null;
  selectedGroups?: string[];
  selectedProducts?: { code: string; description: string }[];
}

const GeminiChat: React.FC<GeminiChatProps> = ({ 
  imageUrl, 
  errorImageUrl,
  chartLevel = 'group', 
  onCorrectionsApplied,
  selectedClass,
  selectedGroups,
  selectedProducts
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionActive, setSessionActive] = useState(false);
  const [instructions, setInstructions] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth(); // Use useAuth hook

  const loadImageAsBase64 = async (imagePath: string): Promise<string> => {
    if (!imagePath) throw new Error('imageUrl puuttuu!');
    if (imagePath.startsWith('data:image/')) {
      return imagePath;
    }
    if (imagePath.startsWith('blob:')) {
      const response = await fetch(imagePath);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(reader.result as string);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    }
    const response = await fetch(imagePath);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // loadInstructions function is removed.

  const buildRequestPayload = async () => {
    const base: Record<string, string | number> = {
      prod_class: selectedClass || 'N/A',
      month: '2025-08',
      correction_percent: -2,
      explanation: 'Perustelu tähän.',
      forecast_corrector: 'forecasting@kemppi.com',
    };

    if (chartLevel === 'group' || chartLevel === 'product') {
      base.product_group =
        selectedGroups && selectedGroups.length > 0 ? selectedGroups[0] : 'N/A';
    }

    if (chartLevel === 'product' && selectedProducts && selectedProducts.length > 0) {
      const currentProductCode = selectedProducts[0].code;
      try {
        const dataService = DataService.getInstance();
        console.log(`[GeminiChat] Getting current new_forecast from cache for product ${currentProductCode}`);
        const productData = dataService.getDataForProduct(currentProductCode);
        console.log(`[GeminiChat] Found ${productData.length} cached records for ${currentProductCode}`);
        if (productData.length > 0) {
          const forecastData = productData
            .filter(r => r.new_forecast !== null && r.new_forecast !== undefined)
            .sort((a, b) => b.Year_Month.localeCompare(a.Year_Month))
            .slice(0, 1);
          console.log(`[GeminiChat] Filtered forecast data from cache:`, forecastData);
          if (forecastData.length > 0) {
            base.new_forecast = forecastData[0].new_forecast;
            console.log(`[GeminiChat] Successfully added new_forecast from cache: ${base.new_forecast} for ${currentProductCode}`);
          } else {
            console.log(`[GeminiChat] No new_forecast data found in cache for ${currentProductCode}`);
          }
        } else {
          console.log(`[GeminiChat] No cached data found for ${currentProductCode}`);
        }
      } catch (error) {
        console.error(`[GeminiChat] Failed to get new_forecast from cache for ${currentProductCode}:`, error);
      }
    }

    if (chartLevel === 'product') {
      base.product_code =
        selectedProducts && selectedProducts.length > 0 && selectedProducts[0].code
          ? selectedProducts[0].code
          : 'N/A';
    }

    const ordered: Record<string, string | number> = { prod_class: base.prod_class };
    if (base.product_group) ordered.product_group = base.product_group;
    if (base.product_code) ordered.product_code = base.product_code;
    if (base.new_forecast !== undefined) ordered.new_forecast = base.new_forecast;
    ordered.month = base.month;
    ordered.correction_percent = base.correction_percent;
    ordered.explanation = base.explanation;
    ordered.forecast_corrector = base.forecast_corrector;

    return ordered;
  };

  const handleRequestJson = async () => {
    console.log("[GeminiChat] handleRequestJson: Initiating JSON request.");
    setIsLoading(true);
    const payload = await buildRequestPayload();
    const jsonString = JSON.stringify(payload, null, 2);
    const fullMessageString = `Anna tutkimukseesi perustuva paras arvauksesi tilastollisen kysyntäennusteen korjauksesta. Luo yksi rivi kullekin kuukaudelle seurvaan 12kk ajalle ( kuluva kk + 11k tulveisuuteen). Tää on sama aika jolle kuvaajassa annettu tilastollinen ennuste.  JSON-muoto on alla:\n\`\`\`json\n${jsonString}\n\`\`\``;
    const userMessage: Message = { role: 'user', parts: [{ text: fullMessageString }] };
    setMessages(prev => [...prev, userMessage]);

    try {
      const model = genAI.getGenerativeModel({
        model: geminiModel,
        generationConfig: { temperature: 0.2 },
      });
      const history = messages.map(msg => ({ role: msg.role, parts: msg.parts }));
      console.log("[GeminiChat] handleRequestJson: Sending message to Gemini model with payload:", payload);
      const result = await model.generateContent({ contents: [...history, { role: 'user', parts: [{ text: fullMessageString }] }], tools: [{ googleSearchRetrieval: {} }] });
      const response = result.response;

      if (response && response.candidates && response.candidates.length > 0) {
        const candidate = response.candidates[0];
        const content = candidate.content;
        let processedCitationMetadata: { citationSources: CitationSource[] } | undefined = undefined;
        if (candidate.citationMetadata && candidate.citationMetadata.citationSources && candidate.citationMetadata.citationSources.length > 0) {
            processedCitationMetadata = candidate.citationMetadata;
        } else if (candidate.groundingMetadata) {
            const sources: CitationSource[] = [];
            const supports = candidate.groundingMetadata.groundingSupports;
            const allChunks = candidate.groundingMetadata.groundingChunks;
            if (supports && Array.isArray(supports)) {
                supports.forEach((support: GroundingSupport) => {
                    if (support.segment && support.groundingChunkIndices && Array.isArray(support.groundingChunkIndices) && support.groundingChunkIndices.length > 0) {
                        const firstChunkIndex = support.groundingChunkIndices[0];
                        if (allChunks && Array.isArray(allChunks) && firstChunkIndex >= 0 && firstChunkIndex < allChunks.length) {
                            const chunk = allChunks[firstChunkIndex] as GroundingChunk;
                            const uri = chunk?.web?.uri || chunk?.uri;
                            if (uri) {
                                sources.push({ 
                                    startIndex: parseInt(support.segment.startIndex || '0', 10), 
                                    endIndex: parseInt(support.segment.endIndex || '0', 10), 
                                    uri: uri
                                });
                            }
                        }
                    }
                });
            }
            if (sources.length > 0) {
                processedCitationMetadata = { citationSources: sources };
            }
        }
        setMessages(prev => [...prev, { 
          role: 'model', 
          parts: content?.parts || [{text: "Sain tyhjän vastauksen."}], 
          citationMetadata: processedCitationMetadata 
        }]);
      } else {
        console.warn("[GeminiChat] handleRequestJson: No valid candidates in Gemini response.");
        setMessages(prev => [...prev, { role: 'model', parts: [{text: "En saanut vastausta mallilta."}] }]);
      }
    } catch (error: unknown) {
      const err = error as { message?: string; status?: unknown; details?: unknown; response?: { text: () => Promise<string> } };
      console.error(`[GeminiChat] handleRequestJson: Error calling Gemini API:`, err.message || error, { status: err.status, details: err.details });
      let errorMessage = "Virhe JSON-pyynnön lähetyksessä avustajalle.";
      if (err.response && typeof err.response.text === 'function') {
        try {
          const txt = await err.response.text();
          const data = JSON.parse(txt);
          if (data && data.error && data.error.message) {
            errorMessage = `API Virhe: ${data.error.message}`;
          }
        } catch (parseError) {
          console.error("[GeminiChat] handleRequestJson: Error parsing Gemini API error response text:", parseError);
        }
      }
      setMessages(prev => [...prev, { role: 'model', parts: [{text: errorMessage}] }]);
    } finally {
      setIsLoading(false);
      console.log("[GeminiChat] handleRequestJson: JSON request attempt finished.");
    }
  };

  const getInstructions = () => instructions;

  const handleStartSession = async () => {
    let promptText = '';
    const userId = user?.email || null;

    if (userId) {
      try {
        console.log(`[GeminiChat] User ${userId} logged in, attempting to load saved prompt.`);
        const loadedPrompt = await loadPrompt(userId);
        if (loadedPrompt !== null) {
          promptText = loadedPrompt;
          setInstructions(loadedPrompt); 
          console.log(`[GeminiChat] Loaded saved prompt for ${userId}.`);
        } else {
          console.log(`[GeminiChat] No saved prompt for ${userId}, loading default from /docs/gemini_instructions.md.`);
          const res = await fetch('/docs/gemini_instructions.md');
          if (!res.ok) throw new Error(`Failed to fetch default prompt: ${res.statusText}`);
          promptText = await res.text();
          setInstructions(promptText);
        }
      } catch (error) {
        console.error(`[GeminiChat] Error loading prompt for ${userId}, falling back to default:`, error);
        try {
          const res = await fetch('/docs/gemini_instructions.md');
          if (!res.ok) throw new Error(`Failed to fetch default prompt: ${res.statusText}`);
          promptText = await res.text();
          setInstructions(promptText);
        } catch (fetchError) {
          console.error("[GeminiChat] Error fetching default prompt after DB error:", fetchError);
          promptText = 'Ohjeen lataus epäonnistui. Kokeile myöhemmin uudelleen.';
          setInstructions(promptText);
        }
      }
    } else {
      console.log("[GeminiChat] User not logged in, loading default prompt from /docs/gemini_instructions.md.");
      try {
        const res = await fetch('/docs/gemini_instructions.md');
        if (!res.ok) throw new Error(`Failed to fetch default prompt: ${res.statusText}`);
        promptText = await res.text();
        setInstructions(promptText);
      } catch (err) {
        console.error("[GeminiChat] Error fetching default prompt for non-logged-in user:", err);
        promptText = 'Ohjeen lataus epäonnistui. Kokeile myöhemmin uudelleen.';
        setInstructions(promptText);
      }
    }

    console.log('[GeminiChat] Using initialization prompt (first 100 chars):', promptText.substring(0,100) + "...");
    setMessages([]);
    setSessionActive(true);
    setInput('');
    inputRef.current?.focus();
    setIsLoading(true);
    let imageDataUrl = '';
    let errorImageDataUrl = '';
    
    try {
      if (!imageUrl) {
        console.error("[GeminiChat] handleStartSession: imageUrl is missing when trying to start session!");
        throw new Error('imageUrl puuttuu chatin aloituksessa!');
      }
      imageDataUrl = await loadImageAsBase64(imageUrl);
      console.log("[GeminiChat] handleStartSession: Main image loaded as base64.");
      if (errorImageUrl) {
        errorImageDataUrl = await loadImageAsBase64(errorImageUrl);
        console.log("[GeminiChat] handleStartSession: Error image loaded as base64.");
      }
      const base64Data = imageDataUrl.split(',')[1];
      const errorBase64Data = errorImageDataUrl ? errorImageDataUrl.split(',')[1] : null;
      
      const initialMessageParts: Part[] = [{ text: promptText }]; 
      initialMessageParts.push({ inlineData: { data: base64Data, mimeType: 'image/jpeg' } });
      if (errorBase64Data) {
        initialMessageParts.push({ inlineData: { data: errorBase64Data, mimeType: 'image/jpeg' } });
      }

      const model = genAI.getGenerativeModel({
        model: geminiModel,
        generationConfig: { temperature: 0.2 },
      });
      
      console.log("[GeminiChat] handleStartSession: Sending initial message to Gemini model.");
      const result = await model.generateContent({ contents: [{ role: 'user', parts: initialMessageParts }], tools: [{ googleSearchRetrieval: {} }] });
      const response = result.response;
      if (response && response.candidates && response.candidates.length > 0) {
        const candidate = response.candidates[0];
        const content = candidate.content;
        let processedCitationMetadata: { citationSources: CitationSource[] } | undefined = undefined;

        if (candidate.citationMetadata && candidate.citationMetadata.citationSources && candidate.citationMetadata.citationSources.length > 0) {
            processedCitationMetadata = candidate.citationMetadata;
        } else if (candidate.groundingMetadata) {
            const sources: CitationSource[] = [];
            const supports = candidate.groundingMetadata.groundingSupports;
            const allChunks = candidate.groundingMetadata.groundingChunks;
            if (supports && Array.isArray(supports)) {
                supports.forEach((support: GroundingSupport) => {
                    if (support.segment && support.groundingChunkIndices && Array.isArray(support.groundingChunkIndices) && support.groundingChunkIndices.length > 0) {
                        const firstChunkIndex = support.groundingChunkIndices[0];
                        if (allChunks && Array.isArray(allChunks) && firstChunkIndex >= 0 && firstChunkIndex < allChunks.length) {
                            const chunk = allChunks[firstChunkIndex] as GroundingChunk;
                            const uri = chunk?.web?.uri || chunk?.uri;
                            if (uri) {
                                sources.push({ 
                                    startIndex: parseInt(support.segment.startIndex || '0', 10), 
                                    endIndex: parseInt(support.segment.endIndex || '0', 10), 
                                    uri: uri
                                });
                            } else {
                                console.warn('[GeminiChat] handleStartSession: Could not find URI in grounding chunk at index:', firstChunkIndex, 'Full chunk structure:', JSON.stringify(chunk, null, 2));
                            }
                        } else {
                             console.warn('[GeminiChat] handleStartSession: Invalid firstChunkIndex or allChunks not available/array for support:', support);
                        }
                    }
                });
            }
            if (sources.length > 0) {
                processedCitationMetadata = { citationSources: sources };
            } else if (candidate.groundingMetadata.webSearchQueries && candidate.groundingMetadata.webSearchQueries.length > 0) {
                 console.warn("[GeminiChat] handleStartSession: Found webSearchQueries in groundingMetadata, but could not derive specific citation sources from supports/chunks. Grounding may be general.");
            }
        }
        setMessages(prev => [...prev, { role: 'model', parts: content?.parts || [{text: "Sain tyhjän vastauksen."}], citationMetadata: processedCitationMetadata }]);
      } else {
        console.warn("[GeminiChat] handleStartSession: No valid candidates in Gemini response.");
        setMessages(prev => [...prev, { role: 'model', parts: [{text: "En saanut vastausta mallilta."}] }]);
      }
    } catch (error: unknown) {
      const err = error as { message?: string; status?: unknown; details?: unknown; response?: { text: () => Promise<string> } };
      console.error(`[GeminiChat] handleStartSession: Error calling Gemini API:`, err.message || error, { status: err.status, details: err.details });
      let errorMessage = "Virhe haettaessa vastausta avustajalta.";
      if (err.response && typeof err.response.text === 'function') {
        try {
          const txt = await err.response.text();
          const data = JSON.parse(txt);
          if (data && data.error && data.error.message) {
            errorMessage = `API Virhe: ${data.error.message}`;
          }
        } catch (parseError) {
          console.error("[GeminiChat] handleStartSession: Error parsing Gemini API error response text:", parseError);
        }
      }
      setMessages(prev => [...prev, { role: 'model', parts: [{text: errorMessage}] }]);
    } finally {
      setIsLoading(false);
      console.log("[GeminiChat] handleStartSession: Session start attempt finished.");
    }
  };

  const handleClearSession = () => {
    console.log("[GeminiChat] handleClearSession: Clearing chat session.");
    setMessages([]);
    setInput('');
    setSessionActive(false);
    setIsLoading(false); 
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    console.log("[GeminiChat] handleSend: Sending message.");
    const currentInput = input;
    const userMessage: Message = { role: 'user', parts: [{ text: currentInput }] };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    try {
      const model = genAI.getGenerativeModel({
        model: geminiModel,
        generationConfig: { temperature: 0.2 },
      });
      const history = messages.map(msg => ({ role: msg.role, parts: msg.parts }));
      const result = await model.generateContent({ contents: [...history, { role: 'user', parts: [{ text: currentInput }] }], tools: [{ googleSearchRetrieval: {} }] });
      const response = result.response;

      if (response && response.candidates && response.candidates.length > 0) {
        const candidate = response.candidates[0];
        const content = candidate.content;
        let processedCitationMetadata: { citationSources: CitationSource[] } | undefined = undefined;
        console.log('[GeminiChat] handleSend: Gemini API Response Metadata:', { /* ... metadata logging ... */ });

        if (candidate.citationMetadata && candidate.citationMetadata.citationSources && candidate.citationMetadata.citationSources.length > 0) {
            processedCitationMetadata = candidate.citationMetadata;
        } else if (candidate.groundingMetadata) {
            const sources: CitationSource[] = [];
            const supports = candidate.groundingMetadata.groundingSupports;
            const allChunks = candidate.groundingMetadata.groundingChunks;
            if (supports && Array.isArray(supports)) {
                supports.forEach((support: GroundingSupport) => {
                    if (support.segment && support.groundingChunkIndices && Array.isArray(support.groundingChunkIndices) && support.groundingChunkIndices.length > 0) {
                        const firstChunkIndex = support.groundingChunkIndices[0];
                        if (allChunks && Array.isArray(allChunks) && firstChunkIndex >= 0 && firstChunkIndex < allChunks.length) {
                            const chunk = allChunks[firstChunkIndex] as GroundingChunk;
                            const uri = chunk?.web?.uri || chunk?.uri;
                            if (uri) {
                                sources.push({ 
                                    startIndex: parseInt(support.segment.startIndex || '0', 10), 
                                    endIndex: parseInt(support.segment.endIndex || '0', 10), 
                                    uri: uri
                                });
                            } else {
                                console.warn('[GeminiChat] handleSend: Could not find URI in grounding chunk at index:', firstChunkIndex);
                            }
                        } else {
                            console.warn('[GeminiChat] handleSend: Invalid firstChunkIndex or allChunks not available/array for support.');
                        }
                    }
                });
            }
            if (sources.length > 0) {
                processedCitationMetadata = { citationSources: sources };
            } else if (candidate.groundingMetadata.webSearchQueries && candidate.groundingMetadata.webSearchQueries.length > 0) {
                console.warn("[GeminiChat] handleSend: Found webSearchQueries, but could not derive citation sources.");
            }
        }
        setMessages(prev => [...prev, { 
          role: 'model', 
          parts: content?.parts || [{text: "Sain tyhjän vastauksen."}], 
          citationMetadata: processedCitationMetadata 
        }]);
      } else {
        console.warn("[GeminiChat] handleSend: No valid candidates in Gemini response.");
        setMessages(prev => [...prev, { role: 'model', parts: [{text: "En saanut vastausta mallilta."}] }]);
      }
    } catch (error: unknown) {
      const err = error as { message?: string; status?: unknown; details?: unknown; response?: { text: () => Promise<string> } };
      console.error(`[GeminiChat] handleSend: Error calling Gemini API:`, err.message || error, { status: err.status, details: err.details });
      let errorMessage = "Virhe lähetettäessä viestiä avustajalle.";
      if (err.response && typeof err.response.text === 'function') {
        try {
          const txt = await err.response.text();
          const data = JSON.parse(txt);
          if (data && data.error && data.error.message) {
            errorMessage = `API Virhe: ${data.error.message}`;
          }
        } catch (parseError) {
          console.error("[GeminiChat] handleSend: Error parsing Gemini API error response text:", parseError);
        }
      }
      setMessages(prev => [...prev, { role: 'model', parts: [{text: errorMessage}] }]);
    } finally {
      setIsLoading(false);
      console.log("[GeminiChat] handleSend: Message send attempt finished.");
    }
  };

  return (
    <div className="border rounded-lg p-4 mt-8 bg-white shadow">
      <div className="flex gap-2 mb-4">
        <Button
          className={`transition-colors duration-200 ${sessionActive || isLoading || !imageUrl || !selectedClass
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-[#4ADE80] hover:bg-[#22C55E] text-white'}`}
          onClick={handleStartSession}
          disabled={sessionActive || isLoading || !imageUrl || !selectedClass}
        >
          Aloita chat
        </Button>
        <Button
          className="bg-gray-200 hover:bg-gray-300 text-gray-700"
          onClick={handleClearSession}
          disabled={!sessionActive}
        >
          Puhdista chat
        </Button>
      </div>
      <div className="h-[1200px] overflow-y-auto border rounded p-2 bg-gray-50 mb-4">
        {messages.length === 0 && <div className="text-gray-400 text-sm">Ei viestejä</div>}
        {messages
          .filter((msg, idx) => { // Filter out the initial system prompt from display
            if (idx === 0 && msg.role === 'user' && msg.parts.some(p => typeof p.text === 'string' && p.text.startsWith('Hei! Olen sinun henkilökohtainen kysynnänennusteavustajasi.'))) {
              // This is a heuristic, adjust if your actual initial prompt text is different or structured differently
              return false; 
            }
            return true;
          })
          .map((msg, idx) => (
            <div key={idx} className={`mb-2 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
              {msg.role === 'user' ? (
                msg.parts.map((part: Part, pidx: number) => (
                  <span key={pidx} className="inline-block px-3 py-2 rounded-lg max-w-full break-words whitespace-pre-wrap bg-[#4ADE80] text-white">
                    {part.text}
                  </span>
                ))
              ) : (
                <>
                  <span className="inline-block px-3 py-2 rounded-lg max-w-full break-words whitespace-pre-wrap bg-gray-200 text-gray-800">
                    {(() => {
                      const modelText = msg.parts.map(p => p.text || '').join('');
                      const citationResult = processTextWithCitations(modelText, msg.citationMetadata?.citationSources);
                      if (process.env.NODE_ENV === 'development') {
                        console.log('Rendering Model Message:', { /* ... metadata logging ... */ });
                      }
                      return (
                        <ReactMarkdown
                          components={{
                            a: ({ node, ...props }: { node?: unknown; [key: string]: unknown }) => (
                              <a {...props} className="text-blue-600 hover:text-blue-800 underline" target="_blank" rel="noopener noreferrer">{props.children}</a>
                            ),
                            ul: ({ node, ...props }: { node?: unknown; [key: string]: unknown }) => (
                              <ul {...props} className="list-disc pl-6" />
                            ),
                            li: ({ node, ...props }: { node?: unknown; [key: string]: unknown }) => (
                              <li {...props} className="mb-0 leading-tight" />
                            ),
                            p: ({ node, ...props }: { node?: unknown; [key: string]: unknown }) => (
                              <p {...props} className="mb-2" />
                            ),
                            strong: ({ node, ...props }: { node?: unknown; [key: string]: unknown }) => (
                              <strong {...props} className="font-bold" />
                            ),
                            em: ({ node, ...props }: { node?: unknown; [key: string]: unknown }) => (
                              <em {...props} className="italic" />
                            )
                          }}
                        >
                          {citationResult.processedText}
                        </ReactMarkdown>
                      );
                    })()}
                  </span>
                </>
              )}
            </div>
          ))}
        {isLoading && (
          <div className="flex items-center gap-2 text-gray-500 text-sm mt-2 animate-pulse">
            <Loader2 className="h-4 w-4 animate-spin" />
            Odottaa vastausta...
          </div>
        )}
      </div>
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          className="flex-1 border rounded px-3 py-2"
          placeholder="Kirjoita viesti..."
          value={input}
          onChange={e => setInput(e.target.value)}
          disabled={!sessionActive || isLoading}
          onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
        />
        <Button
          className="bg-[#4ADE80] hover:bg-[#22C55E] text-white"
          onClick={handleSend}
          disabled={!sessionActive || isLoading || !input.trim()}
        >
          Lähetä
        </Button>
        <Button
          className="bg-[#4ADE80] hover:bg-[#22C55E] text-white"
          onClick={handleRequestJson}
          disabled={!sessionActive || isLoading}
        >
          Pyydä json
        </Button>
        <ApplyCorrectionsButton chatContent={messages.map(m => m.parts?.map(p => p.text).join('\n')).join('\n\n')} onCorrectionsApplied={onCorrectionsApplied} />
      </div>
    </div>
  );
};

export default GeminiChat;
