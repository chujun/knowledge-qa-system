export function parseModelJsonObject(content: string) {
  const trimmed = content.trim();

  for (const candidate of extractJsonCandidates(trimmed)) {
    try {
      return JSON.parse(candidate) as unknown;
    } catch {
      // Try the next candidate; model output may include reasoning text first.
    }
  }

  return JSON.parse(trimmed) as unknown;
}

function extractJsonCandidates(content: string) {
  const candidates: string[] = [];
  const fencedMatches = content.matchAll(/```(?:json)?\s*([\s\S]*?)```/gi);

  for (const match of fencedMatches) {
    candidates.push(match[1].trim());
  }

  const balanced = extractFirstBalancedJsonObject(content);
  if (balanced) {
    candidates.push(balanced);
  }

  candidates.push(content);
  return candidates;
}

function extractFirstBalancedJsonObject(content: string) {
  const start = content.indexOf("{");
  if (start < 0) {
    return null;
  }

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = start; index < content.length; index += 1) {
    const char = content[index];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === "\"") {
        inString = false;
      }
      continue;
    }

    if (char === "\"") {
      inString = true;
      continue;
    }

    if (char === "{") {
      depth += 1;
    } else if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        return content.slice(start, index + 1);
      }
    }
  }

  return null;
}
