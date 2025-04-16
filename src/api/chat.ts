import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

const client = new OpenAI({
  apiKey: import.meta.env.VITE_GROK_API_KEY,
  baseURL: "https://api.x.ai/v1",
  dangerouslyAllowBrowser: true
});

let sessionMessages: ChatCompletionMessageParam[] = [];
let hasInitializedChat = false;

const SYSTEM_PROMPTS = {
  'MINARCTIG EVO 200MLP POWER SOURCE': `Olen Kempin tuotteen MINARCTIG EVO 200MLP POWER SOURCE kysyntäennuste asiantuntija. Tehtäväni on auttaa ostajaa tulkitsemaan onko viimeisimmät ennusteet optimistisia vai pessimistisiä. Teen netti syvätutkimus tuotteen kysyntään vaikuttavista signaaleista, kuten omista kannibalisoivista tuotelanseeraukista, kilpailijoiden tuote lanseerauksista, omista ja kilpailijoiden alennuskampanjoista ja omista ja kilpailijoiden markkinointi kampanjoista, makrotalous uutisista ja tuotteeseen liityvistä uutisista.  

Alla on kuvaus historiallisesta kysynnästä ja tilastollisesta ennusteesta: MINARCTIG EVO 200MLP POWER SOURCE -nimisen tuotteen kuukausittaisia kysyntämääriä (Demand Quantity) aikavälillä vuodesta 2019 vuoteen 2026.

Aikajaksot:
Historialliset toteumat (Actuals): Noin vuodesta 2019 alkupuolelta maaliskuuhun 2025 asti, mustalla viivalla.
Ennuste (Forecast) huhtikuu 2024 – maaliskuu 2025: sinisellä katkoviivalla.
Ennusteen virhe (Forecast Error) huhtikuu 2024 – maaliskuu 2025: oranssilla pisteviivalla.
Ennuste (Forecast) huhtikuu 2025 – maaliskuu 2026: vihreällä katkoviivalla.`,

  'X3P POWER SOURCE PULSE 450 W': `Olen Kempin tuotteen X3P POWER SOURCE PULSE 450 W kysyntäennuste asiantuntija. Tehtäväni on auttaa ostajaa tulkitsemaan onko viimeisimmät ennusteet optimistisia vai pessimistisiä. Teen netti syvätutkimus tuotteen kysyntään vaikuttavista signaaleista, kuten omista kannibalisoivista tuotelanseeraukista, kilpailijoiden tuote lanseerauksista, omista ja kilpailijoiden alennuskampanjoista ja omista ja kilpailijoiden markkinointi kampanjoista, makrotalous uutisista ja tuotteeseen liityvistä uutisista.  

Alla kuvaus tuotteen X3P POWER SOURCE PULSE 450 W (X3P450W) -tuotteen kysyntäennusteita ja niiden validointia korjatulla datalla. Aikaväli kattaa ajanjakson syyskuusta 2024 huhtikuuhun 2026.

Aikajaksot ja värit:
Toteutunut kysyntä (Actuals): Syyskuu 2024 – huhtikuu 2025, esitetty mustalla viivalla.
Validointiennuste (Forecast): Tammi–huhtikuu 2025, esitetty sinisellä katkoviivalla.
Ennustevirhe (Forecast Error): Tammi–huhtikuu 2025, oranssilla pisteviivalla.
Tuleva ennuste (Forecast): Toukokuu 2025 – huhtikuu 2026, vihreällä katkoviivalla.`,

  'X5 POWER SOURCE 400 PULSE WP': `Olen Kempin tuotteen X5 POWER SOURCE 400 PULSE WP kysyntäennuste asiantuntija. Tehtäväni on auttaa ostajaa tulkitsemaan onko viimeisimmät ennusteet optimistisia vai pessimistisiä. Teen netti syvätutkimus tuotteen kysyntään vaikuttavista signaaleista, kuten omista kannibalisoivista tuotelanseeraukista, kilpailijoiden tuote lanseerauksista, omista ja kilpailijoiden alennuskampanjoista ja omista ja kilpailijoiden markkinointi kampanjoista, makrotalous uutisista ja tuotteeseen liityvistä uutisista.  

Alla kuvaus tuotteen X5 POWER SOURCE 400 PULSE WP (X5130400010) kysyntähistoriasta, ennusteista ja ennustevirheistä aikavälillä heinäkuu 2022 – maaliskuu 2026.

Esitystavat ja värit:
Toteutunut kysyntä (Actuals): Mustalla viivalla.
Ennuste huhti 2024 – maalis 2025: Sinisellä katkoviivalla.
Ennuste huhti 2025 – maalis 2026: Vihreällä katkoviivalla.
Ennustevirhe (Forecast Error, 2024–2025): Oranssilla pisteviivalla.`
};

export const initializeChat = async (selectedProduct: string) => {
  console.log('🔄 Initializing chat session...');
  console.log('Current state:', { hasInitializedChat, messagesCount: sessionMessages.length });
  
  if (hasInitializedChat) {
    console.log('❌ Chat already initialized, skipping...');
    return null;
  }
  
  if (!SYSTEM_PROMPTS[selectedProduct as keyof typeof SYSTEM_PROMPTS]) {
    console.error('❌ Invalid product selected:', selectedProduct);
    throw new Error('Invalid product selected');
  }

  console.log('✨ Starting new chat session for product:', selectedProduct);
  hasInitializedChat = true;
  
  const systemPrompt = SYSTEM_PROMPTS[selectedProduct as keyof typeof SYSTEM_PROMPTS];
  console.log('📝 Using system prompt for:', selectedProduct);

  sessionMessages = [
    {
      role: "system",
      content: systemPrompt
    }
  ];

  console.log('📤 Sending initial message to Grok API...');
  const response = await client.chat.completions.create({
    model: "grok-3-beta",
    messages: [
      ...sessionMessages,
      {
        role: "assistant",
        content: `Haluat että tutkin ja ennustan ${selectedProduct} tuotteen kysyntää? Voin auttaa sinua analysoimaan sen kysyntäennustetta ja markkinanäkymiä.`
      }
    ],
    temperature: 0.7,
    max_tokens: 2048
  });

  if (response.choices[0].message.content) {
    const assistantMessage = {
      role: "assistant",
      content: response.choices[0].message.content
    } as ChatCompletionMessageParam;
    sessionMessages.push(assistantMessage);
    console.log('✅ Chat initialized successfully');
    console.log('Current messages:', sessionMessages);
  }

  return response.choices[0].message.content;
};

export const createResponse = async (message: string) => {
  try {
    console.log('📝 Processing new message:', message);
    console.log('Current session state:', { 
      hasInitializedChat, 
      messagesCount: sessionMessages.length,
      messages: sessionMessages 
    });

    const newMessage: ChatCompletionMessageParam = {
      role: "user",
      content: message
    };

    sessionMessages.push(newMessage);
    console.log('📤 Sending message to Grok API...');

    const response = await client.chat.completions.create({
      model: "grok-3-beta",
      messages: sessionMessages,
      temperature: 0.7,
      max_tokens: 2048
    });

    if (response.choices[0].message.content) {
      const assistantMessage = {
        role: "assistant",
        content: response.choices[0].message.content
      } as ChatCompletionMessageParam;
      sessionMessages.push(assistantMessage);
      console.log('✅ Response received and added to session');
      console.log('Updated messages:', sessionMessages);
    }

    return response.choices[0].message.content;
  } catch (error) {
    console.error('❌ Error in createResponse:', error);
    throw error;
  }
};

export const clearChatSession = () => {
  console.log('🗑️ Clearing chat session...');
  sessionMessages = [];
  hasInitializedChat = false;
  console.log('Session cleared. New state:', { hasInitializedChat, messagesCount: sessionMessages.length });
}; 