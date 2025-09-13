import { useState } from 'react';
import { File, Eye, Trash2, Calendar, User, FileText, Play, CheckCircle, XCircle, Loader2, Brain } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Document, ProcessingStatus } from '@/lib/types';
import { DocumentViewer } from './DocumentViewer';

interface DocumentListProps {
  documents: Document[];
  loading?: boolean;
  error?: string | null;
  onDelete?: (documentId: string) => void;
  onView?: (document: Document) => void;
  onProcess?: (documentId: string) => void;
}

export function DocumentList({ 
  documents, 
  loading = false, 
  error = null, 
  onDelete,
  onView,
  onProcess
}: DocumentListProps) {
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  const handleView = (document: Document) => {
    setSelectedDocument(document);
    setIsViewerOpen(true);
    onView?.(document);
  };

  const handleDelete = (documentId: string) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      onDelete?.(documentId);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getProcessingStatusBadge = (status: ProcessingStatus) => {
    switch (status) {
      case 'not_started':
        return <Badge variant="outline" className="text-xs">Not Processed</Badge>;
      case 'processing':
        return <Badge variant="secondary" className="text-xs flex items-center gap-1 animate-pulse">
          <Loader2 className="h-3 w-3 animate-spin" />
          Processing
        </Badge>;
      case 'completed':
        return <Badge variant="default" className="text-xs bg-green-600">Completed</Badge>;
      case 'failed':
        return <Badge variant="destructive" className="text-xs">Failed</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">Unknown</Badge>;
    }
  };

  const getProcessingStatusIcon = (status: ProcessingStatus) => {
    switch (status) {
      case 'not_started':
        return <Play className="h-4 w-4 text-muted-foreground" />;
      case 'processing':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Play className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getDocumentIcon = (documentType: string, fileName?: string) => {
    // Use file extension for more accurate icon selection
    if (fileName) {
      const extension = fileName.split('.').pop()?.toLowerCase();
      switch (extension) {
        case 'pdf':
          return <File className="h-5 w-5 text-red-500" />;
        case 'docx':
        case 'doc':
          return <File className="h-5 w-5 text-blue-500" />;
        case 'txt':
          return <FileText className="h-5 w-5 text-green-500" />;
        case 'rtf':
          return <File className="h-5 w-5 text-purple-500" />;
        default:
          return <File className="h-5 w-5 text-gray-500" />;
      }
    }
    
    // Fallback to document type
    switch (documentType.toLowerCase()) {
      case 'pdf':
        return <File className="h-5 w-5 text-red-500" />;
      case 'word document':
        return <File className="h-5 w-5 text-blue-500" />;
      case 'text file':
        return <FileText className="h-5 w-5 text-green-500" />;
      default:
        return <File className="h-5 w-5 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3 border rounded-lg">
                <Skeleton className="h-5 w-5" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-8 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (documents.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <File className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No documents uploaded yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Upload documents to create questions from their content
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <File className="h-5 w-5" />
            Documents ({documents.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {documents.map((document) => (
              <div
                key={document.id}
                className={`flex items-center gap-3 p-4 border rounded-lg transition-colors ${
                  document.processingStatus === 'processing' 
                    ? 'bg-blue-50/50 border-blue-200 hover:bg-blue-50' 
                    : 'hover:bg-muted/30'
                }`}
              >
                {getDocumentIcon(document.documentType, document.fileName)}
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium truncate">{document.fileName}</h4>
                    <Badge variant="secondary" className="text-xs">
                      {document.documentType}
                    </Badge>
                    {getProcessingStatusBadge(document.processingStatus)}
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(document.createdAt)}
                    </span>
                    <span>{formatFileSize(Math.round((document.content.length * 3) / 4))}</span>
                    {document.rawText && (
                      <span className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        {document.rawText.length} characters
                      </span>
                    )}
                  </div>
                  
                  {/* Processing indicator */}
                  {document.processingStatus === 'processing' && (
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Brain className="h-4 w-4 text-blue-600 animate-pulse" />
                        <span className="text-sm font-medium text-blue-800">
                          AI is analyzing this document...
                        </span>
                      </div>
                      <div className="space-y-2">
                        <Progress value={undefined} className="h-2" />
                        <p className="text-xs text-blue-600">
                          Extracting questions and categorizing content
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {/* Processing error */}
                  {document.processingStatus === 'failed' && document.processingError && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <XCircle className="h-4 w-4 text-red-600" />
                        <span className="text-sm font-medium text-red-800">
                          Processing failed
                        </span>
                      </div>
                      <p className="text-xs text-red-600">
                        {document.processingError}
                      </p>
                    </div>
                  )}
                  
                  {/* Processing completed */}
                  {document.processingStatus === 'completed' && (
                    <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-green-800">
                          Processing completed successfully
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleView(document)}
                    className="flex items-center gap-1"
                  >
                    <Eye className="h-4 w-4" />
                    View
                  </Button>
                  
                  {onProcess && document.processingStatus === 'not_started' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onProcess(document.id)}
                      className="flex items-center gap-1"
                    >
                      {getProcessingStatusIcon(document.processingStatus)}
                      Process
                    </Button>
                  )}
                  
                  {document.processingStatus === 'processing' && (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled
                      className="flex items-center gap-1"
                    >
                      {getProcessingStatusIcon(document.processingStatus)}
                      Processing...
                    </Button>
                  )}
                  
                  {onDelete && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(document.id)}
                      className="flex items-center gap-1 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Document Viewer Modal */}
      {selectedDocument && (
        <DocumentViewer
          document={selectedDocument}
          isOpen={isViewerOpen}
          onClose={() => {
            setIsViewerOpen(false);
            setSelectedDocument(null);
          }}
        />
      )}
    </>
  );
}
