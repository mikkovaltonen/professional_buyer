import { OpenAI } from 'openai';

const client = new OpenAI({
  apiKey: import.meta.env.VITE_GROK_API_KEY,
  baseURL: "https://api.x.ai/v1",
  dangerouslyAllowBrowser: true
});

interface ImageContent {
  type: "image_url";
  image_url: {
    url: string;
    detail: "high" | "low";
  };
}

interface TextContent {
  type: "text";
  text: string;
}

type Content = ImageContent | TextContent;

interface UserMessage {
  role: "user";
  content: string | Content[];
}

export const createResponse = async (message: string, fileContent?: string) => {
  try {
    const messages: UserMessage[] = fileContent
      ? [
          {
            role: "user",
            content: [
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
            ]
          }
        ]
      : [
          {
            role: "user",
            content: message
          }
        ];

    const response = await client.chat.completions.create({
      model: fileContent ? "grok-2-vision-latest" : "grok-3-beta",
      messages,
      temperature: 0.7,
      max_tokens: 2048
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error('Error calling Grok API:', error);
    throw error;
  }
}; 