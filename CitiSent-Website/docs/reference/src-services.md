# Src Services Reference

Scope: files grouped under src-services for CitiSent-Website.

## Manual Sync Notes (2026-03-29)

- src/services/adminApiService.js now includes dashboard aggregate methods:
  - getDashboardSummary
  - getDashboardReportsByStatus
  - getDashboardReportsByCategory
  - getDashboardWeeklyTrend
  - getDashboardRecentAdmins
  - getDashboardRecentUsers
- src/services/adminApiMappers.js now includes dashboard mapping helpers:
  - mapDashboardSummaryToStatCards
  - mapDashboardCategoryBreakdown
  - mapDashboardWeeklyTrend
  - mapDashboardRecentAdmins
  - mapDashboardRecentUsers
- Existing generated function counts below may lag until the next full docs generation run.

## File: src/services/__tests__/storageService.test.js

- Purpose: Automated test module that validates feature behavior and prevents regressions.
- Export Surface: No explicit exports (or export detection not applicable).
- Imports: vitest
- Functions Declared: 1

### Function: createMockStorage()

- Defined At: line 8
- Specific Purpose: Performs write-side integration logic that mutates backend or persisted state through service boundaries.
- Inputs: No explicit parameters; relies on closure/module context and imported dependencies.
- Output: Returns a newly constructed/normalized data structure for downstream use.
- Side Effects: Reads/writes browser storage. Updates React/application state via setter calls.
- Key Dependencies: vitest
- Usage Scope: Internal helper; intended to be used only within this module.

## File: src/services/adminApiMappers.js

- Purpose: Service/integration module for API transport, mapping, and persistence concerns.
- Export Surface: Exports: mapBackendOfficeAdmin, mapBackendProfileToAdminProfile, mapBackendReportToUiRow, mapBackendTransferRequest, mapUiStatusToBackendStatus
- Imports: ../models/reportStatusModel, ../models/data
- Functions Declared: 7

### Function: formatDate(value)

- Defined At: line 10
- Specific Purpose: Implements file-specific feature logic that supports this module's behavior and data flow.
- Inputs: Accepts: value
- Output: Returns a newly constructed/normalized data structure for downstream use.
- Side Effects: Creates timestamped metadata for logs/events.
- Key Dependencies: ../models/reportStatusModel, ../models/data
- Usage Scope: Internal helper; intended to be used only within this module.

### Function: resolveDepartment(departmentId, departmentLabel, issueType)

- Defined At: line 22
- Specific Purpose: Implements file-specific feature logic that supports this module's behavior and data flow.
- Inputs: Accepts: departmentId, departmentLabel, issueType
- Output: Returns retrieved or derived data (object, array, or primitive) consumed by callers.
- Side Effects: Creates timestamped metadata for logs/events.
- Key Dependencies: ../models/reportStatusModel, ../models/data
- Usage Scope: Internal helper; intended to be used only within this module.

### Function: mapBackendProfileToAdminProfile(payload = {})

- Defined At: line 42
- Specific Purpose: Transforms transport-layer payloads between backend response format and the UI/domain model used by the frontend.
- Inputs: Accepts: payload = {}
- Output: Returns a newly constructed/normalized data structure for downstream use.
- Side Effects: No direct external side effects detected; behavior appears computation/render focused.
- Key Dependencies: ../models/reportStatusModel, ../models/data
- Usage Scope: Exported symbol; intended for use by other modules importing this file.

### Function: mapBackendOfficeAdmin(payload = {})

- Defined At: line 58
- Specific Purpose: Transforms transport-layer payloads between backend response format and the UI/domain model used by the frontend.
- Inputs: Accepts: payload = {}
- Output: Returns a newly constructed/normalized data structure for downstream use.
- Side Effects: No direct external side effects detected; behavior appears computation/render focused.
- Key Dependencies: ../models/reportStatusModel, ../models/data
- Usage Scope: Exported symbol; intended for use by other modules importing this file.

### Function: mapBackendTransferRequest(payload = {})

- Defined At: line 73
- Specific Purpose: Transforms transport-layer payloads between backend response format and the UI/domain model used by the frontend.
- Inputs: Accepts: payload = {}
- Output: Returns a newly constructed/normalized data structure for downstream use.
- Side Effects: No direct external side effects detected; behavior appears computation/render focused.
- Key Dependencies: ../models/reportStatusModel, ../models/data
- Usage Scope: Exported symbol; intended for use by other modules importing this file.

### Function: mapBackendReportToUiRow(payload = {})

- Defined At: line 98
- Specific Purpose: Transforms transport-layer payloads between backend response format and the UI/domain model used by the frontend.
- Inputs: Accepts: payload = {}
- Output: Returns a newly constructed/normalized data structure for downstream use.
- Side Effects: Creates timestamped metadata for logs/events.
- Key Dependencies: ../models/reportStatusModel, ../models/data
- Usage Scope: Exported symbol; intended for use by other modules importing this file.

### Function: mapUiStatusToBackendStatus(status)

- Defined At: line 131
- Specific Purpose: Transforms transport-layer payloads between backend response format and the UI/domain model used by the frontend.
- Inputs: Accepts: status
- Output: Returns a newly constructed/normalized data structure for downstream use.
- Side Effects: No direct external side effects detected; behavior appears computation/render focused.
- Key Dependencies: ../models/reportStatusModel, ../models/data
- Usage Scope: Exported symbol; intended for use by other modules importing this file.

## File: src/services/adminApiService.js

- Purpose: Service/integration module for API transport, mapping, and persistence concerns.
- Export Surface: Exports: adminApiService
- Imports: ./apiClient
- Functions Declared: 9

### Function: adminApiService.listReports(token, { limit = 100, offset = 0, status } = {})

- Defined At: line 4
- Specific Purpose: Executes or prepares service-layer data retrieval against API or storage boundaries for downstream UI consumption.
- Inputs: Accepts: token, { limit = 100, offset = 0, status } = {}
- Output: Returns a module-specific value based on current parameters and internal logic.
- Side Effects: Triggers network/API I/O.
- Key Dependencies: ./apiClient
- Usage Scope: Exposed through an exported object API; callable by modules importing this service/controller object.

### Function: adminApiService.getReportById(token, reportId)

- Defined At: line 18
- Specific Purpose: Executes or prepares service-layer data retrieval against API or storage boundaries for downstream UI consumption.
- Inputs: Accepts: token, reportId
- Output: Returns a module-specific value based on current parameters and internal logic.
- Side Effects: Triggers network/API I/O.
- Key Dependencies: ./apiClient
- Usage Scope: Exposed through an exported object API; callable by modules importing this service/controller object.

### Function: adminApiService.updateReport(token, reportId, payload)

- Defined At: line 22
- Specific Purpose: Performs write-side integration logic that mutates backend or persisted state through service boundaries.
- Inputs: Accepts: token, reportId, payload
- Output: Primarily performs side-effect-driven logic; return value is not a primary integration contract.
- Side Effects: Triggers network/API I/O.
- Key Dependencies: ./apiClient
- Usage Scope: Exposed through an exported object API; callable by modules importing this service/controller object.

### Function: adminApiService.listTransferRequests(token)

- Defined At: line 26
- Specific Purpose: Executes or prepares service-layer data retrieval against API or storage boundaries for downstream UI consumption.
- Inputs: Accepts: token
- Output: Primarily performs side-effect-driven logic; return value is not a primary integration contract.
- Side Effects: Triggers network/API I/O.
- Key Dependencies: ./apiClient
- Usage Scope: Exposed through an exported object API; callable by modules importing this service/controller object.

### Function: adminApiService.createTransferRequest(token, payload)

- Defined At: line 30
- Specific Purpose: Performs write-side integration logic that mutates backend or persisted state through service boundaries.
- Inputs: Accepts: token, payload
- Output: Primarily performs side-effect-driven logic; return value is not a primary integration contract.
- Side Effects: Triggers network/API I/O.
- Key Dependencies: ./apiClient
- Usage Scope: Exposed through an exported object API; callable by modules importing this service/controller object.

### Function: adminApiService.approveTransferRequest(token, requestId, payload)

- Defined At: line 34
- Specific Purpose: Performs write-side integration logic that mutates backend or persisted state through service boundaries.
- Inputs: Accepts: token, requestId, payload
- Output: Primarily performs side-effect-driven logic; return value is not a primary integration contract.
- Side Effects: Triggers network/API I/O.
- Key Dependencies: ./apiClient
- Usage Scope: Exposed through an exported object API; callable by modules importing this service/controller object.

### Function: adminApiService.rejectTransferRequest(token, requestId, payload)

- Defined At: line 38
- Specific Purpose: Performs write-side integration logic that mutates backend or persisted state through service boundaries.
- Inputs: Accepts: token, requestId, payload
- Output: Primarily performs side-effect-driven logic; return value is not a primary integration contract.
- Side Effects: Triggers network/API I/O.
- Key Dependencies: ./apiClient
- Usage Scope: Exposed through an exported object API; callable by modules importing this service/controller object.

### Function: adminApiService.listOfficeAdmins(token)

- Defined At: line 42
- Specific Purpose: Executes or prepares service-layer data retrieval against API or storage boundaries for downstream UI consumption.
- Inputs: Accepts: token
- Output: Primarily performs side-effect-driven logic; return value is not a primary integration contract.
- Side Effects: Triggers network/API I/O.
- Key Dependencies: ./apiClient
- Usage Scope: Exposed through an exported object API; callable by modules importing this service/controller object.

### Function: adminApiService.assignOfficeDepartment(token, adminId, payload)

- Defined At: line 46
- Specific Purpose: Performs write-side integration logic that mutates backend or persisted state through service boundaries.
- Inputs: Accepts: token, adminId, payload
- Output: Primarily performs side-effect-driven logic; return value is not a primary integration contract.
- Side Effects: Triggers network/API I/O.
- Key Dependencies: ./apiClient
- Usage Scope: Exposed through an exported object API; callable by modules importing this service/controller object.

## File: src/services/apiClient.js

- Purpose: Service/integration module for API transport, mapping, and persistence concerns.
- Export Surface: Exports: apiClient
- Imports: ./apiConfig
- Functions Declared: 8

### Function: buildRequestUrl(endpoint)

- Defined At: line 4
- Specific Purpose: Executes or prepares service-layer data retrieval against API or storage boundaries for downstream UI consumption.
- Inputs: Accepts: endpoint
- Output: Returns a newly constructed/normalized data structure for downstream use.
- Side Effects: No direct external side effects detected; behavior appears computation/render focused.
- Key Dependencies: ./apiConfig
- Usage Scope: Internal helper; intended to be used only within this module.

### Function: buildHeaders(token, customHeaders)

- Defined At: line 9
- Specific Purpose: Constructs a new structured value/object used by downstream state, rendering, or persistence logic.
- Inputs: Accepts: token, customHeaders
- Output: Returns a newly constructed/normalized data structure for downstream use.
- Side Effects: No direct external side effects detected; behavior appears computation/render focused.
- Key Dependencies: ./apiConfig
- Usage Scope: Internal helper; intended to be used only within this module.

### Function: buildValidationDetailsSummary(details)

- Defined At: line 17
- Specific Purpose: Constructs a new structured value/object used by downstream state, rendering, or persistence logic.
- Inputs: Accepts: details
- Output: Returns a newly constructed/normalized data structure for downstream use.
- Side Effects: No direct external side effects detected; behavior appears computation/render focused.
- Key Dependencies: ./apiConfig
- Usage Scope: Internal helper; intended to be used only within this module.

### Function: request(endpoint, options = {})

- Defined At: line 40
- Specific Purpose: Executes or prepares service-layer data retrieval against API or storage boundaries for downstream UI consumption.
- Inputs: Accepts: endpoint, options = {}
- Output: Returns a module-specific value based on current parameters and internal logic.
- Side Effects: Triggers network/API I/O.
- Key Dependencies: ./apiConfig
- Usage Scope: Internal helper; intended to be used only within this module.

### Function: apiClient.get(endpoint, options = {})

- Defined At: line 99
- Specific Purpose: Executes or prepares service-layer data retrieval against API or storage boundaries for downstream UI consumption.
- Inputs: Accepts: endpoint, options = {}
- Output: Primarily performs side-effect-driven logic; return value is not a primary integration contract.
- Side Effects: Triggers network/API I/O.
- Key Dependencies: ./apiConfig
- Usage Scope: Exposed through an exported object API; callable by modules importing this service/controller object.

### Function: apiClient.post(endpoint, body, options = {})

- Defined At: line 100
- Specific Purpose: Implements file-specific feature logic that supports this module's behavior and data flow.
- Inputs: Accepts: endpoint, body, options = {}
- Output: Primarily performs side-effect-driven logic; return value is not a primary integration contract.
- Side Effects: Triggers network/API I/O.
- Key Dependencies: ./apiConfig
- Usage Scope: Exposed through an exported object API; callable by modules importing this service/controller object.

### Function: apiClient.patch(endpoint, body, options = {})

- Defined At: line 106
- Specific Purpose: Performs write-side integration logic that mutates backend or persisted state through service boundaries.
- Inputs: Accepts: endpoint, body, options = {}
- Output: Primarily performs side-effect-driven logic; return value is not a primary integration contract.
- Side Effects: Triggers network/API I/O.
- Key Dependencies: ./apiConfig
- Usage Scope: Exposed through an exported object API; callable by modules importing this service/controller object.

### Function: apiClient.delete(endpoint, options = {})

- Defined At: line 112
- Specific Purpose: Performs write-side integration logic that mutates backend or persisted state through service boundaries.
- Inputs: Accepts: endpoint, options = {}
- Output: Primarily performs side-effect-driven logic; return value is not a primary integration contract.
- Side Effects: Triggers network/API I/O.
- Key Dependencies: ./apiConfig
- Usage Scope: Exposed through an exported object API; callable by modules importing this service/controller object.

## File: src/services/apiConfig.js

- Purpose: Service/integration module for API transport, mapping, and persistence concerns.
- Export Surface: Exports: resolveApiBaseUrl
- Imports: No explicit imports detected.
- Functions Declared: 2

### Function: normalizeUrl(url)

- Defined At: line 1
- Specific Purpose: Transforms transport-layer payloads between backend response format and the UI/domain model used by the frontend.
- Inputs: Accepts: url
- Output: Returns a newly constructed/normalized data structure for downstream use.
- Side Effects: No direct external side effects detected; behavior appears computation/render focused.
- Key Dependencies: This function primarily relies on in-file logic and standard language/runtime features.
- Usage Scope: Internal helper; intended to be used only within this module.

### Function: resolveApiBaseUrl()

- Defined At: line 4
- Specific Purpose: Implements file-specific feature logic that supports this module's behavior and data flow.
- Inputs: No explicit parameters; relies on closure/module context and imported dependencies.
- Output: Returns retrieved or derived data (object, array, or primitive) consumed by callers.
- Side Effects: No direct external side effects detected; behavior appears computation/render focused.
- Key Dependencies: This function primarily relies on in-file logic and standard language/runtime features.
- Usage Scope: Exported symbol; intended for use by other modules importing this file.

## File: src/services/authApiService.js

- Purpose: Service/integration module for API transport, mapping, and persistence concerns.
- Export Surface: Exports: authApiService
- Imports: ./apiClient
- Functions Declared: 4

### Function: authApiService.register(payload)

- Defined At: line 4
- Specific Purpose: Implements file-specific feature logic that supports this module's behavior and data flow.
- Inputs: Accepts: payload
- Output: Primarily performs side-effect-driven logic; return value is not a primary integration contract.
- Side Effects: Triggers network/API I/O.
- Key Dependencies: ./apiClient
- Usage Scope: Exposed through an exported object API; callable by modules importing this service/controller object.

### Function: authApiService.login(payload)

- Defined At: line 5
- Specific Purpose: Implements file-specific feature logic that supports this module's behavior and data flow.
- Inputs: Accepts: payload
- Output: Primarily performs side-effect-driven logic; return value is not a primary integration contract.
- Side Effects: Triggers network/API I/O.
- Key Dependencies: ./apiClient
- Usage Scope: Exposed through an exported object API; callable by modules importing this service/controller object.

### Function: authApiService.me(token)

- Defined At: line 6
- Specific Purpose: Implements file-specific feature logic that supports this module's behavior and data flow.
- Inputs: Accepts: token
- Output: Primarily performs side-effect-driven logic; return value is not a primary integration contract.
- Side Effects: Triggers network/API I/O.
- Key Dependencies: ./apiClient
- Usage Scope: Exposed through an exported object API; callable by modules importing this service/controller object.

### Function: authApiService.updateCurrentUser(token, payload)

- Defined At: line 10
- Specific Purpose: Performs write-side integration logic that mutates backend or persisted state through service boundaries.
- Inputs: Accepts: token, payload
- Output: Primarily performs side-effect-driven logic; return value is not a primary integration contract.
- Side Effects: Triggers network/API I/O.
- Key Dependencies: ./apiClient
- Usage Scope: Exposed through an exported object API; callable by modules importing this service/controller object.

## File: src/services/storageService.js

- Purpose: Service/integration module for API transport, mapping, and persistence concerns.
- Export Surface: Exports: loadFromStorage, loadFromStorageWithSchema, saveToStorage, saveToStorageWithSchema
- Imports: No explicit imports detected.
- Functions Declared: 7

### Function: loadFromStorage(key, fallbackValue)

- Defined At: line 1
- Specific Purpose: Implements file-specific feature logic that supports this module's behavior and data flow.
- Inputs: Accepts: key, fallbackValue
- Output: Returns a module-specific value based on current parameters and internal logic.
- Side Effects: Reads/writes browser storage. Updates React/application state via setter calls.
- Key Dependencies: This function primarily relies on in-file logic and standard language/runtime features.
- Usage Scope: Exported symbol; intended for use by other modules importing this file.

### Function: saveToStorage(key, value)

- Defined At: line 17
- Specific Purpose: Implements file-specific feature logic that supports this module's behavior and data flow.
- Inputs: Accepts: key, value
- Output: Returns a module-specific value based on current parameters and internal logic.
- Side Effects: Reads/writes browser storage. Updates React/application state via setter calls.
- Key Dependencies: This function primarily relies on in-file logic and standard language/runtime features.
- Usage Scope: Exported symbol; intended for use by other modules importing this file.

### Function: isObject(value)

- Defined At: line 25
- Specific Purpose: Evaluates constraints and returns a rule/validation outcome to drive conditional flow.
- Inputs: Accepts: value
- Output: Returns a boolean or validation result object indicating whether constraints pass.
- Side Effects: Reads/writes browser storage. Updates React/application state via setter calls. Creates timestamped metadata for logs/events.
- Key Dependencies: This function primarily relies on in-file logic and standard language/runtime features.
- Usage Scope: Internal helper; intended to be used only within this module.

### Function: isSchemaEnvelope(value)

- Defined At: line 29
- Specific Purpose: Evaluates constraints and returns a rule/validation outcome to drive conditional flow.
- Inputs: Accepts: value
- Output: Returns a boolean or validation result object indicating whether constraints pass.
- Side Effects: Creates timestamped metadata for logs/events.
- Key Dependencies: This function primarily relies on in-file logic and standard language/runtime features.
- Usage Scope: Internal helper; intended to be used only within this module.

### Function: normalizeSchemaValue({

  value,
  schemaVersion,
  migrate,
  validate,
  fallbackValue,
})

- Defined At: line 37
- Specific Purpose: Transforms transport-layer payloads between backend response format and the UI/domain model used by the frontend.
- Inputs: Accepts: {
  value, schemaVersion, migrate, validate, fallbackValue, }
- Output: Returns a newly constructed/normalized data structure for downstream use.
- Side Effects: Creates timestamped metadata for logs/events.
- Key Dependencies: This function primarily relies on in-file logic and standard language/runtime features.
- Usage Scope: Internal helper; intended to be used only within this module.

### Function: loadFromStorageWithSchema(key

  fallbackValue,
  { schemaVersion = 1, migrate, validate, writeBackOnRead = true } = {})

- Defined At: line 61
- Specific Purpose: Implements file-specific feature logic that supports this module's behavior and data flow.
- Inputs: Accepts: key, fallbackValue, { schemaVersion = 1, migrate, validate, writeBackOnRead = true } = {}
- Output: Returns a module-specific value based on current parameters and internal logic.
- Side Effects: Reads/writes browser storage.
- Key Dependencies: This function primarily relies on in-file logic and standard language/runtime features.
- Usage Scope: Exported symbol; intended for use by other modules importing this file.

### Function: saveToStorageWithSchema(key, value, { schemaVersion = 1 } = {})

- Defined At: line 117
- Specific Purpose: Implements file-specific feature logic that supports this module's behavior and data flow.
- Inputs: Accepts: key, value, { schemaVersion = 1 } = {}
- Output: Returns a module-specific value based on current parameters and internal logic.
- Side Effects: Reads/writes browser storage. Updates React/application state via setter calls.
- Key Dependencies: This function primarily relies on in-file logic and standard language/runtime features.
- Usage Scope: Exported symbol; intended for use by other modules importing this file.
