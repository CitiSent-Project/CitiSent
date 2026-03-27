# Src Models and Data Reference

Scope: files grouped under src-models for CitiSent-Website.

## File: src/models/contracts.js

- Purpose: Model/domain module containing data contracts, constants, or normalization rules.
- Export Surface: Exports: MODEL_CONTRACTS_VERSION
- Imports: No explicit imports detected.
- Functions: None explicitly declared in this module.

## File: src/models/data/admin/adminPortalData.js

- Purpose: Model/domain module containing data contracts, constants, or normalization rules.
- Export Surface: Exports: ADMIN_STORAGE_KEYS, buildDefaultNotificationsByAdmin, createActivityEntry, DEFAULT_ADMIN_ACCOUNTS, DEFAULT_ADMIN_PROFILE, DEFAULT_NOTIFICATIONS, DEFAULT_PREFERENCES, DEFAULT_TRANSFER_REQUESTS, DEPARTMENT_OPTIONS, formatDateTime, getDepartmentLabelById
- Imports: No explicit imports detected.
- Functions Declared: 4

### Function: getDepartmentLabelById(departmentId)

- Defined At: line 27
- Specific Purpose: Resolves domain constants or computed model values required by controllers and services.
- Inputs: Accepts: departmentId
- Output: Returns retrieved or derived data (object, array, or primitive) consumed by callers.
- Side Effects: No direct external side effects detected; behavior appears computation/render focused.
- Key Dependencies: This function primarily relies on in-file logic and standard language/runtime features.
- Usage Scope: Exported symbol; intended for use by other modules importing this file.

### Function: buildDefaultNotificationsByAdmin(adminAccounts = DEFAULT_ADMIN_ACCOUNTS)

- Defined At: line 89
- Specific Purpose: Constructs a new structured value/object used by downstream state, rendering, or persistence logic.
- Inputs: Accepts: adminAccounts = DEFAULT_ADMIN_ACCOUNTS
- Output: Returns a newly constructed/normalized data structure for downstream use.
- Side Effects: Creates timestamped metadata for logs/events.
- Key Dependencies: This function primarily relies on in-file logic and standard language/runtime features.
- Usage Scope: Exported symbol; intended for use by other modules importing this file.

### Function: formatDateTime(value)

- Defined At: line 99
- Specific Purpose: Implements file-specific feature logic that supports this module's behavior and data flow.
- Inputs: Accepts: value
- Output: Returns a newly constructed/normalized data structure for downstream use.
- Side Effects: Creates timestamped metadata for logs/events.
- Key Dependencies: This function primarily relies on in-file logic and standard language/runtime features.
- Usage Scope: Exported symbol; intended for use by other modules importing this file.

### Function: createActivityEntry(action, detail)

- Defined At: line 113
- Specific Purpose: Constructs a new structured value/object used by downstream state, rendering, or persistence logic.
- Inputs: Accepts: action, detail
- Output: Returns a newly constructed/normalized data structure for downstream use.
- Side Effects: Creates timestamped metadata for logs/events.
- Key Dependencies: This function primarily relies on in-file logic and standard language/runtime features.
- Usage Scope: Exported symbol; intended for use by other modules importing this file.

## File: src/models/data/dashboard/dashboardData.js

- Purpose: Model/domain module containing data contracts, constants, or normalization rules.
- Export Surface: Exports: dashboardAdminRows, dashboardAdminTableColumns, dashboardNewUsersTableColumns, dashboardStatCards, reportsByCategory, reportsThisWeek
- Imports: ../reports/reportsData
- Functions: None explicitly declared in this module.

## File: src/models/data/index.js

- Purpose: Model/domain module containing data contracts, constants, or normalization rules.
- Export Surface: No explicit exports (or export detection not applicable).
- Imports: No explicit imports detected.
- Functions: None explicitly declared in this module.

## File: src/models/data/reports/reportsData.js

- Purpose: Model/domain module containing data contracts, constants, or normalization rules.
- Export Surface: Exports: allCategoryFilterId, categoryAgencyCards, reportsByCategoryData, reportsSummaryStats, reportsThisWeekData, urgencyFilterChips, urgencyLevelsData, UserReports
- Imports: No explicit imports detected.
- Functions: None explicitly declared in this module.

## File: src/models/data/users/usersData.js

- Purpose: Model/domain module containing data contracts, constants, or normalization rules.
- Export Surface: Exports: generateNextUserId, getLatestJoinedUsersRows, getLatestRegisteredUsers, Users, usersFilters, usersRows, usersStats
- Imports: No explicit imports detected.
- Functions Declared: 4

### Function: formatDate(date)

- Defined At: line 159
- Specific Purpose: Implements file-specific feature logic that supports this module's behavior and data flow.
- Inputs: Accepts: date
- Output: Returns a newly constructed/normalized data structure for downstream use.
- Side Effects: Creates timestamped metadata for logs/events.
- Key Dependencies: This function primarily relies on in-file logic and standard language/runtime features.
- Usage Scope: Internal helper; intended to be used only within this module.

### Function: generateNextUserId(existingUsers = [])

- Defined At: line 167
- Specific Purpose: Implements file-specific feature logic that supports this module's behavior and data flow.
- Inputs: Accepts: existingUsers = []
- Output: Returns a module-specific value based on current parameters and internal logic.
- Side Effects: No direct external side effects detected; behavior appears computation/render focused.
- Key Dependencies: This function primarily relies on in-file logic and standard language/runtime features.
- Usage Scope: Exported symbol; intended for use by other modules importing this file.

### Function: getLatestRegisteredUsers(users = usersRows, limit = 5)

- Defined At: line 195
- Specific Purpose: Resolves domain constants or computed model values required by controllers and services.
- Inputs: Accepts: users = usersRows, limit = 5
- Output: Returns retrieved or derived data (object, array, or primitive) consumed by callers.
- Side Effects: Creates timestamped metadata for logs/events.
- Key Dependencies: This function primarily relies on in-file logic and standard language/runtime features.
- Usage Scope: Exported symbol; intended for use by other modules importing this file.

### Function: getLatestJoinedUsersRows(users = usersRows, limit = 5)

- Defined At: line 201
- Specific Purpose: Resolves domain constants or computed model values required by controllers and services.
- Inputs: Accepts: users = usersRows, limit = 5
- Output: Returns retrieved or derived data (object, array, or primitive) consumed by callers.
- Side Effects: No direct external side effects detected; behavior appears computation/render focused.
- Key Dependencies: This function primarily relies on in-file logic and standard language/runtime features.
- Usage Scope: Exported symbol; intended for use by other modules importing this file.

## File: src/models/pageModel.js

- Purpose: Model/domain module containing data contracts, constants, or normalization rules.
- Export Surface: Exports: APP_PAGES, AUTH_PAGES, REPORT_SECTIONS
- Imports: No explicit imports detected.
- Functions: None explicitly declared in this module.

## File: src/models/reportStatusModel.js

- Purpose: Model/domain module containing data contracts, constants, or normalization rules.
- Export Surface: Exports: normalizeReportStatus, REPORT_STATUS_BADGE_CLASSES, REPORT_STATUS_OPTIONS, REPORT_URGENCY_BADGE_CLASSES
- Imports: No explicit imports detected.
- Functions Declared: 1

### Function: normalizeReportStatus(status)

- Defined At: line 16
- Specific Purpose: Normalizes incoming values to conform to the model/schema contract expected across the app state.
- Inputs: Accepts: status
- Output: Returns a newly constructed/normalized data structure for downstream use.
- Side Effects: No direct external side effects detected; behavior appears computation/render focused.
- Key Dependencies: This function primarily relies on in-file logic and standard language/runtime features.
- Usage Scope: Exported symbol; intended for use by other modules importing this file.

## File: src/models/roleAccessModel.js

- Purpose: Model/domain module containing data contracts, constants, or normalization rules.
- Export Surface: Exports: canAccessDepartment, canAccessPage, canReviewTransferRequest, isSuperadmin, normalizeUserRole, ROLE_PAGE_ACCESS, USER_ROLES
- Imports: ./pageModel
- Functions Declared: 5

### Function: normalizeUserRole(role)

- Defined At: line 7
- Specific Purpose: Normalizes incoming values to conform to the model/schema contract expected across the app state.
- Inputs: Accepts: role
- Output: Returns a newly constructed/normalized data structure for downstream use.
- Side Effects: No direct external side effects detected; behavior appears computation/render focused.
- Key Dependencies: ./pageModel
- Usage Scope: Exported symbol; intended for use by other modules importing this file.

### Function: isSuperadmin(role)

- Defined At: line 56
- Specific Purpose: Evaluates constraints and returns a rule/validation outcome to drive conditional flow.
- Inputs: Accepts: role
- Output: Returns a boolean or validation result object indicating whether constraints pass.
- Side Effects: Drives navigation or view transition state.
- Key Dependencies: ./pageModel
- Usage Scope: Exported symbol; intended for use by other modules importing this file.

### Function: canAccessPage({ role, page })

- Defined At: line 60
- Specific Purpose: Evaluates constraints and returns a rule/validation outcome to drive conditional flow.
- Inputs: Accepts: { role, page }
- Output: Returns a boolean or validation result object indicating whether constraints pass.
- Side Effects: No direct external side effects detected; behavior appears computation/render focused.
- Key Dependencies: ./pageModel
- Usage Scope: Exported symbol; intended for use by other modules importing this file.

### Function: canAccessDepartment({ role, adminDepartmentId, reportDepartmentId })

- Defined At: line 65
- Specific Purpose: Evaluates constraints and returns a rule/validation outcome to drive conditional flow.
- Inputs: Accepts: { role, adminDepartmentId, reportDepartmentId }
- Output: Returns a boolean or validation result object indicating whether constraints pass.
- Side Effects: No direct external side effects detected; behavior appears computation/render focused.
- Key Dependencies: ./pageModel
- Usage Scope: Exported symbol; intended for use by other modules importing this file.

### Function: canReviewTransferRequest(role)

- Defined At: line 73
- Specific Purpose: Evaluates constraints and returns a rule/validation outcome to drive conditional flow.
- Inputs: Accepts: role
- Output: Returns a boolean or validation result object indicating whether constraints pass.
- Side Effects: No direct external side effects detected; behavior appears computation/render focused.
- Key Dependencies: ./pageModel
- Usage Scope: Exported symbol; intended for use by other modules importing this file.

## File: src/models/storageSchemaModel.js

- Purpose: Model/domain module containing data contracts, constants, or normalization rules.
- Export Surface: Exports: getStorageSchemaRule, STORAGE_SCHEMA_RULES, STORAGE_SCHEMA_VERSION
- Imports: ./pageModel
- Functions Declared: 22

### Function: isObject(value)

- Defined At: line 13
- Specific Purpose: Evaluates constraints and returns a rule/validation outcome to drive conditional flow.
- Inputs: Accepts: value
- Output: Returns a boolean or validation result object indicating whether constraints pass.
- Side Effects: Drives navigation or view transition state.
- Key Dependencies: ./pageModel
- Usage Scope: Internal helper; intended to be used only within this module.

### Function: asString(value, fallback = '')

- Defined At: line 17
- Specific Purpose: Normalizes incoming values to conform to the model/schema contract expected across the app state.
- Inputs: Accepts: value, fallback = ''
- Output: Returns a module-specific value based on current parameters and internal logic.
- Side Effects: No direct external side effects detected; behavior appears computation/render focused.
- Key Dependencies: ./pageModel
- Usage Scope: Internal helper; intended to be used only within this module.

### Function: asBoolean(value, fallback = false)

- Defined At: line 21
- Specific Purpose: Normalizes incoming values to conform to the model/schema contract expected across the app state.
- Inputs: Accepts: value, fallback = false
- Output: Returns a module-specific value based on current parameters and internal logic.
- Side Effects: No direct external side effects detected; behavior appears computation/render focused.
- Key Dependencies: ./pageModel
- Usage Scope: Internal helper; intended to be used only within this module.

### Function: asArray(value, fallback = [])

- Defined At: line 25
- Specific Purpose: Normalizes incoming values to conform to the model/schema contract expected across the app state.
- Inputs: Accepts: value, fallback = []
- Output: Returns a module-specific value based on current parameters and internal logic.
- Side Effects: No direct external side effects detected; behavior appears computation/render focused.
- Key Dependencies: ./pageModel
- Usage Scope: Internal helper; intended to be used only within this module.

### Function: asObject(value, fallback = {})

- Defined At: line 29
- Specific Purpose: Normalizes incoming values to conform to the model/schema contract expected across the app state.
- Inputs: Accepts: value, fallback = {}
- Output: Returns a module-specific value based on current parameters and internal logic.
- Side Effects: No direct external side effects detected; behavior appears computation/render focused.
- Key Dependencies: ./pageModel
- Usage Scope: Internal helper; intended to be used only within this module.

### Function: normalizeAdminProfile(profile)

- Defined At: line 33
- Specific Purpose: Normalizes incoming values to conform to the model/schema contract expected across the app state.
- Inputs: Accepts: profile
- Output: Returns a newly constructed/normalized data structure for downstream use.
- Side Effects: No direct external side effects detected; behavior appears computation/render focused.
- Key Dependencies: ./pageModel
- Usage Scope: Internal helper; intended to be used only within this module.

### Function: normalizeAdminAccounts(accounts)

- Defined At: line 52
- Specific Purpose: Normalizes incoming values to conform to the model/schema contract expected across the app state.
- Inputs: Accepts: accounts
- Output: Returns a newly constructed/normalized data structure for downstream use.
- Side Effects: No direct external side effects detected; behavior appears computation/render focused.
- Key Dependencies: ./pageModel
- Usage Scope: Internal helper; intended to be used only within this module.

### Function: normalizePreferences(preferences)

- Defined At: line 57
- Specific Purpose: Normalizes incoming values to conform to the model/schema contract expected across the app state.
- Inputs: Accepts: preferences
- Output: Returns a newly constructed/normalized data structure for downstream use.
- Side Effects: No direct external side effects detected; behavior appears computation/render focused.
- Key Dependencies: ./pageModel
- Usage Scope: Internal helper; intended to be used only within this module.

### Function: normalizeNotification(notification, fallbackIdPrefix = 'notif')

- Defined At: line 78
- Specific Purpose: Normalizes incoming values to conform to the model/schema contract expected across the app state.
- Inputs: Accepts: notification, fallbackIdPrefix = 'notif'
- Output: Returns a newly constructed/normalized data structure for downstream use.
- Side Effects: Creates timestamped metadata for logs/events.
- Key Dependencies: ./pageModel
- Usage Scope: Internal helper; intended to be used only within this module.

### Function: normalizeNotificationsArray(notifications)

- Defined At: line 91
- Specific Purpose: Normalizes incoming values to conform to the model/schema contract expected across the app state.
- Inputs: Accepts: notifications
- Output: Returns a newly constructed/normalized data structure for downstream use.
- Side Effects: Creates timestamped metadata for logs/events.
- Key Dependencies: ./pageModel
- Usage Scope: Internal helper; intended to be used only within this module.

### Function: normalizeNotificationsByAdmin(notificationsByAdmin, adminAccounts)

- Defined At: line 96
- Specific Purpose: Normalizes incoming values to conform to the model/schema contract expected across the app state.
- Inputs: Accepts: notificationsByAdmin, adminAccounts
- Output: Returns a newly constructed/normalized data structure for downstream use.
- Side Effects: No direct external side effects detected; behavior appears computation/render focused.
- Key Dependencies: ./pageModel
- Usage Scope: Internal helper; intended to be used only within this module.

### Function: normalizeTransferRequest(entry)

- Defined At: line 110
- Specific Purpose: Normalizes incoming values to conform to the model/schema contract expected across the app state.
- Inputs: Accepts: entry
- Output: Returns a newly constructed/normalized data structure for downstream use.
- Side Effects: No direct external side effects detected; behavior appears computation/render focused.
- Key Dependencies: ./pageModel
- Usage Scope: Internal helper; intended to be used only within this module.

### Function: normalizeActivityEntry(entry)

- Defined At: line 131
- Specific Purpose: Normalizes incoming values to conform to the model/schema contract expected across the app state.
- Inputs: Accepts: entry
- Output: Returns a newly constructed/normalized data structure for downstream use.
- Side Effects: Creates timestamped metadata for logs/events.
- Key Dependencies: ./pageModel
- Usage Scope: Internal helper; intended to be used only within this module.

### Function: migratePassThrough({ payload })

- Defined At: line 141
- Specific Purpose: Implements file-specific feature logic that supports this module's behavior and data flow.
- Inputs: Accepts: { payload }
- Output: Returns a module-specific value based on current parameters and internal logic.
- Side Effects: Creates timestamped metadata for logs/events.
- Key Dependencies: ./pageModel
- Usage Scope: Internal helper; intended to be used only within this module.

### Function: STORAGE_SCHEMA_RULES.validate(value)

- Defined At: line 170
- Specific Purpose: Implements file-specific feature logic that supports this module's behavior and data flow.
- Inputs: Accepts: value
- Output: Returns a module-specific value based on current parameters and internal logic.
- Side Effects: No direct external side effects detected; behavior appears computation/render focused.
- Key Dependencies: ./pageModel
- Usage Scope: Exposed through an exported object API; callable by modules importing this service/controller object.

### Function: STORAGE_SCHEMA_RULES.validate(value)

- Defined At: line 176
- Specific Purpose: Implements file-specific feature logic that supports this module's behavior and data flow.
- Inputs: Accepts: value
- Output: Returns a module-specific value based on current parameters and internal logic.
- Side Effects: No direct external side effects detected; behavior appears computation/render focused.
- Key Dependencies: ./pageModel
- Usage Scope: Exposed through an exported object API; callable by modules importing this service/controller object.

### Function: STORAGE_SCHEMA_RULES.validate(value)

- Defined At: line 181
- Specific Purpose: Implements file-specific feature logic that supports this module's behavior and data flow.
- Inputs: Accepts: value
- Output: Returns a module-specific value based on current parameters and internal logic.
- Side Effects: No direct external side effects detected; behavior appears computation/render focused.
- Key Dependencies: ./pageModel
- Usage Scope: Exposed through an exported object API; callable by modules importing this service/controller object.

### Function: STORAGE_SCHEMA_RULES.validate(value)

- Defined At: line 189
- Specific Purpose: Implements file-specific feature logic that supports this module's behavior and data flow.
- Inputs: Accepts: value
- Output: Primarily performs side-effect-driven logic; return value is not a primary integration contract.
- Side Effects: Drives navigation or view transition state.
- Key Dependencies: ./pageModel
- Usage Scope: Exposed through an exported object API; callable by modules importing this service/controller object.

### Function: STORAGE_SCHEMA_RULES.validate(value)

- Defined At: line 194
- Specific Purpose: Implements file-specific feature logic that supports this module's behavior and data flow.
- Inputs: Accepts: value
- Output: Primarily performs side-effect-driven logic; return value is not a primary integration contract.
- Side Effects: Drives navigation or view transition state.
- Key Dependencies: ./pageModel
- Usage Scope: Exposed through an exported object API; callable by modules importing this service/controller object.

### Function: STORAGE_SCHEMA_RULES.validate(value)

- Defined At: line 199
- Specific Purpose: Implements file-specific feature logic that supports this module's behavior and data flow.
- Inputs: Accepts: value
- Output: Primarily performs side-effect-driven logic; return value is not a primary integration contract.
- Side Effects: Drives navigation or view transition state.
- Key Dependencies: ./pageModel
- Usage Scope: Exposed through an exported object API; callable by modules importing this service/controller object.

### Function: STORAGE_SCHEMA_RULES.validate(value)

- Defined At: line 204
- Specific Purpose: Implements file-specific feature logic that supports this module's behavior and data flow.
- Inputs: Accepts: value
- Output: Primarily performs side-effect-driven logic; return value is not a primary integration contract.
- Side Effects: Drives navigation or view transition state.
- Key Dependencies: ./pageModel
- Usage Scope: Exposed through an exported object API; callable by modules importing this service/controller object.

### Function: getStorageSchemaRule(storageKey)

- Defined At: line 207
- Specific Purpose: Resolves domain constants or computed model values required by controllers and services.
- Inputs: Accepts: storageKey
- Output: Returns retrieved or derived data (object, array, or primitive) consumed by callers.
- Side Effects: Drives navigation or view transition state.
- Key Dependencies: ./pageModel
- Usage Scope: Exported symbol; intended for use by other modules importing this file.

