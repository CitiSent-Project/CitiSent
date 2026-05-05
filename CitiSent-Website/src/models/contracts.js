/**
 * @typedef {Object} AdminProfile
 * @property {string} id
 * @property {string} fname
 * @property {string} mname
 * @property {string} lname
 * @property {string} fullName
 * @property {string} email
 * @property {string} departmentId
 * @property {string} department
 * @property {string} role
 * @property {string} phone
 * @property {string} address
 * @property {string} password
 * @property {string} joinedAt
 * @property {string} lastLoginAt
 */

/**
 * @typedef {AdminProfile} AdminAccount
 */

/**
 * @typedef {Object} Preferences
 * @property {string} displayName
 * @property {string} department
 * @property {boolean} notificationsEnabled
 * @property {string} digestFrequency
 * @property {boolean} reportStatusUpdates
 * @property {boolean} adminInvitations
 * @property {string} theme
 * @property {string} fontSize
 * @property {boolean} animationsEnabled
 * @property {number} sessionTimeout
 */

/**
 * @typedef {Object} AdminNotification
 * @property {string} id
 * @property {string} title
 * @property {string} message
 * @property {string} type
 * @property {string} createdAt
 * @property {boolean} read
 */

/**
 * @typedef {Record<string, AdminNotification[]>} NotificationsByAdmin
 */

/**
 * @typedef {'Pending' | 'Approved' | 'Rejected'} TransferRequestStatus
 */

/**
 * @typedef {Object} TransferRequest
 * @property {string} id
 * @property {string} adminId
 * @property {string} adminName
 * @property {string} currentDepartmentId
 * @property {string} currentDepartmentLabel
 * @property {string} requestedDepartmentId
 * @property {string} requestedDepartmentLabel
 * @property {string} reason
 * @property {TransferRequestStatus | string} status
 * @property {string} requestedAt
 * @property {string} reviewedAt
 * @property {string} reviewerId
 * @property {string} reviewerName
 * @property {string} reviewNotes
 */

/**
 * @typedef {Object} ActivityEntry
 * @property {string} id
 * @property {string} action
 * @property {string} detail
 * @property {string} createdAt
 */

/**
 * @typedef {Record<string, string>} ReportStatusMap
 */

/**
 * @typedef {Object} StorageEnvelope
 * @property {number} schemaVersion
 * @property {unknown} payload
 */

/**
 * @typedef {Object} AppStateSnapshot
 * @property {string} activePage
 * @property {boolean} isPageLoading
 * @property {string} authPage
 * @property {boolean} isAuthenticated
 * @property {AdminProfile} profile
 * @property {AdminAccount[]} adminAccounts
 * @property {Preferences} preferences
 * @property {NotificationsByAdmin} notificationsByAdmin
 * @property {ActivityEntry[]} activityLog
 * @property {TransferRequest[]} transferRequests
 * @property {string} rememberedEmail
 * @property {unknown | null} selectedUserProfile
 * @property {unknown | null} selectedReport
 * @property {ReportStatusMap} reportStatusMap
 */

export const MODEL_CONTRACTS_VERSION = 1
