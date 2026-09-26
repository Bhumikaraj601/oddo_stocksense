import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  const startTime = Date.now();
  let dbStatus = "unknown";
  let latencyMs = 0;

  try {
    // Ping PostgreSQL through Prisma
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = "connected";
    latencyMs = Date.now() - startTime;
  } catch (error) {
    dbStatus = "disconnected";
    console.error("[Health Check DB Error]:", error);
  }

  return NextResponse.json(
    {
      status: "ok",
      timestamp: new Date().toISOString(),
      service: "StockSense API",
      environment: process.env.NODE_ENV || "development",
      database: {
        status: dbStatus,
        latencyMs: latencyMs > 0 ? latencyMs : undefined,
      },
      version: "1.0.0 (Phase 1 Foundation)",
    },
    { status: 200 }
  );
}
