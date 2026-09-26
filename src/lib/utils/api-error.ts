import { NextResponse } from "next/server";
import { ZodError } from "zod";

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(message: string, statusCode: number = 500, code: string = "INTERNAL_ERROR", details?: unknown) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string = "Validation failed", details?: unknown) {
    super(message, 400, "VALIDATION_ERROR", details);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = "Resource") {
    super(`${resource} not found`, 404, "NOT_FOUND");
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = "Unauthorized access") {
    super(message, 401, "UNAUTHORIZED");
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = "Forbidden access") {
    super(message, 403, "FORBIDDEN");
  }
}

export class ConflictError extends AppError {
  constructor(message: string = "Resource already exists") {
    super(message, 409, "CONFLICT");
  }
}

/**
 * Global API Error handler that transforms errors into a consistent JSON response
 * without leaking sensitive database internals or secrets.
 */
export function handleApiError(error: unknown): NextResponse {
  console.error("[API Error Caught]:", error);

  if (error instanceof AppError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details ?? null,
        },
      },
      { status: error.statusCode }
    );
  }

  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Request validation failed",
          details: error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        },
      },
      { status: 400 }
    );
  }

  // Database Connection / Prisma Initialization Error
  if (
    error instanceof Error &&
    (error.name === "PrismaClientInitializationError" ||
      error.name === "PrismaClientKnownRequestError" ||
      error.message?.includes("Can't reach database server") ||
      error.message?.includes("ECONNREFUSED"))
  ) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "DATABASE_CONNECTION_ERROR",
          message:
            "Database connection error: Unable to reach PostgreSQL server at localhost:5432. Please verify that your PostgreSQL service/container is running and that DATABASE_URL in .env is configured correctly.",
          details: process.env.NODE_ENV !== "production" ? error.message : null,
        },
      },
      { status: 503 }
    );
  }

  // Generic fallback error
  return NextResponse.json(
    {
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred. Please try again later.",
        details: null,
      },
    },
    { status: 500 }
  );
}
