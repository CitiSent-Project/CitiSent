# Settings Branched Sidebar Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the Settings navigator in the admin sidebar into a collapsible branched menu matching the Reports menu layout, connect direct routing to each settings section, and modernize the Settings page header.

**Architecture:** Extend page models (`pageModel.js`, `roleAccessModel.js`) with dedicated sub-page keys and URL routes for each of the six Settings sections (`Appearance`, `Security`, `Notifications`, `Report Management`, `Audit & Logs`, `System`). Generalize `Navbar.jsx`'s `NavOption` component so any menu item with children (Reports and Settings) supports collapsible accordion navigation and child selection. Update `pageRouterController.jsx` and `Settings.jsx` to synchronize the active section with sidebar navigation while maintaining state persistence in storage and preserving all existing preferences and behaviors.

**Tech Stack:** React 19, Vite, Framer Motion, Tailwind CSS / Vanilla CSS, Vitest.

**Spec:** User requirements from chat session: branched sidebar navigation mirroring Reports navigator, no broken existing features, website theme preserved.

## Global Constraints
- Preserve all existing preference saving and loading (`ADMIN_STORAGE_KEYS.settingsActiveTab`, `DEFAULT_PREFERENCES`).
- Maintain existing dark/light theme classes and color palette (`#0c1322` sidebar, `#2563eb` accent).
- Do not break existing page navigation or route handling for other pages.
- Ensure all 184 existing tests in `CitiSent-Website` continue to pass.

## Review Focus
1. Active state highlighting: Ensure the parent `Settings` item shows active/selected whenever any child section is active.
2. Sidebar collapse behavior: In collapsed desktop sidebar mode (`w-18`), ensure tooltips/icons behave gracefully without overflow.
3. Direct URL deep linking: Navigating directly to `/settings/security` or `/settings/system` loads the correct section immediately.
4. Role permission access: Both `Superadmin` and `Office Admin` roles must have permission to access all `Settings:*` pages.
5. In-page transitions: Switching between settings sections remains instantaneous without unnecessary re-mounting of preferences state.

---

### Task 1: Extend Page Model and Role Access for Settings Sections

**Files:**
- Modify: `CitiSent-Website/src/models/pageModel.js`
- Modify: `CitiSent-Website/src/models/roleAccessModel.js`
- Test: `CitiSent-Website/src/controllers/__tests__/navigationController.test.js`

**Interfaces:**
- Produces:
  - `APP_PAGES.SETTINGS_APPEARANCE`
  - `APP_PAGES.SETTINGS_SECURITY`
  - `APP_PAGES.SETTINGS_NOTIFICATIONS`
  - `APP_PAGES.SETTINGS_REPORT_MANAGEMENT`
  - `APP_PAGES.SETTINGS_AUDIT_LOGS`
  - `APP_PAGES.SETTINGS_SYSTEM`
  - `SETTINGS_SECTIONS`: mapping and helpers between page keys and tab names

- [ ] **Step 1: Write test for Settings page models and role access**

Add assertions in `CitiSent-Website/src/controllers/__tests__/navigationController.test.js` verifying that `canAccessPage` returns `true` for Superadmin and Office Admin for all `SETTINGS_*` sub-pages.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/controllers/__tests__/navigationController.test.js`
Expected: FAIL due to undefined `APP_PAGES.SETTINGS_APPEARANCE`.

- [ ] **Step 3: Define page keys and routes in `pageModel.js`**

Add constants to `APP_PAGES` and `PAGE_ROUTES` in `CitiSent-Website/src/models/pageModel.js`:
- `SETTINGS_APPEARANCE`: `'Settings:Appearance'`, route: `'/settings/appearance'`
- `SETTINGS_SECURITY`: `'Settings:Security'`, route: `'/settings/security'`
- `SETTINGS_NOTIFICATIONS`: `'Settings:Notifications'`, route: `'/settings/notifications'`
- `SETTINGS_REPORT_MANAGEMENT`: `'Settings:Report Management'`, route: `'/settings/report-management'`
- `SETTINGS_AUDIT_LOGS`: `'Settings:Audit & Logs'`, route: `'/settings/audit-logs'`
- `SETTINGS_SYSTEM`: `'Settings:System'`, route: `'/settings/system'`

- [ ] **Step 4: Update `roleAccessModel.js` with new page keys**

Include the new `APP_PAGES.SETTINGS_*` entries in `ROLE_PAGE_ACCESS[USER_ROLES.SUPERADMIN]` and `ROLE_PAGE_ACCESS[USER_ROLES.OFFICE_ADMIN]`.

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run src/controllers/__tests__/navigationController.test.js`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add CitiSent-Website/src/models/pageModel.js CitiSent-Website/src/models/roleAccessModel.js CitiSent-Website/src/controllers/__tests__/navigationController.test.js
git commit -m "feat(navigation): add settings section page keys and role access"
```

---

### Task 2: Generalize Navbar for Branched Settings Navigation

**Files:**
- Modify: `CitiSent-Website/src/components/ui/Navbar.jsx`
- Create / Modify: `CitiSent-Website/src/components/ui/__tests__/Navbar.test.jsx`

**Interfaces:**
- Consumes: `APP_PAGES.SETTINGS_*` from `pageModel.js`
- Produces: Branched sidebar navigation for both `Reports` and `Settings`.

- [ ] **Step 1: Write test for Navbar branched settings rendering**

Create or add to `CitiSent-Website/src/components/ui/__tests__/Navbar.test.jsx` verifying that:
1. `Settings` renders with a chevron icon and child links.
2. Clicking child items (e.g., "Security") calls `onNavigate` with `APP_PAGES.SETTINGS_SECURITY`.
3. The parent `Settings` item displays active state when `activePage` is `APP_PAGES.SETTINGS_SECURITY`.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/ui/__tests__/Navbar.test.jsx`
Expected: FAIL (Settings does not currently have children).

- [ ] **Step 3: Refactor `NavOption` and `navItems` in `Navbar.jsx`**

1. In `navItems`, add `children` to `Settings`:
   - `By Category` -> `APP_PAGES.SETTINGS_APPEARANCE`
   - `Security` -> `APP_PAGES.SETTINGS_SECURITY`
   - `Notifications` -> `APP_PAGES.SETTINGS_NOTIFICATIONS`
   - `Report Management` -> `APP_PAGES.SETTINGS_REPORT_MANAGEMENT`
   - `Audit & Logs` -> `APP_PAGES.SETTINGS_AUDIT_LOGS`
   - `System` -> `APP_PAGES.SETTINGS_SYSTEM`
2. Generalize `NavOption`:
   Replace hardcoded `isReportsSection` with generic branch active detection:
   ```javascript
   const isChildActive = Boolean(item.children?.some((child) => child.pageKey === activePage))
   const isSectionActive = activePage === item.pageKey || activePage.startsWith(`${item.pageKey}:`) || isChildActive
   const isSelected = hasChildren ? isSectionActive : activePage === item.pageKey
   const [submenuOpen, setSubmenuOpen] = useState(hasChildren && isSectionActive)
   ```
3. In `handleClick`:
   When clicking a parent with children: if not currently in this section, navigate to `item.children[0].pageKey` and expand. If already in section, toggle expand/collapse.

- [ ] **Step 4: Run Navbar tests to verify they pass**

Run: `npx vitest run src/components/ui/__tests__/Navbar.test.jsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add CitiSent-Website/src/components/ui/Navbar.jsx CitiSent-Website/src/components/ui/__tests__/Navbar.test.jsx
git commit -m "feat(ui): implement branched settings menu in sidebar"
```

---

### Task 3: Synchronize Page Router and Settings Page Layout

**Files:**
- Modify: `CitiSent-Website/src/controllers/navigation/pageRouterController.jsx`
- Modify: `CitiSent-Website/src/frontend/Pages/Settings.jsx`
- Create / Modify: `CitiSent-Website/src/frontend/Pages/__tests__/Settings.test.jsx`

**Interfaces:**
- Consumes: `activePage` from orchestrator, `APP_PAGES.SETTINGS_*`
- Produces: Seamless display of requested section with clean header & persistent local storage.

- [ ] **Step 1: Write test for Settings active section synchronization**

Add test in `Settings.test.jsx` verifying that passing a specific section (e.g. `Security` or `APP_PAGES.SETTINGS_SECURITY`) renders the corresponding tab content and header breadcrumb.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/frontend/Pages/__tests__/Settings.test.jsx`
Expected: FAIL.

- [ ] **Step 3: Update `pageRouterController.jsx`**

Map all `APP_PAGES.SETTINGS_*` cases to render `<Settings />` with the appropriate `section`:
- `APP_PAGES.SETTINGS_APPEARANCE` -> `'Appearance'`
- `APP_PAGES.SETTINGS_SECURITY` -> `'Security'`
- `APP_PAGES.SETTINGS_NOTIFICATIONS` -> `'Notifications'`
- `APP_PAGES.SETTINGS_REPORT_MANAGEMENT` -> `'Report Management'`
- `APP_PAGES.SETTINGS_AUDIT_LOGS` -> `'Audit & Logs'`
- `APP_PAGES.SETTINGS_SYSTEM` -> `'System'`
- `APP_PAGES.SETTINGS` -> default fallback to storage tab or `'Appearance'`

- [ ] **Step 4: Update `Settings.jsx` header layout**

1. Accept `section` / `activeSection` prop and synchronize with `activeTab` state and `onNavigate`.
2. Enhance the header with a clean section indicator (e.g., `Settings / Security`) and descriptive subtitle.
3. Keep the quick-switch pills or streamline them so navigation is clean and responsive.
4. Ensure `SystemSettingsTab`'s `onOpenActivityLogs` navigates to `APP_PAGES.SETTINGS_AUDIT_LOGS`.

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run src/frontend/Pages/__tests__/Settings.test.jsx`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add CitiSent-Website/src/controllers/navigation/pageRouterController.jsx CitiSent-Website/src/frontend/Pages/Settings.jsx CitiSent-Website/src/frontend/Pages/__tests__/Settings.test.jsx
git commit -m "feat(settings): synchronize page router and enhance settings header layout"
```

---

### Task 4: Full Suite Regression Verification

**Files:**
- Test: All tests across `CitiSent-Website`

- [ ] **Step 1: Run full test suite**

Run: `npm test` in `CitiSent-Website`
Expected: All 184+ tests pass with 0 failures.

- [ ] **Step 2: Run linter and type-check**

Run: `npm run lint` in `CitiSent-Website`
Expected: 0 errors or warnings.

- [ ] **Step 3: Commit final polish if needed**

```bash
git status
```
