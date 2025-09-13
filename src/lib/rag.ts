import { Document } from "./types";
import { debugLogger, logRAGOperation, logError } from "./debug";

export interface DocumentChunk {
    id: string;
    content: string;
    chunkIndex: number;
    totalChunks: number;
    documentId: string;
    metadata?: {
        createdAt?: Date;
        category?: string;
    };
}

export interface ChunkingConfig {
    maxChunkSize: number;
    overlapSize: number;
    minChunkSize: number;
}

export interface SearchResult {
    chunk: DocumentChunk;
    score: number;
    highlights?: string[];
}

const DEFAULT_CHUNKING_CONFIG: ChunkingConfig = {
    maxChunkSize: 500,
    overlapSize: 50,
    minChunkSize: 100,
};

export class ProjectRag {
    private chunkingConfig: ChunkingConfig;
    private projectId: string;
    private apiBaseUrl: string;

    constructor(
        projectId: string,
        chunkingConfig?: ChunkingConfig,
        apiBaseUrl: string = 'http://localhost:3001/api'
    ) {
        this.projectId = projectId;
        this.chunkingConfig = chunkingConfig || DEFAULT_CHUNKING_CONFIG;
        this.apiBaseUrl = apiBaseUrl;
    }

    private chunkDocument(content: string): string[] {
        debugLogger.debug('Starting document chunking', { 
            component: 'RAG', 
            operation: 'chunkDocument',
            projectId: this.projectId 
        }, {
            contentLength: content.length,
            chunkingConfig: this.chunkingConfig
        });

        const { maxChunkSize, overlapSize, minChunkSize } = this.chunkingConfig;
        const chunks: string[] = [];

        // Split by sentences first to avoid breaking mid-sentence
        const sentences = content.match(/[^.!?]+[.!?]+/g) || [content];
        debugLogger.debug('Document sentences extracted', { 
            component: 'RAG', 
            operation: 'chunkDocument',
            projectId: this.projectId 
        }, { sentenceCount: sentences.length });

        let currentChunk = '';
        let overlap = '';
        for (const sentence of sentences) {
            const trimmedSentence = sentence.trim();

            if (currentChunk.length + trimmedSentence.length <= maxChunkSize) {
                currentChunk += (currentChunk ? ' ' : '') + trimmedSentence;
            } else {
                if (currentChunk.length >= minChunkSize) {
                    chunks.push(currentChunk);

                    // Create overlap from the end of current chunk
                    const words = currentChunk.split(' ');
                    const overlapWords = Math.floor(overlapSize / 10); // Approximate words for overlap
                    overlap = words.slice(-overlapWords).join(' ');

                    currentChunk = overlap + ' ' + trimmedSentence;
                } else {
                    currentChunk += ' ' + trimmedSentence;
                }
            }
        }

        // Add the last chunk if it meets minimum size
        if (currentChunk.length >= minChunkSize) {
            chunks.push(currentChunk);
        } else if (chunks.length > 0 && currentChunk.length > 0) {
            // Append to last chunk if too small
            chunks[chunks.length - 1] += ' ' + currentChunk;
        }

        debugLogger.info('Document chunking completed', { 
            component: 'RAG', 
            operation: 'chunkDocument',
            projectId: this.projectId 
        }, {
            totalChunks: chunks.length,
            chunkSizes: chunks.map(chunk => chunk.length)
        });

        return chunks;
    }

    async indexAnswer(doc: Document, questionMetadata?: Record<string, unknown>): Promise<void> {
        logRAGOperation('indexAnswer_start', this.projectId, {
            documentId: doc.id,
            contentLength: doc.rawText.length,
            questionMetadata
        });

        try {
            // Chunk the document content
            const chunks = this.chunkDocument(doc.rawText);

            // Create DocumentChunk objects
            const chunkObjects: DocumentChunk[] = chunks.map((content, index) => ({
                id: `${doc.id}_chunk_${index}`,
                content,
                chunkIndex: index,
                totalChunks: chunks.length,
                documentId: doc.id,
                metadata: {
                    createdAt: new Date(),
                    category: undefined,
                }
            }));

            debugLogger.debug('Preparing to send chunks to backend', { 
                component: 'RAG', 
                operation: 'indexAnswer',
                projectId: this.projectId,
                documentId: doc.id
            }, {
                chunkCount: chunkObjects.length,
                apiBaseUrl: this.apiBaseUrl
            });

            const response = await fetch(`${this.apiBaseUrl}/index`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    projectId: this.projectId,
                    chunks: chunkObjects,
                    metadata: questionMetadata
                })
            });

            debugLogger.debug('Backend response received', { 
                component: 'RAG', 
                operation: 'indexAnswer',
                projectId: this.projectId,
                documentId: doc.id
            }, {
                status: response.status,
                statusText: response.statusText,
                ok: response.ok
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                logError('RAG', 'indexAnswer', errorData, {
                    component: 'RAG',
                    operation: 'indexAnswer',
                    projectId: this.projectId,
                    documentId: doc.id
                });
                throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            if (!result.success) {
                logError('RAG', 'indexAnswer', result.error, {
                    component: 'RAG',
                    operation: 'indexAnswer',
                    projectId: this.projectId,
                    documentId: doc.id
                });
                throw new Error(result.error || 'Failed to index document');
            }

            logRAGOperation('indexAnswer_success', this.projectId, {
                documentId: doc.id,
                chunkCount: chunkObjects.length,
                result: result.data
            });
        } catch (error) {
            logError('RAG', 'indexAnswer', error, {
                component: 'RAG',
                operation: 'indexAnswer',
                projectId: this.projectId,
                documentId: doc.id
            });
            throw new Error(`Failed to index answer: ${error instanceof Error ? error.message : error}`);
        }
    }

    async search(query: string, limit: number = 5): Promise<SearchResult[]> {
        logRAGOperation('search_start', this.projectId, {
            query,
            limit,
            apiBaseUrl: this.apiBaseUrl
        });

        try {
            const response = await fetch(`${this.apiBaseUrl}/search`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    projectId: this.projectId,
                    query,
                    limit
                })
            });

            debugLogger.debug('Search response received', { 
                component: 'RAG', 
                operation: 'search',
                projectId: this.projectId
            }, {
                status: response.status,
                statusText: response.statusText,
                ok: response.ok
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                logError('RAG', 'search', errorData, {
                    component: 'RAG',
                    operation: 'search',
                    projectId: this.projectId
                });
                throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            if (!result.success) {
                logError('RAG', 'search', result.error, {
                    component: 'RAG',
                    operation: 'search',
                    projectId: this.projectId
                });
                throw new Error(result.error || 'Failed to search documents');
            }

            const searchResults = result.data.results || [];
            logRAGOperation('search_success', this.projectId, {
                query,
                resultCount: searchResults.length,
                results: searchResults.map(r => ({
                    chunkId: r.chunk?.id,
                    documentId: r.chunk?.documentId,
                    score: r.score,
                    contentPreview: r.chunk?.content?.substring(0, 100) + '...'
                }))
            });

            return searchResults;
        } catch (error) {
            logError('RAG', 'search', error, {
                component: 'RAG',
                operation: 'search',
                projectId: this.projectId
            });
            throw new Error(`Failed to search: ${error instanceof Error ? error.message : error}`);
        }
    }

    // Check if server is available
    async checkServerHealth(): Promise<boolean> {
        debugLogger.debug('Checking server health', { 
            component: 'RAG', 
            operation: 'checkServerHealth',
            projectId: this.projectId
        }, { apiBaseUrl: this.apiBaseUrl });

        try {
            const response = await fetch(`${this.apiBaseUrl}/health`);
            const isHealthy = response.ok;
            
            debugLogger.info('Server health check completed', { 
                component: 'RAG', 
                operation: 'checkServerHealth',
                projectId: this.projectId
            }, { 
                isHealthy,
                status: response.status,
                statusText: response.statusText
            });
            
            return isHealthy;
        } catch (error) {
            logError('RAG', 'checkServerHealth', error, {
                component: 'RAG',
                operation: 'checkServerHealth',
                projectId: this.projectId
            });
            return false;
        }
    }

    // TODO: Implement a delete of documents.
}

// Simple connect function that returns a ProjectRag instance
export async function connect(projectId: string, apiBaseUrl?: string): Promise<ProjectRag> {
    const chunkingConfig: ChunkingConfig = {
        maxChunkSize: 300,
        overlapSize: 20,
        minChunkSize: 50,
    };

    return new ProjectRag(projectId, chunkingConfig, apiBaseUrl);
}

