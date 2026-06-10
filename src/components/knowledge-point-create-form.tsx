"use client";

import React from "react";
import { useMemo, useState } from "react";

type DomainOption = {
  id: string;
  name: string;
};

type TopicOption = {
  id: string;
  domain_id: string;
  name: string;
};

type KnowledgeTypeOption = {
  id: string;
  name: string;
};

export function KnowledgePointCreateForm({
  action,
  domains,
  topics,
  knowledgeTypes
}: {
  action: (formData: FormData) => void;
  domains: DomainOption[];
  topics: TopicOption[];
  knowledgeTypes: KnowledgeTypeOption[];
}) {
  const [domainId, setDomainId] = useState("");
  const filteredTopics = useMemo(
    () => topics.filter((topic) => topic.domain_id === domainId),
    [domainId, topics]
  );
  const topicSelectDisabled = !domainId || filteredTopics.length === 0;

  return (
    <form action={action} className="space-y-3 border border-ink/15 bg-white/45 p-4">
      <h3 className="text-lg font-semibold">知识点</h3>
      <select
        aria-label="知识点所属领域"
        className="w-full border border-ink/20 bg-white/75 px-3 py-2 text-sm outline-none focus:border-clay"
        name="domain_id"
        onChange={(event) => setDomainId(event.target.value)}
        required
        value={domainId}
      >
        <option value="">先选择领域</option>
        {domains.map((domain) => (
          <option key={domain.id} value={domain.id}>
            {domain.name}
          </option>
        ))}
      </select>
      <select
        aria-label="知识点所属主题"
        className="w-full border border-ink/20 bg-white/75 px-3 py-2 text-sm outline-none disabled:bg-ink/5 disabled:text-ink/45 focus:border-clay"
        disabled={topicSelectDisabled}
        name="topic_id"
        required
      >
        <option value="">
          {domainId
            ? filteredTopics.length > 0
              ? "选择该领域下的主题"
              : "该领域暂无主题，请先创建主题"
            : "先选择领域后再选择主题"}
        </option>
        {filteredTopics.map((topic) => (
          <option key={topic.id} value={topic.id}>
            {topic.name}
          </option>
        ))}
      </select>
      <select
        aria-label="知识点类型"
        className="w-full border border-ink/20 bg-white/75 px-3 py-2 text-sm outline-none focus:border-clay"
        name="knowledge_type_id"
        required
      >
        {knowledgeTypes.map((type) => (
          <option key={type.id} value={type.id}>
            {type.name}
          </option>
        ))}
      </select>
      <input
        aria-label="知识点名称"
        className="w-full border border-ink/20 bg-white/75 px-3 py-2 text-sm outline-none focus:border-clay"
        name="point_name"
        placeholder="例如：workflow 触发条件"
        required
      />
      <textarea
        aria-label="知识点说明"
        className="min-h-24 w-full border border-ink/20 bg-white/75 px-3 py-2 text-sm outline-none focus:border-clay"
        name="point_description"
        placeholder="知识点说明，可选"
      />
      <button className="border border-clay bg-clay px-3 py-2 text-sm text-paper transition hover:bg-ink">
        创建知识点
      </button>
    </form>
  );
}
