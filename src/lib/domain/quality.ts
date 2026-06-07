export type QualityCheckResult = "passed" | "warning" | "failed";

export type QualityDecision =
  | "accept"
  | "accept_with_warning"
  | "auto_fix_required"
  | "manual_required";

export interface QualityDecisionInput {
  result: QualityCheckResult;
  autoFixAttempts: number;
  maxAutoFixAttempts: number;
}

export function decideQualityNextStep(
  input: QualityDecisionInput
): QualityDecision {
  if (input.result === "passed") {
    return "accept";
  }

  if (input.result === "warning") {
    return "accept_with_warning";
  }

  if (input.autoFixAttempts < input.maxAutoFixAttempts) {
    return "auto_fix_required";
  }

  return "manual_required";
}
