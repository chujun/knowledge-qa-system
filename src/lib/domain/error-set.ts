import type { CognitiveDimension } from "./mastery";

export interface ErrorAttemptEvidence {
  answerAttemptId: string;
  questionId: string;
  knowledgePointId: string;
  cognitiveDimension: CognitiveDimension;
  aiScore: number;
  finalScore: number;
  reasonTags: string[];
}

export interface ErrorSetItem {
  knowledgePointId: string;
  attempts: ErrorAttemptEvidence[];
  dominantReasonTags: string[];
}

export function buildErrorSetItems(
  attempts: ErrorAttemptEvidence[],
  lowScoreThreshold = 60
): ErrorSetItem[] {
  const grouped = new Map<string, ErrorAttemptEvidence[]>();

  for (const attempt of attempts) {
    if (!isErrorAttempt(attempt, lowScoreThreshold)) {
      continue;
    }

    const current = grouped.get(attempt.knowledgePointId) ?? [];
    current.push(attempt);
    grouped.set(attempt.knowledgePointId, current);
  }

  return Array.from(grouped.entries()).map(([knowledgePointId, items]) => ({
    knowledgePointId,
    attempts: items,
    dominantReasonTags: getDominantReasonTags(items)
  }));
}

export function isErrorAttempt(
  attempt: ErrorAttemptEvidence,
  lowScoreThreshold = 60
): boolean {
  return attempt.finalScore < lowScoreThreshold || attempt.finalScore < attempt.aiScore;
}

function getDominantReasonTags(items: ErrorAttemptEvidence[]): string[] {
  const counts = new Map<string, number>();

  for (const item of items) {
    for (const tag of item.reasonTags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([tag]) => tag);
}
