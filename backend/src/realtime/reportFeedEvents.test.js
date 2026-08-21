import test from "node:test";
import assert from "node:assert/strict";

import {
  initReportFeedEvents,
  emitReportFeedChanged,
} from "./reportFeedEvents.js";

/**
 * Build a mock Socket.IO instance that records all emissions.
 *
 * Each call to `io.to(room).emit(event, payload)` pushes an entry
 * into the returned `emissions` array.
 */
function createMockIO() {
  const emissions = [];

  const io = {
    to(room) {
      return {
        emit(event, payload) {
          emissions.push({ room, event, payload });
        },
      };
    },
  };

  return { io, emissions };
}

function setupMockIO(t) {
  const { io, emissions } = createMockIO();
  initReportFeedEvents(() => io);

  t.after(() => {
    // Reset to avoid leaking into other tests.
    initReportFeedEvents(null);
  });

  return emissions;
}

// ---- Emission tests ----

test("emitReportFeedChanged emits to user, department, and global rooms", (t) => {
  const emissions = setupMockIO(t);

  emitReportFeedChanged({
    reportId: "report-1",
    changeType: "created",
    userId: "user-1",
    departmentId: "dept-flooding",
  });

  assert.equal(emissions.length, 3, "should emit exactly 3 events");

  // 1. User-scoped event
  const userEmission = emissions.find((e) => e.room === "report_feed:user:user-1");
  assert.ok(userEmission, "should emit to user room");
  assert.equal(userEmission.event, "report_feed_changed");
  assert.equal(userEmission.payload.reportId, "report-1");
  assert.equal(userEmission.payload.changeType, "created");
  assert.equal(userEmission.payload.scope, "user");
  assert.equal(userEmission.payload.scopeId, "user-1");
  assert.ok(userEmission.payload.occurredAt, "should include occurredAt");

  // 2. Department-scoped event
  const deptEmission = emissions.find((e) => e.room === "report_feed:department:dept-flooding");
  assert.ok(deptEmission, "should emit to department room");
  assert.equal(deptEmission.payload.scope, "department");
  assert.equal(deptEmission.payload.scopeId, "dept-flooding");

  // 3. Global event
  const globalEmission = emissions.find((e) => e.room === "report_feed:global");
  assert.ok(globalEmission, "should emit to global room");
  assert.equal(globalEmission.payload.scope, "global");
  assert.equal(globalEmission.payload.scopeId, null);
});

test("emitReportFeedChanged skips user room when userId is null", (t) => {
  const emissions = setupMockIO(t);

  emitReportFeedChanged({
    reportId: "report-2",
    changeType: "deleted",
    userId: null,
    departmentId: "dept-traffic",
  });

  // Should emit only department + global = 2 events.
  assert.equal(emissions.length, 2);
  assert.ok(
    !emissions.some((e) => e.room.startsWith("report_feed:user:")),
    "should NOT emit to user room",
  );
});

test("emitReportFeedChanged skips department room when departmentId is null", (t) => {
  const emissions = setupMockIO(t);

  emitReportFeedChanged({
    reportId: "report-3",
    changeType: "updated",
    userId: "user-3",
    departmentId: null,
  });

  // Should emit only user + global = 2 events.
  assert.equal(emissions.length, 2);
  assert.ok(
    !emissions.some((e) => e.room.startsWith("report_feed:department:")),
    "should NOT emit to department room",
  );
});

test("emitReportFeedChanged emits only global when userId and departmentId are null", (t) => {
  const emissions = setupMockIO(t);

  emitReportFeedChanged({
    reportId: "report-4",
    changeType: "updated",
  });

  assert.equal(emissions.length, 1, "should emit exactly 1 event (global only)");
  assert.equal(emissions[0].room, "report_feed:global");
});

test("emitReportFeedChanged does nothing when IO is not available", (t) => {
  // Simulate getIO throwing (Socket.IO not initialized).
  initReportFeedEvents(() => {
    throw new Error("Socket.IO has not been initialized");
  });

  t.after(() => {
    initReportFeedEvents(null);
  });

  // Should not throw.
  assert.doesNotThrow(() => {
    emitReportFeedChanged({
      reportId: "report-5",
      changeType: "created",
      userId: "user-5",
    });
  });
});

test("emitReportFeedChanged includes distinct occurredAt timestamps", (t) => {
  const emissions = setupMockIO(t);

  emitReportFeedChanged({
    reportId: "report-6",
    changeType: "created",
    userId: "user-6",
    departmentId: "dept-1",
  });

  // All emissions for a single call share the same occurredAt.
  const timestamps = new Set(emissions.map((e) => e.payload.occurredAt));
  assert.equal(timestamps.size, 1, "all events from one call should share the same occurredAt");
});
