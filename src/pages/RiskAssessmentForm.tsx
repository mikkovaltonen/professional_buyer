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

const riskQuestions = [
  {
    id: 1,
    question: "Do you have enough savings to cover accidentally damaged property?",
    description: "Financial preparedness for unexpected property damage"
  },
  {
    id: 2,
    question: "I'm comfortable with basic coverage to save money rather than comprehensive protection.",
    description: "Trade-off: Cost savings vs. Full protection"
  },
  {
    id: 3,
    question: "I prefer to self-insure for minor risks and only get coverage for major incidents.",
    description: "Trade-off: Self-insurance vs. Full coverage"
  },
  {
    id: 4,
    question: "I would bundle multiple insurance policies for discounts even if specialized coverage might be better.",
    description: "Trade-off: Cost savings vs. Specialized protection"
  },
  {
    id: 5,
    question: "I'm willing to share personal data with insurers for lower rates.",
    description: "Trade-off: Privacy vs. Cost savings"
  }
];

const accidentQuestions = [
  {
    id: 6,
    question: "I regularly participate in extreme sports or high-risk activities.",
    description: "Activity risk: High-risk recreational activities"
  },
  {
    id: 7,
    question: "I frequently travel to remote or potentially dangerous locations.",
    description: "Travel risk: Adventure travel"
  },
  {
    id: 8,
    question: "I prefer motorcycles/sports cars and enjoy pushing vehicle limits.",
    description: "Transport risk: High-risk vehicle preference"
  },
  {
    id: 9,
    question: "I work or plan to work in physically dangerous occupations.",
    description: "Occupational risk: High-risk professions"
  },
  {
    id: 10,
    question: "I often choose excitement over safety in my activities.",
    description: "Behavioral risk: Risk-taking tendency"
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
      setSurveyHistory(prev => [newSurveyData, ...prev]);

      toast.success("Riskiarvio tallennettu onnistuneesti");
    } catch (error) {
      console.error('Error saving assessment:', error);
      toast.error("Riskiarvion tallennus epäonnistui");
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
                questions={riskQuestions} 
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
        <SurveyHistory onDelete={handleDeleteSurvey} />
        <RiskAnalysisChat />
      </div>
    </div>
  );
};

// Helper component for question sections
const QuestionSection = ({ 
  questions, 
  answers, 
  setAnswers 
}: { 
  questions: typeof riskQuestions,
  answers: Record<number, string>,
  setAnswers: (answers: Record<number, string>) => void
}) => (
  <div className="space-y-8">
    {questions.map((q) => (
      <div key={q.id} className="space-y-4">
        <div>
          <h3 className="font-medium">{q.question}</h3>
          <div className="text-sm text-gray-500">{q.description}</div>
        </div>
        
        <div className="w-full">
          <RadioGroup
            value={answers[q.id]}
            onValueChange={(value) => setAnswers({ ...answers, [q.id]: value })}
            className="grid grid-cols-5 gap-4 w-full"
          >
            {['strongly-disagree', 'disagree', 'neutral', 'agree', 'strongly-agree'].map((value) => (
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
                  {value.split('-').map(word => 
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