import React, { useState, useRef } from 'react';
import { GoogleGenerativeAI, Part } from '@google/generative-ai';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
const geminiModel = import.meta.env.VITE_GEMINI_MODEL || 'gemini-2.5-pro-preview-03-25';
const DEFAULT_IMAGE = '/default-forecast.png'; // Voit vaihtaa tähän vakiokuvan polun

const genAI = new GoogleGenerativeAI(apiKey);

const GeminiChat: React.FC = () => {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionActive, setSessionActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Lataa kuva base64-muotoon
  const loadImageAsBase64 = async (imagePath: string): Promise<string> => {
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

  // Ohjeistus (voit laajentaa myöhemmin)
  const getInstructions = () => `Olet ystävällinen Kempin tuotteen kysynnänennustus asiantuntija. Puhu suomea. Analysoi kuvassa esitettyä kysyntädataa ja ennusteita.`;

  // Aloita uusi chat-sessio
  const handleStartSession = async () => {
    console.log('Aloita chat painettu');
    setMessages([]);
    setSessionActive(true);
    setInput('');
    inputRef.current?.focus();
    setIsLoading(true);
    try {
      const model = genAI.getGenerativeModel({
        model: geminiModel,
        tools: [ { googleSearch: {} } as any ]
      });
      const initialMessage = [
        { text: 'Moi, kerro vitsi' } as Part
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
          className="bg-[#4ADE80] hover:bg-[#22C55E] text-white px-4 py-2 rounded"
          onClick={handleStartSession}
          disabled={sessionActive || isLoading}
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
      </div>
      <div className="h-64 overflow-y-auto border rounded p-2 bg-gray-50 mb-4">
        {messages.length === 0 && <div className="text-gray-400 text-sm">Ei viestejä</div>}
        {messages.map((msg, idx) => (
          <div key={idx} className={`mb-2 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
            {msg.parts.map((part: any, pidx: number) => (
              <span key={pidx} className={`inline-block px-3 py-2 rounded-lg ${msg.role === 'user' ? 'bg-[#4ADE80] text-white' : 'bg-gray-200 text-gray-800'}`}>
                {part.text}
              </span>
            ))}
          </div>
        ))}
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