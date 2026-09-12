# CitiSent DPA 2012 Compliance Plan

This document outlines the implementation plan for bringing the CitiSent system into full compliance with the Data Privacy Act (DPA) 2012. It is divided into priority-based sprints.

---

## Sprint 1: Critical Compliance & Data Protection (✅ COMPLETED)

This sprint addressed the most urgent (Tier 1) vulnerabilities.

### Beginner-Friendly Overview

1. **Securing Uploaded Photos (Attachments):** Changed the storage folder to "private" and used temporary "signed URLs" so only authorized users can view uploaded photos, preventing unauthorized public access.
2. **Protecting Citizen Identities from AI:** Added a filter that automatically redacts phone numbers and email addresses (replacing them with `[REDACTED]`) before the AI (Gemini) reads the report description.
3. **Complete Data Removal on Account Deletion (Right to be Forgotten):** Ensured that when a user deletes their account, their personal details are permanently wiped from all past reports, making the retained statistical data completely anonymous.
4. **Clear Privacy Rules (Privacy Policy & Consent):** Created a clear "Privacy Policy" page on the web portal and added a mandatory "I agree" checkbox to the guest OTP reporting flow in the mobile app.

### Modifications Made

- **[MODIFIED]** `backend/src/modules/reports/reports.repository.js`: Updated to generate 1-hour Signed URLs for attachments.
- **[MODIFIED]** `ai-sentiment/ai.py`: Added `redact_pii` regex logic before Gemini processing.
- **[MODIFIED]** `backend/src/modules/users/users.repository.js`: Added query to set `user_id = null` on reports when an account is deleted.
- **[NEW]** `CitiSent-Web/src/pages/PrivacyPolicy.jsx`: Created the Data Privacy Policy page.
- **[MODIFIED]** `CitiSent-Mobile/components/auth/GuestVerificationModal.jsx`: Added mandatory consent checkbox.

---

## Sprint 2: Data Portability & Audit Trails (📝 DRAFT)

This sprint focuses on Tier 2 compliance issues: giving users access to their data and tracking who views sensitive information.

### Beginner-Friendly Overview

1. **Right to Data Portability (Data Export):**
   - **Current State:** Citizens submit reports, but there isn't an easy way for them to download a copy of all their data.
   - **What We Will Do:** Add a "Download My Data" feature. This will bundle a user's profile and all their past reports into a clean, machine-readable file (JSON/CSV) that they can save to their device.

2. **Strict Audit Trails (Who Looked at What?):**
   - **Current State:** We track when an admin _changes_ a report status, but we do not strictly log when an admin _views_ a citizen's sensitive report details.
   - **What We Will Do:** We will implement an "Access Log." Every time an LGU staff member opens a specific report (which contains PII like names, emails, and exact locations), the system will secretly log this action in the `admin_activity_logs` table.

3. **Data Minimization (List Views):**
   - **Current State:** When admins view the massive list of all reports, the system might be sending too much sensitive data at once.
   - **What We Will Do:** We will ensure that the list view only shows the bare minimum (e.g., Issue Type, Urgency, Status). The admin must explicitly click into a report to see the full details, triggering the Audit Log.

### User Review Required

> [!IMPORTANT]
> **Audit Log Volume:** Logging every time an admin views a report will increase the number of records in your `admin_activity_logs` database table. Since this is just text data, it shouldn't be expensive, but it's important to know that the log will grow much faster now.

### Open Questions

> [!TIP]
>
> 1. **Data Export Format:** I am planning to export the citizen's data as a `.json` file because it is the industry standard for "machine-readable" data portability. Would you prefer a `.csv` (Excel-friendly) file instead, or is `.json` okay?
> 2. **Mobile or Web?** Should the "Download My Data" button be added to the Mobile App (for citizens), the Web Portal (if citizens log in there), or both?

### Proposed Changes

#### 1. Right to Data Portability

- **[NEW]** `backend/src/modules/users/users.controller.js` (and service/repository): Add endpoint `GET /users/me/export` to fetch and bundle user profile + reports.
- **[MODIFY]** `CitiSent-Mobile/app/profile/settings.jsx`: Add "Download My Data" button.

#### 2. Audit Trails for PII Access

- **[MODIFY]** `backend/src/modules/reports/reports.service.js`: Update `getReportById` to call `activityRepository.createActivityLogEntry` with action `"VIEW_REPORT_PII"`.

#### 3. Data Minimization

- **[MODIFY]** `backend/src/modules/reports/reports.repository.js`: Review the `list` method's SQL selection to exclude unnecessary PII fields like `email` or `name` in the bulk list view.

### Verification Plan

- **Data Export:** Log in to the mobile app, click "Download My Data", and verify the downloaded file contains the correct reports.
- **Audit Logs:** Log in to the admin web portal, click on 3 different reports. Check the database to ensure 3 new "VIEW_REPORT_PII" logs were created.
