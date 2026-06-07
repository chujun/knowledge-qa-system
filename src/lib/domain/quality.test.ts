import { decideQualityNextStep } from "./quality";

describe("quality check decisions", () => {
  it("requires auto fix when quality check fails and attempts remain", () => {
    expect(
      decideQualityNextStep({
        result: "failed",
        autoFixAttempts: 1,
        maxAutoFixAttempts: 3
      })
    ).toBe("auto_fix_required");
  });

  it("moves to manual handling when auto fix attempts are exhausted", () => {
    expect(
      decideQualityNextStep({
        result: "failed",
        autoFixAttempts: 3,
        maxAutoFixAttempts: 3
      })
    ).toBe("manual_required");
  });

  it("accepts passed and warning results with distinct decisions", () => {
    expect(
      decideQualityNextStep({
        result: "passed",
        autoFixAttempts: 0,
        maxAutoFixAttempts: 3
      })
    ).toBe("accept");

    expect(
      decideQualityNextStep({
        result: "warning",
        autoFixAttempts: 0,
        maxAutoFixAttempts: 3
      })
    ).toBe("accept_with_warning");
  });
});
