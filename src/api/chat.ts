import OpenAI from "openai";
import type { ChatCompletionMessageParam, ChatCompletionContentPart } from "openai/resources/chat/completions";

const client = new OpenAI({
  apiKey: import.meta.env.VITE_GROK_API_KEY,
  baseURL: "https://api.x.ai/v1",
  dangerouslyAllowBrowser: true
});

let sessionMessages: ChatCompletionMessageParam[] = [];

export const createResponse = async (message: string, fileContent?: string) => {
  try {
    let newMessage: ChatCompletionMessageParam;
    
    if (fileContent) {
      // If this is an image message
      const content: ChatCompletionContentPart[] = [
        {
          type: "image_url",
          image_url: {
            url: fileContent,
            detail: "high"
          }
        },
        {
          type: "text",
          text: message
        }
      ];
      
      newMessage = {
        role: "user",
        content
      };

      // If this is the first message with an image, store it for future context
      if (sessionMessages.length === 0) {
        sessionMessages = [newMessage];
      }
    } else {
      // For text-only messages, include the initial image context if it exists
      if (sessionMessages.length > 0 && Array.isArray(sessionMessages[0].content)) {
        const firstMessage = sessionMessages[0].content as ChatCompletionContentPart[];
        const imageContent = firstMessage.find(part => part.type === "image_url");
        
        if (imageContent) {
          newMessage = {
            role: "user",
            content: [
              imageContent,
              {
                type: "text",
                text: message
              }
            ]
          };
        } else {
          newMessage = {
            role: "user",
            content: message
          };
        }
      } else {
        newMessage = {
          role: "user",
          content: message
        };
      }
    }

    const response = await client.chat.completions.create({
      model: fileContent || sessionMessages.length > 0 ? "grok-2-vision-latest" : "grok-3-beta",
      messages: sessionMessages.length > 0 ? [...sessionMessages, newMessage] : [newMessage],
      temperature: 0.7,
      max_tokens: 2048
    });

    // Store assistant's response in session
    if (response.choices[0].message.content) {
      sessionMessages.push({
        role: "assistant",
        content: response.choices[0].message.content
      });
    }

    return response.choices[0].message.content;
  } catch (error) {
    console.error('Error calling Grok API:', error);
    throw error;
  }
};

// Add a function to clear the session when needed
export const clearChatSession = () => {
  sessionMessages = [];
}; 