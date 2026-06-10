import { NextResponse } from "next/server";

import { appConfig } from "@/lib/config";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  const database = await checkDatabase();

  return NextResponse.json({
    data: {
      status: "ok",
      database: database.status,
      database_error: database.error,
      model_provider: appConfig.defaultModelProvider,
      model_name: appConfig.defaultModel,
      minimax_configured: appConfig.minimaxApiKeyConfigured,
      version: "0.1.0",
      timestamp: new Date().toISOString()
    }
  });
}

async function checkDatabase() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: "ready", error: null };
  } catch (error) {
    return {
      status: "unavailable",
      error: error instanceof Error ? error.message : "unknown database error"
    };
  }
}
