import { describe, expect, it } from "vitest";
import { generateMockQuestion } from "./mock-provider";

describe("generateMockQuestion", () => {
  it("returns a deterministic mock question", () => {
    const result = generateMockQuestion("GitHub Actions");

    expect(result.aiAgent).toBe("Codex");
    expect(result.modelName).toBe("mock-minimax-m2.7-highspeed");
    expect(result.content).toContain("GitHub Actions");
  });
});
