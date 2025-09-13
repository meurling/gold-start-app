// Base interface for all entities
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export type StorageKey = string;

// Project interface
export interface Project extends BaseEntity {
  name: string;
  description?: string;
  isActive: boolean;
}

// Document processing status
export type ProcessingStatus = 'not_started' | 'processing' | 'completed' | 'failed';

// Document interface
export interface Document extends BaseEntity {
  fileName: string;
  documentType: string; // pdf, word, etc.
  content: string; // base64 encoded byte data for localStorage compatibility
  rawText: string;
  userId: string;
  projectId: string;
  processingStatus: ProcessingStatus;
  processingError?: string; // Error message if processing failed
}

// Legacy alias for backward compatibility
export type QuestionDocument = Document;


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
