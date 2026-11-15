import { round, sum, ratio, days, money, metric, notice } from "./lib.mjs";
export const config = {
  slug: "project-margin-guard",
  title: "Project Scope & Margin Guard",
  description:
    "Spot scope creep and estimate the cost to finish before a project loses its margin.",
  scope:
    "A local planning workspace. Review suggestions before acting; no automatic messages or financial transactions.",
  method:
    "Forecast cost includes actual plus remaining hours at loaded cost, plus incurred and remaining expenses. Only approved change revenue increases the fee. Unapproved hours are flagged and already included in hours; they are not added again.",
  port: 4430,
  asOf: "2026-11-15",
  fields: [
    {
      key: "name",
      label: "Project / customer",
      type: "text",
    },
    {
      key: "fee",
      label: "Original fixed fee",
      type: "number",
      min: 0,
      max: 100000000,
    },
    {
      key: "approvedChanges",
      label: "Approved change revenue",
      type: "number",
      min: 0,
      max: 100000000,
    },
    {
      key: "plannedHours",
      label: "Original planned hours",
      type: "number",
      min: 0,
      max: 100000000,
    },
    {
      key: "actualHours",
      label: "Hours already worked",
      type: "number",
      min: 0,
      max: 100000000,
    },
    {
      key: "remainingHours",
      label: "Estimated hours to finish",
      type: "number",
      min: 0,
      max: 100000000,
    },
    {
      key: "hourlyCost",
      label: "Loaded labor cost per hour",
      type: "number",
      min: 0,
      max: 100000000,
    },
    {
      key: "expenses",
      label: "Expenses incurred",
      type: "number",
      min: 0,
      max: 100000000,
    },
    {
      key: "remainingExpenses",
      label: "Estimated remaining expenses",
      type: "number",
      min: 0,
      max: 100000000,
    },
    {
      key: "unapprovedHours",
      label: "Unapproved hours included in actual / remaining",
      type: "number",
      min: 0,
      max: 100000000,
    },
  ],
  settings: [
    {
      key: "currency",
      label: "Currency code (one currency per workspace)",
      type: "text",
      maxLength: 3,
    },
    {
      key: "targetMargin",
      label: "Target project margin (%)",
      type: "number",
      min: 0,
      max: 100,
    },
  ],
  actions: [],
  document: false,
};
config.validate = function validate(records) {
  for (const r of records)
    if (r.unapprovedHours > r.actualHours + r.remainingHours)
      throw new Error(
        "Unapproved hours must be included in total forecast hours",
      );
};
export const example = {
  schemaVersion: 1,
  project: "project-margin-guard",
  settings: {
    currency: "USD",
    targetMargin: 25,
  },
  records: [
    {
      id: "project-1",
      name: "Maple customer portal",
      fee: 10000,
      approvedChanges: 1000,
      plannedHours: 100,
      actualHours: 80,
      remainingHours: 40,
      hourlyCost: 50,
      expenses: 500,
      remainingExpenses: 500,
      unapprovedHours: 15,
    },
    {
      id: "project-2",
      name: "River reporting dashboard",
      fee: 4000,
      approvedChanges: 0,
      plannedHours: 60,
      actualHours: 50,
      remainingHours: 30,
      hourlyCost: 50,
      expenses: 500,
      remainingExpenses: 0,
      unapprovedHours: 10,
    },
  ],
};
export function analyze(records, s) {
  const belowTarget = new Set(
    records
      .filter((r) => {
        const revenue = r.fee + r.approvedChanges;
        const cost =
          (r.actualHours + r.remainingHours) * r.hourlyCost +
          r.expenses +
          r.remainingExpenses;
        return (
          revenue === 0 || ((revenue - cost) / revenue) * 100 < s.targetMargin
        );
      })
      .map((r) => r.id),
  );

  const rows = records.map((r) => {
    const revenue = r.fee + r.approvedChanges,
      cost =
        (r.actualHours + r.remainingHours) * r.hourlyCost +
        r.expenses +
        r.remainingExpenses;
    return {
      id: r.id,
      Project: r.name,
      "Approved revenue": money(revenue),
      "Forecast cost": money(cost),
      "Forecast profit": money(revenue - cost),
      "Margin (%)": ratio(revenue - cost, revenue) ?? "N/A",
      "Hours over plan": Math.max(
        0,
        round(r.actualHours + r.remainingHours - r.plannedHours),
      ),
      "Unapproved hours": r.unapprovedHours,
    };
  });
  return {
    metrics: [
      metric(
        "Approved revenue",
        money(sum(records.map((r) => r.fee + r.approvedChanges))),
        s.currency,
      ),
      metric(
        "Forecast profit",
        money(sum(rows.map((r) => Number(r["Forecast profit"])))),
        s.currency,
      ),
      metric(
        "Projects below target",
        rows.filter((r) => belowTarget.has(r.id)).length,
      ),
    ],
    notices: records
      .filter((r) => r.unapprovedHours > 0)
      .map((r) =>
        notice(
          r.id,
          `${r.name}: review ${r.unapprovedHours} unapproved hours with the customer before further work.`,
          "warning",
        ),
      ),
    columns: [
      "Project",
      "Approved revenue",
      "Forecast cost",
      "Forecast profit",
      "Margin (%)",
      "Hours over plan",
      "Unapproved hours",
    ],
    rows,
  };
}
