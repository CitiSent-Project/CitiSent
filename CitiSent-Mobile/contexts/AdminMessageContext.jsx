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
  registerReportStatuses as _registerReportStatuses,
  seedUnreadStateFromApi,
  initializeAdminMessageState,
  resetAdminMessageState,
} from "../services/adminMessageState";
import { getAuthUser, onAuthStateChanged } from "../services/authSession";

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

    const unsubscribe = onAuthStateChanged((newUser) => {
      if (newUser?.id) {
        initializeAdminMessageState(newUser.id).catch(() => {});
      } else {
        resetAdminMessageState();
      }
    });

    return unsubscribe;
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

  const seedUnreadState = useCallback((map, force = false) => {
    _seedUnreadState(map, force);
  }, []);

  const registerReportStatuses = useCallback((reports) => {
    _registerReportStatuses(reports);
  }, []);

  const refreshFromApi = useCallback(async (reportIds, userId, force = true) => {
    await seedUnreadStateFromApi(reportIds, userId, force);
  }, []);

  const value = {
    hasUnreadAdminMessage: snapshot.hasUnreadAdminMessage,
    unreadByReport: snapshot.unreadByReport,
    statusByReport: snapshot.statusByReport,
    latestMessageByReport: snapshot.latestMessageByReport,
    setReportRead,
    setReportUnread,
    seedUnreadState,
    registerReportStatuses,
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
 *   statusByReport: Record<string, string>,
 *   latestMessageByReport: Record<string, object>,
 *   setReportRead: (reportId: string) => void,
 *   setReportUnread: (reportId: string) => void,
 *   seedUnreadState: (map: Record<string, boolean>, force?: boolean) => void,
 *   registerReportStatuses: (reports: Array<{ id: string | number, status: string }>) => void,
 *   refreshFromApi: (reportIds: string[], userId?: string, force?: boolean) => Promise<void>,
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
