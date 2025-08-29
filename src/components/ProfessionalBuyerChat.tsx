import React, { useState, useRef } from 'react';
import { GoogleGenerativeAI, Part } from '@google/generative-ai';
import { Loader2, Send, RotateCcw, Paperclip, Bot, LogOut, Settings, ThumbsUp, ThumbsDown } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { loadLatestPrompt, createContinuousImprovementSession, addTechnicalLog, setUserFeedback } from '../lib/firestoreService';
import { sessionService, ChatSession } from '../lib/sessionService';
import { erpApiService } from '../lib/erpApiService';
import { storageService } from '../lib/storageService';
import { createPurchaseRequisition } from '@/lib/firestoreService';
import { useQueryClient } from '@tanstack/react-query';

interface ProfessionalBuyerChatProps {
  onLogout?: () => void;
  leftPanel?: React.ReactNode;
  leftPanelVisible?: boolean;
  generationVisible?: boolean;
  leftToggleControl?: React.ReactNode;
  topRightControls?: React.ReactNode;
}

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
const geminiModel = import.meta.env.VITE_GEMINI_MODEL || 'gemini-2.5-pro-preview-03-25';

// ERP Function Definition for Gemini
const searchERPFunction = {
  name: "search_erp_data",
  description: "Search ERP/purchase order data with various criteria. Use this when user asks about suppliers, orders, purchases, products, or wants to find specific data from their ERP system.",
  parameters: {
    type: "object",
    properties: {
      supplierName: {
        type: "string",
        description: "Supplier/vendor name or partial name to search for"
      },
      productDescription: {
        type: "string", 
        description: "Product description or partial description to search for"
      },
      dateFrom: {
        type: "string",
        description: "Search from date (YYYY-MM-DD format). Filters by 'Receive By' column in the Excel data."
      },
      dateTo: {
        type: "string",
        description: "Search to date (YYYY-MM-DD format). Filters by 'Receive By' column in the Excel data."
      },
      buyerName: {
        type: "string",
        description: "Buyer/purchaser name or partial name to search for"
      }
    }
  }
};

const createRequisitionFunction = {
  name: "create_purchase_requisition",
  description: "Create a purchase requisition document with header and lines to Firestore.",
  parameters: {
    type: "object",
    properties: {
      header: {
        type: "object",
        properties: {
          templateBatchName: { type: "string" },
          locationCode: { type: "string" },
          startDate: { type: "string", description: "YYYY-MM-DD" },
          endDate: { type: "string", description: "YYYY-MM-DD" },
          responsibilityCenterOrBuyer: { type: "string" },
          notes: { type: "string" }
        },
        required: ["templateBatchName","locationCode","startDate","endDate","responsibilityCenterOrBuyer"]
      },
      lines: {
        type: "array",
        items: {
          type: "object",
          properties: {
            itemNoOrDescription: { type: "string" },
            quantity: { type: "number" },
            unitOfMeasure: { type: "string" },
            requestedDate: { type: "string", description: "YYYY-MM-DD" },
            vendorNoOrName: { type: "string" },
            directUnitCost: { type: "number" },
            currency: { type: "string" }
          },
          required: ["itemNoOrDescription","quantity","unitOfMeasure","requestedDate"]
        }
      }
    },
    required: ["header","lines"]
  }
};

// Debug: Log Gemini API config
console.log('Gemini API config:', {
  apiKey: apiKey ? `${apiKey.substring(0, 10)}...` : 'undefined',
  model: geminiModel
});

const genAI = new GoogleGenerativeAI(apiKey);

interface CitationSource {
  startIndex?: number;
  endIndex?: number;
  uri?: string;
  title?: string;
}

interface Message {
  role: 'user' | 'model';
  parts: Part[];
  citationMetadata?: {
    citationSources: CitationSource[];
  };
  functionCall?: {
    name: string;
    args: Record<string, unknown>;
    result?: unknown;
  };
}

const processTextWithCitations = (text: string, citationSources?: CitationSource[]) => {
  const originalText = text;
  const formattedSources: string[] = [];

  if (citationSources && citationSources.length > 0) {
    const uniqueUris = new Set<string>();
    let sourceNumber = 1;
    citationSources.forEach((source) => {
      if (source.uri && !uniqueUris.has(source.uri)) {
        const linkDescription = source.title && source.title.trim() !== '' ? source.title : source.uri;
        formattedSources.push(`[Source ${sourceNumber}: ${linkDescription}](${source.uri})`);
        uniqueUris.add(source.uri);
        sourceNumber++;
      }
    });
  }

  return { originalText, formattedSources };
};

const ProfessionalBuyerChat: React.FC<ProfessionalBuyerChatProps> = ({ 
  onLogout, 
  leftPanel, 
  leftPanelVisible = false, 
  generationVisible = true,
  leftToggleControl,
  topRightControls 
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [apiCallLogs, setApiCallLogs] = useState<Array<{timestamp: Date; functionName: string; functionArgs: unknown; functionResult?: unknown; error?: string}>>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionActive, setSessionActive] = useState(false);
  const [chatSession, setChatSession] = useState<ChatSession | null>(null);
  const [sessionInitializing, setSessionInitializing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  
  // Continuous improvement tracking
  const [continuousImprovementSessionId, setContinuousImprovementSessionId] = useState<string | null>(null);
  const [chatSessionKey] = useState<string>(() => `chat_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`);
  const [currentPromptKey, setCurrentPromptKey] = useState<string | null>(null);
  
  // Feedback dialog
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [pendingFeedback, setPendingFeedback] = useState<'thumbs_up' | 'thumbs_down' | null>(null);
  const [pendingMessageIndex, setPendingMessageIndex] = useState<number | null>(null);
  const [feedbackComment, setFeedbackComment] = useState('');

  // System initialization status
  const [statusLoading, setStatusLoading] = useState(false);
  const [initStatus, setInitStatus] = useState<{ hasPrompt: boolean; knowledgeCount: number; erpCount: number }>({
    hasPrompt: false,
    knowledgeCount: 0,
    erpCount: 0
  });

  React.useEffect(() => {
    const checkStatus = async () => {
      if (!user || !user.uid) {
        console.log('User not authenticated yet, skipping status check');
        return;
      }
      setStatusLoading(true);
      try {
        const [prompt, knowledge, erp] = await Promise.all([
          sessionService.getLatestSystemPrompt(user.uid),
          storageService.getUserDocuments(user.uid).catch((err) => {
            console.warn('Failed to fetch knowledge docs:', err);
            return [];
          }),
          storageService.getUserERPDocuments(user.uid).catch((err) => {
            console.warn('Failed to fetch ERP docs:', err);
            return [];
          })
        ]);
        setInitStatus({
          hasPrompt: !!prompt?.systemPrompt,
          knowledgeCount: Array.isArray(knowledge) ? knowledge.length : 0,
          erpCount: Array.isArray(erp) ? erp.length : 0
        });
      } finally {
        setStatusLoading(false);
      }
    };
    checkStatus();
  }, [user]);

  // Initialize chat session with context
  React.useEffect(() => {
    const initializeSession = async () => {
      if (!sessionActive && user && user.uid && !sessionInitializing) {
        setSessionInitializing(true);
        try {
          // Initialize session with system prompt + knowledge documents
          const session = await sessionService.initializeChatSession(user.uid, user.email || undefined);
          setChatSession(session);
          
          // Check if this is a new user (no documents loaded)
          const isLikelyNewUser = session.documentsUsed.length === 0;
          
          // Extract user's name from email (everything before @)
          const userName = user.email ? user.email.split('@')[0] : 'there';
          
          const welcomeMessage: Message = {
            role: 'model',
            parts: [{
              text: isLikelyNewUser 
                ? `🎉 **Welcome to Professional Buyer AI Assistant!**

I'm here to transform how you handle procurement and purchasing. As your AI-powered procurement expert, I can help you:

**🎯 Get Started (recommended):**
• **Load Sample Data**: Go to Admin panel → Load sample knowledge documents and ERP data to try me out
• **Upload Your Files**: Add your own procurement policies and Excel purchase data  
• **Ask Questions**: "What suppliers do we use?" or "Find me laptop purchases from last quarter"

**💡 My Special Capabilities:**
✅ Real-time access to your ERP/purchase data through advanced function calling
✅ Analysis of your internal procurement documents and policies  
✅ Professional buyer expertise for cost optimization and supplier management

**Ready to explore?** Try asking me "Load some sample data so I can see what you can do" or visit the Admin panel to upload your own files!

What would you like to start with?`
                : `Hello **${userName}**! I'm your Professional Buyer AI Assistant. 

What procurement needs can I help you with today? I can assist with supplier management, cost optimization, purchase requisitions, or analyzing your procurement data.`
            }]
          };
          setMessages([welcomeMessage]);
          setSessionActive(true);
          
          if (isLikelyNewUser) {
            toast.success("🎉 Welcome! Your AI assistant is ready. Visit the Admin panel to load sample data and explore capabilities.", {
              duration: 6000
            });
          } else {
            toast.success(`Session initialized with ${session.documentsUsed.length} knowledge document(s)`);
          }
        } catch (error) {
          console.error('Failed to initialize session:', error);
          toast.error('Failed to load knowledge base. Using default settings.');
          
          // Fallback to basic welcome message
          const userName = user?.email ? user.email.split('@')[0] : 'there';
          const welcomeMessage: Message = {
            role: 'model',
            parts: [{
              text: `Hello **${userName}**! I'm your Professional Buyer AI Assistant. 

What procurement needs can I help you with today? I can assist with supplier management, cost optimization, purchase requisitions, or analyzing your procurement data.`
            }]
          };
          setMessages([welcomeMessage]);
          setSessionActive(true);
        } finally {
          setSessionInitializing(false);
        }
      }
    };

    initializeSession();
  }, [sessionActive, user, sessionInitializing]);

  const quickActions = [
    "Use prenegotiated discount prices",
    "Get approvals easily and from correct person", 
    "Find preferred supplier and best price/quality",
    "Create purcase requisitions and orders easily and correctly"
  ];

  const handleQuickAction = async (action: string) => {
    setInput(action);
    await handleSendMessage(action);
  };

  const handleSendMessage = async (messageText?: string) => {
    const textToSend = messageText || input;
    if (!textToSend.trim() || isLoading) return;

    // Guard: require at least a system prompt
    if (!initStatus.hasPrompt) {
      toast.error('No system prompt configured. Please open Admin and set up your prompt.');
      return;
    }

    const userMessage: Message = { role: 'user', parts: [{ text: textToSend }] };
    setMessages(prev => [...prev, userMessage]);
    if (!messageText) setInput('');
    setIsLoading(true);

    try {
      // Use session context if available, otherwise fallback to loading prompt
      let systemPrompt = '';
      
      if (chatSession) {
        // Use the full context from initialized session (system prompt + knowledge documents)
        systemPrompt = chatSession.fullContext;
      } else {
        // Fallback: try to load latest prompt for this user
        if (user?.uid) {
          try {
            const latestPrompt = await loadLatestPrompt(user.uid);
            if (latestPrompt) {
              systemPrompt = latestPrompt;
            }
          } catch (error) {
            console.error('Error loading latest prompt:', error);
          }
        }

        // No fallback - if no prompt available, show error
        if (!systemPrompt) {
          throw new Error('No system prompt configured. Please visit Admin panel to set up your prompt.');
        }
      }

      const model = genAI.getGenerativeModel({
        model: geminiModel,
        generationConfig: { temperature: 0.2 },
        tools: [
          { functionDeclarations: [searchERPFunction, createRequisitionFunction] }
        ]
      });

      const history = messages.map(msg => ({ role: msg.role, parts: msg.parts }));
      const result = await model.generateContent({
        contents: [
          { role: 'user', parts: [{ text: systemPrompt }] },
          ...history, 
          { role: 'user', parts: [{ text: textToSend }] }
        ]
      });

      const response = result.response;
      if (response && response.candidates && response.candidates.length > 0) {
        const candidate = response.candidates[0];
        const content = candidate.content;
        
        // Check for function calls
        if (content?.parts) {
          for (const part of content.parts) {
            if (part.functionCall) {
              const functionName = part.functionCall.name;
              const functionArgs = part.functionCall.args;
              
              if (functionName === 'search_erp_data') {
                try {
                  const aiRequestId = Math.random().toString(36).substring(2, 8);
                  
                  // Log AI function call details
                  console.log('🤖 AI FUNCTION CALL [' + aiRequestId + ']:', {
                    triggered_by_user_message: textToSend,
                    function_name: functionName,
                    ai_generated_parameters: functionArgs,
                    timestamp: new Date().toISOString(),
                    ai_request_id: aiRequestId
                  });

                  // Store API call for later saving
                  setApiCallLogs(prev => [...prev, {
                    timestamp: new Date(),
                    functionName: functionName,
                    functionArgs: functionArgs
                  }]);

                  // Execute ERP search (this will generate its own logs with request ID)
                  const searchResult = await erpApiService.searchRecords(functionArgs);
                  
                  // Log consolidated AI + ERP results
                  console.log('🔗 AI-ERP INTEGRATION RESULT [' + aiRequestId + ']:', {
                    user_query: textToSend,
                    ai_function_call: functionName,
                    ai_parameters: functionArgs,
                    erp_result_summary: {
                      totalRecords: searchResult.totalCount,
                      processingTime: searchResult.processingTimeMs + 'ms',
                      hasData: searchResult.records.length > 0
                    },
                    execution_timestamp: new Date().toISOString(),
                    ai_request_id: aiRequestId
                  });

                  // Update API call with result
                  setApiCallLogs(prev => {
                    const updated = [...prev];
                    const lastCall = updated[updated.length - 1];
                    if (lastCall && lastCall.functionName === functionName) {
                      lastCall.functionResult = {
                        totalRecords: searchResult.totalCount,
                        processingTimeMs: searchResult.processingTimeMs,
                        recordsPreview: searchResult.records.slice(0, 3)
                      };
                    }
                    return updated;
                  });
                  
                  // Create function response
                  const functionResponse = {
                    role: 'model' as const,
                    parts: [{
                      functionResponse: {
                        name: functionName,
                        response: {
                          records: searchResult.records,
                          totalCount: searchResult.totalCount,
                          processingTimeMs: searchResult.processingTimeMs
                        }
                      }
                    }]
                  };
                  
                  // Generate follow-up response with function results
                  const followUpResult = await model.generateContent({
                    contents: [
                      { role: 'user', parts: [{ text: systemPrompt }] },
                      ...history,
                      { role: 'user', parts: [{ text: textToSend }] },
                      { role: 'model', parts: [part] }, // Original function call
                      functionResponse // Function response
                    ]
                  });
                  
                  const followUpResponse = followUpResult.response;
                  if (followUpResponse?.candidates?.[0]?.content) {
                    const aiResponseText = followUpResponse.candidates[0].content?.parts?.[0]?.text || "No response text";
                    
                    // Log AI's final response with detailed debugging
                    console.log('💬 AI FINAL RESPONSE [' + aiRequestId + ']:', {
                      response_text_length: aiResponseText.length,
                      response_preview: aiResponseText.substring(0, 200) + (aiResponseText.length > 200 ? '...' : ''),
                      has_content: !!followUpResponse.candidates[0].content,
                      parts_count: followUpResponse.candidates[0].content?.parts?.length || 0,
                      parts_with_text: followUpResponse.candidates[0].content?.parts?.filter((p): p is { text: string } => 
                        typeof p === 'object' && p !== null && 'text' in p && typeof p.text === 'string'
                      )?.length || 0,
                      included_erp_data: searchResult.totalCount > 0,
                      timestamp: new Date().toISOString(),
                      ai_request_id: aiRequestId
                    });

                    // AI response (logging removed)
                    
                    // Ensure we have valid parts with text content
                    const responseParts = followUpResponse.candidates[0].content?.parts || [];
                    const validParts = responseParts.filter((part): part is { text: string } => 
                      typeof part === 'object' && 
                      part !== null && 
                      'text' in part && 
                      typeof part.text === 'string' && 
                      part.text.trim().length > 0
                    );
                    
                    setMessages(prev => [...prev, {
                      role: 'model',
                      parts: validParts.length > 0 
                        ? validParts 
                        : [{ text: aiResponseText || "I executed the search but couldn't format the response. Please try rephrasing your question." }]
                    }]);
                  }
                  return;
                } catch (functionError) {
                  // Log AI function call error
                  console.log('❌ AI FUNCTION CALL ERROR [' + aiRequestId + ']:', {
                    user_query: textToSend,
                    function_name: functionName,
                    ai_parameters: functionArgs,
                    error: functionError instanceof Error ? functionError.message : 'Unknown error',
                    timestamp: new Date().toISOString(),
                    ai_request_id: aiRequestId
                  });

                  // Update API call with error
                  setApiCallLogs(prev => {
                    const updated = [...prev];
                    const lastCall = updated[updated.length - 1];
                    if (lastCall && lastCall.functionName === functionName) {
                      lastCall.error = functionError instanceof Error ? functionError.message : 'Unknown error';
                    }
                    return updated;
                  });
                  
                  console.error('Function execution failed:', functionError);
                  setMessages(prev => [...prev, {
                    role: 'model',
                    parts: [{ text: `I tried to search your ERP data but encountered an error: ${functionError instanceof Error ? functionError.message : 'Unknown error'}. Please make sure you have uploaded your ERP data in the Admin panel.` }]
                  }]);
                  return;
                }
              }
              if (functionName === 'create_purchase_requisition') {
                try {
                  const aiRequestId = Math.random().toString(36).substring(2, 8);
                  const args = functionArgs as { header: unknown; lines: unknown };
                  if (!user?.uid) throw new Error('Not authenticated');
                  const id = await createPurchaseRequisition(user.uid, {
                    status: 'draft',
                    header: args.header,
                    lines: args.lines
                  } as PurchaseRequisition);
                  try {
                    await queryClient.invalidateQueries({ queryKey: ['purchaseRequisitions', user.uid] });
                  } catch {
                    // Ignore query client errors
                  }
                  setMessages(prev => [...prev, { role: 'model', parts: [{ text: `Created purchase requisition ${id}. You can view and edit it in Requisitions.` }] }]);
                  return;
                } catch (err) {
                  setMessages(prev => [...prev, { role: 'model', parts: [{ text: `Failed to create requisition: ${err instanceof Error ? err.message : 'Unknown error'}` }] }]);
                  return;
                }
              }
            }
          }
        }
        
        let processedCitationMetadata: { citationSources: CitationSource[] } | undefined = undefined;
        if (candidate.citationMetadata && candidate.citationMetadata.citationSources) {
          processedCitationMetadata = candidate.citationMetadata;
        }

        // Log regular AI response (non-function call)
        const aiResponseText = content?.parts?.[0]?.text || "No response text";
        
        // Debug logging for empty responses
        if (!content?.parts || content.parts.length === 0 || 
            !content.parts.some((p): p is { text: string } => 
              typeof p === 'object' && p !== null && 'text' in p && 
              typeof p.text === 'string' && p.text.trim().length > 0)) {
          console.warn('⚠️ AI returned empty or invalid response:', {
            has_content: !!content,
            parts_count: content?.parts?.length || 0,
            parts_with_text: content?.parts?.filter((p): p is { text: string } => 
              typeof p === 'object' && p !== null && 'text' in p && typeof p.text === 'string'
            )?.length || 0,
            first_part: content?.parts?.[0],
            timestamp: new Date().toISOString()
          });
        }
        // Regular AI response (logging removed)

        // Ensure we have valid parts with text content for regular responses
        const responseParts = content?.parts || [];
        const validParts = responseParts.filter((part): part is { text: string } => 
          typeof part === 'object' && 
          part !== null && 
          'text' in part && 
          typeof part.text === 'string' && 
          part.text.trim().length > 0
        );
        
        setMessages(prev => [...prev, {
          role: 'model',
          parts: validParts.length > 0 
            ? validParts 
            : [{ text: aiResponseText || "I couldn't generate a response. Please try again." }],
          citationMetadata: processedCitationMetadata
        }]);
      } else {
        throw new Error('No response from AI model');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, {
        role: 'model',
        parts: [{ text: "Error processing your request. Please try again." }]
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleResetChat = async () => {
    setMessages([]);
    setSessionActive(false);
    setChatSession(null);
    setInput('');
    toast.success('Chat reset successfully');
    
    // Reinitialize session with fresh context
    if (user) {
      setSessionInitializing(true);
      try {
        const session = await sessionService.initializeChatSession(user.uid);
        setChatSession(session);
        toast.success('Session refreshed with latest knowledge base');
      } catch (error) {
        console.error('Failed to refresh session:', error);
      } finally {
        setSessionInitializing(false);
      }
    }
  };

  const handleAttachDocuments = () => {
    navigate('/admin');
  };

  const handleOpenAdmin = () => {
    navigate('/admin');
  };
  
  // Initialize continuous improvement session when user starts chatting
  const initializeContinuousImprovement = async () => {
    if (!user || continuousImprovementSessionId) return;
    
    try {
      // For now, use a default prompt key if we don't have the actual one
      // This should be updated when the user selects/creates a prompt version
      const promptKey = currentPromptKey || `${user.email?.split('@')[0] || 'user'}_v1`;
      const sessionId = await createContinuousImprovementSession(
        promptKey, 
        chatSessionKey, 
        user.uid,
        user.email || undefined,
        undefined // displayName not available in AuthUser type
      );
      setContinuousImprovementSessionId(sessionId);
      console.log('📊 Continuous improvement session initialized:', sessionId);
    } catch (error) {
      console.error('Failed to initialize continuous improvement session:', error);
    }
  };

  // Handle user feedback for specific message - opens dialog
  const handleFeedback = async (feedback: 'thumbs_up' | 'thumbs_down', messageIndex: number) => {
    // Don't initialize session yet - only if they actually submit an issue
    // Store pending feedback and open dialog
    setPendingFeedback(feedback);
    setPendingMessageIndex(messageIndex);
    setFeedbackComment('');
    setFeedbackDialogOpen(true);
  };

  // Submit feedback with mandatory comment
  const submitFeedback = async () => {
    if (!pendingFeedback || pendingMessageIndex === null) {
      return;
    }

    // Comment is mandatory for both thumbs up and down
    if (!feedbackComment || feedbackComment.trim().length < 10) {
      toast.error('Please provide at least 10 characters of feedback to save the chat history');
      return;
    }

    try {
      // Initialize session when user provides feedback
      let sessionId = continuousImprovementSessionId;
      
      if (!sessionId) {
        // Create new session inline to ensure we have the ID immediately
        const promptKey = currentPromptKey || `${user?.email?.split('@')[0] || 'user'}_v1`;
        sessionId = await createContinuousImprovementSession(
          promptKey, 
          chatSessionKey, 
          user?.uid || '',
          user?.email || undefined,
          undefined // displayName not available in AuthUser type
        );
        
        // Check if session creation failed
        if (sessionId.startsWith('error_') || sessionId.startsWith('local_')) {
          console.error('Failed to create session:', sessionId);
          toast.error('Failed to save chat history to cloud. Please check your connection.');
          return;
        }
        
        setContinuousImprovementSessionId(sessionId);
        console.log('📊 Continuous improvement session initialized:', sessionId);
      }
      
      if (sessionId && !sessionId.startsWith('error_') && !sessionId.startsWith('local_')) {
        // Save all messages to Firestore as technical logs
        const messagesUpToFeedback = messages.slice(0, pendingMessageIndex + 1);
        
        console.log(`Saving ${messagesUpToFeedback.length} messages and ${apiCallLogs.length} API calls to session ${sessionId}`);
        
        // Add all messages as technical logs
        for (let i = 0; i < messagesUpToFeedback.length; i++) {
          const msg = messagesUpToFeedback[i];
          const logEntry = {
            event: msg.role === 'user' ? 'user_message' : 'ai_response',
            userMessage: msg.role === 'user' ? msg.parts[0]?.text : undefined,
            aiResponse: msg.role === 'model' ? msg.parts[0]?.text : undefined
          };
          console.log(`Saving message ${i + 1}/${messagesUpToFeedback.length}:`, logEntry.event);
          await addTechnicalLog(sessionId, logEntry);
        }
        
        // Add all API calls as technical logs
        for (let i = 0; i < apiCallLogs.length; i++) {
          const apiCall = apiCallLogs[i];
          const logEntry = {
            event: apiCall.error ? 'function_call_error' : 'function_call_success' as 'function_call_error' | 'function_call_success',
            functionName: apiCall.functionName,
            functionInputs: apiCall.functionArgs,
            functionOutputs: apiCall.functionResult,
            errorMessage: apiCall.error
            // Note: timestamp is handled by addTechnicalLog
          };
          console.log(`Saving API call ${i + 1}/${apiCallLogs.length}:`, apiCall.functionName);
          await addTechnicalLog(sessionId, logEntry);
        }
        
        // Save feedback
        await setUserFeedback(sessionId, pendingFeedback, feedbackComment);
        
        if (pendingFeedback === 'thumbs_up') {
          toast.success('👍 Thanks! Chat history saved with your positive feedback.');
        } else {
          toast.success('👎 Thanks! Chat history saved with your feedback for improvement.');
        }
      } else {
        toast.error('Failed to save chat history');
      }
      
      setFeedbackDialogOpen(false);
      setPendingFeedback(null);
      setPendingMessageIndex(null);
      setFeedbackComment('');
    } catch (error) {
      console.error('Failed to save feedback:', error);
      toast.error('Failed to save feedback');
    }
  };

  // Cancel feedback dialog
  const cancelFeedback = () => {
    setFeedbackDialogOpen(false);
    setPendingFeedback(null);
    setPendingMessageIndex(null);
    setFeedbackComment('');
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-black text-white p-8 text-center relative">
        {/* User info top left */}
        {user && (
          <div className="absolute top-4 left-4 text-sm text-gray-300">
            <span className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              Logged in as: <span className="text-white font-medium">{user.email}</span>
            </span>
          </div>
        )}
        
        {/* Action buttons top right */}
        <div className="absolute top-4 right-4 flex gap-2">
          <Button
            variant="ghost"
            onClick={handleOpenAdmin}
            className="text-white hover:bg-white/20"
          >
            <Settings className="h-4 w-4 mr-2" />
            Admin
          </Button>
          {onLogout && (
            <Button
              variant="ghost"
              onClick={onLogout}
              className="text-white hover:bg-white/20"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          )}
        </div>
        <div className="flex items-center justify-center mb-4">
          <Bot className="h-8 w-8 mr-3" />
          <h1 className="text-3xl font-bold">Professional Buyer AI Assistant</h1>
        </div>
        <p className="text-gray-300 text-lg max-w-4xl mx-auto">
          {user?.email && (
            <span className="font-medium">Welcome {user.email.split('@')[0]}! </span>
          )}
          Get expert procurement advice, use prenegotiated prices from best suppliers, and do professional level procurement with ease
        </p>
      </div>
      

      {/* Main Content under header with optional left panel */}
      {/* Controls row under header */}
      <div className="container mx-auto px-4 mt-4 flex justify-between">
        <div>{leftToggleControl}</div>
        <div>{topRightControls}</div>
      </div>

      <div className="container mx-auto px-4 pb-6">
        {leftPanelVisible && !generationVisible ? (
          // When chat is hidden but verification is visible, show verification full-screen
          <div className="h-full min-h-[60vh]">
            {leftPanel}
          </div>
        ) : leftPanelVisible && generationVisible ? (
          // When both are visible, show split view
          <ResizablePanelGroup direction="horizontal" className="h-full min-h-[60vh]">
            <ResizablePanel defaultSize={35} minSize={20} maxSize={60} className="pr-2">
              {leftPanel}
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={65} minSize={40} className="pl-2">
              <div className={"flex flex-col items-stretch"}>
            {/* Status Panel */}
            <div className="bg-white border rounded-md p-4 mb-2">
              {statusLoading ? (
                <div className="text-sm text-gray-600">Checking system status…</div>
              ) : (
                <div className="text-sm">
                  <div className="flex flex-wrap gap-4">
                    <div>
                      <span className={`font-medium ${initStatus.hasPrompt ? 'text-green-700' : 'text-red-700'}`}>System Prompt:</span>
                      <span className="ml-2 text-gray-700">{initStatus.hasPrompt ? 'Configured' : 'Missing'}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-800">Knowledge Docs:</span>
                      <span className="ml-2 text-gray-700">{initStatus.knowledgeCount}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-800">ERP API integrations:</span>
                      <span className="ml-2 text-gray-700">1</span>
                    </div>
                    
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <a href="/admin" className="text-xs inline-flex items-center px-3 py-2 border rounded-md hover:bg-gray-50">Open Admin</a>
                    <a href="/docs/setup_guide.html" target="_blank" rel="noreferrer" className="text-xs inline-flex items-center px-3 py-2 border rounded-md hover:bg-gray-50">Setup Guide (PDF)</a>
                  </div>
                  {!initStatus.hasPrompt && (
                    <div className="mt-2 text-xs text-red-700">
                      Please open Admin and configure a system prompt before chatting.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Reset button in corner */}
            <div className="flex justify-end mb-2">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleResetChat}
                className="text-red-600 hover:bg-red-50"
              >
                <RotateCcw className="h-4 w-4" />
                <span className="ml-2">Reset Chat</span>
              </Button>
            </div>

            {/* Quick Action Pills */}
            <div className="bg-white border rounded-md p-6 mb-2">
              <div className="flex flex-wrap gap-3 justify-center max-w-4xl mx-auto">
                {quickActions.map((action, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="rounded-full px-6 py-2 text-sm bg-white border-gray-300 text-gray-700 hover:bg-gray-100"
                    onClick={() => handleQuickAction(action)}
                  >
                    {action}
                  </Button>
                ))}
              </div>
            </div>

            {/* Chat Messages */}
            <div className="p-2 space-y-6">
              <div className="max-w-4xl ml-0 mr-auto space-y-6">
                
          {sessionInitializing && (
            <div className="flex justify-start">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                  <Bot className="h-5 w-5 text-gray-700" />
                </div>
                <div className="bg-white shadow-sm border rounded-2xl px-6 py-4 flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin text-gray-700" />
                  <span className="text-sm text-gray-600">Initializing AI with your knowledge base...</span>
                </div>
              </div>
            </div>
          )}
          
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className="flex items-start space-x-3 max-w-3xl w-full">
                {message.role === 'model' && (
                  <div className="flex-shrink-0 w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                    <Bot className="h-5 w-5 text-gray-700" />
                  </div>
                )}
                <div className="flex flex-col space-y-2 flex-1">
                  <div
                    className={`px-6 py-4 rounded-2xl ${
                      message.role === 'user'
                        ? 'bg-black text-white ml-auto max-w-lg'
                        : 'bg-white shadow-sm border'
                    }`}
                  >
                    {message.parts.map((part, partIndex) => (
                      <div key={partIndex}>
                        {part.text && (
                          <div className={`prose ${message.role === 'user' ? 'prose-invert' : ''} prose-sm max-w-none`}>
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {(() => {
                                const { originalText, formattedSources } = processTextWithCitations(
                                  part.text,
                                  message.citationMetadata?.citationSources
                                );
                                return originalText + (formattedSources.length > 0 ? '\n\n**Sources:**\n' + formattedSources.join('\n') : '');
                              })()}
                            </ReactMarkdown>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  {/* Feedback buttons for AI responses only */}
                  {message.role === 'model' && (
                    <div className="flex items-center space-x-2 ml-2">
                      <span className="text-xs text-gray-500">Was this helpful?</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleFeedback('thumbs_up', index)}
                        className="text-gray-500 hover:text-green-600 hover:bg-green-50 p-1 h-auto"
                        title="Good response"
                      >
                        <ThumbsUp className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleFeedback('thumbs_down', index)}
                        className="text-gray-500 hover:text-red-600 hover:bg-red-50 p-1 h-auto"
                        title="Poor response"
                      >
                        <ThumbsDown className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                  <Bot className="h-5 w-5 text-gray-700" />
                </div>
                <div className="bg-white shadow-sm border rounded-2xl px-6 py-4 flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin text-gray-700" />
                  <span className="text-sm text-gray-600">AI is thinking...</span>
                </div>
              </div>
            </div>
          )}
              </div>
            </div>

            {/* Input Area */}
            <div className="bg-white border rounded-md p-6">
              <div className="max-w-4xl mx-auto">
                <div className="flex space-x-4 items-end">
                  <div className="flex-1">
                    <Input
                      ref={inputRef}
                      type="text"
                      placeholder="Ask about procurement strategies, cost optimization, supplier management..."
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      disabled={isLoading || !initStatus.hasPrompt}
                      className="w-full h-12 px-4 text-lg border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent"
                    />
                  </div>
                  <Button
                    onClick={() => handleSendMessage()}
                    disabled={!input.trim() || isLoading || !initStatus.hasPrompt}
                    className="h-12 px-6 bg-black hover:bg-gray-800 text-white rounded-xl"
                  >
                    <Send className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        ) : !leftPanelVisible && generationVisible ? (
          // When only chat is visible (no verification), show full-width chat
          <div>
            <div className={"flex flex-col items-stretch"}>
              {/* Reset button in corner */}
              <div className="flex justify-end mb-2">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={handleResetChat}
                  className="text-red-600 hover:bg-red-50"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span className="ml-2">Reset Chat</span>
                </Button>
              </div>
              {/* Status Panel */}
              <div className="bg-white border rounded-md p-4 mb-2">
                {statusLoading ? (
                  <div className="text-sm text-gray-600">Checking system status…</div>
                ) : (
                  <div className="text-sm">
                    <div className="flex flex-wrap gap-4">
                      <div>
                        <span className={`font-medium ${initStatus.hasPrompt ? 'text-green-700' : 'text-red-700'}`}>System Prompt:</span>
                        <span className="ml-2 text-gray-700">{initStatus.hasPrompt ? 'Configured' : 'Missing'}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-800">Knowledge Docs:</span>
                        <span className="ml-2 text-gray-700">{initStatus.knowledgeCount}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-800">ERP API integrations:</span>
                        <span className="ml-2 text-gray-700">1</span>
                      </div>
                      
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <a href="/admin" className="text-xs inline-flex items-center px-3 py-2 border rounded-md hover:bg-gray-50">Open Admin</a>
                      <a href="/docs/setup_guide.html" target="_blank" rel="noreferrer" className="text-xs inline-flex items-center px-3 py-2 border rounded-md hover:bg-gray-50">Setup Guide (PDF)</a>
                    </div>
                    {!initStatus.hasPrompt && (
                      <div className="mt-2 text-xs text-red-700">
                        Please open Admin and configure a system prompt before chatting.
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="bg-white border rounded-md p-6 mb-2">
                <div className="flex flex-wrap gap-3 justify-center max-w-4xl mx-auto">
                  {quickActions.map((action, index) => (
                    <Button key={index} variant="outline" className="rounded-full px-6 py-2 text-sm bg-white border-gray-300 text-gray-700 hover:bg-gray-100" onClick={() => handleQuickAction(action)}>
                      {action}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="p-2 space-y-6">
                <div className="max-w-4xl mx-auto space-y-6">
                  {sessionInitializing && (
                    <div className="flex justify-start">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                          <Bot className="h-5 w-5 text-gray-700" />
                        </div>
                        <div className="bg-white shadow-sm border rounded-2xl px-6 py-4 flex items-center space-x-2">
                          <Loader2 className="h-4 w-4 animate-spin text-gray-700" />
                          <span className="text-sm text-gray-600">Initializing AI with your knowledge base...</span>
                        </div>
                      </div>
                    </div>
                  )}
                  {messages.map((message, index) => (
                    <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className="flex items-start space-x-3 max-w-3xl w-full">
                        {message.role === 'model' && (
                          <div className="flex-shrink-0 w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                            <Bot className="h-5 w-5 text-gray-700" />
                          </div>
                        )}
                        <div className="flex flex-col space-y-2 flex-1">
                          <div className={`px-6 py-4 rounded-2xl ${message.role === 'user' ? 'bg-black text-white ml-auto max-w-lg' : 'bg-white shadow-sm border'}`}>
                            {message.parts.map((part, partIndex) => (
                              <div key={partIndex}>
                                {part.text && (
                                  <div className={`prose ${message.role === 'user' ? 'prose-invert' : ''} prose-sm max-w-none`}>
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                      {(() => {
                                        const { originalText, formattedSources } = processTextWithCitations(part.text, message.citationMetadata?.citationSources);
                                        return originalText + (formattedSources.length > 0 ? '\n\n**Sources:**\n' + formattedSources.join('\n') : '');
                                      })()}
                                    </ReactMarkdown>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                          {message.role === 'model' && (
                            <div className="flex items-center space-x-2 ml-2">
                              <span className="text-xs text-gray-500">Was this helpful?</span>
                              <Button variant="ghost" size="sm" onClick={() => handleFeedback('thumbs_up', index)} className="text-gray-500 hover:text-green-600 hover:bg-green-50 p-1 h-auto" title="Good response">
                                <ThumbsUp className="h-3 w-3" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleFeedback('thumbs_down', index)} className="text-gray-500 hover:text-red-600 hover:bg-red-50 p-1 h-auto" title="Poor response">
                                <ThumbsDown className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                          <Bot className="h-5 w-5 text-gray-700" />
                        </div>
                        <div className="bg-white shadow-sm border rounded-2xl px-6 py-4 flex items-center space-x-2">
                          <Loader2 className="h-4 w-4 animate-spin text-gray-700" />
                          <span className="text-sm text-gray-600">AI is thinking...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="bg-white border rounded-md p-6">
                <div className="max-w-4xl mx-auto">
                  <div className="flex space-x-4 items-end">
                    <div className="flex-1">
                      <Input ref={inputRef} type="text" placeholder="Ask about procurement strategies, cost optimization, supplier management..." value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={handleKeyPress} disabled={isLoading || !initStatus.hasPrompt} className="w-full h-12 px-4 text-lg border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent" />
                    </div>
                    <Button onClick={() => handleSendMessage()} disabled={!input.trim() || isLoading || !initStatus.hasPrompt} className="h-12 px-6 bg-black hover:bg-gray-800 text-white rounded-xl">
                      <Send className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
        </div>
        ) : (
          // When both are hidden
          <div className="flex items-center justify-center h-full min-h-[60vh] bg-gray-50 rounded-lg">
            <div className="text-center text-gray-500">
              <p className="text-lg font-medium">No Panels Visible</p>
              <p className="text-sm mt-2">Toggle "Show verification" or "Show generation" to view content</p>
            </div>
          </div>
        )}
      </div>

      {/* Feedback Dialog */}
      <Dialog open={feedbackDialogOpen} onOpenChange={setFeedbackDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {pendingFeedback === 'thumbs_up' ? (
                <ThumbsUp className="h-5 w-5 text-green-600" />
              ) : (
                <ThumbsDown className="h-5 w-5 text-red-600" />
              )}
              Save Chat History with Feedback
            </DialogTitle>
            <DialogDescription>
              Your feedback helps improve the AI. Please provide at least 10 characters of feedback to save this chat conversation.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            
            <div className="space-y-2">
              <Label htmlFor="feedback-comment">
                Feedback comment (required to save chat history)
              </Label>
              <Textarea
                id="feedback-comment"
                placeholder={pendingFeedback === 'thumbs_up' 
                  ? 'What worked well? Please provide feedback (min 10 characters)'
                  : 'What could be improved? Please provide feedback (min 10 characters)'
                }
                value={feedbackComment}
                onChange={(e) => setFeedbackComment(e.target.value)}
                className="min-h-[100px]"
                required
              />
              {feedbackComment && feedbackComment.trim().length > 0 && feedbackComment.trim().length < 10 && (
                <p className="text-sm text-amber-600">
                  Please provide at least 10 characters to save chat history.
                </p>
              )}
              {!feedbackComment && (
                <p className="text-sm text-red-500">
                  Feedback is required to save chat history.
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={cancelFeedback}
            >
              Cancel
            </Button>
            <Button
              onClick={submitFeedback}
              disabled={!feedbackComment || feedbackComment.trim().length < 10}
              className={pendingFeedback === 'thumbs_up' ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}
            >
              Save Chat History
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProfessionalBuyerChat;