import type { AxiosError } from 'axios';

/**
 * Parsed API error with status code and structured messages.
 */
export type ApiError = {
  status: number;
  message: string;
  /** Field-level validation errors from 422 responses */
  fieldErrors?: Record<string, string>;
};

/**
 * Extract a structured error from an Axios error response.
 */
export function parseApiError(error: unknown): ApiError {
  const axiosErr = error as AxiosError<{
    message?: string;
    error?: string;
    errors?: Record<string, string>;
  }>;

  const status = axiosErr?.response?.status ?? 0;
  const data = axiosErr?.response?.data;

  const message =
    data?.message ?? data?.error ?? axiosErr?.message ?? 'An unexpected error occurred';

  return {
    status,
    message,
    fieldErrors: status === 422 ? data?.errors : undefined,
  };
}

/**
 * Get a user-friendly error message based on status code and context.
 */
export function getErrorMessage(error: unknown, context?: string): string {
  const parsed = parseApiError(error);

  switch (parsed.status) {
    case 403:
      return 'You do not have permission to perform this action.';
    case 404:
      return context ? `${context} not found.` : 'The requested resource was not found.';
    case 409:
      return parsed.message || 'A resource with that name already exists.';
    case 422:
      return parsed.message || 'Validation failed. Please check your input.';
    default:
      return parsed.message;
  }
}

/**
 * Check if an error is a specific HTTP status.
 */
export function isHttpStatus(error: unknown, status: number): boolean {
  return parseApiError(error).status === status;
}
