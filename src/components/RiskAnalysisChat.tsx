import { useState, useEffect } from "react";
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
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, limit, getDocs, doc, setDoc, addDoc, deleteDoc } from "firebase/firestore";
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

export const RiskAnalysisChat = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [surveyData, setSurveyData] = useState<SurveyData | null>(null);
  const [savedChats, setSavedChats] = useState<SavedChat[]>([]);
  const [userLanguage, setUserLanguage] = useState<string>('fi');
  const [isOpen, setIsOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const t = translations[userLanguage === 'fi' ? 'fi' : 'en'];

  useEffect(() => {
    const loadLatestSurvey = async () => {
      if (!user?.uid) return;
      
      try {
        const surveysRef = collection(db, 'users', user.uid, 'surveys');
        const q = query(surveysRef, orderBy('createdAt', 'desc'), limit(1));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const latestSurvey = querySnapshot.docs[0].data() as SurveyData;
          setSurveyData(latestSurvey);
        }
      } catch (error) {
        console.error('Error loading survey data:', error);
      }
    };

    loadLatestSurvey();
  }, [user]);

  useEffect(() => {
    const loadSavedChats = async () => {
      if (!user?.uid) return;
      
      try {
        const chatsRef = collection(db, 'users', user.uid, 'chatHistory');
        const q = query(chatsRef, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        
        const chats = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as SavedChat[];
        
        setSavedChats(chats);
      } catch (error) {
        console.error('Error loading chat history:', error);
      }
    };

    loadSavedChats();
  }, [user]);

  useEffect(() => {
    const loadUserPreferences = async () => {
      if (!user?.uid) return;
      
      try {
        const userPrefs = await getUserPreferences(user.uid);
        if (userPrefs?.language) {
          setUserLanguage(userPrefs.language);
        }
      } catch (error) {
        console.error('Error loading user preferences:', error);
      }
    };

    loadUserPreferences();
  }, [user]);

  useEffect(() => {
    const initializeChat = async () => {
      if (isOpen && surveyData && !isInitialized) {
        setIsInitialized(true);
        const systemContext = getSystemContext(surveyData);
        await sendToOpenAI(systemContext, true);
      }
    };

    initializeChat();
  }, [isOpen, surveyData, isInitialized]);

  useEffect(() => {
    if (!isOpen) {
      setIsInitialized(false);
      setMessages([]);
    }
  }, [isOpen]);

  const getSystemContext = (survey: SurveyData): string => {
    const greeting = userLanguage === 'fi' 
      ? "Kiitos että haluat ymmärtää riskiprofiiliasi paremmin. Teen psykoanalyysin tuloksistasi:"
      : "Thank you for wanting to understand your risk profile better. I'll make a psychoanalysis of your results:";

    return `You are a friendly psychologist analyzing the user's insurance-related risk attitudes. Start directly with "${greeting}" and then provide a brief, encouraging analysis of their survey results in ${userLanguage === 'fi' ? 'Finnish' : 'English'}.

User's latest survey results from ${new Date(survey.createdAt).toLocaleDateString()}:

Financial Preferences:
${Object.entries(survey.financialAnswers).map(([id, answer]) => 
  `- Question ${id}: ${answer}`
).join('\n')}

Activity Profile:
${Object.entries(survey.accidentAnswers).map(([id, answer]) => 
  `- Question ${id}: ${answer}`
).join('\n')}

Focus on analyzing how the user's answers reflect their emotional relationship with risk and safety. Keep responses in ${userLanguage === 'fi' ? 'Finnish' : 'English'} and maintain a supportive, professional tone.`;
  };

  const sendToOpenAI = async (content: string, isSystem: boolean = false) => {
    try {
      if (!isSystem) {
        setMessages(prev => [...prev, { role: 'user', content }]);
      }

      // Rakennetaan psykologin ohjeistus
      const instructions = {
        role: 'system',
        content: `Olet tekoälypsykologi, joka erikoistuu riskiprofiilien analysointiin.

KIELI JA KOMMUNIKAATIO:
- Oletuskieli on ${userLanguage === 'fi' ? 'suomi' : 'englanti'}
- Mukaudu käyttäjän käyttämään kieleen (suomi/englanti)
- Jos käyttäjä vaihtaa kieltä kesken keskustelun, jatka uudella kielellä
- Tunnista kieli käyttäjän viesteistä ja vastaa samalla kielellä

${surveyData ? `KÄYTTÄJÄN VASTAUKSET (${new Date(surveyData.createdAt).toLocaleDateString()}):

Taloudelliset vastaukset:
${Object.entries(surveyData.financialAnswers).map(([id, answer]) => 
  `- K${id}: ${answer}`
).join('\n')}

Riskivastaukset:
${Object.entries(surveyData.accidentAnswers).map(([id, answer]) => 
  `- K${id}: ${answer}`
).join('\n')}` : ''}

OHJEET:
1. Tunnista käyttäjän käyttämä kieli ja vastaa samalla kielellä
2. Ole empaattinen ja ymmärtäväinen
3. Anna konkreettisia neuvoja
4. Älä mainitse tuotenimiä
5. Keskity psykologiseen analyysiin

Aloita keskustelu oletuskielellä (${userLanguage === 'fi' ? 'suomi' : 'englanti'}) mutta ole valmis vaihtamaan kieltä käyttäjän mukaan.`
      };

      // Rakennetaan keskustelun viestit
      const chatMessages = [
        instructions,
        ...messages,
        ...(isSystem ? [] : [{ role: 'user', content }])
      ];

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4-turbo-preview',
          messages: chatMessages,
          temperature: 0.7,
          max_tokens: 2048,
          top_p: 1,
          frequency_penalty: 0.2,
          presence_penalty: 0.1
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error('OpenAI API error:', errorData); // Debug-loki
        throw new Error(`API call failed: ${response.statusText}`);
      }

      const data = await response.json();
      const reply = data.choices[0].message.content;

      if (!isSystem) {
        setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
      }
    } catch (error) {
      console.error('Error in sendToOpenAI:', error); // Debug-loki
      if (!isSystem) {
        setMessages(prev => [
          ...prev,
          { role: 'assistant', content: userLanguage === 'fi' 
            ? 'Pahoittelen, mutta kohtasin virheen. Kokeile uudelleen.' 
            : 'I apologize, but I encountered an error. Please try again.'
          }
        ]);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    setLoading(true);
    const userInput = input;
    setInput('');

    try {
      await sendToOpenAI(userInput);
    } catch (error) {
      console.error('Error in chat:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveHistory = async () => {
    if (!user?.uid || messages.length === 0) return;
    
    setLoading(true);
    try {
      const chatHistoryRef = collection(db, 'users', user.uid, 'chatHistory');
      const chatData = {
        messages,
        createdAt: new Date().toISOString(),
        // Lisätään surveyId vain jos se on olemassa
        ...(surveyData?.id ? { surveyId: surveyData.id } : {})
      };

      await addDoc(chatHistoryRef, chatData);
      
      // Päivitetään tallennetut keskustelut
      setSavedChats(prev => [...prev, {
        id: Date.now().toString(), // tilapäinen id kunnes sivu päivitetään
        messages,
        createdAt: new Date().toISOString()
      }]);
      
      toast.success(t.saveSuccess);
    } catch (error) {
      console.error('Error saving chat history:', error);
      toast.error(t.saveError);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteChat = async (chatId: string) => {
    if (!user?.uid) return;
    
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'chatHistory', chatId));
      setSavedChats(prev => prev.filter(chat => chat.id !== chatId));
      toast.success(t.deleteSuccess);
    } catch (error) {
      console.error('Error deleting chat:', error);
      toast.error(t.deleteError);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-purple-100 to-blue-100 p-6 rounded-lg shadow-sm">
        <h3 className="text-lg font-semibold mb-2">🤝 {t.title}</h3>
        <p className="text-gray-700 mb-4">{t.description}</p>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button 
              className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:from-purple-600 hover:to-blue-600 transition-all duration-300"
            >
              <MessageSquare className="mr-2 h-5 w-5" />
              {t.startChat}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{t.title}</DialogTitle>
              <DialogDescription>
                {t.description}
              </DialogDescription>
              <DialogClose className="absolute right-4 top-4">
                <X className="h-4 w-4" />
              </DialogClose>
            </DialogHeader>
            
            <div className="mt-4">
              <ScrollArea className="h-[400px] rounded-md border">
                <div className="p-4 flex flex-col gap-4">
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${
                        message.role === 'assistant' ? 'justify-start' : 'justify-end'
                      } w-full`}
                    >
                      <div
                        className={`max-w-[80%] ${
                          message.role === 'assistant' 
                            ? 'bg-purple-50' 
                            : 'bg-blue-50'
                        } rounded-lg px-4 py-2 shadow-sm`}
                      >
                        {message.content}
                      </div>
                    </div>
                  ))}
                  {loading && (
                    <div className="flex justify-start w-full">
                      <div className="max-w-[80%] bg-gray-50 rounded-lg px-4 py-2 animate-pulse">
                        {t.thinking}
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
              
              <div className="mt-4 space-y-4">
                <form onSubmit={handleSubmit} className="flex gap-2">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={t.askMore}
                    disabled={loading}
                  />
                  <Button 
                    type="submit" 
                    size="icon" 
                    disabled={loading}
                    className="bg-purple-500 hover:bg-purple-600 text-white shrink-0"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
                
                {messages.length > 0 && (
                  <Button
                    onClick={handleSaveHistory}
                    disabled={loading}
                    variant="outline"
                    className="w-full text-sm"
                  >
                    {t.saveHistory}
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {savedChats.length > 0 && (
          <div className="mt-6 border-t pt-4">
            <h4 className="text-md font-semibold mb-3">{t.savedChats}</h4>
            <div className="space-y-3">
              {savedChats.map((chat) => (
                <div 
                  key={chat.id} 
                  className="bg-white p-3 rounded-lg shadow-sm hover:shadow-md transition-shadow relative group"
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">
                      {new Date(chat.createdAt).toLocaleDateString('fi-FI', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">
                        {chat.messages.length} {t.messages}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDeleteChat(chat.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="text-sm text-gray-700 line-clamp-2">
                    {chat.messages[chat.messages.length - 1]?.content || t.noContent}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 