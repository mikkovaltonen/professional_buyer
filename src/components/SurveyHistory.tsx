import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

interface SurveyRecord {
  createdAt: string;
  financialAnswers: Record<number, string>;
  accidentAnswers: Record<number, string>;
  id: string;
  overallScore: number;
}

interface Props {
  onDelete: (surveyId: string) => Promise<void>;
  latestSurvey?: SurveyRecord | null;
}

export const SurveyHistory = ({ onDelete, latestSurvey }: Props) => {
  const { user } = useAuth();
  const [surveyHistory, setSurveyHistory] = useState<SurveyRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const loadHistory = async () => {
    if (!user?.uid) return;
    
    try {
      const surveysRef = collection(db, 'users', user.uid, 'surveys');
      const q = query(surveysRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const surveys = querySnapshot.docs.map(doc => ({
        ...doc.data() as SurveyRecord,
        id: doc.id
      }));
      
      setSurveyHistory(surveys);
    } catch (error) {
      console.error('Error loading survey history:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [user]);

  useEffect(() => {
    if (latestSurvey) {
      setSurveyHistory(prev => [latestSurvey, ...prev]);
    }
  }, [latestSurvey]);

  const handleDelete = async (surveyId: string) => {
    await onDelete(surveyId);
    // Päivitetään lista poiston jälkeen
    await loadHistory();
  };

  const getRiskDescription = (survey: SurveyRecord) => {
    // Risk attitude description based on financial scores
    const getFinancialRiskAttitude = (score: number) => {
      if (score < 2) return "Very Conservative";
      if (score < 3) return "Conservative";
      if (score < 4) return "Moderate";
      if (score < 4.5) return "Risk Tolerant";
      return "Risk Seeking";
    };

    // Accident risk description based on activity scores
    const getAccidentRiskLevel = (score: number) => {
      if (score < 2) return "Low";
      if (score < 3) return "Moderate";
      if (score < 4) return "Medium";
      if (score < 4.5) return "High";
      return "Very High";
    };

    const financialAttitude = getFinancialRiskAttitude(survey.overallScore);
    const accidentRisk = getAccidentRiskLevel(survey.overallScore);

    return {
      financialDescription: `Risk Attitude: ${financialAttitude}`,
      accidentDescription: `Risk Level: ${accidentRisk}`
    };
  };

  if (loading) {
    return <div>Loading history...</div>;
  }

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle>Risk Assessment History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {surveyHistory.map((survey) => {
            const riskDescription = getRiskDescription(survey);
            return (
              <div 
                key={survey.id}
                className="flex justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="space-y-2">
                  <div className="font-medium">
                    {new Date(survey.createdAt).toLocaleDateString('en-US', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </div>
                  <div className="text-sm text-gray-600">
                    {riskDescription.financialDescription}
                  </div>
                  <div className="text-sm text-gray-600">
                    {riskDescription.accidentDescription}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-500 hover:text-red-700 hover:bg-red-50 h-fit"
                  onClick={() => handleDelete(survey.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}; 