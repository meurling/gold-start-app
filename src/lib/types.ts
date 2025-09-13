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
