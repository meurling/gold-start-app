import { useState, useEffect, useCallback } from 'react';
import { QuestionDocument } from '@/lib/types';
import { documentService } from '@/lib/services/document/service';

export function useDocumentService() {
  const [documents, setDocuments] = useState<QuestionDocument[]>([]);
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
  ): Promise<{ success: boolean; data?: QuestionDocument; error?: string }> => {
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
  const getDocumentById = useCallback(async (id: string): Promise<QuestionDocument | null> => {
    try {
      return await documentService.getDocumentById(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get document');
      return null;
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
  };
}
