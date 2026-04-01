import test from "node:test";
import assert from "node:assert/strict";
import { toAdminNotificationResponse } from "./notifications.mapper.js";

test("toAdminNotificationResponse maps persisted notification shape", () => {
  const response = toAdminNotificationResponse({
    id: "notif-1",
    title: "Transfer approved",
    message: "Your transfer request was approved.",
    type: "account",
    is_read: false,
    report_id: null,
    read_at: null,
    created_at: "2026-04-01T00:00:00.000Z",
  });

  assert.equal(response.id, "notif-1");
  assert.equal(response.type, "Account");
  assert.equal(response.read, false);
  assert.equal(response.createdAt, "2026-04-01T00:00:00.000Z");
});
