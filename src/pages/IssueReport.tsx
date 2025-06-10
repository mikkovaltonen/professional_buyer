import React from 'react';
import IssueReport from '@/components/IssueReport';
import { useAuth } from '@/hooks/useAuth';
import LoginForm from '@/components/LoginForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const IssueReportPage: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <LoginForm />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link to="/admin">
              <Button variant="outline" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Admin
              </Button>
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Issue Report</h1>
          <p className="mt-2 text-gray-600">
            Track and manage negative feedback issues from user interactions.
          </p>
        </div>
        
        <IssueReport />
      </div>
    </div>
  );
};

export default IssueReportPage;