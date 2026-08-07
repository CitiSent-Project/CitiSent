import { Server as SocketIOServer } from "socket.io";
import { supabase } from "../config/supabase.js";
import { logger } from "../config/logger.js";
import { reportMessagesService } from "../modules/reports/messages.service.js";

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

export function initSocketIO(httpServer) {
  if (io) return io;

  io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*",
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
      return next();
    } catch (err) {
      logger.error("Socket authentication error:", err);
      return next(new Error("Authentication failed"));
    }
  });

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

export function isUserConnected(userId) {
  const sockets = userSocketsMap.get(String(userId));
  return Boolean(sockets && sockets.size > 0);
}

export function emitToUser(userId, event, payload) {
  if (io) {
    io.to(`user:${userId}`).emit(event, payload);
  }
}

export function emitToReportRoom(reportId, event, payload) {
  if (io) {
    io.to(`report:${reportId}`).emit(event, payload);
  }
}
