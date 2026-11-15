import assert from "node:assert/strict";
import { config, example, analyze } from "../src/domain.mjs";
import { validateState } from "../src/lib.mjs";
// Record another 1,000 of approved change revenue on the first project.
// This changes a copy of fictional data; no files or external services are changed.
const workspace = structuredClone(example);
Object.assign(workspace.records[0], { approvedChanges: 2000 });
const valid = validateState(workspace, config);
const report = analyze(valid.records, valid.settings, config.asOf);
const actual = report.metrics.find(
  (metric) => metric.label === "Forecast profit",
).value;
assert.equal(actual, "4500.00");
console.log("Forecast profit: " + actual);
