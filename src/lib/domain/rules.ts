export type QuestionStatus =
  | "draft"
  | "pending_confirmation"
  | "confirmed"
  | "archived";

export type VersionStatus = "draft" | "active" | "archived";

export type TemporaryConfirmationStatus =
  | "temporary"
  | "pending_confirmation"
  | "confirmed"
  | "learning_record_only";

export interface FormalQuestionReadiness {
  questionStatus: QuestionStatus;
  questionVersionStatus?: VersionStatus;
  answerVersionStatus?: VersionStatus;
  scoringRubricVersionStatus?: VersionStatus;
}

export interface AttemptMasteryPolicy {
  questionStatus: QuestionStatus;
  isTemporaryQuestion: boolean;
  temporaryConfirmationStatus?: TemporaryConfirmationStatus;
  includeExistingAttemptInMastery?: boolean;
}

export interface AnswerAttemptVersionBinding {
  questionVersionId?: string | null;
  answerVersionId?: string | null;
  scoringRubricVersionId?: string | null;
}

export interface ScoreCorrectionInput {
  answerAttemptId: string;
  aiScore: number;
  userScore: number;
  reason?: string;
}

export interface ScoreCorrectionRecord {
  answerAttemptId: string;
  aiOriginalScore: number;
  userCorrectedScore: number;
  delta: number;
  reason: string | null;
}

const allowedQuestionStatusTransitions: Record<QuestionStatus, QuestionStatus[]> = {
  draft: ["pending_confirmation", "archived"],
  pending_confirmation: ["confirmed", "archived"],
  confirmed: ["archived"],
  archived: []
};

export function getFormalQuestionReadinessErrors(
  readiness: FormalQuestionReadiness
): string[] {
  const errors: string[] = [];

  if (readiness.questionStatus !== "confirmed") {
    errors.push("question_not_confirmed");
  }

  if (readiness.questionVersionStatus !== "active") {
    errors.push("active_question_version_required");
  }

  if (readiness.answerVersionStatus !== "active") {
    errors.push("active_answer_version_required");
  }

  if (readiness.scoringRubricVersionStatus !== "active") {
    errors.push("active_scoring_rubric_version_required");
  }

  return errors;
}

export function canEnterFormalQuestionBank(
  readiness: FormalQuestionReadiness
): boolean {
  return getFormalQuestionReadinessErrors(readiness).length === 0;
}

export function canTransitionQuestionStatus(
  from: QuestionStatus,
  to: QuestionStatus
): boolean {
  return allowedQuestionStatusTransitions[from].includes(to);
}

export function getFormalEntryTransitionErrors(
  currentStatus: QuestionStatus,
  readiness: FormalQuestionReadiness
): string[] {
  const errors: string[] = [];

  if (!canTransitionQuestionStatus(currentStatus, "confirmed")) {
    errors.push("invalid_confirm_transition");
  }

  return errors.concat(getFormalQuestionReadinessErrors(readiness));
}

export function shouldCountAttemptInLongTermMastery(
  policy: AttemptMasteryPolicy
): boolean {
  if (!policy.isTemporaryQuestion) {
    return policy.questionStatus === "confirmed";
  }

  return (
    policy.temporaryConfirmationStatus === "confirmed" &&
    policy.includeExistingAttemptInMastery === true
  );
}

export function getAnswerAttemptVersionBindingErrors(
  binding: AnswerAttemptVersionBinding
): string[] {
  const errors: string[] = [];

  if (!binding.questionVersionId) {
    errors.push("question_version_required");
  }

  if (!binding.answerVersionId) {
    errors.push("answer_version_required");
  }

  if (!binding.scoringRubricVersionId) {
    errors.push("scoring_rubric_version_required");
  }

  return errors;
}

export function isAnswerAttemptVersionBindingComplete(
  binding: AnswerAttemptVersionBinding
): boolean {
  return getAnswerAttemptVersionBindingErrors(binding).length === 0;
}

export function createScoreCorrectionRecord(
  input: ScoreCorrectionInput
): ScoreCorrectionRecord {
  if (!input.answerAttemptId) {
    throw new Error("answer_attempt_id_required");
  }

  if (input.aiScore !== input.userScore && !input.reason?.trim()) {
    throw new Error("score_correction_reason_required");
  }

  return {
    answerAttemptId: input.answerAttemptId,
    aiOriginalScore: input.aiScore,
    userCorrectedScore: input.userScore,
    delta: input.userScore - input.aiScore,
    reason: input.reason?.trim() || null
  };
}
