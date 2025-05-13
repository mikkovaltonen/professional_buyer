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

  let processedText = '';
  let lastIndex = 0;
  const sourceMap = new Map<number, CitationSource>();
  let citationCounter = 1;

  const sortedSources = [...sources]
    .filter(s => s.endIndex !== undefined && s.startIndex !== undefined)
    .sort((a, b) => (a.endIndex!) - (b.endIndex!));

  sortedSources.forEach(source => {
    const endIndex = source.endIndex!;
    const startIndex = source.startIndex!;

    if (startIndex >= lastIndex && endIndex > startIndex && endIndex <= text.length) {
      processedText += text.substring(lastIndex, startIndex);
      const originalSegment = text.substring(startIndex, endIndex);
      const marker = source.uri ? ` [${citationCounter}](${source.uri})` : ` [${citationCounter}]`;
      processedText += originalSegment + marker;
      sourceMap.set(citationCounter, source);
      citationCounter++;
      lastIndex = endIndex;
    }
  });

  processedText += text.substring(lastIndex);
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

  // Lataa kuva base64-muotoon
  const loadImageAsBase64 = async (imagePath: string): Promise<string> => {
    if (!imagePath) throw new Error('imageUrl puuttuu!');
    if (imagePath.startsWith('data:image/')) {
      // Jos jo base64, palauta suoraan
      return imagePath; // Return the full data URL
    }
    if (imagePath.startsWith('blob:')) {
      // Blob-url pitää lukea fetchillä ja FileReaderilla
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
    // Oletetaan että imagePath on tiedostopolku
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

  // Dynaaminen ohjeistus kuvan tason mukaan
  const getInstructions = () => {
    const baseInstructions = `Hei! Olen sinun henkilökohtainen kysynnänennusteavustajasi. Tehtäväni on auttaa sinua, myynnin ennustajaa, analysoimaan dataa ja tekemään perusteltuja ennustekorjauksia.
     Aloita aina yllä olevalla esittelyllä vain ja ainoastaan ensimmäisessä viestissäsi. ÄLÄ käytä mitään tervehdystä (kuten 'Hyvä asiakas', 'Hei taas', 'Arvoisa ennustaja' tms.) tai esittelyä enää tämän jälkeen, vaan siirry suoraan asiaan.
     Kommunikoi asiallisesti ja ammattimaisesti, mutta vältä liiallista muodollisuutta tai asiakaspalveluhenkistä kieltä myöhemmissä vastauksissa. Sinä olet asiantuntija-avustaja, et asiakaspalvelija.
     Älä koskaan aloita epämuodollisesti, kuten 'Selvä juttu', 'Totta kai', 'Katsotaanpa', 'No niin', 'Tarkastellaanpa' tms.
       Vastaa aina suomeksi.\n\nAnalysoi aluksi toimitetut kuvaajat. Kerro käyttäjälle kuvan tuotteista, tuoteryhmästä tai selvitä verkosta (ja mainitse löytämäsi lähteet), minkälaisia lopputuotteita ryhmään kuuluu. 
       Analyysissäsi ota kantaa kysynnän ennustettavuuteen, näyttääkö tilastollinen ennuste optimistiselta vai pessimistiseltä ja onko ennustevirhe trendi pienenevä vai kasvava.\n\nAnalysoituasi kuvaajat, kerro käyttäjälle, että voit syventää analyysia tekemällä Google-haut seuraavista aiheista, ja VIITTAA LÖYTÄMIISI LÄHTEISIIN API:n maadoitusominaisuuden kautta:
+(HUOM: On erittäin tärkeää, että palautat tarkat lähdeviitteet groundingMetadata.groundingChunks-objektin kautta, jotta voin näyttää ne käyttäjälle.)
 (1) Omien ja kilpailijoiden alennuskampanjat, (2) Omien ja kilpailijoiden substituuttituotteiden tuotelanseeraukset, (3) Omien ja kilpailijoiden markkinointikampanjat sekä jakelijoiden ilmoitukset, (4) Omien ja kilpailijoiden lehtiartikkelit ja (5) Kysyntään vaikuttavat makrotalousindikaattorit ja niiden muutokset.\nPyydä käyttäjää vahvistamaan, että hän haluaa sinun jatkavan näillä hauilla.\n\nKun makrotalousindikaattorit ja ennusteeseen vaikuttavat uutiset on käyty läpi (ja lähteisiin on viitattu), ehdota käyttäjälle, että voit antaa perustellut ennustekorjaukset JSON-muodossa.\n\nKuvaajien selitteet:
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

  // Aloita uusi chat-sessio
  const handleStartSession = async () => {
    setMessages([]);
    setSessionActive(true);
    setInput('');
    inputRef.current?.focus();
    setIsLoading(true);
    let imageDataUrl = '';
    let errorImageDataUrl = '';
    let initialMessage: any[] = [];
    try {
      // Ladataan kuva data URL muotoon
      if (!imageUrl) throw new Error('imageUrl puuttuu chatin aloituksessa!');
      imageDataUrl = await loadImageAsBase64(imageUrl);
      if (errorImageUrl) {
        errorImageDataUrl = await loadImageAsBase64(errorImageUrl);
      }

      const base64Data = imageDataUrl.split(',')[1];
      const errorBase64Data = errorImageDataUrl ? errorImageDataUrl.split(',')[1] : null;
      const model = genAI.getGenerativeModel({
        model: geminiModel,
        generationConfig: {
          temperature: 0.2
        },
        tools: [ { googleSearch: {} } as any ]
      });
      initialMessage = [
        { text: getInstructions() } as Part,
        { inlineData: { data: base64Data, mimeType: 'image/jpeg' } } as Part
      ];
      if (errorBase64Data) {
        initialMessage.push({ inlineData: { data: errorBase64Data, mimeType: 'image/jpeg' } } as Part);
      }
      const result = await model.generateContent(initialMessage);
      const response = await result.response;
      
      if (response && response.candidates && response.candidates.length > 0) {
        const candidate = response.candidates[0];
        console.log('Candidate (handleStartSession):', JSON.stringify(candidate, null, 2));
        const content = candidate.content;
        let processedCitationMetadata: { citationSources: CitationSource[] } | undefined = undefined;

        if (candidate.citationMetadata && candidate.citationMetadata.citationSources) {
          // Use existing citationMetadata if available
          processedCitationMetadata = candidate.citationMetadata as { citationSources: CitationSource[] };
          console.log('Using direct citationMetadata (handleStartSession):', processedCitationMetadata);
        } else if (candidate.groundingMetadata && candidate.groundingMetadata.groundingSupports) { // Check for groundingSupports first
          const supports = candidate.groundingMetadata.groundingSupports;
          const allChunks = candidate.groundingMetadata.groundingChunks; // This might be undefined

          if (allChunks && allChunks.length > 0) {
            // Scenario 1: We have groundingChunks (preferred)
            console.log('Found groundingMetadata with chunks, processing (handleStartSession):', candidate.groundingMetadata);
            const sources: CitationSource[] = supports.map((support: any) => {
              if (support.segment && support.groundingChunkIndices && support.groundingChunkIndices.length > 0) {
                const firstChunkIndex = support.groundingChunkIndices[0];
                if (firstChunkIndex >= 0 && firstChunkIndex < allChunks.length) {
                  const chunk = allChunks[firstChunkIndex] as any;
                  const uri = chunk?.web?.uri;
                  if (uri) {
                    const sourceObj = { startIndex: support.segment.startIndex, endIndex: support.segment.endIndex, uri: uri };
                    console.log('Successfully created CitationSource from chunk:', sourceObj);
                    return sourceObj;
                  } else {
                    console.warn('Could not find URI in grounding chunk at index:', firstChunkIndex, 'Full chunk structure:', JSON.stringify(chunk, null, 2));
                  }
                }
              }
              return null;
            }).filter((source: CitationSource | null): source is CitationSource => source !== null);
            if (sources.length > 0) processedCitationMetadata = { citationSources: sources };

          } else {
            // Scenario 2: We only have groundingSupports, try to find URI directly in support objects
            console.log('Found groundingMetadata with supports but no/empty chunks, trying direct URIs from supports (handleStartSession):', supports);
            const sources: CitationSource[] = supports.map((support: any) => {
              if (support.segment) {
                // Attempt to find URI directly in support object - paths are speculative
                const uri = support.uri || support.web?.uri || support.webAccess?.uri || support.retrieval?.uri;
                if (uri) {
                  const sourceObj = { startIndex: support.segment.startIndex, endIndex: support.segment.endIndex, uri: uri };
                  console.log('Successfully created CitationSource directly from support:', sourceObj);
                  return sourceObj;
                } else {
                  console.warn('Could not find URI directly in support object. Support structure:', JSON.stringify(support, null, 2));
                }
              }
              return null;
            }).filter((source: CitationSource | null): source is CitationSource => source !== null);
            if (sources.length > 0) processedCitationMetadata = { citationSources: sources };
          }

          if (processedCitationMetadata) {
            console.log('Processed citationMetadata from groundingMetadata (handleStartSession):', processedCitationMetadata);
          } else {
            console.log('Could not derive citation sources from groundingMetadata (handleStartSession).');
          }
        }

        setMessages([
          { role: 'user' as const, parts: initialMessage },
          { 
            role: 'model' as const,
            parts: content.parts,
            citationMetadata: processedCitationMetadata
          }
        ]);
      } else {
        const fallbackText = response?.text() ?? 'Vastauksen käsittely epäonnistui.';
        setMessages([
          { role: 'user' as const, parts: initialMessage },
          { role: 'model' as const, parts: [{ text: fallbackText }] }
        ]);
      }
    } catch (error) {
      console.error('Virhe Gemini API:ssa:', error);
      if (error instanceof Error && (error as any).response) {
        (error as any).response.json().then((data: any) => {
          console.error('Gemini API:n virheviesti:', data);
        });
      }
      if ((error as any)?.response?.text) {
        (error as any).response.text().then((txt: string) => {
          console.error('Gemini API:n response.text:', txt);
        });
      }
      setMessages([{ role: 'model' as const, parts: [{ text: 'Virhe Gemini API:ssa.' }] }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Puhdista chat-sessio
  const handleClearSession = () => {
    setMessages([]);
    setSessionActive(false);
    setInput('');
  };

  // Lähetä viesti Gemini API:lle
  const handleSend = async () => {
    if (!input.trim() || !sessionActive) return;
    setIsLoading(true);
    try {
      const userMessageText = input;

      const userMessage = { role: 'user' as const, parts: [{ text: userMessageText } as Part] };
      const newMessages = [...messages, userMessage];
      setMessages(newMessages);
      setInput('');
      const model = genAI.getGenerativeModel({
        model: geminiModel,
        generationConfig: {
          temperature: 0.2
        },
        tools: [ { googleSearch: {} } as any ]
      });
      const result = await model.generateContent(newMessages.flatMap(msg => msg.parts));
      const response = await result.response;

      if (response && response.candidates && response.candidates.length > 0) {
        const candidate = response.candidates[0];
        console.log('Candidate (handleSend):', JSON.stringify(candidate, null, 2));
        const content = candidate.content;
        let processedCitationMetadata: { citationSources: CitationSource[] } | undefined = undefined;

        // Yritä ensin käyttää suoraa citationMetadata-kenttää, jos se on olemassa
        if (candidate.citationMetadata && candidate.citationMetadata.citationSources) {
          processedCitationMetadata = candidate.citationMetadata as { citationSources: CitationSource[] };
          console.log('Using direct citationMetadata (handleSend):', processedCitationMetadata);
        } 
        // Jos ei, yritä prosessoida groundingMetadata, kuten handleStartSession-funktiossa
        else if (candidate.groundingMetadata && candidate.groundingMetadata.groundingSupports) {
          const supports = candidate.groundingMetadata.groundingSupports;
          const allChunks = candidate.groundingMetadata.groundingChunks;

          if (allChunks && allChunks.length > 0) {
            console.log('Found groundingMetadata with chunks, processing (handleSend):', candidate.groundingMetadata);
            const sources: CitationSource[] = supports.map((support: any) => {
              if (support.segment && support.groundingChunkIndices && support.groundingChunkIndices.length > 0) {
                const firstChunkIndex = support.groundingChunkIndices[0];
                if (firstChunkIndex >= 0 && firstChunkIndex < allChunks.length) {
                  const chunk = allChunks[firstChunkIndex] as any;
                  const uri = chunk?.web?.uri;
                  if (uri) {
                    return { startIndex: support.segment.startIndex, endIndex: support.segment.endIndex, uri: uri };
                  } else {
                     console.warn('Could not find URI in grounding chunk (handleSend) at index:', firstChunkIndex, 'Full chunk structure:', JSON.stringify(chunk, null, 2));
                  }
                }
              }
              return null;
            }).filter((source: CitationSource | null): source is CitationSource => source !== null);
            if (sources.length > 0) processedCitationMetadata = { citationSources: sources };
          } else {
            console.log('Found groundingMetadata with supports but no/empty chunks, trying direct URIs from supports (handleSend):', supports);
            const sources: CitationSource[] = supports.map((support: any) => {
              if (support.segment) {
                const uri = support.uri || support.web?.uri || support.webAccess?.uri || support.retrieval?.uri;
                if (uri) {
                  return { startIndex: support.segment.startIndex, endIndex: support.segment.endIndex, uri: uri };
                } else {
                  console.warn('Could not find URI directly in support object (handleSend). Support structure:', JSON.stringify(support, null, 2));
                }
              }
              return null;
            }).filter((source: CitationSource | null): source is CitationSource => source !== null);
            if (sources.length > 0) processedCitationMetadata = { citationSources: sources };
          }

          if (processedCitationMetadata) {
            console.log('Processed citationMetadata from groundingMetadata (handleSend):', processedCitationMetadata);
          } else {
            console.log('Could not derive citation sources from groundingMetadata (handleSend).');
          }
        } else {
            console.log('No citationMetadata or actionable groundingMetadata found (handleSend).');
        }

        setMessages([...newMessages, { 
          role: 'model' as const,
          parts: content.parts,
          citationMetadata: processedCitationMetadata // Käytä prosessoitua metadataa
        }]);
      } else {
        const fallbackText = response?.text() ?? 'Vastauksen käsittely epäonnistui.';
        setMessages([...newMessages, { role: 'model' as const, parts: [{ text: fallbackText }] }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model' as const, parts: [{ text: 'Virhe Gemini API:ssa.' }] }]);
    } finally {
      setIsLoading(false);
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