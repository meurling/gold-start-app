import { useState, useEffect } from 'react';
import { X, File, Download, FileText, Calendar, User, Hash, Eye } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Document } from '@/lib/types';
import { documentService } from '@/lib/services/document/service';

interface DocumentViewerProps {
  document: Document;
  isOpen: boolean;
  onClose: () => void;
}

export function DocumentViewer({ document, isOpen, onClose }: DocumentViewerProps) {
  const [activeTab, setActiveTab] = useState<'content' | 'metadata'>('content');
  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  const [loadingHtml, setLoadingHtml] = useState(false);

  // Load HTML content for .docx files
  useEffect(() => {
    if (document.documentType.toLowerCase() === 'word document' && document.fileName.toLowerCase().endsWith('.docx')) {
      setLoadingHtml(true);
      documentService.extractHtmlFromDocx(document.content)
        .then(html => {
          setHtmlContent(html);
        })
        .catch(error => {
          console.error('Error loading HTML content:', error);
          setHtmlContent(null);
        })
        .finally(() => {
          setLoadingHtml(false);
        });
    } else {
      setHtmlContent(null);
    }
  }, [document]);

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
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const handleDownload = () => {
    // Convert base64 content back to ArrayBuffer and create blob
    const binary = atob(document.content);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = document.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getDocumentIcon = (documentType: string, fileName?: string) => {
    // Use file extension for more accurate icon selection
    if (fileName) {
      const extension = fileName.split('.').pop()?.toLowerCase();
      switch (extension) {
        case 'pdf':
          return <File className="h-6 w-6 text-red-500" />;
        case 'docx':
        case 'doc':
          return <File className="h-6 w-6 text-blue-500" />;
        case 'txt':
          return <FileText className="h-6 w-6 text-green-500" />;
        case 'rtf':
          return <File className="h-6 w-6 text-purple-500" />;
        default:
          return <File className="h-6 w-6 text-gray-500" />;
      }
    }
    
    // Fallback to document type
    switch (documentType.toLowerCase()) {
      case 'pdf':
        return <File className="h-6 w-6 text-red-500" />;
      case 'word document':
        return <File className="h-6 w-6 text-blue-500" />;
      case 'text file':
        return <FileText className="h-6 w-6 text-green-500" />;
      default:
        return <File className="h-6 w-6 text-gray-500" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getDocumentIcon(document.documentType, document.fileName)}
              <div>
                <DialogTitle className="text-left">{document.fileName}</DialogTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary">{document.documentType}</Badge>
                  <span className="text-sm text-muted-foreground">
                    {formatFileSize(Math.round((document.content.length * 3) / 4))}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <Separator className="flex-shrink-0" />

        <div className="flex-1 min-h-0">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'content' | 'metadata' | 'formatted')}>
            <TabsList className={`grid w-full ${htmlContent ? 'grid-cols-3' : 'grid-cols-2'}`}>
              <TabsTrigger value="content" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Raw Text
              </TabsTrigger>
              {htmlContent && (
                <TabsTrigger value="formatted" className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Formatted
                </TabsTrigger>
              )}
              <TabsTrigger value="metadata" className="flex items-center gap-2">
                <Hash className="h-4 w-4" />
                Metadata
              </TabsTrigger>
            </TabsList>

            <TabsContent value="content" className="mt-4 h-full">
              <ScrollArea className="h-[calc(90vh-200px)]">
                <div className="p-4">
                  {document.rawText ? (
                    <div className="prose prose-sm max-w-none">
                      <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                        {document.rawText}
                      </pre>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">No text content available</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Text extraction is not implemented for this file type yet
                      </p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            {htmlContent && (
              <TabsContent value="formatted" className="mt-4 h-full">
                <ScrollArea className="h-[calc(90vh-200px)]">
                  <div className="p-4">
                    {loadingHtml ? (
                      <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-muted-foreground">Loading formatted content...</p>
                      </div>
                    ) : (
                      <div 
                        className="prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: htmlContent }}
                      />
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
            )}

            <TabsContent value="metadata" className="mt-4 h-full">
              <ScrollArea className="h-[calc(90vh-200px)]">
                <div className="p-4 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg">File Information</h3>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <File className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">File Name</p>
                            <p className="text-sm text-muted-foreground">{document.fileName}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="h-4 w-4" />
                          <div>
                            <p className="text-sm font-medium">Document Type</p>
                            <p className="text-sm text-muted-foreground">{document.documentType}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <Hash className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">File Size</p>
                            <p className="text-sm text-muted-foreground">
                              {formatFileSize(Math.round((document.content.length * 3) / 4))}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg">Document Details</h3>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">Created</p>
                            <p className="text-sm text-muted-foreground">
                              {formatDate(document.createdAt)}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">Last Modified</p>
                            <p className="text-sm text-muted-foreground">
                              {formatDate(document.updatedAt)}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">User ID</p>
                            <p className="text-sm text-muted-foreground font-mono">
                              {document.userId}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <Hash className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">Project ID</p>
                            <p className="text-sm text-muted-foreground font-mono">
                              {document.projectId}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {document.rawText && (
                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg">Text Statistics</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-3 border rounded-lg">
                          <p className="text-2xl font-bold">{document.rawText.length}</p>
                          <p className="text-sm text-muted-foreground">Characters</p>
                        </div>
                        <div className="p-3 border rounded-lg">
                          <p className="text-2xl font-bold">
                            {document.rawText.split(/\s+/).filter(word => word.length > 0).length}
                          </p>
                          <p className="text-sm text-muted-foreground">Words</p>
                        </div>
                        <div className="p-3 border rounded-lg">
                          <p className="text-2xl font-bold">
                            {document.rawText.split('\n').filter(line => line.trim().length > 0).length}
                          </p>
                          <p className="text-sm text-muted-foreground">Lines</p>
                        </div>
                        <div className="p-3 border rounded-lg">
                          <p className="text-2xl font-bold">
                            {Math.round(document.rawText.split(/\s+/).filter(word => word.length > 0).length / 200)}
                          </p>
                          <p className="text-sm text-muted-foreground">Est. Pages</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
