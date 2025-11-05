/**
 * Standardized API Response Utilities
 * Provides consistent response formats across all API routes
 */

import { NextResponse } from 'next/server';
import { logger } from './logger';

// Standard error response format
interface ErrorResponse {
  error: string;
  message?: string;
  details?: unknown;
  code?: string;
  timestamp: string;
}

// Standard success response format
interface SuccessResponse<T = unknown> {
  data?: T;
  message?: string;
  timestamp: string;
}

/**
 * Create standardized error response
 */
export function errorResponse(
  error: string,
  status: number,
  options?: {
    message?: string;
    details?: unknown;
    code?: string;
    logError?: boolean;
  }
): NextResponse<ErrorResponse> {
  const response: ErrorResponse = {
    error,
    message: options?.message,
    details: options?.details,
    code: options?.code,
    timestamp: new Date().toISOString(),
  };

  // Log error if requested
  if (options?.logError !== false) {
    logger.error(error, undefined, {
      status,
      message: options?.message,
      code: options?.code,
    });
  }

  return NextResponse.json(response, { status });
}

/**
 * Create standardized success response
 */
export function successResponse<T>(
  data?: T,
  status: number = 200,
  options?: {
    message?: string;
  }
): NextResponse<SuccessResponse<T>> {
  const response: SuccessResponse<T> = {
    data,
    message: options?.message,
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(response, { status });
}

/**
 * Common error responses
 */
export const ApiErrors = {
  unauthorized: () => errorResponse(
    'Unauthorized',
    401,
    { message: 'Authentication required' }
  ),

  forbidden: (message?: string) => errorResponse(
    'Forbidden',
    403,
    { message: message || 'You do not have permission to access this resource' }
  ),

  notFound: (resource?: string) => errorResponse(
    'Not Found',
    404,
    { message: resource ? `${resource} not found` : 'Resource not found' }
  ),

  badRequest: (message: string, details?: unknown) => errorResponse(
    'Bad Request',
    400,
    { message, details }
  ),

  conflict: (message: string, details?: unknown) => errorResponse(
    'Conflict',
    409,
    { message, details }
  ),

  rateLimitExceeded: (retryAfter?: number) => errorResponse(
    'Rate Limit Exceeded',
    429,
    {
      message: 'Too many requests. Please try again later.',
      details: retryAfter ? { retryAfter } : undefined
    }
  ),

  internalError: (message?: string, details?: unknown) => errorResponse(
    'Internal Server Error',
    500,
    {
      message: message || 'An unexpected error occurred',
      details: process.env.NODE_ENV === 'development' ? details : undefined
    }
  ),

  validationError: (details: unknown) => errorResponse(
    'Validation Error',
    400,
    {
      message: 'Request validation failed',
      details
    }
  ),
};

/**
 * Handle database errors with proper error responses
 */
export function handleDatabaseError(error: unknown): NextResponse<ErrorResponse> {
  // PostgreSQL error codes
  if (
    error &&
    typeof error === 'object' &&
    'code' in error &&
    typeof error.code === 'string'
  ) {
    const pgError = error as { code: string; constraint?: string; detail?: string };

    switch (pgError.code) {
      case '23505': // unique_violation
        return ApiErrors.conflict(
          'Resource already exists',
          { constraint: pgError.constraint, detail: pgError.detail }
        );

      case '23503': // foreign_key_violation
        return ApiErrors.badRequest(
          'Referenced resource does not exist',
          { constraint: pgError.constraint }
        );

      case '23502': // not_null_violation
        return ApiErrors.badRequest(
          'Required field is missing',
          { constraint: pgError.constraint }
        );

      case '22P02': // invalid_text_representation
        return ApiErrors.badRequest('Invalid data format');

      case '42P01': // undefined_table
        return ApiErrors.internalError(
          'Database schema error',
          process.env.NODE_ENV === 'development' ? pgError : undefined
        );
    }
  }

  // Generic database error
  logger.error('Database error', error as Error);
  return ApiErrors.internalError('Database operation failed');
}

/**
 * Wrap async route handlers with error handling
 */
export function withErrorHandling<T extends (...args: unknown[]) => Promise<NextResponse>>(
  handler: T
): T {
  return (async (...args: unknown[]) => {
    try {
      return await handler(...args);
    } catch (error) {
      logger.error('Unhandled route error', error as Error);
      return ApiErrors.internalError();
    }
  }) as T;
}
