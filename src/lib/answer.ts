import { LocalStorageService } from "./storage";
import { BaseEntity, Document } from "./types";

export interface Answer extends BaseEntity {

}

export interface AnswerDocument extends BaseEntity {
    documentId: string;
}

export interface SearchResult {
    chunk: {
        id: string;
        content: string;
        chunkIndex: number;
        totalChunks: number;
        documentId: string;
        metadata?: {
            createdAt?: Date;
            category?: string;
        };
    };
    score: number;
    highlights?: string[];
}

function answerDocumentStorageKey(projectId: string): string {
    return 'storage/src/lib/answer.ts:main:' + projectId;
}

export class AnswerService {
    private apiBaseUrl = 'http://localhost:3001/api';
    private answerDocumentStorage = new Map<string, LocalStorageService<AnswerDocument>>();

    private getStorage(projectId: string): LocalStorageService<AnswerDocument> {
        if (!this.answerDocumentStorage.has(projectId)) {
            this.answerDocumentStorage.set(
                projectId,
                new LocalStorageService(answerDocumentStorageKey(projectId), '1.0')
            );
        }
        return this.answerDocumentStorage.get(projectId)!;
    }

    async uploadAnswerDocument(projectId: string, doc: Document): Promise<void> {
        try {
            // Store in local storage for tracking
            const storage = this.getStorage(projectId);
            await storage.create({documentId: doc.id});

            // Send to server for indexing
            const response = await fetch(`${this.apiBaseUrl}/index`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    projectId,
                    document: doc
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            if (!result.success) {
                throw new Error(result.error || 'Failed to index document');
            }

            console.log('Document indexed successfully:', result.data);
        } catch (error) {
            console.error('Error uploading answer document:', error);
            throw error;
        }
    }

    async searchDocuments(projectId: string, query: string, limit: number = 5): Promise<SearchResult[]> {
        try {
            const response = await fetch(`${this.apiBaseUrl}/search`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    projectId,
                    query,
                    limit
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            if (!result.success) {
                throw new Error(result.error || 'Failed to search documents');
            }

            return result.data.results || [];
        } catch (error) {
            console.error('Error searching documents:', error);
            throw error;
        }
    }

    // Check if server is available
    async checkServerHealth(): Promise<boolean> {
        try {
            const response = await fetch(`${this.apiBaseUrl}/health`);
            return response.ok;
        } catch (error) {
            console.error('Server health check failed:', error);
            return false;
        }
    }
}