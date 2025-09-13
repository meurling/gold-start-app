import { useState, useCallback, useEffect } from 'react';
import { QuestionAnalyzerService, QuestionAnalysisResult, BulkAnalysisResult } from '@/lib/services/questionAnalyzer';
import { Question } from '@/lib/services/question/types';
import { QuestionAnswer } from '@/lib/types';
import { useQuestionAnswers } from './useStorage';

export interface UseQuestionAnalyzerReturn {
  // State
  analyzing: boolean;
  isInitialized: boolean;
  analysisResults: Map<string, QuestionAnalysisResult>;
  answers: Map<string, QuestionAnswer[]>;
  
  // Actions
  analyzeQuestion: (question: Question, projectId: string) => Promise<QuestionAnalysisResult>;
  analyzeQuestions: (questions: Question[], projectId: string) => Promise<BulkAnalysisResult>;
  hasAnswers: (question: Question, projectId: string) => Promise<boolean>;
  clearResults: () => void;
  refreshAnswers: () => Promise<void>;
  
  // Utilities
  isQuestionAnswered: (questionId: string) => boolean;
  getQuestionAnswers: (questionId: string) => QuestionAnswer[];
}

export function useQuestionAnalyzer(): UseQuestionAnalyzerReturn {
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<Map<string, QuestionAnalysisResult>>(new Map());
  const [isInitialized, setIsInitialized] = useState(false);
  
  const analyzerService = new QuestionAnalyzerService();
  const { data: questionAnswers, loading: answersLoading, refresh: refreshQuestionAnswers } = useQuestionAnswers();

  // Storage key for persisting analysis results
  const STORAGE_KEY = 'question-analysis-results';

  // Load analysis results from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsedData = JSON.parse(stored);
        const resultsMap = new Map<string, QuestionAnalysisResult>();
        
        // Convert the stored data back to Maps
        Object.entries(parsedData.results || {}).forEach(([questionId, result]) => {
          const analysisResult = result as QuestionAnalysisResult;
          
          // Convert date strings back to Date objects for answers
          const answersWithDates = analysisResult.answers.map(answer => ({
            ...answer,
            createdAt: new Date(answer.createdAt),
            updatedAt: new Date(answer.updatedAt)
          }));
          
          const processedResult = {
            ...analysisResult,
            answers: answersWithDates
          };
          
          resultsMap.set(questionId, processedResult);
        });
        
        console.log('Loaded analysis results from localStorage:', {
          totalResults: resultsMap.size,
          questionIds: Array.from(resultsMap.keys()),
          sampleResult: resultsMap.size > 0 ? resultsMap.values().next().value : null
        });
        
        setAnalysisResults(resultsMap);
      }
    } catch (error) {
      console.error('Failed to load analysis results from storage:', error);
    }
  }, []);

  // Initialize when both analysis results and question answers are loaded
  useEffect(() => {
    if (!answersLoading) {
      setIsInitialized(true);
      console.log('Question analyzer initialized with answers:', {
        totalAnswers: questionAnswers.length,
        answersByQuestion: questionAnswers.reduce((acc, answer) => {
          acc[answer.questionId] = (acc[answer.questionId] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      });
    }
  }, [answersLoading, questionAnswers]);

  // Save analysis results to localStorage whenever they change
  useEffect(() => {
    try {
      const dataToStore = {
        results: Object.fromEntries(analysisResults),
        timestamp: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToStore));
    } catch (error) {
      console.error('Failed to save analysis results to storage:', error);
    }
  }, [analysisResults]);

  const analyzeQuestion = useCallback(async (question: Question, projectId: string): Promise<QuestionAnalysisResult> => {
    setAnalyzing(true);
    try {
      const result = await analyzerService.analyzeQuestion(question, projectId);
      
      // Update analysis results state
      setAnalysisResults(prev => new Map(prev).set(question.id, result));
      
      // Refresh question answers to update UI immediately
      await refreshQuestionAnswers();
      
      console.log('Question analysis completed and answers refreshed:', {
        questionId: question.id,
        isAnswered: result.isAnswered,
        answerCount: result.answers.length
      });
      
      return result;
    } finally {
      setAnalyzing(false);
    }
  }, [analyzerService, refreshQuestionAnswers]);

  const analyzeQuestions = useCallback(async (questions: Question[], projectId: string): Promise<BulkAnalysisResult> => {
    setAnalyzing(true);
    try {
      const result = await analyzerService.analyzeQuestions(questions, projectId);
      
      // Update state with all results
      const newAnalysisResults = new Map(analysisResults);
      
      result.results.forEach(questionResult => {
        newAnalysisResults.set(questionResult.questionId, questionResult);
      });
      
      setAnalysisResults(newAnalysisResults);
      
      // Refresh question answers to update UI immediately
      await refreshQuestionAnswers();
      
      console.log('Bulk question analysis completed and answers refreshed:', {
        totalAnalyzed: result.totalAnalyzed,
        answeredCount: result.answeredCount,
        unansweredCount: result.unansweredCount
      });
      
      return result;
    } finally {
      setAnalyzing(false);
    }
  }, [analyzerService, analysisResults, refreshQuestionAnswers]);

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
    // Also clear from localStorage
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear analysis results from storage:', error);
    }
  }, [STORAGE_KEY]);

  const isQuestionAnswered = useCallback((questionId: string): boolean => {
    // If not initialized yet, return false to avoid showing incorrect state
    if (!isInitialized) {
      return false;
    }
    
    // Check if there are answers in the main storage system
    const hasAnswers = questionAnswers.some(answer => answer.questionId === questionId);
    
    // Debug logging
    console.log(`isQuestionAnswered(${questionId}):`, {
      isInitialized,
      hasAnswers,
      totalAnswers: questionAnswers.length,
      answersForQuestion: questionAnswers.filter(a => a.questionId === questionId).length
    });
    
    return hasAnswers;
  }, [isInitialized, questionAnswers]);

  const getQuestionAnswers = useCallback((questionId: string): QuestionAnswer[] => {
    return questionAnswers.filter(answer => answer.questionId === questionId);
  }, [questionAnswers]);

  return {
    analyzing,
    isInitialized,
    analysisResults,
    answers: new Map(), // Keep for backward compatibility but not used
    analyzeQuestion,
    analyzeQuestions,
    hasAnswers,
    clearResults,
    refreshAnswers: refreshQuestionAnswers,
    isQuestionAnswered,
    getQuestionAnswers,
  };
}
