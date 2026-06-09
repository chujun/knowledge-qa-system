import { expect, test } from "@playwright/test";

test("shows the local knowledge QA workspace", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "知识问答工作台" })).toBeVisible();
  await expect(page.getByText("当前页面已经读取真实本地数据")).toBeVisible();
  await expect(page.getByText("Local Runtime")).toBeVisible();
  await expect(page.getByRole("heading", { name: "创建知识结构" })).toBeVisible();
  await expect(page.getByRole("link", { name: "知识结构管理" })).toBeVisible();
  await expect(page.getByRole("link", { name: "题库管理" })).toBeVisible();
  await expect(page.getByRole("link", { name: "针对性练习" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "待确认入库" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "最近生成题目" })).toBeVisible();
});

test("runs the MVP browser learning loop", async ({ page }) => {
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
  await generatedQuestionCard.getByRole("link", { name: "查看详情" }).click();

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
  await expect(page.getByRole("heading", { name: new RegExp(pointName) }).first()).toBeVisible();

  await page.goto("/practice");
  await expect(page.getByRole("heading", { name: "针对性练习" })).toBeVisible();
  await page.getByLabel("练习知识点").selectOption({ label: editedPointName });
  await page.getByLabel("练习题目数量").fill("1");
  await page.getByRole("button", { name: "创建练习" }).click();

  await expect(page.getByRole("heading", { name: "练习会话" })).toBeVisible();
  await expect(page.getByRole("link", { name: "去答题" }).first()).toBeVisible();
});

async function openDetailsForControl(page: import("@playwright/test").Page, label: string) {
  await page.locator(`[aria-label="${label}"]`).evaluate((element) => {
    const details = element.closest("details");
    if (details) {
      details.open = true;
    }
  });
}
