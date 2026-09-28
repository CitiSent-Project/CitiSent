import test from "node:test";
import assert from "node:assert/strict";
import { activityRepository } from "./activity.repository.js";

test("activityRepository tests", async (t) => {
  t.after(() => {
    activityRepository._setDb(null);
  });

  await t.test("createActivityLogEntry inserts row with admin_user_id, action, detail", async () => {
    let insertedPayload = null;

    activityRepository._setDb({
      from: (table) => {
        assert.equal(table, "admin_activity_logs");
        return {
          insert: (record) => {
            insertedPayload = record;
            return {
              select: () => ({
                maybeSingle: async () => ({
                  data: {
                    id: "act-101",
                    admin_user_id: record.admin_user_id,
                    action: record.action,
                    detail: record.detail,
                    created_at: "2026-09-28T07:00:00.000Z",
                  },
                  error: null,
                }),
              }),
            };
          },
        };
      },
    });

    const result = await activityRepository.createActivityLogEntry({
      adminUserId: "admin-uuid-1",
      action: "BAN_USER",
      detail: "Banned user 123",
    });

    assert.equal(result.id, "act-101");
    assert.equal(insertedPayload.admin_user_id, "admin-uuid-1");
    assert.equal(insertedPayload.action, "BAN_USER");
    assert.equal(insertedPayload.detail, "Banned user 123");
  });

  await t.test("recordActivityBestEffort does not throw even if db insert fails", async () => {
    activityRepository._setDb({
      from: () => ({
        insert: () => ({
          select: () => ({
            maybeSingle: async () => ({
              data: null,
              error: new Error("Database connection timed out"),
            }),
          }),
        }),
      }),
    });

    assert.doesNotThrow(() => {
      activityRepository.recordActivityBestEffort({
        adminUserId: "admin-uuid-1",
        action: "TEST_ACTION",
        detail: "Should not throw",
      });
    });
  });

  await t.test("recordActivityBestEffort ignores calls with missing adminUserId or action", () => {
    let insertCalled = false;
    activityRepository._setDb({
      from: () => {
        insertCalled = true;
        return {};
      },
    });

    activityRepository.recordActivityBestEffort({
      adminUserId: null,
      action: "TEST_ACTION",
    });
    activityRepository.recordActivityBestEffort({
      adminUserId: "admin-1",
      action: "",
    });

    assert.equal(insertCalled, false);
  });
});
