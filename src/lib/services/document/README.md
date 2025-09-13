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
- **Document Management**: View, delete, and organize documents
- **Project Association**: Documents are linked to specific projects and users

## Data Model

```typescript
interface QuestionDocument {
  id: string;
  fileName: string;
  documentType: string; // pdf, word, etc.
  content: ArrayBuffer; // byte data
  rawText: string;
  userId: string;
  projectId: string;
  createdAt: Date;
  updatedAt: Date;
}
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

## Future Enhancements

- ✅ Implement proper text extraction for .docx files
- ⚠️ Implement proper text extraction for PDF files (pdf-parse)
- ⚠️ Implement proper text extraction for .doc files
- Add document search functionality
- Support for more file types
- Document versioning
- Cloud storage integration
