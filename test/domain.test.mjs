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

test("A rounded percentage cannot hide a margin shortfall", () => {
  const report = analyze(
    [
      {
        ...example.records[0],
        ...{
          fee: 50,
          approvedChanges: 0,
          plannedHours: 1,
          actualHours: 1,
          remainingHours: 0,
          hourlyCost: 40.001,
          expenses: 0,
          remainingExpenses: 0,
          unapprovedHours: 0,
        },
      },
    ],
    { ...example.settings, ...{ targetMargin: 20 } },
    config.asOf,
  );
  assert.equal(report.rows[0]["Margin (%)"], 20);
  assert.equal(
    report.metrics.find((m) => m.label === "Projects below target").value,
    1,
  );
});
