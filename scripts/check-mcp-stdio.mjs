#!/usr/bin/env node

process.argv.push("--self-check");
await import("./knowledge-qa-mcp-stdio.mjs");
