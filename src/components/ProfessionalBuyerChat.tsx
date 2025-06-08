import React, { useState, useRef } from 'react';
import { GoogleGenerativeAI, Part } from '@google/generative-ai';
import { Loader2, Send, RotateCcw, Paperclip, Bot, LogOut, Settings } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { loadLatestPrompt } from '../lib/firestoreService';
import { sessionService, ChatSession } from '../lib/sessionService';
import { erpApiService } from '../lib/erpApiService';

interface ProfessionalBuyerChatProps {
  onLogout?: () => void;
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

const ProfessionalBuyerChat: React.FC<ProfessionalBuyerChatProps> = ({ onLogout }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionActive, setSessionActive] = useState(false);
  const [chatSession, setChatSession] = useState<ChatSession | null>(null);
  const [sessionInitializing, setSessionInitializing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Initialize chat session with context
  React.useEffect(() => {
    const initializeSession = async () => {
      if (!sessionActive && user && !sessionInitializing) {
        setSessionInitializing(true);
        try {
          // Initialize session with system prompt + knowledge documents
          const session = await sessionService.initializeChatSession(user.uid);
          setChatSession(session);
          
          // Check if this is a new user (no documents loaded)
          const isLikelyNewUser = session.documentsUsed.length === 0;
          
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
                : `Hello! I'm your Professional Buyer AI Assistant. I'm here to help you optimize your procurement processes, negotiate better deals, and achieve significant cost savings.

📚 **Knowledge Base Loaded:** ${session.documentsUsed.length} document(s) available for reference.

What can I help you with today?`
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
          const welcomeMessage: Message = {
            role: 'model',
            parts: [{
              text: "Hello! I'm your Professional Buyer AI Assistant. I'm here to help you optimize your procurement processes, negotiate better deals, and achieve significant cost savings. What can I help you with today?"
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
    "Create purchase orders easily and correctly"
  ];

  const handleQuickAction = async (action: string) => {
    setInput(action);
    await handleSendMessage(action);
  };

  const handleSendMessage = async (messageText?: string) => {
    const textToSend = messageText || input;
    if (!textToSend.trim() || isLoading) return;

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

        // Final fallback to default procurement prompt
        if (!systemPrompt) {
          systemPrompt = `You are a Professional Buyer AI Assistant. You help users optimize procurement processes, negotiate better deals, and achieve cost savings. 

Key capabilities:
- Provide expert procurement advice
- Help with supplier negotiations
- Suggest cost optimization strategies
- Assist with purchase order creation
- Guide approval processes
- Recommend preferred suppliers
- Help with contract analysis

Be helpful, professional, and focus on practical procurement solutions.`;
        }
      }

      const model = genAI.getGenerativeModel({
        model: geminiModel,
        generationConfig: { temperature: 0.2 },
        tools: [
          { functionDeclarations: [searchERPFunction] }
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

                  // Execute ERP search (this will generate its own logs with request ID)
                  const searchResult = await erpApiService.searchRecords(user!.uid, functionArgs);
                  
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
                    
                    // Log AI's final response
                    console.log('💬 AI FINAL RESPONSE [' + aiRequestId + ']:', {
                      response_text_length: aiResponseText.length,
                      response_preview: aiResponseText.substring(0, 200) + (aiResponseText.length > 200 ? '...' : ''),
                      included_erp_data: searchResult.totalCount > 0,
                      timestamp: new Date().toISOString(),
                      ai_request_id: aiRequestId
                    });
                    
                    setMessages(prev => [...prev, {
                      role: 'model',
                      parts: followUpResponse.candidates[0].content?.parts || [{ text: "I executed the search but couldn't format the response." }]
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
                  
                  console.error('Function execution failed:', functionError);
                  setMessages(prev => [...prev, {
                    role: 'model',
                    parts: [{ text: `I tried to search your ERP data but encountered an error: ${functionError instanceof Error ? functionError.message : 'Unknown error'}. Please make sure you have uploaded your ERP data in the Admin panel.` }]
                  }]);
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

        setMessages(prev => [...prev, {
          role: 'model',
          parts: content?.parts || [{ text: "I couldn't generate a response." }],
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
          Get expert procurement advice, use prenegotiated prices from best suppliers, and do professional level procurement with ease
        </p>
      </div>

      {/* Action Buttons */}
      <div className="bg-white border-b p-4">
        <div className="flex gap-3 justify-center">
          <Button 
            variant="outline" 
            onClick={handleResetChat}
            className="text-red-600 border-red-200 hover:bg-red-50"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset Chat
          </Button>
          <Button 
            variant="outline" 
            onClick={handleAttachDocuments}
            className="text-gray-700 border-gray-300 hover:bg-gray-100"
          >
            <Paperclip className="mr-2 h-4 w-4" />
            Upload Documents
          </Button>
        </div>
      </div>

      {/* Quick Action Pills */}
      <div className="bg-white border-b p-6">
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
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
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
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className="flex items-start space-x-3 max-w-3xl">
                {message.role === 'model' && (
                  <div className="flex-shrink-0 w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                    <Bot className="h-5 w-5 text-gray-700" />
                  </div>
                )}
                <div
                  className={`px-6 py-4 rounded-2xl ${
                    message.role === 'user'
                      ? 'bg-black text-white ml-auto'
                      : 'bg-white shadow-sm border'
                  }`}
                >
                  {message.parts.map((part, partIndex) => (
                    <div key={partIndex}>
                      {part.text && (
                        <div className={`prose ${message.role === 'user' ? 'prose-invert' : ''} prose-sm max-w-none`}>
                          <ReactMarkdown>
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
      <div className="bg-white border-t p-6">
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
                disabled={isLoading}
                className="w-full h-12 px-4 text-lg border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>
            <Button
              onClick={() => handleSendMessage()}
              disabled={!input.trim() || isLoading}
              className="h-12 px-6 bg-black hover:bg-gray-800 text-white rounded-xl"
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfessionalBuyerChat;