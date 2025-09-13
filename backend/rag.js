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
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] WEAVIATE INDEX - Starting indexing for collection: ${this.collectionName}`);
        console.log(`[${timestamp}] WEAVIATE INDEX - Number of chunks to index: ${chunkObjects.length}`);
        
        try {
            const collection = this.client.collections.get(this.collectionName);
            console.log(`[${timestamp}] WEAVIATE INDEX - Retrieved collection: ${this.collectionName}`);

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

            console.log(`[${timestamp}] WEAVIATE INDEX - Prepared ${dataToInsert.length} chunks for insertion`);
            
            chunkObjects.forEach((chunk, index) => {
                console.log(`[${timestamp}] WEAVIATE INDEX - Chunk ${index + 1}: ${chunk.id} (${chunk.documentId}) - Content length: ${chunk.content.length} chars`);
                console.log(`[${timestamp}] WEAVIATE INDEX - Chunk ${index + 1} preview: ${chunk.content.substring(0, 100)}...`);
            });

            console.log(`[${timestamp}] WEAVIATE INDEX - Inserting chunks into Weaviate...`);
            const result = await collection.data.insertMany(dataToInsert);
            
            console.log(`[${timestamp}] WEAVIATE INDEX - Successfully inserted ${chunkObjects.length} chunks into collection: ${this.collectionName}`);
            console.log(`[${timestamp}] WEAVIATE INDEX - Insert result:`, result);
            
        } catch (error) {
            console.error(`[${timestamp}] WEAVIATE INDEX - Error indexing answer chunks:`, error);
            console.error(`[${timestamp}] WEAVIATE INDEX - Collection: ${this.collectionName}`);
            console.error(`[${timestamp}] WEAVIATE INDEX - Chunk count: ${chunkObjects.length}`);
            throw new Error(`Failed to index answer: ${error}`);
        }
    }

    async search(query, limit = 5) {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] WEAVIATE SEARCH - Starting search in collection: ${this.collectionName}`);
        console.log(`[${timestamp}] WEAVIATE SEARCH - Query: "${query}", Limit: ${limit}`);
        
        try {
            const collection = this.client.collections.get(this.collectionName);
            console.log(`[${timestamp}] WEAVIATE SEARCH - Retrieved collection: ${this.collectionName}`);

            console.log(`[${timestamp}] WEAVIATE SEARCH - Executing nearText query...`);
            const result = await collection.query.nearText(query, {
                limit,
                returnMetadata: ['score', 'distance'],
            });
            
            console.log(`[${timestamp}] WEAVIATE SEARCH - Query executed successfully`);
            console.log(`[${timestamp}] WEAVIATE SEARCH - Raw result:`, result);
            console.log(`[${timestamp}] WEAVIATE SEARCH - Number of objects returned: ${result.objects?.length || 0}`);
            
            if (result.objects && result.objects.length > 0) {
                result.objects.forEach((obj, index) => {
                    console.log(`[${timestamp}] WEAVIATE SEARCH - Object ${index + 1}:`, {
                        chunkId: obj.properties?.chunkId,
                        documentId: obj.properties?.documentId,
                        contentLength: obj.properties?.content?.length || 0,
                        score: obj.metadata?.score,
                        distance: obj.metadata?.distance,
                        contentPreview: obj.properties?.content?.substring(0, 100) + '...'
                    });
                });
            } else {
                console.log(`[${timestamp}] WEAVIATE SEARCH - No results found for query: "${query}"`);
            }

            const mappedResults = result.objects.map(obj => ({
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

            console.log(`[${timestamp}] WEAVIATE SEARCH - Mapped ${mappedResults.length} results`);
            console.log(`[${timestamp}] WEAVIATE SEARCH - Top scores: ${mappedResults.slice(0, 3).map(r => r.score).join(', ')}`);

            return mappedResults;
        } catch (error) {
            console.error(`[${timestamp}] WEAVIATE SEARCH - Error searching chunks:`, error);
            console.error(`[${timestamp}] WEAVIATE SEARCH - Collection: ${this.collectionName}`);
            console.error(`[${timestamp}] WEAVIATE SEARCH - Query: "${query}"`);
            throw new Error(`Failed to search: ${error}`);
        }
    }

    // TODO: Implement a delete of documents.
}

function toCollectionName(projectId, collection) {
    return `${collection}_${projectId}`.replace(/[^a-zA-Z0-9_]/g, '_');
}

async function maybeCreateCollection(client, collectionName) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] WEAVIATE COLLECTION - Checking if collection exists: ${collectionName}`);
    
    try {
        const doesExist = await client.collections.exists(collectionName);
        console.log(`[${timestamp}] WEAVIATE COLLECTION - Collection ${collectionName} exists: ${doesExist}`);
        
        if (doesExist) {
            console.log(`[${timestamp}] WEAVIATE COLLECTION - Using existing collection: ${collectionName}`);
            return;
        }

        console.log(`[${timestamp}] WEAVIATE COLLECTION - Creating new collection: ${collectionName}`);
        const collectionConfig = {
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
        };
        
        console.log(`[${timestamp}] WEAVIATE COLLECTION - Collection config:`, collectionConfig);
        
        await client.collections.create(collectionConfig);
        console.log(`[${timestamp}] WEAVIATE COLLECTION - Successfully created collection: ${collectionName}`);
        
    } catch (error) {
        console.error(`[${timestamp}] WEAVIATE COLLECTION - Error creating collection:`, error);
        console.error(`[${timestamp}] WEAVIATE COLLECTION - Collection name: ${collectionName}`);
        throw new Error(`Failed to create collection: ${error}`);
    }
}

const ANSWER_DOC_COLLECTION_SUFFIX = 'AnswerDoc';

export async function connect(projectId) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] WEAVIATE CONNECT - Starting connection for project: ${projectId}`);
    
    try {
        const openaiApiKey = process.env.VITE_OPENAI_API_KEY;
        const weaviateApiKey = process.env.VITE_WEAVIATE_API_KEY;
        const weaviateUrl = process.env.VITE_WEAVIATE_URL;

        console.log(`[${timestamp}] WEAVIATE CONNECT - Environment variables:`);
        console.log(`[${timestamp}] WEAVIATE CONNECT - OpenAI API Key: ${openaiApiKey ? 'SET' : 'NOT SET'}`);
        console.log(`[${timestamp}] WEAVIATE CONNECT - Weaviate API Key: ${weaviateApiKey ? 'SET' : 'NOT SET'}`);
        console.log(`[${timestamp}] WEAVIATE CONNECT - Weaviate URL: ${weaviateUrl || 'NOT SET'}`);

        let authCredentials = new ApiKey(weaviateApiKey);
        console.log(`[${timestamp}] WEAVIATE CONNECT - Connecting to Weaviate Cloud...`);
        
        const client = await weaviate.connectToWeaviateCloud(weaviateUrl, {
            authCredentials,
            headers: openaiApiKey ? {
                'X-OpenAI-Api-Key': openaiApiKey,
            } : undefined,
        });

        console.log(`[${timestamp}] WEAVIATE CONNECT - Successfully connected to Weaviate Cloud`);

        // Default project ID if not provided
        const collectionName = toCollectionName(projectId, ANSWER_DOC_COLLECTION_SUFFIX);
        console.log(`[${timestamp}] WEAVIATE CONNECT - Collection name: ${collectionName}`);

        await maybeCreateCollection(client, collectionName);
        
        const rag = new ProjectRag(client, projectId);
        console.log(`[${timestamp}] WEAVIATE CONNECT - Successfully created ProjectRag instance for project: ${projectId}`);
        
        return rag;
    } catch (error) {
        console.error(`[${timestamp}] WEAVIATE CONNECT - Error connecting to Weaviate:`, error);
        console.error(`[${timestamp}] WEAVIATE CONNECT - Project ID: ${projectId}`);
        throw new Error(`Failed to connect to Weaviate: ${error}`);
    }
}
