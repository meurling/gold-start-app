import { QuestionAnswer } from "@/lib/types";
import { Question } from "./types";
import { AnswerService } from "@/lib/answer";
import { openaiService } from "@/lib/openai";
import { debugLogger, logQuestionAnalysis, logError } from "@/lib/debug";
import { createStorageService } from "@/lib/storage";

export interface QuestionAnalysisResult {
  questionId: string;
  answers: QuestionAnswer[];
  isAnswered: boolean;
}

export interface BulkAnalysisResult {
  results: QuestionAnalysisResult[];
  totalAnalyzed: number;
  answeredCount: number;
  unansweredCount: number;
}

export class QuestionAnalyzerService {
  private answerService: AnswerService;
  private questionAnswerStorage = createStorageService<QuestionAnswer>('basic/QUESTION_ANSWERS');

  constructor() {
    this.answerService = new AnswerService();
  }

  /**
   * Analyzes a single question to determine if it has answers
   */
  async analyzeQuestion(
    question: Question,
    projectId: string
  ): Promise<QuestionAnalysisResult> {
    logQuestionAnalysis('analyzeQuestion_start', question.id, projectId, {
      questionContent: question.content,
      questionCategory: question.category,
      questionStakeholder: question.stakeholder
    });

    try {
      // Search for relevant documents using the answer service
      debugLogger.debug('Searching for relevant documents', { 
        component: 'QuestionAnalyzer', 
        operation: 'analyzeQuestion',
        questionId: question.id,
        projectId
      }, { query: question.content, limit: 10 });

      const searchResults = await this.answerService.searchDocuments(
        projectId,
        question.content,
        10 // Get more results for better analysis
      );

      debugLogger.info('Document search completed for question analysis', { 
        component: 'QuestionAnalyzer', 
        operation: 'analyzeQuestion',
        questionId: question.id,
        projectId
      }, { 
        searchResultCount: searchResults.length,
        searchResults: searchResults.map(r => ({
          chunkId: r.chunk?.id,
          documentId: r.chunk?.documentId,
          score: r.score,
          contentPreview: r.chunk?.content?.substring(0, 100) + '...'
        }))
      });

      if (searchResults.length === 0) {
        logQuestionAnalysis('analyzeQuestion_no_results', question.id, projectId, {
          questionContent: question.content
        });
        return {
          questionId: question.id,
          answers: [],
          isAnswered: false,
        };
      }

      // Use OpenAI to analyze if the question is answered by the search results
      debugLogger.debug('Starting OpenAI analysis', { 
        component: 'QuestionAnalyzer', 
        operation: 'analyzeQuestion',
        questionId: question.id,
        projectId
      });

      const answers = await this.analyzeWithOpenAI(question, searchResults);

      // Persist answers to storage
      if (answers.length > 0) {
        try {
          // First, remove any existing answers for this question
          const existingAnswers = await this.questionAnswerStorage.getAll();
          if (existingAnswers.success && existingAnswers.data) {
            const answersToDelete = existingAnswers.data.filter(a => a.questionId === question.id);
            for (const answer of answersToDelete) {
              await this.questionAnswerStorage.delete(answer.id);
            }
          }

          // Then, save the new answers
          for (const answer of answers) {
            await this.questionAnswerStorage.create({
              questionId: answer.questionId,
              content: answer.content,
              documentId: answer.documentId,
              compliant: answer.compliant
            });
          }

          debugLogger.info('Question answers persisted to storage', { 
            component: 'QuestionAnalyzer', 
            operation: 'analyzeQuestion',
            questionId: question.id,
            projectId
          }, { 
            answerCount: answers.length,
            compliantCount: answers.filter(a => a.compliant).length,
            nonCompliantCount: answers.filter(a => !a.compliant).length,
            answers: answers.map(a => ({ id: a.id, documentId: a.documentId, compliant: a.compliant }))
          });
        } catch (error) {
          logError('QuestionAnalyzer', 'analyzeQuestion', error, {
            component: 'QuestionAnalyzer',
            operation: 'persistAnswers',
            questionId: question.id,
            projectId
          });
          // Continue even if persistence fails
        }
      }

      const result = {
        questionId: question.id,
        answers,
        isAnswered: answers.length > 0,
      };

      logQuestionAnalysis('analyzeQuestion_completed', question.id, projectId, {
        questionContent: question.content,
        answerCount: answers.length,
        compliantCount: answers.filter(a => a.compliant).length,
        nonCompliantCount: answers.filter(a => !a.compliant).length,
        isAnswered: result.isAnswered,
        answers: answers.map(a => ({
          id: a.id,
          documentId: a.documentId,
          compliant: a.compliant,
          contentPreview: a.content.substring(0, 100) + '...'
        }))
      });

      return result;
    } catch (error) {
      logError('QuestionAnalyzer', 'analyzeQuestion', error, {
        component: 'QuestionAnalyzer',
        operation: 'analyzeQuestion',
        questionId: question.id,
        projectId
      });
      throw new Error(`Failed to analyze question: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Analyzes multiple questions in bulk
   */
  async analyzeQuestions(
    questions: Question[],
    projectId: string
  ): Promise<BulkAnalysisResult> {
    debugLogger.info('Starting bulk question analysis', { 
      component: 'QuestionAnalyzer', 
      operation: 'analyzeQuestions',
      projectId
    }, { 
      questionCount: questions.length,
      questionIds: questions.map(q => q.id)
    });

    const results: QuestionAnalysisResult[] = [];
    let answeredCount = 0;
    let unansweredCount = 0;

    for (const question of questions) {
      try {
        const result = await this.analyzeQuestion(question, projectId);
        results.push(result);
        
        if (result.isAnswered) {
          answeredCount++;
        } else {
          unansweredCount++;
        }
      } catch (error) {
        logError('QuestionAnalyzer', 'analyzeQuestions', error, {
          component: 'QuestionAnalyzer',
          operation: 'analyzeQuestions',
          questionId: question.id,
          projectId
        });
        // Add a failed result
        results.push({
          questionId: question.id,
          answers: [],
          isAnswered: false,
        });
        unansweredCount++;
      }
    }

    const bulkResult = {
      results,
      totalAnalyzed: questions.length,
      answeredCount,
      unansweredCount,
    };

    debugLogger.info('Bulk question analysis completed', { 
      component: 'QuestionAnalyzer', 
      operation: 'analyzeQuestions',
      projectId
    }, {
      totalAnalyzed: bulkResult.totalAnalyzed,
      answeredCount: bulkResult.answeredCount,
      unansweredCount: bulkResult.unansweredCount,
      successRate: `${Math.round((bulkResult.answeredCount / bulkResult.totalAnalyzed) * 100)}%`
    });

    return bulkResult;
  }

  /**
   * Uses OpenAI to determine if search results contain answers to the question
   */
  private async analyzeWithOpenAI(
    question: Question,
    searchResults: any[]
  ): Promise<QuestionAnswer[]> {
    debugLogger.debug('Starting OpenAI analysis', { 
      component: 'QuestionAnalyzer', 
      operation: 'analyzeWithOpenAI',
      questionId: question.id
    }, {
      searchResultCount: searchResults.length,
      questionContent: question.content
    });

    try {
      const systemPrompt = `You are an expert at analyzing whether document chunks contain answers to specific questions and determining compliance.

Your task is to analyze the provided question and document chunks to determine which chunks (if any) contain answers to the question, and whether those answers are compliant.

For each chunk that contains an answer, you should extract the relevant content and determine if it's compliant.

IMPORTANT: Return ONLY valid JSON. Do not wrap your response in markdown code blocks or any other formatting.

Return your response as a JSON array of objects with the following structure:
[
  {
    "content": "The specific content from the document that answers the question",
    "documentId": "The document ID from the search result",
    "compliant": true/false
  }
]

If no chunks contain answers to the question, return an empty array [].

Compliance Guidelines:
- "compliant": true - The answer shows that the organization/entity is following the required standards, regulations, or best practices mentioned in the question
- "compliant": false - The answer shows that the organization/entity is NOT following the required standards, regulations, or best practices, or there are gaps/issues identified

Examples:
- Question: "Do we have a data privacy policy?" → Answer: "Yes, we have a comprehensive GDPR-compliant data privacy policy" → compliant: true
- Question: "Do we have a data privacy policy?" → Answer: "We are working on developing a data privacy policy" → compliant: false
- Question: "Are our financial records audited annually?" → Answer: "Yes, our financial records are audited by an independent firm every year" → compliant: true
- Question: "Are our financial records audited annually?" → Answer: "Our last audit was 2 years ago and we're overdue" → compliant: false

Guidelines:
- Only include chunks that directly answer the question or provide relevant information
- Extract the most relevant portion of the chunk content
- Be precise and concise in your extracted content
- If a chunk only partially answers the question, still include it but extract only the relevant part
- Determine compliance based on whether the answer indicates adherence to requirements
- Return ONLY the JSON array, no additional text or formatting`;

      const userPrompt = `Question: "${question.content}"

Document chunks to analyze:
${searchResults.map((result, index) => `
Chunk ${index + 1}:
Document ID: ${result.chunk?.documentId || result.documentId}
Content: ${result.chunk?.content || result.content}
Relevance Score: ${result.score}
`).join('\n')}

Please analyze these chunks and return the JSON array of answers as specified.`;

      debugLogger.debug('Sending request to OpenAI', { 
        component: 'QuestionAnalyzer', 
        operation: 'analyzeWithOpenAI',
        questionId: question.id
      }, {
        model: "gpt-4o-mini",
        temperature: 0.1,
        maxTokens: 2000,
        promptLength: userPrompt.length,
        systemPromptLength: systemPrompt.length
      });

      const response = await openaiService.prompt(userPrompt, {
        model: "gpt-4o-mini",
        systemMessage: systemPrompt,
        temperature: 0.1,
        maxTokens: 2000
      });

      debugLogger.debug('OpenAI response received', { 
        component: 'QuestionAnalyzer', 
        operation: 'analyzeWithOpenAI',
        questionId: question.id
      }, {
        success: response.success,
        hasData: !!response.data,
        error: response.error,
        responseLength: response.data?.length || 0
      });

      if (!response.success || !response.data) {
        logError('QuestionAnalyzer', 'analyzeWithOpenAI', response.error, {
          component: 'QuestionAnalyzer',
          operation: 'analyzeWithOpenAI',
          questionId: question.id
        });
        throw new Error(response.error || "No response from OpenAI");
      }

      // Parse the JSON response
      let parsedResponse;
      try {
        // Clean the response data to handle markdown code blocks
        let cleanedResponse = response.data.trim();
        
        // Remove markdown code blocks if present
        if (cleanedResponse.startsWith('```json')) {
          cleanedResponse = cleanedResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (cleanedResponse.startsWith('```')) {
          cleanedResponse = cleanedResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }
        
        parsedResponse = JSON.parse(cleanedResponse);
        debugLogger.debug('OpenAI response parsed successfully', { 
          component: 'QuestionAnalyzer', 
          operation: 'analyzeWithOpenAI',
          questionId: question.id
        }, { parsedResponse });
      } catch (parseError) {
        logError('QuestionAnalyzer', 'analyzeWithOpenAI', parseError, {
          component: 'QuestionAnalyzer',
          operation: 'analyzeWithOpenAI',
          questionId: question.id,
          rawResponse: response.data
        });
        throw new Error(`Failed to parse OpenAI response: ${parseError}`);
      }

      const answers = Array.isArray(parsedResponse) ? parsedResponse : parsedResponse.answers || [];

      debugLogger.info('OpenAI analysis completed', { 
        component: 'QuestionAnalyzer', 
        operation: 'analyzeWithOpenAI',
        questionId: question.id
      }, {
        answerCount: answers.length,
        compliantCount: answers.filter((a: any) => a.compliant).length,
        nonCompliantCount: answers.filter((a: any) => !a.compliant).length,
        answers: answers.map((a: any) => ({
          documentId: a.documentId,
          compliant: a.compliant,
          contentPreview: a.content?.substring(0, 100) + '...'
        }))
      });

      // Convert to QuestionAnswer format
      return answers.map((answer: any) => ({
        id: crypto.randomUUID(),
        questionId: question.id,
        content: answer.content,
        documentId: answer.documentId,
        compliant: answer.compliant ?? false, // Default to false if not specified
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

    } catch (error) {
      logError('QuestionAnalyzer', 'analyzeWithOpenAI', error, {
        component: 'QuestionAnalyzer',
        operation: 'analyzeWithOpenAI',
        questionId: question.id
      });
      throw new Error(`OpenAI analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Checks if a question has any answers (without full analysis)
   */
  async hasAnswers(question: Question, projectId: string): Promise<boolean> {
    debugLogger.debug('Checking if question has answers', { 
      component: 'QuestionAnalyzer', 
      operation: 'hasAnswers',
      questionId: question.id,
      projectId
    }, { questionContent: question.content });

    try {
      const searchResults = await this.answerService.searchDocuments(
        projectId,
        question.content,
        5
      );
      
      const hasAnswers = searchResults.length > 0;
      
      debugLogger.info('Question answer check completed', { 
        component: 'QuestionAnalyzer', 
        operation: 'hasAnswers',
        questionId: question.id,
        projectId
      }, { 
        hasAnswers,
        searchResultCount: searchResults.length
      });
      
      return hasAnswers;
    } catch (error) {
      logError('QuestionAnalyzer', 'hasAnswers', error, {
        component: 'QuestionAnalyzer',
        operation: 'hasAnswers',
        questionId: question.id,
        projectId
      });
      return false;
    }
  }
}
