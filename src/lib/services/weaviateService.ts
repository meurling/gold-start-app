import weaviate, { WeaviateClient, ApiKey } from 'weaviate-ts-client';
import {
  WeaviateConfig,
  WeaviateObject,
  WeaviateSearchResult,
  WeaviateSearchOptions,
  WeaviateCreateOptions,
  WeaviateUpdateOptions,
  WeaviateDeleteOptions,
  WeaviateBatchOptions,
  WeaviateSchema,
  WeaviateResponse,
  VectorizedQuestion,
  VectorizedAnswer,
  VectorizedProject,
  QuestionSearchResult,
  AnswerSearchResult,
  ProjectSearchResult,
} from './weaviateTypes';
import { Question, Answer, Project } from '@/lib/types';

export class WeaviateService {
  private client: WeaviateClient;
  private config: WeaviateConfig;

  constructor(config?: Partial<WeaviateConfig>) {
    this.config = {
      url: config?.url || import.meta.env.VITE_WEAVIATE_URL || 'yarqfmhuskukffrbfy3sw.c0.europe-west3.gcp.weaviate.cloud',
      apiKey: config?.apiKey || import.meta.env.VITE_WEAVIATE_API_KEY || '',
      scheme: config?.scheme || 'https',
    };

    if (!this.config.apiKey) {
      throw new Error('Weaviate API key is required. Please set VITE_WEAVIATE_API_KEY in your .env file.');
    }

    this.client = weaviate.client({
      scheme: this.config.scheme,
      host: this.config.url,
      apiKey: new ApiKey(this.config.apiKey),
    });
  }

  // Connection and health check methods
  async isReady(): Promise<boolean> {
    try {
      await this.client.misc.liveChecker().do();
      return true;
    } catch (error) {
      console.error('Weaviate connection failed:', error);
      return false;
    }
  }

  async getMeta(): Promise<any> {
    try {
      const response = await this.client.misc.metaGetter().do();
      return response;
    } catch (error) {
      console.error('Failed to get Weaviate meta:', error);
      throw error;
    }
  }

  // Schema management
  async createSchema(schema: WeaviateSchema): Promise<WeaviateResponse> {
    try {
      const response = await this.client.schema.classCreator().withClass(schema).do();
      return { data: response };
    } catch (error: any) {
      return {
        errors: [{
          message: error.message || 'Failed to create schema',
          code: error.code,
          details: error,
        }],
      };
    }
  }

  async getSchema(): Promise<WeaviateResponse> {
    try {
      const response = await this.client.schema.getter().do();
      return { data: response };
    } catch (error: any) {
      return {
        errors: [{
          message: error.message || 'Failed to get schema',
          code: error.code,
          details: error,
        }],
      };
    }
  }

  async deleteSchema(className: string): Promise<WeaviateResponse> {
    try {
      await this.client.schema.classDeleter().withClassName(className).do();
      return { data: { success: true } };
    } catch (error: any) {
      return {
        errors: [{
          message: error.message || 'Failed to delete schema',
          code: error.code,
          details: error,
        }],
      };
    }
  }

  // Object CRUD operations
  async createObject(
    className: string,
    object: WeaviateObject,
    options?: WeaviateCreateOptions
  ): Promise<WeaviateResponse> {
    try {
      const builder = this.client.data
        .creator()
        .withClassName(className)
        .withProperties(object.properties);

      if (options?.vector) {
        builder.withVector(options.vector);
      }

      if (options?.id) {
        builder.withId(options.id);
      }

      if (options?.consistencyLevel) {
        builder.withConsistencyLevel(options.consistencyLevel);
      }

      const response = await builder.do();
      return { data: response };
    } catch (error: any) {
      return {
        errors: [{
          message: error.message || 'Failed to create object',
          code: error.code,
          details: error,
        }],
      };
    }
  }

  async getObject(
    className: string,
    id: string,
    includeVector?: boolean
  ): Promise<WeaviateResponse> {
    try {
      const builder = this.client.data.getterById().withClassName(className).withId(id);
      
      if (includeVector) {
        builder.withVector();
      }

      const response = await builder.do();
      return { data: response };
    } catch (error: any) {
      return {
        errors: [{
          message: error.message || 'Failed to get object',
          code: error.code,
          details: error,
        }],
      };
    }
  }

  async updateObject(
    className: string,
    id: string,
    object: Partial<WeaviateObject>,
    options?: WeaviateUpdateOptions
  ): Promise<WeaviateResponse> {
    try {
      const builder = this.client.data
        .updater()
        .withClassName(className)
        .withId(id)
        .withProperties(object.properties || {});

      if (options?.vector) {
        builder.withVector(options.vector);
      }

      if (options?.consistencyLevel) {
        builder.withConsistencyLevel(options.consistencyLevel);
      }

      const response = await builder.do();
      return { data: response };
    } catch (error: any) {
      return {
        errors: [{
          message: error.message || 'Failed to update object',
          code: error.code,
          details: error,
        }],
      };
    }
  }

  async deleteObject(
    className: string,
    id: string,
    options?: WeaviateDeleteOptions
  ): Promise<WeaviateResponse> {
    try {
      const builder = this.client.data.deleter().withClassName(className).withId(id);

      if (options?.consistencyLevel) {
        builder.withConsistencyLevel(options.consistencyLevel);
      }

      await builder.do();
      return { data: { success: true } };
    } catch (error: any) {
      return {
        errors: [{
          message: error.message || 'Failed to delete object',
          code: error.code,
          details: error,
        }],
      };
    }
  }

  // Search operations
  async search(
    className: string,
    options: WeaviateSearchOptions = {}
  ): Promise<WeaviateResponse<WeaviateSearchResult[]>> {
    try {
      let builder = this.client.graphql
        .get()
        .withClassName(className)
        .withFields('_additional { id distance certainty score }');

      // Add properties to return
      if (options.returnProperties && options.returnProperties.length > 0) {
        builder = builder.withFields(options.returnProperties.join(' '));
      }

      // Add limit and offset
      if (options.limit) {
        builder = builder.withLimit(options.limit);
      }

      if (options.offset) {
        builder = builder.withOffset(options.offset);
      }

      // Add where filter
      if (options.where) {
        builder = builder.withWhere(options.where);
      }

      // Add near text search
      if (options.nearText) {
        builder = builder.withNearText(options.nearText);
      }

      // Add near vector search
      if (options.nearVector) {
        builder = builder.withNearVector(options.nearVector);
      }

      // Add near object search
      if (options.nearObject) {
        builder = builder.withNearObject(options.nearObject);
      }

      // Add sort
      if (options.sort && options.sort.length > 0) {
        builder = builder.withSort(options.sort);
      }

      // Add group by
      if (options.groupBy) {
        builder = builder.withGroupBy(options.groupBy);
      }

      // Add ask (Q&A)
      if (options.ask) {
        builder = builder.withAsk(options.ask);
      }

      // Add BM25
      if (options.bm25) {
        builder = builder.withBm25(options.bm25);
      }

      // Add hybrid search
      if (options.hybrid) {
        builder = builder.withHybrid(options.hybrid);
      }

      // Add generate
      if (options.generate) {
        builder = builder.withGenerate(options.generate);
      }

      // Add rerank
      if (options.rerank) {
        builder = builder.withRerank(options.rerank);
      }

      const response = await builder.do();
      return { data: response.data?.Get?.[className] || [] };
    } catch (error: any) {
      return {
        errors: [{
          message: error.message || 'Failed to search',
          code: error.code,
          details: error,
        }],
      };
    }
  }

  // Batch operations
  async batchCreate(
    className: string,
    objects: WeaviateObject[],
    options?: WeaviateBatchOptions
  ): Promise<WeaviateResponse> {
    try {
      const batcher = this.client.batch.objectsBatcher();

      objects.forEach((object) => {
        const builder = batcher.withObject({
          class: className,
          properties: object.properties,
          vector: object.vector,
          id: object.id,
        });

        if (options?.consistencyLevel) {
          builder.withConsistencyLevel(options.consistencyLevel);
        }
      });

      const response = await batcher.do();
      return { data: response };
    } catch (error: any) {
      return {
        errors: [{
          message: error.message || 'Failed to batch create',
          code: error.code,
          details: error,
        }],
      };
    }
  }

  // Application-specific methods for Questions
  async createQuestion(question: Question): Promise<WeaviateResponse> {
    const vectorizedQuestion: VectorizedQuestion = {
      properties: {
        content: question.content,
        category: question.category,
        stakeholder: question.stakeholder,
        parentQuestionId: question.parentQuestionId,
        rootQuestionId: question.rootQuestionId,
        userId: question.userId,
        projectId: question.projectId,
        createdAt: question.createdAt.toISOString(),
        updatedAt: question.updatedAt.toISOString(),
      },
    };

    return this.createObject('Question', vectorizedQuestion, { id: question.id });
  }

  async searchQuestions(
    query: string,
    projectId?: string,
    limit: number = 10
  ): Promise<WeaviateResponse<QuestionSearchResult[]>> {
    const searchOptions: WeaviateSearchOptions = {
      nearText: {
        concepts: [query],
        certainty: 0.7,
      },
      limit,
      returnProperties: [
        'content',
        'category',
        'stakeholder',
        'parentQuestionId',
        'rootQuestionId',
        'userId',
        'projectId',
        'createdAt',
        'updatedAt',
      ],
    };

    if (projectId) {
      searchOptions.where = {
        path: ['projectId'],
        operator: 'Equal',
        valueType: 'string',
        value: projectId,
      };
    }

    return this.search('Question', searchOptions);
  }

  async getQuestionById(id: string): Promise<WeaviateResponse> {
    return this.getObject('Question', id);
  }

  async updateQuestion(id: string, question: Partial<Question>): Promise<WeaviateResponse> {
    const updateData: Partial<VectorizedQuestion> = {
      properties: {
        content: question.content,
        category: question.category,
        stakeholder: question.stakeholder,
        parentQuestionId: question.parentQuestionId,
        rootQuestionId: question.rootQuestionId,
        updatedAt: new Date().toISOString(),
      },
    };

    return this.updateObject('Question', id, updateData);
  }

  async deleteQuestion(id: string): Promise<WeaviateResponse> {
    return this.deleteObject('Question', id);
  }

  // Application-specific methods for Answers
  async createAnswer(answer: Answer): Promise<WeaviateResponse> {
    const vectorizedAnswer: VectorizedAnswer = {
      properties: {
        questionId: answer.questionId,
        content: answer.content,
        authorId: answer.authorId,
        isAccepted: answer.isAccepted,
        upvotes: answer.upvotes,
        downvotes: answer.downvotes,
        createdAt: answer.createdAt.toISOString(),
        updatedAt: answer.updatedAt.toISOString(),
      },
    };

    return this.createObject('Answer', vectorizedAnswer, { id: answer.id });
  }

  async searchAnswers(
    query: string,
    questionId?: string,
    limit: number = 10
  ): Promise<WeaviateResponse<AnswerSearchResult[]>> {
    const searchOptions: WeaviateSearchOptions = {
      nearText: {
        concepts: [query],
        certainty: 0.7,
      },
      limit,
      returnProperties: [
        'questionId',
        'content',
        'authorId',
        'isAccepted',
        'upvotes',
        'downvotes',
        'createdAt',
        'updatedAt',
      ],
    };

    if (questionId) {
      searchOptions.where = {
        path: ['questionId'],
        operator: 'Equal',
        valueType: 'string',
        value: questionId,
      };
    }

    return this.search('Answer', searchOptions);
  }

  // Application-specific methods for Projects
  async createProject(project: Project): Promise<WeaviateResponse> {
    const vectorizedProject: VectorizedProject = {
      properties: {
        name: project.name,
        description: project.description,
        isActive: project.isActive,
        createdAt: project.createdAt.toISOString(),
        updatedAt: project.updatedAt.toISOString(),
      },
    };

    return this.createObject('Project', vectorizedProject, { id: project.id });
  }

  async searchProjects(
    query: string,
    limit: number = 10
  ): Promise<WeaviateResponse<ProjectSearchResult[]>> {
    const searchOptions: WeaviateSearchOptions = {
      nearText: {
        concepts: [query],
        certainty: 0.7,
      },
      limit,
      returnProperties: ['name', 'description', 'isActive', 'createdAt', 'updatedAt'],
    };

    return this.search('Project', searchOptions);
  }

  // Initialize schemas for the application
  async initializeSchemas(): Promise<WeaviateResponse> {
    const schemas: WeaviateSchema[] = [
      {
        class: 'Question',
        description: 'Questions with vector embeddings for semantic search',
        vectorizer: 'text2vec-openai',
        moduleConfig: {
          'text2vec-openai': {
            model: 'ada',
            modelVersion: '002',
            type: 'text',
          },
        },
        properties: [
          {
            name: 'content',
            dataType: ['text'],
            description: 'The question content',
            indexInverted: true,
            indexSearchable: true,
          },
          {
            name: 'category',
            dataType: ['string'],
            description: 'Question category',
            indexInverted: true,
            indexFilterable: true,
          },
          {
            name: 'stakeholder',
            dataType: ['string'],
            description: 'Target stakeholder',
            indexInverted: true,
            indexFilterable: true,
          },
          {
            name: 'parentQuestionId',
            dataType: ['string'],
            description: 'Parent question ID for hierarchical structure',
            indexInverted: true,
            indexFilterable: true,
          },
          {
            name: 'rootQuestionId',
            dataType: ['string'],
            description: 'Root question ID for hierarchical structure',
            indexInverted: true,
            indexFilterable: true,
          },
          {
            name: 'userId',
            dataType: ['string'],
            description: 'User who created the question',
            indexInverted: true,
            indexFilterable: true,
          },
          {
            name: 'projectId',
            dataType: ['string'],
            description: 'Project this question belongs to',
            indexInverted: true,
            indexFilterable: true,
          },
          {
            name: 'createdAt',
            dataType: ['date'],
            description: 'Creation timestamp',
            indexInverted: true,
            indexFilterable: true,
          },
          {
            name: 'updatedAt',
            dataType: ['date'],
            description: 'Last update timestamp',
            indexInverted: true,
            indexFilterable: true,
          },
        ],
      },
      {
        class: 'Answer',
        description: 'Answers with vector embeddings for semantic search',
        vectorizer: 'text2vec-openai',
        moduleConfig: {
          'text2vec-openai': {
            model: 'ada',
            modelVersion: '002',
            type: 'text',
          },
        },
        properties: [
          {
            name: 'questionId',
            dataType: ['string'],
            description: 'The question this answer belongs to',
            indexInverted: true,
            indexFilterable: true,
          },
          {
            name: 'content',
            dataType: ['text'],
            description: 'The answer content',
            indexInverted: true,
            indexSearchable: true,
          },
          {
            name: 'authorId',
            dataType: ['string'],
            description: 'User who wrote the answer',
            indexInverted: true,
            indexFilterable: true,
          },
          {
            name: 'isAccepted',
            dataType: ['boolean'],
            description: 'Whether this answer is accepted',
            indexInverted: true,
            indexFilterable: true,
          },
          {
            name: 'upvotes',
            dataType: ['int'],
            description: 'Number of upvotes',
            indexInverted: true,
            indexFilterable: true,
          },
          {
            name: 'downvotes',
            dataType: ['int'],
            description: 'Number of downvotes',
            indexInverted: true,
            indexFilterable: true,
          },
          {
            name: 'createdAt',
            dataType: ['date'],
            description: 'Creation timestamp',
            indexInverted: true,
            indexFilterable: true,
          },
          {
            name: 'updatedAt',
            dataType: ['date'],
            description: 'Last update timestamp',
            indexInverted: true,
            indexFilterable: true,
          },
        ],
      },
      {
        class: 'Project',
        description: 'Projects with vector embeddings for semantic search',
        vectorizer: 'text2vec-openai',
        moduleConfig: {
          'text2vec-openai': {
            model: 'ada',
            modelVersion: '002',
            type: 'text',
          },
        },
        properties: [
          {
            name: 'name',
            dataType: ['text'],
            description: 'Project name',
            indexInverted: true,
            indexSearchable: true,
          },
          {
            name: 'description',
            dataType: ['text'],
            description: 'Project description',
            indexInverted: true,
            indexSearchable: true,
          },
          {
            name: 'isActive',
            dataType: ['boolean'],
            description: 'Whether the project is active',
            indexInverted: true,
            indexFilterable: true,
          },
          {
            name: 'createdAt',
            dataType: ['date'],
            description: 'Creation timestamp',
            indexInverted: true,
            indexFilterable: true,
          },
          {
            name: 'updatedAt',
            dataType: ['date'],
            description: 'Last update timestamp',
            indexInverted: true,
            indexFilterable: true,
          },
        ],
      },
    ];

    const results: WeaviateResponse[] = [];
    
    for (const schema of schemas) {
      const result = await this.createSchema(schema);
      results.push(result);
    }

    return {
      data: results,
    };
  }
}

// Create singleton instance
export const weaviateService = new WeaviateService();
