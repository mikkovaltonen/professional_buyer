import React, { useState, useRef } from 'react';
import { GoogleGenerativeAI, Part } from '@google/generative-ai';
import { Loader2 } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import ApplyCorrectionsButton from './ApplyCorrectionsButton';
import { Button } from '@/components/ui/button';

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
      // Append text from the original string that comes before this citation's word
      if (source.startIndex > lastProcessedEnd) {
        resultText += text.substring(lastProcessedEnd, source.startIndex);
      }
      
      // Find the actual end of the word the citation pertains to
      let currentWordEndIndex = source.endIndex;
      while (currentWordEndIndex < text.length && text[currentWordEndIndex].trim() !== '') {
        currentWordEndIndex++;
      }
      
      // The text segment forming the word (or words if citation spans multiple) to be displayed before the link
      const wordCited = text.substring(source.startIndex, currentWordEndIndex);
      
      const linkText = `[lähde ${citationNumber++}]`;
      const linkMarkdown = `(${linkText}(${source.uri}))`; // Formats as: ([lähde X])(URL)
      
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

  const loadInstructions = async () => {
    try {
      const res = await fetch('/docs/gemini_instructions.md');
      const text = await res.text();
      setInstructions(text);
    } catch (err) {
      setInstructions('Ohjeen lataus epäonnistui.');
    }
  };

  const buildRequestPayload = () => {
    const base: any = {
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

    if (chartLevel === 'product') {
      base.product_code =
        selectedProducts && selectedProducts.length > 0 && selectedProducts[0].code
          ? selectedProducts[0].code
          : 'N/A';
    }

    const ordered: any = { prod_class: base.prod_class };
    if (base.product_group) ordered.product_group = base.product_group;
    if (base.product_code) ordered.product_code = base.product_code;
    ordered.month = base.month;
    ordered.correction_percent = base.correction_percent;
    ordered.explanation = base.explanation;
    ordered.forecast_corrector = base.forecast_corrector;

    return ordered;
  };

  const handleRequestJson = async () => {
    console.log("[GeminiChat] handleRequestJson: Initiating JSON request.");
    setIsLoading(true);

    const payload = buildRequestPayload();

    const jsonString = JSON.stringify(payload, null, 2);
    const fullMessageString = `Anna tutkimukseesi perustuva paras arvauksesi tilastollisen kysyntäennusteen korjauksesta. Lisääthän myös kuukauden yhdelle riville. JSON-muoto on alla:\n\`\`\`json\n${jsonString}\n\`\`\``;

    const userMessage: Message = { role: 'user', parts: [{ text: fullMessageString }] };
    setMessages(prev => [...prev, userMessage]);

    try {
      const model = genAI.getGenerativeModel({
        model: geminiModel,
        generationConfig: { temperature: 0.2 },
        tools: [ { googleSearch: {} } as any ]
      });

      const history = messages.map(msg => ({ // messages state before adding the current userMessage
        role: msg.role,
        parts: msg.parts
      }));

      console.log("[GeminiChat] handleRequestJson: Sending message to Gemini model with payload:", payload);
      const result = await model.generateContent({
        contents: [
          ...history,
          { role: 'user', parts: [{ text: fullMessageString }] }
        ]
      });
      
      const response = result.response;

      if (response && response.candidates && response.candidates.length > 0) {
        const candidate = response.candidates[0];
        const content = candidate.content;
        let processedCitationMetadata: { citationSources: CitationSource[] } | undefined = undefined;

        // Logic for citation metadata (adapted from handleSend)
        if (candidate.citationMetadata && candidate.citationMetadata.citationSources && candidate.citationMetadata.citationSources.length > 0) {
            processedCitationMetadata = candidate.citationMetadata;
        } else if (candidate.groundingMetadata) {
            const sources: CitationSource[] = [];
            const supports = candidate.groundingMetadata.groundingSupports;
            const allChunks = candidate.groundingMetadata.groundingChunks;
            if (supports && Array.isArray(supports)) {
                supports.forEach((support: any) => {
                    if (support.segment && support.groundingChunkIndices && Array.isArray(support.groundingChunkIndices) && support.groundingChunkIndices.length > 0) {
                        const firstChunkIndex = support.groundingChunkIndices[0];
                        if (allChunks && Array.isArray(allChunks) && firstChunkIndex >= 0 && firstChunkIndex < allChunks.length) {
                            const chunk = allChunks[firstChunkIndex] as any;
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
    } catch (error: any) {
      console.error(`[GeminiChat] handleRequestJson: Error calling Gemini API:`, error.message || error, { status: error.status, details: error.details });
      let errorMessage = "Virhe JSON-pyynnön lähetyksessä avustajalle.";
      if (error.response && typeof error.response.text === 'function') {
        try {
          const txt = await error.response.text();
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
    // Lataa ohje suoraan ja käytä sitä heti
    let promptText = '';
    try {
      const res = await fetch('/docs/gemini_instructions.md');
      promptText = await res.text();
      setInstructions(promptText); // säilytä myöhempää käyttöä varten
    } catch (err) {
      promptText = 'Ohjeen lataus epäonnistui.';
      setInstructions(promptText);
    }
    console.log('[GeminiChat] Käytettävä initialisointi-prompt (ohje):', promptText);
    setMessages([]);
    setSessionActive(true);
    setInput('');
    inputRef.current?.focus();
    setIsLoading(true);
    let imageDataUrl = '';
    let errorImageDataUrl = '';
    let initialMessageParts = [];
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
      const model = genAI.getGenerativeModel({
        model: geminiModel,
        generationConfig: { temperature: 0.2 },
        tools: [ { googleSearch: {} } as any ]
      });
      initialMessageParts = [
        { text: promptText },
        { inlineData: { data: base64Data, mimeType: 'image/jpeg' } }
      ];
      if (errorBase64Data) {
        initialMessageParts.push({ inlineData: { data: errorBase64Data, mimeType: 'image/jpeg' } });
      }
      console.log("[GeminiChat] handleStartSession: Sending initial message to Gemini model.");
      const result = await model.generateContent({ contents: [{ role: 'user', parts: initialMessageParts }] });
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
                supports.forEach((support: any) => {
                    if (support.segment && support.groundingChunkIndices && Array.isArray(support.groundingChunkIndices) && support.groundingChunkIndices.length > 0) {
                        const firstChunkIndex = support.groundingChunkIndices[0];
                        if (allChunks && Array.isArray(allChunks) && firstChunkIndex >= 0 && firstChunkIndex < allChunks.length) {
                            const chunk = allChunks[firstChunkIndex] as any;
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
          } else {
            }
        } else {
        }
        setMessages(prev => [...prev, { role: 'model', parts: content?.parts || [{text: "Sain tyhjän vastauksen."}], citationMetadata: processedCitationMetadata }]);
      } else {
        console.warn("[GeminiChat] handleStartSession: No valid candidates in Gemini response.");
        setMessages(prev => [...prev, { role: 'model', parts: [{text: "En saanut vastausta mallilta."}] }]);
      }
    } catch (error: any) {
      console.error(`[GeminiChat] handleStartSession: Error calling Gemini API:`, error.message || error, { status: error.status, details: error.details });
      let errorMessage = "Virhe haettaessa vastausta avustajalta.";
      if (error.response && typeof error.response.text === 'function') {
        try {
          const txt = await error.response.text();
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
        tools: [ { googleSearch: {} } as any ]
      });
      
      // Convert message history to the correct format
      const history = messages.map(msg => ({
        role: msg.role,
        parts: msg.parts
      }));
      
      // Add the current message
      const result = await model.generateContent({
        contents: [
          ...history,
          { role: 'user', parts: [{ text: currentInput }] }
        ]
      });
      
      const response = result.response;

      if (response && response.candidates && response.candidates.length > 0) {
        const candidate = response.candidates[0];
        const content = candidate.content;
        let processedCitationMetadata: { citationSources: CitationSource[] } | undefined = undefined;

        // Add detailed logging for Gemini API response metadata
        console.log('[GeminiChat] handleSend: Gemini API Response Metadata:', {
          hasCitationMetadata: !!candidate.citationMetadata,
          citationSourcesCount: candidate.citationMetadata?.citationSources?.length || 0,
          hasGroundingMetadata: !!candidate.groundingMetadata,
          groundingMetadata: candidate.groundingMetadata ? {
            hasWebSearchQueries: !!candidate.groundingMetadata.webSearchQueries,
            webSearchQueriesCount: candidate.groundingMetadata.webSearchQueries?.length || 0,
            hasGroundingSupports: !!candidate.groundingMetadata.groundingSupports,
            supportsCount: candidate.groundingMetadata.groundingSupports?.length || 0,
            hasGroundingChunks: !!candidate.groundingMetadata.groundingChunks,
            chunksCount: candidate.groundingMetadata.groundingChunks?.length || 0,
            fullGroundingMetadata: candidate.groundingMetadata
          } : null
        });

        if (candidate.citationMetadata && candidate.citationMetadata.citationSources && candidate.citationMetadata.citationSources.length > 0) {
            processedCitationMetadata = candidate.citationMetadata;
            console.log('[GeminiChat] handleSend: Using citationMetadata from response:', processedCitationMetadata);
        } else if (candidate.groundingMetadata) {
            const sources: CitationSource[] = [];
            const supports = candidate.groundingMetadata.groundingSupports;
            const allChunks = candidate.groundingMetadata.groundingChunks;

            console.log('[GeminiChat] handleSend: Processing groundingMetadata:', {
                supports: supports?.length || 0,
                chunks: allChunks?.length || 0
            });

            if (supports && Array.isArray(supports)) {
                supports.forEach((support: any) => {
                    if (support.segment && support.groundingChunkIndices && Array.isArray(support.groundingChunkIndices) && support.groundingChunkIndices.length > 0) {
                        const firstChunkIndex = support.groundingChunkIndices[0];
                        if (allChunks && Array.isArray(allChunks) && firstChunkIndex >= 0 && firstChunkIndex < allChunks.length) {
                            const chunk = allChunks[firstChunkIndex] as any;
                            const uri = chunk?.web?.uri || chunk?.uri;
                            if (uri) {
                                sources.push({ 
                                    startIndex: parseInt(support.segment.startIndex || '0', 10), 
                                    endIndex: parseInt(support.segment.endIndex || '0', 10), 
                                    uri: uri
                                });
                            } else {
                                console.warn('[GeminiChat] handleSend: Could not find URI in grounding chunk at index:', firstChunkIndex, 'Full chunk structure:', JSON.stringify(chunk, null, 2));
                            }
                        } else {
                            console.warn('[GeminiChat] handleSend: Invalid firstChunkIndex or allChunks not available/array for support:', support);
                        }
                    }
                });
            }
            if (sources.length > 0) {
                processedCitationMetadata = { citationSources: sources };
            } else if (candidate.groundingMetadata.webSearchQueries && candidate.groundingMetadata.webSearchQueries.length > 0) {
                console.warn("[GeminiChat] handleSend: Found webSearchQueries in groundingMetadata, but could not derive specific citation sources from supports/chunks. Grounding may be general.");
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
    } catch (error: any) {
      console.error(`[GeminiChat] handleSend: Error calling Gemini API:`, error.message || error, { status: error.status, details: error.details });
      let errorMessage = "Virhe lähetettäessä viestiä avustajalle.";
      if (error.response && typeof error.response.text === 'function') {
        try {
          const txt = await error.response.text();
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
          .filter((msg, idx) => {
            if (idx !== 0) return true;
            if (msg.role === 'user' && Array.isArray(msg.parts) && msg.parts.length <= 3 && msg.parts.some(p => typeof p.text === 'string' && p.text.includes('Hei! Olen sinun henkilökohtainen kysynnänennusteavustajasi.'))) {
              return false;
            }
            return true;
          })
          .map((msg, idx) => (
            <div key={idx} className={`mb-2 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
              {msg.role === 'user' ? (
                msg.parts.map((part: any, pidx: number) => (
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
                        console.log('Rendering Model Message:', {
                          originalText: modelText.length > 100 ? modelText.substring(0, 100) + '...' : modelText,
                          citationMetadata: msg.citationMetadata,
                          processedText: citationResult.processedText.length > 100 ? citationResult.processedText.substring(0, 100) + '...' : citationResult.processedText,
                          sourceMap: citationResult.sourceMap
                        });
                      }
                      return (
                        <ReactMarkdown
                          components={{
                            a: ({ node, ...props }) => (
                              <a {...props} className="text-blue-600 hover:text-blue-800 underline" target="_blank" rel="noopener noreferrer">{props.children}</a>
                            ),
                            ul: ({ node, ...props }) => (
                              <ul {...props} className="list-disc pl-6" />
                            ),
                            li: ({ node, ...props }) => (
                              <li {...props} className="mb-0 leading-tight" />
                            ),
                            p: ({ node, ...props }) => (
                              <p {...props} className="mb-2" />
                            ),
                            strong: ({ node, ...props }) => (
                              <strong {...props} className="font-bold" />
                            ),
                            em: ({ node, ...props }) => (
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