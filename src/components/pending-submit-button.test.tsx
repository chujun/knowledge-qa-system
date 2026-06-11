import React from "react";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const formStatus = vi.hoisted(() => ({
  pending: false
}));

vi.mock("react-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-dom")>();
  return {
    ...actual,
    useFormStatus: () => ({ pending: formStatus.pending })
  };
});

import { PendingSubmitButton } from "./pending-submit-button";

describe("PendingSubmitButton", () => {
  beforeEach(() => {
    formStatus.pending = false;
  });

  it("shows normal label when the form is idle", () => {
    render(
      <PendingSubmitButton className="button-class">生成题目</PendingSubmitButton>
    );

    const button = screen.getByRole("button", { name: "生成题目" });
    expect(button).toBeEnabled();
    expect(button).toHaveAttribute("aria-busy", "false");
  });

  it("shows generic processing label and disables itself while pending", () => {
    formStatus.pending = true;

    render(
      <PendingSubmitButton className="button-class">生成题目</PendingSubmitButton>
    );

    const button = screen.getByRole("button", { name: "后台处理中" });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
  });
});
