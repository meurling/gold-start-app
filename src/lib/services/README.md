# Weaviate Vector Database Service

This directory contains the Weaviate vector database integration for the application, providing semantic search capabilities for questions, answers, and projects.

## Files

- `weaviateTypes.ts` - TypeScript interfaces and types for Weaviate operations
- `weaviateService.ts` - Main service class for Weaviate operations
- `weaviateConfig.ts` - Configuration settings for Weaviate connection
- `useWeaviate.ts` - React hook for using Weaviate service in components

## Setup

### 1. Environment Variables

Create a `.env` file in your project root with the following variables:

```env
# Weaviate Configuration
VITE_WEAVIATE_URL=yarqfmhuskukffrbfy3sw.c0.europe-west3.gcp.weaviate.cloud
VITE_WEAVIATE_API_KEY=your_weaviate_api_key_here

# OpenAI Configuration (if using OpenAI vectorizer)
VITE_OPENAI_API_KEY=your_openai_api_key_here
```

### 2. Initialize Schemas

Before using the service, you need to initialize the database schemas:

```typescript
import { useWeaviate } from '@/hooks/useWeaviate';

const { initializeSchemas } = useWeaviate();

// Initialize schemas (run once)
await initializeSchemas();
```

## Usage

### Using the Hook

```typescript
import { useWeaviate } from '@/hooks/useWeaviate';

function MyComponent() {
  const {
    isConnected,
    isLoading,
    error,
    searchQuestions,
    createQuestion,
    checkConnection
  } = useWeaviate();

  // Check connection status
  useEffect(() => {
    checkConnection();
  }, []);

  // Search for questions
  const handleSearch = async (query: string) => {
    const results = await searchQuestions(query, 'project-id', 10);
    console.log(results);
  };

  // Create a new question
  const handleCreateQuestion = async (question: Question) => {
    const response = await createQuestion(question);
    if (response.errors) {
      console.error('Failed to create question:', response.errors);
    }
  };

  return (
    <div>
      {isConnected ? 'Connected to Weaviate' : 'Not connected'}
      {error && <div>Error: {error}</div>}
      {isLoading && <div>Loading...</div>}
    </div>
  );
}
```

### Direct Service Usage

```typescript
import { weaviateService } from '@/lib/services/weaviateService';

// Check if service is ready
const isReady = await weaviateService.isReady();

// Search questions
const results = await weaviateService.searchQuestions(
  'sustainability questions',
  'project-id',
  10
);

// Create a question
const response = await weaviateService.createQuestion(question);
```

## Features

### Semantic Search
- Vector-based similarity search for questions, answers, and projects
- Configurable certainty thresholds
- Filtering by project, category, stakeholder, etc.

### CRUD Operations
- Create, read, update, delete operations for all entity types
- Batch operations for efficient bulk inserts
- Consistent error handling and response formatting

### Schema Management
- Automatic schema creation for Questions, Answers, and Projects
- Configurable vectorizers (OpenAI text2vec)
- Optimized indexing for search and filtering

### React Integration
- Custom hook with loading states and error handling
- Automatic connection checking
- Type-safe operations with TypeScript

## Data Models

### Question
- `content`: The question text (vectorized)
- `category`: Question category (filterable)
- `stakeholder`: Target stakeholder (filterable)
- `parentQuestionId`: For hierarchical questions
- `rootQuestionId`: Root question reference
- `userId`: Creator user ID
- `projectId`: Associated project

### Answer
- `questionId`: Associated question ID
- `content`: Answer text (vectorized)
- `authorId`: Answer author
- `isAccepted`: Acceptance status
- `upvotes`/`downvotes`: Voting metrics

### Project
- `name`: Project name (vectorized)
- `description`: Project description (vectorized)
- `isActive`: Active status

## Search Options

The service supports various search methods:

- **Near Text**: Semantic search using text queries
- **Near Vector**: Search using vector embeddings
- **Near Object**: Find similar objects
- **BM25**: Keyword-based search
- **Hybrid**: Combination of vector and keyword search
- **Ask**: Question-answering with context

## Error Handling

All operations return a consistent response format:

```typescript
interface WeaviateResponse<T> {
  data?: T;
  errors?: WeaviateError[];
  meta?: WeaviateMeta;
}
```

Errors are automatically handled by the React hook and displayed to users.

## Performance Considerations

- Use appropriate `limit` parameters for search operations
- Consider using batch operations for bulk inserts
- Monitor connection status and handle reconnection
- Use filtering to reduce search scope when possible

## Troubleshooting

### Connection Issues
1. Verify your Weaviate URL and API key
2. Check network connectivity
3. Ensure Weaviate instance is running

### Schema Issues
1. Run `initializeSchemas()` to create required schemas
2. Check for schema conflicts
3. Verify vectorizer configuration

### Search Issues
1. Ensure data is properly vectorized
2. Check certainty thresholds
3. Verify filter syntax