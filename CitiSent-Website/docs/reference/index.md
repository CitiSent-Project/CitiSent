# CitiSent-Website Documentation Index

This index links per-folder references documenting file purposes and function-level behavior across the website codebase.

Total Files Documented: 170
Total Code Files (.js/.jsx/.ts/.tsx): 141
Total Declared Functions Captured: 346

## Per-Folder References

- [Root and Public Assets](root-and-public.md) - 18 files
- [Src Core Entry Files](src-core.md) - 3 files
- [Src Components Reference](src-components.md) - 53 files
- [Src Controllers Reference](src-controllers.md) - 27 files
- [Src Frontend Pages Reference](src-frontend.md) - 15 files
- [Src Hooks Reference](src-hooks.md) - 13 files
- [Src Models and Data Reference](src-models.md) - 10 files
- [Src Services Reference](src-services.md) - 19 files
- [Project Tooling Files](project-tooling.md) - 12 files

## Coverage and Verification Artifacts

- [_coverage-manifest.json](_coverage-manifest.json) - File/function coverage map used for completeness checks.

## Database Wiring Fast Paths

- API Transport and Config: See src-services.md entries for src/services/api/core/apiClient.js and src/services/api/core/apiConfig.js.
- Auth and Session Flow: See src-services.md (src/services/api/auth/authApiService.js), src-hooks.md (useAuthSession.js), src-controllers.md (authController.js).
- Report Read/Update Flows: See src-services.md (src/services/api/admin/reportsApiService.js), src-controllers.md (reportAccessController.js/reportStatusController.js), src-frontend.md (Reports/*).
- Persistence and Schema Safety: See src-services.md (storageService.js) and src-models.md (storageSchemaModel.js).
- App Orchestration: See src-core.md (src/App.jsx) and src-hooks.md (useAppStateOrchestrator.js).

## Maintenance Notes

1. Re-run scripts/generate-documentation.ps1 after adding, deleting, or refactoring files/functions.
2. Commit docs updates together with code changes to keep navigation and behavior docs synchronized.
3. Use _coverage-manifest.json as the baseline when auditing documentation completeness.

## Manual Sync Notes (2026-03-29)

- Dashboard page now hydrates from backend aggregate APIs instead of static card/chart/table data.
- Admin API services and mappers now live under src/services/api with domain-specific modules.
- Login page identifier copy now explicitly supports username-or-email input.
- useAppStateOrchestrator integration tests were stabilized to reduce React act warning noise during async hydration.
