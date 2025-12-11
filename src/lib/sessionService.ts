import { storageService, KnowledgeDocument } from './storageService';
import { loadLatestPrompt } from './firestoreService';

export interface ChatSession {
  systemPrompt: string;
  knowledgeContext: string;
  fullContext: string;
  documentsUsed: KnowledgeDocument[];
  aiModel: string;
  temperature: number;
  createdAt: Date;
}

export interface SystemPromptData {
  systemPrompt: string;
  aiModel: string;
  temperature: number;
}

export class SessionService {
  /**
   * Get the latest system prompt (global, not user-specific)
   */
  async getLatestSystemPrompt(_userId?: string): Promise<SystemPromptData | null> {
    try {
      const promptData = await loadLatestPrompt();

      if (!promptData) {
        return null;
      }

      return {
        systemPrompt: promptData.prompt,
        aiModel: promptData.model,
        temperature: promptData.temperature
      };
    } catch (error) {
      console.error('Failed to fetch latest system prompt:', error);
      return null;
    }
  }

  /**
   * Get all knowledge documents for a user
   */
  async getUserKnowledgeDocuments(userId: string): Promise<KnowledgeDocument[]> {
    try {
      return await storageService.getUserDocuments(userId);
    } catch (error) {
      console.error('Failed to fetch knowledge documents:', error);
      return [];
    }
  }

  /**
   * Build knowledge context from documents
   */
  async buildKnowledgeContext(documents: KnowledgeDocument[]): Promise<string> {
    if (documents.length === 0) {
      return '';
    }

    const contextParts: string[] = [];
    
    for (const doc of documents) {
      try {
        const content = await storageService.downloadDocument(doc);
        contextParts.push(`
## Document: ${doc.name}
**Format:** ${doc.originalFormat}
**Size:** ${doc.size} bytes
**Content:**
${content}

---
`);
      } catch (error) {
        console.error(`Failed to load document ${doc.name}:`, error);
        // Continue with other documents
      }
    }

    return `
# INTERNAL KNOWLEDGE BASE

The following documents contain internal company knowledge, policies, and procedures that should inform your responses:

${contextParts.join('\n')}

Please use this internal knowledge to provide accurate, company-specific guidance while maintaining the principles outlined in your system prompt.
`;
  }

  /**
   * Initialize a new chat session with full context
   */
  async initializeChatSession(userId: string, userEmail?: string): Promise<ChatSession> {
    try {
      // Get latest system prompt (global)
      const latestPrompt = await this.getLatestSystemPrompt();
      if (!latestPrompt?.systemPrompt) {
        throw new Error('No system prompt configured. Please create a prompt in the Admin panel.');
      }
      let systemPrompt = latestPrompt.systemPrompt;
      const aiModel = latestPrompt.aiModel || 'google/gemini-2.5-flash';
      const temperature = latestPrompt.temperature ?? 0.05;

      // Add user context to system prompt
      if (userEmail) {
        const userName = userEmail.split('@')[0]; // Get name part before @
        const userContext = `

## Current User Information
- User email: ${userEmail}
- User name: ${userName}
- When creating purchase requisitions, use "${userName}" as the buyer/responsible person
- You can address the user by their name "${userName}" when appropriate
`;
        systemPrompt = systemPrompt + userContext;
      }

      // Get knowledge documents
      const documents = await this.getUserKnowledgeDocuments(userId);

      // Build knowledge context
      const knowledgeContext = await this.buildKnowledgeContext(documents);

      // Combine system prompt with knowledge context
      const fullContext = this.combineContexts(systemPrompt, knowledgeContext);

      return {
        systemPrompt,
        knowledgeContext,
        fullContext,
        documentsUsed: documents,
        aiModel,
        temperature,
        createdAt: new Date()
      };
    } catch (error) {
      console.error('Failed to initialize chat session:', error);
      throw new Error('Failed to initialize chat session');
    }
  }

  /**
   * Combine system prompt with knowledge context
   */
  private combineContexts(systemPrompt: string, knowledgeContext: string): string {
    if (!knowledgeContext.trim()) {
      return systemPrompt;
    }

    return `${systemPrompt}

${knowledgeContext}

IMPORTANT: When responding, prioritize information from the internal knowledge base above while maintaining the tone and approach defined in your system prompt.`;
  }


  /**
   * Refresh session context (useful when documents are added/removed)
   */
  async refreshSessionContext(session: ChatSession, userId: string): Promise<ChatSession> {
    return await this.initializeChatSession(userId);
  }
}

export const sessionService = new SessionService();