import test from "node:test";
import assert from "node:assert/strict";

import { deleteDepartmentSchema } from "./departments.schema.js";

function parseDeleteDepartmentQuery(query = {}) {
  return deleteDepartmentSchema.parse({
    body: {},
    params: {
      departmentSlug: "old-department",
    },
    query,
  }).query;
}

test("deleteDepartmentSchema only enables cleanup for an explicit true flag", () => {
  assert.equal(parseDeleteDepartmentQuery().cleanup, false);
  assert.equal(parseDeleteDepartmentQuery({ cleanup: "false" }).cleanup, false);
  assert.equal(parseDeleteDepartmentQuery({ cleanup: false }).cleanup, false);
  assert.equal(parseDeleteDepartmentQuery({ cleanup: "true" }).cleanup, true);
  assert.equal(parseDeleteDepartmentQuery({ cleanup: true }).cleanup, true);
});

test("deleteDepartmentSchema rejects invalid cleanup flags", () => {
  assert.throws(() => parseDeleteDepartmentQuery({ cleanup: "yes" }));
});
