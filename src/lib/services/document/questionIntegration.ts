import { ParsedQuestion } from './processor';
import { QuestionCategory, Stakeholder } from '@/lib/services/question/types';
import { useQuestionService } from '@/hooks/useQuestionService';

// Service to integrate parsed questions from documents into the questions system
export class QuestionIntegrationService {
  
  // Convert parsed questions to question service format and add them
  static async addParsedQuestionsToProject(
    parsedQuestions: ParsedQuestion[],
    userId: string,
    projectId: string,
    questionService: ReturnType<typeof useQuestionService>
  ): Promise<{
    success: boolean;
    addedCount: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    let addedCount = 0;

    for (const parsedQuestion of parsedQuestions) {
      try {
        await questionService.createQuestion({
          content: parsedQuestion.content,
          category: parsedQuestion.category,
          stakeholder: parsedQuestion.stakeholder,
          userId,
          projectId,
        });
        addedCount++;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Failed to add question "${parsedQuestion.content}": ${errorMessage}`);
      }
    }

    return {
      success: errors.length === 0,
      addedCount,
      errors
    };
  }

  // Validate parsed questions before adding them
  static validateParsedQuestions(parsedQuestions: ParsedQuestion[]): {
    valid: ParsedQuestion[];
    invalid: { question: ParsedQuestion; reason: string }[];
  } {
    const valid: ParsedQuestion[] = [];
    const invalid: { question: ParsedQuestion; reason: string }[] = [];

    for (const question of parsedQuestions) {
      const validation = this.validateSingleQuestion(question);
      if (validation.isValid) {
        valid.push(question);
      } else {
        invalid.push({
          question,
          reason: validation.reason
        });
      }
    }

    return { valid, invalid };
  }

  // Validate a single parsed question
  private static validateSingleQuestion(question: ParsedQuestion): {
    isValid: boolean;
    reason?: string;
  } {
    // Check content
    if (!question.content || question.content.trim().length === 0) {
      return { isValid: false, reason: 'Question content is empty' };
    }

    if (question.content.length < 10) {
      return { isValid: false, reason: 'Question content is too short' };
    }

    if (question.content.length > 500) {
      return { isValid: false, reason: 'Question content is too long' };
    }

    // Check category
    if (!question.category || !Object.values(QuestionCategory).includes(question.category)) {
      return { isValid: false, reason: 'Invalid category' };
    }

    // Check stakeholder
    if (!question.stakeholder || !Object.values(Stakeholder).includes(question.stakeholder)) {
      return { isValid: false, reason: 'Invalid stakeholder' };
    }

    // Check for duplicate content (basic check)
    if (question.content.toLowerCase().includes('test') || 
        question.content.toLowerCase().includes('example')) {
      return { isValid: false, reason: 'Question appears to be a test/example' };
    }

    return { isValid: true };
  }

  // Get statistics about parsed questions
  static getParsedQuestionsStats(parsedQuestions: ParsedQuestion[]): {
    total: number;
    byCategory: Record<string, number>;
    byStakeholder: Record<string, number>;
    averageLength: number;
  } {
    const stats = {
      total: parsedQuestions.length,
      byCategory: {} as Record<string, number>,
      byStakeholder: {} as Record<string, number>,
      averageLength: 0
    };

    let totalLength = 0;

    for (const question of parsedQuestions) {
      // Count by category
      stats.byCategory[question.category] = (stats.byCategory[question.category] || 0) + 1;
      
      // Count by stakeholder
      stats.byStakeholder[question.stakeholder] = (stats.byStakeholder[question.stakeholder] || 0) + 1;
      
      // Calculate average length
      totalLength += question.content.length;
    }

    stats.averageLength = parsedQuestions.length > 0 ? Math.round(totalLength / parsedQuestions.length) : 0;

    return stats;
  }
}
