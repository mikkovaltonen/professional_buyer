import { useState, useEffect } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { updateUserPreferences, getUserPreferences } from "@/lib/userService";
import { toast } from "sonner";
import { Shield } from "lucide-react";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { SurveyHistory } from "@/components/SurveyHistory";
import { collection, query, orderBy, getDocs, deleteDoc } from "firebase/firestore";
import { Trash2 } from "lucide-react";
import { RiskAnalysisChat } from "@/components/RiskAnalysisChat";
import { Car, Home, User, Ship, Plane, Dog, Trees, Diamond, Wallet, TrendingUp, PiggyBank, Coins, CreditCard } from "lucide-react";

const financialQuestions = [
  {
    id: 1,
    icon: <Wallet className="h-5 w-5" />,
    question: "I prefer guaranteed returns over potential higher gains with risks.",
    description: "Investment preference assessment"
  },
  {
    id: 2,
    icon: <TrendingUp className="h-5 w-5" />,
    question: "I have savings and I can liquidate my savings to survive unexpected hardship.",
    description: "Financial resilience assessment"
  },
  {
    id: 3,
    icon: <Coins className="h-5 w-5" />,
    question: "I'm willing to pay more for better coverage and peace of mind.",
    description: "Premium vs coverage preference"
  }
];

const accidentQuestions = [
  {
    id: 6,
    icon: <Car className="h-5 w-5" />,
    question: "I drive a car and feel my driving has increased accident risk compared to other drivers with similar history.",
    description: "Vehicle risk assessment"
  },
  {
    id: 7,
    icon: <Home className="h-5 w-5" />,
    question: "I own a home and feel my property has increased damage risk compared to similar properties in the area.",
    description: "Property risk assessment"
  },
  {
    id: 8,
    icon: <User className="h-5 w-5" />,
    question: "I feel my lifestyle or activities carry increased personal injury risk compared to average.",
    description: "Personal injury risk assessment"
  },
  {
    id: 9,
    icon: <Ship className="h-5 w-5" />,
    question: "I own a boat and feel it has increased accident risk compared to similar vessels.",
    description: "Marine risk assessment"
  },
  {
    id: 10,
    icon: <Plane className="h-5 w-5" />,
    question: "I travel frequently and feel my trips have increased risk compared to typical business/leisure travel.",
    description: "Travel risk assessment"
  },
  {
    id: 11,
    icon: <Dog className="h-5 w-5" />,
    question: "I have pets and feel they have increased accident/liability risk compared to similar pets.",
    description: "Pet risk assessment"
  },
  {
    id: 12,
    icon: <Trees className="h-5 w-5" />,
    question: "I own forest and feel my forest has increased damage risk compared to similar forest properties.",
    description: "Forest risk assessment"
  },
  {
    id: 13,
    icon: <Diamond className="h-5 w-5" />,
    question: "I own valuable items and feel they have increased risk compared to similar valuables.",
    description: "Valuables risk assessment"
  }
];

// Add logging service
const logSurveyCompletion = async (userId: string, surveyData: any) => {
  try {
    const logRef = doc(db, 'users', userId, 'logs', new Date().toISOString());
    await setDoc(logRef, {
      type: 'survey_completion',
      timestamp: new Date().toISOString(),
      financialScore: surveyData.financialScore,
      accidentScore: surveyData.accidentScore,
      overallScore: surveyData.overallScore
    });
  } catch (error) {
    console.error('Error logging survey:', error);
  }
};

const RiskAssessmentForm = () => {
  const { user } = useAuth();
  const [financialAnswers, setFinancialAnswers] = useState<Record<number, string>>({});
  const [accidentAnswers, setAccidentAnswers] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(false);
  const [surveyData, setSurveyData] = useState<SurveyData | null>(null);
  const [surveyHistory, setSurveyHistory] = useState<SurveyData[]>([]);
  const [latestSurvey, setLatestSurvey] = useState<SurveyData | null>(null);

  useEffect(() => {
    // Load existing answers if available
    const loadAnswers = async () => {
      if (!user?.uid) return;
      
      try {
        const prefs = await getUserPreferences(user.uid);
        if (prefs?.riskProfile) {
          setFinancialAnswers(prefs.riskProfile.financialAnswers || {});
          setAccidentAnswers(prefs.riskProfile.accidentAnswers || {});
        }
      } catch (error) {
        console.error('Error loading answers:', error);
      }
    };

    loadAnswers();
  }, [user]);

  useEffect(() => {
    const loadSurveyHistory = async () => {
      if (!user?.uid) return;
      
      try {
        const surveysRef = collection(db, 'users', user.uid, 'surveys');
        const q = query(surveysRef, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        
        const surveys = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as SurveyData[];
        
        setSurveyHistory(surveys);
      } catch (error) {
        console.error('Error loading survey history:', error);
      }
    };

    loadSurveyHistory();
  }, [user]);

  const handleSubmit = async () => {
    if (!user?.uid) return;
    setLoading(true);

    try {
      const financialScore = calculateScore(financialAnswers);
      const accidentScore = calculateScore(accidentAnswers);
      const overallScore = (financialScore + accidentScore) / 2;
      
      const newSurveyData = {
        id: Date.now().toString(),
        financialAnswers,
        accidentAnswers,
        financialScore,
        accidentScore,
        overallScore,
        createdAt: new Date().toISOString()
      };

      // Tallennetaan survey Firestoreen
      const surveyRef = doc(collection(db, 'users', user.uid, 'surveys'));
      await setDoc(surveyRef, newSurveyData);

      // Päivitetään käyttäjän preferenssit
      await updateUserPreferences(user.uid, {
        riskProfile: newSurveyData
      });

      // Päivitetään paikallinen tila välittömästi
      setSurveyData(newSurveyData);
      setLatestSurvey(newSurveyData);

      toast.success("Risk assessment saved successfully");
    } catch (error) {
      console.error('Error saving assessment:', error);
      toast.error("Failed to save risk assessment");
    } finally {
      setLoading(false);
    }
  };

  const calculateScore = (answers: Record<number, string>) => {
    const total = Object.values(answers).reduce((sum, value) => {
      switch (value) {
        case 'strongly-disagree': return sum + 1;
        case 'disagree': return sum + 2;
        case 'neutral': return sum + 3;
        case 'agree': return sum + 4;
        case 'strongly-agree': return sum + 5;
        default: return sum + 3;
      }
    }, 0);
    
    return total / Object.keys(answers).length;
  };

  const handleDeleteSurvey = async (surveyId: string) => {
    if (!user?.uid) return;
    
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'surveys', surveyId));
      // Päivitetään paikallinen tila välittömästi
      setSurveyHistory(prev => prev.filter(s => s.id !== surveyId));
      // Päivitetään myös nykyinen surveyData jos poistettu oli aktiivinen
      if (surveyData?.id === surveyId) {
        setSurveyData(null);
        setFinancialAnswers({});
        setAccidentAnswers({});
      }
      toast.success("Riskiarvio poistettu");
    } catch (error) {
      console.error('Error deleting survey:', error);
      toast.error("Riskiarvion poisto epäonnistui");
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Risk Assessment
            </div>
          </CardTitle>
          <div className="text-sm text-muted-foreground">
            Evaluate your risk tolerance and preferences to help find the right insurance coverage.
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">Financial Risk Preferences</h3>
              <QuestionSection 
                questions={financialQuestions} 
                answers={financialAnswers}
                setAnswers={setFinancialAnswers}
              />
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Accident Risk Profile</h3>
              <QuestionSection 
                questions={accidentQuestions} 
                answers={accidentAnswers}
                setAnswers={setAccidentAnswers}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Button 
        onClick={handleSubmit}
        className="mt-8 w-full bg-[#9b87f5] hover:bg-[#7E69AB] relative"
        disabled={loading}
      >
        <span className={loading ? 'opacity-0' : 'opacity-100'}>
          Save Assessment
        </span>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </Button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SurveyHistory 
          onDelete={handleDeleteSurvey} 
          latestSurvey={latestSurvey}
        />
        <RiskAnalysisChat />
      </div>
    </div>
  );
};

// Helper component for question sections
const QuestionSection = ({ questions, answers, setAnswers }) => (
  <div className="space-y-8">
    {questions.map((q) => (
      <div key={q.id} className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="mt-1 text-gray-500">
            {q.icon}
          </div>
          <div>
            <h3 className="font-medium">{q.question}</h3>
            <div className="text-sm text-gray-500">{q.description}</div>
          </div>
        </div>
        
        <div className="w-full">
          <RadioGroup
            value={answers[q.id]}
            onValueChange={(value) => setAnswers({ ...answers, [q.id]: value })}
            className="grid grid-cols-5 gap-4 w-full"
          >
            {[
              'strongly-disagree',
              'disagree',
              'neutral',
              'agree',
              'strongly-agree'
            ].map((value) => (
              <div key={value} className="flex flex-col items-center text-center">
                <RadioGroupItem 
                  value={value} 
                  id={`${q.id}-${value}`}
                  className="mb-2"
                />
                <Label 
                  htmlFor={`${q.id}-${value}`} 
                  className="text-xs text-gray-600 whitespace-nowrap"
                >
                  {value === 'neutral' 
                    ? 'Neutral/Not Relevant'
                    : value.split('-').map(word => 
                        word.charAt(0).toUpperCase() + word.slice(1)
                      ).join(' ')}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      </div>
    ))}
  </div>
);

export default RiskAssessmentForm; 