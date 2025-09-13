// Base interface for all entities
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

// Question interface with recursive structure
export interface Question extends BaseEntity {
  content: string;
  category: QuestionCategory;
  stakeholder: Stakeholder;
  parentQuestionId?: string;
  rootQuestionId?: string;
  userId: string;
  projectId: string;
}

// Question categories
export enum QuestionCategory {
  SUSTAINABILITY = 'Sustainability',
  CORPORATE_LEGAL = 'Corporate Legal',
  FINANCE = 'Finance',
  OPERATIONS = 'Operations',
  TECHNOLOGY = 'Technology',
  HUMAN_RESOURCES = 'Human Resources',
  MARKETING = 'Marketing',
  COMPLIANCE = 'Compliance',
  RISK_MANAGEMENT = 'Risk Management',
  OTHER = 'Other'
}

// Stakeholder types
export enum Stakeholder {
  LEGAL = 'Legal',
  IT = 'IT',
  FINANCE = 'Finance',
  OPERATIONS = 'Operations',
  HR = 'HR',
  MARKETING = 'Marketing',
  COMPLIANCE = 'Compliance',
  EXECUTIVE = 'Executive',
  BOARD = 'Board',
  EXTERNAL = 'External',
  OTHER = 'Other'
}

// Answer interface
export interface Answer extends BaseEntity {
  questionId: string;
  content: string;
  authorId: string;
  isAccepted: boolean;
  upvotes: number;
  downvotes: number;
}

// Form types for creating questions
export interface CreateQuestionForm {
  content: string;
  category: QuestionCategory;
  stakeholder: Stakeholder;
  parentQuestionId?: string;
  rootQuestionId?: string;
}

// Question service request types
export interface CreateQuestionRequest {
  content: string;
  category: QuestionCategory;
  stakeholder: Stakeholder;
  parentQuestionId?: string;
  rootQuestionId?: string;
  userId: string;
  projectId: string;
}

export interface UpdateQuestionRequest {
  content?: string;
  category?: QuestionCategory;
  stakeholder?: Stakeholder;
  parentQuestionId?: string;
  rootQuestionId?: string;
}

export interface QuestionFilters {
  projectId?: string;
  category?: QuestionCategory;
  stakeholder?: Stakeholder;
  parentQuestionId?: string | null; // null for root questions only
  searchTerm?: string;
}
