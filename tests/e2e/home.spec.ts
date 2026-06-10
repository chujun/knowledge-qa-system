import { expect, test } from "@playwright/test";

test.setTimeout(120000);

test("shows the local knowledge QA workspace", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "知识问答工作台" })).toBeVisible();
  await expect(page.getByText("当前页面已经读取真实本地数据")).toBeVisible();
  await expect(page.getByText("Local Runtime")).toBeVisible();
  await expect(page.getByRole("heading", { name: "创建知识结构" })).toBeVisible();
  await expect(page.getByRole("link", { name: "知识结构管理" })).toBeVisible();
  await expect(page.getByRole("link", { name: "题库管理" })).toBeVisible();
  await expect(page.getByRole("link", { name: "针对性练习" })).toBeVisible();
  await expect(page.getByRole("link", { name: "掌握画像" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Open\s+答题记录/ })).toBeVisible();
  await expect(page.getByRole("link", { name: "错误集管理" })).toBeVisible();
  await expect(page.getByRole("link", { name: "调用记录" })).toBeVisible();
  await expect(page.getByRole("link", { name: "系统设置" })).toBeVisible();
  const agentIntegrationLink = page.getByRole("link", { name: /Agent 接入/ });
  await expect(agentIntegrationLink).toBeVisible();
  await expect(agentIntegrationLink).toHaveAttribute("href", "/integrations");
  await expect(page.getByRole("link", { name: "系统设置" })).toHaveAttribute(
    "href",
    "/settings"
  );
  await expect(page.getByRole("heading", { name: "待确认入库" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "最近生成题目" })).toBeVisible();

  await page.goto("/integrations");
  await expect(page.getByRole("heading", { name: "Agent/MCP 接入" })).toBeVisible();
  await expect(page.getByText("qa_create_from_conversation").first()).toBeVisible();
  await expect(page.getByText("npm run mcp:stdio").first()).toBeVisible();
  await expect(page.getByText("<your-api-key>").first()).toBeVisible();

  await page.goto("/settings");
  await expect(page.getByRole("heading", { name: "系统设置" })).toBeVisible();
  await expect(page.getByText("minimax-m2.7-highspeed").first()).toBeVisible();
  await expect(page.getByText("Codex").first()).toBeVisible();
  await expect(page.getByText("页面不显示真实值").first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "环境配置说明" })).toBeVisible();
  await expect(page.getByText("DATABASE_URL").first()).toBeVisible();
  await expect(page.getByText(".env.local 示例")).toBeVisible();
  await expect(page.getByText("PowerShell 临时配置")).toBeVisible();
  await expect(page.getByText("<local-api-key>").first()).toBeVisible();
  await expect(page.getByText("npm run mcp:check").first()).toBeVisible();
});

test("edits a pending review item before confirmation", async ({ page, request }) => {
  const unique = Date.now();
  const response = await request.post("/api/v1/ingestions/external-conversation", {
    data: {
      source_system: "Codex",
      conversation_id: `e2e-review-${unique}`,
      context_type: "summary",
      conversation_summary:
        "用户正在学习 GitHub Actions，希望把会话沉淀为待确认知识问答。",
      instruction: `围绕 GitHub Actions 生成待确认编辑测试 ${unique}`,
      target_domain_hint: "计算机"
    },
    headers: {
      "x-api-key": "local-dev-key"
    }
  });
  const body = await response.json();
  const reviewItemId = body.data.review_item_id as string;
  const editedTopic = `E2E 待确认主题 ${unique}`;

  expect(response.ok()).toBe(true);

  await page.goto(`/review/${reviewItemId}`);
  await expect(page.getByRole("heading", { name: "待确认内容编辑" })).toBeVisible();
  await page.getByLabel("建议领域").fill("计算机工程");
  await page.getByLabel("建议主题").fill(editedTopic);
  await page.getByLabel("知识点预览").fill("workflow 文件结构\n触发条件\njobs 与 steps");
  await page.getByLabel("题目预览 JSON").fill(
    JSON.stringify(
      [
        {
          stem: `如何分析 ${editedTopic} 的触发条件？`,
          cognitive_dimension: "analyze",
          difficulty_level: 4
        }
      ],
      null,
      2
    )
  );
  await page.getByRole("button", { name: "保存预览" }).click();

  await expect(page.getByRole("heading", { name: editedTopic })).toBeVisible();
  await expect(page.getByText("jobs 与 steps", { exact: true })).toBeVisible();
  await expect(page.getByText("分析", { exact: true })).toBeVisible();

  await page.goto("/");
  await page.getByLabel("待确认来源系统").fill("Codex");
  await page.getByLabel("待确认状态").selectOption("pending");
  await page.getByRole("button", { name: "筛选待确认" }).click();
  await expect(page).toHaveURL(/review_source_system=Codex/);
  await expect(page.getByText(editedTopic).first()).toBeVisible();
  await expect(page.getByText(/ingestion_task · Codex/).first()).toBeVisible();
  await expect(page.getByRole("link", { name: "清除" }).first()).toBeVisible();
  await page.getByLabel(`选择待确认项 ${editedTopic}`).check();
  await page.getByRole("button", { name: "批量拒绝" }).click();
  await expect
    .poll(
      async () => {
        const reviewItemResponse = await request.get(
          `/api/v1/review-items/${reviewItemId}`,
          {
            headers: {
              "x-api-key": "local-dev-key"
            }
          }
        );
        const reviewItemBody = await reviewItemResponse.json();
        return reviewItemBody.data.status as string;
      },
      { timeout: 15000 }
    )
    .toBe("rejected");
  await page.goto("/?review_status=rejected&review_source_system=Codex#待确认");
  await expect(page.getByText(editedTopic).first()).toBeVisible();
  await expect(page.getByText("rejected").first()).toBeVisible();

  await page.goto("/records");
  await expect(page.getByRole("heading", { name: "Agent/MCP 调用记录" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "来源筛选" })).toBeVisible();
  await page.getByLabel("来源系统").fill("Codex");
  await page.getByRole("button", { name: "筛选来源" }).click();
  await expect(page).toHaveURL(/source_system=Codex/);
  await expect(page.getByRole("heading", { name: "Agent 会话来源" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Codex" }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: "清除" }).first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "模型生成调用" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "质量校验记录" })).toBeVisible();
});

test("runs the MVP browser learning loop", async ({ page, request }) => {
  const unique = Date.now();
  const domainName = `E2E 计算机 ${unique}`;
  const topicName = `E2E GitHub Actions ${unique}`;
  const pointName = `E2E workflow 触发条件 ${unique}`;
  const editedDomainName = `${domainName} 已编辑`;
  const editedTopicName = `${topicName} 已编辑`;
  const editedPointName = `${pointName} 已编辑`;

  await page.goto("/");
  await page.getByLabel("领域名称").fill(domainName);
  await page.getByLabel("领域说明").fill("E2E 通过浏览器创建的知识领域");
  await page.getByRole("button", { name: "创建领域" }).click();

  await expect(page.getByLabel("主题所属领域")).toContainText(domainName);
  await page.getByLabel("主题所属领域").selectOption({ label: domainName });
  await page.getByLabel("主题名称").fill(topicName);
  await page.getByLabel("主题说明").fill("E2E 通过浏览器创建的知识主题");
  await page.getByRole("button", { name: "创建主题" }).click();

  await expect(page.getByLabel("知识点所属领域")).toContainText(domainName);
  await expect(page.getByLabel("知识点所属主题")).toContainText(topicName);
  await page.getByLabel("知识点所属领域").selectOption({ label: domainName });
  await page.getByLabel("知识点所属主题").selectOption({ label: topicName });
  await page.getByLabel("知识点类型").selectOption({ label: "概念类" });
  await page.getByLabel("知识点名称").fill(pointName);
  await page.getByLabel("知识点说明").fill("E2E 通过浏览器创建的知识点");
  await page.getByRole("button", { name: "创建知识点" }).click();

  const pointCard = page.locator("article").filter({ hasText: pointName }).first();
  await expect(pointCard).toBeVisible();
  await pointCard.getByRole("button", { name: "生成题目" }).click();

  const generatedQuestionCard = page
    .locator("article")
    .filter({ hasText: pointName })
    .filter({ hasText: "pending_confirmation" })
    .first();
  await expect(generatedQuestionCard).toBeVisible();
  const generatedQuestionHref = await generatedQuestionCard
    .getByRole("link", { name: "查看详情" })
    .getAttribute("href");
  expect(generatedQuestionHref).toBeTruthy();
  await page.goto(generatedQuestionHref!);

  await expect(page.getByText("Question Detail")).toBeVisible();
  await page.getByRole("button", { name: "确认入库" }).click();
  await expect(page.getByText("confirmed").first()).toBeVisible();
  const editedCoreTitle = `E2E 编辑后的核心讲解 ${unique}`;
  await page.getByLabel("编辑核心讲解标题").fill(editedCoreTitle);
  await page.getByLabel("编辑核心讲解正文").fill("E2E 编辑后的核心讲解正文，覆盖定义、边界和应用场景。");
  await page.getByRole("button", { name: "保存核心讲解" }).click();
  await expect(page.getByRole("heading", { name: editedCoreTitle })).toBeVisible();

  const editedStem = `E2E 编辑后的题干 ${unique}`;
  await page.getByLabel("编辑题干").fill(editedStem);
  await page.getByLabel("编辑标准答案").fill("E2E 编辑后的标准答案，包含 workflow 触发条件、jobs 和 steps。");
  await page.getByLabel("编辑答案讲解").fill("E2E 编辑后的答案讲解。");
  await page.getByRole("button", { name: "保存新版本" }).click();
  await expect(page.getByRole("heading", { name: editedStem })).toBeVisible();

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

  await page.goto("/attempts");
  await expect(page.getByRole("heading", { name: "答题记录" })).toBeVisible();
  await expect(page.getByText(editedStem).first()).toBeVisible();
  await expect(page.getByText("用户已确认").first()).toBeVisible();
  await expect(page.getByText("E2E 确认评分").first()).toBeVisible();
  await expect(page.getByRole("link", { name: "查看题目" }).first()).toBeVisible();

  await page.goto("/mastery");
  await expect(page.getByRole("heading", { name: "掌握画像" })).toBeVisible();
  const masteryCard = page.locator("article").filter({ hasText: pointName }).first();
  await expect(masteryCard).toBeVisible();
  await expect(masteryCard.getByText("应用", { exact: true }).first()).toBeVisible();
  await expect(masteryCard.getByRole("link", { name: "针对练习" })).toBeVisible();

  await page.goto("/error-sets");
  await expect(page.getByRole("heading", { name: "错误集管理" })).toBeVisible();
  await expect(page.getByText(pointName).first()).toBeVisible();
  await expect(page.getByRole("button", { name: "标记已解决" }).first()).toBeVisible();

  await page.goto("/domains");
  await expect(page.getByRole("heading", { name: "知识结构管理" })).toBeVisible();
  await expect(page.getByText(domainName)).toBeVisible();
  await expect(page.getByText(topicName)).toBeVisible();
  await expect(page.getByText(pointName)).toBeVisible();
  await page.locator("article").filter({ hasText: domainName }).first().getByText("编辑领域").click();
  await page.getByLabel(`${domainName} 领域名称`).fill(editedDomainName);
  await page.getByRole("button", { name: "保存领域" }).click();
  await expect(page.getByText(editedDomainName)).toBeVisible();

  await openDetailsForControl(page, `${topicName} 主题名称`);
  await page.getByLabel(`${topicName} 主题名称`).fill(editedTopicName);
  await page.getByRole("button", { name: "保存主题" }).click();
  await expect(page.getByText(editedTopicName)).toBeVisible();

  await openDetailsForControl(page, `${pointName} 知识点名称`);
  await page.getByLabel(`${pointName} 知识点名称`).fill(editedPointName);
  await page.getByLabel(`${pointName} 建议难度`).fill("4");
  await page.getByRole("button", { name: "保存知识点" }).click();
  await expect(page.getByText(editedPointName)).toBeVisible();

  await page.goto("/questions");
  await expect(page.getByRole("heading", { name: "题库管理" })).toBeVisible();
  await expect(page.getByLabel("状态")).toBeVisible();
  await page.getByLabel("状态").selectOption("confirmed");
  await page.getByLabel("知识点").selectOption({ label: editedPointName });
  await page.getByRole("button", { name: "筛选题库" }).click();
  await expect(page).toHaveURL(/status=confirmed/);
  await expect(page).toHaveURL(/knowledge_point_id=/);
  await expect(page.getByText("当前筛选结果")).toBeVisible();
  await expect(page.getByRole("heading", { name: editedStem }).first()).toBeVisible();

  await page.goto("/practice");
  await expect(page.getByRole("heading", { name: "针对性练习" })).toBeVisible();
  await page.getByLabel("练习知识点", { exact: true }).selectOption({ label: editedPointName });
  await page.getByLabel("练习题目数量").fill("1");
  const practiceTargetId = await page.getByLabel("练习知识点", { exact: true }).inputValue();
  const practiceResponse = await request.post("/api/v1/practice-sessions", {
    data: {
      session_type: "knowledge_point",
      target_type: "knowledge_point",
      target_id: practiceTargetId,
      strategy: {
        include_error_set: true,
        prefer_weak_dimensions: true,
        question_count: 1
      }
    },
    headers: {
      "x-api-key": "local-dev-key"
    }
  });
  const practiceBody = await practiceResponse.json();
  expect(practiceResponse.ok()).toBe(true);

  await page.goto("/practice");
  await expect(page.getByRole("heading", { name: "历史练习" })).toBeVisible();
  await page.getByLabel("筛选练习知识点").selectOption({ label: editedPointName });
  await page.getByRole("button", { name: "筛选练习" }).click();
  await expect(page).toHaveURL(/knowledge_point_id=/);
  await expect(page.getByText("当前筛选结果")).toBeVisible();
  const practiceSessionCard = page
    .locator("article")
    .filter({ hasText: editedPointName })
    .filter({ hasText: "created" })
    .first();
  await expect(practiceSessionCard).toBeVisible();
  await expect(practiceSessionCard.getByRole("link", { name: "进入练习" })).toBeVisible();

  await page.goto(`/practice/${practiceBody.data.id}`);

  await expect(page.getByRole("heading", { name: "练习会话" })).toBeVisible();
  await expect(page.getByText("Current Question")).toBeVisible();
  await expect(page.getByText("待完成")).toBeVisible();
  await page.getByLabel("练习答案").fill("我会先说明 workflow 触发条件，再分析 jobs 和 steps 如何执行。");
  await page.getByRole("button", { name: "提交本题" }).click();
  await expect(page.getByText("最近得分")).toBeVisible();
  await expect(page.getByText("completed").first()).toBeVisible();
});

async function openDetailsForControl(page: import("@playwright/test").Page, label: string) {
  await page.locator(`[aria-label="${label}"]`).evaluate((element) => {
    const details = element.closest("details");
    if (details) {
      details.open = true;
    }
  });
}
