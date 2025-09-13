import { useState, useEffect, useCallback } from 'react';
import { Document, ProcessingStatus } from '@/lib/types';
import { documentService } from '@/lib/services/document/service';
import { ParsedQuestion } from '@/lib/services/document/processor';

export function useDocumentService() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load documents for a specific project
  const loadDocuments = useCallback(async (projectId: string) => {
    if (!projectId) {
      setDocuments([]);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const docs = await documentService.getDocumentsByProject(projectId);
      setDocuments(docs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  }, []);

  // Upload a new document
  const uploadDocument = useCallback(async (
    file: File,
    userId: string,
    projectId: string
  ): Promise<{ success: boolean; data?: Document; error?: string }> => {
    setLoading(true);
    setError(null);

    try {
      const result = await documentService.uploadDocument(file, userId, projectId);
      
      if (result.success && result.data) {
        setDocuments(prev => [...prev, result.data!]);
      }
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload document';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete a document
  const deleteDocument = useCallback(async (documentId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const success = await documentService.deleteDocument(documentId);
      
      if (success) {
        setDocuments(prev => prev.filter(doc => doc.id !== documentId));
      }
      
      return success;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete document');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get document statistics
  const getDocumentStats = useCallback(() => {
    return documentService.getDocumentStats(documents);
  }, [documents]);

  // Get document by ID
  const getDocumentById = useCallback(async (id: string): Promise<Document | null> => {
    try {
      return await documentService.getDocumentById(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get document');
      return null;
    }
  }, []);

  // Process document to extract questions
  const processDocument = useCallback(async (documentId: string): Promise<{
    success: boolean;
    questions?: ParsedQuestion[];
    error?: string;
  }> => {
    // Don't set global loading state - this is a single document operation
    setError(null);

    try {
      // Immediately update UI to show processing status
      setDocuments(prev => prev.map(doc => 
        doc.id === documentId 
          ? { ...doc, processingStatus: 'processing' as ProcessingStatus }
          : doc
      ));

      const result = await documentService.processDocument(documentId);
      
      // Reload documents to get updated processing status
      const document = await documentService.getDocumentById(documentId);
      if (document) {
        setDocuments(prev => prev.map(doc => 
          doc.id === documentId ? document : doc
        ));
      }
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process document';
      setError(errorMessage);
      
      // Update UI to show failed status
      setDocuments(prev => prev.map(doc => 
        doc.id === documentId 
          ? { ...doc, processingStatus: 'failed' as ProcessingStatus, processingError: errorMessage }
          : doc
      ));
      
      return { success: false, error: errorMessage };
    }
  }, []);

  // Get documents by processing status
  const getDocumentsByProcessingStatus = useCallback(async (projectId: string, status: ProcessingStatus): Promise<Document[]> => {
    try {
      return await documentService.getDocumentsByProcessingStatus(projectId, status);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get documents by status');
      return [];
    }
  }, []);

  return {
    documents,
    loading,
    error,
    loadDocuments,
    uploadDocument,
    deleteDocument,
    getDocumentStats,
    getDocumentById,
    processDocument,
    getDocumentsByProcessingStatus,
  };
}
