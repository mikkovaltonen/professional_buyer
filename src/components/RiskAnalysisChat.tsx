import React, { useState } from 'react';
import { createChatCompletion } from '../api/chat';
import { useAuth } from '../hooks/useAuth';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Send, X, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { getUserPreferences } from "@/lib/userService";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface SurveyData {
  financialAnswers: Record<number, string>;
  accidentAnswers: Record<number, string>;
  createdAt: string;
  id?: string;
}

interface ChatHistory {
  messages: Message[];
  createdAt: string;
  surveyId?: string;
}

interface SavedChat {
  id: string;
  createdAt: string;
  messages: Message[];
}

interface UserPreferences {
  language?: string;
  // muut preferenssit tarvittaessa
}

const translations = {
  fi: {
    title: "Keskustele AI-psykologin kanssa",
    description: "Ymmärrä paremmin suhtautumistasi riskeihin ja turvallisuuteen. AI-psykologimme auttaa sinua käsittelemään vakuutuspäätöksiin liittyviä tunteita ja ajatuksia.",
    startChat: "Aloita keskustelu AI-psykologin kanssa",
    thinking: "Mietitään...",
    askMore: "Kysy lisää riskiprofiilista...",
    saveHistory: "💾 Tallenna palaute keskusteluhistoria",
    savedChats: "📝 Tallennetut keskustelut",
    messages: "viestiä",
    noContent: "Ei sisältöä",
    saveSuccess: "Keskusteluhistoria tallennettu onnistuneesti",
    saveError: "Keskusteluhistorian tallentaminen epäonnistui",
    deleteSuccess: "Keskustelu poistettu",
    deleteError: "Keskustelun poistaminen epäonnistui",
    error: "Pahoittelen, mutta kohtasin virheen. Kokeile uudelleen."
  },
  en: {
    title: "Chat with AI Psychologist",
    description: "Better understand your attitude towards risks and safety. Our AI psychologist helps you process emotions and thoughts related to insurance decisions.",
    startChat: "Start conversation with AI Psychologist",
    thinking: "Thinking...",
    askMore: "Ask more about your risk profile...",
    saveHistory: "💾 Save chat history",
    savedChats: "📝 Saved conversations",
    messages: "messages",
    noContent: "No content",
    saveSuccess: "Chat history saved successfully",
    saveError: "Failed to save chat history",
    deleteSuccess: "Conversation deleted",
    deleteError: "Failed to delete conversation",
    error: "I apologize, but I encountered an error. Please try again."
  }
};

export const RiskAnalysisChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const [surveyData, setSurveyData] = useState<SurveyData | null>(null);
  const [savedChats, setSavedChats] = useState<SavedChat[]>([]);
  const [userLanguage, setUserLanguage] = useState<string>('fi');
  const [isOpen, setIsOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const t = translations[userLanguage === 'fi' ? 'fi' : 'en'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !user) return;

    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);

    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);

    try {
      const response = await createChatCompletion(userMessage);
      if (response) {
        setMessages(prev => [...prev, { role: 'assistant', content: response }]);
      }
    } catch (error) {
      console.error('Error in risk analysis chat:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Pahoittelen, mutta riskianalyysissä tapahtui virhe. Yritä uudelleen.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return <div className="p-4">Kirjaudu sisään käyttääksesi riskianalyysiä.</div>;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-gray-50">
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`mb-4 ${
              message.role === 'user' ? 'text-right' : 'text-left'
            }`}
          >
            <div
              className={`inline-block p-3 rounded-lg ${
                message.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-800'
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="p-4 bg-white border-t">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Kysy riskianalyysistä..."
            className="flex-1 p-2 border rounded"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
          >
            {isLoading ? 'Analysoidaan...' : 'Analysoi'}
          </button>
        </div>
      </form>
    </div>
  );
}; 