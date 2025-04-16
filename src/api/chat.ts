import { GoogleGenerativeAI, Part, Tool } from '@google/generative-ai';
import { Buffer } from 'buffer';

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

// System prompts for different products
const SYSTEM_PROMPTS: { [key: string]: string } = {
  'MINARCTIG EVO 200MLP POWER SOURCE': `Olet Kempin hitsauslaitteiden kysynnänennustuksen asiantuntija-assistentti. Tehtäväsi on analysoida MINARCTIG EVO 200MLP POWER SOURCE -tuotteen kysyntäennustetta ja vastata siihen liittyviin kysymyksiin. Käytä analyysissa tuotteen historiallista kysyntädataa, markkinasignaaleja ja toimialatuntemusta.`,
  'X3P POWER SOURCE PULSE 450 W': `Olet Kempin hitsauslaitteiden kysynnänennustuksen asiantuntija-assistentti. Tehtäväsi on analysoida X3P POWER SOURCE PULSE 450 W -tuotteen kysyntäennustetta ja vastata siihen liittyviin kysymyksiin. Käytä analyysissa tuotteen historiallista kysyntädataa, markkinasignaaleja ja toimialatuntemusta.`,
  'X5 POWER SOURCE 400 PULSE WP': `Olet Kempin hitsauslaitteiden kysynnänennustuksen asiantuntija-assistentti. Tehtäväsi on analysoida X5 POWER SOURCE 400 PULSE WP -tuotteen kysyntäennustetta ja vastata siihen liittyviin kysymyksiin. Käytä analyysissa tuotteen historiallista kysyntädataa, markkinasignaaleja ja toimialatuntemusta.`
};

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
      // Remove the data URL prefix (e.g., "data:image/png;base64,")
      const base64Data = base64String.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export const initializeChat = async (selectedProduct: string) => {
  console.log('🔄 Initializing chat session...');
  console.log('Current state:', { hasInitializedChat, messagesCount: sessionMessages.length });
  
  if (hasInitializedChat) {
    console.log('❌ Chat already initialized, skipping...');
    return null;
  }
  
  if (!SYSTEM_PROMPTS[selectedProduct]) {
    console.error('❌ Invalid product selected:', selectedProduct);
    throw new Error('Invalid product selected');
  }

  console.log('✨ Starting new chat session for product:', selectedProduct);
  hasInitializedChat = true;
  
  const systemPrompt = SYSTEM_PROMPTS[selectedProduct];
  console.log('📝 Using system prompt for:', selectedProduct);

  try {
    // Get product image as base64
    const imageUrl = `/demo_data/${selectedProduct}.png`;
    const imageBase64 = await loadImageAsBase64(imageUrl);

    // Get the model with search capability
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-pro-preview-03-25',
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
      }
    });

    // Initialize chat with system prompt and image
    const initialMessage = [
      {
        inlineData: {
          data: imageBase64,
          mimeType: 'image/png'
        }
      } as Part,
      {
        text: `${systemPrompt}\n\nHaluat että tutkin ja ennustan ${selectedProduct} tuotteen kysyntää? Voin auttaa sinua analysoimaan sen kysyntäennustetta ja markkinanäkymiä. Käytän myös reaaliaikaista markkinatietoa analyysissäni.`
      } as Part
    ];

    // Generate initial response
    const result = await model.generateContent(initialMessage);
    const response = await result.response;
    const fullResponse = response.text();

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
    console.error('Error initializing chat:', error);
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
    // Get the model with search capability
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-pro-preview-03-25',
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
      }
    });

    // Generate response
    const result = await model.generateContent(
      sessionMessages.flatMap(msg => msg.parts)
    );

    const response = await result.response;
    const fullResponse = response.text();

    // Add assistant's response to session
    sessionMessages.push({
      role: 'model',
      parts: [{ text: fullResponse } as Part]
    });

    console.log('✅ Response received and added to session');

    return fullResponse;
  } catch (error) {
    console.error('Error generating response:', error);
    throw error;
  }
}; 