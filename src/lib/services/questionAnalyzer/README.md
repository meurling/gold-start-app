# Question Analyzer Service

This service is responsible for analyzing questions to determine if they have answers in the uploaded documents.

## Features

- **Single Question Analysis**: Analyze individual questions to find answers
- **Bulk Analysis**: Analyze multiple questions at once
- **Answer Detection**: Uses OpenAI to determine if document chunks contain answers
- **Answer Extraction**: Extracts relevant content that answers the question

## Data Model

### QuestionAnswer
```typescript
interface QuestionAnswer {
  id: string;
  questionId: string;
  content: string;
  documentId: string;
  createdAt: Date;
  updatedAt: Date;
}
```

## Usage

### Hook Usage
```typescript
import { useQuestionAnalyzer } from '@/hooks/useQuestionAnalyzer';

const {
  analyzing,
  analyzeQuestion,
  analyzeQuestions,
  isQuestionAnswered,
  getQuestionAnswers
} = useQuestionAnalyzer();

// Analyze a single question
const result = await analyzeQuestion(question, projectId);

// Analyze multiple questions
const bulkResult = await analyzeQuestions(questions, projectId);

// Check if a question is answered
const hasAnswers = isQuestionAnswered(questionId);

// Get answers for a question
const answers = getQuestionAnswers(questionId);
```

### Service Usage
```typescript
import { QuestionAnalyzerService } from '@/lib/services/questionAnalyzer';

const analyzer = new QuestionAnalyzerService();

// Analyze a question
const result = await analyzer.analyzeQuestion(question, projectId);
```

## How It Works

1. **Document Search**: Uses the AnswerService to search for relevant documents using the question content
2. **AI Analysis**: Uses OpenAI to analyze the search results and determine if they contain answers
3. **Answer Extraction**: Extracts the specific content that answers the question
4. **Result Storage**: Stores the analysis results in memory for quick access

## Integration

The service integrates with:
- **AnswerService**: For document search functionality
- **OpenAI Service**: For AI-powered answer detection
- **Question Service**: For question data access

## UI Components

The service is integrated into:
- **Questions Page**: Shows answered/unanswered tabs and analyze buttons
- **QuestionList Component**: Displays answer status and individual analyze buttons
- **Statistics**: Shows counts of answered vs unanswered questions
