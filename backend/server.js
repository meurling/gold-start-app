import express from 'express';
import cors from 'cors';
import { connect } from './rag.js';

// Enhanced logging utility for backend
const logRequest = (req, res, next) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.url;
  const body = req.body ? JSON.stringify(req.body).substring(0, 200) + '...' : 'No body';
  
  console.log(`[${timestamp}] ${method} ${url} - Body: ${body}`);
  next();
};

const logResponse = (req, res, next) => {
  const originalSend = res.send;
  res.send = function(data) {
    const timestamp = new Date().toISOString();
    const method = req.method;
    const url = req.url;
    const status = res.statusCode;
    const responseData = data ? JSON.stringify(data).substring(0, 200) + '...' : 'No data';
    
    console.log(`[${timestamp}] ${method} ${url} - Status: ${status} - Response: ${responseData}`);
    originalSend.call(this, data);
  };
  next();
};

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(logRequest);
app.use(logResponse);

// Store active connections per project
const projectConnections = new Map();

// Helper function to get or create project RAG connection
async function getProjectRag(projectId) {
  console.log(`[${new Date().toISOString()}] Getting RAG connection for project: ${projectId}`);
  
  if (!projectConnections.has(projectId)) {
    console.log(`[${new Date().toISOString()}] Creating new RAG connection for project: ${projectId}`);
    try {
      const rag = await connect(projectId);
      projectConnections.set(projectId, rag);
      console.log(`[${new Date().toISOString()}] Successfully created RAG connection for project: ${projectId}`);
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Failed to create RAG connection for project ${projectId}:`, error);
      throw error;
    }
  } else {
    console.log(`[${new Date().toISOString()}] Using existing RAG connection for project: ${projectId}`);
  }

  return projectConnections.get(projectId);
}

// Index endpoint - for indexing documents
app.post('/api/index', async (req, res) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] INDEX REQUEST - Starting document indexing`);
  
  try {
    const { projectId, chunks } = req.body;
    const documentChunks = chunks;

    console.log(`[${timestamp}] INDEX REQUEST - Project ID: ${projectId}, Chunks: ${chunks?.length || 0}`);

    if (!projectId) {
      console.log(`[${timestamp}] INDEX REQUEST - Error: Project ID is required`);
      return res.status(400).json({
        success: false,
        error: 'Project ID is required'
      });
    }

    if (!chunks) {
      console.log(`[${timestamp}] INDEX REQUEST - Error: Document chunks are required`);
      return res.status(400).json({
        success: false,
        error: 'Document chunks are required'
      });
    }

    // Get project RAG connection
    console.log(`[${timestamp}] INDEX REQUEST - Getting RAG connection for project: ${projectId}`);
    const rag = await getProjectRag(projectId);

    // Index the chunks
    console.log(`[${timestamp}] INDEX REQUEST - Indexing ${documentChunks.length} chunks`);
    await rag.indexAnswer(documentChunks);

    console.log(`[${timestamp}] INDEX REQUEST - Successfully indexed ${documentChunks.length} chunks for project: ${projectId}`);

    res.json({
      success: true,
      data: {
        chunksCreated: documentChunks.length,
        message: 'Document indexed successfully'
      }
    });

  } catch (error) {
    console.error(`[${timestamp}] INDEX REQUEST - Error indexing document:`, error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to index document'
    });
  }
});

// Search endpoint - for searching indexed documents
app.post('/api/search', async (req, res) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] SEARCH REQUEST - Starting document search`);
  
  try {
    const { projectId, query, limit = 5 } = req.body;

    console.log(`[${timestamp}] SEARCH REQUEST - Project ID: ${projectId}, Query: "${query}", Limit: ${limit}`);

    if (!projectId) {
      console.log(`[${timestamp}] SEARCH REQUEST - Error: Project ID is required`);
      return res.status(400).json({
        success: false,
        error: 'Project ID is required'
      });
    }

    if (!query) {
      console.log(`[${timestamp}] SEARCH REQUEST - Error: Search query is required`);
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }

    // Get project RAG connection
    console.log(`[${timestamp}] SEARCH REQUEST - Getting RAG connection for project: ${projectId}`);
    const rag = await getProjectRag(projectId);

    // Perform search
    console.log(`[${timestamp}] SEARCH REQUEST - Performing search with query: "${query}"`);
    const results = await rag.search(query, limit);

    console.log(`[${timestamp}] SEARCH REQUEST - Search completed. Found ${results.length} results for project: ${projectId}`);
    if (results.length > 0) {
      console.log(`[${timestamp}] SEARCH REQUEST - Top result scores: ${results.slice(0, 3).map(r => r.score).join(', ')}`);
    }

    res.json({
      success: true,
      data: {
        query,
        results,
        totalResults: results.length
      }
    });

  } catch (error) {
    console.error(`[${timestamp}] SEARCH REQUEST - Error searching documents:`, error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to search documents'
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  const timestamp = new Date().toISOString();
  const activeProjects = Array.from(projectConnections.keys());
  
  console.log(`[${timestamp}] HEALTH CHECK - Active projects: ${activeProjects.length} (${activeProjects.join(', ')})`);
  
  res.json({
    success: true,
    status: 'healthy',
    timestamp,
    activeProjects
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

app.listen(port, () => {
  console.log(`=� DAIRO Backend server running on port ${port}`);
  console.log(`=� Available endpoints:`);
  console.log(`   GET  /           - API information`);
  console.log(`   POST /api/index  - Index documents`);
  console.log(`   POST /api/search - Search documents`);
  console.log(`   GET  /api/health - Health check`);
});

export default app;