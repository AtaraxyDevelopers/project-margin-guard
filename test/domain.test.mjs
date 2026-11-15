import test from "node:test";
import assert from "node:assert/strict";
import { config, example, analyze } from "../src/domain.mjs";
import { validateState } from "../src/lib.mjs";
test("Documented sample results match independently specified expectations", () => {
  const report = analyze(example.records, example.settings, config.asOf);
  for (const [label, value] of [
    ["Approved revenue", "15000.00"],
    ["Forecast profit", "3500.00"],
    ["Projects below target", 1],
  ])
    assert.equal(
      report.metrics.find((m) => m.label === label).value,
      value,
      label,
    );
});
test("Business edge cases", () => {
  (function edge(records, s, analyze) {
    assert.equal(analyze([records[0]], s).rows[0]["Forecast cost"], "7000.00");
    assert.equal(
      analyze([{ ...records[0], unapprovedHours: 0 }], s).rows[0][
        "Forecast cost"
      ],
      "7000.00",
    );
  })(example.records, example.settings, analyze, validateState);
});
