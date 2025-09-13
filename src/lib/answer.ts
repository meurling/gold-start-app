import { LocalStorageService } from "./storage";
import { BaseEntity, Document } from "./types";
import { ProjectRag, connect, SearchResult as RagSearchResult } from "./rag";
import { debugLogger, logDocumentOperation, logError } from "./debug";

export interface Answer extends BaseEntity {
    questionId: string;
    content: string;
    documentId: string;
}

export interface AnswerDocuments extends BaseEntity {
    documentId: string;
}

export type SearchResult = RagSearchResult;

function answerDocumentStorageKey(projectId: string): string {
    return 'storage/src/lib/answer.ts:main:' + projectId;
}

export class AnswerService {
    private answerDocumentStorage = new Map<string, LocalStorageService<AnswerDocuments>>();
    private ragInstances = new Map<string, ProjectRag>();

    private getStorage(projectId: string): LocalStorageService<AnswerDocuments> {
        if (!this.answerDocumentStorage.has(projectId)) {
            this.answerDocumentStorage.set(
                projectId,
                new LocalStorageService(answerDocumentStorageKey(projectId), '1.0')
            );
        }
        return this.answerDocumentStorage.get(projectId)!;
    }

    private async getRag(projectId: string): Promise<ProjectRag> {
        if (!this.ragInstances.has(projectId)) {
            const rag = await connect(projectId);
            this.ragInstances.set(projectId, rag);
        }
        return this.ragInstances.get(projectId)!;
    }

    async uploadAnswerDocument(projectId: string, doc: Document): Promise<void> {
        logDocumentOperation('uploadAnswerDocument_start', doc.id, projectId, {
            contentLength: doc.rawText.length
        });

        try {
            // Store in local storage for tracking
            const storage = this.getStorage(projectId);
            debugLogger.debug('Storing document in local storage', { 
                component: 'AnswerService', 
                operation: 'uploadAnswerDocument',
                projectId,
                documentId: doc.id
            });

            await storage.create({ documentId: doc.id });

            // Use RAG service for indexing
            debugLogger.debug('Getting RAG instance for indexing', { 
                component: 'AnswerService', 
                operation: 'uploadAnswerDocument',
                projectId,
                documentId: doc.id
            });

            const rag = await this.getRag(projectId);
            await rag.indexAnswer(doc);

            logDocumentOperation('uploadAnswerDocument_success', doc.id, projectId, {
                contentLength: doc.rawText.length
            });
        } catch (error) {
            logError('AnswerService', 'uploadAnswerDocument', error, {
                component: 'AnswerService',
                operation: 'uploadAnswerDocument',
                projectId,
                documentId: doc.id
            });
            throw error;
        }
    }

    async searchDocuments(projectId: string, query: string, limit: number = 5): Promise<SearchResult[]> {
        debugLogger.info('Starting document search', { 
            component: 'AnswerService', 
            operation: 'searchDocuments',
            projectId
        }, { query, limit });

        try {
            const rag = await this.getRag(projectId);
            const results = await rag.search(query, limit);
            
            debugLogger.info('Document search completed', { 
                component: 'AnswerService', 
                operation: 'searchDocuments',
                projectId
            }, { 
                query,
                resultCount: results.length,
                results: results.map(r => ({
                    chunkId: r.chunk?.id,
                    documentId: r.chunk?.documentId,
                    score: r.score
                }))
            });

            return results;
        } catch (error) {
            logError('AnswerService', 'searchDocuments', error, {
                component: 'AnswerService',
                operation: 'searchDocuments',
                projectId
            });
            throw error;
        }
    }

    async checkServerHealth(): Promise<boolean> {
        debugLogger.debug('Checking server health via AnswerService', { 
            component: 'AnswerService', 
            operation: 'checkServerHealth'
        });

        try {
            const rag = await this.getRag('health-check');
            const isHealthy = await rag.checkServerHealth();
            
            debugLogger.info('Server health check completed via AnswerService', { 
                component: 'AnswerService', 
                operation: 'checkServerHealth'
            }, { isHealthy });
            
            return isHealthy;
        } catch (error) {
            logError('AnswerService', 'checkServerHealth', error, {
                component: 'AnswerService',
                operation: 'checkServerHealth'
            });
            return false;
        }
    }

    async getIndexedDocumentIds(projectId: string): Promise<string[]> {
        debugLogger.debug('Getting indexed document IDs', { 
            component: 'AnswerService', 
            operation: 'getIndexedDocumentIds',
            projectId
        });

        try {
            const storage = this.getStorage(projectId);
            const result = await storage.getAll();
            
            if (result.success && result.data) {
                const documentIds = result.data.map(answerDoc => answerDoc.documentId);
                debugLogger.info('Retrieved indexed document IDs', { 
                    component: 'AnswerService', 
                    operation: 'getIndexedDocumentIds',
                    projectId
                }, { documentCount: documentIds.length, documentIds });
                return documentIds;
            }
            
            debugLogger.warn('No indexed documents found', { 
                component: 'AnswerService', 
                operation: 'getIndexedDocumentIds',
                projectId
            });
            return [];
        } catch (error) {
            logError('AnswerService', 'getIndexedDocumentIds', error, {
                component: 'AnswerService',
                operation: 'getIndexedDocumentIds',
                projectId
            });
            return [];
        }
    }
}