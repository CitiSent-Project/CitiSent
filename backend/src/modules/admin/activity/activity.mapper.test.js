import test from "node:test";
import assert from "node:assert/strict";
import { toAdminActivityLogResponse } from "./activity.mapper.js";

test("toAdminActivityLogResponse maps persisted activity log row", () => {
  const response = toAdminActivityLogResponse({
    id: "activity-1",
    admin_user_id: "admin-1",
    action: "Login",
    detail: "Signed in as admin@citisent.gov",
    created_at: "2026-04-01T00:00:00.000Z",
  });

  assert.equal(response.id, "activity-1");
  assert.equal(response.adminId, "admin-1");
  assert.equal(response.action, "Login");
  assert.equal(response.createdAt, "2026-04-01T00:00:00.000Z");
});
