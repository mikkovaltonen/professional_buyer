import React, { useState, useRef } from 'react';
import { GoogleGenerativeAI, Part } from '@google/generative-ai';
import { Loader2 } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import ApplyCorrectionsButton from './ApplyCorrectionsButton';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
const geminiModel = import.meta.env.VITE_GEMINI_MODEL || 'gemini-2.5-pro-preview-03-25';

const genAI = new GoogleGenerativeAI(apiKey);

interface GeminiChatProps {
  imageUrl?: string | null;
  chartLevel?: 'class' | 'group' | 'product';
  onCorrectionsApplied?: () => void;
  selectedClass?: string | null;
  selectedGroups?: string[];
  selectedProducts?: { code: string; description: string }[];
}

const GeminiChat: React.FC<GeminiChatProps> = ({ 
  imageUrl, 
  chartLevel = 'group', 
  onCorrectionsApplied,
  selectedClass,
  selectedGroups,
  selectedProducts
}) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionActive, setSessionActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Lataa kuva base64-muotoon
  const loadImageAsBase64 = async (imagePath: string): Promise<string> => {
    if (!imagePath) throw new Error('imageUrl puuttuu!');
    if (imagePath.startsWith('data:image/')) {
      // Jos jo base64, palauta suoraan
      return imagePath.split(',')[1];
    }
    if (imagePath.startsWith('blob:')) {
      // Blob-url pitää lukea fetchillä ja FileReaderilla
      const response = await fetch(imagePath);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result as string;
          const base64Data = base64String.split(',')[1];
          resolve(base64Data);
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
        const base64String = reader.result as string;
        const base64Data = base64String.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // Dynaaminen ohjeistus kuvan tason mukaan
  const getInstructions = () => {
    const baseInstructions = `Hei! Toimi aina muodollisesti ja kohteliaasti. Aloita muodollisella tervehdyksellä ja esittelyllä vain ensimmäisessä vastauksessa. Seuraavissa vastauksissa älä enää esittele itseäsi, vaan jatka suoraan analyysillä tai vastauksella. Esimerkiksi: 'Hei! Olen Kempin tuotteiden markkinatutkija ja kysynnänennustuksen asiantuntija. Analysoin mielelläni toimitetun datan ja autan seuraavissa vaiheissa.' Älä koskaan aloita epämuodollisesti, kuten 'Selvä juttu', 'Totta kai', 'Katsotaanpa', 'No niin', 'Tarkastellaanpa' tms. Vastaa aina suomeksi.\n\nAnalysoi aluksi kuvassa esitettyä dataa. Kuvaajassa:\n- Sininen viiva: Toteutunut kysyntä\n- Oranssi katkoviiva: Tilastollinen ennuste\n- Punainen viiva: Korjattu ennuste\n- Punainen katkoviiva: Ennustevirhe\n\nKerro käyttäjälle kuvan tuotteista, tuoteryhmästä tai selvitä verkosta, minkälaisia lopputuotteita ryhmään kuuluu. Toimitettuasi analyysin käyttäjälle, kysy haluaako hän sinun tekevän seuraavat Google-syvähaut:\n\n(1) Omien ja kilpailijoiden alennuskampanjat, (2) Omien ja kilpailijoiden substituuttituotteiden tuotelanseeraukset, (3) Omien ja kilpailijoiden markkinointikampanjat sekä jakelijoiden ilmoitukset\n(4) Omien ja kilpailijoiden lehtiartikkelit ja (5) Kysyntään vaikuttavat makrotalousindikaattorit ja niiden muutokset\nKysy myös, haluaako käyttäjä linkit kaikkiin uutisiin, joilla saattaa olla vaikutusta ennusteeseen.\n\nJos mainitset uutisen, artikkelin tai lähteen, anna se aina markdown-linkkinä muodossa [otsikko](https://osoite).\n\nKun makrotalousindikaattorit ja ennusteeseen vaikuttavat uutiset on käyty läpi, ehdota käyttäjälle, että voit antaa perustellut ennustekorjaukset JSON-muodossa.\n\n`;

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

    const endInstructions = `\n\nKorjaukset tulee rajata ajanjaksolle 04/2025 – 03/2026, ja niitä tulee antaa vain niille kuukausille, joiden osalta uskot korjauksen olevan perusteltu.\n\nEsimerkkivastaus aloitukseen:\nHei! Olen Kempin tuotteiden markkinatutkija ja kysynnänennustuksen asiantuntija. Analysoin mielelläni toimitetun datan ja autan seuraavissa vaiheissa. Tässä analyysi toimitetusta datasta:`;

    return baseInstructions + contextInstructions + jsonInstructions[chartLevel] + endInstructions;
  };

  // Aloita uusi chat-sessio
  const handleStartSession = async () => {
    console.log('Aloita chat painettu');
    setMessages([]);
    setSessionActive(true);
    setInput('');
    inputRef.current?.focus();
    setIsLoading(true);
    try {
      // Käytetään imageUrl:ää, oletuskuvaa ei enää ole
      const imgPath = imageUrl;
      if (!imgPath) throw new Error('imageUrl puuttuu chatin aloituksessa!');
      console.log('GeminiChat: Käytettävä imgPath', imgPath);
      if (typeof imgPath === 'string') {
        if (imgPath.startsWith('data:image/')) {
          console.log('GeminiChat: imgPath on base64 dataurl, pituus:', imgPath.length, 'alku:', imgPath.slice(0, 100));
        } else {
          console.log('GeminiChat: imgPath on url/polku:', imgPath);
        }
      } else {
        console.log('GeminiChat: imgPath EI OLE string:', imgPath);
      }
      const imageBase64 = await loadImageAsBase64(imgPath);
      console.log('GeminiChat: imageBase64 pituus:', imageBase64.length, 'alku:', imageBase64.slice(0, 100));
      console.log('GeminiChat: Kuva lähetetty Gemini API:lle, timestamp:', new Date().toISOString());
      const model = genAI.getGenerativeModel({
        model: geminiModel,
        tools: [ { googleSearch: {} } as any ]
      });
      const initialMessage = [
        { text: getInstructions() } as Part,
        { inlineData: { data: imageBase64, mimeType: 'image/png' } } as Part
      ];
      const result = await model.generateContent(initialMessage);
      const response = await result.response;
      const fullResponse = response.text();
      setMessages([
        { role: 'user', parts: initialMessage },
        { role: 'model', parts: [{ text: fullResponse } as Part] }
      ]);
    } catch (error) {
      console.error('Virhe Gemini API:ssa:', error);
      if (error instanceof Error && (error as any).response) {
        (error as any).response.json().then((data: any) => {
          console.error('Gemini API:n virheviesti:', data);
        });
      }
      setMessages([{ role: 'model', parts: [{ text: 'Virhe Gemini API:ssa.' }] }]);
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
      const userMessage = { role: 'user', parts: [{ text: input } as Part] };
      const newMessages = [...messages, userMessage];
      setMessages(newMessages);
      setInput('');
      const model = genAI.getGenerativeModel({
        model: geminiModel,
        tools: [ { googleSearch: {} } as any ]
      });
      const result = await model.generateContent(newMessages.flatMap(msg => msg.parts));
      const response = await result.response;
      const fullResponse = response.text();
      setMessages([...newMessages, { role: 'model', parts: [{ text: fullResponse } as Part] }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', parts: [{ text: 'Virhe Gemini API:ssa.' }] }]);
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
          // Piilota initialisointiprompti: älä näytä ensimmäistä user-viestiä, jos se sisältää vain ohjeistuksen ja/tai kuvan
          .filter((msg, idx) => {
            if (idx !== 0) return true;
            // Jos ensimmäinen viesti on user ja parts sisältää vain ohjeistuksen ja/tai kuvan, piilota se
            if (msg.role === 'user' && Array.isArray(msg.parts) && msg.parts.length <= 2 && msg.parts.some(p => typeof p.text === 'string' && p.text.includes('Kempin tuotteiden markkinatutkija'))) {
              return false;
            }
            return true;
          })
          .map((msg, idx) => (
            <div key={idx} className={`mb-2 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
              {msg.parts.map((part: any, pidx: number) => (
                <span key={pidx} className={`inline-block px-3 py-2 rounded-lg max-w-full break-words whitespace-pre-wrap ${msg.role === 'user' ? 'bg-[#4ADE80] text-white' : 'bg-gray-200 text-gray-800'}`}>
                  <ReactMarkdown
                    components={{
                      a: ({ node, ...props }) => (
                      <a {...props} className="text-blue-600 hover:text-blue-800 underline" target="_blank" rel="noopener noreferrer" />
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
                    {part.text}
                  </ReactMarkdown>
                </span>
              ))}
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