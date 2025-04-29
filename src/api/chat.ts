import { GoogleGenerativeAI, Part } from '@google/generative-ai';

// Initialize the Google AI client
const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
if (!apiKey) {
  console.error('❌ Gemini API key is missing! Please check your .env file.');
} else {
  console.log('✅ Gemini API key is present');
}
const genAI = new GoogleGenerativeAI(apiKey);

// Chat session state
let sessionMessages: any[] = [];
let hasInitializedChat = false;

export const clearChatSession = () => {
  console.log('🗑️ Clearing chat session...');
  sessionMessages = [];
  hasInitializedChat = false;
  console.log('Session cleared. New state:', { hasInitializedChat, messagesCount: sessionMessages.length });
};

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

const getProductGroupInstructions = (groupName: string): string => {
return `Olet ystävällinen Kempin Viratälahtisiin kuuluvuvan komponenttiryhmän ${groupName} kysynnänennustus asiantuntija.
    Analysoi aluksi kuvassa esitettyä tuoteryhmän kokonaiskysyntädataa. 
    
    Kun olet toimittanut analyysin käyttäjälle, kysy häneltä haluaako hän sinun:
    1. Tekevän korjausehdotuksen tuoteryhmän ennusteeseen kuukausittain prosentteina. Anna korjausehdotus vain jos löydät siihen perustellun syyn.
    2. Tekevän seuraavan google syvähaun: 
      - Haku omista ja kilpailijoiden alennuskampanjoista
      - Haku omista ja kilpailijoiden substituutti tuotteiden tuotelanseerauksista 
      - Haku omista ja kilpailijoiden markkinointi kampanjoista ja jakelikoiden ilmoituksista
      - Haku omista ja kilpoailijoiden lehti artikkeleista 
      - Haku kysyntään vaikuttavista makrotalousindikaattoreiasta ja niiden muutoksista 
      - Haluatko että annan linkit kaikkiin ennusteeseen vaikuttaviin löytämiini uutisiin
      
      Kun makroindikaattorit on käyty läpi ehdota että voitko antaa milestäsi perustellut ennustekorjaukset json muodossa? Json:ssa tulee olla seuraavasa muodossa 
   {
      "product_group": "Kemppi welder Power Sources",
      "month": "2025-08",
      "correction_percent": -2,
      "explanation": "Esimerkki: Alkuperäisessä ennusteessa kysyntä laskee jyrkästi huipun jälkeen. Koska talouden ja teollisuuden elpymisen odotetaan jatkuvan tasaisemmin läpi vuoden 2025, ehdotan pieniä positiivisia heijastamaan tätä vakaampaa kehitystä ja estämään liian jyrkkää pudotusta ennusteessa (tämä selitys on peräisin alkuperäisestä pyynnöstäsi)."
    }

    Jasonissa tilee käytä exaktisti oikeaa product group codea, esim  "10905 ACDC THREE-PHASE"

    Json korjaus tulee koskea ainoastaa uuden ennusteen korjausta eli tulevaisuutta jolle ei ole toteumaa. 
      ,`;
};

const getProductInstructions = (productName: string): string => {
  return `Olet ystävällinen Kempin tuotteen ${productName} kysynnänennustus asiantuntija.
    Analysoi aluksi kuvassa esitettyä tuotekohtaista kysyntädataa. 
    
    Kun olet toimittanut analyysin käyttäjälle, kysy häneltä haluaako hän sinun tekevän seuraavan google syvähaun: 
      - Haku omista ja kilpailijoiden alennuskampanjoista
      - Haku omista ja kilpailijoiden substituutti tuotteiden tuotelanseerauksista 
      - Haku omista ja kilpailijoiden markkinointi kampanjoista ja jakelikoiden ilmoituksista
      - Haku omista ja kilpoailijoiden lehti artikkeleista 
      - Haku kysyntään vaikuttavista makrotalousindikaattoreiasta ja niiden muutoksista 
      - Haluatko että annan linkit kaikkiin ennusteeseen vaikuttaviin löytämiini uutisiin`;
};

export const initializeChat = async (selectedProduct: string, imageUrl: string) => {
  console.log('🔄 Initializing chat session...');
  console.log('Current state:', { hasInitializedChat, messagesCount: sessionMessages.length });
  
  // Clear previous session first
  clearChatSession();
  
  console.log('✨ Starting new chat session for:', selectedProduct);
  hasInitializedChat = true;

  try {
    // Get product image as base64
    const imageBase64 = await loadImageAsBase64(imageUrl);
    console.log('🖼️ Image loaded successfully, size:', imageBase64.length);

    // Get the model with Google Search tool
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-pro-preview-03-25',
      tools: [
        { googleSearch: {} } as any
      ]
    });

    // Check if this is a product group or individual product
    const isProductGroup = selectedProduct.includes('Kokonaiskysyntä');
    const instructions = isProductGroup
      ? getProductGroupInstructions(selectedProduct.replace(' Kokonaiskysyntä', ''))
      : getProductInstructions(selectedProduct);

    // Initialize chat with appropriate instructions
    const initialMessage = [
      {
        text: instructions
      } as Part,
      {
        inlineData: {
          data: imageBase64,
          mimeType: 'image/png'
        }
      } as Part
    ];

    console.log('📤 Sending initial message to Gemini API...');
    
    // Generate initial response
    const result = await model.generateContent(initialMessage);
    const response = await result.response;
    const fullResponse = response.text();
    console.log('📥 Received response from Gemini API:', fullResponse);

    if (!fullResponse) {
      throw new Error('Empty response from Gemini API');
    }

    // Store the conversation history
    sessionMessages = [
      {
        role: 'user',
        parts: initialMessage
      },
      {
        role: 'model',
        parts: [{ text: fullResponse } as Part]
      }
    ];

    return fullResponse;
  } catch (error) {
    console.error('❌ Error initializing chat:', error);
    hasInitializedChat = false;
    sessionMessages = [];
    throw error;
  }
};

export const createResponse = async (message: string) => {
  console.log('📝 Processing new message:', message);
  console.log('Current session state:', { hasInitializedChat, messagesCount: sessionMessages.length });

  if (!hasInitializedChat) {
    throw new Error('Chat not initialized');
  }

  // Add user message to session
  sessionMessages.push({
    role: 'user',
    parts: [{ text: message } as Part]
  });

  console.log('📤 Sending message to Gemini API...');
  
  try {
    // Get the model with Google Search tool
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-pro-preview-03-25',
      tools: [
        { googleSearch: {} } as any
      ]
    });

    // Generate response
    const result = await model.generateContent(
      sessionMessages.flatMap(msg => msg.parts)
    );

    const response = await result.response;
    const fullResponse = response.text();
    console.log('📥 Received response from Gemini API:', fullResponse);

    if (!fullResponse) {
      throw new Error('Empty response from Gemini API');
    }

    // Add assistant's response to session
    sessionMessages.push({
      role: 'model',
      parts: [{ text: fullResponse } as Part]
    });

    console.log('✅ Response received and added to session');

    return fullResponse;
  } catch (error) {
    console.error('❌ Error generating response:', error);
    throw error;
  }
}; 