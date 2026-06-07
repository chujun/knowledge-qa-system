import {
  canEnterFormalQuestionBank,
  canTransitionQuestionStatus,
  createScoreCorrectionRecord,
  getAnswerAttemptVersionBindingErrors,
  getFormalEntryTransitionErrors,
  getFormalQuestionReadinessErrors,
  isAnswerAttemptVersionBindingComplete,
  shouldCountAttemptInLongTermMastery
} from "./rules";

describe("domain rules", () => {
  it("blocks unconfirmed content from entering the formal question bank", () => {
    expect(
      canEnterFormalQuestionBank({
        questionStatus: "pending_confirmation",
        questionVersionStatus: "active",
        answerVersionStatus: "active",
        scoringRubricVersionStatus: "active"
      })
    ).toBe(false);

    expect(
      getFormalQuestionReadinessErrors({
        questionStatus: "pending_confirmation",
        questionVersionStatus: "active",
        answerVersionStatus: "active",
        scoringRubricVersionStatus: "active"
      })
    ).toContain("question_not_confirmed");
  });

  it("requires active question, answer, and rubric versions for formal entry", () => {
    expect(
      getFormalQuestionReadinessErrors({
        questionStatus: "confirmed",
        questionVersionStatus: "draft",
        answerVersionStatus: "active",
        scoringRubricVersionStatus: "archived"
      })
    ).toEqual([
      "active_question_version_required",
      "active_scoring_rubric_version_required"
    ]);

    expect(
      canEnterFormalQuestionBank({
        questionStatus: "confirmed",
        questionVersionStatus: "active",
        answerVersionStatus: "active",
        scoringRubricVersionStatus: "active"
      })
    ).toBe(true);
  });

  it("enforces the formal entry status flow", () => {
    expect(canTransitionQuestionStatus("draft", "pending_confirmation")).toBe(
      true
    );
    expect(canTransitionQuestionStatus("pending_confirmation", "confirmed")).toBe(
      true
    );
    expect(canTransitionQuestionStatus("draft", "confirmed")).toBe(false);

    expect(
      getFormalEntryTransitionErrors("draft", {
        questionStatus: "confirmed",
        questionVersionStatus: "active",
        answerVersionStatus: "active",
        scoringRubricVersionStatus: "active"
      })
    ).toEqual(["invalid_confirm_transition"]);
  });

  it("keeps temporary questions out of long term mastery until confirmed and opted in", () => {
    expect(
      shouldCountAttemptInLongTermMastery({
        questionStatus: "draft",
        isTemporaryQuestion: true,
        temporaryConfirmationStatus: "learning_record_only",
        includeExistingAttemptInMastery: true
      })
    ).toBe(false);

    expect(
      shouldCountAttemptInLongTermMastery({
        questionStatus: "confirmed",
        isTemporaryQuestion: true,
        temporaryConfirmationStatus: "confirmed",
        includeExistingAttemptInMastery: false
      })
    ).toBe(false);

    expect(
      shouldCountAttemptInLongTermMastery({
        questionStatus: "confirmed",
        isTemporaryQuestion: true,
        temporaryConfirmationStatus: "confirmed",
        includeExistingAttemptInMastery: true
      })
    ).toBe(true);
  });

  it("counts confirmed formal question attempts in long term mastery", () => {
    expect(
      shouldCountAttemptInLongTermMastery({
        questionStatus: "confirmed",
        isTemporaryQuestion: false
      })
    ).toBe(true);
  });

  it("requires answer attempts to bind historical question, answer, and rubric versions", () => {
    expect(
      getAnswerAttemptVersionBindingErrors({
        questionVersionId: "qv_1",
        answerVersionId: null,
        scoringRubricVersionId: undefined
      })
    ).toEqual(["answer_version_required", "scoring_rubric_version_required"]);

    expect(
      isAnswerAttemptVersionBindingComplete({
        questionVersionId: "qv_1",
        answerVersionId: "av_1",
        scoringRubricVersionId: "srv_1"
      })
    ).toBe(true);
  });

  it("keeps AI score and user correction as a dual-track record", () => {
    expect(
      createScoreCorrectionRecord({
        answerAttemptId: "att_1",
        aiScore: 72,
        userScore: 85,
        reason: "AI missed a key applied example."
      })
    ).toEqual({
      answerAttemptId: "att_1",
      aiOriginalScore: 72,
      userCorrectedScore: 85,
      delta: 13,
      reason: "AI missed a key applied example."
    });
  });

  it("requires a reason when the user changes the AI score", () => {
    expect(() =>
      createScoreCorrectionRecord({
        answerAttemptId: "att_1",
        aiScore: 72,
        userScore: 85
      })
    ).toThrow("score_correction_reason_required");
  });
});
