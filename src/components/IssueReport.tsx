import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, AlertTriangle, CheckCircle, Clock, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { 
  ContinuousImprovementSession, 
  getNegativeFeedbackSessions,
  updateIssueStatus
} from "@/lib/firestoreService";
import { useAuth } from "@/hooks/useAuth";
import ChatHistoryDialog from "./ChatHistoryDialog";

const IssueReport: React.FC = () => {
  const { user } = useAuth();
  const [issues, setIssues] = useState<ContinuousImprovementSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'fixed' | 'not_fixed'>('all');
  const [chatDialogOpen, setChatDialogOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<ContinuousImprovementSession | null>(null);

  useEffect(() => {
    loadIssues();
  }, []);

  const loadIssues = async () => {
    setIsLoading(true);
    try {
      // Load all users' negative feedback (for admin view)
      // You can change this to user?.uid to show only current user's issues
      const negativeFeedback = await getNegativeFeedbackSessions();
      setIssues(negativeFeedback);
    } catch (error) {
      console.error('Error loading issues:', error);
      toast.error('Failed to load issues');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (sessionId: string, newStatus: 'fixed' | 'not_fixed') => {
    try {
      await updateIssueStatus(sessionId, newStatus);
      
      // Update local state
      setIssues(prev => prev.map(issue => 
        issue.id === sessionId 
          ? { ...issue, issueStatus: newStatus }
          : issue
      ));
      
      toast.success(`Issue marked as ${newStatus === 'fixed' ? 'fixed' : 'not fixed'}`);
    } catch (error) {
      console.error('Error updating issue status:', error);
      toast.error('Failed to update issue status');
    }
  };

  const getStatusBadge = (status?: 'fixed' | 'not_fixed') => {
    if (!status) {
      return (
        <Badge variant="outline" className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Pending
        </Badge>
      );
    }
    
    return status === 'fixed' ? (
      <Badge variant="default" className="bg-green-600 flex items-center gap-1">
        <CheckCircle className="h-3 w-3" />
        Fixed
      </Badge>
    ) : (
      <Badge variant="destructive" className="flex items-center gap-1">
        <AlertTriangle className="h-3 w-3" />
        Not Fixed
      </Badge>
    );
  };

  const filteredIssues = issues.filter(issue => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'fixed') return issue.issueStatus === 'fixed';
    if (statusFilter === 'not_fixed') return issue.issueStatus === 'not_fixed' || !issue.issueStatus;
    return true;
  });

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fi-FI', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const handleViewChat = (session: ContinuousImprovementSession) => {
    setSelectedSession(session);
    setChatDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Issue Report - Negative Feedback
            </CardTitle>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Filter:</span>
                <Select value={statusFilter} onValueChange={(value: 'all' | 'fixed' | 'not_fixed') => setStatusFilter(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="not_fixed">Not Fixed</SelectItem>
                    <SelectItem value="fixed">Fixed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button 
                variant="outline" 
                onClick={loadIssues}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : filteredIssues.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {statusFilter === 'all' 
                ? 'No negative feedback found.' 
                : `No ${statusFilter === 'fixed' ? 'fixed' : 'unfixed'} issues found.`
              }
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Issue (User Comment)</TableHead>
                  <TableHead className="w-32">Date</TableHead>
                  <TableHead className="w-32">User</TableHead>
                  <TableHead className="w-32">Status</TableHead>
                  <TableHead className="w-40">Actions</TableHead>
                  <TableHead className="w-32">Chat</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredIssues.map((issue, index) => (
                  <TableRow key={issue.id}>
                    <TableCell className="font-medium">
                      {index + 1}
                    </TableCell>
                    <TableCell>
                      <div className="max-w-md">
                        {issue.userComment ? (
                          <p className="text-sm">{issue.userComment}</p>
                        ) : (
                          <p className="text-sm text-gray-500 italic">
                            No comment provided (thumbs down only)
                          </p>
                        )}
                        {issue.promptKey && (
                          <p className="text-xs text-gray-400 mt-1">
                            Prompt: {issue.promptKey}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {formatDate(issue.createdDate)}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {issue.userId.substring(0, 8)}...
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(issue.issueStatus)}
                    </TableCell>
                    <TableCell>
                      <Select 
                        value={issue.issueStatus || 'not_fixed'} 
                        onValueChange={(value: 'fixed' | 'not_fixed') => 
                          issue.id && handleStatusChange(issue.id, value)
                        }
                      >
                        <SelectTrigger className="w-36">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="not_fixed">Not Fixed</SelectItem>
                          <SelectItem value="fixed">Fixed</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewChat(issue)}
                        className="flex items-center gap-1"
                      >
                        <MessageCircle className="h-4 w-4" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Issues</p>
                <p className="text-2xl font-bold">{issues.length}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Fixed Issues</p>
                <p className="text-2xl font-bold text-green-600">
                  {issues.filter(i => i.issueStatus === 'fixed').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Issues</p>
                <p className="text-2xl font-bold text-red-600">
                  {issues.filter(i => !i.issueStatus || i.issueStatus === 'not_fixed').length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chat History Dialog */}
      <ChatHistoryDialog
        open={chatDialogOpen}
        onOpenChange={setChatDialogOpen}
        session={selectedSession}
      />
    </div>
  );
};

export default IssueReport;