import express from 'express';
import cors from 'cors';
import { connect, ProjectRag, DocumentChunk } from './rag.js';

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Store active connections per project
const projectConnections = new Map<string, ProjectRag>();

// Helper function to get or create project RAG connection
async function getProjectRag(projectId: string): Promise<ProjectRag> {
  if (!projectConnections.has(projectId)) {
    const rag = await connect(projectId);
    projectConnections.set(projectId, rag);
  }
  return projectConnections.get(projectId)!;
}

// Index endpoint - for indexing documents
app.post('/api/index', async (req, res) => {
  try {
    const { projectId, chunks } = req.body;
    const documentChunks = chunks as DocumentChunk[];

    if (!projectId) {
      return res.status(400).json({
        success: false,
        error: 'Project ID is required'
      });
    }

    if (!chunks) {
      return res.status(400).json({
        success: false,
        error: 'Document with id and rawText is required'
      });
    }

    // Get project RAG connection
    const rag = await getProjectRag(projectId);

    // Index the chunks
    await rag.indexAnswer(documentChunks);

    res.json({
      success: true,
      data: {
        chunksCreated: documentChunks.length,
        message: 'Document indexed successfully'
      }
    });

  } catch (error) {
    console.error('Error indexing document:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to index document'
    });
  }
});

// Search endpoint - for searching indexed documents
app.post('/api/search', async (req, res) => {
  try {
    const { projectId, query, limit = 5 } = req.body;

    if (!projectId) {
      return res.status(400).json({
        success: false,
        error: 'Project ID is required'
      });
    }

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }

    // Get project RAG connection
    const rag = await getProjectRag(projectId);

    // Perform search
    const results = await rag.search(query, limit);

    res.json({
      success: true,
      data: {
        query,
        results,
        totalResults: results.length
      }
    });

  } catch (error) {
    console.error('Error searching documents:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to search documents'
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    activeProjects: Array.from(projectConnections.keys())
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'DAIRO Backend Server',
    version: '1.0.0',
    endpoints: {
      'POST /api/index': 'Index documents for a project',
      'POST /api/search': 'Search indexed documents',
      'GET /api/health': 'Health check'
    }
  });
});

// Simple chunking function (can be improved)
function chunkDocument(content: string, maxChunkSize: number = 500, overlapSize: number = 50): string[] {
  const chunks: string[] = [];
  const sentences = content.match(/[^.!?]+[.!?]+/g) || [content];

  let currentChunk = '';
  let overlap = '';

  for (const sentence of sentences) {
    const trimmedSentence = sentence.trim();

    if (currentChunk.length + trimmedSentence.length <= maxChunkSize) {
      currentChunk += (currentChunk ? ' ' : '') + trimmedSentence;
    } else {
      if (currentChunk.length >= 100) { // minimum chunk size
        chunks.push(currentChunk);

        // Create overlap from the end of current chunk
        const words = currentChunk.split(' ');
        const overlapWords = Math.floor(overlapSize / 10);
        overlap = words.slice(-overlapWords).join(' ');

        currentChunk = overlap + ' ' + trimmedSentence;
      } else {
        currentChunk += ' ' + trimmedSentence;
      }
    }
  }

  // Add the last chunk if it's substantial
  if (currentChunk.length >= 50) {
    chunks.push(currentChunk);
  } else if (chunks.length > 0 && currentChunk.length > 0) {
    // Append to last chunk if too small
    chunks[chunks.length - 1] += ' ' + currentChunk;
  }

  return chunks.length > 0 ? chunks : [content]; // Fallback to original content
}

app.listen(port, () => {
  console.log(`=� DAIRO Backend server running on port ${port}`);
  console.log(`=� Available endpoints:`);
  console.log(`   GET  /           - API information`);
  console.log(`   POST /api/index  - Index documents`);
  console.log(`   POST /api/search - Search documents`);
  console.log(`   GET  /api/health - Health check`);
});

export default app;