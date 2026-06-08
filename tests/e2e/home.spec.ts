import { expect, test } from "@playwright/test";

test("shows the local knowledge QA workspace", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "知识问答工作台" })).toBeVisible();
  await expect(page.getByText("当前页面已经读取真实本地数据")).toBeVisible();
  await expect(page.getByText("Local Runtime")).toBeVisible();
  await expect(page.getByRole("heading", { name: "待确认入库" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "下一道可练习题" })).toBeVisible();
});
