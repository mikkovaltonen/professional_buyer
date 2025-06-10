import React, { useState, useRef } from 'react';
import { GoogleGenerativeAI, Part } from '@google/generative-ai';
import { Loader2, Send, FileText, Download, Table } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'sonner';
import { loadLatestPrompt } from '../lib/firestoreService';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
const geminiModel = import.meta.env.VITE_GEMINI_MODEL || 'gemini-2.5-pro-preview-03-25';

const genAI = new GoogleGenerativeAI(apiKey);

interface UploadedFile {
  name: string;
  type: string;
  size: number;
  content: string | ArrayBuffer;
  url?: string;
}

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

interface ProcurementChatProps {
  uploadedFiles: UploadedFile[];
  onCorrectionsApplied: () => void;
  applyBatchCorrectionsFromChat: (corrections: unknown[]) => void;
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

const ProcurementChat: React.FC<ProcurementChatProps> = ({ 
  uploadedFiles,
  onCorrectionsApplied,
  applyBatchCorrectionsFromChat
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionActive, setSessionActive] = useState(false);
  const [extractedData, setExtractedData] = useState<Record<string, unknown>[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  const processFileForAI = (file: UploadedFile): Part | null => {
    try {
      if (file.type === 'application/pdf') {
        // For PDFs, we'll include metadata about the file
        return {
          text: `[PDF Document: ${file.name}]\nThis is a PDF document that needs to be analyzed. The user has uploaded this file for procurement analysis.`
        };
      } else if (file.type.includes('spreadsheet') || file.type.includes('excel') || file.type === 'text/csv') {
        // For Excel/CSV files, include the content if it's text
        if (typeof file.content === 'string') {
          return {
            text: `[Spreadsheet/CSV Document: ${file.name}]\n${file.content.substring(0, 10000)}` // Limit to first 10k chars
          };
        }
      } else if (file.type.includes('word') || file.type.includes('document')) {
        // For Word documents
        if (typeof file.content === 'string') {
          return {
            text: `[Word Document: ${file.name}]\n${file.content.substring(0, 10000)}`
          };
        }
      }
      
      return {
        text: `[Document: ${file.name}]\nFile type: ${file.type}\nSize: ${file.size} bytes\nThis document has been uploaded for procurement analysis.`
      };
    } catch (error) {
      console.error('Error processing file for AI:', error);
      return null;
    }
  };

  const handleStartSession = async () => {
    if (uploadedFiles.length === 0) {
      toast.error('Please upload some documents first before starting the analysis session.');
      return;
    }

    // Load the latest system prompt version
    let systemPrompt = '';
    if (user?.email) {
      try {
        const latestPrompt = await loadLatestPrompt(user.email);
        if (latestPrompt) {
          systemPrompt = latestPrompt;
          console.log('[ProcurementChat] Using latest saved prompt version');
        }
      } catch (error) {
        console.error('[ProcurementChat] Error loading latest prompt:', error);
      }
    }

    // Fallback to default prompt if no saved version
    if (!systemPrompt) {
      try {
        const response = await fetch('/docs/gemini_instructions.md');
        if (response.ok) {
          systemPrompt = await response.text();
          console.log('[ProcurementChat] Using default prompt from file');
        } else {
          throw new Error('Failed to fetch default prompt');
        }
      } catch (error) {
        console.error('[ProcurementChat] Error loading default prompt:', error);
        throw new Error('No system prompt configured. Please visit Admin panel to set up your prompt.');
      }
    }

    setMessages([]);
    setSessionActive(true);
    setInput('');
    inputRef.current?.focus();
    setIsLoading(true);

    try {
      const initialMessageParts: Part[] = [{ text: systemPrompt }];
      
      // Add document information to the context
      const documentSummary = uploadedFiles.map(file => 
        `- ${file.name} (${file.type}, ${Math.round(file.size / 1024)}KB)`
      ).join('\n');
      
      initialMessageParts.push({
        text: `\n\nUploaded Documents for Analysis:\n${documentSummary}\n\nPlease provide an initial analysis overview of these documents and suggest what insights you can provide.`
      });

      // Process each file and add to message parts
      uploadedFiles.forEach(file => {
        const filePart = processFileForAI(file);
        if (filePart) {
          initialMessageParts.push(filePart);
        }
      });

      const model = genAI.getGenerativeModel({
        model: geminiModel,
        generationConfig: { temperature: 0.2 },
      });
      
      console.log("[ProcurementChat] Starting session with uploaded documents");
      const result = await model.generateContent({ 
        contents: [{ role: 'user', parts: initialMessageParts }], 
        tools: [{ googleSearch: {} }] 
      });
      
      const response = result.response;
      if (response && response.candidates && response.candidates.length > 0) {
        const candidate = response.candidates[0];
        const content = candidate.content;
        
        setMessages([
          { role: 'user', parts: [{ text: 'Initialize document analysis session' }] },
          { role: 'model', parts: content?.parts || [{ text: "Session started successfully." }] }
        ]);
      } else {
        throw new Error('No response from AI model');
      }
    } catch (error) {
      console.error('Error starting session:', error);
      toast.error('Failed to start analysis session. Please check your API configuration.');
      setMessages([
        { role: 'user', parts: [{ text: 'Initialize document analysis session' }] },
        { role: 'model', parts: [{ text: "Error starting session. Please try again." }] }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', parts: [{ text: input }] };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const model = genAI.getGenerativeModel({
        model: geminiModel,
        generationConfig: { temperature: 0.2 },
      });

      const history = messages.map(msg => ({ role: msg.role, parts: msg.parts }));
      const result = await model.generateContent({
        contents: [...history, { role: 'user', parts: [{ text: input }] }],
        tools: [{ googleSearch: {} }]
      });

      const response = result.response;
      if (response && response.candidates && response.candidates.length > 0) {
        const candidate = response.candidates[0];
        const content = candidate.content;
        
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

  const handleStructuredExtraction = async (type: 'suppliers' | 'pricing' | 'contracts') => {
    if (!sessionActive) {
      toast.error('Please start an analysis session first');
      return;
    }

    const prompts = {
      suppliers: `Extract all supplier information from the uploaded documents and provide it in a structured JSON format. Include: supplier name, contact details, capabilities, certifications, performance metrics, and any other relevant supplier data. Format as an array of supplier objects.`,
      pricing: `Extract all pricing information from the uploaded documents and provide it in a structured JSON format. Include: item names, prices, quantities, units, suppliers, effective dates, and any pricing terms. Format as an array of pricing objects.`,
      contracts: `Extract all contract information from the uploaded documents and provide it in a structured JSON format. Include: contract parties, terms, duration, payment terms, deliverables, and key clauses. Format as an array of contract objects.`
    };

    setInput(prompts[type]);
    await handleSendMessage();
  };

  const exportToCSV = (data: Record<string, unknown>[], filename: string) => {
    if (!data || data.length === 0) {
      toast.error('No data to export');
      return;
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {!sessionActive ? (
        <div className="text-center py-8">
          <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Ready to Analyze Documents
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            {uploadedFiles.length} document(s) uploaded and ready for AI analysis
          </p>
          <Button onClick={handleStartSession} className="bg-[#4ADE80] hover:bg-[#22C55E]">
            Start AI Analysis Session
          </Button>
        </div>
      ) : (
        <>
          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2 p-4 bg-gray-50 rounded-lg">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStructuredExtraction('suppliers')}
              disabled={isLoading}
            >
              <Table className="h-4 w-4 mr-2" />
              Extract Suppliers
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStructuredExtraction('pricing')}
              disabled={isLoading}
            >
              <Table className="h-4 w-4 mr-2" />
              Extract Pricing
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStructuredExtraction('contracts')}
              disabled={isLoading}
            >
              <Table className="h-4 w-4 mr-2" />
              Extract Contracts
            </Button>
            {extractedData.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportToCSV(extractedData, 'extracted_data')}
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            )}
          </div>

          {/* Messages */}
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-[#4ADE80] text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  {message.parts.map((part, partIndex) => (
                    <div key={partIndex}>
                      {part.text && (
                        <ReactMarkdown className="prose prose-sm">
                          {(() => {
                            const { originalText, formattedSources } = processTextWithCitations(
                              part.text,
                              message.citationMetadata?.citationSources
                            );
                            return originalText + (formattedSources.length > 0 ? '\n\n**Sources:**\n' + formattedSources.join('\n') : '');
                          })()}
                        </ReactMarkdown>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg px-4 py-2 flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-gray-600">AI is analyzing...</span>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="flex space-x-2">
            <Input
              ref={inputRef}
              type="text"
              placeholder="Ask questions about your documents..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
              className="flex-1"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!input.trim() || isLoading}
              size="sm"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default ProcurementChat;