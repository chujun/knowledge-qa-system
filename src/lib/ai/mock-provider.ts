export type MockGenerationResult = {
  modelName: string;
  aiAgent: string;
  content: string;
};

export function generateMockQuestion(topic: string): MockGenerationResult {
  return {
    modelName: "mock-minimax-m2.7-highspeed",
    aiAgent: "Codex",
    content: `请解释 ${topic} 的核心用途，并给出一个实际应用场景。`
  };
}
