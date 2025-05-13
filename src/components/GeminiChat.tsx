import React, { useState, useRef } from 'react';
import { GoogleGenerativeAI, Part } from '@google/generative-ai';
import { Loader2 } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import ApplyCorrectionsButton from './ApplyCorrectionsButton';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
const geminiModel = import.meta.env.VITE_GEMINI_MODEL || 'gemini-2.5-pro-preview-03-25';

const genAI = new GoogleGenerativeAI(apiKey);

interface CitationSource {
  startIndex?: number;
  endIndex?: number;
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

const processTextWithCitations = (text: string, sources: CitationSource[] | undefined): { processedText: string; sourceMap: Map<number, CitationSource> } => {
  if (!sources || sources.length === 0) {
    return { processedText: text, sourceMap: new Map() };
  }
  const sortedSources = [...sources]
    .filter(s => s.startIndex !== undefined && s.endIndex !== undefined)
    .sort((a, b) => { 
      if (a.startIndex! !== b.startIndex!) {
        return a.startIndex! - b.startIndex!;
      }
      return b.endIndex! - a.endIndex!;
    });
  let processedText = '';
  let lastIndex = 0;
  const sourceMap = new Map<number, CitationSource>();
  let citationCounter = 1;
  for (const source of sortedSources) {
    const currentStartIndex = source.startIndex!;
    const currentEndIndex = source.endIndex!;
    if (currentStartIndex < lastIndex) {
      console.warn("[GeminiChat] processTextWithCitations: Skipping overlapping or out-of-order source:", source);
      continue;
    }
    processedText += text.substring(lastIndex, currentStartIndex);

    let trueWordEndIndex = currentEndIndex;
    let scanPos = currentEndIndex;
    while(scanPos < text.length && !/[\s.,!?;:()[\]{}]/.test(text[scanPos])) {
        scanPos++;
    }
    trueWordEndIndex = scanPos;
    
    const textToShowWithMarker = text.substring(currentStartIndex, trueWordEndIndex);
    processedText += textToShowWithMarker;

    const marker = source.uri ? ` [${citationCounter}](${source.uri})` : ` [${citationCounter}]`;
    processedText += marker;

    sourceMap.set(citationCounter, source);
    citationCounter++;
    lastIndex = trueWordEndIndex;
  }

  if (lastIndex < text.length) {
    processedText += text.substring(lastIndex);
  }

  return { processedText, sourceMap };
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

  const getInstructions = () => {
    const baseInstructions = `Hei! Olen sinun henkilökohtainen kysynnänennusteavustajasi. Tehtäväni on auttaa sinua, myynnin ennustajaa, analysoimaan dataa ja tekemään perusteltuja ennustekorjauksia.
     Aloita aina yllä olevalla esittelyllä vain ja ainoastaan ensimmäisessä viestissäsi. Vastaa aina suomeksi.\n\nAnalysoi aluksi toimitetut kuvaajat. Kerro käyttäjälle kuvan tuotteista, tuoteryhmästä tai selvitä verkosta (ja mainitse löytämäsi lähteet), minkälaisia lopputuotteita ryhmään kuuluu. 
       Analyysissäsi ota kantaa kysynnän ennustettavuuteen, näyttääkö tilastollinen ennuste optimistiselta vai pessimistiseltä ja onko ennustevirhe trendi pienenevä vai kasvava.\n\nAnalysoituasi kuvaajat, kerro käyttäjälle, että voit syventää analyysia tekemällä Google-haut seuraavista aiheista, ja VIITTAA LÖYTÄMIISI LÄHTEISIIN API:n maadoitusominaisuuden kautta:
+(HUOM: On erittäin tärkeää, että palautat tarkat lähdeviitteet groundingMetadata.groundingChunks-objektin kautta, jotta voin näyttää ne käyttäjälle.)
 (1) Omien ja kilpailijoiden alennuskampanjat, (2) Omien ja kilpailijoiden substituuttituotteiden tuotelanseeraukset, (3) Omien ja kilpailijoiden markkinointikampanjat sekä jakelijoiden ilmoitukset, (4) Omien ja kilpailijoiden lehtiartikkelit ja (5) Kysyntään vaikuttavat makrotalousindikaattorit ja niiden muutokset.\nPyydä käyttäjää vahvistamaan, että hän haluaa sinun jatkavan näillä hauilla.\n\nKun makrotalousindikaattorit ja ennusteeseen vaikuttavat uutiset on käyty läpi (ja lähteisiin on viitattu), ehdota käyttäjälle, että voit antaa perustellut ennustekorjaukset JSON-muodossa.
 
 Tutkimus tulee tehdä vain sille aikavälille jolle valokuvassa on "Tilastollinen ennuste" - dataa (Keltainen käyrä). Älä esitä siis lähteenä yli 6kk vanhoja uutisia tai tutkimuksia makrotaloudesta. 
 
 \n\nKuvaajien selitteet:
Kuvaaja 1: Kysynnän historia ja ennusteet.
- Sininen viiva: Toteutunut kysyntä
- Oranssi katkoviiva: Tilastollinen ennuste
- Punainen viiva: Korjattu ennuste
- Punainen katkoviiva: Ennustevirhe
Kuvaaja 2: Ennustevirhe.
- Sininen viiva: Keskimääräinen absoluuttinen ennustevirhe (kpl)
- Oranssi viiva: % tuotteista, joilla ennustevirhe on alle 20%\n\n`;

    let contextInstructions = '';
    if (selectedProducts && selectedProducts.length > 0) {
      contextInstructions = `\nValitut tuotteet: ${selectedProducts.map(p => `${p.code} - ${p.description}`).join(', ')}\n`;
      if (selectedGroups && selectedGroups.length > 0) contextInstructions += `Tuoteryhmät: ${selectedGroups.join(', ')}\n`;
      if (selectedClass) contextInstructions += `Tuoteluokka: ${selectedClass}\n`;
    } else if (selectedGroups && selectedGroups.length > 0) {
      contextInstructions = `\nValitut tuoteryhmät: ${selectedGroups.join(', ')}\n`;
      if (selectedClass) contextInstructions += `Tuoteluokka: ${selectedClass}\n`;
    } else if (selectedClass) {
      contextInstructions = `\nValittu tuoteluokka: ${selectedClass}\n`;
    }

    const jsonInstructions = {
      class: `JSON:n tulee olla seuraavassa muodossa:\n\n{
  "prod_class": "${selectedClass || 'Virtalähteet'}",
  "month": "2025-08",
  "correction_percent": -2,
  "explanation": "Esimerkki: Alkuperäisessä ennusteessa kysyntä laskee jyrkästi huipun jälkeen. Koska talouden ja teollisuuden elpymisen odotetaan jatkuvan tasaisemmin läpi vuoden 2025, ehdotan pieniä positiivisia korjauksia heijastamaan vakaampaa kehitystä ja estämään liian jyrkkää pudotusta ennusteessa.",
  "forecast_corrector": "forecasting@kemppi.com"
}\n\nJos annetaan vain prod_class, korjaus kohdistetaan kaikkiin kyseisen luokan tuotteisiin.`,
      group: `JSON:n tulee olla seuraavassa muodossa:\n\n{
  "prod_class": "${selectedClass || 'Virtalähteet'}",
  "product_group": "${selectedGroups?.[0] || '10504 MINARCMIG SINGLE PHASE'}",
  "month": "2025-08",
  "correction_percent": -2,
  "explanation": "Esimerkki: Alkuperäisessä ennusteessa kysyntä laskee jyrkästi huipun jälkeen. Koska talouden ja teollisuuden elpymisen odotetaan jatkuvan tasaisemmin läpi vuoden 2025, ehdotan pieniä positiivisia korjauksia heijastamaan vakaampaa kehitystä ja estämään liian jyrkkää pudotusta ennusteessa.",
  "forecast_corrector": "forecasting@kemppi.com"
}\n\nHuom: product_group tulee olla sama kuin datassa.`,
      product: `JSON:n tulee olla seuraavassa muodossa:\n\n{
  "prod_class": "${selectedClass || 'Virtalähteet'}",
  "product_group": "${selectedGroups?.[0] || '10504 MINARCMIG SINGLE PHASE'}",
  "product_code": "${selectedProducts?.[0]?.code || '61008200'}",
  "month": "2025-08",
  "correction_percent": -2,
  "explanation": "Esimerkki: Alkuperäisessä ennusteessa kysyntä laskee jyrkästi huipun jälkeen. Koska talouden ja teollisuuden elpymisen odotetaan jatkuvan tasaisemmin läpi vuoden 2025, ehdotan pieniä positiivisia korjauksia heijastamaan vakaampaa kehitystä ja estämään liian jyrkkää pudotusta ennusteessa.",
  "forecast_corrector": "forecasting@kemppi.com"
}\n\nHuom: product_group tulee olla sama kuin datassa kyseiselle product_code:lle.`
    };

    const endInstructions = `\n\nKorjaukset tulee rajata vain sille aikavälille jolle valokuvassa on "Tilastollinen ennuste" - dataa (Keltainen käyrä), ja niitä tulee antaa vain niille kuukausille, joiden osalta uskot korjauksen olevan perusteltu. 
 `;

    return baseInstructions + contextInstructions + jsonInstructions[chartLevel] + endInstructions;
  };

  const handleStartSession = async () => {
    console.log("[GeminiChat] handleStartSession: Attempting to start new session.");
    setMessages([]);
    setSessionActive(true);
    setInput('');
    inputRef.current?.focus();
    setIsLoading(true);
    let imageDataUrl = '';
    let errorImageDataUrl = '';
    let initialMessageParts: Part[] = [];
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
        { text: getInstructions() } as Part,
        { inlineData: { data: base64Data, mimeType: 'image/jpeg' } } as Part
      ];
      if (errorBase64Data) {
        initialMessageParts.push({ inlineData: { data: errorBase64Data, mimeType: 'image/jpeg' } } as Part);
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
                                    uri: uri,
                                    license: chunk?.license 
                                });
                  } else {
                                console.warn('[GeminiChat] handleStartSession: Could not find URI in grounding chunk at index:', firstChunkIndex, 'Full chunk structure:', JSON.stringify(chunk, null, 2));
              }
          } else {
                             console.warn('[GeminiChat] handleStartSession: Invalid firstChunkIndex or allChunks not available/array for support:', support);
                        }
                    } else if (support.uri) { 
                        sources.push({ uri: support.uri, license: support.license });
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

        if (candidate.citationMetadata && candidate.citationMetadata.citationSources && candidate.citationMetadata.citationSources.length > 0) {
            processedCitationMetadata = candidate.citationMetadata;
        } else if (candidate.groundingMetadata) {
            const sources: CitationSource[] = [];
            const supports = candidate.groundingMetadata.groundingSupports;
            const allChunks = candidate.groundingMetadata.groundingChunks;

            if (supports && Array.isArray(supports)) {
                supports.forEach(support => {
                    if (support.segment && support.groundingChunkIndices && Array.isArray(support.groundingChunkIndices) && support.groundingChunkIndices.length > 0) {
                        const firstChunkIndex = support.groundingChunkIndices[0];
                        if (allChunks && Array.isArray(allChunks) && firstChunkIndex >= 0 && firstChunkIndex < allChunks.length) {
                            const chunk = allChunks[firstChunkIndex] as any;
                            const uri = chunk?.web?.uri || chunk?.uri;
                            if (uri) {
                                sources.push({ 
                                    startIndex: parseInt(support.segment.startIndex || '0', 10), 
                                    endIndex: parseInt(support.segment.endIndex || '0', 10), 
                                    uri: uri,
                                    license: chunk?.license 
                                });
                            } else {
                                console.warn('[GeminiChat] handleSend: Could not find URI in grounding chunk at index:', firstChunkIndex, 'Full chunk structure:', JSON.stringify(chunk, null, 2));
                            }
                        } else {
                            console.warn('[GeminiChat] handleSend: Invalid firstChunkIndex or allChunks not available/array for support:', support);
                        }
                    } else if (support.uri) { 
                        sources.push({ uri: support.uri, license: support.license });
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
        <button
          className={`px-4 py-2 rounded transition-colors duration-200 ${sessionActive || isLoading || !imageUrl || !selectedClass
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-[#4ADE80] hover:bg-[#22C55E] text-white'}`}
          onClick={handleStartSession}
          disabled={sessionActive || isLoading || !imageUrl || !selectedClass}
        >
          Aloita chat
        </button>
        <button
          className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded"
          onClick={handleClearSession}
          disabled={!sessionActive || isLoading}
        >
          Puhdista chat
        </button>
        <ApplyCorrectionsButton chatContent={messages.map(m => m.parts?.map(p => p.text).join('\n')).join('\n\n')} onCorrectionsApplied={onCorrectionsApplied} />
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
                      console.log('Rendering Model Message:', {
                        originalText: modelText.length > 100 ? modelText.substring(0, 100) + '...' : modelText,
                        citationMetadata: msg.citationMetadata,
                        processedText: citationResult.processedText.length > 100 ? citationResult.processedText.substring(0, 100) + '...' : citationResult.processedText,
                        fullProcessedTextForDebug: citationResult.processedText,
                        sourceMap: citationResult.sourceMap
                      });
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
        <button
          className="bg-[#4ADE80] hover:bg-[#22C55E] text-white px-4 py-2 rounded"
          onClick={handleSend}
          disabled={!sessionActive || isLoading || !input.trim()}
        >
          Lähetä
        </button>
      </div>
    </div>
  );
};

export default GeminiChat; 