import { Document } from "./types";

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
        const { maxChunkSize, overlapSize, minChunkSize } = this.chunkingConfig;
        const chunks: string[] = [];

        // Split by sentences first to avoid breaking mid-sentence
        const sentences = content.match(/[^.!?]+[.!?]+/g) || [content];

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

        return chunks;
    }

    async indexAnswer(doc: Document, questionMetadata?: any): Promise<void> {
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
            console.error('Error indexing answer chunks:', error);
            throw new Error(`Failed to index answer: ${error instanceof Error ? error.message : error}`);
        }
    }

    async search(query: string, limit: number = 5): Promise<SearchResult[]> {
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
            console.error('Error searching chunks:', error);
            throw new Error(`Failed to search: ${error instanceof Error ? error.message : error}`);
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

