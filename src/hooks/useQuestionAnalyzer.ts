import { useState, useCallback } from 'react';
import { QuestionAnalyzerService, QuestionAnalysisResult, BulkAnalysisResult } from '@/lib/services/questionAnalyzer';
import { Question } from '@/lib/services/question/types';
import { QuestionAnswer } from '@/lib/types';

export interface UseQuestionAnalyzerReturn {
  // State
  analyzing: boolean;
  analysisResults: Map<string, QuestionAnalysisResult>;
  answers: Map<string, QuestionAnswer[]>;
  
  // Actions
  analyzeQuestion: (question: Question, projectId: string) => Promise<QuestionAnalysisResult>;
  analyzeQuestions: (questions: Question[], projectId: string) => Promise<BulkAnalysisResult>;
  hasAnswers: (question: Question, projectId: string) => Promise<boolean>;
  clearResults: () => void;
  
  // Utilities
  isQuestionAnswered: (questionId: string) => boolean;
  getQuestionAnswers: (questionId: string) => QuestionAnswer[];
}

export function useQuestionAnalyzer(): UseQuestionAnalyzerReturn {
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<Map<string, QuestionAnalysisResult>>(new Map());
  const [answers, setAnswers] = useState<Map<string, QuestionAnswer[]>>(new Map());
  
  const analyzerService = new QuestionAnalyzerService();

  const analyzeQuestion = useCallback(async (question: Question, projectId: string): Promise<QuestionAnalysisResult> => {
    setAnalyzing(true);
    try {
      const result = await analyzerService.analyzeQuestion(question, projectId);
      
      // Update state
      setAnalysisResults(prev => new Map(prev).set(question.id, result));
      setAnswers(prev => new Map(prev).set(question.id, result.answers));
      
      return result;
    } finally {
      setAnalyzing(false);
    }
  }, [analyzerService]);

  const analyzeQuestions = useCallback(async (questions: Question[], projectId: string): Promise<BulkAnalysisResult> => {
    setAnalyzing(true);
    try {
      const result = await analyzerService.analyzeQuestions(questions, projectId);
      
      // Update state with all results
      const newAnalysisResults = new Map(analysisResults);
      const newAnswers = new Map(answers);
      
      result.results.forEach(questionResult => {
        newAnalysisResults.set(questionResult.questionId, questionResult);
        newAnswers.set(questionResult.questionId, questionResult.answers);
      });
      
      setAnalysisResults(newAnalysisResults);
      setAnswers(newAnswers);
      
      return result;
    } finally {
      setAnalyzing(false);
    }
  }, [analyzerService, analysisResults, answers]);

  const hasAnswers = useCallback(async (question: Question, projectId: string): Promise<boolean> => {
    try {
      return await analyzerService.hasAnswers(question, projectId);
    } catch (error) {
      console.error('Error checking if question has answers:', error);
      return false;
    }
  }, [analyzerService]);

  const clearResults = useCallback(() => {
    setAnalysisResults(new Map());
    setAnswers(new Map());
  }, []);

  const isQuestionAnswered = useCallback((questionId: string): boolean => {
    const result = analysisResults.get(questionId);
    return result?.isAnswered ?? false;
  }, [analysisResults]);

  const getQuestionAnswers = useCallback((questionId: string): QuestionAnswer[] => {
    return answers.get(questionId) ?? [];
  }, [answers]);

  return {
    analyzing,
    analysisResults,
    answers,
    analyzeQuestion,
    analyzeQuestions,
    hasAnswers,
    clearResults,
    isQuestionAnswered,
    getQuestionAnswers,
  };
}
