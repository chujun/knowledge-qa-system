import type { ZodError } from "zod";

export function formatZodError(error: ZodError) {
  return error.errors.map((item) => ({
    field: item.path.join("."),
    message: item.message
  }));
}

export function getPagination(searchParams: URLSearchParams) {
  return {
    page: toOptionalInt(searchParams.get("page")),
    pageSize: toOptionalInt(searchParams.get("page_size"))
  };
}

function toOptionalInt(value: string | null) {
  if (!value) {
    return undefined;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? undefined : parsed;
}
