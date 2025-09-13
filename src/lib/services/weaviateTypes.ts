// Weaviate-specific types and interfaces

export interface WeaviateConfig {
  url: string;
  apiKey: string;
  scheme?: 'http' | 'https';
}

export interface WeaviateObject {
  id?: string;
  class?: string;
  properties: Record<string, any>;
  vector?: number[];
  creationTimeUnix?: number;
  lastUpdateTimeUnix?: number;
}

export interface WeaviateSearchResult {
  id: string;
  properties: Record<string, any>;
  vector?: number[];
  distance?: number;
  certainty?: number;
  score?: number;
}

export interface WeaviateSearchOptions {
  limit?: number;
  offset?: number;
  where?: WeaviateWhereFilter;
  nearText?: WeaviateNearTextFilter;
  nearVector?: WeaviateNearVectorFilter;
  nearObject?: WeaviateNearObjectFilter;
  sort?: WeaviateSort[];
  groupBy?: WeaviateGroupBy;
  ask?: WeaviateAskFilter;
  bm25?: WeaviateBM25Filter;
  hybrid?: WeaviateHybridFilter;
  generate?: WeaviateGenerate;
  rerank?: WeaviateRerank;
  returnMetadata?: string[];
  returnProperties?: string[];
  autocut?: number;
  alpha?: number;
  targetVector?: string;
  distance?: number;
  certainty?: number;
}

export interface WeaviateWhereFilter {
  path: string[];
  operator: WeaviateWhereOperator;
  valueType: WeaviateValueType;
  value: any;
  operands?: WeaviateWhereFilter[];
}

export type WeaviateWhereOperator = 
  | 'Equal'
  | 'NotEqual'
  | 'GreaterThan'
  | 'GreaterThanEqual'
  | 'LessThan'
  | 'LessThanEqual'
  | 'Like'
  | 'IsNull'
  | 'ContainsAny'
  | 'ContainsAll'
  | 'WithinGeoRange'
  | 'And'
  | 'Or'
  | 'Not';

export type WeaviateValueType = 
  | 'string'
  | 'int'
  | 'boolean'
  | 'number'
  | 'date'
  | 'geoCoordinates'
  | 'text'
  | 'stringArray'
  | 'intArray'
  | 'numberArray'
  | 'booleanArray'
  | 'dateArray'
  | 'geoCoordinatesArray'
  | 'textArray';

export interface WeaviateNearTextFilter {
  concepts: string[];
  certainty?: number;
  distance?: number;
  moveTo?: WeaviateMove;
  moveAwayFrom?: WeaviateMove;
  autocut?: number;
}

export interface WeaviateNearVectorFilter {
  vector: number[];
  certainty?: number;
  distance?: number;
  targetVector?: string;
}

export interface WeaviateNearObjectFilter {
  id: string;
  beacon?: string;
  certainty?: number;
  distance?: number;
}

export interface WeaviateMove {
  concepts: string[];
  force: number;
  objects?: WeaviateMoveObject[];
}

export interface WeaviateMoveObject {
  id: string;
  beacon?: string;
}

export interface WeaviateSort {
  path: string[];
  order: 'asc' | 'desc';
}

export interface WeaviateGroupBy {
  path: string[];
  groups: number;
  objectsPerGroup: number;
}

export interface WeaviateAskFilter {
  question: string;
  properties?: string[];
  rerank?: boolean;
}

export interface WeaviateBM25Filter {
  query: string;
  properties?: string[];
}

export interface WeaviateHybridFilter {
  query: string;
  alpha?: number;
  vector?: number[];
  properties?: string[];
  fusionType?: 'rankedFusion' | 'relativeScoreFusion';
}

export interface WeaviateGenerate {
  singlePrompt?: string;
  groupedPrompt?: string;
  groupedTask?: string;
  groupedProperties?: string[];
}

export interface WeaviateRerank {
  property: string;
  query: string;
}

export interface WeaviateCreateOptions {
  vector?: number[];
  id?: string;
  consistencyLevel?: 'ONE' | 'QUORUM' | 'ALL';
}

export interface WeaviateUpdateOptions {
  vector?: number[];
  id?: string;
  consistencyLevel?: 'ONE' | 'QUORUM' | 'ALL';
}

export interface WeaviateDeleteOptions {
  consistencyLevel?: 'ONE' | 'QUORUM' | 'ALL';
  where?: WeaviateWhereFilter;
}

export interface WeaviateBatchOptions {
  size?: number;
  dynamic?: boolean;
  timeout?: number;
  callback?: (result: WeaviateBatchResult) => void;
}

export interface WeaviateBatchResult {
  successful: number;
  failed: number;
  errors: WeaviateBatchError[];
}

export interface WeaviateBatchError {
  error: {
    message: string;
    code?: string;
  };
  originalIndex: number;
}

export interface WeaviateSchema {
  class: string;
  description?: string;
  vectorIndexType?: 'hnsw' | 'flat';
  vectorIndexConfig?: Record<string, any>;
  vectorizer?: string;
  moduleConfig?: Record<string, any>;
  properties?: WeaviateProperty[];
  invertedIndexConfig?: WeaviateInvertedIndexConfig;
  replicationConfig?: WeaviateReplicationConfig;
  shardingConfig?: WeaviateShardingConfig;
  multiTenancyConfig?: WeaviateMultiTenancyConfig;
}

export interface WeaviateProperty {
  name: string;
  dataType: WeaviateDataType[];
  description?: string;
  indexInverted?: boolean;
  indexFilterable?: boolean;
  indexSearchable?: boolean;
  indexVectorizable?: boolean;
  tokenization?: 'word' | 'field' | 'whitespace' | 'lowercase';
  moduleConfig?: Record<string, any>;
}

export type WeaviateDataType = 
  | 'string'
  | 'int'
  | 'boolean'
  | 'number'
  | 'date'
  | 'geoCoordinates'
  | 'text'
  | 'stringArray'
  | 'intArray'
  | 'numberArray'
  | 'booleanArray'
  | 'dateArray'
  | 'geoCoordinatesArray'
  | 'textArray'
  | 'blob'
  | 'object'
  | 'objectArray'
  | 'phoneNumber'
  | 'phoneNumberArray'
  | 'uuid'
  | 'uuidArray';

export interface WeaviateInvertedIndexConfig {
  bm25?: {
    b: number;
    k1: number;
  };
  stopwords?: {
    preset?: string;
    additions?: string[];
    removals?: string[];
  };
  indexTimestamps?: boolean;
  indexNullState?: boolean;
  indexPropertyLength?: boolean;
}

export interface WeaviateReplicationConfig {
  factor: number;
}

export interface WeaviateShardingConfig {
  virtualPerPhysical?: number;
  desiredCount?: number;
  actualCount?: number;
  desiredVirtualCount?: number;
  actualVirtualCount?: number;
  key?: string;
  strategy?: 'hash' | 'range';
  function?: 'murmur3' | 'sha256';
}

export interface WeaviateMultiTenancyConfig {
  enabled: boolean;
}

export interface WeaviateMeta {
  hostname: string;
  version: string;
  modules: Record<string, any>;
}

export interface WeaviateError {
  message: string;
  code?: string;
  details?: any;
}

export interface WeaviateResponse<T = any> {
  data?: T;
  errors?: WeaviateError[];
  meta?: WeaviateMeta;
}

// Specific types for our application
export interface VectorizedQuestion extends WeaviateObject {
  properties: {
    content: string;
    category: string;
    stakeholder: string;
    parentQuestionId?: string;
    rootQuestionId?: string;
    userId: string;
    projectId: string;
    createdAt: string;
    updatedAt: string;
  };
}

export interface VectorizedAnswer extends WeaviateObject {
  properties: {
    questionId: string;
    content: string;
    authorId: string;
    isAccepted: boolean;
    upvotes: number;
    downvotes: number;
    createdAt: string;
    updatedAt: string;
  };
}

export interface VectorizedProject extends WeaviateObject {
  properties: {
    name: string;
    description?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  };
}

// Search result types
export interface QuestionSearchResult extends WeaviateSearchResult {
  properties: VectorizedQuestion['properties'];
}

export interface AnswerSearchResult extends WeaviateSearchResult {
  properties: VectorizedAnswer['properties'];
}

export interface ProjectSearchResult extends WeaviateSearchResult {
  properties: VectorizedProject['properties'];
}
