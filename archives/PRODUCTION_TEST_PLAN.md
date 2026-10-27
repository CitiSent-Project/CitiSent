# CitiSent — Manual Production Test Plan

> **Version**: 1.0.0  
> **Status**: Ready for Pre-Deployment QA  
> **Target Environment**: Staging & Production Verification  
> **Maintainer**: CitiSent Development & QA Engineering Team

---

## 1. How to Use This Plan

1. **Pre-Deployment Execution**: Run through each section sequentially on the staging environment before approving production deployment.
2. **Result Notation**: Mark each checklist item:
   - `[x] PASS` — Feature functions exactly as specified with zero anomalies.
   - `[ ] FAIL` — Defect observed. Document steps to reproduce, HTTP status codes, browser console logs, and screenshots.
   - `[ ] SKIP` — Not applicable to the current test iteration (must include reason).
3. **Sign-Off Criteria**: 100% of critical paths (Auth, Role Isolation, Report Creation, Realtime Socket Delivery) must pass with zero high-severity defects.

---

## 2. Authentication & Session Management

### 2.1 Citizen Login
- [ ] **Valid Credentials**: Submit valid email/username and password $\rightarrow$ Session token issued, user redirected to citizen home/dashboard.
- [ ] **Invalid Password**: Submit incorrect password $\rightarrow$ Returns HTTP 401 with generic "Incorrect password" message without leaking account details.
- [ ] **Non-Existent Identifier**: Submit unknown email/username $\rightarrow$ Returns HTTP 401 generic failure without confirming whether account exists.
- [ ] **Banned Account**: Attempt login with a banned user $\rightarrow$ Returns HTTP 403 Forbidden with "Your account has been banned" and reason if provided.
- [ ] **Session Persistence**: Refresh the browser / restart app $\rightarrow$ Authenticated state persists via secure token storage.
- [ ] **Token Expiry**: When JWT session token expires $\rightarrow$ Protected API requests return 401, frontend redirects gracefully to login view.

### 2.2 Administrator Login & Two-Factor Authentication (2FA)
- [ ] **Phase 1: Admin Challenge**: Submit admin credentials $\rightarrow$ Validates account is active Superadmin or Office Admin, issues temporary challenge token (valid 5 min), sends 6-digit OTP to registered email.
- [ ] **Non-Admin Rejection**: Attempt admin login with a citizen role $\rightarrow$ Returns HTTP 403 Forbidden ("This account does not exist as an office admin or super admin").
- [ ] **Phase 2: Correct OTP Verification**: Enter correct 6-digit OTP $\rightarrow$ Returns authenticated admin session, records `ADMIN_LOGIN_SUCCESS` audit log.
- [ ] **Incorrect OTP**: Enter incorrect 6-digit OTP $\rightarrow$ Returns HTTP 400 Bad Request, records `ADMIN_LOGIN_FAILED_OTP` audit log, keeps challenge active.
- [ ] **OTP Rate Limiting**: Request OTP resend rapidly $\rightarrow$ Enforces 60-second cooldown period before allowing resend.
- [ ] **Expired Challenge**: Enter OTP after 5 minutes $\rightarrow$ Rejects with "Your verification code session has expired. Please sign in again."

### 2.3 Registration & Rate Limiting
- [ ] **Citizen Registration**: Register with valid name, email, password, and mobile number $\rightarrow$ Account created, password hashed, activation status active.
- [ ] **Duplicate Email/Username**: Register with existing email $\rightarrow$ Returns HTTP 409 Conflict with friendly explanation.
- [ ] **Name Whitespace Normalization**: Register with leading/trailing spaces in names $\rightarrow$ Input automatically trimmed and validated.
- [ ] **IP & Endpoint Rate Limiting**: Trigger more than 15 registration attempts within 15 minutes $\rightarrow$ Returns HTTP 429 Too Many Requests with `Retry-After` header.

### 2.4 Logout
- [ ] **Sign Out**: Click logout $\rightarrow$ Clears tokens from memory and local storage, redirects immediately to login.
- [ ] **History Traversal**: Click browser Back button after logout $\rightarrow$ Cannot navigate back into protected dashboard; redirected back to login.

---

## 3. Authorization & Access Control

### 3.1 Role Boundaries
- [ ] **Citizen Route Restrictions**: Direct HTTP request to `/api/v1/admin/*` using citizen JWT $\rightarrow$ Returns HTTP 403 Forbidden.
- [ ] **Office Admin Boundaries**: Office Admin attempts Superadmin actions (e.g., Ban Citizen, Delete User, Create Admin, Assign Department) $\rightarrow$ Returns HTTP 403 Forbidden.
- [ ] **Superadmin Full Access**: Superadmin can view and administer all departments, user accounts, and system settings.

### 3.2 Department Data Isolation
- [ ] **Department-Scoped Reports**: Office Admin only sees reports categorized under their assigned agency/department.
- [ ] **Transfer Request Scoping**: Office Admin only sees their own pending transfer request; Superadmin sees all transfer requests across agencies.
- [ ] **PII Masking**: Citizen email addresses on the general reports table display masked values; full contact information is only visible to authorized handlers who click to view PII, creating an audit log.

---

## 4. Reports Lifecycle & Integrity

### 4.1 Report Submission
- [ ] **Valid Submission**: Citizen submits title, issue type, description, location (with latitude/longitude), and optional photo $\rightarrow$ Report created with unique alphanumeric report number.
- [ ] **Turnstile CAPTCHA (Guest Submissions)**: Guest report submitted without Cloudflare Turnstile token $\rightarrow$ Rejection with HTTP 403 `CAPTCHA_REQUIRED`. Valid token allows creation.
- [ ] **Idempotent Duplicate Prevention**: Re-submitting the exact same report payload within 120 seconds $\rightarrow$ Returns existing report record rather than creating a duplicate database entry.
- [ ] **AI Sentiment & Urgency Classification**:
  - AI Service Online $\rightarrow$ Report urgency classified as Critical, High, Medium, or Low with sentiment score and AI summary.
  - AI Service Offline/Timed Out $\rightarrow$ Automatically falls back to "Medium" urgency without failing report creation; warning logged in backend.

### 4.2 Status Transitions
- [ ] **Lifecycle Progression**: Status transitions follow `pending` $\rightarrow$ `in_review` $\rightarrow$ `resolved` or `rejected`.
- [ ] **Permanent Lock**: Once marked `resolved` or `rejected`, report is permanently locked against further status modifications.
- [ ] **Audit Trail**: Every status change creates a non-blocking `UPDATE_REPORT_STATUS` activity log record.

---

## 5. Realtime 2-Way Messaging & Socket Feeds

### 5.1 Report Conversation Thread
- [ ] **Send Message**: Either Citizen or Department Admin sends a message in the report thread $\rightarrow$ Message saved in database and instantly appears in the active thread.
- [ ] **Realtime Delivery**: Message delivered via Socket.IO room `report:<reportId>` without requiring page refresh.
- [ ] **Unread Indicators**: When admin sends a message, citizen's report item shows an unread admin message badge. Opening conversation marks messages as read.
- [ ] **Socket Disconnect Fallback**: If WebSocket connection drops, sending a message automatically falls back to HTTP REST API (`/reports/:id/messages`).

---

## 6. Realtime Notifications

### 6.1 Event Triggers & Delivery
- [ ] **Report Status Updated**: Changing report status sends real-time notification to reporter's personal room `user:<userId>`.
- [ ] **New Chat Message**: Message from admin creates notification for citizen, and vice versa.
- [ ] **Notification Drawer**: Bell icon shows badge count; clicking bell opens notification panel.
- [ ] **Mark as Read**: Clicking a notification updates read state in database and emits `notification_updated` event.
- [ ] **Clear All**: Clicking "Clear All" clears notifications and updates badge counter to 0.

---

## 7. Administrative & Department Operations

### 7.1 Citizen Moderation
- [ ] **Ban User**: Superadmin bans a citizen with a specific reason $\rightarrow$ Ban logged in `banned_users`, user session invalidated, `BAN_USER` activity log recorded.
- [ ] **Unban User**: Superadmin unbans user $\rightarrow$ Active ban deactivated, `UNBAN_USER` activity log recorded, user can log in again.
- [ ] **Bulk Moderation**: Superadmin selects multiple users for bulk ban/unban $\rightarrow$ Processed in single transactional operation with audit logging.

### 7.2 Department Administration
- [ ] **Create Department**: Superadmin creates new department with unique slug, name, and optional logo $\rightarrow$ Department created, `CREATE_DEPARTMENT` audit log recorded.
- [ ] **Update & Toggle Active State**: Deactivating a department removes it from citizen report category pickers while retaining historical report records.
- [ ] **Logo Upload & Removal**: Uploading a department image sets public URL; removing logo returns department to default SVG icon.

### 7.3 Analytics Dashboard
- [ ] **Summary Cards**: Displays Total Users, Ongoing Reports, Reports Resolved, and Total Reports matching backend aggregates.
- [ ] **Weekly Trend Chart**: Renders 7-day distribution of reports by status.
- [ ] **Category Pie Chart**: Displays reports distributed across departments.
- [ ] **CSV Export**: Clicking "Export CSV" downloads formatted metrics without errors.

---

## 8. Resilience, Recovery & Error Handling

### 8.1 Network & Backend Failures
- [ ] **API Offline Banner**: If backend server is unreachable $\rightarrow$ Frontend displays `BackendUnavailablePanel` with clear message and "Retry Connection" button (no blank white screen).
- [ ] **Slow Network**: Requests exceeding timeout threshold fail cleanly with user-friendly retry toast instead of freezing the interface.
- [ ] **Redis Fallback**: If Redis cache is down $\rightarrow$ `CacheService` seamlessly falls back to local memory cache without throwing errors to API clients.

---

## 9. Accessibility (WCAG 2.1 AA) & UX Verification

- [ ] **Focus Visible**: Tabbing through buttons, links, and form fields displays a clear 2px blue focus ring (`:focus-visible`).
- [ ] **Keyboard Navigation**: Entire login, dashboard, and report detail flows can be operated using only Tab, Shift+Tab, Enter, and Escape.
- [ ] **Contrast Compliance**: Text colors across both Light and Dark themes satisfy minimum 4.5:1 contrast ratio against card backgrounds.
- [ ] **Screen Reader Labels**: Icon-only buttons have descriptive `aria-label`s; images include contextual `alt` attributes.
- [ ] **Reduced Motion**: Enabling OS reduced-motion preference disables shimmers, slide-ins, and complex transitions.

---

## 10. QA Sign-Off

| Milestone | Tester / Engineer | Date | Result | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Staging Smoke Test** | | | | |
| **Security & Role Audit** | | | | |
| **Accessibility Audit** | | | | |
| **Production Pre-Flight** | | | | |
