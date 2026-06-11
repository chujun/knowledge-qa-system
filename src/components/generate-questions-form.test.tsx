import React from "react";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { GenerateQuestionsState } from "./generate-questions-form";

const actionState = vi.hoisted(() => ({
  state: {
    status: "idle",
    message: null
  } as GenerateQuestionsState
}));

vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return {
    ...actual,
    useActionState: () => [actionState.state, vi.fn()]
  };
});

import { GenerateQuestionsForm } from "./generate-questions-form";

describe("GenerateQuestionsForm", () => {
  beforeEach(() => {
    actionState.state = {
      status: "idle",
      message: null
    };
  });

  it("renders the generate button with the knowledge point id", () => {
    render(
      <GenerateQuestionsForm
        action={vi.fn()}
        buttonClassName="button-class"
        className="form-class"
        knowledgePointId="point-1"
      />
    );

    expect(screen.getByRole("button", { name: "生成题目" })).toBeInTheDocument();
    expect(screen.getByDisplayValue("point-1")).toHaveAttribute(
      "name",
      "knowledge_point_id"
    );
  });

  it("shows the failed message inside the form", () => {
    actionState.state = {
      status: "failed",
      message: "生成题目失败：后台模型调用没有成功"
    };

    render(
      <GenerateQuestionsForm
        action={vi.fn()}
        buttonClassName="button-class"
        className="form-class"
        knowledgePointId="point-1"
      />
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "生成题目失败：后台模型调用没有成功"
    );
  });
});
