import React, { useState, useRef } from 'react';
import { Loader2, Send, RotateCcw, Bot, LogOut, Settings, ThumbsUp, ThumbsDown, FileText, Database, Bug, ChevronDown, CheckCircle, BookOpen } from "lucide-react";
import { SafeMarkdown } from './SafeMarkdown';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import PromptVersionManager from './PromptVersionManager';
import { KnowledgeManager } from './KnowledgeManager';
import { ERPApiTester } from './ERPApiTester';
import { toast } from 'sonner';
import { loadLatestPrompt, createContinuousImprovementSession, addTechnicalLog, setUserFeedback } from '../lib/firestoreService';
import { sessionService, ChatSession } from '../lib/sessionService';
import { erpApiService } from '../lib/erpApiService';
import { storageService } from '../lib/storageService';
import { createPurchaseRequisition } from '@/lib/firestoreService';
import { useQueryClient } from '@tanstack/react-query';
import type { PurchaseRequisition } from '@/types/purchaseRequisition';
import { callOpenRouterAPI, getOpenRouterErrorMessage, type OpenRouterMessage, type OpenRouterTool } from '../lib/openRouterService';

interface ProfessionalBuyerChatProps {
  onLogout?: () => void;
  leftPanel?: React.ReactNode;
  leftPanelVisible?: boolean;
  generationVisible?: boolean;
  leftToggleControl?: React.ReactNode;
  topRightControls?: React.ReactNode;
}

const defaultModel = 'google/gemini-2.5-flash';

// ERP Function Definitions for OpenRouter (compatible with function calling)
const openRouterTools: OpenRouterTool[] = [
  {
    type: "function",
    function: {
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
    }
  },
  {
    type: "function",
    function: {
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
    }
  }
];

interface Message {
  role: 'user' | 'assistant';
  content: string;
  tool_calls?: Array<{
    id: string;
    type: 'function';
    function: {
      name: string;
      arguments: string;
    };
  }>;
  tool_call_id?: string; // For tool responses
  name?: string; // Function name for tool responses
}

// Removed: processTextWithCitations (citations no longer supported without Google Search)

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
  const sessionInitStarted = useRef(false);
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

  // AI model settings
  const [currentModel, setCurrentModel] = useState(defaultModel);
  const [currentTemperature, setCurrentTemperature] = useState(0.05);

  // System initialization status
  const [statusLoading, setStatusLoading] = useState(false);
  const [initStatus, setInitStatus] = useState<{ hasPrompt: boolean; knowledgeCount: number; erpCount: number }>({
    hasPrompt: false,
    knowledgeCount: 0,
    erpCount: 0
  });

  // Admin dialog states
  const [promptDialogOpen, setPromptDialogOpen] = useState(false);
  const [knowledgeDialogOpen, setKnowledgeDialogOpen] = useState(false);
  const [erpDialogOpen, setErpDialogOpen] = useState(false);

  React.useEffect(() => {
    const checkStatus = async () => {
      if (!user || !user.uid) {
        console.log('User not authenticated yet, skipping status check');
        return;
      }
      setStatusLoading(true);
      try {
        const [prompt, knowledge] = await Promise.all([
          sessionService.getLatestSystemPrompt(user.uid),
          storageService.getUserDocuments(user.uid).catch((err) => {
            console.warn('Failed to fetch knowledge docs:', err);
            return [];
          })
        ]);
        setInitStatus({
          hasPrompt: !!prompt?.systemPrompt,
          knowledgeCount: Array.isArray(knowledge) ? knowledge.length : 0,
          erpCount: 0
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
      // Use ref to prevent duplicate initialization in React StrictMode
      if (!sessionActive && user && user.uid && !sessionInitializing && !sessionInitStarted.current) {
        sessionInitStarted.current = true;
        setSessionInitializing(true);
        try {
          // Initialize session with system prompt + knowledge documents
          const session = await sessionService.initializeChatSession(user.uid, user.email || undefined);
          setChatSession(session);

          // Load model settings once at session start
          try {
            const promptData = await loadLatestPrompt();
            if (promptData) {
              setCurrentModel(promptData.model || defaultModel);
              setCurrentTemperature(promptData.temperature ?? 0.05);
              console.log('%c⚙️ Session initialized with model settings:', 'color: #8b5cf6; font-weight: bold', {
                model: promptData.model,
                temperature: promptData.temperature
              });
            }
          } catch (settingsError) {
            console.error('Error loading model settings:', settingsError);
          }

          // Extract user's name from email (everything before @)
          const userName = user.email ? user.email.split('@')[0] : 'there';

          const welcomeMessage: Message = {
            role: 'assistant',
            content: `Hello **${userName}**! I'm your Professional Buyer AI Assistant.

What procurement needs can I help you with today?`
          };

          // Only set welcome if messages are empty (prevent overwriting during re-render)
          setMessages(prev => {
            if (prev.length === 0) {
              console.log('📝 Setting initial welcome message');
              return [welcomeMessage];
            }
            console.log('⚠️ Messages already exist, skipping welcome:', prev.length);
            return prev;
          });
          setSessionActive(true);
          toast.success(`Session initialized`);
        } catch (error) {
          console.error('Failed to initialize session:', error);
          toast.error('Failed to initialize. Please check Prompt Editor settings.');
          setSessionActive(false);
        } finally {
          setSessionInitializing(false);
        }
      }
    };

    initializeSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

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

    const userMessage: Message = { role: 'user', content: textToSend };
    setMessages(prev => [...prev, userMessage]);
    if (!messageText) setInput('');
    setIsLoading(true);

    try {
      // Use session context if available, otherwise fallback to loading prompt
      let systemPrompt = '';
      let modelToUse = currentModel || defaultModel;
      let temperatureToUse = currentTemperature ?? 0.05;

      if (chatSession) {
        systemPrompt = chatSession.fullContext;
        // Use already-loaded model settings from state (loaded during session init)

        const estimatedTokens = Math.ceil(systemPrompt.length / 4);
        console.log('📊 Context Token Estimate:', {
          characterCount: systemPrompt.length,
          estimatedTokens: estimatedTokens,
          warningLevel: estimatedTokens > 30000 ? '🔴 TOO HIGH' : estimatedTokens > 20000 ? '🟡 HIGH' : '🟢 OK',
          contextComponents: {
            systemPromptChars: chatSession.systemPrompt?.length || 0,
            knowledgeContextChars: chatSession.knowledgeContext?.length || 0
          },
          recommendation: estimatedTokens > 30000 ? 'Consider using vector database or reducing knowledge documents' : 'Token count acceptable'
        });

        if (estimatedTokens > 30000) {
          console.warn('⚠️ Context may be too large. This could cause no response or errors.');
          toast.warning('Large knowledge base detected. Response may be slow or fail.');
        }
      } else {
        // No chat session - this shouldn't happen normally, but fallback to loading prompt
        try {
          const promptData = await loadLatestPrompt();
          if (promptData) {
            systemPrompt = promptData.prompt;
            modelToUse = promptData.model || defaultModel;
            temperatureToUse = promptData.temperature ?? 0.05;
          }
        } catch (error) {
          console.error('Error loading prompt:', error);
        }

        if (!systemPrompt) {
          throw new Error('No system prompt configured. Please visit Admin panel to set up your prompt.');
        }
      }

      // Build OpenRouter messages with history
      const openRouterMessages: OpenRouterMessage[] = [
        { role: 'system', content: systemPrompt }
      ];

      // Add conversation history
      messages.forEach(msg => {
        openRouterMessages.push({
          role: msg.role,
          content: msg.content
        });
      });

      // Add current user message
      openRouterMessages.push({ role: 'user', content: textToSend });

      const result = await callOpenRouterAPI(
        openRouterMessages,
        modelToUse,
        undefined,
        openRouterTools,
        temperatureToUse
      );

      // Check if the response contains tool calls (function calling)
      const assistantMessage = result.choices?.[0]?.message;

      if (assistantMessage?.tool_calls && assistantMessage.tool_calls.length > 0) {
        // Handle function calling
        const toolCall = assistantMessage.tool_calls[0];
        const functionName = toolCall.function.name;
        const functionArgs = JSON.parse(toolCall.function.arguments);

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
                  
                  // Add function result to messages and call API again
                  const followUpMessages: OpenRouterMessage[] = [
                    { role: 'system', content: systemPrompt },
                    ...openRouterMessages.slice(1), // Skip the system message, already added
                    {
                      role: 'assistant',
                      content: null as unknown as string, // OpenRouter expects this for tool calls
                      tool_calls: [toolCall]
                    },
                    {
                      role: 'user', // Tool responses use 'user' role in OpenRouter
                      content: JSON.stringify({
                        records: searchResult.records,
                        totalCount: searchResult.totalCount,
                        processingTimeMs: searchResult.processingTimeMs
                      })
                    }
                  ];

                  // Generate follow-up response with function results
                  const followUpResult = await callOpenRouterAPI(
                    followUpMessages,
                    modelToUse,
                    undefined,
                    openRouterTools,
                    temperatureToUse
                  );

                  const followUpResponse = followUpResult.choices?.[0]?.message?.content;
                  if (followUpResponse) {
                    console.log('💬 AI FINAL RESPONSE [' + aiRequestId + ']:', {
                      response_text_length: followUpResponse.length,
                      response_preview: followUpResponse.substring(0, 200) + (followUpResponse.length > 200 ? '...' : ''),
                      included_erp_data: searchResult.totalCount > 0,
                      timestamp: new Date().toISOString(),
                      ai_request_id: aiRequestId
                    });

                    const functionNote = '\n\n---\n_🔧 Käytetty toiminto: ERP-tietojen haku_';
                    const responseText = followUpResponse + functionNote;

                    setMessages(prev => [...prev, {
                      role: 'assistant',
                      content: responseText
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
                  const errorMessage = `I tried to search your ERP data but encountered an error: ${functionError instanceof Error ? functionError.message : 'Unknown error'}. Please make sure you have uploaded your ERP data in the Admin panel.`;
                  const functionNote = '\n\n---\n_🔧 Käytetty toiminto: ERP-tietojen haku (virhe)_';
                  setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: errorMessage + functionNote
                  }]);
                  return;
                }
              }
        if (functionName === 'create_purchase_requisition') {
          try {
            const aiRequestId = Math.random().toString(36).substring(2, 8);
            console.log('🤖 AI FUNCTION CALL [' + aiRequestId + ']:', {
              function_name: functionName,
              ai_parameters: functionArgs
            });

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

            const successMessage = `Created purchase requisition ${id}. You can view and edit it in Requisitions.`;
            const functionNote = '\n\n---\n_🔧 Käytetty toiminto: Ostoehdotuksen luonti_';
            setMessages(prev => [...prev, { role: 'assistant', content: successMessage + functionNote }]);
            return;
          } catch (err) {
            const errorMessage = `Failed to create requisition: ${err instanceof Error ? err.message : 'Unknown error'}`;
            const functionNote = '\n\n---\n_🔧 Käytetty toiminto: Ostoehdotuksen luonti (virhe)_';
            setMessages(prev => [...prev, { role: 'assistant', content: errorMessage + functionNote }]);
            return;
          }
        }
      }

      // No function call - handle normal response
      const responseContent = assistantMessage?.content;
      if (responseContent) {
        console.log('💬 Adding AI response:', responseContent.substring(0, 100) + '...');
        setMessages(prev => {
          console.log('📊 Current messages before adding response:', prev.length);
          return [...prev, {
            role: 'assistant',
            content: responseContent
          }];
        });
      } else {
        throw new Error('No response from AI model');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = error instanceof Error ? getOpenRouterErrorMessage(error) : 'Error processing your request';
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: errorMessage
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

    // Reinitialize session with fresh context
    if (user) {
      setSessionInitializing(true);
      try {
        const session = await sessionService.initializeChatSession(user.uid);
        setChatSession(session);

        // Reload model settings
        try {
          const promptData = await loadLatestPrompt();
          if (promptData) {
            setCurrentModel(promptData.model || defaultModel);
            setCurrentTemperature(promptData.temperature ?? 0.05);
          }
        } catch (settingsError) {
          console.error('Error loading model settings:', settingsError);
        }

        // Create welcome message
        const userName = user.email ? user.email.split('@')[0] : 'there';
        const welcomeMessage: Message = {
          role: 'assistant',
          content: `Hello **${userName}**! Chat has been reset.

What procurement needs can I help you with today?`
        };
        setMessages([welcomeMessage]);
        setSessionActive(true);
        toast.success('Chat reset and refreshed with latest knowledge base');
      } catch (error) {
        console.error('Failed to refresh session:', error);
        toast.error('Failed to reset chat');
      } finally {
        setSessionInitializing(false);
      }
    }
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
            userMessage: msg.role === 'user' ? msg.content : undefined,
            aiResponse: msg.role === 'assistant' ? msg.content : undefined
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
    <div className="flex flex-col h-screen bg-background">
      {/* Header - Elegant gradient design */}
      <div className="bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200">
        <div className="container mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            {/* Left: Logo + Title */}
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 bg-primary rounded-xl flex items-center justify-center shadow-sm">
                <Bot className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-slate-800">Professional Buyer AI</h1>
                <p className="text-sm text-slate-500">Procurement Intelligence Assistant</p>
              </div>
            </div>

            {/* Right: User info + Menu */}
            <div className="flex items-center gap-4">
              {user && (
                <div className="hidden sm:flex items-center gap-2 text-sm text-slate-600">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                  <span>{user.email}</span>
                </div>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300">
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                    <ChevronDown className="h-4 w-4 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuItem onClick={() => setPromptDialogOpen(true)}>
                    <FileText className="h-4 w-4 mr-2" />
                    Prompt Editor
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setKnowledgeDialogOpen(true)}>
                    <BookOpen className="h-4 w-4 mr-2" />
                    Knowledge Manager
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setErpDialogOpen(true)}>
                    <Database className="h-4 w-4 mr-2" />
                    ERP Testing
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/issues')}>
                    <Bug className="h-4 w-4 mr-2" />
                    Issue Reports
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {onLogout && (
                    <DropdownMenuItem onClick={onLogout} className="text-red-600 focus:text-red-600">
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      {/* Controls row under header */}
      <div className="container mx-auto px-6 mt-4 flex justify-between">
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
            {/* Status Panel - Elegant compact design */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-4">
              {statusLoading ? (
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Checking system status…
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle className={`h-4 w-4 ${initStatus.hasPrompt ? 'text-emerald-500' : 'text-red-400'}`} />
                      <span className="text-slate-600">System {initStatus.hasPrompt ? 'Ready' : 'Not Configured'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-primary" />
                      <span className="text-slate-600">{initStatus.knowledgeCount} Knowledge Docs</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Database className="h-4 w-4 text-primary" />
                      <span className="text-slate-600">ERP Connected</span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleResetChat}
                    className="text-slate-500 hover:text-red-600 hover:bg-red-50"
                  >
                    <RotateCcw className="h-4 w-4 mr-1" />
                    Reset
                  </Button>
                </div>
              )}
              {!initStatus.hasPrompt && (
                <div className="mt-3 text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  Configure a system prompt in Settings → Prompt Editor to get started.
                </div>
              )}
            </div>

            {/* Quick Action Pills - Refined design */}
            <div className="mb-4">
              <div className="flex flex-wrap gap-2 justify-center">
                {quickActions.map((action, index) => (
                  <button
                    key={index}
                    className="px-5 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-200
                               rounded-full hover:border-primary hover:text-primary transition-all duration-200
                               shadow-sm hover:shadow-md"
                    onClick={() => handleQuickAction(action)}
                  >
                    {action}
                  </button>
                ))}
              </div>
            </div>

            {/* Chat Messages - Elegant design */}
            <div className="space-y-4">
              <div className="max-w-4xl space-y-4">

          {sessionInitializing && (
            <div className="flex justify-start">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Bot className="h-5 w-5 text-primary" />
                </div>
                <div className="bg-white shadow-sm border border-slate-200 rounded-2xl rounded-bl-md px-5 py-3 flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-sm text-slate-600">Initializing AI with your knowledge base...</span>
                </div>
              </div>
            </div>
          )}

          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex items-start gap-3 max-w-3xl ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                {message.role === 'assistant' && (
                  <div className="flex-shrink-0 w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center">
                    <Bot className="h-5 w-5 text-primary" />
                  </div>
                )}
                <div className="flex flex-col gap-2">
                  <div
                    className={`px-5 py-3 ${
                      message.role === 'user'
                        ? 'bg-gradient-to-br from-primary to-blue-600 text-white rounded-2xl rounded-br-md shadow-md max-w-lg'
                        : 'bg-white shadow-sm border border-slate-200 rounded-2xl rounded-bl-md'
                    }`}
                  >
                    <SafeMarkdown className={`prose ${message.role === 'user' ? 'prose-invert' : 'prose-slate'} prose-sm max-w-none`}>
                      {message.content}
                    </SafeMarkdown>
                  </div>

                  {/* Feedback buttons for AI responses only */}
                  {message.role === 'assistant' && (
                    <div className="flex items-center gap-2 ml-1">
                      <span className="text-xs text-slate-400">Was this helpful?</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleFeedback('thumbs_up', index)}
                        className="text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 p-1 h-auto"
                        title="Good response"
                      >
                        <ThumbsUp className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleFeedback('thumbs_down', index)}
                        className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-1 h-auto"
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
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Bot className="h-5 w-5 text-primary" />
                </div>
                <div className="bg-white shadow-sm border border-slate-200 rounded-2xl rounded-bl-md px-5 py-3 flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-sm text-slate-600">AI is thinking...</span>
                </div>
              </div>
            </div>
          )}
              </div>
            </div>

            {/* Input Area - Modern floating design */}
            <div className="mt-4">
              <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-2">
                <div className="flex items-center gap-3">
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="Ask about procurement strategies, cost optimization, supplier management..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={isLoading || !initStatus.hasPrompt}
                    className="flex-1 px-4 py-3 text-base bg-transparent border-0 focus:outline-none focus:ring-0 placeholder:text-slate-400 disabled:opacity-50"
                  />
                  <Button
                    onClick={() => handleSendMessage()}
                    disabled={!input.trim() || isLoading || !initStatus.hasPrompt}
                    className="px-6 py-3 h-auto bg-primary hover:bg-primary/90 text-white rounded-xl font-medium transition-colors shadow-sm disabled:opacity-50"
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
            <div className="flex flex-col items-stretch">
              {/* Status Panel - Elegant compact design */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-4">
                {statusLoading ? (
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Checking system status…
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6 text-sm">
                      <div className="flex items-center gap-2">
                        <CheckCircle className={`h-4 w-4 ${initStatus.hasPrompt ? 'text-emerald-500' : 'text-red-400'}`} />
                        <span className="text-slate-600">System {initStatus.hasPrompt ? 'Ready' : 'Not Configured'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-primary" />
                        <span className="text-slate-600">{initStatus.knowledgeCount} Knowledge Docs</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Database className="h-4 w-4 text-primary" />
                        <span className="text-slate-600">ERP Connected</span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleResetChat}
                      className="text-slate-500 hover:text-red-600 hover:bg-red-50"
                    >
                      <RotateCcw className="h-4 w-4 mr-1" />
                      Reset
                    </Button>
                  </div>
                )}
                {!initStatus.hasPrompt && (
                  <div className="mt-3 text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    Configure a system prompt in Settings → Prompt Editor to get started.
                  </div>
                )}
              </div>

              {/* Quick Action Pills - Refined design */}
              <div className="mb-4">
                <div className="flex flex-wrap gap-2 justify-center">
                  {quickActions.map((action, index) => (
                    <button
                      key={index}
                      className="px-5 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-200
                                 rounded-full hover:border-primary hover:text-primary transition-all duration-200
                                 shadow-sm hover:shadow-md"
                      onClick={() => handleQuickAction(action)}
                    >
                      {action}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chat Messages - Elegant design */}
              <div className="space-y-4">
                <div className="max-w-4xl mx-auto space-y-4">
                  {sessionInitializing && (
                    <div className="flex justify-start">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center">
                          <Bot className="h-5 w-5 text-primary" />
                        </div>
                        <div className="bg-white shadow-sm border border-slate-200 rounded-2xl rounded-bl-md px-5 py-3 flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin text-primary" />
                          <span className="text-sm text-slate-600">Initializing AI with your knowledge base...</span>
                        </div>
                      </div>
                    </div>
                  )}
                  {messages.map((message, index) => (
                    <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`flex items-start gap-3 max-w-3xl ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                        {message.role === 'assistant' && (
                          <div className="flex-shrink-0 w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center">
                            <Bot className="h-5 w-5 text-primary" />
                          </div>
                        )}
                        <div className="flex flex-col gap-2">
                          <div className={`px-5 py-3 ${
                            message.role === 'user'
                              ? 'bg-gradient-to-br from-primary to-blue-600 text-white rounded-2xl rounded-br-md shadow-md max-w-lg'
                              : 'bg-white shadow-sm border border-slate-200 rounded-2xl rounded-bl-md'
                          }`}>
                            <SafeMarkdown className={`prose ${message.role === 'user' ? 'prose-invert' : 'prose-slate'} prose-sm max-w-none`}>
                              {message.content}
                            </SafeMarkdown>
                          </div>
                          {message.role === 'assistant' && (
                            <div className="flex items-center gap-2 ml-1">
                              <span className="text-xs text-slate-400">Was this helpful?</span>
                              <Button variant="ghost" size="sm" onClick={() => handleFeedback('thumbs_up', index)} className="text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 p-1 h-auto" title="Good response">
                                <ThumbsUp className="h-3 w-3" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleFeedback('thumbs_down', index)} className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-1 h-auto" title="Poor response">
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
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center">
                          <Bot className="h-5 w-5 text-primary" />
                        </div>
                        <div className="bg-white shadow-sm border border-slate-200 rounded-2xl rounded-bl-md px-5 py-3 flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin text-primary" />
                          <span className="text-sm text-slate-600">AI is thinking...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Input Area - Modern floating design */}
              <div className="mt-4">
                <div className="max-w-4xl mx-auto">
                  <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-2">
                    <div className="flex items-center gap-3">
                      <input
                        ref={inputRef}
                        type="text"
                        placeholder="Ask about procurement strategies, cost optimization, supplier management..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        disabled={isLoading || !initStatus.hasPrompt}
                        className="flex-1 px-4 py-3 text-base bg-transparent border-0 focus:outline-none focus:ring-0 placeholder:text-slate-400 disabled:opacity-50"
                      />
                      <Button
                        onClick={() => handleSendMessage()}
                        disabled={!input.trim() || isLoading || !initStatus.hasPrompt}
                        className="px-6 py-3 h-auto bg-primary hover:bg-primary/90 text-white rounded-xl font-medium transition-colors shadow-sm disabled:opacity-50"
                      >
                        <Send className="h-5 w-5" />
                      </Button>
                    </div>
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

      {/* Admin Dialogs */}
      <Dialog open={promptDialogOpen} onOpenChange={setPromptDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Prompt Editor</DialogTitle>
            <DialogDescription>
              Manage your AI system prompts and version history
            </DialogDescription>
          </DialogHeader>
          <PromptVersionManager />
        </DialogContent>
      </Dialog>

      <Dialog open={knowledgeDialogOpen} onOpenChange={setKnowledgeDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Knowledge Manager</DialogTitle>
            <DialogDescription>
              Upload and manage your internal knowledge base documents
            </DialogDescription>
          </DialogHeader>
          <KnowledgeManager />
        </DialogContent>
      </Dialog>

      <Dialog open={erpDialogOpen} onOpenChange={setErpDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>ERP Testing</DialogTitle>
            <DialogDescription>
              Test your ERP API integrations
            </DialogDescription>
          </DialogHeader>
          <ERPApiTester />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProfessionalBuyerChat;