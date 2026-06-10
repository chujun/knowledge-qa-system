import React from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { KnowledgePointCreateForm } from "./knowledge-point-create-form";

describe("KnowledgePointCreateForm", () => {
  it("filters topic options by the selected domain", () => {
    render(
      <KnowledgePointCreateForm
        action={vi.fn()}
        domains={[
          { id: "domain-history", name: "历史" },
          { id: "domain-computer", name: "计算机" }
        ]}
        knowledgeTypes={[{ id: "type-concept", name: "概念类" }]}
        topics={[
          { id: "topic-fubing", domain_id: "domain-history", name: "府兵制" },
          { id: "topic-actions", domain_id: "domain-computer", name: "GitHub Actions" }
        ]}
      />
    );

    const domainSelect = screen.getByLabelText("知识点所属领域");
    const topicSelect = screen.getByLabelText("知识点所属主题");

    expect(topicSelect).toBeDisabled();

    fireEvent.change(domainSelect, { target: { value: "domain-history" } });

    expect(topicSelect).toBeEnabled();
    expect(within(topicSelect).getByRole("option", { name: "府兵制" })).toBeInTheDocument();
    expect(
      within(topicSelect).queryByRole("option", { name: "GitHub Actions" })
    ).not.toBeInTheDocument();
  });
});
