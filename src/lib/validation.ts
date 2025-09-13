import { Question, Answer, User, AppSettings, Project } from './types';

// Validation error interface
export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// Base validation functions
export const validators = {
  required: (value: any, fieldName: string): ValidationError | null => {
    if (value === null || value === undefined || value === '') {
      return {
        field: fieldName,
        message: `${fieldName} is required`,
        code: 'REQUIRED'
      };
    }
    return null;
  },

  minLength: (value: string, min: number, fieldName: string): ValidationError | null => {
    if (value && value.length < min) {
      return {
        field: fieldName,
        message: `${fieldName} must be at least ${min} characters long`,
        code: 'MIN_LENGTH'
      };
    }
    return null;
  },

  maxLength: (value: string, max: number, fieldName: string): ValidationError | null => {
    if (value && value.length > max) {
      return {
        field: fieldName,
        message: `${fieldName} must be no more than ${max} characters long`,
        code: 'MAX_LENGTH'
      };
    }
    return null;
  },

  email: (value: string, fieldName: string): ValidationError | null => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (value && !emailRegex.test(value)) {
      return {
        field: fieldName,
        message: `${fieldName} must be a valid email address`,
        code: 'INVALID_EMAIL'
      };
    }
    return null;
  },

  positiveNumber: (value: number, fieldName: string): ValidationError | null => {
    if (value !== undefined && value < 0) {
      return {
        field: fieldName,
        message: `${fieldName} must be a positive number`,
        code: 'NEGATIVE_NUMBER'
      };
    }
    return null;
  },

  arrayNotEmpty: (value: any[], fieldName: string): ValidationError | null => {
    if (value && value.length === 0) {
      return {
        field: fieldName,
        message: `${fieldName} cannot be empty`,
        code: 'EMPTY_ARRAY'
      };
    }
    return null;
  },

  oneOf: (value: any, options: any[], fieldName: string): ValidationError | null => {
    if (value && !options.includes(value)) {
      return {
        field: fieldName,
        message: `${fieldName} must be one of: ${options.join(', ')}`,
        code: 'INVALID_OPTION'
      };
    }
    return null;
  }
};

// Question validation
export function validateQuestion(question: Partial<Question>): ValidationResult {
  const errors: ValidationError[] = [];

  // Required fields
  const titleError = validators.required(question.title, 'title');
  if (titleError) errors.push(titleError);

  const contentError = validators.required(question.content, 'content');
  if (contentError) errors.push(contentError);

  const authorIdError = validators.required(question.authorId, 'authorId');
  if (authorIdError) errors.push(authorIdError);

  // Length validations
  if (question.title) {
    const titleLengthError = validators.minLength(question.title, 5, 'title');
    if (titleLengthError) errors.push(titleLengthError);

    const titleMaxError = validators.maxLength(question.title, 200, 'title');
    if (titleMaxError) errors.push(titleMaxError);
  }

  if (question.content) {
    const contentLengthError = validators.minLength(question.content, 10, 'content');
    if (contentLengthError) errors.push(contentLengthError);

    const contentMaxError = validators.maxLength(question.content, 5000, 'content');
    if (contentMaxError) errors.push(contentMaxError);
  }

  // Numeric validations
  if (question.upvotes !== undefined) {
    const upvotesError = validators.positiveNumber(question.upvotes, 'upvotes');
    if (upvotesError) errors.push(upvotesError);
  }

  if (question.downvotes !== undefined) {
    const downvotesError = validators.positiveNumber(question.downvotes, 'downvotes');
    if (downvotesError) errors.push(downvotesError);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// Answer validation
export function validateAnswer(answer: Partial<Answer>): ValidationResult {
  const errors: ValidationError[] = [];

  // Required fields
  const questionIdError = validators.required(answer.questionId, 'questionId');
  if (questionIdError) errors.push(questionIdError);

  const contentError = validators.required(answer.content, 'content');
  if (contentError) errors.push(contentError);

  const authorIdError = validators.required(answer.authorId, 'authorId');
  if (authorIdError) errors.push(authorIdError);

  // Length validations
  if (answer.content) {
    const contentLengthError = validators.minLength(answer.content, 10, 'content');
    if (contentLengthError) errors.push(contentLengthError);

    const contentMaxError = validators.maxLength(answer.content, 5000, 'content');
    if (contentMaxError) errors.push(contentMaxError);
  }

  // Numeric validations
  if (answer.upvotes !== undefined) {
    const upvotesError = validators.positiveNumber(answer.upvotes, 'upvotes');
    if (upvotesError) errors.push(upvotesError);
  }

  if (answer.downvotes !== undefined) {
    const downvotesError = validators.positiveNumber(answer.downvotes, 'downvotes');
    if (downvotesError) errors.push(downvotesError);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// User validation
export function validateUser(user: Partial<User>): ValidationResult {
  const errors: ValidationError[] = [];

  // Required fields
  const nameError = validators.required(user.name, 'name');
  if (nameError) errors.push(nameError);

  const emailError = validators.required(user.email, 'email');
  if (emailError) errors.push(emailError);

  // Length validations
  if (user.name) {
    const nameLengthError = validators.minLength(user.name, 2, 'name');
    if (nameLengthError) errors.push(nameLengthError);

    const nameMaxError = validators.maxLength(user.name, 100, 'name');
    if (nameMaxError) errors.push(nameMaxError);
  }

  // Email validation
  if (user.email) {
    const emailFormatError = validators.email(user.email, 'email');
    if (emailFormatError) errors.push(emailFormatError);
  }

  // Numeric validations
  if (user.reputation !== undefined) {
    const reputationError = validators.positiveNumber(user.reputation, 'reputation');
    if (reputationError) errors.push(reputationError);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// Settings validation
export function validateSettings(settings: Partial<AppSettings>): ValidationResult {
  const errors: ValidationError[] = [];

  // Theme validation
  if (settings.theme !== undefined) {
    const themeError = validators.oneOf(settings.theme, ['light', 'dark', 'system'], 'theme');
    if (themeError) errors.push(themeError);
  }

  // Language validation
  if (settings.language) {
    const languageLengthError = validators.minLength(settings.language, 2, 'language');
    if (languageLengthError) errors.push(languageLengthError);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// Project validation
export function validateProject(project: Partial<Project>): ValidationResult {
  const errors: ValidationError[] = [];

  // Required fields
  const nameError = validators.required(project.name, 'name');
  if (nameError) errors.push(nameError);

  // Length validations
  if (project.name) {
    const nameLengthError = validators.minLength(project.name, 2, 'name');
    if (nameLengthError) errors.push(nameLengthError);

    const nameMaxError = validators.maxLength(project.name, 100, 'name');
    if (nameMaxError) errors.push(nameMaxError);
  }

  if (project.description) {
    const descriptionMaxError = validators.maxLength(project.description, 500, 'description');
    if (descriptionMaxError) errors.push(descriptionMaxError);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// Generic validation helper
export function validateEntity<T>(
  entity: Partial<T>,
  validator: (entity: Partial<T>) => ValidationResult
): ValidationResult {
  return validator(entity);
}
