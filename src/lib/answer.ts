import { LocalStorageService } from "./storage";
import { BaseEntity, Document } from "./types";
import { ProjectRag, connect, SearchResult as RagSearchResult } from "./rag";

export interface Answer extends BaseEntity {

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
        try {
            // Store in local storage for tracking
            const storage = this.getStorage(projectId);
            await storage.create({ documentId: doc.id });

            // Use RAG service for indexing
            const rag = await this.getRag(projectId);
            await rag.indexAnswer(doc);

            console.log('Document indexed successfully');
        } catch (error) {
            console.error('Error uploading answer document:', error);
            throw error;
        }
    }

    async searchDocuments(projectId: string, query: string, limit: number = 5): Promise<SearchResult[]> {
        try {
            const rag = await this.getRag(projectId);
            return await rag.search(query, limit);
        } catch (error) {
            console.error('Error searching documents:', error);
            throw error;
        }
    }

    async checkServerHealth(): Promise<boolean> {
        try {
            const rag = await this.getRag('health-check');
            return await rag.checkServerHealth();
        } catch (error) {
            console.error('Server health check failed:', error);
            return false;
        }
    }
}