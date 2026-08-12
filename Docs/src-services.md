# Src Services Reference

Scope: files grouped under src-services for CitiSent-Website.

## Manual Sync Notes (2026-04-02)

- API transport/config, auth integration, admin services, and admin mappers now live under `src/services/api/*`.
- The previous root-level `adminApiService.js`, `adminApiMappers.js`, `apiClient.js`, `apiConfig.js`, and `authApiService.js` files were split into domain modules and removed.
- `src/services/storageService.js` remains at the root of `src/services`.
- Existing generated counts elsewhere may lag until documentation tooling is restored.

## File: src/services/__tests__/storageService.test.js

- Purpose: Automated test module that validates storage helper behavior and guards against persistence regressions.
- Export Surface: No explicit exports.
- Imports: `vitest`

## File: src/services/api/admin/accountsApiMappers.js

- Purpose: Maps account and user payloads from backend responses into frontend-facing admin and user shapes.
- Export Surface: `mapBackendProfileToAdminProfile`, `mapBackendUserToUiRow`, `mapUiStatusToBackendUserStatus`, `mapBackendOfficeAdmin`
- Imports: None

## File: src/services/api/admin/activityLogApiMappers.js

- Purpose: Normalizes backend activity log entries for frontend consumption.
- Export Surface: `mapBackendActivityLogEntry`
- Imports: None

## File: src/services/api/admin/activityLogApiService.js

- Purpose: Reads and writes admin activity-log data through the API boundary.
- Export Surface: `activityLogApiService`
- Imports: `../core/apiClient`

## File: src/services/api/admin/dashboardApiMappers.js

- Purpose: Maps dashboard aggregate payloads into card, chart, and table-ready UI data.
- Export Surface: `mapDashboardSummaryToStatCards`, `mapDashboardCategoryBreakdown`, `mapDashboardWeeklyTrend`, `mapDashboardRecentAdmins`, `mapDashboardRecentUsers`
- Imports: None

## File: src/services/api/admin/dashboardApiService.js

- Purpose: Fetches dashboard aggregate endpoints under `/admin/dashboard/*`.
- Export Surface: `dashboardApiService`
- Imports: `../core/apiClient`

## File: src/services/api/admin/departmentsApiService.js

- Purpose: Fetches department option data for admin workflows.
- Export Surface: `departmentsApiService`
- Imports: `../core/apiClient`

## File: src/services/api/admin/notificationsApiMappers.js

- Purpose: Normalizes backend notification payloads for frontend state and rendering.
- Export Surface: `mapBackendNotification`
- Imports: None

## File: src/services/api/admin/notificationsApiService.js

- Purpose: Lists and mutates admin notifications through the API boundary.
- Export Surface: `notificationsApiService`
- Imports: `../core/apiClient`

## File: src/services/api/admin/officeAdminsApiService.js

- Purpose: Fetches office-admin records and persists office-admin department assignments.
- Export Surface: `officeAdminsApiService`
- Imports: `../core/apiClient`

## File: src/services/api/admin/reportsApiMappers.js

- Purpose: Maps backend report payloads and report status labels into the UI report model.
- Export Surface: `mapBackendReportToUiRow`, `mapUiStatusToBackendStatus`
- Imports: `../../../models/reportStatusModel`

## File: src/services/api/admin/reportsApiService.js

- Purpose: Lists, reads, and updates admin-managed reports.
- Export Surface: `reportsApiService`
- Imports: `../core/apiClient`

## File: src/services/api/admin/transferRequestsApiMappers.js

- Purpose: Normalizes backend department-transfer request payloads for frontend state.
- Export Surface: `mapBackendTransferRequest`
- Imports: None

## File: src/services/api/admin/transferRequestsApiService.js

- Purpose: Lists and mutates admin department-transfer requests.
- Export Surface: `transferRequestsApiService`
- Imports: `../core/apiClient`

## File: src/services/api/admin/usersApiService.js

- Purpose: Lists, reads, creates, updates, bans, and unbans users through admin endpoints.
- Export Surface: `usersApiService`
- Imports: `../core/apiClient`

## File: src/services/api/auth/authApiService.js

- Purpose: Handles authentication and current-user API calls for the admin app.
- Export Surface: `authApiService`
- Imports: `../core/apiClient`

## File: src/services/api/core/apiClient.js

- Purpose: Provides shared HTTP request handling, retries, JSON parsing, and API error normalization.
- Export Surface: `apiClient`
- Imports: `./apiConfig`

## File: src/services/api/core/apiConfig.js

- Purpose: Resolves the frontend API base URL from environment configuration with a localhost fallback.
- Export Surface: `resolveApiBaseUrl`
- Imports: None

## File: src/services/storageService.js

- Purpose: Reads and writes browser storage values, including schema-aware persistence helpers.
- Export Surface: `loadFromStorage`, `loadFromStorageWithSchema`, `saveToStorage`, `saveToStorageWithSchema`
- Imports: None
