import test from "node:test";
import assert from "node:assert/strict";
import { setIO } from "../../../realtime/socket.js";
import { notificationsRepository } from "./notifications.repository.js";

test("notificationsRepository realtime events", async (t) => {
  const emittedEvents = [];

  // Mock Socket.IO server
  const mockIO = {
    to: (room) => ({
      emit: (event, payload) => {
        emittedEvents.push({ room, event, payload });
      },
    }),
  };

  setIO(mockIO);

  t.after(() => {
    setIO(null);
    notificationsRepository._setDb(null);
  });

  const testUserId = "test-user-uuid-101";

  await t.test("createNotification inserts row and emits new_notification", async () => {
    emittedEvents.length = 0;

    notificationsRepository._setDb({
      from: (table) => {
        assert.equal(table, "notifications");
        return {
          insert: (record) => {
            assert.equal(record.user_id, testUserId);
            assert.equal(record.title, "Report Approved");
            return {
              select: () => ({
                maybeSingle: async () => ({
                  data: {
                    id: "notif-uuid-1",
                    user_id: testUserId,
                    type: "status",
                    title: "Report Approved",
                    message: "Your report has been verified",
                    report_id: "rep-1",
                    is_read: false,
                    read_at: null,
                    created_at: new Date().toISOString(),
                    metadata: { status: "Verified" },
                  },
                  error: null,
                }),
              }),
            };
          },
        };
      },
    });

    const result = await notificationsRepository.createNotification({
      userId: testUserId,
      type: "status",
      title: "Report Approved",
      message: "Your report has been verified",
      reportId: "rep-1",
      metadata: { status: "Verified" },
    });

    assert.equal(result.id, "notif-uuid-1");
    assert.equal(emittedEvents.length, 1);
    const [event] = emittedEvents;
    assert.equal(event.room, `user:${testUserId}`);
    assert.equal(event.event, "new_notification");
    assert.equal(event.payload.id, "notif-uuid-1");
    assert.equal(event.payload.read, false);
    assert.equal(event.payload.title, "Report Approved");
    assert.equal(event.payload.meta.status, "Verified");
  });

  await t.test("updateNotificationReadState updates row and emits notification_updated", async () => {
    emittedEvents.length = 0;

    notificationsRepository._setDb({
      from: (table) => {
        assert.equal(table, "notifications");
        return {
          update: (fields) => {
            assert.equal(fields.is_read, true);
            return {
              eq: () => ({
                eq: () => ({
                  select: () => ({
                    maybeSingle: async () => ({
                      data: {
                        id: "notif-uuid-1",
                        user_id: testUserId,
                        type: "status",
                        title: "Report Approved",
                        message: "Your report has been verified",
                        report_id: "rep-1",
                        is_read: true,
                        read_at: new Date().toISOString(),
                      },
                      error: null,
                    }),
                  }),
                }),
              }),
            };
          },
        };
      },
    });

    const result = await notificationsRepository.updateNotificationReadState({
      userId: testUserId,
      notificationId: "notif-uuid-1",
      isRead: true,
    });

    assert.equal(result.id, "notif-uuid-1");
    assert.equal(emittedEvents.length, 1);
    const [event] = emittedEvents;
    assert.equal(event.room, `user:${testUserId}`);
    assert.equal(event.event, "notification_updated");
    assert.equal(event.payload.id, "notif-uuid-1");
    assert.equal(event.payload.read, true);
  });

  await t.test("bulkUpdateNotificationReadState emits notifications_updated", async () => {
    emittedEvents.length = 0;

    notificationsRepository._setDb({
      from: (table) => ({
        update: () => ({
          eq: () => ({
            in: () => ({
              select: async () => ({
                data: [
                  { id: "notif-1", user_id: testUserId, is_read: true },
                  { id: "notif-2", user_id: testUserId, is_read: true },
                ],
                error: null,
              }),
            }),
          }),
        }),
      }),
    });

    await notificationsRepository.bulkUpdateNotificationReadState({
      userId: testUserId,
      notificationIds: ["notif-1", "notif-2"],
      isRead: true,
      markAll: false,
    });

    assert.equal(emittedEvents.length, 1);
    const [event] = emittedEvents;
    assert.equal(event.room, `user:${testUserId}`);
    assert.equal(event.event, "notifications_updated");
    assert.deepEqual(event.payload.notificationIds, ["notif-1", "notif-2"]);
    assert.equal(event.payload.isRead, true);
  });

  await t.test("clearNotifications deletes rows and emits notifications_cleared", async () => {
    emittedEvents.length = 0;

    notificationsRepository._setDb({
      from: (table) => ({
        delete: () => ({
          eq: () => ({
            in: () => ({
              select: async () => ({
                data: [{ id: "notif-1" }, { id: "notif-2" }],
                error: null,
              }),
            }),
          }),
        }),
      }),
    });

    await notificationsRepository.clearNotifications({
      userId: testUserId,
      notificationIds: ["notif-1", "notif-2"],
      clearAll: false,
    });

    assert.equal(emittedEvents.length, 1);
    const [event] = emittedEvents;
    assert.equal(event.room, `user:${testUserId}`);
    assert.equal(event.event, "notifications_cleared");
    assert.deepEqual(event.payload.notificationIds, ["notif-1", "notif-2"]);
    assert.equal(event.payload.clearAll, false);
  });

  await t.test("user isolation: events are never emitted to a different user room", async () => {
    emittedEvents.length = 0;
    const anotherUser = "other-user-456";

    notificationsRepository._setDb({
      from: () => ({
        insert: () => ({
          select: () => ({
            maybeSingle: async () => ({
              data: {
                id: "notif-iso-1",
                user_id: testUserId,
                type: "status",
                title: "Isolation Test",
                message: "Targeted to testUserId only",
                is_read: false,
              },
              error: null,
            }),
          }),
        }),
      }),
    });

    await notificationsRepository.createNotification({
      userId: testUserId,
      type: "status",
      title: "Isolation Test",
      message: "Targeted to testUserId only",
    });

    assert.equal(emittedEvents.length, 1);
    assert.equal(emittedEvents[0].room, `user:${testUserId}`);
    assert.notEqual(emittedEvents[0].room, `user:${anotherUser}`);
  });
});
