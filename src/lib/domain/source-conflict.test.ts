import { decideSourceConflict } from "./source-conflict";

describe("source conflict rules", () => {
  it("does not require confirmation when incoming content matches active content", () => {
    expect(
      decideSourceConflict(
        {
          content: "GitHub Actions workflow is defined in YAML.",
          sourceReferenceId: "src_1"
        },
        {
          content: " GitHub Actions workflow is defined in YAML. ",
          sourceReferenceId: "src_2"
        }
      )
    ).toBe("no_conflict");
  });

  it("requires user confirmation when incoming content conflicts with active content", () => {
    expect(
      decideSourceConflict(
        {
          content: "Secrets are injected through the secrets context.",
          sourceReferenceId: "src_1"
        },
        {
          content: "Secrets should be hard-coded in workflow files.",
          sourceReferenceId: "src_2"
        }
      )
    ).toBe("requires_user_confirmation");
  });
});
