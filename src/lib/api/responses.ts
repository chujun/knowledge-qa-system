import { NextResponse } from "next/server";

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(
    {
      data,
      meta: buildMeta()
    },
    init
  );
}

export function listOk<T>(
  data: T[],
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  }
) {
  return NextResponse.json({
    data,
    pagination: {
      page: pagination.page,
      page_size: pagination.pageSize,
      total: pagination.total,
      has_next: pagination.page * pagination.pageSize < pagination.total
    },
    meta: buildMeta()
  });
}

export function errorResponse(
  status: number,
  code: string,
  message: string,
  details?: unknown
) {
  return NextResponse.json(
    {
      error: {
        code,
        message,
        details: details ?? []
      },
      meta: buildMeta()
    },
    { status }
  );
}

function buildMeta() {
  return {
    request_id: crypto.randomUUID(),
    timestamp: new Date().toISOString()
  };
}
