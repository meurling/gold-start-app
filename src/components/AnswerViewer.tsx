import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Eye, FileText, Calendar, ExternalLink } from "lucide-react";
import { QuestionAnswer, Document } from "@/lib/types";
import { DocumentViewer } from "@/components/DocumentViewer";
import { useDocumentService } from "@/hooks/useDocumentService";
import { formatDistanceToNow } from "date-fns";

interface AnswerViewerProps {
  questionId: string;
  questionContent: string;
  answers: QuestionAnswer[];
  trigger?: React.ReactNode;
}

export function AnswerViewer({ questionId, questionContent, answers, trigger }: AnswerViewerProps) {
  const [documents, setDocuments] = useState<Map<string, Document>>(new Map());
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [isDocumentViewerOpen, setIsDocumentViewerOpen] = useState(false);
  
  const { getDocumentById } = useDocumentService();

  // Load documents for all answers
  useEffect(() => {
    const loadDocuments = async () => {
      if (answers.length === 0) return;
      
      setLoadingDocuments(true);
      const documentMap = new Map<string, Document>();
      
      // Get unique document IDs
      const uniqueDocumentIds = [...new Set(answers.map(answer => answer.documentId))];
      
      // Load each document
      for (const documentId of uniqueDocumentIds) {
        try {
          const document = await getDocumentById(documentId);
          if (document) {
            documentMap.set(documentId, document);
          }
        } catch (error) {
          console.error(`Failed to load document ${documentId}:`, error);
        }
      }
      
      setDocuments(documentMap);
      setLoadingDocuments(false);
    };

    loadDocuments();
  }, [answers, getDocumentById]);

  const handleDocumentClick = (documentId: string) => {
    const document = documents.get(documentId);
    if (document) {
      setSelectedDocument(document);
      setIsDocumentViewerOpen(true);
    }
  };

  if (answers.length === 0) {
    return null;
  }

  const defaultTrigger = (
    <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-700 hover:bg-slate-100 h-8 w-8 p-0">
      <Eye className="h-4 w-4" />
    </Button>
  );

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Answer Documents
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Question Display */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Question</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-base leading-relaxed text-slate-900">{questionContent}</p>
            </CardContent>
          </Card>

          {/* Answers */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-slate-600">
                Found {answers.length} answer{answers.length !== 1 ? 's' : ''} in documents
              </h3>
              <Badge variant="secondary" className="text-xs">
                {answers.length} document{answers.length !== 1 ? 's' : ''}
              </Badge>
            </div>
            
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                {loadingDocuments ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-600 mx-auto mb-2"></div>
                    <p className="text-sm text-slate-500">Loading documents...</p>
                  </div>
                ) : (
                  answers.map((answer, index) => {
                    const document = documents.get(answer.documentId);
                    const documentName = document?.fileName || `Document ${answer.documentId}`;
                    
                    return (
                      <Card key={`${answer.documentId}-${index}`} className="border-slate-200">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <CardTitle className="text-sm font-medium text-slate-700">
                                From: 
                              </CardTitle>
                              <Button
                                variant="link"
                                size="sm"
                                onClick={() => handleDocumentClick(answer.documentId)}
                                className="h-auto p-0 text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                                disabled={!document}
                              >
                                <div className="flex items-center gap-1">
                                  <FileText className="h-3 w-3" />
                                  {documentName}
                                  <ExternalLink className="h-3 w-3" />
                                </div>
                              </Button>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                              <Calendar className="h-3 w-3" />
                              {formatDistanceToNow(new Date(answer.createdAt))} ago
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="prose prose-sm max-w-none">
                            <p className="text-slate-800 leading-relaxed whitespace-pre-wrap">
                              {answer.content}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
      
      {/* Document Viewer Modal */}
      {selectedDocument && (
        <DocumentViewer
          document={selectedDocument}
          isOpen={isDocumentViewerOpen}
          onClose={() => {
            setIsDocumentViewerOpen(false);
            setSelectedDocument(null);
          }}
        />
      )}
    </Dialog>
  );
}
