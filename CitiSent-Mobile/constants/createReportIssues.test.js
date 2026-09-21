if (typeof globalThis.require === "undefined") {
  globalThis.require = (path) => ({ uri: path });
}

import test from "node:test";
import assert from "node:assert/strict";

const {
  CREATE_REPORT_ISSUES,
  buildIssueOptionsFromDepartments,
  filterLguIssues,
  getCreateReportIssueById,
} = await import("./createReportIssues.js");

const sampleIssues = [
  {
    id: "bplo",
    slug: "bplo",
    name: "Business Permits and Licensing Office (BPLO)",
    label: "Business Permits and Licensing Office (BPLO)",
  },
  {
    id: "city-treasury",
    slug: "city-treasury",
    name: "City Treasury Office",
    label: "City Treasury Office",
  },
  {
    id: "bfp-processing",
    slug: "bfp-processing",
    name: "Bureau of Fire Protection (BFP) Processing Area",
    label: "Bureau of Fire Protection (BFP) Processing Area",
  },
  {
    id: "traffic-management",
    slug: "traffic-management",
    name: "City Traffic Management Division/Impounding Services",
    label: "City Traffic Management Division/Impounding Services",
  },
  {
    id: "city-veterinary",
    slug: "city-veterinary",
    name: "City Veterinary Office",
    label: "City Veterinary Office",
  },
];

test("filterLguIssues: returns all issues when search query is empty or whitespace", () => {
  assert.equal(filterLguIssues(sampleIssues, "").length, 5);
  assert.equal(filterLguIssues(sampleIssues, "   ").length, 5);
  assert.equal(filterLguIssues(sampleIssues, null).length, 5);
  assert.equal(filterLguIssues(sampleIssues, undefined).length, 5);
});

test("filterLguIssues: case-insensitive matching works for lowercase, uppercase, mixed-case", () => {
  const lower = filterLguIssues(sampleIssues, "treasury");
  const upper = filterLguIssues(sampleIssues, "TREASURY");
  const mixed = filterLguIssues(sampleIssues, "CiTy TrEaSuRy");

  assert.equal(lower.length, 1);
  assert.equal(lower[0].id, "city-treasury");

  assert.equal(upper.length, 1);
  assert.equal(upper[0].id, "city-treasury");

  assert.equal(mixed.length, 1);
  assert.equal(mixed[0].id, "city-treasury");
});

test("filterLguIssues: matches partial name and substrings", () => {
  const partial = filterLguIssues(sampleIssues, "veter");
  assert.equal(partial.length, 1);
  assert.equal(partial[0].id, "city-veterinary");

  const fire = filterLguIssues(sampleIssues, "fire");
  assert.equal(fire.length, 1);
  assert.equal(fire[0].id, "bfp-processing");
});

test("filterLguIssues: matches acronym or slug", () => {
  const bplo = filterLguIssues(sampleIssues, "bplo");
  assert.equal(bplo.length, 1);
  assert.equal(bplo[0].id, "bplo");

  const bfp = filterLguIssues(sampleIssues, "bfp");
  assert.equal(bfp.length, 1);
  assert.equal(bfp[0].id, "bfp-processing");
});

test("filterLguIssues: ignores leading and trailing spaces in user query", () => {
  const result = filterLguIssues(sampleIssues, "   traffic   ");
  assert.equal(result.length, 1);
  assert.equal(result[0].id, "traffic-management");
});

test("filterLguIssues: returns empty array when no matches found", () => {
  const result = filterLguIssues(sampleIssues, "nonexistent office 12345");
  assert.equal(result.length, 0);
});

test("filterLguIssues: handles malformed or empty issue arrays gracefully", () => {
  assert.deepEqual(filterLguIssues([], "treasury"), []);
  assert.deepEqual(filterLguIssues(null, "treasury"), []);
  assert.deepEqual(filterLguIssues(undefined, "treasury"), []);
});

test("buildIssueOptionsFromDepartments: correctly transforms department objects", () => {
  const departments = [
    { id: "dept-1", slug: "city-health", name: "City Health Office", logoUrl: "" },
    { id: "dept-2", slug: "assessor", name: "City Assessor Office", logoUrl: "https://example.com/logo.png" },
  ];

  const options = buildIssueOptionsFromDepartments(departments);
  assert.equal(options.length, 2);
  assert.equal(options[0].id, "city-health");
  assert.equal(options[0].label, "City Health Office");
  assert.equal(options[1].id, "assessor");
});
