import { APP_PAGES } from './pageModel'

/**
 * Global Guide Dictionary for CitiSent.
 * Contains component-level mini-manual entries and multi-step tour guides for every page.
 */
export const PAGE_GUIDE_CATALOG = {
  [APP_PAGES.DASHBOARD]: {
    pageTitle: 'Dashboard Overview',
    description: 'High-level executive metrics, AI sentiment breakdowns, and real-time civic incident triage.',
    steps: [
      {
        id: 'dashboard-summary-cards',
        title: 'Summary Metric Cards',
        targetSelector: '[data-guide="dashboard-summary-cards"]',
        body: 'Displays key performance indicators (KPIs) of civic reports: Total Reports, Pending review, In-Review investigations, and Resolved incidents.',
        tip: 'Color-coded tags give an immediate status health check across all municipal jurisdictions.',
      },
      {
        id: 'dashboard-sentiment',
        title: 'AI Sentiment & Urgency Radar',
        targetSelector: '[data-guide="dashboard-sentiment"]',
        body: 'Visualizes real-time citizen emotional states (Frustration, Anger, Urgency) analyzed from report narratives using CitiSent’s AI pipeline.',
        tip: 'Spikes in frustration highlight critical civic hazards requiring urgent municipal intervention.',
      },
      {
        id: 'dashboard-department-distribution',
        title: 'Department Distribution Chart',
        targetSelector: '[data-guide="dashboard-department-distribution"]',
        body: 'Shows how incoming complaints are distributed across municipal departments (e.g., Engineering, Health, Sanitation, Traffic).',
        tip: 'Helps municipal leaders reallocate triage personnel to overloaded departments.',
      },
      {
        id: 'dashboard-recent-triage',
        title: 'Live Triage Activity Feed',
        targetSelector: '[data-guide="dashboard-recent-triage"]',
        body: 'A real-time chronological list of incoming civic reports, displaying category badges, severity levels, and instant review actions.',
        tip: 'Click any report to inspect the citizen’s evidence and initiate a direct conversation.',
      },
    ],
  },

  [APP_PAGES.REPORTS_BY_CATEGORY]: {
    pageTitle: 'Reports by Category',
    description: 'Filter, triage, and reassign civic reports grouped by municipal issue domains.',
    steps: [
      {
        id: 'reports-filter-bar',
        title: 'Multi-Dimensional Filters',
        targetSelector: '[data-guide="reports-filter-bar"]',
        body: 'Quickly narrow down reports by status (Pending, In Review, Resolved, Rejected), urgency level, or search keywords.',
        tip: 'Filters sync seamlessly with the URL so you can bookmark specific triage queues.',
      },
      {
        id: 'reports-feed-table',
        title: 'Incident Reports Table',
        targetSelector: '[data-guide="reports-feed-table"]',
        body: 'Lists citizen complaints with Display IDs, issue titles, barangay locations, and severity indicators.',
        tip: 'Clicking a report opens the full incident detail drawer with GPS coordinates and photo evidence.',
      },
    ],
  },

  [APP_PAGES.REPORTS_BY_URGENCY]: {
    pageTitle: 'Reports by Urgency Levels',
    description: 'Prioritized queue focusing on high-severity hazards and time-sensitive municipal emergencies.',
    steps: [
      {
        id: 'reports-urgency-table',
        title: 'Urgency-Ranked Queue',
        targetSelector: '[data-guide="reports-urgency-table"]',
        body: 'Prioritizes civic reports based on severity scores calculated from citizen input and AI urgency sentiment.',
        tip: 'Critical safety hazards (e.g. electrical wire breaks, sinkholes) appear at the very top.',
      },
    ],
  },

  [APP_PAGES.REPORTS_HISTORY]: {
    pageTitle: 'Reports History Archive',
    description: 'Comprehensive historical audit record of all past municipal reports.',
    steps: [
      {
        id: 'reports-history-table',
        title: 'Historical Audit Table',
        targetSelector: '[data-guide="reports-history-table"]',
        body: 'Permanent record of resolved and closed incidents, including resolution dates and handling staff.',
        tip: 'Use the export button to download CSV spreadsheets for quarterly municipal reporting.',
      },
    ],
  },

  [APP_PAGES.REPORT_DETAIL]: {
    pageTitle: 'Incident Report Detail',
    description: 'Comprehensive incident dossier, evidence inspection, and citizen communication.',
    steps: [
      {
        id: 'report-detail-info',
        title: 'Incident Evidence & Map',
        targetSelector: '[data-guide="report-detail-info"]',
        body: 'Contains the complete narrative, photographic evidence from Supabase storage, and verified GPS coordinates.',
        tip: 'Inspect high-resolution photo attachments using the lightbox viewer.',
      },
      {
        id: 'report-detail-chat',
        title: 'Real-Time Citizen Discussion',
        targetSelector: '[data-guide="report-detail-chat"]',
        body: 'Direct, encrypted two-way chat with the reporting citizen to request additional clarification or verify repairs.',
        tip: 'Messages are automatically saved to the case record and time-stamped in immutable audit logs.',
      },
    ],
  },

  [APP_PAGES.USERS]: {
    pageTitle: 'Citizens & User Directory',
    description: 'Manage registered citizens, inspect verification status, and perform moderation.',
    steps: [
      {
        id: 'users-search-bar',
        title: 'Citizen Search & Filters',
        targetSelector: '[data-guide="users-search-bar"]',
        body: 'Search citizens by name, email, phone number, or standardized Display ID (CIT-XXXX).',
        tip: 'Quickly verify if a citizen has completed mobile OTP authentication.',
      },
      {
        id: 'users-table',
        title: 'Citizen Accounts Table',
        targetSelector: '[data-guide="users-table"]',
        body: 'Lists citizen profiles, registered dates, total reports submitted, and account status (Active or Banned).',
        tip: 'Use the action menu (...) on any row to inspect report history or manage access.',
      },
      {
        id: 'users-moderation',
        title: 'User Moderation & Account Actions',
        targetSelector: '[data-guide="users-moderation"]',
        body: 'Safeguard the community by issuing temporary or permanent bans for abusive submissions or spam.',
        tip: 'Every ban or unban action requires a recorded reason and is preserved in audit logs.',
      },
    ],
  },

  [APP_PAGES.CONVERSATIONS]: {
    pageTitle: 'Conversations Hub',
    description: 'Unified inbox for all active two-way communications between citizens and municipal staff.',
    steps: [
      {
        id: 'conversations-thread-list',
        title: 'Active Discussion Threads',
        targetSelector: '[data-guide="conversations-thread-list"]',
        body: 'Displays all ongoing citizen chat channels with unread message badges and incident cross-references.',
        tip: 'Threads with unread citizen replies are automatically brought to the top.',
      },
      {
        id: 'conversations-chat-window',
        title: 'Live Chat Window',
        targetSelector: '[data-guide="conversations-chat-window"]',
        body: 'Powered by real-time WebSockets, allowing instant messaging and status advice directly to citizens’ mobile apps.',
        tip: 'Use canned administrative note suggestions for quick, standardized updates.',
      },
    ],
  },

  [APP_PAGES.ADMIN_MANAGEMENT]: {
    pageTitle: 'Admin Management',
    description: 'Superadmin console for municipal staff provisioning, department transfers, and agency catalog.',
    steps: [
      {
        id: 'admin-staff-roster',
        title: 'Office Admin Staff Roster',
        targetSelector: '[data-guide="admin-staff-roster"]',
        body: 'View, invite, and configure permissions for departmental administrative personnel.',
        tip: 'Assign staff to specific municipal departments (e.g., Engineering, Health Office).',
      },
      {
        id: 'admin-transfer-queue',
        title: 'Department Transfer Requests',
        targetSelector: '[data-guide="admin-transfer-queue"]',
        body: 'Review pending requests submitted by office staff seeking transfer to a different municipal department.',
        tip: 'Superadmins can approve or reject transfers with documented administrative rationale.',
      },
      {
        id: 'admin-department-catalog',
        title: 'Municipal Departments Catalog',
        targetSelector: '[data-guide="admin-department-catalog"]',
        body: 'Create and configure municipal departments, set active operational status, and manage official agency logos.',
        tip: 'Deactivating a department routes future citizen reports to the general triage queue.',
      },
    ],
  },

  [APP_PAGES.SETTINGS]: {
    pageTitle: 'Settings & Governance Hub',
    description: 'Configure visual preferences, security policies, and review compliance standards.',
    steps: [
      {
        id: 'settings-tabs-guide',
        title: 'Settings Sub-Sections',
        targetSelector: '[data-guide="settings-tabs-guide"]',
        body: 'Comprehensive settings covering Appearance, Security, Notifications, Report Management, Audit Logs, and System preferences.',
        tip: 'Preferences are saved locally in your browser and persist across sessions.',
      },
    ],
  },

  [APP_PAGES.SETTINGS_APPEARANCE]: {
    pageTitle: 'Appearance Settings',
    description: 'Configure themes and typography for optimal accessibility.',
    steps: [
      {
        id: 'settings-appearance-card',
        title: 'Theme & Font Size Options',
        targetSelector: '[data-guide="settings-appearance-card"]',
        body: 'Switch between Light, Dark, or System themes and adjust font scaling for comfortable viewing during long triage shifts.',
        tip: 'Dark theme helps reduce eye strain during evening or night shifts.',
      },
    ],
  },

  [APP_PAGES.SETTINGS_SECURITY]: {
    pageTitle: 'Security Settings',
    description: 'Manage admin authentication, strong passwords, and active credentials.',
    steps: [
      {
        id: 'settings-security-card',
        title: 'Password & Authentication Rules',
        targetSelector: '[data-guide="settings-security-card"]',
        body: 'Update your administrative password with strict complexity rules (minimum 12 characters, dictionary word rejection, number & symbol requirements).',
        tip: 'Regular password rotation ensures municipal system integrity.',
      },
    ],
  },

  [APP_PAGES.SETTINGS_PRIVACY_TERMS]: {
    pageTitle: 'Privacy Policy & Terms',
    description: 'Philippine Data Privacy Act (RA 10173) compliance, Supabase data catalog, and staff code of conduct.',
    steps: [
      {
        id: 'settings-privacy-terms-card',
        title: 'Governance & Data Inventory Hub',
        targetSelector: '[data-guide="settings-privacy-terms-card"]',
        body: 'Provides full transparency into Supabase tables, retention rules, citizen data rights, and strict administrative confidentiality duties.',
        tip: 'Use the Print / Save PDF button to generate official documentation for municipal compliance audits.',
      },
    ],
  },

  [APP_PAGES.SETTINGS_AUDIT_LOGS]: {
    pageTitle: 'Audit & Activity Logs',
    description: 'Immutable historical record of all administrative triage, moderation, and export actions.',
    steps: [
      {
        id: 'settings-audit-logs-card',
        title: 'Compliance Audit Trail',
        targetSelector: '[data-guide="settings-audit-logs-card"]',
        body: 'Tracks user logins, report status modifications, user ban toggles, and data export events with timestamps.',
        tip: 'Audit logs provide accountability under Section 31 of RA 10173.',
      },
    ],
  },
}

/**
 * Normalizes any pageKey (including parameterized routes or sub-sections)
 * to find the matching guide catalog entry.
 */
export function getGuideForPage(pageKey) {
  if (!pageKey) return null

  if (PAGE_GUIDE_CATALOG[pageKey]) {
    return PAGE_GUIDE_CATALOG[pageKey]
  }

  // Fallback for settings sub-pages
  if (pageKey.startsWith('Settings:')) {
    return PAGE_GUIDE_CATALOG[APP_PAGES.SETTINGS] || null
  }

  // Fallback for reports sub-pages
  if (pageKey.startsWith('Reports:')) {
    return PAGE_GUIDE_CATALOG[APP_PAGES.REPORTS_BY_CATEGORY] || null
  }

  return null
}

/**
 * Searches for a specific component's guide entry across the entire catalog.
 */
export function findComponentGuide(componentId) {
  if (!componentId) return null

  for (const pageEntry of Object.values(PAGE_GUIDE_CATALOG)) {
    const match = pageEntry.steps?.find((step) => step.id === componentId)
    if (match) {
      return match
    }
  }

  return null
}
