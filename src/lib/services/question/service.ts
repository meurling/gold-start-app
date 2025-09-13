import { Question, QuestionCategory, Stakeholder, CreateQuestionForm, CreateQuestionRequest, UpdateQuestionRequest, QuestionFilters } from './types';
import { useQuestions } from '@/hooks/useStorage';

export class QuestionService {
  private questions: Question[] = [];
  private listeners: Array<(questions: Question[]) => void> = [];

  constructor() {
    // Initialize with empty array, will be populated by the hook
  }

  // Set questions data (called by the hook)
  setQuestions(questions: Question[]) {
    console.log('QuestionService: setQuestions called with', questions);
    this.questions = questions;
    this.notifyListeners();
  }

  // Subscribe to questions changes
  subscribe(listener: (questions: Question[]) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    console.log('QuestionService: notifyListeners called with questions:', this.questions);
    this.listeners.forEach(listener => listener(this.questions));
  }

  // Get all questions
  getAllQuestions(): Question[] {
    return [...this.questions];
  }

  // Get questions by filters
  getQuestions(filters: QuestionFilters = {}): Question[] {
    console.log('QuestionService: getQuestions called with filters:', filters);
    console.log('QuestionService: current questions:', this.questions);
    
    let filtered = [...this.questions];

    if (filters.projectId) {
      console.log('QuestionService: filtering by projectId:', filters.projectId);
      filtered = filtered.filter(q => q.projectId === filters.projectId);
      console.log('QuestionService: filtered questions:', filtered);
    }

    if (filters.category) {
      filtered = filtered.filter(q => q.category === filters.category);
    }

    if (filters.stakeholder) {
      filtered = filtered.filter(q => q.stakeholder === filters.stakeholder);
    }

    if (filters.parentQuestionId !== undefined) {
      if (filters.parentQuestionId === null) {
        // Root questions only
        filtered = filtered.filter(q => !q.parentQuestionId);
      } else {
        // Sub-questions of specific parent
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
  }

  // Get question by ID
  getQuestionById(id: string): Question | undefined {
    return this.questions.find(q => q.id === id);
  }

  // Get root questions (questions without parent)
  getRootQuestions(projectId?: string): Question[] {
    const filters: QuestionFilters = { parentQuestionId: null };
    if (projectId) {
      filters.projectId = projectId;
    }
    return this.getQuestions(filters);
  }

  // Get sub-questions of a specific parent
  getSubQuestions(parentId: string): Question[] {
    return this.getQuestions({ parentQuestionId: parentId });
  }

  // Get question hierarchy (root question with all its sub-questions)
  getQuestionHierarchy(rootId: string): Question[] {
    const root = this.getQuestionById(rootId);
    if (!root) return [];

    const hierarchy: Question[] = [root];
    const subQuestions = this.getSubQuestions(rootId);
    
    // Recursively get all sub-questions
    const getAllSubQuestions = (parentId: string) => {
      const subs = this.getSubQuestions(parentId);
      subs.forEach(sub => {
        hierarchy.push(sub);
        getAllSubQuestions(sub.id);
      });
    };

    getAllSubQuestions(rootId);
    return hierarchy;
  }

  // Get questions by project
  getQuestionsByProject(projectId: string): Question[] {
    return this.getQuestions({ projectId });
  }

  // Get questions by user
  getQuestionsByUser(userId: string): Question[] {
    return this.questions.filter(q => q.userId === userId);
  }

  // Get questions by category
  getQuestionsByCategory(category: QuestionCategory, projectId?: string): Question[] {
    const filters: QuestionFilters = { category };
    if (projectId) {
      filters.projectId = projectId;
    }
    return this.getQuestions(filters);
  }

  // Get questions by stakeholder
  getQuestionsByStakeholder(stakeholder: Stakeholder, projectId?: string): Question[] {
    const filters: QuestionFilters = { stakeholder };
    if (projectId) {
      filters.projectId = projectId;
    }
    return this.getQuestions(filters);
  }

  // Search questions
  searchQuestions(searchTerm: string, projectId?: string): Question[] {
    const filters: QuestionFilters = { searchTerm };
    if (projectId) {
      filters.projectId = projectId;
    }
    return this.getQuestions(filters);
  }

  // Get question statistics
  getQuestionStats(projectId?: string): {
    total: number;
    byCategory: Record<QuestionCategory, number>;
    byStakeholder: Record<Stakeholder, number>;
    rootQuestions: number;
    subQuestions: number;
  } {
    const questions = projectId ? this.getQuestionsByProject(projectId) : this.questions;
    console.log('QuestionService: getQuestionStats called with projectId:', projectId, 'questions:', questions);
    
    const stats = {
      total: questions.length,
      byCategory: {} as Record<QuestionCategory, number>,
      byStakeholder: {} as Record<Stakeholder, number>,
      rootQuestions: 0,
      subQuestions: 0,
    };

    // Initialize counters
    Object.values(QuestionCategory).forEach(category => {
      stats.byCategory[category] = 0;
    });
    Object.values(Stakeholder).forEach(stakeholder => {
      stats.byStakeholder[stakeholder] = 0;
    });

    // Count questions
    questions.forEach(question => {
      stats.byCategory[question.category]++;
      stats.byStakeholder[question.stakeholder]++;
      
      if (question.parentQuestionId) {
        stats.subQuestions++;
      } else {
        stats.rootQuestions++;
      }
    });

    return stats;
  }

  // Validate question data
  validateQuestion(data: Partial<CreateQuestionRequest>): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!data.content || data.content.trim().length < 10) {
      errors.push('Question content must be at least 10 characters long');
    }

    if (!data.category) {
      errors.push('Category is required');
    }

    if (!data.stakeholder) {
      errors.push('Stakeholder is required');
    }

    if (!data.userId) {
      errors.push('User ID is required');
    }

    if (!data.projectId) {
      errors.push('Project ID is required');
    }

    // Validate parent question exists if specified
    if (data.parentQuestionId) {
      const parentQuestion = this.getQuestionById(data.parentQuestionId);
      if (!parentQuestion) {
        errors.push('Parent question not found');
      }
    }

    // Validate root question exists if specified
    if (data.rootQuestionId) {
      const rootQuestion = this.getQuestionById(data.rootQuestionId);
      if (!rootQuestion) {
        errors.push('Root question not found');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Check if question can be deleted (no sub-questions)
  canDeleteQuestion(questionId: string): boolean {
    const subQuestions = this.getSubQuestions(questionId);
    return subQuestions.length === 0;
  }

  // Get question path (breadcrumb-like path from root to question)
  getQuestionPath(questionId: string): Question[] {
    const question = this.getQuestionById(questionId);
    if (!question) return [];

    const path: Question[] = [];
    let current = question;

    // Build path from current question to root
    while (current) {
      path.unshift(current);
      if (current.parentQuestionId) {
        current = this.getQuestionById(current.parentQuestionId);
      } else {
        break;
      }
    }

    return path;
  }
}

// Create singleton instance
export const questionService = new QuestionService();
