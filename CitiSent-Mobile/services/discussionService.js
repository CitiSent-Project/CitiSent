import { getCache, setCache } from "./cache";

const DISCUSSIONS_CACHE_KEY = "report_discussions_map";

// Sample initial discussion seed data
const SAMPLE_DISCUSSIONS = {
  default: [
    {
      id: "msg-1",
      senderRole: "admin",
      senderName: "City Admin (Barangay Office)",
      message: "Hello! We received your report regarding this issue. A maintenance team has been notified and scheduled for inspection.",
      createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    },
    {
      id: "msg-2",
      senderRole: "admin",
      senderName: "City Admin (Barangay Office)",
      message: "Could you please confirm if this area is accessible during daytime hours?",
      createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    },
  ],
};

let discussionsMap = { ...SAMPLE_DISCUSSIONS };

async function loadFromStorage() {
  try {
    const cachedMap = await getCache(DISCUSSIONS_CACHE_KEY, { ignoreExpiry: true });
    if (cachedMap && typeof cachedMap === "object") {
      discussionsMap = { ...SAMPLE_DISCUSSIONS, ...cachedMap };
    }
  } catch (err) {
    console.warn("Failed to load discussion threads from storage:", err);
  }
}

async function saveToStorage() {
  try {
    await setCache(DISCUSSIONS_CACHE_KEY, discussionsMap, 86400 * 30);
  } catch (err) {
    console.warn("Failed to save discussion thread to storage:", err);
  }
}

loadFromStorage();

export const discussionService = {
  /**
   * Get all messages for a given report ID
   */
  getDiscussion: async (reportId) => {
    await loadFromStorage();
    if (!discussionsMap[reportId]) {
      // Default initial mock conversation for new or uninitialized reports
      discussionsMap[reportId] = [
        {
          id: `msg-init-${Date.now()}`,
          senderRole: "admin",
          senderName: "City Admin",
          message: "Thank you for submitting your report. Our team is currently reviewing your submission.",
          createdAt: new Date().toISOString(),
        },
      ];
      await saveToStorage();
    }
    return discussionsMap[reportId];
  },

  /**
   * Add a new user response message to a report discussion
   */
  sendMessage: async (reportId, text, attachmentUri = null, onAdminReply = null) => {
    await loadFromStorage();
    const thread = discussionsMap[reportId] || [];

    const newMessage = {
      id: `msg-user-${Date.now()}`,
      senderRole: "citizen",
      senderName: "You",
      message: text.trim(),
      attachmentUri: attachmentUri || null,
      createdAt: new Date().toISOString(),
    };

    const updatedThread = [...thread, newMessage];
    discussionsMap[reportId] = updatedThread;
    await saveToStorage();

    // Auto-generate an Admin reply after 1.5 seconds for live interactive testing
    setTimeout(async () => {
      const adminReplies = [
        "Thank you for the update! We have noted this on your report record.",
        "Our field team has been notified. We will update the status once inspected.",
        "Got it! An administrator will review your reply shortly.",
        "Thank you. Your feedback has been attached to the report case file.",
      ];
      const randomReply = adminReplies[Math.floor(Math.random() * adminReplies.length)];

      const adminMessage = {
        id: `msg-admin-${Date.now()}`,
        senderRole: "admin",
        senderName: "City Admin",
        message: randomReply,
        createdAt: new Date().toISOString(),
      };

      await loadFromStorage();
      const currentThread = discussionsMap[reportId] || [];
      discussionsMap[reportId] = [...currentThread, adminMessage];
      await saveToStorage();

      if (onAdminReply) {
        onAdminReply(discussionsMap[reportId]);
      }
    }, 1500);

    return updatedThread;
  },
};
