#!/usr/bin/env node

import { readFileSync } from "node:fs";

const files = [".agent-flow.md", "docs/TODO.md"];
let hasError = false;

for (const file of files) {
  const lines = readFileSync(file, "utf8").split(/\r?\n/);
  let inVerificationBlock = false;
  let seenHeading = false;

  lines.forEach((line, index) => {
    if (line === "## 验证记录" || line === "验证记录：") {
      seenHeading = true;
      return;
    }

    if (seenHeading && line === "```text") {
      inVerificationBlock = true;
      return;
    }

    if (inVerificationBlock && line === "```") {
      inVerificationBlock = false;
      seenHeading = false;
      return;
    }

    if (!inVerificationBlock || line.trim() === "") {
      return;
    }

    if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2} /.test(line)) {
      hasError = true;
      process.stderr.write(
        `${file}:${index + 1} verification record must start with yyyy-MM-dd HH:mm:ss\n`
      );
    }
  });
}

if (hasError) {
  process.exit(1);
}

process.stdout.write("Verification timestamp check passed\n");
