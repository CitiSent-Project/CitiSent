# Real-Time Report Updates and Load Optimization Plan

## Objective

Make the CitiSent website receive newly created and updated reports in near real time without returning to 10-second polling, while preserving authorization, reducing API traffic, and keeping the mobile and AI services compatible.

The implementation must treat REST as the source of truth. Socket.IO events are lightweight invalidation signals; clients must refetch authorized data through existing REST endpoints after receiving an event.

## Investigation findings

### CitiSent-Website

- The website already has a singleton Socket.IO client in `src/services/socket/socketService.js`.
- Conversation components already subscribe and clean up Socket.IO listeners.
- Reports and User Profile previously used 10-second React Query polling. The current optimization changes replaced polling with manual refresh, which is a suitable fallback for the real-time design.
- Report list queries currently request large datasets and perform client-side filtering/pagination. Server-driven pagination remains a separate contract decision and must not be mixed into the event work.

### backend

- Socket.IO is initialized from `src/server.js` and authenticated with the Supabase access token in `src/realtime/socket.js`.
- Existing rooms are `user:<userId>` and `report:<reportId>`.
- Existing Socket.IO events are conversation-specific: messages, typing, and read state.
- The backend has `emitToUser` and `emitToReportRoom`, but no report-feed event or scoped administrator feed rooms.
- Report creation/update flows exist in `modules/reports/reports.service.js`; administrator status updates exist in `modules/admin/admin.service.js`.
- Socket authentication currently reads the Supabase user role. The implementation must verify that this is sufficient for department-scoped administrator authorization before using it for feed-room membership.

### CitiSent-Mobile

- The mobile app already has a Socket.IO client and uses the same conversation event names.
- My Reports already uses database-level pagination and pull-to-refresh.
- Mobile does not currently subscribe to a report-list change event.
- Unknown new event names will be ignored, so adding a server event is backward-compatible. Mobile should only be changed if product requirements require the My Reports list to update automatically.

### ai-sentiment

- `ai-sentiment` exposes HTTP endpoints for sentiment and suggestion generation.
- It has no Socket.IO client/server or report-list ownership.
- No changes are required unless a later requirement explicitly makes AI analysis asynchronous, which is outside this plan.

## Target event contract

Introduce one server-to-client event for report-list invalidation:

```js
"report_feed_changed"
{
  reportId: string,
  changeType: "created" | "updated" | "deleted",
  scope: "user" | "department" | "global",
  scopeId: string | null,
  occurredAt: string
}
```

The payload must not include the complete report row. It must not reveal report content, reporter details, or unauthorized department information. If scope metadata itself would reveal sensitive information, use separate room-targeted events with a minimal payload instead.

The event is advisory and ephemeral. A reconnecting client must refetch its active report query because Socket.IO does not guarantee delivery while disconnected.

## Implementation phases

### Phase 1: Define and verify authorization boundaries

1. Document which users should receive each report change:
   - The report owner receives changes to their own report.
   - Superadmins receive all report-feed changes.
   - Office administrators receive only changes in their authorized department scope.
2. Confirm the authoritative role and department source used by HTTP requests. Reuse the existing actor/profile authorization logic; do not trust a client-provided room name.
3. Add server-side room membership during socket connection or through a server-validated `join_report_feed` event.
4. Keep conversation `report:<reportId>` rooms separate from report-list feed rooms.
5. Add a server-side authorization test proving that an office administrator cannot join or receive another department’s feed.

### Phase 2: Add backend report-change events

1. Create a small report-event module responsible for publishing change notifications.
2. Emit only after successful database writes:
   - Citizen report creation/update/delete from the report service.
   - Administrator status updates from the admin service.
3. Publish to user and authorized feed rooms using the existing Socket.IO instance helpers, extended only as needed for validated scoped rooms.
4. Do not emit from AI sentiment calls, before persistence succeeds, or from failed transactions.
5. Add event IDs or timestamps if needed for diagnostics and duplicate-event handling.
6. Avoid introducing a circular dependency between `socket.js`, report services, and message services. Keep the event publisher independent from request controllers.

### Phase 3: Add website subscription and cache invalidation

1. Add a reusable website hook/service, for example `useReportRealtime`, that:
   - Obtains the existing singleton socket.
   - Registers one stable `report_feed_changed` listener.
   - Removes the listener on unmount.
   - Refetches only while the relevant page is mounted and visible.
2. In Reports, invalidate the active `admin-reports` query after a matching event.
3. In User Profile, invalidate only when the event belongs to the selected user.
4. Debounce events arriving in a short burst so several report creations cause one REST refresh.
5. Refetch once after socket reconnection to recover missed events.
6. Retain manual Refresh controls for offline recovery and user control.
7. Keep query-level retries disabled for these list refreshes; do not retry 429 responses automatically.

### Phase 4: Protect the socket from becoming a new source of load

1. Initialize one socket connection per authenticated website session, not one per component or report row.
2. Ensure every listener has symmetric cleanup and is not registered repeatedly during renders.
3. Bound reconnection backoff and avoid aggressive reconnect loops during outages.
4. Do not send full report lists or report bodies over Socket.IO.
5. Add counters for socket connections, reconnects, emitted feed events, dropped events, and event-triggered REST refreshes.

### Phase 5: Cross-repository compatibility decision

#### Backend: required

Backend changes are required because it owns the report mutations and Socket.IO event emission.

Tests must cover event emission after successful create/update/delete, no emission after failed writes, scope targeting, and compatibility with existing conversation events.

#### CitiSent-Website: required

Website changes are required for feed subscription, React Query invalidation, reconnect recovery, debouncing, and listener cleanup.

#### CitiSent-Mobile: conditional

Initially make no mobile source changes. The mobile client can ignore `report_feed_changed`, and existing conversation events remain unchanged.

Only change mobile if the requirement includes real-time updates to the citizen’s My Reports list. If required:

1. Add a user-scoped listener in the existing singleton socket/state layer.
2. Trigger one paginated `reloadMyReports()` and count refresh after a matching event.
3. Debounce events and refetch on reconnect.
4. Preserve pull-to-refresh and existing optimistic update behavior.
5. Add mobile tests for listener cleanup, user scoping, reconnect refresh, and no duplicate reloads.

Do not add a second Supabase subscription for the same report feed unless the existing database authorization policy is explicitly verified.

#### ai-sentiment: no changes expected

Do not modify `ai-sentiment`. Sentiment analysis remains a backend-controlled HTTP dependency. Real-time report-feed events must be emitted only after the backend has completed any required analysis and persisted the report.

## Testing plan

### Backend

- Unit-test event payload construction.
- Test create/update/delete event behavior with mocked Socket.IO emitters.
- Test department and user room targeting.
- Test unauthorized room-join attempts.
- Test existing conversation socket tests remain unchanged.
- Run `npm test` and `npm run check`.

### Website

- Test event listener registration and cleanup.
- Test matching events invalidate only the intended query.
- Test event bursts produce one refetch.
- Test reconnect triggers one recovery refetch.
- Test manual Refresh continues to work while disconnected.
- Run the complete Vitest suite, lint, and production build.

### Mobile

- First run existing tests/build checks without changes.
- If mobile integration is approved, add targeted listener tests and run the Expo checks appropriate to the repository.

### AI service

- Run its existing Python test suite unchanged to confirm no indirect API contract regression.

## Load and reliability validation

Run a shared-office scenario with multiple website sessions:

- Idle report pages must generate zero periodic list requests.
- One report creation should cause at most one debounced refresh per relevant active page.
- Unrelated department pages must not refresh.
- During a socket outage, clients must recover with one refetch after reconnect or manual refresh.
- During a backend outage, socket reconnection must not create an unbounded request storm.
- Compare report-list requests/minute, payload volume, database duration, and 429 responses against the pre-change baseline.

## Rollout and rollback

1. Ship backend event publishing behind a feature flag or disabled-by-default configuration if the deployment system supports it.
2. Deploy website subscription support with manual refresh still available.
3. Enable events for a small administrator cohort.
4. Monitor event-triggered refresh volume, reconnects, authorization errors, and 429s.
5. Roll back by disabling website subscriptions; REST/manual refresh remains functional.

Do not change the existing rate-limit maximum until measured event-triggered traffic confirms that request volume is stable.

## Definition of done

- Newly created or updated reports appear on relevant open website pages without 10-second polling.
- Report data is still fetched through authorized REST endpoints.
- No unauthorized user receives report-feed events.
- Existing conversation real-time behavior remains intact.
- Mobile and AI services pass their existing checks without unnecessary source changes.
- Website, backend, and any conditionally changed mobile tests/builds pass.
- Metrics demonstrate lower request volume than the previous polling implementation.
