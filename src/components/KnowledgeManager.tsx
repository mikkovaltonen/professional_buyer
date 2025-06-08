import React, { useState, useEffect } from 'react';
import { storageService, KnowledgeDocument } from '../lib/storageService';
import { useAuth } from '../hooks/useAuth';
import { KnowledgeUpload } from './KnowledgeUpload';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { File, Download, Trash2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';
import { toast } from 'sonner';

export const KnowledgeManager: React.FC = () => {
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const loadDocuments = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const userDocs = await storageService.getUserDocuments(user.uid);
      setDocuments(userDocs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [user]);

  const handleUploadComplete = (newDoc: KnowledgeDocument) => {
    setDocuments(prev => [newDoc, ...prev]);
  };

  const handleDelete = async (doc: KnowledgeDocument) => {
    if (!doc.id || !confirm(`Delete "${doc.name}"?`)) return;

    try {
      await storageService.deleteDocument(doc.id, doc.storageUrl);
      setDocuments(prev => prev.filter(d => d.id !== doc.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete document');
    }
  };

  const handleDownload = async (doc: KnowledgeDocument) => {
    try {
      const content = await storageService.downloadDocument(doc);
      
      // Create blob and download
      const blob = new Blob([content], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download document');
    }
  };

  const loadSampleKnowledgeData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // List of sample knowledge documents to load
      const sampleFiles = [
        { path: '/DMA_levels_markdown.md', name: 'DMA Authorization Levels' },
        { path: '/DMA_matrix_combined.md', name: 'DMA Matrix Combined' },
        { path: '/Operative purchasing process.md', name: 'Operative Purchasing Process' },
        { path: '/S2P Policy.md', name: 'Source-to-Pay Policy' }
      ];
      
      let successCount = 0;
      
      for (const sampleFile of sampleFiles) {
        try {
          // Fetch the file content
          const response = await fetch(sampleFile.path);
          if (!response.ok) {
            console.warn(`Failed to fetch ${sampleFile.name}: ${response.status}`);
            continue;
          }
          
          const content = await response.text();
          
          // Create a minimal File-like object with only required properties
          const fileName = sampleFile.name + '.md';
          
          const fileObject = {
            name: fileName,
            size: new Blob([content]).size,
            type: 'text/markdown',
            lastModified: Date.now(),
            text: async () => content,
            // Required for File interface compatibility
            webkitRelativePath: '',
            arrayBuffer: async () => new TextEncoder().encode(content).buffer,
            stream: () => new Blob([content]).stream(),
            slice: (start?: number, end?: number) => new Blob([content]).slice(start, end)
          } as File;
          
          // Upload using the existing upload function
          await storageService.uploadDocument(fileObject, user.uid, 'md');
          successCount++;
          
        } catch (fileError) {
          console.warn(`Failed to load sample file ${sampleFile.name}:`, fileError);
        }
      }
      
      if (successCount > 0) {
        // Reload documents to show the new ones
        await loadDocuments();
        toast.success(`Successfully loaded ${successCount} sample knowledge documents`);
        console.log(`✅ Successfully loaded ${successCount} sample knowledge documents`);
      } else {
        setError('Failed to load any sample documents');
        toast.error('Failed to load sample documents');
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sample knowledge data');
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-gray-600">Please log in to manage knowledge documents</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <KnowledgeUpload onUploadComplete={handleUploadComplete} />
      
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Your Knowledge Documents</CardTitle>
              <CardDescription>
                Manage your uploaded internal knowledge base documents
              </CardDescription>
            </div>
            <Button
              variant="outline"
              onClick={loadSampleKnowledgeData}
              disabled={loading}
              className="text-green-600 border-green-200 hover:bg-green-50"
            >
              📚 Load Sample Knowledge
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {loading ? (
            <p className="text-center py-8 text-gray-600">Loading documents...</p>
          ) : documents.length === 0 ? (
            <p className="text-center py-8 text-gray-600">
              No documents uploaded yet. Upload your first knowledge document above.
            </p>
          ) : (
            <div className="space-y-4">
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <File className="w-8 h-8 text-blue-500" />
                    <div>
                      <h3 className="font-medium">{doc.name}</h3>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <Badge variant="secondary">{doc.originalFormat}</Badge>
                        <span>{formatFileSize(doc.size)}</span>
                        <span>•</span>
                        <span>{new Date(doc.uploadedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(doc)}
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Download
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(doc)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};