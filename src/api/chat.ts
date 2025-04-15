import { OpenAI } from 'openai';

const client = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

export const createResponse = async (message: string, fileContent?: string) => {
  try {
    let input = message;
    
    if (fileContent) {
      input = `Analysoi seuraavaa dataa ja vastaa kysymykseen:\n\nData:\n${fileContent}\n\nKysymys: ${message}`;
    }

    const response = await client.responses.create({
      model: "gpt-4.1",
      input: input
    });

    return response.output_text;
  } catch (error) {
    console.error('Error calling OpenAI:', error);
    throw error;
  }
}; 