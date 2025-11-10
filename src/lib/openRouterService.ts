// OpenRouter API Service for handling different AI models

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

export interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OpenRouterTool {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

export interface OpenRouterResponse {
  id: string;
  choices: Array<{
    message: {
      role: string;
      content?: string;
      tool_calls?: Array<{
        id: string;
        type: 'function';
        function: {
          name: string;
          arguments: string;
        };
      }>;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export const callOpenRouterAPI = async (
  messages: OpenRouterMessage[],
  model: string,
  apiKey?: string,
  tools?: OpenRouterTool[],
  temperature: number = 0.05
): Promise<OpenRouterResponse> => {
  const openRouterApiKey = apiKey || import.meta.env.VITE_OPENROUTER_API_KEY || '';

  if (!openRouterApiKey) {
    throw new Error('OpenRouter API key not configured');
  }

  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openRouterApiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': window.location.origin || 'https://valmet-buyer.firebaseapp.com',
      'X-Title': 'Procurement AI Assistant'
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      ...(tools && tools.length > 0 ? { tools, tool_choice: 'auto' } : {})
    })
  });

  if (!response.ok) {
    let errorMessage = '';
    try {
      const errorData = await response.json();
      errorMessage = errorData.error?.message || errorData.message || JSON.stringify(errorData);
    } catch {
      errorMessage = await response.text();
    }
    throw new Error(`OpenRouter API error ${response.status}: ${errorMessage}`);
  }

  return await response.json();
};

// Convert Gemini format messages to OpenRouter format
export const convertGeminiToOpenRouter = (messages: Array<{ role: string; parts: Array<{ text: string }> }>): OpenRouterMessage[] => {
  return messages.map(msg => ({
    role: msg.role === 'model' ? 'assistant' : msg.role as 'system' | 'user' | 'assistant',
    content: typeof msg.parts[0] === 'object' ? msg.parts[0].text : msg.parts[0]
  }));
};

// Handle error responses with user-friendly messages
export const getOpenRouterErrorMessage = (error: Error): string => {
  const message = error.message;

  if (message.includes('overloaded') || message.includes('503')) {
    return 'The AI service is temporarily overloaded. Please wait a moment and try again.';
  } else if (message.includes('402')) {
    return 'OpenRouter API credits exhausted. Please check your account balance.';
  } else if (message.includes('401')) {
    return 'OpenRouter authentication failed. Please check your API key.';
  } else if (message.includes('429')) {
    return 'Too many requests. Please wait a moment before trying again.';
  } else if (message.includes('not configured')) {
    return 'OpenRouter API key is not configured. Please add VITE_OPENROUTER_API_KEY to your environment.';
  }

  return `AI service error: ${message}`;
};