import React, { useState, useRef } from 'react';
import { Loader2, Send, FileText, Download, Table } from "lucide-react";
import { SafeMarkdown } from './SafeMarkdown';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'sonner';
import { loadLatestPromptWithModel } from '../lib/firestoreService';
import { callOpenRouterAPI, getOpenRouterErrorMessage, type OpenRouterMessage } from '../lib/openRouterService';

interface UploadedFile {
  name: string;
  type: string;
  size: number;
  content: string | ArrayBuffer;
  url?: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ProcurementChatProps {
  uploadedFiles: UploadedFile[];
  onCorrectionsApplied: () => void;
  applyBatchCorrectionsFromChat: (corrections: unknown[]) => void;
}

// Store the selected model and temperature for the session
let sessionModel = 'google/gemini-2.5-flash';
let sessionSystemPrompt = '';
let sessionTemperature = 0.05;

// Removed: processTextWithCitations (citations no longer supported without Google Search)

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

  const processFileForAI = (file: UploadedFile): string | null => {
    try {
      if (file.type === 'application/pdf') {
        return `[PDF Document: ${file.name}]\nThis is a PDF document that needs to be analyzed. The user has uploaded this file for procurement analysis.`;
      } else if (file.type.includes('spreadsheet') || file.type.includes('excel') || file.type === 'text/csv') {
        if (typeof file.content === 'string') {
          return `[Spreadsheet/CSV Document: ${file.name}]\n${file.content.substring(0, 10000)}`;
        }
      } else if (file.type.includes('word') || file.type.includes('document')) {
        if (typeof file.content === 'string') {
          return `[Word Document: ${file.name}]\n${file.content.substring(0, 10000)}`;
        }
      }

      return `[Document: ${file.name}]\nFile type: ${file.type}\nSize: ${file.size} bytes\nThis document has been uploaded for procurement analysis.`;
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

    // Load the latest system prompt version with model and temperature
    if (user?.uid) {
      try {
        const promptData = await loadLatestPromptWithModel(user.uid);
        if (promptData) {
          sessionSystemPrompt = promptData.prompt;
          sessionModel = promptData.model;
          sessionTemperature = promptData.temperature;
          console.log('[ProcurementChat] Using saved prompt with model:', sessionModel, 'temperature:', sessionTemperature);
        }
      } catch (error) {
        console.error('[ProcurementChat] Error loading prompt:', error);
        toast.error('Failed to load prompt configuration');
        return;
      }
    }

    if (!sessionSystemPrompt) {
      toast.error('No system prompt configured. Please visit Settings to set up your prompt.');
      return;
    }

    setMessages([]);
    setSessionActive(true);
    setInput('');
    inputRef.current?.focus();
    setIsLoading(true);

    try {
      const documentSummary = uploadedFiles.map(file =>
        `- ${file.name} (${file.type}, ${Math.round(file.size / 1024)}KB)`
      ).join('\n');

      const userMessage = `Uploaded Documents for Analysis:\n${documentSummary}\n\nPlease provide an initial analysis overview of these documents and suggest what insights you can provide.`;

      // Process files and create content string
      let fileContent = '';
      uploadedFiles.forEach(file => {
        const fileText = processFileForAI(file);
        if (fileText) {
          fileContent += '\n\n' + fileText;
        }
      });

      const fullUserMessage = userMessage + fileContent;

      console.log("[ProcurementChat] Starting session with model:", sessionModel);

      // Use OpenRouter for all models
      const messages: OpenRouterMessage[] = [
        { role: 'system', content: sessionSystemPrompt },
        { role: 'user', content: fullUserMessage }
      ];

      const response = await callOpenRouterAPI(messages, sessionModel, undefined, undefined, sessionTemperature);

      if (response?.choices?.[0]?.message?.content) {
        setMessages([
          { role: 'user', content: 'Initialize document analysis session' },
          { role: 'assistant', content: response.choices[0].message.content }
        ]);
      } else {
        throw new Error('No response from API');
      }
    } catch (error) {
      console.error('Error starting session:', error);
      const errorMessage = error instanceof Error ? getOpenRouterErrorMessage(error) : 'Failed to start analysis session';
      toast.error(errorMessage);
      setMessages([
        { role: 'user', content: 'Initialize document analysis session' },
        { role: 'assistant', content: "Error starting session. Please try again." }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input };
    const currentInput = input;
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Build OpenRouter messages with system prompt and history
      const openRouterMessages: OpenRouterMessage[] = [
        { role: 'system', content: sessionSystemPrompt }
      ];

      // Add conversation history
      messages.forEach(msg => {
        openRouterMessages.push({
          role: msg.role,
          content: msg.content
        });
      });

      // Add current user message
      openRouterMessages.push({ role: 'user', content: currentInput });

      const response = await callOpenRouterAPI(openRouterMessages, sessionModel, undefined, undefined, sessionTemperature);

      if (response?.choices?.[0]?.message?.content) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: response.choices[0].message.content
        }]);
      } else {
        throw new Error('No response from API');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = error instanceof Error ? getOpenRouterErrorMessage(error) : 'Error processing your request. Please try again.';
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
                  <SafeMarkdown className="prose prose-sm">
                    {message.content}
                  </SafeMarkdown>
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