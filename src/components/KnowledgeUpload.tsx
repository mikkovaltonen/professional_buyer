import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { storageService, KnowledgeDocument } from '../lib/storageService';
import { useAuth } from '../hooks/useAuth';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Upload, File, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';

interface KnowledgeUploadProps {
  onUploadComplete?: (document: KnowledgeDocument) => void;
}

export const KnowledgeUpload: React.FC<KnowledgeUploadProps> = ({
  onUploadComplete
}) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!user) {
      setError('Please log in to upload files');
      return;
    }

    const file = acceptedFiles[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['.md', '.txt'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!allowedTypes.includes(fileExtension)) {
      setError('Only .md and .txt files are supported');
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const uploadedDoc = await storageService.uploadDocument(
        file, 
        user.uid,
        fileExtension.replace('.', '')
      );
      
      onUploadComplete?.(uploadedDoc);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }, [user, onUploadComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/markdown': ['.md'],
      'text/plain': ['.txt']
    },
    multiple: false,
    disabled: uploading || !user
  });

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Upload Knowledge Document
        </CardTitle>
        <CardDescription>
          Upload markdown (.md) or text (.txt) files for internal knowledge base
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
            ${isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300'}
            ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
            ${!user ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <input {...getInputProps()} />
          
          <File className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          
          {uploading ? (
            <p className="text-gray-600">Uploading...</p>
          ) : !user ? (
            <p className="text-gray-600">Please log in to upload files</p>
          ) : isDragActive ? (
            <p className="text-primary">Drop the file here...</p>
          ) : (
            <>
              <p className="text-gray-600 mb-2">
                Drag & drop a file here, or click to select
              </p>
              <p className="text-sm text-gray-500">
                Supports .md and .txt files up to 10MB
              </p>
            </>
          )}
        </div>

        <div className="mt-4 p-6 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">📖 Document Conversion Guide</h3>
          
          <div className="mb-4 p-3 bg-white border border-blue-300 rounded">
            <h4 className="font-medium text-blue-800 mb-2">🎯 Why Markdown?</h4>
            <p className="text-blue-700 text-sm">
              Markdown is the preferred format because it's <strong>lightweight, readable, and AI-friendly</strong>. 
              It preserves document structure (headers, lists, tables) while being easy to process and search. 
              The AI can better understand and reference your content when it's in clean Markdown format.
            </p>
          </div>
          
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-medium text-blue-800 mb-2">📄 Word Documents (.docx, .doc) → Markdown</h4>
              <ul className="list-disc list-inside text-blue-700 space-y-1 ml-2">
                <li><strong>Pandoc (Recommended):</strong> <code className="bg-white px-1 rounded">pandoc document.docx -o document.md</code></li>
                <li><strong>Online converter:</strong> <a href="https://pandoc.org/try/" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-900">pandoc.org/try</a></li>
                <li><strong>Word Add-in:</strong> Install "Writage" plugin for direct Markdown export</li>
                <li><strong>Copy-paste:</strong> Copy content from Word and paste into a .md file</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium text-blue-800 mb-2">📊 Excel Files (.xlsx, .xls) → Markdown</h4>
              <ul className="list-disc list-inside text-blue-700 space-y-1 ml-2">
                <li><strong>Copy tables:</strong> Select Excel table → Copy → Paste into Markdown with table syntax</li>
                <li><strong>CSV export:</strong> Save as CSV → Use online CSV to Markdown converter</li>
                <li><strong>Online tool:</strong> <a href="https://tableconvert.com/excel-to-markdown" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-900">tableconvert.com</a></li>
                <li><strong>Manual format:</strong> Create Markdown tables manually from Excel data</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium text-blue-800 mb-2">📑 PDF Documents → Markdown</h4>
              <ul className="list-disc list-inside text-blue-700 space-y-1 ml-2">
                <li><strong>Pandoc:</strong> <code className="bg-white px-1 rounded">pandoc document.pdf -o document.md</code></li>
                <li><strong>Copy-paste:</strong> Copy text from PDF and format as Markdown</li>
                <li><strong>OCR tool:</strong> Use OCR software for scanned PDFs, then convert to Markdown</li>
                <li><strong>Online converter:</strong> Search for "PDF to Markdown converter" tools</li>
              </ul>
            </div>

            <div className="mt-4 p-3 bg-white border border-blue-300 rounded">
              <h4 className="font-medium text-blue-800 mb-2">🤖 AI-Assisted Conversion</h4>
              <p className="text-blue-700 text-sm mb-2">
                <strong>Use ChatGPT for conversion:</strong> Copy your document content and ask:
              </p>
              <div className="bg-gray-100 p-2 rounded text-xs font-mono text-gray-800 mb-2">
                "Convert this document to clean Markdown format, preserving the structure and important formatting"
              </div>
              <p className="text-blue-700 text-xs">
                This is especially useful for complex documents with mixed formatting.
              </p>
            </div>

            <div className="mt-4 p-3 bg-white border border-blue-300 rounded">
              <h4 className="font-medium text-blue-800 mb-2">💡 Pro Tips:</h4>
              <ul className="list-disc list-inside text-blue-700 space-y-1 ml-2">
                <li>Keep original formatting simple for better conversion</li>
                <li>Check converted Markdown for formatting issues</li>
                <li>Use headers (#, ##, ###) to structure your documents</li>
                <li>Test with a small document first to verify the process</li>
                <li>Save important formatting elements manually if needed</li>
                <li><strong>ChatGPT tip:</strong> Ask it to explain Markdown syntax if you're new to it</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};