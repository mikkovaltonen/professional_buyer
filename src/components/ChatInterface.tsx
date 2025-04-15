import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Send, Bot, File, Search, Code } from "lucide-react";
import { createResponse } from "@/api/chat";

interface Message {
  role: 'user' | 'assistant';
  content: string;
  attachments?: {
    type: 'file' | 'web' | 'code';
    content: string;
  }[];
}

interface ChatInterfaceProps {
  selectedImageUrl?: string;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ selectedImageUrl }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() && !selectedFile) return;

    const attachments: Message['attachments'] = [];
    
    if (selectedFile) {
      const fileContent = await selectedFile.text();
      attachments.push({
        type: 'file',
        content: fileContent
      });
    }

    const userMessage: Message = {
      role: "user",
      content: input,
      attachments
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setIsLoading(true);

    try {
      const response = await createResponse(input, selectedFile ? await selectedFile.text() : undefined);
      
      const assistantMessage: Message = {
        role: "assistant",
        content: response,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage: Message = {
        role: "assistant",
        content: "Sorry, there was an error processing your message. Please try again.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

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
              {message.content}
              {message.attachments?.map((attachment, idx) => (
                <div key={idx} className="mt-2 text-sm">
                  {attachment.type === 'file' && <File className="h-4 w-4 inline-block mr-1" />}
                  {attachment.type === 'web' && <Search className="h-4 w-4 inline-block mr-1" />}
                  {attachment.type === 'code' && <Code className="h-4 w-4 inline-block mr-1" />}
                  {attachment.content.substring(0, 50)}...
                </div>
              ))}
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
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
            accept=".txt,.csv,.json,.xlsx,.xls"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="bg-white hover:bg-gray-100"
          >
            <File className="h-4 w-4" />
          </Button>
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
        {selectedFile && (
          <div className="mt-2 text-sm text-gray-600">
            Valittu tiedosto: {selectedFile.name}
          </div>
        )}
      </form>
    </div>
  );
};

export default ChatInterface; 