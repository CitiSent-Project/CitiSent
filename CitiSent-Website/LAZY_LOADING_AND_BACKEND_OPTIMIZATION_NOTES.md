# CitiSent Website: Lazy Loading and Backend Optimization Notes

## Purpose

These notes summarize the website performance review completed before deployment. The goal is to reduce unnecessary downloads and backend requests without changing the current product behavior.

## Key Finding

The main backend pressure is caused by polling, not JavaScript bundle size alone.

- The Reports page requests up to **1,000 reports every 10 seconds**.
- The User Profile page requests that user's reports every 10 seconds.
- Failed `GET` requests can be retried up to three times by the API client.

One open Reports tab creates six report-list requests per minute. Multiple staff members on the same network, combined with retries during a backend outage, can reach the IP-based rate limit quickly.

## Recommended Loading Strategy

| Area | Recommendation | Reason |
| --- | --- | --- |
| App shell, navigation, login | Eager load | Needed immediately for every visitor. |
| Dashboard | Load immediately after successful login | It is the default admin workspace page. |
| Reports: By Category, By Urgency, History | Lazy load | These are alternative views and include chart-related code. Load only the selected view. |
| Report Detail | Lazy load | Used only after selecting a report. |
| Conversations | Lazy load | Opens real-time connections and loads conversation data. |
| Users | Lazy load | Fetches user lists and statistics only when the page is visited. |
| User Profile | Lazy load | Detail page used only after selecting a user. |
| Admin Management | Lazy load | Superadmin-only page with substantial UI and data needs. |
| Notifications | Lazy load full list | The navigation badge needs only an unread count; load the full list when opened. |
| Admin Profile | Lazy load | Low-frequency page. |
| Settings | Keep basic settings eager; lazy load Audit & Logs | Basic preferences are small; audit history can be deferred. |

## Current Structural Limitation

The custom page router imports all page components when the application starts. Even pages that are never opened are included in the initial download.

Use route-level code splitting with `React.lazy()` and `Suspense` for low-frequency pages. The existing `PageSkeleton` component is a suitable loading fallback if its interface supports the new boundary.

## Backend-Health Priorities

### 1. Reduce report polling

Do not refresh the complete report list every 10 seconds.

Preferred options, in order:

1. Refresh after a known report mutation.
2. Refresh from an existing, confirmed real-time event.
3. Use a manual Refresh button.
4. If polling remains necessary, use a longer interval and only poll while the page is visible.

### 2. Request only one report page

The website renders paginated report tables but currently requests up to 1,000 records. If the backend's report-list endpoint supports pagination, send the current page's `limit` and `offset` rather than downloading all records and paginating in the browser.

This requires confirming the existing API contract before changing the frontend implementation.

### 3. Defer notification hydration

During session bootstrap, a superadmin can request:

- their profile;
- transfer requests;
- office-admin accounts;
- up to 200 activity-log entries;
- up to 200 notifications for every relevant admin.

Fetch only the signed-in administrator's data needed for the navigation badge during bootstrap. Fetch the broader notification data when the Notifications or Admin Management page is opened.

### 4. Keep retries controlled

The API client retries network failures for `GET`, `HEAD`, and `OPTIONS` requests. This is useful for temporary connection problems, but it amplifies polling traffic during an outage.

When changing polling, verify that retries do not overlap with the next polling attempt.

## Rate-limit Context

The backend rate limit is per client IP. A shared office network can make several administrators count toward the same quota.

The configuration should use a shorter reset window rather than a lower maximum. For example:

```env
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=120
```

This does not solve excessive polling, but it prevents a user from waiting almost 17 minutes for the quota to reset.

## Deployment Checklist

- [ ] Add page-level lazy loading for the recommended pages.
- [ ] Confirm the report-list API supports pagination before reducing the `limit`.
- [ ] Replace or slow the 10-second report polling.
- [ ] Load full notification data only from the pages that need it.
- [ ] Test with multiple administrator sessions on the same network.
- [ ] Test temporary backend failure and recovery to verify retries remain controlled.
- [ ] Run the production build and test suite before deployment.

## Validation Completed

The production website build completed successfully during the review. No production source code was changed as part of the investigation.
