# Src Controllers Reference

Scope: files grouped under src-controllers for CitiSent-Website.

## File: src/controllers/__tests__/accessControlController.test.js

- Purpose: Automated test module that validates feature behavior and prevents regressions.
- Export Surface: No explicit exports (or export detection not applicable).
- Imports: vitest, ../../models/pageModel, ../../models/roleAccessModel, ../accessControlController
- Functions: None explicitly declared in this module.

## File: src/controllers/__tests__/activityController.test.js

- Purpose: Automated test module that validates feature behavior and prevents regressions.
- Export Surface: No explicit exports (or export detection not applicable).
- Imports: vitest, ../activityController
- Functions: None explicitly declared in this module.

## File: src/controllers/__tests__/adminManagementController.test.js

- Purpose: Automated test module that validates feature behavior and prevents regressions.
- Export Surface: No explicit exports (or export detection not applicable).
- Imports: vitest, ../../models/roleAccessModel
- Functions: None explicitly declared in this module.

## File: src/controllers/__tests__/authController.test.js

- Purpose: Automated test module that validates feature behavior and prevents regressions.
- Export Surface: No explicit exports (or export detection not applicable).
- Imports: vitest, ../../models/pageModel
- Functions: None explicitly declared in this module.

## File: src/controllers/__tests__/dashboardController.test.js

- Purpose: Automated test module that validates feature behavior and prevents regressions.
- Export Surface: No explicit exports (or export detection not applicable).
- Imports: vitest, ../dashboardController
- Functions: None explicitly declared in this module.

## File: src/controllers/__tests__/departmentTransferController.test.js

- Purpose: Automated test module that validates feature behavior and prevents regressions.
- Export Surface: No explicit exports (or export detection not applicable).
- Imports: vitest
- Functions: None explicitly declared in this module.

## File: src/controllers/__tests__/navigationController.test.js

- Purpose: Automated test module that validates feature behavior and prevents regressions.
- Export Surface: No explicit exports (or export detection not applicable).
- Imports: vitest, ../../models/pageModel
- Functions: None explicitly declared in this module.

## File: src/controllers/__tests__/notificationsController.test.js

- Purpose: Automated test module that validates feature behavior and prevents regressions.
- Export Surface: No explicit exports (or export detection not applicable).
- Imports: vitest
- Functions: None explicitly declared in this module.

## File: src/controllers/__tests__/profileController.test.js

- Purpose: Automated test module that validates feature behavior and prevents regressions.
- Export Surface: No explicit exports (or export detection not applicable).
- Imports: vitest, ../../models/roleAccessModel
- Functions: None explicitly declared in this module.

## File: src/controllers/__tests__/reportAccessController.test.js

- Purpose: Automated test module that validates feature behavior and prevents regressions.
- Export Surface: No explicit exports (or export detection not applicable).
- Imports: vitest, ../../models/roleAccessModel
- Functions: None explicitly declared in this module.

## File: src/controllers/__tests__/reportStateController.test.js

- Purpose: Automated test module that validates feature behavior and prevents regressions.
- Export Surface: No explicit exports (or export detection not applicable).
- Imports: vitest
- Functions: None explicitly declared in this module.

## File: src/controllers/__tests__/userReportsController.test.js

- Purpose: Automated test module that validates feature behavior and prevents regressions.
- Export Surface: No explicit exports (or export detection not applicable).
- Imports: vitest
- Functions: None explicitly declared in this module.

## File: src/controllers/accessControlController.js

- Purpose: Controller layer module that orchestrates feature rules, state transitions, and view-model logic.
- Export Surface: Exports: buildPageAccessDecision
- Imports: ../models/roleAccessModel
- Functions Declared: 1

### Function: buildPageAccessDecision({ role, requestedPage })

- Defined At: line 2
- Specific Purpose: Builds the next controller state payload used by UI/page layers after an interaction, transition, or domain event.
- Inputs: Accepts: { role, requestedPage }
- Output: Returns a newly constructed/normalized data structure for downstream use.
- Side Effects: No direct external side effects detected; behavior appears computation/render focused.
- Key Dependencies: ../models/roleAccessModel
- Usage Scope: Exported symbol; intended for use by other modules importing this file.

## File: src/controllers/activityController.js

- Purpose: Controller layer module that orchestrates feature rules, state transitions, and view-model logic.
- Export Surface: Exports: buildNextActivityLog
- Imports: ../models/data
- Functions Declared: 1

### Function: buildNextActivityLog({ previousActivityLog, action, detail, maxItems = 25 })

- Defined At: line 2
- Specific Purpose: Builds the next controller state payload used by UI/page layers after an interaction, transition, or domain event.
- Inputs: Accepts: { previousActivityLog, action, detail, maxItems = 25 }
- Output: Returns a newly constructed/normalized data structure for downstream use.
- Side Effects: No direct external side effects detected; behavior appears computation/render focused.
- Key Dependencies: ../models/data
- Usage Scope: Exported symbol; intended for use by other modules importing this file.

## File: src/controllers/adminManagementController.js

- Purpose: Controller layer module that orchestrates feature rules, state transitions, and view-model logic.
- Export Surface: Exports: buildOfficeAdminDepartmentAssignment, buildUnreadByAdminId, filterOfficeAdmins, filterPendingTransferRequests, getOfficeAdmins, getTotalUnreadCount
- Imports: ../models/roleAccessModel
- Functions Declared: 7

### Function: getOfficeAdmins(adminAccounts = [])

- Defined At: line 2
- Specific Purpose: Retrieves, selects, or computes feature data required for the next processing step.
- Inputs: Accepts: adminAccounts = []
- Output: Returns retrieved or derived data (object, array, or primitive) consumed by callers.
- Side Effects: No direct external side effects detected; behavior appears computation/render focused.
- Key Dependencies: ../models/roleAccessModel
- Usage Scope: Exported symbol; intended for use by other modules importing this file.

### Function: includesQuery(value, query)

- Defined At: line 6
- Specific Purpose: Implements file-specific feature logic that supports this module's behavior and data flow.
- Inputs: Accepts: value, query
- Output: Returns a module-specific value based on current parameters and internal logic.
- Side Effects: No direct external side effects detected; behavior appears computation/render focused.
- Key Dependencies: ../models/roleAccessModel
- Usage Scope: Internal helper; intended to be used only within this module.

### Function: buildUnreadByAdminId({ officeAdmins = [], notificationsByAdmin = {} })

- Defined At: line 10
- Specific Purpose: Builds the next controller state payload used by UI/page layers after an interaction, transition, or domain event.
- Inputs: Accepts: { officeAdmins = [], notificationsByAdmin = {} }
- Output: Returns a newly constructed/normalized data structure for downstream use.
- Side Effects: No direct external side effects detected; behavior appears computation/render focused.
- Key Dependencies: ../models/roleAccessModel
- Usage Scope: Exported symbol; intended for use by other modules importing this file.

### Function: getTotalUnreadCount(unreadByAdminId = {})

- Defined At: line 19
- Specific Purpose: Retrieves, selects, or computes feature data required for the next processing step.
- Inputs: Accepts: unreadByAdminId = {}
- Output: Returns retrieved or derived data (object, array, or primitive) consumed by callers.
- Side Effects: No direct external side effects detected; behavior appears computation/render focused.
- Key Dependencies: ../models/roleAccessModel
- Usage Scope: Exported symbol; intended for use by other modules importing this file.

### Function: filterOfficeAdmins({
  officeAdmins = [],
  searchTerm = '',
  departmentFilter = 'all',
  unreadFilter = 'all',
  unreadByAdminId = {},
})

- Defined At: line 23
- Specific Purpose: Derives controller-ready collections by filtering, sorting, or slicing data for presentation and interaction flows.
- Inputs: Accepts: {
  officeAdmins = [], searchTerm = '', departmentFilter = 'all', unreadFilter = 'all', unreadByAdminId = {}, }
- Output: Returns a module-specific value based on current parameters and internal logic.
- Side Effects: No direct external side effects detected; behavior appears computation/render focused.
- Key Dependencies: ../models/roleAccessModel
- Usage Scope: Exported symbol; intended for use by other modules importing this file.

### Function: filterPendingTransferRequests({
  pendingRequests = [],
  searchTerm = '',
  departmentFilter = 'all',
})

- Defined At: line 48
- Specific Purpose: Derives controller-ready collections by filtering, sorting, or slicing data for presentation and interaction flows.
- Inputs: Accepts: {
  pendingRequests = [], searchTerm = '', departmentFilter = 'all', }
- Output: Returns a module-specific value based on current parameters and internal logic.
- Side Effects: Triggers network/API I/O.
- Key Dependencies: ../models/roleAccessModel
- Usage Scope: Exported symbol; intended for use by other modules importing this file.

### Function: buildOfficeAdminDepartmentAssignment({
  adminAccounts,
  adminId,
  nextDepartmentId,
  nextDepartmentLabel,
})

- Defined At: line 76
- Specific Purpose: Builds the next controller state payload used by UI/page layers after an interaction, transition, or domain event.
- Inputs: Accepts: {
  adminAccounts, adminId, nextDepartmentId, nextDepartmentLabel, }
- Output: Returns a newly constructed/normalized data structure for downstream use.
- Side Effects: Triggers network/API I/O.
- Key Dependencies: ../models/roleAccessModel
- Usage Scope: Exported symbol; intended for use by other modules importing this file.

## File: src/controllers/appearanceController.js

- Purpose: Controller layer module that orchestrates feature rules, state transitions, and view-model logic.
- Export Surface: Exports: buildAppearanceState, resolveEffectiveTheme
- Imports: No explicit imports detected.
- Functions Declared: 2

### Function: resolveEffectiveTheme({ themePreference, systemPrefersDark })

- Defined At: line 6
- Specific Purpose: Implements file-specific feature logic that supports this module's behavior and data flow.
- Inputs: Accepts: { themePreference, systemPrefersDark }
- Output: Returns retrieved or derived data (object, array, or primitive) consumed by callers.
- Side Effects: No direct external side effects detected; behavior appears computation/render focused.
- Key Dependencies: This function primarily relies on in-file logic and standard language/runtime features.
- Usage Scope: Exported symbol; intended for use by other modules importing this file.

### Function: buildAppearanceState({
  themePreference,
  fontSizePreference,
  animationsEnabled,
  systemPrefersDark,
})

- Defined At: line 18
- Specific Purpose: Builds the next controller state payload used by UI/page layers after an interaction, transition, or domain event.
- Inputs: Accepts: {
  themePreference, fontSizePreference, animationsEnabled, systemPrefersDark, }
- Output: Returns a newly constructed/normalized data structure for downstream use.
- Side Effects: No direct external side effects detected; behavior appears computation/render focused.
- Key Dependencies: This function primarily relies on in-file logic and standard language/runtime features.
- Usage Scope: Exported symbol; intended for use by other modules importing this file.

## File: src/controllers/authController.js

- Purpose: Controller layer module that orchestrates feature rules, state transitions, and view-model logic.
- Export Surface: Exports: buildLoginState, buildRegistrationState, resolveAuthenticatedAdmin, validateLoginCredentials
- Imports: ../models/pageModel
- Functions Declared: 4

### Function: buildRegistrationState({ currentProfile, payload })

- Defined At: line 2
- Specific Purpose: Builds the next controller state payload used by UI/page layers after an interaction, transition, or domain event.
- Inputs: Accepts: { currentProfile, payload }
- Output: Returns a newly constructed/normalized data structure for downstream use.
- Side Effects: Drives navigation or view transition state. Creates timestamped metadata for logs/events.
- Key Dependencies: ../models/pageModel
- Usage Scope: Exported symbol; intended for use by other modules importing this file.

### Function: validateLoginCredentials({ profile, payload })

- Defined At: line 27
- Specific Purpose: Applies controller-level rule validation to allow, deny, or constrain transitions based on business conditions.
- Inputs: Accepts: { profile, payload }
- Output: Returns a boolean or validation result object indicating whether constraints pass.
- Side Effects: No direct external side effects detected; behavior appears computation/render focused.
- Key Dependencies: ../models/pageModel
- Usage Scope: Exported symbol; intended for use by other modules importing this file.

### Function: resolveAuthenticatedAdmin({ adminAccounts = [], payload })

- Defined At: line 43
- Specific Purpose: Implements file-specific feature logic that supports this module's behavior and data flow.
- Inputs: Accepts: { adminAccounts = [], payload }
- Output: Returns retrieved or derived data (object, array, or primitive) consumed by callers.
- Side Effects: Creates timestamped metadata for logs/events.
- Key Dependencies: ../models/pageModel
- Usage Scope: Exported symbol; intended for use by other modules importing this file.

### Function: buildLoginState({ payload, authenticatedAdmin })

- Defined At: line 54
- Specific Purpose: Builds the next controller state payload used by UI/page layers after an interaction, transition, or domain event.
- Inputs: Accepts: { payload, authenticatedAdmin }
- Output: Returns a newly constructed/normalized data structure for downstream use.
- Side Effects: Drives navigation or view transition state. Creates timestamped metadata for logs/events.
- Key Dependencies: ../models/pageModel
- Usage Scope: Exported symbol; intended for use by other modules importing this file.

## File: src/controllers/dashboardController.js

- Purpose: Controller layer module that orchestrates feature rules, state transitions, and view-model logic.
- Export Surface: Exports: buildDashboardNewUserRows, buildDashboardStatCards
- Imports: No explicit imports detected.
- Functions Declared: 2

### Function: buildDashboardStatCards({ statCards = [], iconMap = {} })

- Defined At: line 1
- Specific Purpose: Builds the next controller state payload used by UI/page layers after an interaction, transition, or domain event.
- Inputs: Accepts: { statCards = [], iconMap = {} }
- Output: Returns a newly constructed/normalized data structure for downstream use.
- Side Effects: No direct external side effects detected; behavior appears computation/render focused.
- Key Dependencies: This function primarily relies on in-file logic and standard language/runtime features.
- Usage Scope: Exported symbol; intended for use by other modules importing this file.

### Function: buildDashboardNewUserRows(rows = [])

- Defined At: line 7
- Specific Purpose: Builds the next controller state payload used by UI/page layers after an interaction, transition, or domain event.
- Inputs: Accepts: rows = []
- Output: Returns a newly constructed/normalized data structure for downstream use.
- Side Effects: No direct external side effects detected; behavior appears computation/render focused.
- Key Dependencies: This function primarily relies on in-file logic and standard language/runtime features.
- Usage Scope: Exported symbol; intended for use by other modules importing this file.

## File: src/controllers/departmentTransferController.js

- Purpose: Controller layer module that orchestrates feature rules, state transitions, and view-model logic.
- Export Surface: Exports: buildTransferApproval, buildTransferRejection, buildTransferRequestCreation, getPendingTransferRequests, TRANSFER_REQUEST_STATUS
- Imports: No explicit imports detected.
- Functions Declared: 4

### Function: buildTransferRequestCreation({
  profile,
  requestedDepartmentId,
  requestedDepartmentLabel,
  reason,
})

- Defined At: line 6
- Specific Purpose: Builds the next controller state payload used by UI/page layers after an interaction, transition, or domain event.
- Inputs: Accepts: {
  profile, requestedDepartmentId, requestedDepartmentLabel, reason, }
- Output: Returns a newly constructed/normalized data structure for downstream use.
- Side Effects: Triggers network/API I/O. Creates timestamped metadata for logs/events.
- Key Dependencies: This function primarily relies on in-file logic and standard language/runtime features.
- Usage Scope: Exported symbol; intended for use by other modules importing this file.

### Function: buildTransferApproval({ request, reviewerProfile, reviewNotes })

- Defined At: line 39
- Specific Purpose: Builds the next controller state payload used by UI/page layers after an interaction, transition, or domain event.
- Inputs: Accepts: { request, reviewerProfile, reviewNotes }
- Output: Returns a newly constructed/normalized data structure for downstream use.
- Side Effects: Triggers network/API I/O. Creates timestamped metadata for logs/events.
- Key Dependencies: This function primarily relies on in-file logic and standard language/runtime features.
- Usage Scope: Exported symbol; intended for use by other modules importing this file.

### Function: buildTransferRejection({ request, reviewerProfile, reviewNotes })

- Defined At: line 64
- Specific Purpose: Builds the next controller state payload used by UI/page layers after an interaction, transition, or domain event.
- Inputs: Accepts: { request, reviewerProfile, reviewNotes }
- Output: Returns a newly constructed/normalized data structure for downstream use.
- Side Effects: Triggers network/API I/O. Creates timestamped metadata for logs/events.
- Key Dependencies: This function primarily relies on in-file logic and standard language/runtime features.
- Usage Scope: Exported symbol; intended for use by other modules importing this file.

### Function: getPendingTransferRequests(requests = [])

- Defined At: line 89
- Specific Purpose: Retrieves, selects, or computes feature data required for the next processing step.
- Inputs: Accepts: requests = []
- Output: Returns retrieved or derived data (object, array, or primitive) consumed by callers.
- Side Effects: Triggers network/API I/O. Creates timestamped metadata for logs/events.
- Key Dependencies: This function primarily relies on in-file logic and standard language/runtime features.
- Usage Scope: Exported symbol; intended for use by other modules importing this file.

## File: src/controllers/navigationController.js

- Purpose: Controller layer module that orchestrates feature rules, state transitions, and view-model logic.
- Export Surface: Exports: buildPageNavigationTransition, buildPostLoginTransition, buildPostLogoutTransition, buildPostRegistrationTransition, buildReportDetailTransition, buildUserProfileTransition, getDashboardPage, getLoginAuthPage, getLogoutPage, getRegisterAuthPage, getReportsCategoryPage, getUsersPage
- Imports: ../models/pageModel, ./reportStateController
- Functions Declared: 12

### Function: buildPageNavigationTransition({ currentPage, nextPage })

- Defined At: line 3
- Specific Purpose: Builds the next controller state payload used by UI/page layers after an interaction, transition, or domain event.
- Inputs: Accepts: { currentPage, nextPage }
- Output: Returns a newly constructed/normalized data structure for downstream use.
- Side Effects: Drives navigation or view transition state.
- Key Dependencies: ../models/pageModel, ./reportStateController
- Usage Scope: Exported symbol; intended for use by other modules importing this file.

### Function: buildUserProfileTransition({ user })

- Defined At: line 14
- Specific Purpose: Builds the next controller state payload used by UI/page layers after an interaction, transition, or domain event.
- Inputs: Accepts: { user }
- Output: Returns a newly constructed/normalized data structure for downstream use.
- Side Effects: Drives navigation or view transition state.
- Key Dependencies: ../models/pageModel, ./reportStateController
- Usage Scope: Exported symbol; intended for use by other modules importing this file.

### Function: buildReportDetailTransition({ report, reportStatusMap })

- Defined At: line 21
- Specific Purpose: Builds the next controller state payload used by UI/page layers after an interaction, transition, or domain event.
- Inputs: Accepts: { report, reportStatusMap }
- Output: Returns a newly constructed/normalized data structure for downstream use.
- Side Effects: Drives navigation or view transition state.
- Key Dependencies: ../models/pageModel, ./reportStateController
- Usage Scope: Exported symbol; intended for use by other modules importing this file.

### Function: getUsersPage()

- Defined At: line 29
- Specific Purpose: Retrieves, selects, or computes feature data required for the next processing step.
- Inputs: No explicit parameters; relies on closure/module context and imported dependencies.
- Output: Returns retrieved or derived data (object, array, or primitive) consumed by callers.
- Side Effects: Drives navigation or view transition state.
- Key Dependencies: ../models/pageModel, ./reportStateController
- Usage Scope: Exported symbol; intended for use by other modules importing this file.

### Function: getReportsCategoryPage()

- Defined At: line 33
- Specific Purpose: Retrieves, selects, or computes feature data required for the next processing step.
- Inputs: No explicit parameters; relies on closure/module context and imported dependencies.
- Output: Returns retrieved or derived data (object, array, or primitive) consumed by callers.
- Side Effects: Drives navigation or view transition state.
- Key Dependencies: ../models/pageModel, ./reportStateController
- Usage Scope: Exported symbol; intended for use by other modules importing this file.

### Function: getLogoutPage()

- Defined At: line 37
- Specific Purpose: Retrieves, selects, or computes feature data required for the next processing step.
- Inputs: No explicit parameters; relies on closure/module context and imported dependencies.
- Output: Returns retrieved or derived data (object, array, or primitive) consumed by callers.
- Side Effects: Drives navigation or view transition state.
- Key Dependencies: ../models/pageModel, ./reportStateController
- Usage Scope: Exported symbol; intended for use by other modules importing this file.

### Function: getDashboardPage()

- Defined At: line 41
- Specific Purpose: Retrieves, selects, or computes feature data required for the next processing step.
- Inputs: No explicit parameters; relies on closure/module context and imported dependencies.
- Output: Returns retrieved or derived data (object, array, or primitive) consumed by callers.
- Side Effects: Drives navigation or view transition state.
- Key Dependencies: ../models/pageModel, ./reportStateController
- Usage Scope: Exported symbol; intended for use by other modules importing this file.

### Function: getLoginAuthPage()

- Defined At: line 45
- Specific Purpose: Retrieves, selects, or computes feature data required for the next processing step.
- Inputs: No explicit parameters; relies on closure/module context and imported dependencies.
- Output: Returns retrieved or derived data (object, array, or primitive) consumed by callers.
- Side Effects: Drives navigation or view transition state.
- Key Dependencies: ../models/pageModel, ./reportStateController
- Usage Scope: Exported symbol; intended for use by other modules importing this file.

### Function: getRegisterAuthPage()

- Defined At: line 49
- Specific Purpose: Retrieves, selects, or computes feature data required for the next processing step.
- Inputs: No explicit parameters; relies on closure/module context and imported dependencies.
- Output: Returns retrieved or derived data (object, array, or primitive) consumed by callers.
- Side Effects: Drives navigation or view transition state.
- Key Dependencies: ../models/pageModel, ./reportStateController
- Usage Scope: Exported symbol; intended for use by other modules importing this file.

### Function: buildPostRegistrationTransition()

- Defined At: line 53
- Specific Purpose: Builds the next controller state payload used by UI/page layers after an interaction, transition, or domain event.
- Inputs: No explicit parameters; relies on closure/module context and imported dependencies.
- Output: Returns a newly constructed/normalized data structure for downstream use.
- Side Effects: Drives navigation or view transition state.
- Key Dependencies: ../models/pageModel, ./reportStateController
- Usage Scope: Exported symbol; intended for use by other modules importing this file.

### Function: buildPostLoginTransition({ nextActivePage })

- Defined At: line 59
- Specific Purpose: Builds the next controller state payload used by UI/page layers after an interaction, transition, or domain event.
- Inputs: Accepts: { nextActivePage }
- Output: Returns a newly constructed/normalized data structure for downstream use.
- Side Effects: Drives navigation or view transition state.
- Key Dependencies: ../models/pageModel, ./reportStateController
- Usage Scope: Exported symbol; intended for use by other modules importing this file.

### Function: buildPostLogoutTransition()

- Defined At: line 66
- Specific Purpose: Builds the next controller state payload used by UI/page layers after an interaction, transition, or domain event.
- Inputs: No explicit parameters; relies on closure/module context and imported dependencies.
- Output: Returns a newly constructed/normalized data structure for downstream use.
- Side Effects: Drives navigation or view transition state.
- Key Dependencies: ../models/pageModel, ./reportStateController
- Usage Scope: Exported symbol; intended for use by other modules importing this file.

## File: src/controllers/notificationsController.js

- Purpose: Controller layer module that orchestrates feature rules, state transitions, and view-model logic.
- Export Surface: Exports: appendNotificationForAdmin, appendNotificationForAdmins, buildClearAdminNotificationsTransition, buildClearNotificationsTransition, buildNotification, countUnreadNotifications, getAdminNotifications, toggleAdminNotificationReadState, toggleNotificationReadState
- Imports: No explicit imports detected.
- Functions Declared: 9

### Function: toggleNotificationReadState({ notifications, notificationId })

- Defined At: line 1
- Specific Purpose: Switches a boolean or mode state used to control alternate UI or data behavior.
- Inputs: Accepts: { notifications, notificationId }
- Output: Returns updated state/data or completion status after applying mutation logic.
- Side Effects: Creates timestamped metadata for logs/events.
- Key Dependencies: This function primarily relies on in-file logic and standard language/runtime features.
- Usage Scope: Exported symbol; intended for use by other modules importing this file.

### Function: getAdminNotifications({ notificationsByAdmin = {}, adminId })

- Defined At: line 8
- Specific Purpose: Retrieves, selects, or computes feature data required for the next processing step.
- Inputs: Accepts: { notificationsByAdmin = {}, adminId }
- Output: Returns retrieved or derived data (object, array, or primitive) consumed by callers.
- Side Effects: Creates timestamped metadata for logs/events.
- Key Dependencies: This function primarily relies on in-file logic and standard language/runtime features.
- Usage Scope: Exported symbol; intended for use by other modules importing this file.

### Function: buildNotification({ title, message, type = 'Account' })

- Defined At: line 12
- Specific Purpose: Builds the next controller state payload used by UI/page layers after an interaction, transition, or domain event.
- Inputs: Accepts: { title, message, type = 'Account' }
- Output: Returns a newly constructed/normalized data structure for downstream use.
- Side Effects: Creates timestamped metadata for logs/events.
- Key Dependencies: This function primarily relies on in-file logic and standard language/runtime features.
- Usage Scope: Exported symbol; intended for use by other modules importing this file.

### Function: appendNotificationForAdmin({ notificationsByAdmin = {}, adminId, notification })

- Defined At: line 23
- Specific Purpose: Applies state/data mutation logic for this feature and returns the updated value where appropriate.
- Inputs: Accepts: { notificationsByAdmin = {}, adminId, notification }
- Output: Returns updated state/data or completion status after applying mutation logic.
- Side Effects: Creates timestamped metadata for logs/events.
- Key Dependencies: This function primarily relies on in-file logic and standard language/runtime features.
- Usage Scope: Exported symbol; intended for use by other modules importing this file.

### Function: appendNotificationForAdmins({ notificationsByAdmin = {}, adminIds = [], notification })

- Defined At: line 32
- Specific Purpose: Applies state/data mutation logic for this feature and returns the updated value where appropriate.
- Inputs: Accepts: { notificationsByAdmin = {}, adminIds = [], notification }
- Output: Returns updated state/data or completion status after applying mutation logic.
- Side Effects: No direct external side effects detected; behavior appears computation/render focused.
- Key Dependencies: This function primarily relies on in-file logic and standard language/runtime features.
- Usage Scope: Exported symbol; intended for use by other modules importing this file.

### Function: toggleAdminNotificationReadState({ notificationsByAdmin = {}, adminId, notificationId })

- Defined At: line 46
- Specific Purpose: Switches a boolean or mode state used to control alternate UI or data behavior.
- Inputs: Accepts: { notificationsByAdmin = {}, adminId, notificationId }
- Output: Returns updated state/data or completion status after applying mutation logic.
- Side Effects: No direct external side effects detected; behavior appears computation/render focused.
- Key Dependencies: This function primarily relies on in-file logic and standard language/runtime features.
- Usage Scope: Exported symbol; intended for use by other modules importing this file.

### Function: countUnreadNotifications(notifications = [])

- Defined At: line 58
- Specific Purpose: Implements file-specific feature logic that supports this module's behavior and data flow.
- Inputs: Accepts: notifications = []
- Output: Returns a module-specific value based on current parameters and internal logic.
- Side Effects: No direct external side effects detected; behavior appears computation/render focused.
- Key Dependencies: This function primarily relies on in-file logic and standard language/runtime features.
- Usage Scope: Exported symbol; intended for use by other modules importing this file.

### Function: buildClearNotificationsTransition()

- Defined At: line 62
- Specific Purpose: Builds the next controller state payload used by UI/page layers after an interaction, transition, or domain event.
- Inputs: No explicit parameters; relies on closure/module context and imported dependencies.
- Output: Returns a newly constructed/normalized data structure for downstream use.
- Side Effects: No direct external side effects detected; behavior appears computation/render focused.
- Key Dependencies: This function primarily relies on in-file logic and standard language/runtime features.
- Usage Scope: Exported symbol; intended for use by other modules importing this file.

### Function: buildClearAdminNotificationsTransition({ notificationsByAdmin = {}, adminId })

- Defined At: line 73
- Specific Purpose: Builds the next controller state payload used by UI/page layers after an interaction, transition, or domain event.
- Inputs: Accepts: { notificationsByAdmin = {}, adminId }
- Output: Returns a newly constructed/normalized data structure for downstream use.
- Side Effects: No direct external side effects detected; behavior appears computation/render focused.
- Key Dependencies: This function primarily relies on in-file logic and standard language/runtime features.
- Usage Scope: Exported symbol; intended for use by other modules importing this file.

## File: src/controllers/pageRouterController.jsx

- Purpose: Controller layer module that orchestrates feature rules, state transitions, and view-model logic.
- Export Surface: Exports: renderActivePage, renderAuthPage
- Imports: ../frontend/Dashboard, ../frontend/Users/Users, ../frontend/Reports/Reports, ../frontend/Login-Page, ../frontend/Register-Page, ../frontend/Notifications, ../frontend/Logout, ../frontend/ProfilePage
- Functions Declared: 2

### Function: renderAuthPage({ authPage, onRegister, onSwitchToLogin, onLogin, onSwitchToRegister, rememberedEmail })

- Defined At: line 14
- Specific Purpose: Implements file-specific feature logic that supports this module's behavior and data flow.
- Inputs: Accepts: { authPage, onRegister, onSwitchToLogin, onLogin, onSwitchToRegister, rememberedEmail }
- Output: Returns a module-specific value based on current parameters and internal logic.
- Side Effects: Drives navigation or view transition state.
- Key Dependencies: ../frontend/Dashboard, ../frontend/Users/Users, ../frontend/Reports/Reports, ../frontend/Login-Page, ../frontend/Register-Page
- Usage Scope: Exported symbol; intended for use by other modules importing this file.

### Function: renderActivePage({
    appState,
    appActions,
})

- Defined At: line 28
- Specific Purpose: Implements file-specific feature logic that supports this module's behavior and data flow.
- Inputs: Accepts: {
    appState, appActions, }
- Output: Primarily performs side-effect-driven logic; return value is not a primary integration contract.
- Side Effects: Drives navigation or view transition state.
- Key Dependencies: ../frontend/Dashboard, ../frontend/Users/Users, ../frontend/Reports/Reports, ../frontend/Login-Page, ../frontend/Register-Page
- Usage Scope: Exported symbol; intended for use by other modules importing this file.

## File: src/controllers/profileController.js

- Purpose: Controller layer module that orchestrates feature rules, state transitions, and view-model logic.
- Export Surface: Exports: buildPreferenceUpdateState, buildProfileSubmissionState, buildProfileUpdateState
- Imports: ../models/roleAccessModel
- Functions Declared: 3

### Function: buildProfileUpdateState({ currentPreferences, updates })

- Defined At: line 2
- Specific Purpose: Builds the next controller state payload used by UI/page layers after an interaction, transition, or domain event.
- Inputs: Accepts: { currentPreferences, updates }
- Output: Returns a newly constructed/normalized data structure for downstream use.
- Side Effects: No direct external side effects detected; behavior appears computation/render focused.
- Key Dependencies: ../models/roleAccessModel
- Usage Scope: Exported symbol; intended for use by other modules importing this file.

### Function: buildPreferenceUpdateState()

- Defined At: line 27
- Specific Purpose: Builds the next controller state payload used by UI/page layers after an interaction, transition, or domain event.
- Inputs: No explicit parameters; relies on closure/module context and imported dependencies.
- Output: Returns a newly constructed/normalized data structure for downstream use.
- Side Effects: No direct external side effects detected; behavior appears computation/render focused.
- Key Dependencies: ../models/roleAccessModel
- Usage Scope: Exported symbol; intended for use by other modules importing this file.

### Function: buildProfileSubmissionState({
  profile,
  draft,
  transferReason,
  departmentCatalog = [],
  hasPendingTransferRequest = false,
})

- Defined At: line 36
- Specific Purpose: Builds the next controller state payload used by UI/page layers after an interaction, transition, or domain event.
- Inputs: Accepts: {
  profile, draft, transferReason, departmentCatalog = [], hasPendingTransferRequest = false, }
- Output: Returns a newly constructed/normalized data structure for downstream use.
- Side Effects: No direct external side effects detected; behavior appears computation/render focused.
- Key Dependencies: ../models/roleAccessModel
- Usage Scope: Exported symbol; intended for use by other modules importing this file.

## File: src/controllers/reportAccessController.js

- Purpose: Controller layer module that orchestrates feature rules, state transitions, and view-model logic.
- Export Surface: Exports: canAdminUpdateReport, filterReportsForAdmin, getScopedAgencyFilters
- Imports: ../models/roleAccessModel
- Functions Declared: 3

### Function: filterReportsForAdmin({ rows = [], profile })

- Defined At: line 2
- Specific Purpose: Derives controller-ready collections by filtering, sorting, or slicing data for presentation and interaction flows.
- Inputs: Accepts: { rows = [], profile }
- Output: Returns a module-specific value based on current parameters and internal logic.
- Side Effects: No direct external side effects detected; behavior appears computation/render focused.
- Key Dependencies: ../models/roleAccessModel
- Usage Scope: Exported symbol; intended for use by other modules importing this file.

### Function: canAdminUpdateReport({ profile, report })

- Defined At: line 15
- Specific Purpose: Applies controller-level rule validation to allow, deny, or constrain transitions based on business conditions.
- Inputs: Accepts: { profile, report }
- Output: Returns a boolean or validation result object indicating whether constraints pass.
- Side Effects: No direct external side effects detected; behavior appears computation/render focused.
- Key Dependencies: ../models/roleAccessModel
- Usage Scope: Exported symbol; intended for use by other modules importing this file.

### Function: getScopedAgencyFilters({ agencies = [], profile })

- Defined At: line 23
- Specific Purpose: Retrieves, selects, or computes feature data required for the next processing step.
- Inputs: Accepts: { agencies = [], profile }
- Output: Returns retrieved or derived data (object, array, or primitive) consumed by callers.
- Side Effects: No direct external side effects detected; behavior appears computation/render focused.
- Key Dependencies: ../models/roleAccessModel
- Usage Scope: Exported symbol; intended for use by other modules importing this file.

## File: src/controllers/reportStateController.js

- Purpose: Controller layer module that orchestrates feature rules, state transitions, and view-model logic.
- Export Surface: Exports: buildNextReportStatusMap, buildNextSelectedReport, buildViewedReport
- Imports: ../models/reportStatusModel
- Functions Declared: 3

### Function: buildViewedReport({ report, reportStatusMap })

- Defined At: line 2
- Specific Purpose: Builds the next controller state payload used by UI/page layers after an interaction, transition, or domain event.
- Inputs: Accepts: { report, reportStatusMap }
- Output: Returns a newly constructed/normalized data structure for downstream use.
- Side Effects: No direct external side effects detected; behavior appears computation/render focused.
- Key Dependencies: ../models/reportStatusModel
- Usage Scope: Exported symbol; intended for use by other modules importing this file.

### Function: buildNextReportStatusMap({ reportStatusMap, reportId, nextStatus })

- Defined At: line 10
- Specific Purpose: Builds the next controller state payload used by UI/page layers after an interaction, transition, or domain event.
- Inputs: Accepts: { reportStatusMap, reportId, nextStatus }
- Output: Returns a newly constructed/normalized data structure for downstream use.
- Side Effects: No direct external side effects detected; behavior appears computation/render focused.
- Key Dependencies: ../models/reportStatusModel
- Usage Scope: Exported symbol; intended for use by other modules importing this file.

### Function: buildNextSelectedReport({ selectedReport, reportId, nextStatus })

- Defined At: line 15
- Specific Purpose: Builds the next controller state payload used by UI/page layers after an interaction, transition, or domain event.
- Inputs: Accepts: { selectedReport, reportId, nextStatus }
- Output: Returns a newly constructed/normalized data structure for downstream use.
- Side Effects: No direct external side effects detected; behavior appears computation/render focused.
- Key Dependencies: ../models/reportStatusModel
- Usage Scope: Exported symbol; intended for use by other modules importing this file.

## File: src/controllers/reportStatusController.js

- Purpose: Controller layer module that orchestrates feature rules, state transitions, and view-model logic.
- Export Surface: Exports: createReportTimelineEntry, initializeReportRows, updateReportStatusInRows, validateReportStatusChange
- Imports: ../models/reportStatusModel
- Functions Declared: 4

### Function: initializeReportRows(rows = [])

- Defined At: line 2
- Specific Purpose: Implements file-specific feature logic that supports this module's behavior and data flow.
- Inputs: Accepts: rows = []
- Output: Returns a module-specific value based on current parameters and internal logic.
- Side Effects: No direct external side effects detected; behavior appears computation/render focused.
- Key Dependencies: ../models/reportStatusModel
- Usage Scope: Exported symbol; intended for use by other modules importing this file.

### Function: updateReportStatusInRows(rows = [], reportId, nextStatus)

- Defined At: line 6
- Specific Purpose: Applies state/data mutation logic for this feature and returns the updated value where appropriate.
- Inputs: Accepts: rows = [], reportId, nextStatus
- Output: Returns updated state/data or completion status after applying mutation logic.
- Side Effects: No direct external side effects detected; behavior appears computation/render focused.
- Key Dependencies: ../models/reportStatusModel
- Usage Scope: Exported symbol; intended for use by other modules importing this file.

### Function: validateReportStatusChange({ currentStatus, nextStatus, adminNotes })

- Defined At: line 13
- Specific Purpose: Applies controller-level rule validation to allow, deny, or constrain transitions based on business conditions.
- Inputs: Accepts: { currentStatus, nextStatus, adminNotes }
- Output: Returns a boolean or validation result object indicating whether constraints pass.
- Side Effects: No direct external side effects detected; behavior appears computation/render focused.
- Key Dependencies: ../models/reportStatusModel
- Usage Scope: Exported symbol; intended for use by other modules importing this file.

### Function: createReportTimelineEntry({ nextStatus, adminNotes, actor = 'Admin' })

- Defined At: line 37
- Specific Purpose: Constructs a new structured value/object used by downstream state, rendering, or persistence logic.
- Inputs: Accepts: { nextStatus, adminNotes, actor = 'Admin' }
- Output: Returns a newly constructed/normalized data structure for downstream use.
- Side Effects: Creates timestamped metadata for logs/events.
- Key Dependencies: ../models/reportStatusModel
- Usage Scope: Exported symbol; intended for use by other modules importing this file.

## File: src/controllers/userReportsController.js

- Purpose: Controller layer module that orchestrates feature rules, state transitions, and view-model logic.
- Export Surface: Exports: ALL_URGENCY_FILTER, buildUserReportRows, buildVisiblePages, filterUserReportsByCategory, filterUserReportsByUrgency, paginateReports, sortReportsByLatest
- Imports: No explicit imports detected.
- Functions Declared: 7

### Function: formatReportDate(value)

- Defined At: line 2
- Specific Purpose: Implements file-specific feature logic that supports this module's behavior and data flow.
- Inputs: Accepts: value
- Output: Returns a newly constructed/normalized data structure for downstream use.
- Side Effects: Creates timestamped metadata for logs/events.
- Key Dependencies: This function primarily relies on in-file logic and standard language/runtime features.
- Usage Scope: Internal helper; intended to be used only within this module.

### Function: buildUserReportRows({ userReports = [], users = [], agencies = [] })

- Defined At: line 10
- Specific Purpose: Builds the next controller state payload used by UI/page layers after an interaction, transition, or domain event.
- Inputs: Accepts: { userReports = [], users = [], agencies = [] }
- Output: Returns a newly constructed/normalized data structure for downstream use.
- Side Effects: Creates timestamped metadata for logs/events.
- Key Dependencies: This function primarily relies on in-file logic and standard language/runtime features.
- Usage Scope: Exported symbol; intended for use by other modules importing this file.

### Function: sortReportsByLatest(rows = [])

- Defined At: line 48
- Specific Purpose: Derives controller-ready collections by filtering, sorting, or slicing data for presentation and interaction flows.
- Inputs: Accepts: rows = []
- Output: Returns a module-specific value based on current parameters and internal logic.
- Side Effects: No direct external side effects detected; behavior appears computation/render focused.
- Key Dependencies: This function primarily relies on in-file logic and standard language/runtime features.
- Usage Scope: Exported symbol; intended for use by other modules importing this file.

### Function: filterUserReportsByCategory({
  reports = [],
  selectedCategoryId,
  hasAllAccess = false,
  allCategoryFilterId,
})

- Defined At: line 52
- Specific Purpose: Derives controller-ready collections by filtering, sorting, or slicing data for presentation and interaction flows.
- Inputs: Accepts: {
  reports = [], selectedCategoryId, hasAllAccess = false, allCategoryFilterId, }
- Output: Returns a module-specific value based on current parameters and internal logic.
- Side Effects: No direct external side effects detected; behavior appears computation/render focused.
- Key Dependencies: This function primarily relies on in-file logic and standard language/runtime features.
- Usage Scope: Exported symbol; intended for use by other modules importing this file.

### Function: filterUserReportsByUrgency({
  reports = [],
  selectedUrgency = ALL_URGENCY_FILTER,
  allUrgencyFilter = ALL_URGENCY_FILTER,
})

- Defined At: line 69
- Specific Purpose: Derives controller-ready collections by filtering, sorting, or slicing data for presentation and interaction flows.
- Inputs: Accepts: {
  reports = [], selectedUrgency = ALL_URGENCY_FILTER, allUrgencyFilter = ALL_URGENCY_FILTER, }
- Output: Returns a module-specific value based on current parameters and internal logic.
- Side Effects: No direct external side effects detected; behavior appears computation/render focused.
- Key Dependencies: This function primarily relies on in-file logic and standard language/runtime features.
- Usage Scope: Exported symbol; intended for use by other modules importing this file.

### Function: buildVisiblePages({ currentPage, totalPages })

- Defined At: line 83
- Specific Purpose: Builds the next controller state payload used by UI/page layers after an interaction, transition, or domain event.
- Inputs: Accepts: { currentPage, totalPages }
- Output: Returns a newly constructed/normalized data structure for downstream use.
- Side Effects: No direct external side effects detected; behavior appears computation/render focused.
- Key Dependencies: This function primarily relies on in-file logic and standard language/runtime features.
- Usage Scope: Exported symbol; intended for use by other modules importing this file.

### Function: paginateReports({ rows = [], currentPage = 1, pageSize = 6 })

- Defined At: line 99
- Specific Purpose: Derives controller-ready collections by filtering, sorting, or slicing data for presentation and interaction flows.
- Inputs: Accepts: { rows = [], currentPage = 1, pageSize = 6 }
- Output: Returns a module-specific value based on current parameters and internal logic.
- Side Effects: No direct external side effects detected; behavior appears computation/render focused.
- Key Dependencies: This function primarily relies on in-file logic and standard language/runtime features.
- Usage Scope: Exported symbol; intended for use by other modules importing this file.

