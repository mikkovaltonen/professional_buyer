import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Upload, FileText, X, Download } from "lucide-react";
import { toast } from "sonner";
import ProcurementChat from "@/components/ProcurementChat";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface DocumentAnalysisProps {
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  fileFilter?: 'pdf' | 'excel' | 'all';
  dialogMode?: boolean;
}

interface UploadedFile {
  name: string;
  type: string;
  size: number;
  content: string | ArrayBuffer;
  url?: string;
}

const DocumentAnalysis: React.FC<DocumentAnalysisProps> = ({
  isLoading,
  setIsLoading,
  fileFilter = 'all',
  dialogMode = false
}) => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [activeTab, setActiveTab] = useState<'upload' | 'analysis'>('upload');
  const [dragActive, setDragActive] = useState(false);

  const handleFiles = useCallback(async (files: File[]) => {
    const getValidTypes = () => {
      switch (fileFilter) {
        case 'pdf':
          return ['application/pdf'];
        case 'excel':
          return [
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/csv'
          ];
        default:
          return [
            'application/pdf',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/csv',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
          ];
      }
    };

    const validTypes = getValidTypes();
    const validFiles = files.filter(file => validTypes.includes(file.type));

    if (validFiles.length !== files.length) {
      const allowedTypes = fileFilter === 'pdf' ? 'PDF documents' : 
                          fileFilter === 'excel' ? 'Excel and CSV files' : 
                          'PDF, Excel, CSV, and Word documents';
      toast.error(`Some files were skipped. Only ${allowedTypes} are supported.`);
    }

    for (const file of validFiles) {
      try {
        setIsLoading(true);
        
        let content: string | ArrayBuffer;
        if (file.type === 'application/pdf') {
          // For PDFs, we'll store the file URL for preview
          content = await readFileAsDataURL(file);
        } else {
          // For other files, read as text or binary
          content = await readFileAsText(file);
        }

        const newFile: UploadedFile = {
          name: file.name,
          type: file.type,
          size: file.size,
          content,
          url: file.type === 'application/pdf' ? URL.createObjectURL(file) : undefined
        };

        setUploadedFiles(prev => [...prev, newFile]);
        toast.success(`${file.name} uploaded successfully`);
      } catch (error) {
        console.error('Error reading file:', error);
        toast.error(`Failed to read ${file.name}`);
      } finally {
        setIsLoading(false);
      }
    }
  }, [setIsLoading]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  }, [handleFiles]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      handleFiles(files);
    }
  }, [handleFiles]);

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  const readFileAsDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => {
      const file = prev[index];
      if (file.url) {
        URL.revokeObjectURL(file.url);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getAcceptedTypes = () => {
    switch (fileFilter) {
      case 'pdf':
        return '.pdf';
      case 'excel':
        return '.xlsx,.xls,.csv';
      default:
        return '.pdf,.xlsx,.xls,.csv,.doc,.docx';
    }
  };

  const getFileTypeDescription = () => {
    switch (fileFilter) {
      case 'pdf':
        return 'PDF documents';
      case 'excel':
        return 'Excel (.xlsx, .xls) and CSV files';
      default:
        return 'PDF, Excel (.xlsx, .xls), CSV, and Word documents';
    }
  };

  // If dialog mode, show simplified upload interface
  if (dialogMode) {
    return (
      <div className="space-y-4">
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            dragActive
              ? 'border-[#4ADE80] bg-green-50'
              : 'border-gray-300 hover:border-[#4ADE80]'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <Upload className="mx-auto h-8 w-8 text-gray-400 mb-3" />
          <p className="text-base font-medium text-gray-900 mb-2">
            Drop files here or click to upload
          </p>
          <p className="text-sm text-gray-500 mb-3">
            Supports {getFileTypeDescription()}
          </p>
          <input
            type="file"
            multiple
            accept={getAcceptedTypes()}
            onChange={handleFileInput}
            className="hidden"
            id="dialog-file-upload"
          />
          <label htmlFor="dialog-file-upload">
            <Button variant="outline" size="sm" className="cursor-pointer">
              Select Files
            </Button>
          </label>
        </div>

        {/* Uploaded Files List */}
        {uploadedFiles.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Uploaded Files ({uploadedFiles.length})</h4>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {uploadedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm"
                >
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-blue-500" />
                    <div>
                      <p className="font-medium text-gray-900 truncate max-w-48">{file.name}</p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'upload' | 'analysis')} className="w-full">
        <TabsList>
          <TabsTrigger value="upload">Document Upload</TabsTrigger>
          <TabsTrigger value="analysis">AI Analysis</TabsTrigger>
        </TabsList>
        
        <TabsContent value="upload">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Upload className="h-5 w-5 text-[#4ADE80] mr-2" />
                Upload Documents for Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive
                    ? 'border-[#4ADE80] bg-green-50'
                    : 'border-gray-300 hover:border-[#4ADE80]'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-lg font-medium text-gray-900 mb-2">
                  Drop files here or click to upload
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  Supports {getFileTypeDescription()}
                </p>
                <input
                  type="file"
                  multiple
                  accept={getAcceptedTypes()}
                  onChange={handleFileInput}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload">
                  <Button variant="outline" className="cursor-pointer">
                    Select Files
                  </Button>
                </label>
              </div>

              {/* Uploaded Files List */}
              {uploadedFiles.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-medium mb-4">Uploaded Files ({uploadedFiles.length})</h3>
                  <div className="space-y-2">
                    {uploadedFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <FileText className="h-5 w-5 text-blue-500" />
                          <div>
                            <p className="font-medium text-gray-900">{file.name}</p>
                            <p className="text-sm text-gray-500">
                              {formatFileSize(file.size)} • {file.type.split('/')[1].toUpperCase()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {file.url && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(file.url, '_blank')}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 text-[#4ADE80] mr-2" />
                AI Document Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              {uploadedFiles.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-lg font-medium text-gray-900 mb-2">
                    No documents uploaded yet
                  </p>
                  <p className="text-sm text-gray-500">
                    Upload some documents to start AI analysis
                  </p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => setActiveTab('upload')}
                  >
                    Upload Documents
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                      <strong>{uploadedFiles.length}</strong> document(s) ready for analysis. 
                      Use the chat below to ask questions about your documents or request specific analyses.
                    </p>
                  </div>
                  
                  <ProcurementChat 
                    uploadedFiles={uploadedFiles}
                    onCorrectionsApplied={() => {}}
                    applyBatchCorrectionsFromChat={() => {}}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DocumentAnalysis;