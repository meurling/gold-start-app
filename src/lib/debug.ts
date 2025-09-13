/**
 * Debug utilities for consistent logging across the application
 */

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR'
}

export interface LogContext {
  component: string;
  operation: string;
  projectId?: string;
  questionId?: string;
  documentId?: string;
  userId?: string;
  [key: string]: any;
}

class DebugLogger {
  private isEnabled: boolean;

  constructor() {
    // Enable debug logging in development or when explicitly enabled
    this.isEnabled = import.meta.env.DEV || localStorage.getItem('debug-enabled') === 'true';
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` [${context.component}:${context.operation}]` : '';
    const projectStr = context?.projectId ? ` [Project: ${context.projectId}]` : '';
    const questionStr = context?.questionId ? ` [Question: ${context.questionId}]` : '';
    const documentStr = context?.documentId ? ` [Document: ${context.documentId}]` : '';
    
    return `${timestamp} [${level}]${contextStr}${projectStr}${questionStr}${documentStr} ${message}`;
  }

  private log(level: LogLevel, message: string, context?: LogContext, data?: any): void {
    if (!this.isEnabled) return;

    const formattedMessage = this.formatMessage(level, message, context);
    
    // Log to console with appropriate level
    switch (level) {
      case LogLevel.DEBUG:
        console.debug(formattedMessage, data || '');
        break;
      case LogLevel.INFO:
        console.info(formattedMessage, data || '');
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage, data || '');
        break;
      case LogLevel.ERROR:
        console.error(formattedMessage, data || '');
        break;
    }

    // Store in localStorage for debugging (limit to last 100 entries)
    try {
      const debugLogs = JSON.parse(localStorage.getItem('debug-logs') || '[]');
      debugLogs.push({
        timestamp: new Date().toISOString(),
        level,
        message: formattedMessage,
        context,
        data: data ? JSON.stringify(data) : undefined
      });
      
      // Keep only last 100 entries
      if (debugLogs.length > 100) {
        debugLogs.splice(0, debugLogs.length - 100);
      }
      
      localStorage.setItem('debug-logs', JSON.stringify(debugLogs));
    } catch (error) {
      console.warn('Failed to store debug log:', error);
    }
  }

  debug(message: string, context?: LogContext, data?: any): void {
    this.log(LogLevel.DEBUG, message, context, data);
  }

  info(message: string, context?: LogContext, data?: any): void {
    this.log(LogLevel.INFO, message, context, data);
  }

  warn(message: string, context?: LogContext, data?: any): void {
    this.log(LogLevel.WARN, message, context, data);
  }

  error(message: string, context?: LogContext, data?: any): void {
    this.log(LogLevel.ERROR, message, context, data);
  }

  // Enable/disable debug logging
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    localStorage.setItem('debug-enabled', enabled.toString());
  }

  // Get stored debug logs
  getLogs(): any[] {
    try {
      return JSON.parse(localStorage.getItem('debug-logs') || '[]');
    } catch {
      return [];
    }
  }

  // Clear stored debug logs
  clearLogs(): void {
    localStorage.removeItem('debug-logs');
  }
}

// Export singleton instance
export const debugLogger = new DebugLogger();

// Helper functions for common logging patterns
export const logRAGOperation = (operation: string, projectId: string, data?: any) => {
  debugLogger.info(`RAG ${operation}`, { component: 'RAG', operation, projectId }, data);
};

export const logQuestionAnalysis = (operation: string, questionId: string, projectId: string, data?: any) => {
  debugLogger.info(`Question Analysis ${operation}`, { component: 'QuestionAnalyzer', operation, questionId, projectId }, data);
};

export const logDocumentOperation = (operation: string, documentId: string, projectId: string, data?: any) => {
  debugLogger.info(`Document ${operation}`, { component: 'DocumentService', operation, documentId, projectId }, data);
};

export const logAPIRequest = (endpoint: string, method: string, data?: any) => {
  debugLogger.debug(`API ${method} ${endpoint}`, { component: 'API', operation: `${method} ${endpoint}` }, data);
};

export const logAPIResponse = (endpoint: string, method: string, status: number, data?: any) => {
  debugLogger.debug(`API Response ${method} ${endpoint}`, { component: 'API', operation: `${method} ${endpoint}` }, { status, data });
};

export const logError = (component: string, operation: string, error: any, context?: LogContext) => {
  debugLogger.error(`Error in ${component}.${operation}`, context, error);
};
