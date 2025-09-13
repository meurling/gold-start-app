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
  } {
    const questions = projectId ? this.getQuestionsByProject(projectId) : this.questions;
    console.log('QuestionService: getQuestionStats called with projectId:', projectId, 'questions:', questions);
    
    const stats = {
      total: questions.length,
      byCategory: {} as Record<QuestionCategory, number>,
      byStakeholder: {} as Record<Stakeholder, number>,
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


    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Check if question can be deleted
  canDeleteQuestion(questionId: string): boolean {
    return true; // All questions can be deleted now
  }
}

// Create singleton instance
export const questionService = new QuestionService();
