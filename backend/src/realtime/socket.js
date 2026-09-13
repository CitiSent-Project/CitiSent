import crypto from "node:crypto";
import { Server as SocketIOServer } from "socket.io";
import { env } from "../config/env.js";
import { supabase } from "../config/supabase.js";
import { logger } from "../config/logger.js";
import { cacheService } from "../shared/cache/cacheService.js";
import { reportMessagesService } from "../modules/reports/messages.service.js";
import { profileRepository } from "../shared/repositories/profileRepository.js";
import { isSuperadmin, normalizeUserRole, USER_ROLES } from "../shared/auth/roleAccess.js";
import { tryVerifyGuestToken } from "../shared/security/guestTokens.js";
import { initReportFeedEvents } from "./reportFeedEvents.js";

let io = null;
/** Map<userId: string, Set<socketId: string>> */
const userSocketsMap = new Map();

function extractToken(handshake) {
  const authHeader = handshake.auth?.token || handshake.headers?.authorization;
  if (!authHeader) return null;
  if (authHeader.startsWith("Bearer ")) {
    return authHeader.slice("Bearer ".length).trim();
  }
  return String(authHeader).trim();
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function isAllowedSocketOrigin(origin) {
  if (!origin) return true;
  if (env.corsOrigins.includes(origin)) return true;
  // Allow mobile Expo Go / local network origins in development
  if (
    env.isDev ||
    /^http:\/\/(localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)(:\d+)?$/.test(origin) ||
    origin.startsWith("exp://")
  ) {
    return true;
  }
  return false;
}

export function initSocketIO(httpServer) {
  if (io) return io;

  io = new SocketIOServer(httpServer, {
    cors: {
      origin(origin, callback) {
        if (isAllowedSocketOrigin(origin)) {
          return callback(null, true);
        }
        return callback(new Error("Not allowed by CORS"));
      },
      credentials: true,
      methods: ["GET", "POST"],
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Socket Authentication Middleware
  io.use(async (socket, next) => {
    try {
      const token = extractToken(socket.handshake);
      if (!token) {
        return next(new Error("Authentication token required"));
      }

      const tokenHash = hashToken(token);
      const cacheKey = `auth:token:${tokenHash}`;

      // Fast-path: Check cache for verified user session
      const cachedUser = await cacheService.getJSON(cacheKey);
      if (cachedUser?.id) {
        socket.user = cachedUser;
        socket.accessToken = token;
        return next();
      }

      // Check if token is a CitiSent signed guest token
      try {
        const guestPayload = tryVerifyGuestToken(token);
        if (guestPayload) {
          socket.user = {
            id: guestPayload.guestId,
            role: "guest",
            isGuest: true,
            email: guestPayload.email || null,
          };
          socket.accessToken = token;
          await cacheService.setJSON(cacheKey, socket.user, 60);
          return next();
        }
      } catch (guestErr) {
        if (guestErr?.isGuestError) {
          return next(new Error(guestErr.message || "Invalid guest token"));
        }
      }

      const { data, error } = await supabase.auth.getUser(token);
      if (error || !data?.user) {
        return next(new Error("Invalid or expired authentication token"));
      }

      socket.user = {
        id: data.user.id,
        email: data.user.email,
        role: data.user.role,
      };
      socket.accessToken = token;

      // Cache valid auth session for 60s
      await cacheService.setJSON(cacheKey, socket.user, 60);

      return next();
    } catch (err) {
      logger.error("Socket authentication error:", err);
      return next(new Error("Authentication failed"));
    }
  });

  // Initialize the report feed event publisher with a reference to getIO.
  initReportFeedEvents(getIO);

  io.on("connection", (socket) => {
    const userId = socket.user.id;

    // Track user socket
    if (!userSocketsMap.has(userId)) {
      userSocketsMap.set(userId, new Set());
    }
    userSocketsMap.get(userId).add(socket.id);

    // Join user's personal room for targeted user emissions
    socket.join(`user:${userId}`);

    logger.info(`[Socket.IO] Client connected: socket.id=${socket.id}, userId=${userId}`);

    // ---- Report Feed Room Membership ----
    // Server-validated: the client requests to join the report feed,
    // but the server decides which scoped rooms based on the user's
    // profile role and department. The client cannot self-select rooms.
    socket.on("join_report_feed", async (_, callback) => {
      try {
        const profile = await profileRepository.getByUserId({
          userId,
          accessToken: socket.accessToken,
        });

        // Always join the personal user feed room.
        socket.join(`report_feed:user:${userId}`);

        const appRole = normalizeUserRole(profile?.role);

        if (isSuperadmin(appRole)) {
          // Superadmins receive all report-feed changes.
          socket.join("report_feed:global");
          logger.info(`[Socket.IO] Socket ${socket.id} joined report_feed:global (superadmin)`);
        } else if (appRole === USER_ROLES.OFFICE_ADMIN) {
          // Office admins receive only their department's feed.
          const deptId = profile?.department_id || "";
          if (deptId) {
            socket.join(`report_feed:department:${deptId}`);
            logger.info(`[Socket.IO] Socket ${socket.id} joined report_feed:department:${deptId}`);
          }
        }

        logger.info(`[Socket.IO] Socket ${socket.id} joined report_feed:user:${userId}`);

        if (typeof callback === "function") {
          callback({ success: true });
        }
      } catch (err) {
        logger.error("[Socket.IO] Error handling join_report_feed:", err);
        if (typeof callback === "function") {
          callback({ success: false, error: err.message || "Failed to join report feed" });
        }
      }
    });

    // Join specific report room
    socket.on("join_report", (data) => {
      const reportId = data?.reportId || data;
      if (reportId) {
        const roomName = `report:${reportId}`;
        socket.join(roomName);
        logger.info(`[Socket.IO] Socket ${socket.id} joined room ${roomName}`);
      }
    });

    // Leave specific report room
    socket.on("leave_report", (data) => {
      const reportId = data?.reportId || data;
      if (reportId) {
        const roomName = `report:${reportId}`;
        socket.leave(roomName);
        logger.info(`[Socket.IO] Socket ${socket.id} left room ${roomName}`);
      }
    });

    // Send Message Event
    socket.on("send_message", async (payload, callback) => {
      try {
        const { reportId, message } = payload || {};
        if (!reportId || !message) {
          if (typeof callback === "function") {
            callback({ success: false, error: "reportId and message are required" });
          }
          return;
        }

        // Save message in Supabase via service
        const savedMessage = await reportMessagesService.sendMessage({
          actor: socket.user,
          reportId,
          message,
          accessToken: socket.accessToken,
          // The socket handler broadcasts the room below. Avoid emitting the
          // same receive_message event from the service as well.
          suppressRoomBroadcast: true,
        });

        // Broadcast receive_message to everyone viewing the report room
        const roomName = `report:${reportId}`;
        io.to(roomName).emit("receive_message", {
          reportId,
          message: savedMessage,
        });

        // Return acknowledgment to sender
        if (typeof callback === "function") {
          callback({ success: true, data: savedMessage });
        }
      } catch (err) {
        logger.error("[Socket.IO] Error handling send_message:", err);
        if (typeof callback === "function") {
          callback({ success: false, error: err.message || "Failed to send message" });
        }
      }
    });

    // Mark as Read Event
    socket.on("mark_as_read", async (payload, callback) => {
      try {
        const { reportId, messageIds } = payload || {};
        if (!reportId) return;

        const result = await reportMessagesService.markConversationRead({
          actor: socket.user,
          reportId,
          messageIds,
          accessToken: socket.accessToken,
        });

        // Notify report room that messages were marked as read
        const roomName = `report:${reportId}`;
        io.to(roomName).emit("messages_read", {
          reportId,
          readerId: userId,
          data: result.data,
          updatedCount: result.updatedCount,
        });

        if (typeof callback === "function") {
          callback({ success: true, ...result });
        }
      } catch (err) {
        logger.error("[Socket.IO] Error handling mark_as_read:", err);
        if (typeof callback === "function") {
          callback({ success: false, error: err.message });
        }
      }
    });

    // Typing Indicators (Ephemeral, not stored in DB)
    socket.on("typing", (data) => {
      const reportId = data?.reportId || data;
      if (reportId) {
        socket.to(`report:${reportId}`).emit("typing", {
          reportId,
          userId: socket.user.id,
        });
      }
    });

    socket.on("stop_typing", (data) => {
      const reportId = data?.reportId || data;
      if (reportId) {
        socket.to(`report:${reportId}`).emit("stop_typing", {
          reportId,
          userId: socket.user.id,
        });
      }
    });

    // Disconnect
    socket.on("disconnect", (reason) => {
      logger.info(`[Socket.IO] Client disconnected: socket.id=${socket.id}, reason=${reason}`);
      const userSockets = userSocketsMap.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          userSocketsMap.delete(userId);
        }
      }
    });
  });

  return io;
}

export function getIO() {
  if (!io) {
    throw new Error("Socket.IO has not been initialized");
  }
  return io;
}

export function setIO(customIO) {
  io = customIO;
}

export function isUserConnected(userId) {
  const sockets = userSocketsMap.get(String(userId));
  return Boolean(sockets && sockets.size > 0);
}

export function emitToUser(userId, event, payload) {
  if (io) {
    const room = `user:${userId}`;
    const roomSockets = io.sockets?.adapter?.rooms?.get?.(room);
    const recipientCount = roomSockets ? roomSockets.size : 0;
    logger.info(`[Socket.IO] emitToUser: room=${room}, event=${event}, recipients=${recipientCount}`);
    io.to(room).emit(event, payload);
  }
}

export function emitToReportRoom(reportId, event, payload) {
  if (io) {
    io.to(`report:${reportId}`).emit(event, payload);
  }
}

export function emitToAdminFeedRooms(agencyId, event, payload) {
  if (io) {
    io.to("report_feed:global").emit(event, payload);
    if (agencyId) {
      io.to(`report_feed:department:${agencyId}`).emit(event, payload);
    }
  }
}
