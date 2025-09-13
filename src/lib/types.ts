// Base interface for all entities
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

// Question interface
export interface Question extends BaseEntity {
  title: string;
  content: string;
  tags: string[];
  isResolved: boolean;
  authorId: string;
  upvotes: number;
  downvotes: number;
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
export type StorageKey = string;

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
