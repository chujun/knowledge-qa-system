import { expect, test } from "@playwright/test";

test("shows the local knowledge QA workspace", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "知识问答工作台" })).toBeVisible();
  await expect(page.getByText("GitHub Actions workflow 基础")).toBeVisible();
  await expect(page.getByText("Default Agent")).toBeVisible();
});
