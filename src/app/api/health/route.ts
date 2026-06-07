import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    data: {
      status: "ok",
      database: "not_initialized",
      model_provider: "mock",
      version: "0.1.0",
      timestamp: new Date().toISOString()
    }
  });
}
