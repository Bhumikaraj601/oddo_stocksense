import { NextResponse } from "next/server";

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
  };
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export function createSuccessResponse<T>(
  data: T,
  meta?: ApiResponse<T>["meta"],
  status: number = 200
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      ...(meta ? { meta } : {}),
    },
    { status }
  );
}

export function createErrorResponse(
  message: string,
  statusCode: number = 400,
  code: string = "BAD_REQUEST",
  details?: unknown
): NextResponse<ApiResponse<never>> {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
        details: details ?? null,
      },
    },
    { status: statusCode }
  );
}
