# Question Service

A comprehensive service for managing questions with hierarchical structure, filtering, and statistics.

## Features

- **CRUD Operations**: Create, read, update, and delete questions
- **Hierarchical Structure**: Support for parent-child relationships between questions
- **Advanced Filtering**: Filter by project, category, stakeholder, search terms, etc.
- **Statistics**: Get detailed statistics about questions
- **Validation**: Built-in validation for question data
- **Type Safety**: Full TypeScript support

## Usage

### Basic Usage with React Hook

```typescript
import { useQuestionService } from '@/hooks/useQuestionService';

function MyComponent() {
  const {
    questions,
    createQuestion,
    getQuestions,
    getQuestionStats,
    loading,
    error
  } = useQuestionService();

  // Create a new question
  const handleCreate = async () => {
    try {
      await createQuestion({
        content: "What are the main risks?",
        category: QuestionCategory.RISK_MANAGEMENT,
        stakeholder: Stakeholder.EXECUTIVE,
        userId: "user-123",
        projectId: "project-456"
      });
    } catch (error) {
      console.error("Failed to create question:", error);
    }
  };

  // Get filtered questions
  const filteredQuestions = getQuestions({
    projectId: "project-456",
    category: QuestionCategory.RISK_MANAGEMENT,
    searchTerm: "risk"
  });

  // Get statistics
  const stats = getQuestionStats("project-456");
  console.log(`Total questions: ${stats.total}`);
  console.log(`Root questions: ${stats.rootQuestions}`);
  console.log(`Sub-questions: ${stats.subQuestions}`);
}
```

### Direct Service Usage

```typescript
import { questionService } from '@/lib/services/questionService';

// Get all questions
const allQuestions = questionService.getAllQuestions();

// Get questions with filters
const filteredQuestions = questionService.getQuestions({
  projectId: "project-123",
  category: QuestionCategory.SUSTAINABILITY,
  stakeholder: Stakeholder.LEGAL,
  searchTerm: "environmental"
});

// Get root questions only
const rootQuestions = questionService.getRootQuestions("project-123");

// Get sub-questions of a specific parent
const subQuestions = questionService.getSubQuestions("parent-question-id");

// Get question hierarchy (root + all sub-questions)
const hierarchy = questionService.getQuestionHierarchy("root-question-id");

// Get statistics
const stats = questionService.getQuestionStats("project-123");
```

## API Reference

### QuestionService Methods

#### Data Retrieval
- `getAllQuestions()`: Get all questions
- `getQuestions(filters)`: Get questions with filters
- `getQuestionById(id)`: Get specific question by ID
- `getRootQuestions(projectId?)`: Get root questions (no parent)
- `getSubQuestions(parentId)`: Get sub-questions of a parent
- `getQuestionHierarchy(rootId)`: Get complete hierarchy from root
- `getQuestionsByProject(projectId)`: Get all questions for a project
- `getQuestionsByUser(userId)`: Get all questions by a user
- `getQuestionsByCategory(category, projectId?)`: Get questions by category
- `getQuestionsByStakeholder(stakeholder, projectId?)`: Get questions by stakeholder
- `searchQuestions(searchTerm, projectId?)`: Search questions by content

#### Statistics
- `getQuestionStats(projectId?)`: Get comprehensive statistics

#### Validation
- `validateQuestion(data)`: Validate question data
- `canDeleteQuestion(id)`: Check if question can be deleted

#### Utilities
- `getQuestionPath(id)`: Get breadcrumb path from root to question

### Filter Options

```typescript
interface QuestionFilters {
  projectId?: string;
  category?: QuestionCategory;
  stakeholder?: Stakeholder;
  parentQuestionId?: string | null; // null for root questions only
  searchTerm?: string;
}
```

### Statistics Object

```typescript
interface QuestionStats {
  total: number;
  byCategory: Record<QuestionCategory, number>;
  byStakeholder: Record<Stakeholder, number>;
  rootQuestions: number;
  subQuestions: number;
}
```

## Examples

### Creating a Question with Parent

```typescript
await createQuestion({
  content: "What are the specific environmental regulations?",
  category: QuestionCategory.SUSTAINABILITY,
  stakeholder: Stakeholder.LEGAL,
  parentQuestionId: "parent-question-id",
  rootQuestionId: "root-question-id",
  userId: "user-123",
  projectId: "project-456"
});
```

### Getting Questions for Dashboard

```typescript
// Get recent questions for current project
const recentQuestions = getQuestions({
  projectId: activeProject.id,
  // Add date filtering if needed
});

// Get questions by category for charts
const riskQuestions = getQuestionsByCategory(QuestionCategory.RISK_MANAGEMENT, activeProject.id);
const legalQuestions = getQuestionsByCategory(QuestionCategory.CORPORATE_LEGAL, activeProject.id);
```

### Building Question Tree

```typescript
// Get all root questions
const rootQuestions = getRootQuestions(projectId);

// For each root question, get its hierarchy
const questionTrees = rootQuestions.map(root => ({
  root,
  hierarchy: getQuestionHierarchy(root.id)
}));
```
