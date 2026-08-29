# Fix N+1 Query Patterns Implementation Plan

Resolve the two N+1 HTTP request patterns identified in the audit report to eliminate unbounded parallel API calls that scale with data size.

## Principles & Standards
- Ensure no errors or bugs are introduced to the existing system.
- Maintain existing functionality exactly as is.
- Follow clean code principles: scalable, maintainable, readable.
- Proper modularization and reusable components.
- PascalCase for `.jsx`, camelCase for `.js`.
- Write production-quality code with proper structure, comments, and best practices.

---

## Proposed Changes

### Pattern 1: Superadmin Notification Hydration N+1 (HIGH Severity)

**Problem**: During `hydrateSession()` in `useAppStateOrchestrator.js`, the code fetches notifications for all office admins in an unbounded `Promise.allSettled`. This causes $N$ parallel HTTP requests on every login/refresh.

**Fix approach — Deferred & On-Demand Loading**:

#### [MODIFY] `src/hooks/useAppStateOrchestrator.js`
- Remove the per-admin notification loop from `hydrateSession()`.
- During session bootstrap, only fetch notifications for the signed-in superadmin's own ID.
- Add a new `hydrateOfficeAdminNotifications()` function to fetch office admin notifications using a concurrency limiter.
- Call this hydration function via a `useEffect` only when the user navigates to the Admin Management page (`APP_PAGES.ADMIN_MANAGEMENT`).

#### [NEW] `src/utils/concurrencyLimiter.js`
- Create a reusable utility `runWithConcurrencyLimit(tasks, maxConcurrent)` to execute promises with bounded concurrency.

---

### Pattern 2: Bulk Ban/Unban N+1 (MODERATE Severity)

**Problem**: In `useUsersState.js`, `runBulkAction()` fires a separate `PATCH /admin/users/:id/ban` for each selected user.

**Fix approach — Backend Bulk Endpoint**:

#### [MODIFY] `backend/src/modules/admin/admin.route.js`
- Add two new endpoints: `PATCH /users/bulk-ban` and `PATCH /users/bulk-unban`.

#### [MODIFY] `backend/src/modules/admin/admin.controller.js`
- Add `bulkBanUsers` and `bulkUnbanUsers` controller methods.

#### [MODIFY] `backend/src/modules/admin/admin.service.js`
- Add service methods that iterate safely or call the repository to update multiple users in a transaction-safe manner.

#### [MODIFY] `backend/src/modules/admin/admin.repository.js`
- Add methods to handle updating status for multiple `userIds` in a single database operation if applicable, or loop safely.

#### [MODIFY] `backend/src/modules/admin/admin.schema.js`
- Add validation schemas for the bulk operations (`userIds` array).

#### [MODIFY] `CitiSent-Website/src/services/api/admin/usersApiService.js`
- Add `bulkBanUsers(token, payload)` and `bulkUnbanUsers(token, payload)` methods calling the new backend endpoints.

#### [MODIFY] `CitiSent-Website/src/hooks/useUsersState.js`
- Update `runBulkAction` to use the new `bulkBanUsers` and `bulkUnbanUsers` API methods instead of looping over the individual endpoints.

---

## Verification Plan
1. **Automated Tests**: Run `npm run lint` and `npm test` in the frontend.
2. **Backend Tests**: Run backend tests to ensure the new endpoints function correctly.
3. **Manual Verification**:
   - Verify superadmin dashboard loads with only 1 notification request.
   - Verify Admin Management page loads office admin notifications correctly.
   - Select multiple users and trigger Bulk Ban; verify only 1 network request is made.
