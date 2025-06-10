import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
// import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  MessageCircle, 
  Settings, 
  Zap, 
  CheckCircle, 
  AlertTriangle, 
  User, 
  Bot,
  Clock
} from "lucide-react";
import { ContinuousImprovementSession } from "@/lib/firestoreService";

interface ChatHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: ContinuousImprovementSession | null;
}

const ChatHistoryDialog: React.FC<ChatHistoryDialogProps> = ({
  open,
  onOpenChange,
  session
}) => {
  if (!session) return null;

  const formatDate = (date: Date | string | number) => {
    try {
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) {
        return 'Invalid date';
      }
      return new Intl.DateTimeFormat('fi-FI', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }).format(dateObj);
    } catch (error) {
      return 'Invalid date';
    }
  };

  const getEventIcon = (event: string) => {
    switch (event) {
      case 'user_message':
        return <User className="h-4 w-4 text-blue-600" />;
      case 'function_call_triggered':
        return <Zap className="h-4 w-4 text-orange-600" />;
      case 'function_call_success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'function_call_error':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'ai_response':
        return <Bot className="h-4 w-4 text-purple-600" />;
      default:
        return <MessageCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getEventBadge = (event: string) => {
    const colorMap = {
      'user_message': 'bg-blue-100 text-blue-800',
      'function_call_triggered': 'bg-orange-100 text-orange-800',
      'function_call_success': 'bg-green-100 text-green-800',
      'function_call_error': 'bg-red-100 text-red-800',
      'ai_response': 'bg-purple-100 text-purple-800'
    };

    return (
      <Badge className={`${colorMap[event as keyof typeof colorMap] || 'bg-gray-100 text-gray-800'} flex items-center gap-1`}>
        {getEventIcon(event)}
        {event.replace('_', ' ')}
      </Badge>
    );
  };

  // Sort logs by timestamp - handle missing logs
  const sortedLogs = session.technicalLogs ? [...session.technicalLogs].sort((a, b) => {
    const dateA = new Date(a.timestamp).getTime();
    const dateB = new Date(b.timestamp).getTime();
    // Handle invalid dates
    if (isNaN(dateA) && isNaN(dateB)) return 0;
    if (isNaN(dateA)) return 1;
    if (isNaN(dateB)) return -1;
    return dateA - dateB;
  }) : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Chat Session History - {session.chatSessionKey}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="timeline">Chat Timeline</TabsTrigger>
            <TabsTrigger value="technical">Technical Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Session Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Chat Session:</span>
                    <span className="text-sm font-mono">{session.chatSessionKey}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Prompt Key:</span>
                    <span className="text-sm font-mono">{session.promptKey}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Created:</span>
                    <span className="text-sm">{formatDate(session.createdDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">User ID:</span>
                    <span className="text-sm font-mono">{session.userId.substring(0, 12)}...</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Feedback Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Rating:</span>
                    <Badge variant="destructive">👎 Negative</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Status:</span>
                    <Badge variant={session.issueStatus === 'fixed' ? 'default' : 'destructive'}>
                      {session.issueStatus === 'fixed' ? '✅ Fixed' : '❌ Not Fixed'}
                    </Badge>
                  </div>
                  {session.userComment && (
                    <div className="pt-2">
                      <span className="text-sm text-gray-600">Comment:</span>
                      <p className="text-sm mt-1 p-2 bg-gray-50 rounded border italic">
                        "{session.userComment}"
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Activity Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">
                      {sortedLogs.filter(log => log.event === 'user_message').length}
                    </div>
                    <div className="text-xs text-gray-600">User Messages</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600">
                      {sortedLogs.filter(log => log.event === 'ai_response').length}
                    </div>
                    <div className="text-xs text-gray-600">AI Responses</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-orange-600">
                      {sortedLogs.filter(log => log.event === 'function_call_triggered').length}
                    </div>
                    <div className="text-xs text-gray-600">Function Calls</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {sortedLogs.filter(log => log.event === 'function_call_success').length}
                    </div>
                    <div className="text-xs text-gray-600">Successful</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-600">
                      {sortedLogs.filter(log => log.event === 'function_call_error').length}
                    </div>
                    <div className="text-xs text-gray-600">Errors</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="timeline" className="space-y-4">
            <div className="h-[500px] w-full overflow-y-auto">
              {sortedLogs.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <p>No chat logs available for this session.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sortedLogs.map((log, index) => (
                  <Card key={index} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        {getEventBadge(log.event)}
                        <span className="text-xs text-gray-500">
                          {formatDate(log.timestamp)}
                        </span>
                      </div>
                      
                      {log.userMessage && (
                        <div className="mb-2">
                          <p className="text-sm font-medium text-blue-800">User Message:</p>
                          <p className="text-sm text-gray-700 bg-blue-50 p-2 rounded">
                            {log.userMessage}
                          </p>
                        </div>
                      )}

                      {log.aiResponse && (
                        <div className="mb-2">
                          <p className="text-sm font-medium text-purple-800">AI Response:</p>
                          <p className="text-sm text-gray-700 bg-purple-50 p-2 rounded">
                            {log.aiResponse.length > 200 
                              ? log.aiResponse.substring(0, 200) + '...' 
                              : log.aiResponse
                            }
                          </p>
                        </div>
                      )}

                      {log.functionName && (
                        <div className="mb-2">
                          <p className="text-sm font-medium text-orange-800">Function:</p>
                          <p className="text-sm text-gray-700 bg-orange-50 p-2 rounded font-mono">
                            {log.functionName}
                          </p>
                        </div>
                      )}

                      {log.functionInputs && (
                        <div className="mb-2">
                          <p className="text-sm font-medium text-blue-800">Function Inputs:</p>
                          <div className="text-xs text-gray-700 bg-blue-50 p-2 rounded font-mono overflow-x-auto">
                            <pre>{JSON.stringify(log.functionInputs, null, 2)}</pre>
                          </div>
                        </div>
                      )}

                      {log.functionOutputs && (
                        <div className="mb-2">
                          <p className="text-sm font-medium text-green-800">Function Outputs:</p>
                          <div className="text-xs text-gray-700 bg-green-50 p-2 rounded font-mono overflow-x-auto">
                            <pre>{JSON.stringify(log.functionOutputs, null, 2)}</pre>
                          </div>
                        </div>
                      )}

                      {log.errorMessage && (
                        <div className="mb-2">
                          <p className="text-sm font-medium text-red-800">Error:</p>
                          <p className="text-sm text-gray-700 bg-red-50 p-2 rounded">
                            {log.errorMessage}
                          </p>
                        </div>
                      )}

                      {log.aiRequestId && (
                        <div className="text-xs text-gray-500 mt-2">
                          Request ID: {log.aiRequestId}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="technical" className="space-y-4">
            <div className="h-[500px] w-full overflow-y-auto">
              {sortedLogs.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <p>No technical logs available for this session.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sortedLogs.map((log, index) => (
                  <Card key={index}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm flex items-center gap-2">
                          {getEventIcon(log.event)}
                          {log.event}
                        </CardTitle>
                        <span className="text-xs text-gray-500">
                          <Clock className="h-3 w-3 inline mr-1" />
                          {formatDate(log.timestamp)}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="bg-gray-50 p-3 rounded font-mono text-xs overflow-x-auto">
                        <pre>{JSON.stringify(log, null, 2)}</pre>
                      </div>
                    </CardContent>
                  </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default ChatHistoryDialog;