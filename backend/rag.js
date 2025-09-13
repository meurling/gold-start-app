import weaviate, { ApiKey, vectors, configure } from "weaviate-client";

/*
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
*/

export class ProjectRag {
    constructor(
        client,
        projectId,
    ) {
        this.client = client;
        this.collectionName = toCollectionName(projectId, ANSWER_DOC_COLLECTION_SUFFIX);
    }

    async indexAnswer(chunkObjects) {
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

            chunkObjects.forEach((chunk) => {
                console.log('Ingest chunk: ' + chunk.id +' : (' + chunk.documentId +') : ' + chunk.content);
            });

            await collection.data.insertMany(dataToInsert);
        } catch (error) {
            console.error('Error indexing answer chunks:', error);
            throw new Error(`Failed to index answer: ${error}`);
        }
    }

    async search(query, limit = 5) {
        try {
            const collection = this.client.collections.get(this.collectionName);

            const result = await collection.query.nearText(query, {
                limit,
                returnMetadata: ['score', 'distance'],
            });
            console.log('Result: ', result);
            result.objects.forEach((obj) => {
                console.log('Object: ', obj);
            });

            return result.objects.map(obj => ({
                chunk: {
                    id: obj.properties.chunkId,
                    content: obj.properties.content,
                    questionId: obj.properties.questionId,
                    chunkIndex: obj.properties.chunkIndex,
                    totalChunks: obj.properties.totalChunks,
                    documentId: obj.properties.documentId,
                    metadata: {
                        //createdAt: obj.properties.createdAt ? new Date(obj.properties.createdAt as string) : undefined,
                        //category: obj.properties.category as string,
                    }
                },
                score: obj.metadata?.score || obj.metadata?.distance || 0,
            }));
        } catch (error) {
            console.error('Error searching chunks:', error);
            throw new Error(`Failed to search: ${error}`);
        }
    }

    // TODO: Implement a delete of documents.
}

function toCollectionName(projectId, collection) {
    return `${collection}_${projectId}`.replace(/[^a-zA-Z0-9_]/g, '_');
}

async function maybeCreateCollection(client, collectionName) {
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
            vectorizers: vectors.text2VecOpenAI(),
            generative: configure.generative.openAI(),
        });
    } catch (error) {
        console.error('Error creating collection:', error);
        throw new Error(`Failed to create collection: ${error}`);
    }
}

const ANSWER_DOC_COLLECTION_SUFFIX = 'AnswerDoc';

export async function connect(projectId) {
    try {
        const openaiApiKey = process.env.VITE_OPENAI_API_KEY;
        const weaviateApiKey = process.env.VITE_WEAVIATE_API_KEY;
        const weaviateUrl = process.env.VITE_WEAVIATE_URL;

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
