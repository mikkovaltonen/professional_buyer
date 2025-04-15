import { OpenAI } from 'openai';

const client = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

export const createResponse = async (message: string, imageUrl?: string) => {
  try {
    const input = imageUrl 
      ? `Olet kysynnän ennustamisen asiantuntija. Analysoi tämän tuotteen kysyntäennustetta (${imageUrl}): ${message}`
      : `Olet kysynnän ennustamisen asiantuntija. ${message}`;

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