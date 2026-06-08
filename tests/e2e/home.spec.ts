import { expect, test } from "@playwright/test";

const apiHeaders = {
  "x-api-key": "local-dev-key"
};

test("shows the local knowledge QA workspace", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "知识问答工作台" })).toBeVisible();
  await expect(page.getByText("当前页面已经读取真实本地数据")).toBeVisible();
  await expect(page.getByText("Local Runtime")).toBeVisible();
  await expect(page.getByRole("heading", { name: "待确认入库" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "最近生成题目" })).toBeVisible();
});

test("runs the MVP browser learning loop", async ({ page, request }) => {
  const unique = Date.now();
  const pointName = `E2E workflow 触发条件 ${unique}`;

  const domainResponse = await request.post("/api/v1/domains", {
    data: { name: `E2E 计算机 ${unique}` },
    headers: apiHeaders
  });
  expect(domainResponse.ok()).toBe(true);
  const domainBody = await domainResponse.json();

  const topicResponse = await request.post("/api/v1/topics", {
    data: {
      domain_id: domainBody.data.id,
      name: `E2E GitHub Actions ${unique}`
    },
    headers: apiHeaders
  });
  expect(topicResponse.ok()).toBe(true);
  const topicBody = await topicResponse.json();

  const typesResponse = await request.get("/api/v1/knowledge-types", {
    headers: apiHeaders
  });
  expect(typesResponse.ok()).toBe(true);
  const typesBody = await typesResponse.json();
  const conceptType = typesBody.data.find(
    (item: { code: string }) => item.code === "concept"
  );
  expect(conceptType).toBeTruthy();

  const pointResponse = await request.post("/api/v1/knowledge-points", {
    data: {
      domain_id: domainBody.data.id,
      topic_id: topicBody.data.id,
      knowledge_type_id: conceptType.id,
      name: pointName,
      description: "E2E 准备的知识点",
      complexity_level: "medium",
      suggested_difficulty: 3
    },
    headers: apiHeaders
  });
  expect(pointResponse.ok()).toBe(true);

  await page.goto("/");
  const pointCard = page.locator("article").filter({ hasText: pointName }).first();
  await expect(pointCard).toBeVisible();
  await pointCard.getByRole("button", { name: "生成题目" }).click();

  const generatedQuestionCard = page
    .locator("article")
    .filter({ hasText: pointName })
    .filter({ hasText: "pending_confirmation" })
    .first();
  await expect(generatedQuestionCard).toBeVisible();
  await generatedQuestionCard.getByRole("link", { name: "查看详情" }).click();

  await expect(page.getByText("Question Detail")).toBeVisible();
  await page.getByRole("button", { name: "确认入库" }).click();
  await expect(page.getByText("confirmed").first()).toBeVisible();

  await page
    .getByPlaceholder("输入你的答案，提交后系统会进行 mock AI 评分。")
    .fill("workflow 触发条件需要说明分支、事件、jobs 和 steps 的应用步骤。");
  await page.getByRole("button", { name: "提交答案" }).click();

  await expect(page.getByRole("heading", { name: "最近评分" })).toBeVisible();
  await expect(page.getByText("回答")).toBeVisible();

  await page.getByLabel("用户确认分数").fill("45");
  await page.getByPlaceholder("修正原因，可选").fill("E2E 确认评分");
  await page.getByRole("button", { name: "确认评分" }).click();

  await expect(page.getByText("user_confirmed")).toBeVisible();
});
