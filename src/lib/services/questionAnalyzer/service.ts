import { QuestionAnswer } from "@/lib/types";
import { Question } from "./types";
import { AnswerService } from "@/lib/answer";
import { openaiService } from "@/lib/openai";

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
    try {
      // Search for relevant documents using the answer service
      const searchResults = await this.answerService.searchDocuments(
        projectId,
        question.content,
        10 // Get more results for better analysis
      );

      if (searchResults.length === 0) {
        return {
          questionId: question.id,
          answers: [],
          isAnswered: false,
        };
      }

      // Use OpenAI to analyze if the question is answered by the search results
      const answers = await this.analyzeWithOpenAI(question, searchResults);

      return {
        questionId: question.id,
        answers,
        isAnswered: answers.length > 0,
      };
    } catch (error) {
      console.error("Error analyzing question:", error);
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
        console.error(`Error analyzing question ${question.id}:`, error);
        // Add a failed result
        results.push({
          questionId: question.id,
          answers: [],
          isAnswered: false,
        });
        unansweredCount++;
      }
    }

    return {
      results,
      totalAnalyzed: questions.length,
      answeredCount,
      unansweredCount,
    };
  }

  /**
   * Uses OpenAI to determine if search results contain answers to the question
   */
  private async analyzeWithOpenAI(
    question: Question,
    searchResults: any[]
  ): Promise<QuestionAnswer[]> {
    try {
      const systemPrompt = `You are an expert at analyzing whether document chunks contain answers to specific questions.

Your task is to analyze the provided question and document chunks to determine which chunks (if any) contain answers to the question.

For each chunk that contains an answer, you should extract the relevant content that answers the question.

Return your response as a JSON array of objects with the following structure:
[
  {
    "content": "The specific content from the document that answers the question",
    "documentId": "The document ID from the search result"
  }
]

If no chunks contain answers to the question, return an empty array [].

Guidelines:
- Only include chunks that directly answer the question or provide relevant information
- Extract the most relevant portion of the chunk content
- Be precise and concise in your extracted content
- If a chunk only partially answers the question, still include it but extract only the relevant part`;

      const userPrompt = `Question: "${question.content}"

Document chunks to analyze:
${searchResults.map((result, index) => `
Chunk ${index + 1}:
Document ID: ${result.documentId}
Content: ${result.content}
Relevance Score: ${result.score}
`).join('\n')}

Please analyze these chunks and return the JSON array of answers as specified.`;

      const response = await openaiService.prompt(userPrompt, {
        model: "gpt-4o-mini",
        systemMessage: systemPrompt,
        temperature: 0.1,
        maxTokens: 2000
      });

      if (!response.success || !response.data) {
        throw new Error(response.error || "No response from OpenAI");
      }

      // Parse the JSON response
      const parsedResponse = JSON.parse(response.data);
      const answers = Array.isArray(parsedResponse) ? parsedResponse : parsedResponse.answers || [];

      // Convert to QuestionAnswer format
      return answers.map((answer: any) => ({
        id: crypto.randomUUID(),
        questionId: question.id,
        content: answer.content,
        documentId: answer.documentId,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

    } catch (error) {
      console.error("Error in OpenAI analysis:", error);
      throw new Error(`OpenAI analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Checks if a question has any answers (without full analysis)
   */
  async hasAnswers(question: Question, projectId: string): Promise<boolean> {
    try {
      const searchResults = await this.answerService.searchDocuments(
        projectId,
        question.content,
        5
      );
      return searchResults.length > 0;
    } catch (error) {
      console.error("Error checking if question has answers:", error);
      return false;
    }
  }
}
