# DAIRO - Intelligent Document Analysis & Compliance Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)

## 🤝 Technology Partners

This project is built in collaboration with our key technology partners:

- **[OpenAI](https://openai.com/)** - Advanced AI language models for document analysis and compliance assessment
- **[Weaviate](https://weaviate.io/)** - Vector database for semantic search and document similarity matching
- **[Lovable](https://lovable.dev/)** - AI-powered development platform for rapid application development

---

DAIRO is an advanced document analysis and compliance platform that leverages AI to automatically analyze documents, extract questions, and determine compliance status. Built with modern web technologies, it provides organizations with intelligent insights into their document-based processes and regulatory compliance.

## 🎯 How to Use the App

### Due Diligence Q&A Workflow

Follow this step-by-step guide to perform a comprehensive due diligence Q&A analysis:

#### 1. **Create User Account**
- Launch the application and create a user account
- Enter your name and any relevant details
- This will be used to track your questions and analysis

#### 2. **Create a Project**
- Create a new project with a descriptive name (e.g., "Acme Corp Due Diligence")
- This helps organize your questions and documents by engagement

#### 3. **Upload and Parse Questions**
- Navigate to **Questions → Documents** tab
- Upload your questions document (e.g., `Legal Questions.docx` from `/documents/` folder)
- **Important**: Click the **"Process"** button to parse questions from your document
- The system will automatically extract questions and categorize them

#### 4. **Upload Answer Documents**
- Upload multiple answer documents from the target company
- You can find example files in the `/documents/Answers/` folder
- These represent typical documents a target company provides during DD
- **Tip**: You can upload all answer documents at once for batch processing

#### 5. **Analyze Questions and Answers**
- Go back to the **Questions** tab
- Click **"Analyze All Unanswered"** button
- Wait approximately **30 seconds** for the AI analysis to complete
- The system will automatically match questions with relevant answers from your documents

#### 6. **Review Results**
- Check which questions now show as **"Answered"** with green badges
- Questions with answers will display compliance status:
  - 🟢 **Compliant**: Answer shows adherence to requirements
  - 🔴 **Non-Compliant**: Answer shows gaps or issues

#### 7. **Examine Detailed Answers**
- Click the **"👁️ Eye"** icon next to answered questions
- View the extracted answers and their source documents
- See compliance status for each individual answer

#### 8. **Trace Answer Sources**
- Click on the **document file name** in the answer viewer
- This opens the full document with the relevant text highlighted
- Verify the context and accuracy of the extracted answers

### Example Files Available

The project includes sample documents to help you get started:

- **`/documents/Legal Questions.docx`** - Example questions a PE firm might ask
- **`/documents/Answers/`** - Sample answer documents from target companies
  - Financial statements
  - Legal documents
  - Operational reports
  - Compliance certificates

### Pro Tips

- **Batch Processing**: Upload multiple documents at once for efficiency
- **Compliance Tracking**: Use the color-coded badges to quickly identify compliance issues
- **Document Verification**: Always click through to the source document to verify context
- **Project Organization**: Create separate projects for different due diligence engagements

## 🚀 Features

### Core Functionality
- **📄 Document Processing**: Upload and process various document formats (PDF, Word, etc.)
- **🤖 AI-Powered Analysis**: Automatic question extraction and compliance assessment
- **📊 Compliance Tracking**: Real-time compliance status monitoring with visual indicators
- **🗂️ Project Management**: Multi-project organization with role-based access
- **💾 Local Storage**: Secure client-side data persistence
- **🔄 Real-time Updates**: Instant UI updates without page refreshes

### Advanced Features
- **📈 Analytics Dashboard**: Comprehensive statistics and insights
- **🔍 Smart Search**: Semantic search across all documents and questions
- **📋 Question Categories**: Organized by business domains (Legal, Finance, HR, etc.)
- **👥 Stakeholder Management**: Role-based question assignment and tracking
- **🎯 Compliance Scoring**: Automated compliance assessment with detailed reporting

## 🛠️ Technology Stack

### Frontend Framework
- **React 18** - Modern UI library with hooks and concurrent features
- **TypeScript** - Type-safe development with enhanced IDE support
- **Vite** - Lightning-fast build tool and development server

### UI & Styling
- **shadcn/ui** - Modern, accessible component library
- **Tailwind CSS** - Utility-first CSS framework for rapid styling
- **Lucide React** - Beautiful, customizable icons
- **Radix UI** - Unstyled, accessible UI primitives

### State Management & Data
- **React Hooks** - Built-in state management with custom hooks
- **Local Storage API** - Client-side data persistence
- **Custom Storage Service** - Type-safe data layer with validation

### AI & Machine Learning
- **OpenAI GPT-4** - Advanced language model for document analysis
- **Custom RAG System** - Retrieval-Augmented Generation for document search
- **Semantic Search** - Vector-based document similarity matching

### Development Tools
- **ESLint** - Code linting and quality assurance
- **Prettier** - Code formatting and consistency
- **TypeScript Compiler** - Static type checking
- **Vite Dev Server** - Hot module replacement and fast builds

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18.0.0 or higher) - [Download here](https://nodejs.org/)
- **npm** (v8.0.0 or higher) - Comes with Node.js
- **Git** - [Download here](https://git-scm.com/)

### Recommended Tools
- **VS Code** - [Download here](https://code.visualstudio.com/)
- **Node Version Manager (nvm)** - [Installation guide](https://github.com/nvm-sh/nvm#installing-and-updating)

## 🚀 Installation & Setup

### 1. Clone the Repository

```bash
# Clone the repository
git clone https://github.com/your-username/gold-start-app.git

# Navigate to the project directory
cd gold-start-app
```

### 2. Install Dependencies

```bash
# Install all required dependencies
npm install

# Verify installation
npm list --depth=0
```

### 3. Environment Configuration

Create a `.env` file in the root directory:

```bash
# Copy the environment template
cp .env.example .env
```

Configure the following environment variables:

```env
# OpenAI Configuration (Required for AI features)
VITE_OPENAI_API_KEY=your_openai_api_key_here
VITE_OPENAI_BASE_URL=https://api.openai.com/v1
VITE_OPENAI_DEFAULT_MODEL=gpt-4o-mini

# Optional: Custom API endpoints
VITE_API_BASE_URL=http://localhost:3000
VITE_DEBUG_MODE=false
```

### 4. OpenAI API Setup

1. **Create OpenAI Account**: Visit [OpenAI Platform](https://platform.openai.com/)
2. **Generate API Key**: 
   - Navigate to [API Keys](https://platform.openai.com/api-keys)
   - Click "Create new secret key"
   - Copy the generated key
3. **Add to Environment**: Paste the key in your `.env` file
4. **Verify Access**: Ensure your account has sufficient credits

### 5. Start Development Server

```bash
# Start the development server
npm run dev

# The application will be available at:
# http://localhost:5173 (or next available port)
```

## 🏗️ Project Structure

```
gold-start-app/
├── public/                     # Static assets
│   ├── favicon.ico
│   ├── placeholder.svg
│   └── robots.txt
├── src/
│   ├── components/             # React components
│   │   ├── ui/                # shadcn/ui components
│   │   ├── AnswerViewer.tsx   # Answer display component
│   │   ├── AppSidebar.tsx     # Navigation sidebar
│   │   ├── DashboardHeader.tsx # Header component
│   │   ├── DocumentList.tsx   # Document management
│   │   ├── DocumentUpload.tsx # File upload component
│   │   ├── DocumentViewer.tsx # Document display
│   │   ├── QuestionForm.tsx   # Question creation form
│   │   ├── QuestionList.tsx   # Question display
│   │   └── UserOnboarding.tsx # User setup
│   ├── contexts/              # React contexts
│   │   └── UserContext.tsx    # User state management
│   ├── hooks/                 # Custom React hooks
│   │   ├── useDocumentService.ts    # Document operations
│   │   ├── useQuestionAnalyzer.ts   # AI analysis
│   │   ├── useQuestionService.ts    # Question management
│   │   ├── useStorage.ts            # Data persistence
│   │   └── useUser.ts               # User management
│   ├── lib/                   # Core libraries
│   │   ├── services/          # Business logic services
│   │   │   ├── document/      # Document processing
│   │   │   ├── question/      # Question management
│   │   │   └── questionAnalyzer/ # AI analysis
│   │   ├── answer.ts          # Answer service
│   │   ├── openai.ts          # OpenAI integration
│   │   ├── rag.ts             # RAG system
│   │   ├── storage.ts         # Storage abstraction
│   │   ├── types.ts           # TypeScript definitions
│   │   └── utils.ts           # Utility functions
│   ├── pages/                 # Page components
│   │   ├── Answers.tsx        # Answers page
│   │   ├── Documents.tsx      # Documents page
│   │   ├── Index.tsx          # Dashboard
│   │   ├── Questions.tsx      # Questions page
│   │   └── NotFound.tsx       # 404 page
│   ├── App.tsx                # Main app component
│   ├── main.tsx               # Application entry point
│   └── index.css              # Global styles
├── test-docs/                 # Sample documents
├── .env.example               # Environment template
├── components.json            # shadcn/ui configuration
├── eslint.config.js           # ESLint configuration
├── package.json               # Dependencies and scripts
├── postcss.config.js          # PostCSS configuration
├── tailwind.config.ts         # Tailwind CSS configuration
├── tsconfig.json              # TypeScript configuration
└── vite.config.ts             # Vite configuration
```

## 🔧 API Documentation

### Core Services

#### Document Service (`useDocumentService`)
```typescript
interface DocumentService {
  // Document Management
  uploadDocument(file: File, userId: string, projectId: string): Promise<Document>
  deleteDocument(documentId: string): Promise<void>
  getDocumentById(documentId: string): Promise<Document | null>
  loadDocuments(projectId: string): Promise<void>
  
  // Document Processing
  processDocument(documentId: string): Promise<ProcessingResult>
  getDocumentsByProcessingStatus(status: ProcessingStatus): Document[]
  
  // Statistics
  getDocumentStats(): DocumentStats
}
```

#### Question Service (`useQuestionService`)
```typescript
interface QuestionService {
  // CRUD Operations
  createQuestion(request: CreateQuestionRequest): Promise<Question>
  updateQuestion(id: string, request: UpdateQuestionRequest): Promise<Question>
  deleteQuestion(id: string): Promise<void>
  getQuestionById(id: string): Promise<Question | null>
  
  // Querying
  getQuestions(filters?: QuestionFilters): Question[]
  getQuestionsByProject(projectId: string): Question[]
  getQuestionsByCategory(category: QuestionCategory): Question[]
  searchQuestions(searchTerm: string): Question[]
  
  // Statistics
  getQuestionStats(projectId?: string): QuestionStats
}
```

#### Question Analyzer (`useQuestionAnalyzer`)
```typescript
interface QuestionAnalyzer {
  // Analysis Operations
  analyzeQuestion(question: Question, projectId: string): Promise<QuestionAnalysisResult>
  analyzeQuestions(questions: Question[], projectId: string): Promise<BulkAnalysisResult>
  
  // Compliance Checking
  isQuestionAnswered(questionId: string): boolean
  getQuestionAnswers(questionId: string): QuestionAnswer[]
  
  // State Management
  refreshAnswers(): Promise<void>
  clearResults(): void
}
```

### Data Models

#### Question
```typescript
interface Question extends BaseEntity {
  content: string
  category: QuestionCategory
  stakeholder: Stakeholder
  userId: string
  projectId: string
}
```

#### QuestionAnswer
```typescript
interface QuestionAnswer extends BaseEntity {
  questionId: string
  content: string
  documentId: string
  compliant: boolean  // NEW: Compliance status
}
```

#### Document
```typescript
interface Document extends BaseEntity {
  fileName: string
  documentType: string
  content: string
  rawText: string
  userId: string
  projectId: string
  processingStatus: ProcessingStatus
  processingError?: string
}
```

## 🎯 Usage Guide

### 1. Project Setup

1. **Create a New Project**:
   - Click the project selector in the sidebar
   - Select "Create New Project"
   - Enter project name and description
   - Click "Create Project"

2. **Upload Documents**:
   - Navigate to the Documents tab
   - Click "Upload Documents"
   - Select files (PDF, Word, etc.)
   - Wait for processing to complete

### 2. Question Management

1. **Create Questions**:
   - Go to the Questions tab
   - Click "New Question"
   - Fill in question details:
     - Content (the actual question)
     - Category (Legal, Finance, HR, etc.)
     - Stakeholder (who should answer)
   - Click "Create Question"

2. **Analyze Questions**:
   - Click the brain icon next to unanswered questions
   - The system will analyze documents for answers
   - View compliance status in the results

### 3. Compliance Monitoring

1. **View Compliance Status**:
   - Green badges indicate compliant answers
   - Red badges indicate non-compliant answers
   - Click on answers to view detailed information

2. **Bulk Analysis**:
   - Use "Analyze All Unanswered" for batch processing
   - Monitor progress in the UI
   - Review results and compliance statistics

## 🔍 Advanced Features

### RAG (Retrieval-Augmented Generation) System

The platform implements a sophisticated RAG system for document analysis:

```typescript
// Document chunking and indexing
interface DocumentChunk {
  id: string
  documentId: string
  content: string
  metadata: Record<string, any>
  embedding?: number[]
}

// Semantic search
interface SearchResult {
  chunk: DocumentChunk
  score: number
  relevance: number
}
```

### AI-Powered Compliance Analysis

The system uses OpenAI GPT-4 to determine compliance:

```typescript
// Compliance analysis prompt structure
const systemPrompt = `
You are an expert at analyzing whether document chunks contain answers 
to specific questions and determining compliance.

Compliance Guidelines:
- "compliant": true - Shows adherence to standards/regulations
- "compliant": false - Shows non-compliance or gaps

Return JSON with compliance assessment for each answer.
`;
```

### Storage Architecture

The platform uses a custom storage service with type safety:

```typescript
class LocalStorageService<T extends BaseEntity> {
  async create(item: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<StorageResult<T>>
  async update(id: string, updates: Partial<T>): Promise<StorageResult<T>>
  async delete(id: string): Promise<StorageResult<boolean>>
  async getAll(): Promise<StorageResult<T[]>>
  async getById(id: string): Promise<StorageResult<T | null>>
}
```

## 🧪 Development

### Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build

# Code Quality
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
npm run type-check   # TypeScript type checking

# Testing (if implemented)
npm run test         # Run tests
npm run test:watch   # Run tests in watch mode
```

### Development Workflow

1. **Feature Development**:
   ```bash
   # Create feature branch
   git checkout -b feature/new-feature
   
   # Make changes and test
   npm run dev
   
   # Run quality checks
   npm run lint
   npm run type-check
   
   # Commit and push
   git add .
   git commit -m "feat: add new feature"
   git push origin feature/new-feature
   ```

2. **Code Standards**:
   - Follow TypeScript best practices
   - Use meaningful variable and function names
   - Add JSDoc comments for complex functions
   - Maintain consistent code formatting

### Environment Variables Reference

| Variable | Description | Required | Default | Example |
|----------|-------------|----------|---------|---------|
| `VITE_OPENAI_API_KEY` | OpenAI API key for AI features | Yes | - | `sk-...` |
| `VITE_OPENAI_BASE_URL` | OpenAI API base URL | No | `https://api.openai.com/v1` | `https://api.openai.com/v1` |
| `VITE_OPENAI_DEFAULT_MODEL` | Default OpenAI model | No | `gpt-4o-mini` | `gpt-4o-mini` |
| `VITE_API_BASE_URL` | Custom API base URL | No | - | `http://localhost:3000` |
| `VITE_DEBUG_MODE` | Enable debug logging | No | `false` | `true` |

## 🚀 Deployment

### Production Build

```bash
# Create production build
npm run build

# The build output will be in the 'dist' directory
# Upload the contents to your web server
```

### Deployment Options

1. **Static Hosting** (Recommended):
   - **Vercel**: Connect GitHub repo for automatic deployments
   - **Netlify**: Drag and drop the `dist` folder
   - **GitHub Pages**: Use GitHub Actions for deployment

2. **Traditional Web Server**:
   - Upload `dist` contents to your web server
   - Configure server to serve `index.html` for all routes
   - Ensure proper MIME types for static assets

### Environment Configuration for Production

```env
# Production environment variables
VITE_OPENAI_API_KEY=your_production_api_key
VITE_OPENAI_BASE_URL=https://api.openai.com/v1
VITE_OPENAI_DEFAULT_MODEL=gpt-4o-mini
VITE_DEBUG_MODE=false
```

## 🔒 Security Considerations

### Data Privacy
- All data is stored locally in the browser
- No data is transmitted to external servers (except OpenAI API)
- OpenAI API calls are made directly from the client
- Consider implementing server-side proxy for production use

### API Key Security
- Never commit API keys to version control
- Use environment variables for all sensitive data
- Consider implementing API key rotation
- Monitor API usage and costs

### Best Practices
- Validate all user inputs
- Sanitize file uploads
- Implement rate limiting for API calls
- Use HTTPS in production

## 🤝 Contributing

### Getting Started
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

### Code Style
- Follow the existing code style
- Use TypeScript for all new code
- Add JSDoc comments for public APIs
- Ensure all tests pass

### Pull Request Process
1. Update documentation for new features
2. Add or update tests as needed
3. Ensure the build passes
4. Request review from maintainers

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Common Issues

1. **Build Errors**:
   ```bash
   # Clear node_modules and reinstall
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **OpenAI API Errors**:
   - Verify API key is correct
   - Check account has sufficient credits
   - Ensure API key has proper permissions

3. **Development Server Issues**:
   ```bash
   # Check if port is available
   lsof -ti:5173
   # Kill process if needed
   kill -9 $(lsof -ti:5173)
   ```

### Getting Help
- Check the [Issues](https://github.com/your-username/gold-start-app/issues) page
- Create a new issue with detailed information
- Include error messages and steps to reproduce

## 🎯 Roadmap

### Planned Features
- [ ] **User Authentication**: Multi-user support with role-based access
- [ ] **Cloud Storage**: Optional cloud storage integration
- [ ] **Advanced Analytics**: Detailed compliance reporting and dashboards
- [ ] **API Integration**: RESTful API for external integrations
- [ ] **Mobile App**: React Native mobile application
- [ ] **Workflow Automation**: Automated compliance workflows
- [ ] **Document Templates**: Pre-built question templates by industry
- [ ] **Export Features**: PDF reports and data export capabilities

### Technical Improvements
- [ ] **Performance Optimization**: Lazy loading and code splitting
- [ ] **Testing Suite**: Comprehensive unit and integration tests
- [ ] **Error Handling**: Enhanced error boundaries and user feedback
- [ ] **Accessibility**: WCAG 2.1 AA compliance
- [ ] **Internationalization**: Multi-language support

---

**Built with ❤️ using modern web technologies**

For more information, visit our [documentation](https://github.com/your-username/gold-start-app/wiki) or contact the development team.