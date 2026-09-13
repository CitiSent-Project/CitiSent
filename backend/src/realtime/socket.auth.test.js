import test from "node:test";
import assert from "node:assert/strict";
import { reportMessagesRepository } from "../modules/reports/messages.repository.js";

test("Socket.IO join_report authorization", async (t) => {
  const originalIsParticipant = reportMessagesRepository.isParticipantForReport;

  t.after(() => {
    reportMessagesRepository.isParticipantForReport = originalIsParticipant;
  });

  // Mock handler simulating the socket.on("join_report") logic
  async function simulateJoinReport({ socket, data }) {
    let callbackResult = null;
    const callback = (res) => {
      callbackResult = res;
    };

    const joinedRooms = new Set();
    const mockSocket = {
      id: socket.id || "socket-123",
      user: socket.user,
      accessToken: socket.accessToken,
      join: (room) => joinedRooms.add(room),
    };

    const actorUserId = mockSocket.user?.id;
    if (!actorUserId) {
      callback({ success: false, error: "Authentication required" });
      return { callbackResult, joinedRooms };
    }

    const reportId = typeof data === "object" && data !== null ? data.reportId : data;
    if (!reportId || typeof reportId !== "string" || !reportId.trim()) {
      callback({ success: false, error: "Invalid report ID" });
      return { callbackResult, joinedRooms };
    }

    const normalizedReportId = reportId.trim();

    const access = await reportMessagesRepository.isParticipantForReport({
      reportId: normalizedReportId,
      userId: actorUserId,
      accessToken: mockSocket.accessToken,
    });

    if (!access?.allowed) {
      callback({ success: false, error: "Access denied" });
      return { callbackResult, joinedRooms };
    }

    const roomName = `report:${normalizedReportId}`;
    mockSocket.join(roomName);
    callback({ success: true, reportId: normalizedReportId });

    return { callbackResult, joinedRooms };
  }

  await t.test("authorized report participant can join", async () => {
    reportMessagesRepository.isParticipantForReport = async ({ reportId, userId }) => {
      assert.equal(reportId, "rep-valid-1");
      assert.equal(userId, "user-owner-1");
      return { allowed: true, participantType: "citizen" };
    };

    const { callbackResult, joinedRooms } = await simulateJoinReport({
      socket: { user: { id: "user-owner-1" }, accessToken: "token-1" },
      data: { reportId: "rep-valid-1" },
    });

    assert.equal(callbackResult.success, true);
    assert.equal(callbackResult.reportId, "rep-valid-1");
    assert.ok(joinedRooms.has("report:rep-valid-1"));
  });

  await t.test("unauthorized user cannot join", async () => {
    reportMessagesRepository.isParticipantForReport = async ({ reportId, userId }) => {
      assert.equal(reportId, "rep-secret-2");
      assert.equal(userId, "attacker-user-2");
      return { allowed: false };
    };

    const { callbackResult, joinedRooms } = await simulateJoinReport({
      socket: { user: { id: "attacker-user-2" }, accessToken: "token-2" },
      data: { reportId: "rep-secret-2" },
    });

    assert.equal(callbackResult.success, false);
    assert.equal(callbackResult.error, "Access denied");
    assert.equal(joinedRooms.size, 0);
  });

  await t.test("unauthenticated socket cannot join", async () => {
    const { callbackResult, joinedRooms } = await simulateJoinReport({
      socket: { user: null },
      data: { reportId: "rep-1" },
    });

    assert.equal(callbackResult.success, false);
    assert.equal(callbackResult.error, "Authentication required");
    assert.equal(joinedRooms.size, 0);
  });

  await t.test("admin access still works if admin is legitimately allowed", async () => {
    reportMessagesRepository.isParticipantForReport = async ({ reportId, userId }) => {
      assert.equal(reportId, "rep-dept-3");
      assert.equal(userId, "admin-user-3");
      return { allowed: true, participantType: "office_admin" };
    };

    const { callbackResult, joinedRooms } = await simulateJoinReport({
      socket: { user: { id: "admin-user-3" }, accessToken: "token-3" },
      data: { reportId: "rep-dept-3" },
    });

    assert.equal(callbackResult.success, true);
    assert.ok(joinedRooms.has("report:rep-dept-3"));
  });

  await t.test("invalid or missing report ID is rejected safely", async () => {
    const cases = [null, undefined, "", "   ", 12345, {}];

    for (const badData of cases) {
      const { callbackResult, joinedRooms } = await simulateJoinReport({
        socket: { user: { id: "user-1" } },
        data: badData,
      });

      assert.equal(callbackResult.success, false);
      assert.equal(callbackResult.error, "Invalid report ID");
      assert.equal(joinedRooms.size, 0);
    }
  });
});
