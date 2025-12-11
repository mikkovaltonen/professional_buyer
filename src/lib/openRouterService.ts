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

  // Log API call details
  const systemPrompt = messages.find(m => m.role === 'system')?.content;
  const userMessage = messages.filter(m => m.role === 'user').pop()?.content;

  console.group('%c🤖 OpenRouter API Call', 'color: #6366f1; font-weight: bold; font-size: 14px');
  console.log('%cModel:', 'color: #10b981; font-weight: bold', model);
  console.log('%cTemperature:', 'color: #f59e0b; font-weight: bold', temperature);
  console.log('%cTools:', 'color: #8b5cf6; font-weight: bold', tools?.map(t => t.function.name).join(', ') || 'none');
  console.log('%cSystem Prompt:', 'color: #3b82f6; font-weight: bold', systemPrompt ? `${systemPrompt.substring(0, 200)}...` : 'none');
  console.log('%cUser Message:', 'color: #ec4899; font-weight: bold', userMessage ? `${userMessage.substring(0, 150)}...` : 'none');
  console.log('%cTotal Messages:', 'color: #6b7280', messages.length);
  console.log('%c📋 All Messages:', 'color: #f97316; font-weight: bold', messages.map((m, i) => ({
    index: i,
    role: m.role,
    contentPreview: m.content?.substring(0, 80) + (m.content?.length > 80 ? '...' : '')
  })));
  console.groupEnd();

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
    console.error('%c❌ OpenRouter API Error', 'color: #ef4444; font-weight: bold', response.status, errorMessage);
    throw new Error(`OpenRouter API error ${response.status}: ${errorMessage}`);
  }

  const result: OpenRouterResponse = await response.json();

  // Log response details
  console.group('%c✅ OpenRouter Response', 'color: #10b981; font-weight: bold; font-size: 14px');
  console.log('%cFinish Reason:', 'color: #6b7280', result.choices[0]?.finish_reason);
  if (result.usage) {
    console.log('%cTokens:', 'color: #f59e0b; font-weight: bold',
      `Prompt: ${result.usage.prompt_tokens} | Completion: ${result.usage.completion_tokens} | Total: ${result.usage.total_tokens}`);
  }
  if (result.choices[0]?.message?.tool_calls) {
    console.log('%cTool Calls:', 'color: #8b5cf6; font-weight: bold',
      result.choices[0].message.tool_calls.map(t => t.function.name).join(', '));
  }
  console.groupEnd();

  return result;
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