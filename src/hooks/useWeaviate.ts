import { useState, useEffect, useCallback } from 'react';
import { weaviateService } from '@/lib/services/weaviateService';
import {
  WeaviateResponse,
  QuestionSearchResult,
  AnswerSearchResult,
  ProjectSearchResult,
} from '@/lib/services/weaviateTypes';
import { Question, Answer, Project } from '@/lib/types';

export interface UseWeaviateState {
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface UseWeaviateReturn extends UseWeaviateState {
  // Connection methods
  checkConnection: () => Promise<boolean>;
  
  // Question methods
  searchQuestions: (query: string, projectId?: string, limit?: number) => Promise<QuestionSearchResult[]>;
  createQuestion: (question: Question) => Promise<WeaviateResponse>;
  getQuestion: (id: string) => Promise<WeaviateResponse>;
  updateQuestion: (id: string, question: Partial<Question>) => Promise<WeaviateResponse>;
  deleteQuestion: (id: string) => Promise<WeaviateResponse>;
  
  // Answer methods
  searchAnswers: (query: string, questionId?: string, limit?: number) => Promise<AnswerSearchResult[]>;
  createAnswer: (answer: Answer) => Promise<WeaviateResponse>;
  getAnswer: (id: string) => Promise<WeaviateResponse>;
  updateAnswer: (id: string, answer: Partial<Answer>) => Promise<WeaviateResponse>;
  deleteAnswer: (id: string) => Promise<WeaviateResponse>;
  
  // Project methods
  searchProjects: (query: string, limit?: number) => Promise<ProjectSearchResult[]>;
  createProject: (project: Project) => Promise<WeaviateResponse>;
  getProject: (id: string) => Promise<WeaviateResponse>;
  updateProject: (id: string, project: Partial<Project>) => Promise<WeaviateResponse>;
  deleteProject: (id: string) => Promise<WeaviateResponse>;
  
  // Schema methods
  initializeSchemas: () => Promise<WeaviateResponse>;
  getSchema: () => Promise<WeaviateResponse>;
  
  // Utility methods
  clearError: () => void;
}

export const useWeaviate = (): UseWeaviateReturn => {
  const [state, setState] = useState<UseWeaviateState>({
    isConnected: false,
    isLoading: false,
    error: null,
  });

  // Check connection on mount
  useEffect(() => {
    checkConnection();
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, isLoading: loading }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error }));
  }, []);

  const setConnected = useCallback((connected: boolean) => {
    setState(prev => ({ ...prev, isConnected: connected }));
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, [setError]);

  const checkConnection = useCallback(async (): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const isReady = await weaviateService.isReady();
      setConnected(isReady);
      
      if (!isReady) {
        setError('Failed to connect to Weaviate. Please check your configuration.');
      }
      
      return isReady;
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to connect to Weaviate';
      setError(errorMessage);
      setConnected(false);
      return false;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, setConnected]);

  // Question methods
  const searchQuestions = useCallback(async (
    query: string,
    projectId?: string,
    limit: number = 10
  ): Promise<QuestionSearchResult[]> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await weaviateService.searchQuestions(query, projectId, limit);
      
      if (response.errors && response.errors.length > 0) {
        throw new Error(response.errors[0].message);
      }
      
      return response.data || [];
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to search questions';
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  const createQuestion = useCallback(async (question: Question): Promise<WeaviateResponse> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await weaviateService.createQuestion(question);
      
      if (response.errors && response.errors.length > 0) {
        setError(response.errors[0].message);
      }
      
      return response;
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to create question';
      setError(errorMessage);
      return { errors: [{ message: errorMessage }] };
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  const getQuestion = useCallback(async (id: string): Promise<WeaviateResponse> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await weaviateService.getQuestionById(id);
      
      if (response.errors && response.errors.length > 0) {
        setError(response.errors[0].message);
      }
      
      return response;
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to get question';
      setError(errorMessage);
      return { errors: [{ message: errorMessage }] };
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  const updateQuestion = useCallback(async (
    id: string,
    question: Partial<Question>
  ): Promise<WeaviateResponse> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await weaviateService.updateQuestion(id, question);
      
      if (response.errors && response.errors.length > 0) {
        setError(response.errors[0].message);
      }
      
      return response;
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to update question';
      setError(errorMessage);
      return { errors: [{ message: errorMessage }] };
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  const deleteQuestion = useCallback(async (id: string): Promise<WeaviateResponse> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await weaviateService.deleteQuestion(id);
      
      if (response.errors && response.errors.length > 0) {
        setError(response.errors[0].message);
      }
      
      return response;
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to delete question';
      setError(errorMessage);
      return { errors: [{ message: errorMessage }] };
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  // Answer methods
  const searchAnswers = useCallback(async (
    query: string,
    questionId?: string,
    limit: number = 10
  ): Promise<AnswerSearchResult[]> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await weaviateService.searchAnswers(query, questionId, limit);
      
      if (response.errors && response.errors.length > 0) {
        throw new Error(response.errors[0].message);
      }
      
      return response.data || [];
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to search answers';
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  const createAnswer = useCallback(async (answer: Answer): Promise<WeaviateResponse> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await weaviateService.createAnswer(answer);
      
      if (response.errors && response.errors.length > 0) {
        setError(response.errors[0].message);
      }
      
      return response;
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to create answer';
      setError(errorMessage);
      return { errors: [{ message: errorMessage }] };
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  const getAnswer = useCallback(async (id: string): Promise<WeaviateResponse> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await weaviateService.getObject('Answer', id);
      
      if (response.errors && response.errors.length > 0) {
        setError(response.errors[0].message);
      }
      
      return response;
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to get answer';
      setError(errorMessage);
      return { errors: [{ message: errorMessage }] };
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  const updateAnswer = useCallback(async (
    id: string,
    answer: Partial<Answer>
  ): Promise<WeaviateResponse> => {
    setLoading(true);
    setError(null);
    
    try {
      const updateData = {
        properties: {
          content: answer.content,
          isAccepted: answer.isAccepted,
          upvotes: answer.upvotes,
          downvotes: answer.downvotes,
          updatedAt: new Date().toISOString(),
        },
      };
      
      const response = await weaviateService.updateObject('Answer', id, updateData);
      
      if (response.errors && response.errors.length > 0) {
        setError(response.errors[0].message);
      }
      
      return response;
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to update answer';
      setError(errorMessage);
      return { errors: [{ message: errorMessage }] };
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  const deleteAnswer = useCallback(async (id: string): Promise<WeaviateResponse> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await weaviateService.deleteObject('Answer', id);
      
      if (response.errors && response.errors.length > 0) {
        setError(response.errors[0].message);
      }
      
      return response;
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to delete answer';
      setError(errorMessage);
      return { errors: [{ message: errorMessage }] };
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  // Project methods
  const searchProjects = useCallback(async (
    query: string,
    limit: number = 10
  ): Promise<ProjectSearchResult[]> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await weaviateService.searchProjects(query, limit);
      
      if (response.errors && response.errors.length > 0) {
        throw new Error(response.errors[0].message);
      }
      
      return response.data || [];
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to search projects';
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  const createProject = useCallback(async (project: Project): Promise<WeaviateResponse> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await weaviateService.createProject(project);
      
      if (response.errors && response.errors.length > 0) {
        setError(response.errors[0].message);
      }
      
      return response;
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to create project';
      setError(errorMessage);
      return { errors: [{ message: errorMessage }] };
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  const getProject = useCallback(async (id: string): Promise<WeaviateResponse> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await weaviateService.getObject('Project', id);
      
      if (response.errors && response.errors.length > 0) {
        setError(response.errors[0].message);
      }
      
      return response;
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to get project';
      setError(errorMessage);
      return { errors: [{ message: errorMessage }] };
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  const updateProject = useCallback(async (
    id: string,
    project: Partial<Project>
  ): Promise<WeaviateResponse> => {
    setLoading(true);
    setError(null);
    
    try {
      const updateData = {
        properties: {
          name: project.name,
          description: project.description,
          isActive: project.isActive,
          updatedAt: new Date().toISOString(),
        },
      };
      
      const response = await weaviateService.updateObject('Project', id, updateData);
      
      if (response.errors && response.errors.length > 0) {
        setError(response.errors[0].message);
      }
      
      return response;
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to update project';
      setError(errorMessage);
      return { errors: [{ message: errorMessage }] };
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  const deleteProject = useCallback(async (id: string): Promise<WeaviateResponse> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await weaviateService.deleteObject('Project', id);
      
      if (response.errors && response.errors.length > 0) {
        setError(response.errors[0].message);
      }
      
      return response;
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to delete project';
      setError(errorMessage);
      return { errors: [{ message: errorMessage }] };
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  // Schema methods
  const initializeSchemas = useCallback(async (): Promise<WeaviateResponse> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await weaviateService.initializeSchemas();
      
      if (response.errors && response.errors.length > 0) {
        setError(response.errors[0].message);
      }
      
      return response;
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to initialize schemas';
      setError(errorMessage);
      return { errors: [{ message: errorMessage }] };
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  const getSchema = useCallback(async (): Promise<WeaviateResponse> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await weaviateService.getSchema();
      
      if (response.errors && response.errors.length > 0) {
        setError(response.errors[0].message);
      }
      
      return response;
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to get schema';
      setError(errorMessage);
      return { errors: [{ message: errorMessage }] };
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  return {
    ...state,
    checkConnection,
    searchQuestions,
    createQuestion,
    getQuestion,
    updateQuestion,
    deleteQuestion,
    searchAnswers,
    createAnswer,
    getAnswer,
    updateAnswer,
    deleteAnswer,
    searchProjects,
    createProject,
    getProject,
    updateProject,
    deleteProject,
    initializeSchemas,
    getSchema,
    clearError,
  };
};
