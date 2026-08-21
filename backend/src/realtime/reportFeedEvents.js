/**
 * Report Feed Events
 *
 * Publishes lightweight `report_feed_changed` Socket.IO events after
 * successful report mutations.  Events are advisory invalidation signals;
 * clients must refetch authorized data through existing REST endpoints.
 *
 * The module is intentionally kept independent from request controllers and
 * service modules to avoid circular dependencies.  It imports only the
 * Socket.IO accessor (`getIO`) from the realtime layer.
 */

import { logger } from "../config/logger.js";

/**
 * Room naming conventions:
 *
 *   `report_feed:user:<userId>`       – the report owner
 *   `report_feed:department:<deptId>` – office admins for the department
 *   `report_feed:global`             – superadmins (all reports)
 *
 * These are separate from the existing `report:<reportId>` conversation rooms
 * to avoid leaking feed-level events into the per-report chat namespace.
 */

const EVENT_NAME = "report_feed_changed";

// Lazy reference to avoid import-time initialization order issues.
let _getIO = null;

function resolveIO() {
  if (!_getIO) {
    // Not yet initialized (e.g. running unit tests without a real server).
    // Silently return null – emissions are no-ops until the server starts.
    return null;
  }

  try {
    return _getIO();
  } catch {
    // Socket.IO may not have been initialized yet (e.g. during tests)
    return null;
  }
}

/**
 * Initialize the event publisher with a reference to the Socket.IO accessor.
 *
 * Call once during server startup after `initSocketIO()`:
 *
 *     import { getIO } from "./socket.js";
 *     import { initReportFeedEvents } from "./reportFeedEvents.js";
 *     initReportFeedEvents(getIO);
 */
export function initReportFeedEvents(getIOFn) {
  _getIO = getIOFn;
}

/**
 * Build and emit a `report_feed_changed` event to the appropriate rooms.
 *
 * @param {object} options
 * @param {string} options.reportId       – ID of the mutated report.
 * @param {string} options.changeType     – "created" | "updated" | "deleted".
 * @param {string} [options.userId]       – report owner; receives user-scoped event.
 * @param {string} [options.departmentId] – department slug / ID for scoped rooms.
 */
export function emitReportFeedChanged({
  reportId,
  changeType,
  userId = null,
  departmentId = null,
}) {
  const io = resolveIO();
  if (!io) {
    return;
  }

  const occurredAt = new Date().toISOString();

  // 1. Emit to the report owner's personal feed room.
  if (userId) {
    const userPayload = {
      reportId,
      changeType,
      scope: "user",
      scopeId: userId,
      occurredAt,
    };

    io.to(`report_feed:user:${userId}`).emit(EVENT_NAME, userPayload);

    logger.info("[ReportFeed] Emitted to user room", {
      room: `report_feed:user:${userId}`,
      ...userPayload,
    });
  }

  // 2. Emit to the department feed room (office admins).
  if (departmentId) {
    const deptPayload = {
      reportId,
      changeType,
      scope: "department",
      scopeId: departmentId,
      occurredAt,
    };

    io.to(`report_feed:department:${departmentId}`).emit(EVENT_NAME, deptPayload);

    logger.info("[ReportFeed] Emitted to department room", {
      room: `report_feed:department:${departmentId}`,
      ...deptPayload,
    });
  }

  // 3. Emit to the global feed room (superadmins).
  const globalPayload = {
    reportId,
    changeType,
    scope: "global",
    scopeId: null,
    occurredAt,
  };

  io.to("report_feed:global").emit(EVENT_NAME, globalPayload);

  logger.info("[ReportFeed] Emitted to global room", {
    room: "report_feed:global",
    ...globalPayload,
  });
}
