import { useState, useEffect, useCallback, useMemo } from 'react';
import { Question, Answer } from '@/lib/services/question';
import { 
  AppSettings, 
  Project,
  BaseEntity,
  StorageKey, 
  PaginationOptions,
  PaginatedResult,
  StorageResult 
} from '@/lib/types';
import { createStorageService } from '@/lib/storage';
import { 
  validateQuestion, 
  validateAnswer, 
  validateUser, 
  validateSettings,
  validateProject,
  ValidationResult 
} from '@/lib/validation';

// Generic storage hook
function useStorage<T extends BaseEntity>(
  key: StorageKey,
  validator?: (data: Partial<T>) => ValidationResult
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const storage = useMemo(() => createStorageService<T>(key), [key]);

  // Load data from storage
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await storage.getAll();
      
      // console.log(`useStorage[${key}]: loadData result`, result);
      
      if (result.success && result.data) {
        setData(result.data);
      } else {
        setError(result.error?.message || 'Failed to load data');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, [storage, key]);

  // Create new item
  const create = useCallback(async (item: Omit<T, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      setError(null);
      
      // Validate if validator provided
      if (validator) {
        const validation = validator(item as Partial<T>);
        if (!validation.isValid) {
          setError(`Validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
          return { success: false, error: validation.errors };
        }
      }

      const result = await storage.create(item);
      
      if (result.success && result.data) {
        setData(prev => {
          const newData = [...prev, result.data!];
          return newData;
        });
        return { success: true, data: result.data };
      } else {
        setError(result.error?.message || 'Failed to create item');
        return { success: false, error: result.error };
      }
    } catch (err) {
      const errorMsg = 'An unexpected error occurred';
      setError(errorMsg);
      return { success: false, error: { code: 'UNEXPECTED_ERROR', message: errorMsg } };
    }
  }, [storage, validator]);

  // Update item
  const update = useCallback(async (id: string, updates: Partial<Omit<T, 'id' | 'createdAt'>>) => {
    try {
      setError(null);
      
      // Validate if validator provided
      if (validator) {
        const validation = validator(updates as Partial<T>);
        if (!validation.isValid) {
          setError(`Validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
          return { success: false, error: validation.errors };
        }
      }

      const result = await storage.update(id, updates);
      
      if (result.success && result.data) {
        setData(prev => prev.map(item => 
          (item as any).id === id ? result.data! : item
        ));
        return { success: true, data: result.data };
      } else {
        setError(result.error?.message || 'Failed to update item');
        return { success: false, error: result.error };
      }
    } catch (err) {
      const errorMsg = 'An unexpected error occurred';
      setError(errorMsg);
      return { success: false, error: { code: 'UNEXPECTED_ERROR', message: errorMsg } };
    }
  }, [storage, validator]);

  // Delete item
  const remove = useCallback(async (id: string) => {
    try {
      setError(null);
      const result = await storage.delete(id);
      
      if (result.success) {
        setData(prev => prev.filter(item => (item as any).id !== id));
        return { success: true };
      } else {
        setError(result.error?.message || 'Failed to delete item');
        return { success: false, error: result.error };
      }
    } catch (err) {
      const errorMsg = 'An unexpected error occurred';
      setError(errorMsg);
      return { success: false, error: { code: 'UNEXPECTED_ERROR', message: errorMsg } };
    }
  }, [storage]);

  // Get item by ID
  const getById = useCallback(async (id: string) => {
    try {
      setError(null);
      const result = await storage.getById(id);
      
      if (result.success) {
        return { success: true, data: result.data };
      } else {
        setError(result.error?.message || 'Failed to get item');
        return { success: false, error: result.error };
      }
    } catch (err) {
      const errorMsg = 'An unexpected error occurred';
      setError(errorMsg);
      return { success: false, error: { code: 'UNEXPECTED_ERROR', message: errorMsg } };
    }
  }, [storage]);

  // Get paginated data
  const getPaginated = useCallback(async (options: PaginationOptions) => {
    try {
      setError(null);
      const result = await storage.getPaginated(options);
      
      if (result.success && result.data) {
        return { success: true, data: result.data };
      } else {
        setError(result.error?.message || 'Failed to get paginated data');
        return { success: false, error: result.error };
      }
    } catch (err) {
      const errorMsg = 'An unexpected error occurred';
      setError(errorMsg);
      return { success: false, error: { code: 'UNEXPECTED_ERROR', message: errorMsg } };
    }
  }, [storage]);

  // Clear all data
  const clear = useCallback(async () => {
    try {
      setError(null);
      const result = await storage.clear();
      
      if (result.success) {
        setData([]);
        return { success: true };
      } else {
        setError(result.error?.message || 'Failed to clear data');
        return { success: false, error: result.error };
      }
    } catch (err) {
      const errorMsg = 'An unexpected error occurred';
      setError(errorMsg);
      return { success: false, error: { code: 'UNEXPECTED_ERROR', message: errorMsg } };
    }
  }, [storage]);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    data,
    loading,
    error,
    create,
    update,
    remove,
    getById,
    getPaginated,
    clear,
    refresh: loadData
  };
}

// Specific hooks for each entity type
export function useQuestions() {
  return useStorage<Question>('basic/QUESTIONS', validateQuestion);
}

export function useAnswers() {
  return useStorage<Answer>('basic/ANSWERS', validateAnswer);
}

// Settings hook (doesn't extend BaseEntity)
export function useSettings() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const settingsStorage = useMemo(() => createStorageService<AppSettings>('basic/SETTINGS'), []);

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await settingsStorage.getAll();
      
      if (result.success && result.data && result.data.length > 0) {
        setSettings(result.data[0]);
      } else {
        // Set default settings
        const defaultSettings: AppSettings = {
          id: 'default',
          createdAt: new Date(),
          updatedAt: new Date(),
          theme: 'system',
          language: 'en',
          notifications: true,
          autoSave: true,
        };
        setSettings(defaultSettings);
      }
    } catch (err) {
      setError('Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, [settingsStorage]);

  const updateSettings = useCallback(async (updates: Partial<AppSettings>) => {
    try {
      setError(null);
      
      // Validate settings
      const validation = validateSettings(updates);
      if (!validation.isValid) {
        setError(`Validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
        return { success: false, error: validation.errors };
      }

      const currentSettings = settings || {
        id: 'default',
        createdAt: new Date(),
        updatedAt: new Date(),
        theme: 'system',
        language: 'en',
        notifications: true,
        autoSave: true,
      };

      const updatedSettings: AppSettings = {
        ...currentSettings,
        ...updates,
        updatedAt: new Date()
      };

      // Clear existing settings and save new one
      await settingsStorage.clear();
      const result = await settingsStorage.create(updatedSettings);
      
      if (result.success && result.data) {
        setSettings(result.data);
        return { success: true, data: result.data };
      } else {
        setError(result.error?.message || 'Failed to update settings');
        return { success: false, error: result.error };
      }
    } catch (err) {
      const errorMsg = 'An unexpected error occurred';
      setError(errorMsg);
      return { success: false, error: { code: 'UNEXPECTED_ERROR', message: errorMsg } };
    }
  }, [settingsStorage, settings]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  return {
    settings,
    loading,
    error,
    updateSettings,
    refresh: loadSettings
  };
}

export function useProjects() {
  return useStorage<Project>('basic/PROJECTS', validateProject);
}

// Hook for active project
export function useActiveProject() {
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Get all projects to find the active one
  const { data: projects } = useProjects();

  // Find the active project from the projects list
  const activeProject = projects.find(p => p.id === activeProjectId) || null;
  
  // Debug logging (can be removed in production)
  // console.log('useActiveProject - projects:', projects);
  // console.log('useActiveProject - activeProjectId:', activeProjectId);
  // console.log('useActiveProject - activeProject:', activeProject);

  const loadActiveProjectId = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load active project ID from localStorage
      const stored = localStorage.getItem('basic/ACTIVE_PROJECT_ID');
      if (stored) {
        setActiveProjectId(stored);
      } else {
        setActiveProjectId(null);
      }
    } catch (err) {
      setError('Failed to load active project ID');
    } finally {
      setLoading(false);
    }
  }, []);

  const setActive = useCallback(async (project: Project) => {
    try {
      setError(null);
      
      // Validate project
      const validation = validateProject(project);
      if (!validation.isValid) {
        setError(`Validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
        return { success: false, error: validation.errors };
      }

      // Store the active project ID
      localStorage.setItem('basic/ACTIVE_PROJECT_ID', project.id);
      setActiveProjectId(project.id);
      
      return { success: true, data: project };
    } catch (err) {
      const errorMsg = 'An unexpected error occurred';
      setError(errorMsg);
      return { success: false, error: { code: 'UNEXPECTED_ERROR', message: errorMsg } };
    }
  }, []);

  const clearActive = useCallback(async () => {
    try {
      setError(null);
      
      // Remove the active project ID
      localStorage.removeItem('basic/ACTIVE_PROJECT_ID');
      setActiveProjectId(null);
      
      return { success: true };
    } catch (err) {
      const errorMsg = 'An unexpected error occurred';
      setError(errorMsg);
      return { success: false, error: { code: 'UNEXPECTED_ERROR', message: errorMsg } };
    }
  }, []);

  useEffect(() => {
    loadActiveProjectId();
  }, [loadActiveProjectId]);

  return {
    activeProject,
    activeProjectId,
    loading,
    error,
    setActive,
    clearActive,
    refresh: loadActiveProjectId
  };
}

// Hook for questions with answers
export function useQuestionsWithAnswers() {
  const questions = useQuestions();
  const answers = useAnswers();
  const [questionsWithAnswers, setQuestionsWithAnswers] = useState<Array<Question & { answers: Answer[] }>>([]);

  useEffect(() => {
    if (questions.data && answers.data) {
      const combined = questions.data.map(question => ({
        ...question,
        answers: answers.data.filter(answer => answer.questionId === question.id)
      }));
      setQuestionsWithAnswers(combined);
    }
  }, [questions.data, answers.data]);

  return {
    ...questions,
    questionsWithAnswers,
    answers: answers.data
  };
}
