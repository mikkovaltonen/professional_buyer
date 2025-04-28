import React, { useState, useRef, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Bot, Send } from 'lucide-react';
import { createResponse, initializeChat, clearChatSession } from '@/api/chat';
import ReactMarkdown from 'react-markdown';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatInterfaceProps {
  className?: string;
  selectedProduct?: string;
  selectedImageUrl?: string;
  onMessageUpdate?: (content: string) => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ className, selectedProduct, selectedImageUrl, onMessageUpdate }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize chat when component mounts and selectedProduct changes
  useEffect(() => {
    console.log('🔄 Product selection changed:', selectedProduct);
    console.log('🖼️ Selected image URL:', selectedImageUrl);
    
    const initChat = async () => {
      if (selectedProduct && selectedImageUrl) {
        console.log('🚀 Starting chat initialization for product:', selectedProduct);
        setIsLoading(true);
        
        // Clear previous session
        clearChatSession();
        
        try {
          const response = await initializeChat(selectedProduct, selectedImageUrl);
          console.log('✅ Chat initialized with response:', response);
          if (response) {
            setMessages([{ role: 'assistant', content: response }]);
          }
        } catch (error) {
          console.error('❌ Error initializing chat:', error);
          setMessages([{ 
            role: 'assistant', 
            content: 'Pahoittelen, keskustelun aloituksessa tapahtui virhe. Yritä uudelleen.' 
          }]);
        } finally {
          setIsLoading(false);
        }
      } else {
        console.log('⚠️ No product or image selected, skipping initialization');
      }
    };

    initChat();
  }, [selectedProduct, selectedImageUrl]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    console.log('📝 Sending new message:', input.trim());
    setIsLoading(true);
    const userMessage = input.trim();
    setInput('');

    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);

    try {
      const response = await createResponse(userMessage);
      console.log('✅ Received response:', response);
      if (response) {
        setMessages(prev => [...prev, { role: 'assistant', content: response }]);
      }
    } catch (error) {
      console.error('❌ Error sending message:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Pahoittelen, viestin käsittelyssä tapahtui virhe. Yritä uudelleen.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (onMessageUpdate && messages.length > 0) {
      // Combine all messages into a single string
      const fullContent = messages
        .map(msg => msg.content)
        .join('\n\n');
      
      // Call onMessageUpdate immediately for the first message
      if (messages.length === 1) {
        onMessageUpdate(fullContent);
      } else {
        // Use a timeout to prevent rapid successive updates for subsequent messages
        const timeoutId = setTimeout(() => {
          onMessageUpdate(fullContent);
        }, 100);
        return () => clearTimeout(timeoutId);
      }
    }
  }, [messages, onMessageUpdate]);

  // Component cleanup
  useEffect(() => {
    return () => {
      console.log('🧹 Cleaning up ChatInterface component');
      clearChatSession();
    };
  }, []);

  return (
    <div className="flex flex-col h-[500px]">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.role === 'user'
                  ? 'bg-[#4ADE80] text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              {message.role === 'assistant' && (
                <Bot className="h-4 w-4 mb-1 inline-block mr-2" />
              )}
              <div className="whitespace-pre-wrap">
                <ReactMarkdown
                  components={{
                    a: ({ node, ...props }) => (
                      <a {...props} className="text-blue-600 hover:text-blue-800 underline" target="_blank" rel="noopener noreferrer" />
                    ),
                    ul: ({ node, ...props }) => (
                      <ul {...props} className="list-disc pl-5" />
                    ),
                    li: ({ node, ...props }) => (
                      <li {...props} className="mb-1" />
                    ),
                    p: ({ node, ...props }) => (
                      <p {...props} className="mb-2" />
                    ),
                    strong: ({ node, ...props }) => (
                      <strong {...props} className="font-bold" />
                    ),
                    em: ({ node, ...props }) => (
                      <em {...props} className="italic" />
                    )
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg p-3 text-gray-900">
              <Bot className="h-4 w-4 animate-pulse" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="p-4 border-t">
        <div className="flex space-x-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Kysy ennusteesta..."
            className="flex-1"
          />
          <Button 
            type="submit" 
            disabled={isLoading}
            className="bg-[#4ADE80] hover:bg-[#22C55E] text-white"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ChatInterface; 