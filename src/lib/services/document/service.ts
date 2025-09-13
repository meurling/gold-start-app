import { Document } from '@/lib/types';
import { LocalStorageService } from '@/lib/storage';
import * as mammoth from 'mammoth';

// Document service for handling Document operations
export class DocumentService {
  private storage: LocalStorageService<Document>;

  constructor() {
    this.storage = new LocalStorageService<Document>('question-documents');
  }

  // Upload and create a new document
  async uploadDocument(
    file: File,
    userId: string,
    projectId: string
  ): Promise<{ success: boolean; data?: Document; error?: string }> {
    try {
      // Read file content as ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      
      // Convert ArrayBuffer to base64 string for localStorage compatibility
      const content = this.arrayBufferToBase64(arrayBuffer);
      
      // For now, we'll extract text from the filename (in a real app, you'd use a library like pdf-parse)
      // This is a placeholder - you'll need to implement proper text extraction based on file type
      const rawText = await this.extractTextFromFile(file, arrayBuffer);

      const document: Omit<Document, 'id' | 'createdAt' | 'updatedAt'> = {
        fileName: file.name,
        documentType: this.getDocumentType(file.name),
        content,
        rawText,
        userId,
        projectId,
      };

      const result = await this.storage.create(document);
      
      if (result.success) {
        return { success: true, data: result.data };
      } else {
        return { success: false, error: result.error?.message || 'Failed to save document' };
      }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  // Get all documents for a project
  async getDocumentsByProject(projectId: string): Promise<Document[]> {
    const result = await this.storage.getAll();
    if (result.success && result.data) {
      return result.data.filter(doc => doc.projectId === projectId);
    }
    return [];
  }

  // Get document by ID
  async getDocumentById(id: string): Promise<Document | null> {
    const result = await this.storage.getById(id);
    return result.success ? result.data : null;
  }

  // Delete document
  async deleteDocument(id: string): Promise<boolean> {
    const result = await this.storage.delete(id);
    return result.success;
  }

  // Get document statistics
  getDocumentStats(documents: Document[]) {
    const stats = {
      total: documents.length,
      byType: {} as Record<string, number>,
      totalSize: 0,
    };

    documents.forEach(doc => {
      stats.byType[doc.documentType] = (stats.byType[doc.documentType] || 0) + 1;
      // Calculate size from base64 string (base64 is ~4/3 the size of original)
      stats.totalSize += Math.round((doc.content.length * 3) / 4);
    });

    return stats;
  }

  // Extract HTML from .docx files (preserves formatting)
  async extractHtmlFromDocx(content: string): Promise<string> {
    try {
      const arrayBuffer = this.base64ToArrayBuffer(content);
      const result = await mammoth.convertToHtml({ arrayBuffer });
      
      if (result.messages && result.messages.length > 0) {
        console.warn('Mammoth HTML conversion messages:', result.messages);
      }
      
      return result.value;
    } catch (error) {
      console.error('Error converting .docx to HTML:', error);
      return `<p>Error converting document to HTML: ${error instanceof Error ? error.message : 'Unknown error'}</p>`;
    }
  }

  // Helper methods
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  private getDocumentType(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase();
    const typeMap: Record<string, string> = {
      'pdf': 'PDF',
      'doc': 'Word Document',
      'docx': 'Word Document',
      'txt': 'Text File',
      'rtf': 'Rich Text',
      'odt': 'OpenDocument Text',
      'pages': 'Pages Document',
    };
    return typeMap[extension || ''] || 'Unknown';
  }

  private async extractTextFromFile(file: File, content: ArrayBuffer): Promise<string> {
    const extension = file.name.split('.').pop()?.toLowerCase();
    
    try {
      switch (extension) {
        case 'txt':
          return new TextDecoder().decode(content);
          
        case 'docx':
          // Use mammoth to extract text from .docx files
          const result = await mammoth.extractRawText({ arrayBuffer: content });
          
          // Log any warnings or messages from mammoth
          if (result.messages && result.messages.length > 0) {
            console.warn(`Mammoth messages for ${file.name}:`, result.messages);
          }
          
          return result.value; // mammoth returns { value: string, messages: any[] }
          
        case 'doc':
          // .doc files are more complex and would need a different library
          // For now, return a placeholder
          return `[Word Document (.doc) from ${file.name}] - .doc file support not implemented yet. Please use .docx format.`;
          
        case 'pdf':
          // Placeholder - would need pdf-parse library
          return `[PDF Content from ${file.name}] - PDF text extraction not implemented yet`;
          
        case 'rtf':
          // RTF files can be complex, for now return placeholder
          return `[RTF Content from ${file.name}] - RTF text extraction not implemented yet`;
          
        default:
          return `[${this.getDocumentType(file.name)} Content from ${file.name}] - Text extraction not implemented for this file type`;
      }
    } catch (error) {
      console.error(`Error extracting text from ${file.name}:`, error);
      return `[Error extracting text from ${file.name}] - ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }
}

// Export singleton instance
export const documentService = new DocumentService();
