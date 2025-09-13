import { 
  BaseEntity, 
  StorageData, 
  StorageResult, 
  StorageError, 
  StorageKeys,
  PaginationOptions,
  PaginatedResult
} from './types';

// Storage version for data migration
const STORAGE_VERSION = '1.0.0';

// Generic storage service class
export class LocalStorageService<T extends BaseEntity> {
  private key: string;
  private version: string;

  constructor(key: StorageKeys, version: string = STORAGE_VERSION) {
    this.key = key;
    this.version = version;
  }

  // Get all data from storage
  async getAll(): Promise<StorageResult<T[]>> {
    try {
      const stored = localStorage.getItem(this.key);
      if (!stored) {
        return { success: true, data: [] };
      }

      const parsed: StorageData<T> = JSON.parse(stored);
      
      // Check version compatibility
      if (parsed.version !== this.version) {
        return {
          success: false,
          error: {
            code: 'VERSION_MISMATCH',
            message: `Data version ${parsed.version} is incompatible with current version ${this.version}`
          }
        };
      }

      // Convert date strings back to Date objects
      const data = parsed.data.map(item => ({
        ...item,
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt)
      }));

      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'PARSE_ERROR',
          message: 'Failed to parse stored data',
          details: error
        }
      };
    }
  }

  // Get item by ID
  async getById(id: string): Promise<StorageResult<T | null>> {
    try {
      const result = await this.getAll();
      if (!result.success || !result.data) {
        return {
          success: false,
          error: result.error
        };
      }

      const item = result.data.find(item => item.id === id);
      return { success: true, data: item || null };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'GET_ERROR',
          message: 'Failed to get item by ID',
          details: error
        }
      };
    }
  }

  // Create new item
  async create(item: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<StorageResult<T>> {
    try {
      const result = await this.getAll();
      if (!result.success) {
        return {
          success: false,
          error: result.error
        };
      }

      const newItem: T = {
        ...item,
        id: this.generateId(),
        createdAt: new Date(),
        updatedAt: new Date()
      } as T;

      const updatedData = [...(result.data || []), newItem];
      await this.saveAll(updatedData);
      console.log('newItem', newItem);
      return { success: true, data: newItem };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'CREATE_ERROR',
          message: 'Failed to create item',
          details: error
        }
      };
    }
  }

  // Update existing item
  async update(id: string, updates: Partial<Omit<T, 'id' | 'createdAt'>>): Promise<StorageResult<T>> {
    try {
      const result = await this.getAll();
      if (!result.success || !result.data) {
        return {
          success: false,
          error: result.error
        };
      }

      const index = result.data.findIndex(item => item.id === id);
      if (index === -1) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Item not found'
          }
        };
      }

      const updatedItem: T = {
        ...result.data[index],
        ...updates,
        updatedAt: new Date()
      };

      const updatedData = [...result.data];
      updatedData[index] = updatedItem;
      await this.saveAll(updatedData);

      return { success: true, data: updatedItem };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'UPDATE_ERROR',
          message: 'Failed to update item',
          details: error
        }
      };
    }
  }

  // Delete item
  async delete(id: string): Promise<StorageResult<boolean>> {
    try {
      const result = await this.getAll();
      if (!result.success || !result.data) {
        return {
          success: false,
          error: result.error
        };
      }

      const filteredData = result.data.filter(item => item.id !== id);
      if (filteredData.length === result.data.length) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Item not found'
          }
        };
      }

      await this.saveAll(filteredData);
      return { success: true, data: true };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'DELETE_ERROR',
          message: 'Failed to delete item',
          details: error
        }
      };
    }
  }

  // Get paginated data
  async getPaginated(options: PaginationOptions): Promise<StorageResult<PaginatedResult<T>>> {
    try {
      const result = await this.getAll();
      if (!result.success || !result.data) {
        return {
          success: false,
          error: result.error
        };
      }

      const data = [...result.data];

      // Sort data
      if (options.sortBy) {
        data.sort((a, b) => {
          const aVal = (a as Record<string, unknown>)[options.sortBy!];
          const bVal = (b as Record<string, unknown>)[options.sortBy!];
          
          if (aVal < bVal) return options.sortOrder === 'desc' ? 1 : -1;
          if (aVal > bVal) return options.sortOrder === 'desc' ? -1 : 1;
          return 0;
        });
      }

      // Calculate pagination
      const total = data.length;
      const totalPages = Math.ceil(total / options.limit);
      const startIndex = (options.page - 1) * options.limit;
      const endIndex = startIndex + options.limit;
      const paginatedData = data.slice(startIndex, endIndex);

      return {
        success: true,
        data: {
          data: paginatedData,
          total,
          page: options.page,
          limit: options.limit,
          totalPages
        }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'PAGINATION_ERROR',
          message: 'Failed to get paginated data',
          details: error
        }
      };
    }
  }

  // Clear all data
  async clear(): Promise<StorageResult<boolean>> {
    try {
      localStorage.removeItem(this.key);
      return { success: true, data: true };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'CLEAR_ERROR',
          message: 'Failed to clear data',
          details: error
        }
      };
    }
  }

  // Private helper methods
  private async saveAll(data: T[]): Promise<void> {
    const storageData: StorageData<T> = {
      data,
      lastUpdated: new Date(),
      version: this.version
    };
    localStorage.setItem(this.key, JSON.stringify(storageData));
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Factory function to create storage services
export function createStorageService<T extends BaseEntity>(key: StorageKeys): LocalStorageService<T> {
  return new LocalStorageService<T>(key);
}
