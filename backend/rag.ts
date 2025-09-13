import weaviate, { WeaviateClient, ApiKey } from "weaviate-client";

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

export interface SearchResult {
    chunk: DocumentChunk;
    score: number;
    highlights?: string[];
}

export class ProjectRag {
    private collectionName: string;
    constructor(
        private client: WeaviateClient,
        projectId: string,
    ) {
        this.collectionName = toCollectionName(projectId, ANSWER_DOC_COLLECTION_SUFFIX);
    }

    async indexAnswer(chunkObjects: DocumentChunk[]): Promise<void> {
        try {
            const collection = this.client.collections.get(this.collectionName);

            // Batch insert chunks
            const dataToInsert = chunkObjects.map(chunk => ({
                properties: {
                    chunkId: chunk.id,
                    content: chunk.content,
                    chunkIndex: chunk.chunkIndex,
                    totalChunks: chunk.totalChunks,
                    //createdAt: chunk.metadata?.createdAt?.toISOString(),
                    //category: chunk.metadata?.category,
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
                        //createdAt: obj.properties.createdAt ? new Date(obj.properties.createdAt as string) : undefined,
                        //category: obj.properties.category as string,
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
        const openaiApiKey = process.env.VITE_OPENAI_API_KEY as string;
        const weaviateApiKey = process.env.VITE_WEAVIATE_API_KEY as string;
        const weaviateUrl = process.env.VITE_WEAVIATE_URL as string;

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
        return new ProjectRag(client, projectId);
    } catch (error) {
        console.error('Error connecting to Weaviate:', error);
        throw new Error(`Failed to connect to Weaviate: ${error}`);
    }
}
