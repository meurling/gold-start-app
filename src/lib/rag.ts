import weaviate, { WeaviateClient, ApiKey } from "weaviate-client";
import { Document } from "./answer";

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

class ProjectRag {
    private chunkingConfig: ChunkingConfig;
    private collectionName: string;
    constructor(
        private client: WeaviateClient,
        private projectId: string,
        chunkingConfig?: ChunkingConfig
    ) {
        this.chunkingConfig = chunkingConfig || DEFAULT_CHUNKING_CONFIG;
        this.collectionName = toCollectionName(projectId, ANSWER_DOC_COLLECTION_SUFFIX);
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
            const collection = this.client.collections.get(this.collectionName);
            const chunks = this.chunkDocument(doc.bytes); // TODO: Do better document parsing.

            const chunkObjects = chunks.map((chunk, index): DocumentChunk => ({
                id: `${doc.id}_chunk_${index}`,
                content: chunk,
                chunkIndex: index,
                totalChunks: chunks.length,
                documentId: doc.id,
                metadata: {
                    createdAt: doc.createdAt,
                    category: questionMetadata?.category,
                }
            }));

            // Batch insert chunks
            const dataToInsert = chunkObjects.map(chunk => ({
                properties: {
                    chunkId: chunk.id,
                    content: chunk.content,
                    chunkIndex: chunk.chunkIndex,
                    totalChunks: chunk.totalChunks,
                    createdAt: chunk.metadata?.createdAt?.toISOString(),
                    category: chunk.metadata?.category,
                    documentId: chunk.documentId,
                }
            }));

            await collection.data.insertMany(dataToInsert);
        } catch (error) {
            console.error('Error indexing answer chunks:', error);
            throw new Error(`Failed to index answer: ${error}`);
        }
    }

    async search(query: string, limit: number = 5): Promise<SearchResult[]> {
        try {
            const collection = this.client.collections.get(this.collectionName);

            const result = await collection.query.nearText(query, {
                limit,
                returnMetadata: ['score', 'distance'],
            });

            return result.objects.map(obj => ({
                chunk: {
                    id: obj.properties.chunkId as string,
                    content: obj.properties.content as string,
                    questionId: obj.properties.questionId as string,
                    chunkIndex: obj.properties.chunkIndex as number,
                    totalChunks: obj.properties.totalChunks as number,
                    documentId: obj.properties.documentId as string,
                    metadata: {
                        createdAt: obj.properties.createdAt ? new Date(obj.properties.createdAt as string) : undefined,
                        category: obj.properties.category as string,
                    }
                },
                score: obj.metadata?.score || 0,
            }));
        } catch (error) {
            console.error('Error searching chunks:', error);
            throw new Error(`Failed to search: ${error}`);
        }
    }

    // TODO: Implement a delete of documents.
}

function toCollectionName(projectId: string, collection: string): string {
    return `${projectId}_${collection}`.replace(/[^a-zA-Z0-9_]/g, '_');
}

async function maybeCreateCollection(client: WeaviateClient, collectionName: string) {
    try {
        const doesExist = await client.collections.exists(collectionName);
        if (doesExist) {
            return;
        }

        await client.collections.create({
            name: collectionName,
            properties: [
                { name: 'chunkId', dataType: 'text' },
                { name: 'content', dataType: 'text' },
                { name: 'answerId', dataType: 'text' },
                { name: 'questionId', dataType: 'text' },
                { name: 'chunkIndex', dataType: 'int' },
                { name: 'totalChunks', dataType: 'int' },
                { name: 'createdAt', dataType: 'text' },
                { name: 'category', dataType: 'text' },
                { name: 'documentId', dataType: 'text' },
            ],
            //vectorizer: "text2vec-openai",
            //moduleConfig: {
            //    'text2vec-openai': {
            //        model: 'text-embedding-ada-002',
            //        type: 'text',
            //    },
            //},
        });
    } catch (error) {
        console.error('Error creating collection:', error);
        throw new Error(`Failed to create collection: ${error}`);
    }
}

const ANSWER_DOC_COLLECTION_SUFFIX = 'AnswerDoc';

export async function connect(projectId: string): Promise<ProjectRag> {
    try {
        const openaiApiKey = process.env['OPENAI_API_KEY'];
        const weaviateApiKey = process.env['WEAVIATE_API_KEY'];
        const weaviateUrl = process.env['WEAVIATE_URL'];

        let authCredentials = new ApiKey(weaviateApiKey);
        const client = await weaviate.connectToWeaviateCloud(weaviateUrl, {
            authCredentials,
            headers: openaiApiKey ? {
                'X-OpenAI-Api-Key': openaiApiKey,
            } : undefined,
        });

        // Default project ID if not provided
        const collectionName = toCollectionName(projectId, ANSWER_DOC_COLLECTION_SUFFIX);

        await maybeCreateCollection(client, collectionName);

        const chunkingConfig: ChunkingConfig = {
            maxChunkSize: 300,
            overlapSize: 20,
            minChunkSize: 50,
        };
        return new ProjectRag(client, projectId, chunkingConfig);
    } catch (error) {
        console.error('Error connecting to Weaviate:', error);
        throw new Error(`Failed to connect to Weaviate: ${error}`);
    }
}

export { ProjectRag };