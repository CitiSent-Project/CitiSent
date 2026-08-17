/**
 * AdminMessageContext.jsx
 *
 * Thin React context that bridges the adminMessageState.js singleton into the
 * React component tree.  Uses useSyncExternalStore so every consumer re-renders
 * immediately when any badge state changes, with no extra useEffect wiring.
 *
 * Usage:
 *   const { hasUnreadAdminMessage, unreadByReport, setReportRead } = useAdminMessageState();
 */

import { createContext, useCallback, useContext, useEffect, useSyncExternalStore } from "react";
import {
  subscribeToAdminMessages,
  getAdminMessagesSnapshot,
  setReportRead as _setReportRead,
  setReportUnread as _setReportUnread,
  seedUnreadState as _seedUnreadState,
  seedUnreadStateFromApi,
  initializeAdminMessageState,
} from "../services/adminMessageState";
import { getAuthUser } from "../services/authSession";

const AdminMessageContext = createContext(null);

/**
 * Provider — place this high in the tree (root _layout.jsx) so every screen
 * can access the shared state without prop-drilling.
 */
export function AdminMessageProvider({ children }) {
  useEffect(() => {
    const user = getAuthUser();
    if (user?.id) {
      initializeAdminMessageState(user.id).catch(() => {});
    }
  }, []);

  // useSyncExternalStore keeps this perfectly in sync with the singleton.
  const snapshot = useSyncExternalStore(
    subscribeToAdminMessages,
    getAdminMessagesSnapshot,
    getAdminMessagesSnapshot // server snapshot (same value for RN)
  );

  const setReportRead = useCallback((reportId) => {
    _setReportRead(reportId);
  }, []);

  const setReportUnread = useCallback((reportId) => {
    _setReportUnread(reportId);
  }, []);

  const seedUnreadState = useCallback((map) => {
    _seedUnreadState(map);
  }, []);

  const refreshFromApi = useCallback(async (reportIds, userId) => {
    await seedUnreadStateFromApi(reportIds, userId);
  }, []);

  const value = {
    hasUnreadAdminMessage: snapshot.hasUnreadAdminMessage,
    unreadByReport: snapshot.unreadByReport,
    setReportRead,
    setReportUnread,
    seedUnreadState,
    refreshFromApi,
  };

  return (
    <AdminMessageContext.Provider value={value}>
      {children}
    </AdminMessageContext.Provider>
  );
}

/**
 * Hook to consume the shared admin message notification state.
 *
 * @returns {{
 *   hasUnreadAdminMessage: boolean,
 *   unreadByReport: Record<string, boolean>,
 *   setReportRead: (reportId: string) => void,
 *   setReportUnread: (reportId: string) => void,
 *   seedUnreadState: (map: Record<string, boolean>) => void,
 *   refreshFromApi: (reportIds: string[], userId?: string) => Promise<void>,
 * }}
 */
export function useAdminMessageState() {
  const ctx = useContext(AdminMessageContext);
  if (!ctx) {
    throw new Error("useAdminMessageState must be used inside <AdminMessageProvider>");
  }
  return ctx;
}

export default AdminMessageContext;
