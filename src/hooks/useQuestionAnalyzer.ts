import { useState, useCallback, useEffect } from 'react';
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

  // Storage key for persisting analysis results
  const STORAGE_KEY = 'question-analysis-results';

  // Load analysis results from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsedData = JSON.parse(stored);
        const resultsMap = new Map<string, QuestionAnalysisResult>();
        const answersMap = new Map<string, QuestionAnswer[]>();
        
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
          answersMap.set(questionId, answersWithDates);
        });
        
        console.log('Loaded analysis results from localStorage:', {
          totalResults: resultsMap.size,
          questionIds: Array.from(resultsMap.keys()),
          sampleResult: resultsMap.size > 0 ? resultsMap.values().next().value : null
        });
        
        setAnalysisResults(resultsMap);
        setAnswers(answersMap);
      }
    } catch (error) {
      console.error('Failed to load analysis results from storage:', error);
    }
  }, []);

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
    // Also clear from localStorage
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear analysis results from storage:', error);
    }
  }, [STORAGE_KEY]);

  const isQuestionAnswered = useCallback((questionId: string): boolean => {
    const result = analysisResults.get(questionId);
    const isAnswered = result?.isAnswered ?? false;
    
    // Debug logging
    console.log(`isQuestionAnswered(${questionId}):`, {
      hasResult: !!result,
      isAnswered,
      answersCount: result?.answers?.length || 0
    });
    
    return isAnswered;
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
