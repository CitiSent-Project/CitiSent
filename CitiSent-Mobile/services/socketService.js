import { io } from "socket.io-client/dist/socket.io.js";
import { resolveApiBaseUrl } from "./apiConfig";
import { getAuthToken } from "./authSession";

let socketInstance = null;

export function resolveSocketBaseUrl() {
  const apiUrl = resolveApiBaseUrl();
  return apiUrl.replace(/\/api\/v1\/?$/, "");
}

/**
 * Initialize or retrieve the singleton Socket.IO connection.
 * Connects automatically using the user's authentication token.
 */
export function getSocket(options = {}) {
  const token = options.token || getAuthToken();

  if (socketInstance) {
    if (token && socketInstance.auth?.token !== token) {
      socketInstance.auth = { token };
      if (!socketInstance.connected) {
        socketInstance.connect();
      }
    }
    return socketInstance;
  }

  const socketUrl = resolveSocketBaseUrl();

  socketInstance = io(socketUrl, {
    auth: { token },
    autoConnect: true,
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });

  socketInstance.on("connect", () => {
    // Socket connected successfully
  });

  socketInstance.on("connect_error", (error) => {
    console.warn("[Socket.IO Client Error]:", error?.message);
  });

  socketInstance.on("disconnect", (reason) => {
    if (reason === "io server disconnect") {
      // Server forcibly disconnected socket; attempt manual reconnect if token valid
      if (getAuthToken()) {
        socketInstance.connect();
      }
    }
  });

  return socketInstance;
}

/**
 * Force disconnect socket on logout or session end
 */
export function disconnectSocket() {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
}

/**
 * Join a report conversation room to receive real-time updates
 */
export function joinReportRoom(reportId) {
  const socket = getSocket();
  if (socket && reportId) {
    socket.emit("join_report", { reportId });
  }
}

/**
 * Leave a report conversation room
 */
export function leaveReportRoom(reportId) {
  const socket = getSocket();
  if (socket && reportId) {
    socket.emit("leave_report", { reportId });
  }
}

/**
 * Send a message via Socket.IO with server acknowledgment callback
 */
export function sendSocketMessage({ reportId, message }) {
  return new Promise((resolve, reject) => {
    const socket = getSocket();
    if (!socket || !socket.connected) {
      return reject(new Error("Socket is disconnected"));
    }

    socket.emit("send_message", { reportId, message }, (response) => {
      if (response?.success) {
        resolve(response.data);
      } else {
        reject(new Error(response?.error || "Failed to send message over socket"));
      }
    });
  });
}

/**
 * Emit mark_as_read event for a conversation
 */
export function markSocketConversationRead({ reportId, messageIds }) {
  const socket = getSocket();
  if (socket && reportId) {
    socket.emit("mark_as_read", { reportId, messageIds });
  }
}

/**
 * Emit typing indicator
 */
export function sendSocketTyping(reportId) {
  const socket = getSocket();
  if (socket && reportId) {
    socket.emit("typing", { reportId });
  }
}

/**
 * Emit stop typing indicator
 */
export function sendSocketStopTyping(reportId) {
  const socket = getSocket();
  if (socket && reportId) {
    socket.emit("stop_typing", { reportId });
  }
}
