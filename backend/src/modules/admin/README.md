# Admin Module

This module owns backend authorization-aware admin workflows:

- scoped report review
- office-admin department assignment
- department transfer request submission and review
- persistent notifications state and actions
- persistent activity/audit log events
- dashboard aggregate metrics for admin dashboard cards, charts, and tables

Route-level role checks happen in middleware. Resource-level scope checks stay in the service/repository layers.

## Layering

- Route: Auth, actor profile load, role guard, and request validation.
- Controller: HTTP-specific orchestration and success envelope responses.
- Service: Business rules, scoping logic, timezone-aware aggregation.
- Repository: Supabase access and scoped query execution.

## Dashboard Aggregate Endpoints

All routes below live under /api/v1/admin and require authenticated admin role.

- GET /dashboard/summary
  - Returns total users and report summary totals for stat cards.
- GET /dashboard/reports/status
  - Returns report counts grouped by persisted status.
- GET /dashboard/reports/category
  - Returns report counts grouped by issue category or unknown.
- GET /dashboard/reports/weekly-trend
  - Returns rolling last-7-day report trend using Asia/Manila buckets.
- GET /dashboard/admins/recent
  - Returns recently registered office admins.
- GET /dashboard/users/recent
  - Returns recently registered citizens.

## Persistence Endpoints

All routes below live under /api/v1/admin and require authenticated admin role.

- GET /notifications
  - Returns persistent notification entries for the current admin (or scoped target for superadmin).
- PATCH /notifications/:notificationId/read
  - Updates a single notification read/unread state.
- PATCH /notifications/read-state
  - Bulk updates notification read/unread state.
- POST /notifications/clear
  - Clears selected or all notifications.
- GET /activity-log
  - Returns persistent activity/audit entries for the current admin (or scoped target for superadmin).
- POST /activity-log
  - Persists a new admin activity entry.

## Scope Rules

- Superadmin: receives global report/admin metrics.
- Office Admin: receives department-scoped report/admin metrics.
- User metrics (total users, recent users): global for both roles under current schema.

## Current Notes

- Weekly trend uses Asia/Manila for label and bucket grouping in service logic.
- Department scoping for reports is enforced in repository query logic.
- Dashboard data returned by backend is consumed directly by website service mappers.
