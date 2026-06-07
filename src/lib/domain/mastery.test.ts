import {
  aggregateMasteryProfiles,
  calculateKnowledgePointMastery
} from "./mastery";

describe("mastery model", () => {
  it("calculates knowledge point mastery by cognitive dimension", () => {
    const profile = calculateKnowledgePointMastery("kp_1", [
      { dimension: "understand", score: 80, difficultyLevel: 1 },
      { dimension: "understand", score: 100, difficultyLevel: 3 },
      { dimension: "apply", score: 60, difficultyLevel: 2 }
    ]);

    expect(profile).toMatchObject({
      targetType: "knowledge_point",
      targetId: "kp_1",
      evidenceCount: 3
    });
    expect(profile.dimensionScores.understand).toBe(95);
    expect(profile.dimensionScores.apply).toBe(60);
    expect(profile.dimensionScores.analyze).toBe(0);
    expect(profile.overallScore).toBe(31);
  });

  it("aggregates topic mastery from knowledge point profiles", () => {
    const first = calculateKnowledgePointMastery("kp_1", [
      { dimension: "understand", score: 90, difficultyLevel: 1 },
      { dimension: "apply", score: 70, difficultyLevel: 1 }
    ]);
    const second = calculateKnowledgePointMastery("kp_2", [
      { dimension: "understand", score: 30, difficultyLevel: 1 }
    ]);

    const topicProfile = aggregateMasteryProfiles("topic", "topic_1", [
      first,
      second
    ]);

    expect(topicProfile.targetType).toBe("topic");
    expect(topicProfile.evidenceCount).toBe(3);
    expect(topicProfile.dimensionScores.understand).toBe(70);
    expect(topicProfile.dimensionScores.apply).toBe(46.67);
  });

  it("aggregates domain mastery from topic profiles", () => {
    const topicA = aggregateMasteryProfiles("topic", "topic_a", [
      calculateKnowledgePointMastery("kp_1", [
        { dimension: "evaluate", score: 80, difficultyLevel: 1 }
      ])
    ]);
    const topicB = aggregateMasteryProfiles("topic", "topic_b", [
      calculateKnowledgePointMastery("kp_2", [
        { dimension: "evaluate", score: 20, difficultyLevel: 1 },
        { dimension: "analyze", score: 60, difficultyLevel: 1 }
      ])
    ]);

    const domainProfile = aggregateMasteryProfiles("domain", "domain_1", [
      topicA,
      topicB
    ]);

    expect(domainProfile.targetType).toBe("domain");
    expect(domainProfile.evidenceCount).toBe(3);
    expect(domainProfile.dimensionScores.evaluate).toBe(40);
    expect(domainProfile.dimensionScores.analyze).toBe(40);
  });
});
