import { openaiService } from '@/lib/openai';
import { QuestionCategory, Stakeholder } from '@/lib/services/question/types';
import { Document, ProcessingStatus } from '@/lib/types';

// Debug utility to log question parsing details
function debugQuestionParsing(question: any, index: number) {
  console.log(`Debug Question ${index + 1}:`, {
    rawQuestion: question,
    content: question?.content,
    contentType: typeof question?.content,
    contentLength: question?.content?.length,
    category: question?.category,
    stakeholder: question?.stakeholder,
    hasReasoning: !!question?.reasoning
  });
}

// Interface for parsed questions from OpenAI
export interface ParsedQuestion {
  content: string;
  category: QuestionCategory;
  stakeholder: Stakeholder;
  reasoning?: string; // Why this question was identified
}

// Interface for OpenAI response
export interface DocumentProcessingResponse {
  questions: ParsedQuestion[];
  summary?: string;
  confidence?: number;
}

export class DocumentProcessor {
  private openai = openaiService;

  // Process a document and extract questions
  async processDocument(document: Document): Promise<{
    success: boolean;
    questions?: ParsedQuestion[];
    error?: string;
  }> {
    if (!this.openai.isConfigured()) {
      return {
        success: false,
        error: 'OpenAI API key not configured. Please set VITE_OPENAI_API_KEY environment variable.'
      };
    }

    if (!document.rawText || document.rawText.trim().length === 0) {
      return {
        success: false,
        error: 'Document has no text content to process'
      };
    }

    try {
      const systemPrompt = this.createSystemPrompt();
      const userPrompt = this.createUserPrompt(document);

      const result = await this.openai.prompt(userPrompt, {
        model: 'gpt-4',
        maxTokens: 2000,
        temperature: 0.3,
        systemMessage: systemPrompt
      });

      if (!result.success || !result.data) {
        return {
          success: false,
          error: result.error || 'Failed to process document with OpenAI'
        };
      }

      // Parse the JSON response
      const parsedResponse = this.parseOpenAIResponse(result.data);
      
      return {
        success: true,
        questions: parsedResponse.questions
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred during processing'
      };
    }
  }

  private createSystemPrompt(): string {
    return `You are an expert at analyzing business documents and extracting relevant questions that stakeholders might have.

Your task is to analyze the provided document and extract 5-15 relevant questions that different stakeholders might ask about the content.

For each question, you must:
1. Write a clear, specific question
2. Assign an appropriate category from the available categories
3. Assign the most relevant stakeholder who would ask this question
4. Provide brief reasoning for why this question is important

Available Categories:
- ${Object.values(QuestionCategory).join(', ')}

Available Stakeholders:
- ${Object.values(Stakeholder).join(', ')}

Return your response as a JSON object with this exact structure:
{
  "questions": [
    {
      "content": "What is the specific question?",
      "category": "Category Name",
      "stakeholder": "Stakeholder Name",
      "reasoning": "Brief explanation of why this question is relevant"
    }
  ],
  "summary": "Brief summary of the document content",
  "confidence": 0.85
}

CRITICAL: 
- Return ONLY valid JSON, no markdown formatting or code blocks
- Each question's "content" must be a string containing the actual question text
- Use exact category and stakeholder names from the lists above
- Ensure all JSON is properly formatted and parseable

Focus on:
- Legal and compliance questions
- Operational questions
- Financial implications
- Risk management concerns
- Technology requirements
- Human resource considerations
- Strategic business questions

Make sure all questions are specific to the document content and would be valuable for business analysis.`;
  }

  private createUserPrompt(document: Document): string {
    return `Please analyze the following document and extract relevant questions:

Document: ${document.fileName}
Type: ${document.documentType}

Content:
${document.rawText}

Extract 5-15 relevant questions that different stakeholders might ask about this document. Focus on practical, actionable questions that would help with business analysis and decision-making.`;
  }

  private parseOpenAIResponse(response: string): DocumentProcessingResponse {
    try {
      // Clean the response first
      let cleanedResponse = response.trim();
      
      // Remove markdown code blocks if present
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      // Try to extract JSON from the response with better pattern matching
      let jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        // Try alternative patterns
        jsonMatch = cleanedResponse.match(/```json\s*(\{[\s\S]*?\})\s*```/);
        if (jsonMatch) {
          jsonMatch[0] = jsonMatch[1];
        }
      }
      
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      // Validate the response structure
      if (!parsed.questions || !Array.isArray(parsed.questions)) {
        throw new Error('Invalid response structure: missing questions array');
      }

      // Validate each question
      const validatedQuestions = parsed.questions.map((q: any, index: number) => {
        // Debug logging for each question
        debugQuestionParsing(q, index);
        
        // Enhanced validation with better error messages
        if (!q.content || typeof q.content !== 'string') {
          console.error(`Question ${index + 1} validation failed:`, {
            content: q.content,
            contentType: typeof q.content,
            fullQuestion: q
          });
          throw new Error(`Question ${index + 1}: missing or invalid content (got: ${typeof q.content})`);
        }
        
        if (!q.category || !Object.values(QuestionCategory).includes(q.category)) {
          console.error(`Question ${index + 1} category validation failed:`, {
            category: q.category,
            validCategories: Object.values(QuestionCategory),
            fullQuestion: q
          });
          throw new Error(`Question ${index + 1}: invalid category "${q.category}"`);
        }
        
        if (!q.stakeholder || !Object.values(Stakeholder).includes(q.stakeholder)) {
          console.error(`Question ${index + 1} stakeholder validation failed:`, {
            stakeholder: q.stakeholder,
            validStakeholders: Object.values(Stakeholder),
            fullQuestion: q
          });
          throw new Error(`Question ${index + 1}: invalid stakeholder "${q.stakeholder}"`);
        }

        // Clean and validate content
        const cleanContent = q.content.trim();
        if (cleanContent.length < 10) {
          throw new Error(`Question ${index + 1}: content too short (${cleanContent.length} characters)`);
        }

        return {
          content: cleanContent,
          category: q.category as QuestionCategory,
          stakeholder: q.stakeholder as Stakeholder,
          reasoning: q.reasoning || ''
        };
      });

      return {
        questions: validatedQuestions,
        summary: parsed.summary || '',
        confidence: parsed.confidence || 0.5
      };

    } catch (error) {
      console.error('Error parsing OpenAI response:', error);
      console.error('Raw response:', response);
      console.error('Cleaned response:', response.trim());
      
      // Try to identify the specific parsing issue
      if (error instanceof SyntaxError) {
        console.error('JSON Syntax Error - likely malformed JSON from OpenAI');
      } else if (error instanceof Error && error.message.includes('missing or invalid content')) {
        console.error('Content validation error - OpenAI returned invalid question content');
      } else if (error instanceof Error && error.message.includes('invalid category')) {
        console.error('Category validation error - OpenAI returned invalid category');
      } else if (error instanceof Error && error.message.includes('invalid stakeholder')) {
        console.error('Stakeholder validation error - OpenAI returned invalid stakeholder');
      }
      
      // Fallback: try to extract questions manually
      return this.fallbackQuestionExtraction(response);
    }
  }

  private fallbackQuestionExtraction(response: string): DocumentProcessingResponse {
    // Simple fallback that looks for question-like patterns
    const lines = response.split('\n').filter(line => line.trim());
    const questions: ParsedQuestion[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.includes('?') && trimmed.length > 20) {
        questions.push({
          content: trimmed,
          category: QuestionCategory.OTHER,
          stakeholder: Stakeholder.OTHER,
          reasoning: 'Extracted from fallback parsing'
        });
      }
    }

    return {
      questions: questions.slice(0, 10), // Limit to 10 questions
      summary: 'Document processed with fallback method',
      confidence: 0.3
    };
  }
}

// Export singleton instance
export const documentProcessor = new DocumentProcessor();
