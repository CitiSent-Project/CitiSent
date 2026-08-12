# Src Hooks Reference

Scope: files grouped under src-hooks for CitiSent-Website.

## Manual Sync Notes (2026-03-29)

- src/hooks/__tests__/useAppStateOrchestrator.integration.test.jsx now includes async test hydration stabilization:
  - flushMicrotasks helper
  - async beforeEach setup wrapped in act
- This reduces React act warning noise while preserving integration coverage behavior.
- Existing generated function counts below may lag until the next full docs generation run.

## File: src/hooks/__tests__/useAppStateOrchestrator.integration.test.jsx

- Purpose: Automated test module that validates feature behavior and prevents regressions.
- Export Surface: No explicit exports (or export detection not applicable).
- Imports: react, react-dom/client, vitest, ../useAppStateOrchestrator, ../../models/data, ../../models/pageModel, ../../services/api/auth/authApiService, ../../services/api/admin/activityLogApiService, ../../services/api/admin/departmentsApiService, ../../services/api/admin/notificationsApiService, ../../services/api/admin/officeAdminsApiService, ../../services/api/admin/transferRequestsApiService
- Functions Declared: 2

### Function: schemaValue(payload, schemaVersion = 1)

- Defined At: line 46
- Specific Purpose: Implements file-specific feature logic that supports this module's behavior and data flow.
- Inputs: Accepts: payload, schemaVersion = 1
- Output: Returns a module-specific value based on current parameters and internal logic.
- Side Effects: Reads/writes browser storage.
- Key Dependencies: react, react-dom/client, vitest, ../useAppStateOrchestrator, ../../models/data
- Usage Scope: Internal helper; intended to be used only within this module.

### Function: HookHarness()

- Defined At: line 52
- Specific Purpose: Implements file-specific feature logic that supports this module's behavior and data flow.
- Inputs: No explicit parameters; relies on closure/module context and imported dependencies.
- Output: Returns a module-specific value based on current parameters and internal logic.
- Side Effects: Reads/writes browser storage.
- Key Dependencies: react, react-dom/client, vitest, ../useAppStateOrchestrator, ../../models/data
- Usage Scope: Internal helper; intended to be used only within this module.

## File: src/hooks/__tests__/useAuthSession.test.js

- Purpose: Automated test module that validates feature behavior and prevents regressions.
- Export Surface: No explicit exports (or export detection not applicable).
- Imports: vitest, ../useAuthSession, ../../services/api/auth/authApiService
- Functions Declared: 1

### Function: buildDependencies()

- Defined At: line 17
- Specific Purpose: Constructs a new structured value/object used by downstream state, rendering, or persistence logic.
- Inputs: No explicit parameters; relies on closure/module context and imported dependencies.
- Output: Returns a newly constructed/normalized data structure for downstream use.
- Side Effects: Publishes user-facing toast/notification feedback. Drives navigation or view transition state.
- Key Dependencies: vitest, ../useAuthSession, ../../services/api/auth/authApiService
- Usage Scope: Internal helper; intended to be used only within this module.

## File: src/hooks/__tests__/useNotificationsState.test.js

- Purpose: Automated test module that validates feature behavior and prevents regressions.
- Export Surface: No explicit exports (or export detection not applicable).
- Imports: vitest, ../useNotificationsState
- Functions: None explicitly declared in this module.

## File: src/hooks/__tests__/usePageLoadingState.test.js

- Purpose: Automated test module that validates feature behavior and prevents regressions.
- Export Surface: No explicit exports (or export detection not applicable).
- Imports: vitest, ../../models/pageModel, ../usePageLoadingState
- Functions: None explicitly declared in this module.

## File: src/hooks/__tests__/usePersistToStorage.test.js

- Purpose: Automated test module that validates feature behavior and prevents regressions.
- Export Surface: No explicit exports (or export detection not applicable).
- Imports: vitest, ../usePersistToStorage
- Functions: None explicitly declared in this module.

## File: src/hooks/useAdminManagementState.js

- Purpose: Custom React hook module that encapsulates reusable state and side-effect behavior.
- Export Surface: Exports: useAdminManagementState
- Imports: react
- Functions Declared: 9

### Function: useAdminManagementState({

  officeAdmins,
  pendingRequests,
  notificationsByAdmin,
  departmentOptions,
  onAssignOfficeDepartment,
  onApproveTransfer,
  onRejectTransfer,
  notifyError,
})

- Defined At: line 8
- Specific Purpose: Encapsulates reusable React state orchestration and side effects for this feature, returning state plus action handlers to consuming components.
- Inputs: Accepts: {
  officeAdmins, pendingRequests, notificationsByAdmin, departmentOptions, onAssignOfficeDepartment, onApproveTransfer, onRejectTransfer, notifyError, }
- Output: Returns a hook API object/tuple containing current state and callable handlers.
- Side Effects: Publishes user-facing toast/notification feedback.
- Key Dependencies: react
- Usage Scope: Exported symbol; intended for use by other modules importing this file.

### Function: getSelectedDepartmentId(admin)

- Defined At: line 58
- Specific Purpose: Retrieves, selects, or computes feature data required for the next processing step.
- Inputs: Accepts: admin
- Output: Returns retrieved or derived data (object, array, or primitive) consumed by callers.
- Side Effects: Updates React/application state via setter calls. Publishes user-facing toast/notification feedback.
- Key Dependencies: react
- Usage Scope: Internal helper; intended to be used only within this module.

### Function: handleDraftDepartmentChange(adminId, departmentId)

- Defined At: line 62
- Specific Purpose: Handles an interaction/event branch and coordinates the feature-specific logic path for this module.
- Inputs: Accepts: adminId, departmentId
- Output: Returns a module-specific value based on current parameters and internal logic.
- Side Effects: Updates React/application state via setter calls. Publishes user-facing toast/notification feedback.
- Key Dependencies: react
- Usage Scope: Internal helper; intended to be used only within this module.

### Function: handleSaveAssignment(admin)

- Defined At: line 69
- Specific Purpose: Handles an interaction/event branch and coordinates the feature-specific logic path for this module.
- Inputs: Accepts: admin
- Output: Returns a module-specific value based on current parameters and internal logic.
- Side Effects: Updates React/application state via setter calls. Publishes user-facing toast/notification feedback.
- Key Dependencies: react
- Usage Scope: Internal helper; intended to be used only within this module.

### Function: openApprovalModal(request)

- Defined At: line 92
- Specific Purpose: Implements file-specific feature logic that supports this module's behavior and data flow.
- Inputs: Accepts: request
- Output: Primarily performs side-effect-driven logic; return value is not a primary integration contract.
- Side Effects: Triggers network/API I/O. Updates React/application state via setter calls.
- Key Dependencies: react
- Usage Scope: Internal helper; intended to be used only within this module.

### Function: openRejectionModal(request)

- Defined At: line 104
- Specific Purpose: Implements file-specific feature logic that supports this module's behavior and data flow.
- Inputs: Accepts: request
- Output: Primarily performs side-effect-driven logic; return value is not a primary integration contract.
- Side Effects: Triggers network/API I/O. Updates React/application state via setter calls.
- Key Dependencies: react
- Usage Scope: Internal helper; intended to be used only within this module.

### Function: closeReviewModal()

- Defined At: line 116
- Specific Purpose: Implements file-specific feature logic that supports this module's behavior and data flow.
- Inputs: No explicit parameters; relies on closure/module context and imported dependencies.
- Output: Returns a module-specific value based on current parameters and internal logic.
- Side Effects: Triggers network/API I/O. Updates React/application state via setter calls. Publishes user-facing toast/notification feedback.
- Key Dependencies: react
- Usage Scope: Internal helper; intended to be used only within this module.

### Function: handleReviewNotesChange(value)

- Defined At: line 122
- Specific Purpose: Handles an interaction/event branch and coordinates the feature-specific logic path for this module.
- Inputs: Accepts: value
- Output: Returns a module-specific value based on current parameters and internal logic.
- Side Effects: Updates React/application state via setter calls. Publishes user-facing toast/notification feedback.
- Key Dependencies: react
- Usage Scope: Internal helper; intended to be used only within this module.

### Function: submitReviewModal(event)

- Defined At: line 129
- Specific Purpose: Implements file-specific feature logic that supports this module's behavior and data flow.
- Inputs: Accepts: event
- Output: Returns a module-specific value based on current parameters and internal logic.
- Side Effects: Triggers network/API I/O. Updates React/application state via setter calls. Publishes user-facing toast/notification feedback.
- Key Dependencies: react
- Usage Scope: Internal helper; intended to be used only within this module.

## File: src/hooks/useAppStateOrchestrator.js

- Purpose: Custom React hook module that encapsulates reusable state and side-effect behavior.
- Export Surface: Exports: useAppStateOrchestrator
- Imports: react, ../components/ui/toastHelpers, ../services/storageService, ./usePersistToStorage, ./usePageLoadingState, ../controllers/appearanceController, ../controllers/activityController, ./useAuthSession
- Functions Declared: 23

### Function: loadSchemaBackedValue(key, fallbackValue, overrides = {})

- Defined At: line 56
- Specific Purpose: Implements file-specific feature logic that supports this module's behavior and data flow.
- Inputs: Accepts: key, fallbackValue, overrides = {}
- Output: Returns a module-specific value based on current parameters and internal logic.
- Side Effects: Reads/writes browser storage.
- Key Dependencies: react, ../components/ui/toastHelpers, ../services/storageService, ./usePersistToStorage, ./usePageLoadingState
- Usage Scope: Internal helper; intended to be used only within this module.

### Function: getSchemaPersistenceOptions(storageKey)

- Defined At: line 66
- Specific Purpose: Retrieves, selects, or computes feature data required for the next processing step.
- Inputs: Accepts: storageKey
- Output: Returns retrieved or derived data (object, array, or primitive) consumed by callers.
- Side Effects: No direct external side effects detected; behavior appears computation/render focused.
- Key Dependencies: react, ../components/ui/toastHelpers, ../services/storageService, ./usePersistToStorage, ./usePageLoadingState
- Usage Scope: Internal helper; intended to be used only within this module.

### Function: findDepartmentOption(value)

- Defined At: line 73
- Specific Purpose: Retrieves, selects, or computes feature data required for the next processing step.
- Inputs: Accepts: value
- Output: Returns retrieved or derived data (object, array, or primitive) consumed by callers.
- Side Effects: Drives navigation or view transition state.
- Key Dependencies: react, ../components/ui/toastHelpers, ../services/storageService, ./usePersistToStorage, ./usePageLoadingState
- Usage Scope: Internal helper; intended to be used only within this module.

### Function: useAppStateOrchestrator()

- Defined At: line 81
- Specific Purpose: Encapsulates reusable React state orchestration and side effects for this feature, returning state plus action handlers to consuming components.
- Inputs: No explicit parameters; relies on closure/module context and imported dependencies.
- Output: Returns a hook API object/tuple containing current state and callable handlers.
- Side Effects: Drives navigation or view transition state.
- Key Dependencies: react, ../components/ui/toastHelpers, ../services/storageService, ./usePersistToStorage, ./usePageLoadingState
- Usage Scope: Exported symbol; intended for use by other modules importing this file.

### Function: applyAppearance(systemPrefersDark)

- Defined At: line 215
- Specific Purpose: Implements file-specific feature logic that supports this module's behavior and data flow.
- Inputs: Accepts: systemPrefersDark
- Output: Primarily performs side-effect-driven logic; return value is not a primary integration contract.
- Side Effects: No direct external side effects detected; behavior appears computation/render focused.
- Key Dependencies: react, ../components/ui/toastHelpers, ../services/storageService, ./usePersistToStorage, ./usePageLoadingState
- Usage Scope: Internal helper; intended to be used only within this module.

### Function: handleSystemThemeChange(event)

- Defined At: line 235
- Specific Purpose: Handles an interaction/event branch and coordinates the feature-specific logic path for this module.
- Inputs: Accepts: event
- Output: Returns a module-specific value based on current parameters and internal logic.
- Side Effects: Updates React/application state via setter calls.
- Key Dependencies: react, ../components/ui/toastHelpers, ../services/storageService, ./usePersistToStorage, ./usePageLoadingState
- Usage Scope: Internal helper; intended to be used only within this module.

### Function: addActivity(action, detail)

- Defined At: line 252
- Specific Purpose: Implements file-specific feature logic that supports this module's behavior and data flow.
- Inputs: Accepts: action, detail
- Output: Returns a module-specific value based on current parameters and internal logic.
- Side Effects: Triggers network/API I/O. Updates React/application state via setter calls.
- Key Dependencies: react, ../components/ui/toastHelpers, ../services/storageService, ./usePersistToStorage, ./usePageLoadingState
- Usage Scope: Internal helper; intended to be used only within this module.

### Function: refreshProfileForAccessCheck()

- Defined At: line 258
- Specific Purpose: Implements file-specific feature logic that supports this module's behavior and data flow.
- Inputs: No explicit parameters; relies on closure/module context and imported dependencies.
- Output: Returns a module-specific value based on current parameters and internal logic.
- Side Effects: Triggers network/API I/O. Updates React/application state via setter calls.
- Key Dependencies: react, ../components/ui/toastHelpers, ../services/storageService, ./usePersistToStorage, ./usePageLoadingState
- Usage Scope: Internal helper; intended to be used only within this module.

### Function: hydrateSession()

- Defined At: line 304
- Specific Purpose: Implements file-specific feature logic that supports this module's behavior and data flow.
- Inputs: No explicit parameters; relies on closure/module context and imported dependencies.
- Output: Returns a module-specific value based on current parameters and internal logic.
- Side Effects: Triggers network/API I/O. Updates React/application state via setter calls. Publishes user-facing toast/notification feedback.
- Key Dependencies: react, ../components/ui/toastHelpers, ../services/storageService, ./usePersistToStorage, ./usePageLoadingState
- Usage Scope: Internal helper; intended to be used only within this module.

### Function: handleProfileUpdate(updates)

- Defined At: line 394
- Specific Purpose: Handles an interaction/event branch and coordinates the feature-specific logic path for this module.
- Inputs: Accepts: updates
- Output: Returns a module-specific value based on current parameters and internal logic.
- Side Effects: Triggers network/API I/O. Publishes user-facing toast/notification feedback. Creates timestamped metadata for logs/events.
- Key Dependencies: react, ../components/ui/toastHelpers, ../services/storageService, ./usePersistToStorage, ./usePageLoadingState
- Usage Scope: Internal helper; intended to be used only within this module.

### Function: handlePreferenceUpdate(updates)

- Defined At: line 443
- Specific Purpose: Handles an interaction/event branch and coordinates the feature-specific logic path for this module.
- Inputs: Accepts: updates
- Output: Returns a module-specific value based on current parameters and internal logic.
- Side Effects: Updates React/application state via setter calls. Publishes user-facing toast/notification feedback. Creates timestamped metadata for logs/events.
- Key Dependencies: react, ../components/ui/toastHelpers, ../services/storageService, ./usePersistToStorage, ./usePageLoadingState
- Usage Scope: Internal helper; intended to be used only within this module.

### Function: handleNavigate(nextPage)

- Defined At: line 472
- Specific Purpose: Handles an interaction/event branch and coordinates the feature-specific logic path for this module.
- Inputs: Accepts: nextPage
- Output: Primarily performs side-effect-driven logic; return value is not a primary integration contract.
- Side Effects: Publishes user-facing toast/notification feedback. Drives navigation or view transition state.
- Key Dependencies: react, ../components/ui/toastHelpers, ../services/storageService, ./usePersistToStorage, ./usePageLoadingState
- Usage Scope: Internal helper; intended to be used only within this module.

### Function: handleViewUserProfile(user)

- Defined At: line 504
- Specific Purpose: Handles an interaction/event branch and coordinates the feature-specific logic path for this module.
- Inputs: Accepts: user
- Output: Returns a module-specific value based on current parameters and internal logic.
- Side Effects: Updates React/application state via setter calls. Drives navigation or view transition state.
- Key Dependencies: react, ../components/ui/toastHelpers, ../services/storageService, ./usePersistToStorage, ./usePageLoadingState
- Usage Scope: Internal helper; intended to be used only within this module.

### Function: handleViewReport(report)

- Defined At: line 510
- Specific Purpose: Handles an interaction/event branch and coordinates the feature-specific logic path for this module.
- Inputs: Accepts: report
- Output: Returns a module-specific value based on current parameters and internal logic.
- Side Effects: Triggers network/API I/O. Updates React/application state via setter calls. Publishes user-facing toast/notification feedback. Drives navigation or view transition state.
- Key Dependencies: react, ../components/ui/toastHelpers, ../services/storageService, ./usePersistToStorage, ./usePageLoadingState
- Usage Scope: Internal helper; intended to be used only within this module.

### Function: handleSubmitTransferRequest({

    requestedDepartmentId,
    requestedDepartmentLabel,
    reason,
  })

- Defined At: line 517
- Specific Purpose: Handles an interaction/event branch and coordinates the feature-specific logic path for this module.
- Inputs: Accepts: {
    requestedDepartmentId, requestedDepartmentLabel, reason, }
- Output: Returns a module-specific value based on current parameters and internal logic.
- Side Effects: Triggers network/API I/O. Updates React/application state via setter calls. Publishes user-facing toast/notification feedback. Drives navigation or view transition state.
- Key Dependencies: react, ../components/ui/toastHelpers, ../services/storageService, ./usePersistToStorage, ./usePageLoadingState
- Usage Scope: Internal helper; intended to be used only within this module.

### Function: handleAssignOfficeDepartment({ adminId, departmentId, departmentLabel })

- Defined At: line 584
- Specific Purpose: Handles an interaction/event branch and coordinates the feature-specific logic path for this module.
- Inputs: Accepts: { adminId, departmentId, departmentLabel }
- Output: Returns a module-specific value based on current parameters and internal logic.
- Side Effects: Triggers network/API I/O. Publishes user-facing toast/notification feedback.
- Key Dependencies: react, ../components/ui/toastHelpers, ../services/storageService, ./usePersistToStorage, ./usePageLoadingState
- Usage Scope: Internal helper; intended to be used only within this module.

### Function: handleApproveTransfer({ requestId, reviewNotes })

- Defined At: line 639
- Specific Purpose: Handles an interaction/event branch and coordinates the feature-specific logic path for this module.
- Inputs: Accepts: { requestId, reviewNotes }
- Output: Returns a module-specific value based on current parameters and internal logic.
- Side Effects: Triggers network/API I/O. Publishes user-facing toast/notification feedback.
- Key Dependencies: react, ../components/ui/toastHelpers, ../services/storageService, ./usePersistToStorage, ./usePageLoadingState
- Usage Scope: Internal helper; intended to be used only within this module.

### Function: handleRejectTransfer({ requestId, reviewNotes })

- Defined At: line 725
- Specific Purpose: Handles an interaction/event branch and coordinates the feature-specific logic path for this module.
- Inputs: Accepts: { requestId, reviewNotes }
- Output: Returns a module-specific value based on current parameters and internal logic.
- Side Effects: Triggers network/API I/O. Publishes user-facing toast/notification feedback.
- Key Dependencies: react, ../components/ui/toastHelpers, ../services/storageService, ./usePersistToStorage, ./usePageLoadingState
- Usage Scope: Internal helper; intended to be used only within this module.

### Function: handleBackToUsers()

- Defined At: line 787
- Specific Purpose: Handles an interaction/event branch and coordinates the feature-specific logic path for this module.
- Inputs: No explicit parameters; relies on closure/module context and imported dependencies.
- Output: Returns a module-specific value based on current parameters and internal logic.
- Side Effects: Updates React/application state via setter calls. Publishes user-facing toast/notification feedback. Drives navigation or view transition state. Creates timestamped metadata for logs/events.
- Key Dependencies: react, ../components/ui/toastHelpers, ../services/storageService, ./usePersistToStorage, ./usePageLoadingState
- Usage Scope: Internal helper; intended to be used only within this module.

### Function: handleBackToReports()

- Defined At: line 791
- Specific Purpose: Handles an interaction/event branch and coordinates the feature-specific logic path for this module.
- Inputs: No explicit parameters; relies on closure/module context and imported dependencies.
- Output: Returns a module-specific value based on current parameters and internal logic.
- Side Effects: Triggers network/API I/O. Updates React/application state via setter calls. Publishes user-facing toast/notification feedback. Drives navigation or view transition state. Creates timestamped metadata for logs/events.
- Key Dependencies: react, ../components/ui/toastHelpers, ../services/storageService, ./usePersistToStorage, ./usePageLoadingState
- Usage Scope: Internal helper; intended to be used only within this module.

### Function: handleRequestLogout()

- Defined At: line 795
- Specific Purpose: Handles an interaction/event branch and coordinates the feature-specific logic path for this module.
- Inputs: No explicit parameters; relies on closure/module context and imported dependencies.
- Output: Returns a module-specific value based on current parameters and internal logic.
- Side Effects: Triggers network/API I/O. Updates React/application state via setter calls. Publishes user-facing toast/notification feedback. Drives navigation or view transition state. Creates timestamped metadata for logs/events.
- Key Dependencies: react, ../components/ui/toastHelpers, ../services/storageService, ./usePersistToStorage, ./usePageLoadingState
- Usage Scope: Internal helper; intended to be used only within this module.

### Function: handleCancelLogout()

- Defined At: line 799
- Specific Purpose: Handles an interaction/event branch and coordinates the feature-specific logic path for this module.
- Inputs: No explicit parameters; relies on closure/module context and imported dependencies.
- Output: Returns a module-specific value based on current parameters and internal logic.
- Side Effects: Triggers network/API I/O. Updates React/application state via setter calls. Publishes user-facing toast/notification feedback. Drives navigation or view transition state. Creates timestamped metadata for logs/events.
- Key Dependencies: react, ../components/ui/toastHelpers, ../services/storageService, ./usePersistToStorage, ./usePageLoadingState
- Usage Scope: Internal helper; intended to be used only within this module.

### Function: handleReportStatusUpdate(reportId, newStatus)

- Defined At: line 803
- Specific Purpose: Handles an interaction/event branch and coordinates the feature-specific logic path for this module.
- Inputs: Accepts: reportId, newStatus
- Output: Returns a module-specific value based on current parameters and internal logic.
- Side Effects: Triggers network/API I/O. Updates React/application state via setter calls. Publishes user-facing toast/notification feedback. Drives navigation or view transition state. Creates timestamped metadata for logs/events.
- Key Dependencies: react, ../components/ui/toastHelpers, ../services/storageService, ./usePersistToStorage, ./usePageLoadingState
- Usage Scope: Internal helper; intended to be used only within this module.

## File: src/hooks/useAuthSession.js

- Purpose: Custom React hook module that encapsulates reusable state and side-effect behavior.
- Export Surface: Exports: useAuthSession
- Imports: ../services/api/auth/authApiService, ../services/api/admin/accountsApiMappers, ../models/data, ../models/pageModel
- Functions Declared: 6

### Function: normalizeLoginIdentifier(payload = {})

- Defined At: line 10
- Specific Purpose: Implements file-specific feature logic that supports this module's behavior and data flow.
- Inputs: Accepts: payload = {}
- Output: Returns a newly constructed/normalized data structure for downstream use.
- Side Effects: Drives navigation or view transition state.
- Key Dependencies: ../services/api/auth/authApiService, ../services/api/admin/accountsApiMappers, ../models/data, ../models/pageModel
- Usage Scope: Internal helper; intended to be used only within this module.

### Function: buildRegistrationUsername(payload = {})

- Defined At: line 20
- Specific Purpose: Constructs a new structured value/object used by downstream state, rendering, or persistence logic.
- Inputs: Accepts: payload = {}
- Output: Returns a newly constructed/normalized data structure for downstream use.
- Side Effects: No direct external side effects detected; behavior appears computation/render focused.
- Key Dependencies: ../services/api/auth/authApiService, ../services/api/admin/accountsApiMappers, ../models/data, ../models/pageModel
- Usage Scope: Internal helper; intended to be used only within this module.

### Function: useAuthSession({

  setAccessToken,
  setProfile,
  setAdminAccounts,
  setTransferRequests,
  setSelectedReport,
  setSelectedUserProfile,
  setPreferences,
  setActivePage,
  setIsAuthenticated,
  setAuthPage,
  setRememberedEmail,
  addActivity,
  notifySuccess,
  notifyError,
})

- Defined At: line 44
- Specific Purpose: Encapsulates reusable React state orchestration and side effects for this feature, returning state plus action handlers to consuming components.
- Inputs: Accepts: {
  setAccessToken, setProfile, setAdminAccounts, setTransferRequests, setSelectedReport, setSelectedUserProfile, setPreferences, setActivePage, setIsAuthenticated, setAuthPage, setRememberedEmail, addActivity, notifySuccess, notifyError, }
- Output: Returns a hook API object/tuple containing current state and callable handlers.
- Side Effects: Triggers network/API I/O. Publishes user-facing toast/notification feedback. Drives navigation or view transition state.
- Key Dependencies: ../services/api/auth/authApiService, ../services/api/admin/accountsApiMappers, ../models/data, ../models/pageModel
- Usage Scope: Exported symbol; intended for use by other modules importing this file.

### Function: handleRegister(payload)

- Defined At: line 61
- Specific Purpose: Handles an interaction/event branch and coordinates the feature-specific logic path for this module.
- Inputs: Accepts: payload
- Output: Primarily performs side-effect-driven logic; return value is not a primary integration contract.
- Side Effects: Triggers network/API I/O. Updates React/application state via setter calls. Publishes user-facing toast/notification feedback.
- Key Dependencies: ../services/api/auth/authApiService, ../services/api/admin/accountsApiMappers, ../models/data, ../models/pageModel
- Usage Scope: Internal helper; intended to be used only within this module.

### Function: handleLogin(payload)

- Defined At: line 89
- Specific Purpose: Handles an interaction/event branch and coordinates the feature-specific logic path for this module.
- Inputs: Accepts: payload
- Output: Primarily performs side-effect-driven logic; return value is not a primary integration contract.
- Side Effects: Triggers network/API I/O.
- Key Dependencies: ../services/api/auth/authApiService, ../services/api/admin/accountsApiMappers, ../models/data, ../models/pageModel
- Usage Scope: Internal helper; intended to be used only within this module.

### Function: handleLogout()

- Defined At: line 133
- Specific Purpose: Handles an interaction/event branch and coordinates the feature-specific logic path for this module.
- Inputs: No explicit parameters; relies on closure/module context and imported dependencies.
- Output: Returns a module-specific value based on current parameters and internal logic.
- Side Effects: Updates React/application state via setter calls. Publishes user-facing toast/notification feedback. Drives navigation or view transition state.
- Key Dependencies: ../services/api/auth/authApiService, ../services/api/admin/accountsApiMappers, ../models/data, ../models/pageModel
- Usage Scope: Internal helper; intended to be used only within this module.

## File: src/hooks/useModalAccessibility.js

- Purpose: Custom React hook module that encapsulates reusable state and side-effect behavior.
- Export Surface: Exports: useModalAccessibility
- Imports: react
- Functions Declared: 2

### Function: useModalAccessibility({ isOpen, onClose, containerRef })

- Defined At: line 11
- Specific Purpose: Encapsulates reusable React state orchestration and side effects for this feature, returning state plus action handlers to consuming components.
- Inputs: Accepts: { isOpen, onClose, containerRef }
- Output: Returns a hook API object/tuple containing current state and callable handlers.
- Side Effects: No direct external side effects detected; behavior appears computation/render focused.
- Key Dependencies: react
- Usage Scope: Exported symbol; intended for use by other modules importing this file.

### Function: handleKeyDown(event)

- Defined At: line 28
- Specific Purpose: Handles an interaction/event branch and coordinates the feature-specific logic path for this module.
- Inputs: Accepts: event
- Output: Returns a module-specific value based on current parameters and internal logic.
- Side Effects: No direct external side effects detected; behavior appears computation/render focused.
- Key Dependencies: react
- Usage Scope: Internal helper; intended to be used only within this module.

## File: src/hooks/useNotificationsState.js

- Purpose: Custom React hook module that encapsulates reusable state and side-effect behavior.
- Export Surface: Exports: useNotificationsState
- Imports: No explicit imports detected.
- Functions Declared: 3

### Function: useNotificationsState({

  notificationsByAdmin,
  activeAdminId,
  setNotificationsByAdmin,
  addActivity,
  notifySuccess,
})

- Defined At: line 7
- Specific Purpose: Encapsulates reusable React state orchestration and side effects for this feature, returning state plus action handlers to consuming components.
- Inputs: Accepts: {
  notificationsByAdmin, activeAdminId, setNotificationsByAdmin, addActivity, notifySuccess, }
- Output: Returns a hook API object/tuple containing current state and callable handlers.
- Side Effects: Updates React/application state via setter calls. Publishes user-facing toast/notification feedback.
- Key Dependencies: This function primarily relies on in-file logic and standard language/runtime features.
- Usage Scope: Exported symbol; intended for use by other modules importing this file.

### Function: handleToggleNotification(notificationId)

- Defined At: line 16
- Specific Purpose: Handles an interaction/event branch and coordinates the feature-specific logic path for this module.
- Inputs: Accepts: notificationId
- Output: Primarily performs side-effect-driven logic; return value is not a primary integration contract.
- Side Effects: Updates React/application state via setter calls. Publishes user-facing toast/notification feedback.
- Key Dependencies: This function primarily relies on in-file logic and standard language/runtime features.
- Usage Scope: Internal helper; intended to be used only within this module.

### Function: handleClearNotifications()

- Defined At: line 26
- Specific Purpose: Handles an interaction/event branch and coordinates the feature-specific logic path for this module.
- Inputs: No explicit parameters; relies on closure/module context and imported dependencies.
- Output: Returns a module-specific value based on current parameters and internal logic.
- Side Effects: Updates React/application state via setter calls. Publishes user-facing toast/notification feedback.
- Key Dependencies: This function primarily relies on in-file logic and standard language/runtime features.
- Usage Scope: Internal helper; intended to be used only within this module.

## File: src/hooks/usePageLoadingState.js

- Purpose: Custom React hook module that encapsulates reusable state and side-effect behavior.
- Export Surface: Exports: usePageLoadingState
- Imports: react
- Functions Declared: 1

### Function: usePageLoadingState({

  activePage,
  isAuthenticated,
  isPageLoading,
  setIsPageLoading,
  delayMs = 420,
})

- Defined At: line 2
- Specific Purpose: Encapsulates reusable React state orchestration and side effects for this feature, returning state plus action handlers to consuming components.
- Inputs: Accepts: {
  activePage, isAuthenticated, isPageLoading, setIsPageLoading, delayMs = 420, }
- Output: Returns a hook API object/tuple containing current state and callable handlers.
- Side Effects: Updates React/application state via setter calls.
- Key Dependencies: react
- Usage Scope: Exported symbol; intended for use by other modules importing this file.

## File: src/hooks/usePersistToStorage.js

- Purpose: Custom React hook module that encapsulates reusable state and side-effect behavior.
- Export Surface: Exports: usePersistToStorage
- Imports: react, ../services/storageService
- Functions Declared: 1

### Function: usePersistToStorage(key, value, options = {})

- Defined At: line 3
- Specific Purpose: Encapsulates reusable React state orchestration and side effects for this feature, returning state plus action handlers to consuming components.
- Inputs: Accepts: key, value, options = {}
- Output: Returns a hook API object/tuple containing current state and callable handlers.
- Side Effects: Reads/writes browser storage.
- Key Dependencies: react, ../services/storageService
- Usage Scope: Exported symbol; intended for use by other modules importing this file.

## File: src/hooks/useReportPaginationState.js

- Purpose: Custom React hook module that encapsulates reusable state and side-effect behavior.
- Export Surface: Exports: useReportPaginationState
- Imports: react, ../controllers/userReportsController
- Functions Declared: 5

### Function: useReportPaginationState({ rows = [], pageSize = 6 })

- Defined At: line 3
- Specific Purpose: Encapsulates reusable React state orchestration and side effects for this feature, returning state plus action handlers to consuming components.
- Inputs: Accepts: { rows = [], pageSize = 6 }
- Output: Returns a hook API object/tuple containing current state and callable handlers.
- Side Effects: Updates React/application state via setter calls.
- Key Dependencies: react, ../controllers/userReportsController
- Usage Scope: Exported symbol; intended for use by other modules importing this file.

### Function: handlePageChange(page)

- Defined At: line 11
- Specific Purpose: Handles an interaction/event branch and coordinates the feature-specific logic path for this module.
- Inputs: Accepts: page
- Output: Returns a module-specific value based on current parameters and internal logic.
- Side Effects: Updates React/application state via setter calls.
- Key Dependencies: react, ../controllers/userReportsController
- Usage Scope: Internal helper; intended to be used only within this module.

### Function: handleNextPage()

- Defined At: line 15
- Specific Purpose: Handles an interaction/event branch and coordinates the feature-specific logic path for this module.
- Inputs: No explicit parameters; relies on closure/module context and imported dependencies.
- Output: Returns a module-specific value based on current parameters and internal logic.
- Side Effects: Updates React/application state via setter calls.
- Key Dependencies: react, ../controllers/userReportsController
- Usage Scope: Internal helper; intended to be used only within this module.

### Function: handlePreviousPage()

- Defined At: line 19
- Specific Purpose: Handles an interaction/event branch and coordinates the feature-specific logic path for this module.
- Inputs: No explicit parameters; relies on closure/module context and imported dependencies.
- Output: Returns a module-specific value based on current parameters and internal logic.
- Side Effects: Updates React/application state via setter calls.
- Key Dependencies: react, ../controllers/userReportsController
- Usage Scope: Internal helper; intended to be used only within this module.

### Function: resetToFirstPage()

- Defined At: line 23
- Specific Purpose: Implements file-specific feature logic that supports this module's behavior and data flow.
- Inputs: No explicit parameters; relies on closure/module context and imported dependencies.
- Output: Returns a module-specific value based on current parameters and internal logic.
- Side Effects: Updates React/application state via setter calls.
- Key Dependencies: react, ../controllers/userReportsController
- Usage Scope: Internal helper; intended to be used only within this module.
