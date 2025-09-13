import { useState, useEffect, useCallback } from 'react';
import { Question, QuestionCategory, Stakeholder, CreateQuestionRequest, UpdateQuestionRequest, QuestionFilters } from '@/lib/services/question';
import { validateQuestion } from '@/lib/validation';
import { useQuestions } from './useStorage';

export function useQuestionService() {
  const { data: questions, create, update, remove, loading, error } = useQuestions();

  // Create question
  const createQuestion = useCallback(async (request: CreateQuestionRequest) => {
    const validation = validateQuestion(request);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
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

  // Check if question can be deleted
  const canDeleteQuestion = useCallback((questionId: string) => {
    if (!questions) return false;
    return !questions.some(q => q.parentQuestionId === questionId);
  }, [questions]);

  // Delete question
  const deleteQuestion = useCallback(async (id: string) => {
    if (!canDeleteQuestion(id)) {
      throw new Error('Cannot delete question with sub-questions');
    }

    const result = await remove(id);
    
    if (!result.success) {
      throw new Error(result.error?.message || 'Failed to delete question');
    }

    return true;
  }, [remove, canDeleteQuestion]);

  // Get questions with filters - simplified approach
  const getQuestions = useCallback((filters: QuestionFilters = {}) => {
    if (!questions || questions.length === 0) {
      return [];
    }
    
    let filtered = [...questions];
    
    // Apply filters directly
    if (filters.projectId) {
      filtered = filtered.filter(q => q.projectId === filters.projectId);
    }
    
    if (filters.category) {
      filtered = filtered.filter(q => q.category === filters.category);
    }
    
    if (filters.stakeholder) {
      filtered = filtered.filter(q => q.stakeholder === filters.stakeholder);
    }
    
    if (filters.parentQuestionId !== undefined) {
      if (filters.parentQuestionId === null) {
        filtered = filtered.filter(q => !q.parentQuestionId);
      } else {
        filtered = filtered.filter(q => q.parentQuestionId === filters.parentQuestionId);
      }
    }
    
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(q => 
        q.content.toLowerCase().includes(searchLower)
      );
    }
    
    return filtered;
  }, [questions]);

  // Get question by ID
  const getQuestionById = useCallback((id: string) => {
    return questions?.find(q => q.id === id);
  }, [questions]);

  // Get root questions
  const getRootQuestions = useCallback((projectId?: string) => {
    if (!questions) return [];
    return questions.filter(q => 
      !q.parentQuestionId && 
      (projectId ? q.projectId === projectId : true)
    );
  }, [questions]);

  // Get sub-questions
  const getSubQuestions = useCallback((parentId: string) => {
    if (!questions) return [];
    return questions.filter(q => q.parentQuestionId === parentId);
  }, [questions]);

  // Get question hierarchy
  const getQuestionHierarchy = useCallback((rootId: string) => {
    if (!questions) return [];
    const root = questions.find(q => q.id === rootId);
    if (!root) return [];
    
    const hierarchy = [root];
    const addChildren = (parentId: string) => {
      const children = questions.filter(q => q.parentQuestionId === parentId);
      children.forEach(child => {
        hierarchy.push(child);
        addChildren(child.id);
      });
    };
    addChildren(rootId);
    return hierarchy;
  }, [questions]);

  // Get questions by project
  const getQuestionsByProject = useCallback((projectId: string) => {
    if (!questions) return [];
    return questions.filter(q => q.projectId === projectId);
  }, [questions]);

  // Get questions by user
  const getQuestionsByUser = useCallback((userId: string) => {
    if (!questions) return [];
    return questions.filter(q => q.userId === userId);
  }, [questions]);

  // Get questions by category
  const getQuestionsByCategory = useCallback((category: QuestionCategory, projectId?: string) => {
    if (!questions) return [];
    return questions.filter(q => 
      q.category === category && 
      (projectId ? q.projectId === projectId : true)
    );
  }, [questions]);

  // Get questions by stakeholder
  const getQuestionsByStakeholder = useCallback((stakeholder: Stakeholder, projectId?: string) => {
    if (!questions) return [];
    return questions.filter(q => 
      q.stakeholder === stakeholder && 
      (projectId ? q.projectId === projectId : true)
    );
  }, [questions]);

  // Search questions
  const searchQuestions = useCallback((searchTerm: string, projectId?: string) => {
    if (!questions) return [];
    const searchLower = searchTerm.toLowerCase();
    return questions.filter(q => 
      q.content.toLowerCase().includes(searchLower) &&
      (projectId ? q.projectId === projectId : true)
    );
  }, [questions]);

  // Get question statistics
  const getQuestionStats = useCallback((projectId?: string) => {
    if (!questions) {
      return {
        total: 0,
        byCategory: {},
        byStakeholder: {},
        rootQuestions: 0,
        subQuestions: 0
      };
    }
    
    const filteredQuestions = projectId 
      ? questions.filter(q => q.projectId === projectId)
      : questions;
    
    const stats = {
      total: filteredQuestions.length,
      byCategory: {} as Record<string, number>,
      byStakeholder: {} as Record<string, number>,
      rootQuestions: 0,
      subQuestions: 0
    };
    
    filteredQuestions.forEach(q => {
      // Count by category
      stats.byCategory[q.category] = (stats.byCategory[q.category] || 0) + 1;
      
      // Count by stakeholder
      stats.byStakeholder[q.stakeholder] = (stats.byStakeholder[q.stakeholder] || 0) + 1;
      
      // Count root vs sub questions
      if (q.parentQuestionId) {
        stats.subQuestions++;
      } else {
        stats.rootQuestions++;
      }
    });
    
    return stats;
  }, [questions]);

  // Get question path
  const getQuestionPath = useCallback((questionId: string) => {
    if (!questions) return [];
    const path: Question[] = [];
    let current = questions.find(q => q.id === questionId);
    
    while (current) {
      path.unshift(current);
      current = current.parentQuestionId 
        ? questions.find(q => q.id === current.parentQuestionId)
        : undefined;
    }
    
    return path;
  }, [questions]);

  // Delete all questions for a project
  const deleteAllQuestions = useCallback(async (projectId?: string) => {
    try {
      const questionsToDelete = projectId 
        ? getQuestionsByProject(projectId)
        : questions || [];

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
  }, [remove, getQuestionsByProject, questions]);

  // Delete question with sub-questions (cascade delete)
  const deleteQuestionWithSubQuestions = useCallback(async (questionId: string) => {
    try {
      const hierarchy = getQuestionHierarchy(questionId);
      
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
  }, [remove, getQuestionHierarchy]);

  return {
    // Data
    questions: questions || [],
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
