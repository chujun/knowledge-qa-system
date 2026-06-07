export type CognitiveDimension =
  | "understand"
  | "distinguish"
  | "apply"
  | "analyze"
  | "evaluate";

export type DimensionScores = Record<CognitiveDimension, number>;

export interface MasteryEvidence {
  dimension: CognitiveDimension;
  score: number;
  difficultyLevel: number;
}

export interface MasteryProfileSnapshot {
  targetType: "knowledge_point" | "topic" | "domain";
  targetId: string;
  dimensionScores: DimensionScores;
  overallScore: number;
  evidenceCount: number;
}

const dimensions: CognitiveDimension[] = [
  "understand",
  "distinguish",
  "apply",
  "analyze",
  "evaluate"
];

const emptyScores: DimensionScores = {
  understand: 0,
  distinguish: 0,
  apply: 0,
  analyze: 0,
  evaluate: 0
};

export function calculateKnowledgePointMastery(
  knowledgePointId: string,
  evidence: MasteryEvidence[]
): MasteryProfileSnapshot {
  const totals: DimensionScores = { ...emptyScores };
  const weights: DimensionScores = { ...emptyScores };

  for (const item of evidence) {
    const difficultyWeight = Math.max(1, item.difficultyLevel);
    totals[item.dimension] += clampScore(item.score) * difficultyWeight;
    weights[item.dimension] += difficultyWeight;
  }

  const dimensionScores = Object.fromEntries(
    dimensions.map((dimension) => [
      dimension,
      weights[dimension] === 0
        ? 0
        : roundScore(totals[dimension] / weights[dimension])
    ])
  ) as DimensionScores;

  return {
    targetType: "knowledge_point",
    targetId: knowledgePointId,
    dimensionScores,
    overallScore: averageDimensionScores(dimensionScores),
    evidenceCount: evidence.length
  };
}

export function aggregateMasteryProfiles(
  targetType: "topic" | "domain",
  targetId: string,
  children: MasteryProfileSnapshot[]
): MasteryProfileSnapshot {
  const totals: DimensionScores = { ...emptyScores };
  const totalWeight = children.reduce(
    (sum, child) => sum + Math.max(1, child.evidenceCount),
    0
  );

  for (const child of children) {
    const weight = Math.max(1, child.evidenceCount);

    for (const dimension of dimensions) {
      totals[dimension] += child.dimensionScores[dimension] * weight;
    }
  }

  const dimensionScores = Object.fromEntries(
    dimensions.map((dimension) => [
      dimension,
      totalWeight === 0 ? 0 : roundScore(totals[dimension] / totalWeight)
    ])
  ) as DimensionScores;

  return {
    targetType,
    targetId,
    dimensionScores,
    overallScore: averageDimensionScores(dimensionScores),
    evidenceCount: children.reduce((sum, child) => sum + child.evidenceCount, 0)
  };
}

function averageDimensionScores(scores: DimensionScores): number {
  return roundScore(
    dimensions.reduce((sum, dimension) => sum + scores[dimension], 0) /
      dimensions.length
  );
}

function clampScore(score: number): number {
  return Math.min(100, Math.max(0, score));
}

function roundScore(score: number): number {
  return Math.round(score * 100) / 100;
}
