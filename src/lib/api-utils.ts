import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { z } from 'zod';

export type ApiResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
};

export function successResponse<T>(data: T, status = 200): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ success: true, data }, { status });
}

export function errorResponse(
  message: string,
  status = 400,
  code?: string
): NextResponse<ApiResponse> {
  return NextResponse.json(
    { success: false, error: message, code },
    { status }
  );
}

export async function getAuthenticatedUser() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { user: null, error: 'Unauthorized' };
  }

  return { user, error: null };
}

export async function requireAuth() {
  const { user, error } = await getAuthenticatedUser();

  if (error || !user) {
    throw new AuthError('Unauthorized', 401);
  }

  return user;
}

export class AuthError extends Error {
  status: number;

  constructor(message: string, status = 401) {
    super(message);
    this.name = 'AuthError';
    this.status = status;
  }
}

export class ValidationError extends Error {
  issues: z.ZodIssue[];

  constructor(issues: z.ZodIssue[]) {
    super('Validation failed');
    this.name = 'ValidationError';
    this.issues = issues;
  }
}

export function validateBody<T>(schema: z.ZodSchema<T>, body: unknown): T {
  const result = schema.safeParse(body);

  if (!result.success) {
    throw new ValidationError(result.error.issues);
  }

  return result.data;
}

export function handleApiError(error: unknown): NextResponse<ApiResponse> {
  console.error('API Error:', error);

  if (error instanceof AuthError) {
    return errorResponse(error.message, error.status, 'AUTH_ERROR');
  }

  if (error instanceof ValidationError) {
    const message = error.issues.map((i) => i.message).join(', ');
    return errorResponse(message, 400, 'VALIDATION_ERROR');
  }

  if (error instanceof Error) {
    // Don't expose internal errors in production
    const message =
      process.env.NODE_ENV === 'development'
        ? error.message
        : 'An unexpected error occurred';
    return errorResponse(message, 500, 'INTERNAL_ERROR');
  }

  return errorResponse('An unexpected error occurred', 500, 'INTERNAL_ERROR');
}

export async function withErrorHandling<T>(
  handler: () => Promise<NextResponse<ApiResponse<T>>>
): Promise<NextResponse<ApiResponse<T>>> {
  try {
    return await handler();
  } catch (error) {
    return handleApiError(error) as NextResponse<ApiResponse<T>>;
  }
}

// Rate limiting helper (simple in-memory, use Redis for production)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record || record.resetAt < now) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (record.count >= limit) {
    return false;
  }

  record.count++;
  return true;
}
