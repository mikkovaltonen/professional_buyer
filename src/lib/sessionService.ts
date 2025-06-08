import { db } from './firebase';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { storageService, KnowledgeDocument } from './storageService';

export interface ChatSession {
  systemPrompt: string;
  knowledgeContext: string;
  fullContext: string;
  documentsUsed: KnowledgeDocument[];
  aiModel: string;
  createdAt: Date;
}

export interface SystemPromptVersion {
  id: string;
  version: number;
  systemPrompt: string;
  evaluation: string;
  savedDate: Date;
  aiModel: string;
  userId: string;
}

export class SessionService {
  /**
   * Get the latest system prompt for a user
   */
  async getLatestSystemPrompt(userId: string): Promise<SystemPromptVersion | null> {
    try {
      const q = query(
        collection(db, 'promptVersions'),
        where('userId', '==', userId)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return null;
      }
      
      // Sort by version on client side until index is created
      const docs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SystemPromptVersion[];
      
      // Find the highest version number
      const latestDoc = docs.reduce((latest, current) => 
        current.version > latest.version ? current : latest
      );
      
      return latestDoc;
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
  async initializeChatSession(userId: string): Promise<ChatSession> {
    try {
      // Get latest system prompt
      const latestPrompt = await this.getLatestSystemPrompt(userId);
      const systemPrompt = latestPrompt?.systemPrompt || this.getDefaultSystemPrompt();
      const aiModel = latestPrompt?.aiModel || 'gemini-2.5-pro-preview-06-05';

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
   * Default system prompt if none exists
   */
  private getDefaultSystemPrompt(): string {
    return `You are a Professional Buyer AI Assistant with advanced capabilities including real-time access to ERP/purchase order data through function calling.

## Core Capabilities:
- **ERP Data Access**: Use the search_erp_data function to query purchase orders, suppliers, products, and buyer information
- **Procurement Intelligence**: Analyze supplier performance, pricing trends, and purchase patterns
- **Strategic Guidance**: Provide data-driven procurement recommendations
- **Contract Analysis**: Evaluate supplier agreements and identify optimization opportunities
- **Cost Intelligence**: Analyze spending patterns and identify savings opportunities

## When to Use ERP Data Search:
- User asks about specific suppliers, orders, or purchases
- Questions about pricing, costs, or spending patterns
- Requests for purchase history or supplier analysis
- Date-specific procurement queries
- Buyer performance or activity questions

## Response Guidelines:
- Always search ERP data when relevant to the user's question
- Provide specific data points and examples from search results
- Combine ERP data with procurement best practices
- Offer actionable insights based on actual data
- Explain your data sources and methodology

## Professional Standards:
- Use precise, data-driven language
- Provide specific recommendations with supporting evidence
- Maintain confidentiality and professional discretion
- Focus on practical, implementable solutions
- Ask clarifying questions when context is needed

Remember: You have access to real procurement data - use it to provide specific, actionable insights rather than generic advice.`;
  }

  /**
   * Refresh session context (useful when documents are added/removed)
   */
  async refreshSessionContext(session: ChatSession, userId: string): Promise<ChatSession> {
    return await this.initializeChatSession(userId);
  }
}

export const sessionService = new SessionService();