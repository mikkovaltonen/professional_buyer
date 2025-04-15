import { OpenAI } from 'openai';

const VALID_EMAIL = 'forecasting@kempki.com';
const VALID_PASSWORD = 'laatu';

let isAuthenticated = false;

export const authenticate = (email: string, password: string): boolean => {
  isAuthenticated = email === VALID_EMAIL && password === VALID_PASSWORD;
  return isAuthenticated;
};

const client = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
});

export const createChatCompletion = async (message: string) => {
  if (!isAuthenticated) {
    throw new Error('Authentication required');
  }

  try {
    const response = await fetch('https://api.wisestein.com/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        model: import.meta.env.VITE_OPENAI_MODEL || "gpt-4",
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to get response from chat API');
    }

    const data = await response.json();
    return data.response;
  } catch (error) {
    console.error('Chat API error:', error);
    throw error;
  }
}; 