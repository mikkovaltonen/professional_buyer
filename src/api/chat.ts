import { OpenAI } from 'openai';

const client = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
});

export const createChatCompletion = async (message: string) => {
  try {
    const response = await client.chat.completions.create({
      model: import.meta.env.VITE_OPENAI_MODEL || "gpt-4",
      messages: [
        {
          role: "system",
          content: "Olet avulias tekoälyassistentti, joka auttaa käyttäjää ymmärtämään ja analysoimaan kysyntäennusteita. Vastaa ytimekkäästi ja selkeästi suomeksi."
        },
        {
          role: "user",
          content: message
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error('Error calling OpenAI:', error);
    throw error;
  }
}; 