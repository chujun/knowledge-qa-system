import { describe, expect, it } from "vitest";

import { parseModelJsonObject } from "./model-json";

describe("model JSON parser", () => {
  it("parses strict JSON", () => {
    expect(parseModelJsonObject('{"passed":true}')).toEqual({ passed: true });
  });

  it("extracts fenced JSON after model thinking text", () => {
    expect(
      parseModelJsonObject(
        '<think>先分析一下</think>\n```json\n{"core_explanation":{"title":"A"}}\n```'
      )
    ).toEqual({ core_explanation: { title: "A" } });
  });

  it("extracts the first balanced JSON object from mixed text", () => {
    expect(parseModelJsonObject('说明文本\n{"a":{"b":"c"}}\n后续文本')).toEqual({
      a: { b: "c" }
    });
  });

  it("prefers the final JSON object when model thinking repeats the input schema", () => {
    expect(
      parseModelJsonObject(
        '<think>用户输入是 {"task":"生成","output_schema":{}}</think>\n{"core_explanation":{"title":"最终答案"}}'
      )
    ).toEqual({ core_explanation: { title: "最终答案" } });
  });
});
