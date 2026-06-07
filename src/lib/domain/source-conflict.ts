export interface SourceBackedContent {
  content: string;
  sourceReferenceId: string;
}

export type SourceConflictDecision =
  | "no_conflict"
  | "requires_user_confirmation";

export function decideSourceConflict(
  activeContent: SourceBackedContent,
  incomingContent: SourceBackedContent
): SourceConflictDecision {
  if (normalizeContent(activeContent.content) === normalizeContent(incomingContent.content)) {
    return "no_conflict";
  }

  return "requires_user_confirmation";
}

function normalizeContent(content: string): string {
  return content.trim().replace(/\s+/g, " ");
}
