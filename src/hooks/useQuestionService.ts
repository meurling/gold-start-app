import { useState, useEffect, useCallback } from 'react';
import { Question, QuestionCategory, Stakeholder, CreateQuestionRequest, UpdateQuestionRequest, QuestionFilters, questionService } from '@/lib/services/question';
import { useQuestions } from './useStorage';

export function useQuestionService() {
  const { data: questions, create, update, remove, loading, error } = useQuestions();
  const [localQuestions, setLocalQuestions] = useState<Question[]>([]);

  // Sync questions with the service
  useEffect(() => {
    if (questions) {
      questionService.setQuestions(questions);
      setLocalQuestions(questions);
    }
  }, [questions]);

  // Subscribe to service updates
  useEffect(() => {
    const unsubscribe = questionService.subscribe(setLocalQuestions);
    return unsubscribe;
  }, []);

  // Create question
  const createQuestion = useCallback(async (request: CreateQuestionRequest) => {
    const validation = questionService.validateQuestion(request);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    const result = await create({
      content: request.content,
      category: request.category,
      stakeholder: request.stakeholder,
      parentQuestionId: request.parentQuestionId,
      rootQuestionId: request.rootQuestionId,
      userId: request.userId,
      projectId: request.projectId,
    });

    if (!result.success) {
      throw new Error(result.error?.message || 'Failed to create question');
    }

    return result.data;
  }, [create]);

  // Update question
  const updateQuestion = useCallback(async (id: string, request: UpdateQuestionRequest) => {
    const result = await update(id, request);
    
    if (!result.success) {
      throw new Error(result.error?.message || 'Failed to update question');
    }

    return result.data;
  }, [update]);

  // Delete question
  const deleteQuestion = useCallback(async (id: string) => {
    if (!questionService.canDeleteQuestion(id)) {
      throw new Error('Cannot delete question with sub-questions');
    }

    const result = await remove(id);
    
    if (!result.success) {
      throw new Error(result.error?.message || 'Failed to delete question');
    }

    return true;
  }, [remove]);

  // Get questions with filters
  const getQuestions = useCallback((filters: QuestionFilters = {}) => {
    return questionService.getQuestions(filters);
  }, []);

  // Get question by ID
  const getQuestionById = useCallback((id: string) => {
    return questionService.getQuestionById(id);
  }, []);

  // Get root questions
  const getRootQuestions = useCallback((projectId?: string) => {
    return questionService.getRootQuestions(projectId);
  }, []);

  // Get sub-questions
  const getSubQuestions = useCallback((parentId: string) => {
    return questionService.getSubQuestions(parentId);
  }, []);

  // Get question hierarchy
  const getQuestionHierarchy = useCallback((rootId: string) => {
    return questionService.getQuestionHierarchy(rootId);
  }, []);

  // Get questions by project
  const getQuestionsByProject = useCallback((projectId: string) => {
    return questionService.getQuestionsByProject(projectId);
  }, []);

  // Get questions by user
  const getQuestionsByUser = useCallback((userId: string) => {
    return questionService.getQuestionsByUser(userId);
  }, []);

  // Get questions by category
  const getQuestionsByCategory = useCallback((category: QuestionCategory, projectId?: string) => {
    return questionService.getQuestionsByCategory(category, projectId);
  }, []);

  // Get questions by stakeholder
  const getQuestionsByStakeholder = useCallback((stakeholder: Stakeholder, projectId?: string) => {
    return questionService.getQuestionsByStakeholder(stakeholder, projectId);
  }, []);

  // Search questions
  const searchQuestions = useCallback((searchTerm: string, projectId?: string) => {
    return questionService.searchQuestions(searchTerm, projectId);
  }, []);

  // Get question statistics
  const getQuestionStats = useCallback((projectId?: string) => {
    return questionService.getQuestionStats(projectId);
  }, []);

  // Get question path
  const getQuestionPath = useCallback((questionId: string) => {
    return questionService.getQuestionPath(questionId);
  }, []);

  // Check if question can be deleted
  const canDeleteQuestion = useCallback((questionId: string) => {
    return questionService.canDeleteQuestion(questionId);
  }, []);

  // Delete all questions for a project
  const deleteAllQuestions = useCallback(async (projectId?: string) => {
    try {
      const questionsToDelete = projectId 
        ? questionService.getQuestionsByProject(projectId)
        : questionService.getAllQuestions();

      // Delete questions in reverse order (sub-questions first, then root questions)
      const sortedQuestions = questionsToDelete.sort((a, b) => {
        if (a.parentQuestionId && !b.parentQuestionId) return -1;
        if (!a.parentQuestionId && b.parentQuestionId) return 1;
        return 0;
      });

      for (const question of sortedQuestions) {
        const result = await remove(question.id);
        if (!result.success) {
          throw new Error(`Failed to delete question: ${result.error?.message}`);
        }
      }

      return { success: true, deletedCount: questionsToDelete.length };
    } catch (error) {
      throw new Error(`Failed to delete all questions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [remove]);

  // Delete question with sub-questions (cascade delete)
  const deleteQuestionWithSubQuestions = useCallback(async (questionId: string) => {
    try {
      const hierarchy = questionService.getQuestionHierarchy(questionId);
      
      // Delete in reverse order (sub-questions first, then root)
      const sortedQuestions = hierarchy.sort((a, b) => {
        if (a.parentQuestionId && !b.parentQuestionId) return -1;
        if (!a.parentQuestionId && b.parentQuestionId) return 1;
        return 0;
      });

      for (const question of sortedQuestions) {
        const result = await remove(question.id);
        if (!result.success) {
          throw new Error(`Failed to delete question: ${result.error?.message}`);
        }
      }

      return { success: true, deletedCount: hierarchy.length };
    } catch (error) {
      throw new Error(`Failed to delete question with sub-questions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [remove]);

  return {
    // Data
    questions: localQuestions,
    loading,
    error,
    
    // CRUD operations
    createQuestion,
    updateQuestion,
    deleteQuestion,
    deleteAllQuestions,
    deleteQuestionWithSubQuestions,
    
    // Query methods
    getQuestions,
    getQuestionById,
    getRootQuestions,
    getSubQuestions,
    getQuestionHierarchy,
    getQuestionsByProject,
    getQuestionsByUser,
    getQuestionsByCategory,
    getQuestionsByStakeholder,
    searchQuestions,
    getQuestionStats,
    getQuestionPath,
    canDeleteQuestion,
  };
}
