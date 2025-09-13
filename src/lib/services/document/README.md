# Document Service

This service handles the upload, storage, and management of documents that can be used to generate questions.

## Features

- **Document Upload**: Support for multiple file types (PDF, Word, Text, etc.)
- **Local Storage**: Documents are stored in browser's localStorage
- **Text Extraction**: 
  - ✅ **.docx files**: Full text extraction using mammoth library
  - ✅ **.txt files**: Direct text reading
  - ⚠️ **.pdf files**: Placeholder (requires pdf-parse library)
  - ⚠️ **.doc files**: Placeholder (requires different library)
  - ⚠️ **.rtf files**: Placeholder
- **Formatted View**: .docx files can be viewed with preserved formatting (HTML)
- **AI Processing**: Extract questions from documents using OpenAI GPT-4
- **Processing Status**: Track document processing with status indicators
- **Question Integration**: Automatically add parsed questions to project
- **Document Management**: View, delete, and organize documents
- **Project Association**: Documents are linked to specific projects and users

## Data Model

```typescript
type ProcessingStatus = 'not_started' | 'processing' | 'completed' | 'failed';

interface Document {
  id: string;
  fileName: string;
  documentType: string; // pdf, word, etc.
  content: string; // base64 encoded byte data for localStorage compatibility
  rawText: string;
  userId: string;
  projectId: string;
  processingStatus: ProcessingStatus;
  processingError?: string; // Error message if processing failed
  createdAt: Date;
  updatedAt: Date;
}

// Legacy alias for backward compatibility
type QuestionDocument = Document;
```

## Usage

```typescript
import { useDocumentService } from '@/hooks/useDocumentService';

const {
  documents,
  loading,
  error,
  loadDocuments,
  uploadDocument,
  deleteDocument,
  getDocumentStats
} = useDocumentService();
```

## Components

- **DocumentUpload**: Drag-and-drop file upload component
- **DocumentList**: List and manage uploaded documents
- **DocumentViewer**: Modal for viewing document content and metadata

## Usage Examples

### Upload and Extract Text from .docx
```typescript
const result = await documentService.uploadDocument(file, userId, projectId);
if (result.success) {
  console.log('Extracted text:', result.data.rawText);
}
```

### View Formatted .docx Content
```typescript
const htmlContent = await documentService.extractHtmlFromDocx(document.content);
// Display HTML with preserved formatting
```

### Process Document to Extract Questions
```typescript
const result = await documentService.processDocument(documentId);
if (result.success && result.questions) {
  // Add questions to project
  for (const question of result.questions) {
    await questionService.createQuestion({
      content: question.content,
      category: question.category,
      stakeholder: question.stakeholder,
      userId,
      projectId,
    });
  }
}
```

## Future Enhancements

- ✅ Implement proper text extraction for .docx files
- ✅ Implement AI-powered question extraction using OpenAI
- ✅ Implement processing status tracking
- ⚠️ Implement proper text extraction for PDF files (pdf-parse)
- ⚠️ Implement proper text extraction for .doc files
- Add document search functionality
- Support for more file types
- Document versioning
- Cloud storage integration
- Batch processing of multiple documents
- Custom question extraction prompts
