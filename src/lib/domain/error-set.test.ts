import { buildErrorSetItems, isErrorAttempt } from "./error-set";

describe("error set model", () => {
  it("detects low score attempts and user-downrated AI scores", () => {
    expect(
      isErrorAttempt({
        answerAttemptId: "att_1",
        questionId: "q_1",
        knowledgePointId: "kp_1",
        cognitiveDimension: "apply",
        aiScore: 80,
        finalScore: 55,
        reasonTags: ["application_gap"]
      })
    ).toBe(true);

    expect(
      isErrorAttempt({
        answerAttemptId: "att_2",
        questionId: "q_2",
        knowledgePointId: "kp_1",
        cognitiveDimension: "understand",
        aiScore: 90,
        finalScore: 85,
        reasonTags: []
      })
    ).toBe(true);

    expect(
      isErrorAttempt({
        answerAttemptId: "att_3",
        questionId: "q_3",
        knowledgePointId: "kp_1",
        cognitiveDimension: "understand",
        aiScore: 80,
        finalScore: 85,
        reasonTags: []
      })
    ).toBe(false);
  });

  it("builds error set items grouped by knowledge point", () => {
    const items = buildErrorSetItems([
      {
        answerAttemptId: "att_1",
        questionId: "q_1",
        knowledgePointId: "kp_1",
        cognitiveDimension: "apply",
        aiScore: 70,
        finalScore: 50,
        reasonTags: ["application_gap", "concept_confusion"]
      },
      {
        answerAttemptId: "att_2",
        questionId: "q_2",
        knowledgePointId: "kp_1",
        cognitiveDimension: "distinguish",
        aiScore: 80,
        finalScore: 45,
        reasonTags: ["concept_confusion"]
      },
      {
        answerAttemptId: "att_3",
        questionId: "q_3",
        knowledgePointId: "kp_2",
        cognitiveDimension: "evaluate",
        aiScore: 88,
        finalScore: 92,
        reasonTags: []
      }
    ]);

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      knowledgePointId: "kp_1",
      dominantReasonTags: ["concept_confusion", "application_gap"]
    });
    expect(items[0].attempts.map((attempt) => attempt.answerAttemptId)).toEqual([
      "att_1",
      "att_2"
    ]);
  });
});
