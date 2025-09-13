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

// Project interface
export interface Project extends BaseEntity {
  name: string;
  description?: string;
  isActive: boolean;
}

// Storage keys enum for type safety
export enum StorageKeys {
  QUESTIONS = 'questions',
  ANSWERS = 'answers',
  USERS = 'users',
  CURRENT_USER = 'currentUser',
  SETTINGS = 'settings',
  PROJECTS = 'projects',
  ACTIVE_PROJECT = 'activeProject',
}

// Form types for creating questions
export interface CreateQuestionForm {
  content: string;
  category: QuestionCategory;
  stakeholder: Stakeholder;
  parentQuestionId?: string;
  rootQuestionId?: string;
}

// Generic storage interface
export interface StorageData<T> {
  data: T[];
  lastUpdated: Date;
  version: string;
}

// Settings interface
export interface AppSettings extends BaseEntity {
  theme: 'light' | 'dark' | 'system';
  language: string;
  notifications: boolean;
  autoSave: boolean;
}

// Error types
export interface StorageError {
  code: string;
  message: string;
  details?: any;
}

// Storage operation result
export interface StorageResult<T> {
  success: boolean;
  data?: T;
  error?: StorageError;
}

// Pagination interface
export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
