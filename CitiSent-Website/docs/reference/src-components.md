# Src Components Reference

Scope: files grouped under src-components for CitiSent-Website.

## File: src/components/Account-Ui/index.js

- Purpose: Reusable UI component module used by pages or feature containers.
- Export Surface: Exports: ProfileSummaryCard, SettingsSectionCard, SettingToggleRow
- Imports: No explicit imports detected.
- Functions: None explicitly declared in this module.

## File: src/components/Account-Ui/ProfileSummaryCard.jsx

- Purpose: Reusable UI component module used by pages or feature containers.
- Export Surface: Exports: ProfileSummaryCard
- Imports: ../../models/data
- Functions Declared: 1

### Function: ProfileSummaryCard({ profile })

- Defined At: line 16
- Specific Purpose: Renders a UI section/component and wires props, event handlers, and visual state for the current view context.
- Inputs: Accepts: { profile }
- Output: Returns JSX elements (React render output) for the component subtree.
- Side Effects: No direct external side effects detected; behavior appears computation/render focused.
- Key Dependencies: ../../models/data
- Usage Scope: Exported symbol; intended for use by other modules importing this file.

## File: src/components/Account-Ui/SettingsSectionCard.jsx

- Purpose: Reusable UI component module used by pages or feature containers.
- Export Surface: Exports: SettingsSectionCard
- Imports: No explicit imports detected.
- Functions Declared: 1

### Function: SettingsSectionCard({ title, description, children })

- Defined At: line 1
- Specific Purpose: Renders a UI section/component and wires props, event handlers, and visual state for the current view context.
- Inputs: Accepts: { title, description, children }
- Output: Returns JSX elements (React render output) for the component subtree.
- Side Effects: Updates React/application state via setter calls.
- Key Dependencies: This function primarily relies on in-file logic and standard language/runtime features.
- Usage Scope: Exported symbol; intended for use by other modules importing this file.

## File: src/components/Account-Ui/SettingToggleRow.jsx

- Purpose: Reusable UI component module used by pages or feature containers.
- Export Surface: Exports: SettingToggleRow
- Imports: No explicit imports detected.
- Functions Declared: 1

### Function: SettingToggleRow({ title, description, checked, onChange })

- Defined At: line 1
- Specific Purpose: Renders a UI section/component and wires props, event handlers, and visual state for the current view context.
- Inputs: Accepts: { title, description, checked, onChange }
- Output: Returns JSX elements (React render output) for the component subtree.
- Side Effects: Updates React/application state via setter calls.
- Key Dependencies: This function primarily relies on in-file logic and standard language/runtime features.
- Usage Scope: Exported symbol; intended for use by other modules importing this file.

## File: src/components/AdminManagement-Ui/index.js

- Purpose: Reusable UI component module used by pages or feature containers.
- Export Surface: No explicit exports (or export detection not applicable).
- Imports: No explicit imports detected.
- Functions: None explicitly declared in this module.

## File: src/components/AdminManagement-Ui/OfficeAdminAssignmentsSection.jsx

- Purpose: Reusable UI component module used by pages or feature containers.
- Export Surface: Exports: OfficeAdminAssignmentsSection
- Imports: No explicit imports detected.
- Functions Declared: 1

### Function: OfficeAdminAssignmentsSection({

  totalOfficeUnread,
  searchTerm,
  onSearchTermChange,
  departmentFilter,
  onDepartmentFilterChange,
  departmentOptions,
  filteredOfficeAdmins,
  unreadByAdminId,
  getSelectedDepartmentId,
  onDraftDepartmentChange,
  onSaveAssignment,
})

- Defined At: line 1
- Specific Purpose: Renders a UI section/component and wires props, event handlers, and visual state for the current view context.
- Inputs: Accepts: {
  totalOfficeUnread, searchTerm, onSearchTermChange, departmentFilter, onDepartmentFilterChange, departmentOptions, filteredOfficeAdmins, unreadByAdminId, getSelectedDepartmentId, onDraftDepartmentChange, onSaveAssignment, }
- Output: Returns JSX elements (React render output) for the component subtree.
- Side Effects: No direct external side effects detected; behavior appears computation/render focused.
- Key Dependencies: This function primarily relies on in-file logic and standard language/runtime features.
- Usage Scope: Exported symbol; intended for use by other modules importing this file.

## File: src/components/AdminManagement-Ui/TransferRequestQueueSection.jsx

- Purpose: Reusable UI component module used by pages or feature containers.
- Export Surface: Exports: TransferRequestQueueSection
- Imports: No explicit imports detected.
- Functions Declared: 1

### Function: TransferRequestQueueSection({

  filteredPendingRequests,
  unreadByAdminId,
  onOpenApprovalModal,
  onOpenRejectionModal,
})

- Defined At: line 1
- Specific Purpose: Renders a UI section/component and wires props, event handlers, and visual state for the current view context.
- Inputs: Accepts: {
  filteredPendingRequests, unreadByAdminId, onOpenApprovalModal, onOpenRejectionModal, }
- Output: Returns JSX elements (React render output) for the component subtree.
- Side Effects: Triggers network/API I/O.
- Key Dependencies: This function primarily relies on in-file logic and standard language/runtime features.
- Usage Scope: Exported symbol; intended for use by other modules importing this file.

## File: src/components/AdminManagement-Ui/TransferReviewModal.jsx

- Purpose: Reusable UI component module used by pages or feature containers.
- Export Surface: Exports: TransferReviewModal
- Imports: No explicit imports detected.
- Functions Declared: 1

### Function: TransferReviewModal({

  reviewModal,
  reviewModalRef,
  reviewNotes,
  reviewError,
  onClose,
  onSubmit,
  onReviewNotesChange,
})

- Defined At: line 1
- Specific Purpose: Renders a UI section/component and wires props, event handlers, and visual state for the current view context.
- Inputs: Accepts: {
  reviewModal, reviewModalRef, reviewNotes, reviewError, onClose, onSubmit, onReviewNotesChange, }
- Output: Returns JSX elements (React render output) for the component subtree.
- Side Effects: No direct external side effects detected; behavior appears computation/render focused.
- Key Dependencies: This function primarily relies on in-file logic and standard language/runtime features.
- Usage Scope: Exported symbol; intended for use by other modules importing this file.

## File: src/components/Auth-Ui/AuthInputField.jsx

- Purpose: Reusable UI component module used by pages or feature containers.
- Export Surface: Exports: AuthInputField
- Imports: No explicit imports detected.
- Functions Declared: 1

### Function: AuthInputField({

  id,
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  error,
  disabled = false,
  variant = "default",
})

- Defined At: line 1
- Specific Purpose: Renders a UI section/component and wires props, event handlers, and visual state for the current view context.
- Inputs: Accepts: {
  id, label, type = "text", value, onChange, placeholder, error, disabled = false, variant = "default", }
- Output: Returns JSX elements (React render output) for the component subtree.
- Side Effects: No direct external side effects detected; behavior appears computation/render focused.
- Key Dependencies: This function primarily relies on in-file logic and standard language/runtime features.
- Usage Scope: Exported symbol; intended for use by other modules importing this file.

## File: src/components/Auth-Ui/AuthPageShell.jsx

- Purpose: Reusable UI component module used by pages or feature containers.
- Export Surface: Exports: AuthPageShell
- Imports: framer-motion, /assets/CitiSentLogo.svg
- Functions Declared: 1

### Function: AuthPageShell({

  title,
  subtitle,
  children,
  footer,
  variant = "default",
})

- Defined At: line 5
- Specific Purpose: Renders a UI section/component and wires props, event handlers, and visual state for the current view context.
- Inputs: Accepts: {
  title, subtitle, children, footer, variant = "default", }
- Output: Returns JSX elements (React render output) for the component subtree.
- Side Effects: No direct external side effects detected; behavior appears computation/render focused.
- Key Dependencies: framer-motion, /assets/CitiSentLogo.svg
- Usage Scope: Exported symbol; intended for use by other modules importing this file.

## File: src/components/Auth-Ui/AuthPasswordField.jsx

- Purpose: Reusable UI component module used by pages or feature containers.
- Export Surface: Exports: AuthPasswordField
- Imports: react, react-icons/fi
- Functions Declared: 1

### Function: AuthPasswordField({

  id,
  label,
  value,
  onChange,
  placeholder,
  error,
  variant = "default",
})

- Defined At: line 3
- Specific Purpose: Renders a UI section/component and wires props, event handlers, and visual state for the current view context.
- Inputs: Accepts: {
  id, label, value, onChange, placeholder, error, variant = "default", }
- Output: Returns JSX elements (React render output) for the component subtree.
- Side Effects: No direct external side effects detected; behavior appears computation/render focused.
- Key Dependencies: react, react-icons/fi
- Usage Scope: Exported symbol; intended for use by other modules importing this file.

## File: src/components/Auth-Ui/index.js

- Purpose: Reusable UI component module used by pages or feature containers.
- Export Surface: Exports: AuthInputField, AuthPageShell, AuthPasswordField
- Imports: No explicit imports detected.
- Functions: None explicitly declared in this module.

## File: src/components/Dashboard-Ui/DashboardStatCard.jsx

- Purpose: Reusable UI component module used by pages or feature containers.
- Export Surface: Exports: DashboardStatCard
- Imports: framer-motion, react-icons/fi
- Functions Declared: 1

### Function: DashboardStatCard({

  icon: Icon,
  label,
  value,
  trendValue,
  trendDirection,
  color = 'blue',
})

- Defined At: line 5
- Specific Purpose: Renders a UI section/component and wires props, event handlers, and visual state for the current view context.
- Inputs: Accepts: {
  icon: Icon, label, value, trendValue, trendDirection, color = 'blue', }
- Output: Returns JSX elements (React render output) for the component subtree.
- Side Effects: No direct external side effects detected; behavior appears computation/render focused.
- Key Dependencies: framer-motion, react-icons/fi
- Usage Scope: Exported symbol; intended for use by other modules importing this file.

## File: src/components/Dashboard-Ui/DashboardTableCard.jsx

- Purpose: Reusable UI component module used by pages or feature containers.
- Export Surface: Exports: DashboardTableCard
- Imports: framer-motion, ./ProfilePill
- Functions Declared: 1

### Function: DashboardTableCard({ title, columns, rows })

- Defined At: line 5
- Specific Purpose: Renders a UI section/component and wires props, event handlers, and visual state for the current view context.
- Inputs: Accepts: { title, columns, rows }
- Output: Returns JSX elements (React render output) for the component subtree.
- Side Effects: No direct external side effects detected; behavior appears computation/render focused.
- Key Dependencies: framer-motion, ./ProfilePill
- Usage Scope: Exported symbol; intended for use by other modules importing this file.

## File: src/components/Dashboard-Ui/index.js

- Purpose: Reusable UI component module used by pages or feature containers.
- Export Surface: No explicit exports (or export detection not applicable).
- Imports: No explicit imports detected.
- Functions: None explicitly declared in this module.

## File: src/components/Dashboard-Ui/Pie-Chart.jsx

- Purpose: Reusable UI component module used by pages or feature containers.
- Export Surface: Exports: PieChart
- Imports: chart.js, react-chartjs-2
- Functions Declared: 1

### Function: PieChart({ title, total, labels, values, colors, legend })

- Defined At: line 5
- Specific Purpose: Renders a UI section/component and wires props, event handlers, and visual state for the current view context.
- Inputs: Accepts: { title, total, labels, values, colors, legend }
- Output: Returns JSX elements (React render output) for the component subtree.
- Side Effects: No direct external side effects detected; behavior appears computation/render focused.
- Key Dependencies: chart.js, react-chartjs-2
- Usage Scope: Exported symbol; intended for use by other modules importing this file.

## File: src/components/Dashboard-Ui/ProfilePill.jsx

- Purpose: Reusable UI component module used by pages or feature containers.
- Export Surface: Exports: ProfilePill
- Imports: No explicit imports detected.
- Functions Declared: 1

### Function: ProfilePill({ label })

- Defined At: line 1
- Specific Purpose: Renders a UI section/component and wires props, event handlers, and visual state for the current view context.
- Inputs: Accepts: { label }
- Output: Returns JSX elements (React render output) for the component subtree.
- Side Effects: No direct external side effects detected; behavior appears computation/render focused.
- Key Dependencies: This function primarily relies on in-file logic and standard language/runtime features.
- Usage Scope: Exported symbol; intended for use by other modules importing this file.

## File: src/components/Dashboard-Ui/Vertical-Chart.jsx

- Purpose: Reusable UI component module used by pages or feature containers.
- Export Surface: Exports: VerticalChart
- Imports: react-chartjs-2
- Functions Declared: 1

### Function: VerticalChart({ title, labels, values })

- Defined At: line 12
- Specific Purpose: Renders a UI section/component and wires props, event handlers, and visual state for the current view context.
- Inputs: Accepts: { title, labels, values }
- Output: Returns JSX elements (React render output) for the component subtree.
- Side Effects: No direct external side effects detected; behavior appears computation/render focused.
- Key Dependencies: react-chartjs-2
- Usage Scope: Exported symbol; intended for use by other modules importing this file.

## File: src/components/Notifications-Ui/index.js

- Purpose: Reusable UI component module used by pages or feature containers.
- Export Surface: Exports: NotificationFilterChips, NotificationItem, NotificationsEmptyState
- Imports: No explicit imports detected.
- Functions: None explicitly declared in this module.

## File: src/components/Notifications-Ui/NotificationFilterChips.jsx

- Purpose: Reusable UI component module used by pages or feature containers.
- Export Surface: Exports: NotificationFilterChips
- Imports: No explicit imports detected.
- Functions Declared: 1

### Function: NotificationFilterChips({ activeFilter, onFilterChange })

- Defined At: line 2
- Specific Purpose: Renders a UI section/component and wires props, event handlers, and visual state for the current view context.
- Inputs: Accepts: { activeFilter, onFilterChange }
- Output: Returns JSX elements (React render output) for the component subtree.
- Side Effects: No direct external side effects detected; behavior appears computation/render focused.
- Key Dependencies: This function primarily relies on in-file logic and standard language/runtime features.
- Usage Scope: Exported symbol; intended for use by other modules importing this file.

## File: src/components/Notifications-Ui/NotificationItem.jsx

- Purpose: Reusable UI component module used by pages or feature containers.
- Export Surface: Exports: NotificationItem
- Imports: react-icons/fi, ../../models/data
- Functions Declared: 1

### Function: NotificationItem({ notification, onToggleRead })

- Defined At: line 3
- Specific Purpose: Renders a UI section/component and wires props, event handlers, and visual state for the current view context.
- Inputs: Accepts: { notification, onToggleRead }
- Output: Returns JSX elements (React render output) for the component subtree.
- Side Effects: No direct external side effects detected; behavior appears computation/render focused.
- Key Dependencies: react-icons/fi, ../../models/data
- Usage Scope: Exported symbol; intended for use by other modules importing this file.

## File: src/components/Notifications-Ui/NotificationsEmptyState.jsx

- Purpose: Reusable UI component module used by pages or feature containers.
- Export Surface: Exports: NotificationsEmptyState
- Imports: react-icons/fi
- Functions Declared: 1

### Function: NotificationsEmptyState()

- Defined At: line 2
- Specific Purpose: Renders a UI section/component and wires props, event handlers, and visual state for the current view context.
- Inputs: No explicit parameters; relies on closure/module context and imported dependencies.
- Output: Returns JSX elements (React render output) for the component subtree.
- Side Effects: No direct external side effects detected; behavior appears computation/render focused.
- Key Dependencies: react-icons/fi
- Usage Scope: Exported symbol; intended for use by other modules importing this file.

## File: src/components/Reports-Ui/AgencyCardsGrid.jsx

- Purpose: Reusable UI component module used by pages or feature containers.
- Export Surface: Exports: AgencyCardsGrid
- Imports: react-icons/fi
- Functions Declared: 1

### Function: AgencyCardsGrid({ items, selectedItemId, onSelectItem })

- Defined At: line 14
- Specific Purpose: Renders a UI section/component and wires props, event handlers, and visual state for the current view context.
- Inputs: Accepts: { items, selectedItemId, onSelectItem }
- Output: Returns JSX elements (React render output) for the component subtree.
- Side Effects: No direct external side effects detected; behavior appears computation/render focused.
- Key Dependencies: react-icons/fi
- Usage Scope: Exported symbol; intended for use by other modules importing this file.

## File: src/components/Reports-Ui/index.js

- Purpose: Reusable UI component module used by pages or feature containers.
- Export Surface: Exports: AgencyCardsGrid, Pagination, ReportsStatCards, UrgencyDoughnutChart, UrgencyFeedTable, UrgencyFilterChips
- Imports: No explicit imports detected.
- Functions: None explicitly declared in this module.

## File: src/components/Reports-Ui/ReportDetailPage.jsx

- Purpose: Reusable UI component module used by pages or feature containers.
- Export Surface: Exports: ReportDetailPage
- Imports: react, react-icons/fi, ../ui/toastHelpers, ../../controllers/reportAccessController
- Functions Declared: 2

### Function: ReportDetailPage({ report, profile, onBackToReports, onUpdateStatus })

- Defined At: line 22
- Specific Purpose: Renders a UI section/component and wires props, event handlers, and visual state for the current view context.
- Inputs: Accepts: { report, profile, onBackToReports, onUpdateStatus }
- Output: Returns JSX elements (React render output) for the component subtree.
- Side Effects: No direct external side effects detected; behavior appears computation/render focused.
- Key Dependencies: react, react-icons/fi, ../ui/toastHelpers, ../../controllers/reportAccessController
- Usage Scope: Exported symbol; intended for use by other modules importing this file.

### Function: handleStatusChange(newStatus)

- Defined At: line 56
- Specific Purpose: Handles an interaction/event branch and coordinates the feature-specific logic path for this module.
- Inputs: Accepts: newStatus
- Output: Returns a module-specific value based on current parameters and internal logic.
- Side Effects: Updates React/application state via setter calls. Publishes user-facing toast/notification feedback.
- Key Dependencies: react, react-icons/fi, ../ui/toastHelpers, ../../controllers/reportAccessController
- Usage Scope: Internal helper; intended to be used only within this module.

## File: src/components/Reports-Ui/ReportsStatCards.jsx

- Purpose: Reusable UI component module used by pages or feature containers.
- Export Surface: Exports: ReportsStatCards
- Imports: react-icons/fi
- Functions Declared: 1

### Function: ReportsStatCards({ stats })

- Defined At: line 14
- Specific Purpose: Renders a UI section/component and wires props, event handlers, and visual state for the current view context.
- Inputs: Accepts: { stats }
- Output: Returns JSX elements (React render output) for the component subtree.
- Side Effects: No direct external side effects detected; behavior appears computation/render focused.
- Key Dependencies: react-icons/fi
- Usage Scope: Exported symbol; intended for use by other modules importing this file.

## File: src/components/Reports-Ui/UrgencyDoughnutChart.jsx

- Purpose: Reusable UI component module used by pages or feature containers.
- Export Surface: Exports: UrgencyDoughnutChart
- Imports: chart.js, react-chartjs-2
- Functions Declared: 1

### Function: UrgencyDoughnutChart({ title, total, labels, values, colors, legend })

- Defined At: line 5
- Specific Purpose: Renders a UI section/component and wires props, event handlers, and visual state for the current view context.
- Inputs: Accepts: { title, total, labels, values, colors, legend }
- Output: Returns JSX elements (React render output) for the component subtree.
- Side Effects: No direct external side effects detected; behavior appears computation/render focused.
- Key Dependencies: chart.js, react-chartjs-2
- Usage Scope: Exported symbol; intended for use by other modules importing this file.

## File: src/components/Reports-Ui/UrgencyFeedTable.jsx

- Purpose: Reusable UI component module used by pages or feature containers.
- Export Surface: Exports: UrgencyFeedTable
- Imports: react, ../ui/toastHelpers
- Functions Declared: 4

### Function: ActionMenu({ report, onViewReport, onUpdateStatus, canUpdateReport })

- Defined At: line 15
- Specific Purpose: Renders a UI section/component and wires props, event handlers, and visual state for the current view context.
- Inputs: Accepts: { report, onViewReport, onUpdateStatus, canUpdateReport }
- Output: Returns JSX elements (React render output) for the component subtree.
- Side Effects: Updates React/application state via setter calls.
- Key Dependencies: react, ../ui/toastHelpers
- Usage Scope: Internal helper; intended to be used only within this module.

### Function: handleOutside(e)

- Defined At: line 21
- Specific Purpose: Handles an interaction/event branch and coordinates the feature-specific logic path for this module.
- Inputs: Accepts: e
- Output: Returns a module-specific value based on current parameters and internal logic.
- Side Effects: Updates React/application state via setter calls. Publishes user-facing toast/notification feedback.
- Key Dependencies: react, ../ui/toastHelpers
- Usage Scope: Internal helper; intended to be used only within this module.

### Function: handleQuickStatus(status)

- Defined At: line 27
- Specific Purpose: Handles an interaction/event branch and coordinates the feature-specific logic path for this module.
- Inputs: Accepts: status
- Output: Returns a module-specific value based on current parameters and internal logic.
- Side Effects: Updates React/application state via setter calls. Publishes user-facing toast/notification feedback.
- Key Dependencies: react, ../ui/toastHelpers
- Usage Scope: Internal helper; intended to be used only within this module.

### Function: UrgencyFeedTable({ rows = [], onViewReport, onUpdateStatus, canUpdateReport })

- Defined At: line 98
- Specific Purpose: Renders a UI section/component and wires props, event handlers, and visual state for the current view context.
- Inputs: Accepts: { rows = [], onViewReport, onUpdateStatus, canUpdateReport }
- Output: Returns JSX elements (React render output) for the component subtree.
- Side Effects: No direct external side effects detected; behavior appears computation/render focused.
- Key Dependencies: react, ../ui/toastHelpers
- Usage Scope: Exported symbol; intended for use by other modules importing this file.

## File: src/components/Reports-Ui/UrgencyFilterChips.jsx

- Purpose: Reusable UI component module used by pages or feature containers.
- Export Surface: Exports: UrgencyFilterChips
- Imports: react-icons/fi
- Functions Declared: 1

### Function: UrgencyFilterChips({

  chips,
  selectedChip,
  onSelectChip,
  searchTerm,
  onSearchChange,
  statusFilter,
  statusOptions = ['All Status', 'Pending', 'In Progress', 'Resolved', 'Unresolved'],
  onStatusChange
})

- Defined At: line 2
- Specific Purpose: Renders a UI section/component and wires props, event handlers, and visual state for the current view context.
- Inputs: Accepts: {
  chips, selectedChip, onSelectChip, searchTerm, onSearchChange, statusFilter, statusOptions = ['All Status', 'Pending', 'In Progress', 'Resolved', 'Unresolved'], onStatusChange
}
- Output: Returns JSX elements (React render output) for the component subtree.
- Side Effects: No direct external side effects detected; behavior appears computation/render focused.
- Key Dependencies: react-icons/fi
- Usage Scope: Exported symbol; intended for use by other modules importing this file.

## File: src/components/Settings-Ui/AccountSettingsTab.jsx

- Purpose: Reusable UI component module used by pages or feature containers.
- Export Surface: Exports: AccountSettingsTab
- Imports: ../Account-Ui, ./FormInputField, ../../models/roleAccessModel
- Functions Declared: 3

### Function: AccountSettingsTab({

  profile,
  preferences,
  onUpdatePreference,
})

- Defined At: line 4
- Specific Purpose: Renders a UI section/component and wires props, event handlers, and visual state for the current view context.
- Inputs: Accepts: {
  profile, preferences, onUpdatePreference, }
- Output: Returns JSX elements (React render output) for the component subtree.
- Side Effects: Updates React/application state via setter calls.
- Key Dependencies: ../Account-Ui, ./FormInputField, ../../models/roleAccessModel
- Usage Scope: Exported symbol; intended for use by other modules importing this file.

### Function: handleDisplayNameChange(event)

- Defined At: line 15
- Specific Purpose: Handles an interaction/event branch and coordinates the feature-specific logic path for this module.
- Inputs: Accepts: event
- Output: Returns a module-specific value based on current parameters and internal logic.
- Side Effects: No direct external side effects detected; behavior appears computation/render focused.
- Key Dependencies: ../Account-Ui, ./FormInputField, ../../models/roleAccessModel
- Usage Scope: Internal helper; intended to be used only within this module.

### Function: handleDepartmentChange(event)

- Defined At: line 19
- Specific Purpose: Handles an interaction/event branch and coordinates the feature-specific logic path for this module.
- Inputs: Accepts: event
- Output: Returns a module-specific value based on current parameters and internal logic.
- Side Effects: No direct external side effects detected; behavior appears computation/render focused.
- Key Dependencies: ../Account-Ui, ./FormInputField, ../../models/roleAccessModel
- Usage Scope: Internal helper; intended to be used only within this module.

## File: src/components/Settings-Ui/AppearanceSettingsTab.jsx

- Purpose: Reusable UI component module used by pages or feature containers.
- Export Surface: Exports: AppearanceSettingsTab
- Imports: ../Account-Ui, ./SettingsSelect
- Functions Declared: 4

### Function: AppearanceSettingsTab({ preferences, onUpdatePreference })

- Defined At: line 15
- Specific Purpose: Renders a UI section/component and wires props, event handlers, and visual state for the current view context.
- Inputs: Accepts: { preferences, onUpdatePreference }
- Output: Returns JSX elements (React render output) for the component subtree.
- Side Effects: Updates React/application state via setter calls.
- Key Dependencies: ../Account-Ui, ./SettingsSelect
- Usage Scope: Exported symbol; intended for use by other modules importing this file.

### Function: handleThemeChange(event)

- Defined At: line 20
- Specific Purpose: Handles an interaction/event branch and coordinates the feature-specific logic path for this module.
- Inputs: Accepts: event
- Output: Returns a module-specific value based on current parameters and internal logic.
- Side Effects: No direct external side effects detected; behavior appears computation/render focused.
- Key Dependencies: ../Account-Ui, ./SettingsSelect
- Usage Scope: Internal helper; intended to be used only within this module.

### Function: handleFontSizeChange(event)

- Defined At: line 24
- Specific Purpose: Handles an interaction/event branch and coordinates the feature-specific logic path for this module.
- Inputs: Accepts: event
- Output: Returns a module-specific value based on current parameters and internal logic.
- Side Effects: No direct external side effects detected; behavior appears computation/render focused.
- Key Dependencies: ../Account-Ui, ./SettingsSelect
- Usage Scope: Internal helper; intended to be used only within this module.

### Function: handleAnimationsToggle(value)

- Defined At: line 28
- Specific Purpose: Handles an interaction/event branch and coordinates the feature-specific logic path for this module.
- Inputs: Accepts: value
- Output: Returns a module-specific value based on current parameters and internal logic.
- Side Effects: No direct external side effects detected; behavior appears computation/render focused.
- Key Dependencies: ../Account-Ui, ./SettingsSelect
- Usage Scope: Internal helper; intended to be used only within this module.

## File: src/components/Settings-Ui/DepartmentTransferTab.jsx

- Purpose: Reusable UI component module used by pages or feature containers.
- Export Surface: Exports: DepartmentTransferTab
- Imports: react, ../Account-Ui, ../../models/roleAccessModel
- Functions Declared: 2

### Function: DepartmentTransferTab({

  profile,
  transferRequests,
  departmentOptions,
  onSubmitTransferRequest,
})

- Defined At: line 4
- Specific Purpose: Renders a UI section/component and wires props, event handlers, and visual state for the current view context.
- Inputs: Accepts: {
  profile, transferRequests, departmentOptions, onSubmitTransferRequest, }
- Output: Returns JSX elements (React render output) for the component subtree.
- Side Effects: Triggers network/API I/O.
- Key Dependencies: react, ../Account-Ui, ../../models/roleAccessModel
- Usage Scope: Exported symbol; intended for use by other modules importing this file.

### Function: handleSubmit(event)

- Defined At: line 22
- Specific Purpose: Handles an interaction/event branch and coordinates the feature-specific logic path for this module.
- Inputs: Accepts: event
- Output: Returns a module-specific value based on current parameters and internal logic.
- Side Effects: Updates React/application state via setter calls.
- Key Dependencies: react, ../Account-Ui, ../../models/roleAccessModel
- Usage Scope: Internal helper; intended to be used only within this module.

## File: src/components/Settings-Ui/FormInputField.jsx

- Purpose: Reusable UI component module used by pages or feature containers.
- Export Surface: Exports: FormInputField
- Imports: No explicit imports detected.
- Functions Declared: 1

### Function: FormInputField({

  label,
  value,
  onChange,
  disabled = false,
  type = "text",
})

- Defined At: line 1
- Specific Purpose: Renders a UI section/component and wires props, event handlers, and visual state for the current view context.
- Inputs: Accepts: {
  label, value, onChange, disabled = false, type = "text", }
- Output: Returns JSX elements (React render output) for the component subtree.
- Side Effects: No direct external side effects detected; behavior appears computation/render focused.
- Key Dependencies: This function primarily relies on in-file logic and standard language/runtime features.
- Usage Scope: Exported symbol; intended for use by other modules importing this file.

## File: src/components/Settings-Ui/index.js

- Purpose: Reusable UI component module used by pages or feature containers.
- Export Surface: Exports: AccountSettingsTab, AppearanceSettingsTab, DepartmentTransferTab, FormInputField, NotificationSettingsTab, SecuritySettingsTab, SettingsSelect, SettingsTabNav
- Imports: No explicit imports detected.
- Functions: None explicitly declared in this module.

## File: src/components/Settings-Ui/NotificationSettingsTab.jsx

- Purpose: Reusable UI component module used by pages or feature containers.
- Export Surface: Exports: NotificationSettingsTab
- Imports: ../Account-Ui, ./SettingsSelect
- Functions Declared: 5

### Function: NotificationSettingsTab({ preferences, onUpdatePreference })

- Defined At: line 9
- Specific Purpose: Renders a UI section/component and wires props, event handlers, and visual state for the current view context.
- Inputs: Accepts: { preferences, onUpdatePreference }
- Output: Returns JSX elements (React render output) for the component subtree.
- Side Effects: Updates React/application state via setter calls.
- Key Dependencies: ../Account-Ui, ./SettingsSelect
- Usage Scope: Exported symbol; intended for use by other modules importing this file.

### Function: handleNotificationsToggle(value)

- Defined At: line 15
- Specific Purpose: Handles an interaction/event branch and coordinates the feature-specific logic path for this module.
- Inputs: Accepts: value
- Output: Returns a module-specific value based on current parameters and internal logic.
- Side Effects: No direct external side effects detected; behavior appears computation/render focused.
- Key Dependencies: ../Account-Ui, ./SettingsSelect
- Usage Scope: Internal helper; intended to be used only within this module.

### Function: handleReportUpdatesToggle(value)

- Defined At: line 19
- Specific Purpose: Handles an interaction/event branch and coordinates the feature-specific logic path for this module.
- Inputs: Accepts: value
- Output: Returns a module-specific value based on current parameters and internal logic.
- Side Effects: No direct external side effects detected; behavior appears computation/render focused.
- Key Dependencies: ../Account-Ui, ./SettingsSelect
- Usage Scope: Internal helper; intended to be used only within this module.

### Function: handleAdminInvitationsToggle(value)

- Defined At: line 23
- Specific Purpose: Handles an interaction/event branch and coordinates the feature-specific logic path for this module.
- Inputs: Accepts: value
- Output: Returns a module-specific value based on current parameters and internal logic.
- Side Effects: No direct external side effects detected; behavior appears computation/render focused.
- Key Dependencies: ../Account-Ui, ./SettingsSelect
- Usage Scope: Internal helper; intended to be used only within this module.

### Function: handleDigestFrequencyChange(event)

- Defined At: line 27
- Specific Purpose: Handles an interaction/event branch and coordinates the feature-specific logic path for this module.
- Inputs: Accepts: event
- Output: Returns a module-specific value based on current parameters and internal logic.
- Side Effects: No direct external side effects detected; behavior appears computation/render focused.
- Key Dependencies: ../Account-Ui, ./SettingsSelect
- Usage Scope: Internal helper; intended to be used only within this module.

## File: src/components/Settings-Ui/SecuritySettingsTab.jsx

- Purpose: Reusable UI component module used by pages or feature containers.
- Export Surface: Exports: SecuritySettingsTab
- Imports: ../Account-Ui, ./SettingsSelect
- Functions Declared: 3

### Function: SecuritySettingsTab({

  preferences,
  onUpdatePreference,
  onRequestLogout,
})

- Defined At: line 10
- Specific Purpose: Renders a UI section/component and wires props, event handlers, and visual state for the current view context.
- Inputs: Accepts: {
  preferences, onUpdatePreference, onRequestLogout, }
- Output: Returns JSX elements (React render output) for the component subtree.
- Side Effects: Updates React/application state via setter calls.
- Key Dependencies: ../Account-Ui, ./SettingsSelect
- Usage Scope: Exported symbol; intended for use by other modules importing this file.

### Function: handleSessionTimeoutChange(event)

- Defined At: line 17
- Specific Purpose: Handles an interaction/event branch and coordinates the feature-specific logic path for this module.
- Inputs: Accepts: event
- Output: Returns a module-specific value based on current parameters and internal logic.
- Side Effects: No direct external side effects detected; behavior appears computation/render focused.
- Key Dependencies: ../Account-Ui, ./SettingsSelect
- Usage Scope: Internal helper; intended to be used only within this module.

### Function: handleLogoutClick()

- Defined At: line 21
- Specific Purpose: Handles an interaction/event branch and coordinates the feature-specific logic path for this module.
- Inputs: No explicit parameters; relies on closure/module context and imported dependencies.
- Output: Returns a module-specific value based on current parameters and internal logic.
- Side Effects: No direct external side effects detected; behavior appears computation/render focused.
- Key Dependencies: ../Account-Ui, ./SettingsSelect
- Usage Scope: Internal helper; intended to be used only within this module.

## File: src/components/Settings-Ui/SettingsSelect.jsx

- Purpose: Reusable UI component module used by pages or feature containers.
- Export Surface: Exports: SettingsSelect
- Imports: No explicit imports detected.
- Functions Declared: 1

### Function: SettingsSelect({ label, value, onChange, options })

- Defined At: line 1
- Specific Purpose: Renders a UI section/component and wires props, event handlers, and visual state for the current view context.
- Inputs: Accepts: { label, value, onChange, options }
- Output: Returns JSX elements (React render output) for the component subtree.
- Side Effects: Updates React/application state via setter calls.
- Key Dependencies: This function primarily relies on in-file logic and standard language/runtime features.
- Usage Scope: Exported symbol; intended for use by other modules importing this file.

## File: src/components/Settings-Ui/SettingsTabNav.jsx

- Purpose: Reusable UI component module used by pages or feature containers.
- Export Surface: Exports: SettingsTabNav
- Imports: No explicit imports detected.
- Functions Declared: 1

### Function: SettingsTabNav({ tabs, activeTab, onTabChange })

- Defined At: line 1
- Specific Purpose: Renders a UI section/component and wires props, event handlers, and visual state for the current view context.
- Inputs: Accepts: { tabs, activeTab, onTabChange }
- Output: Returns JSX elements (React render output) for the component subtree.
- Side Effects: Updates React/application state via setter calls.
- Key Dependencies: This function primarily relies on in-file logic and standard language/runtime features.
- Usage Scope: Exported symbol; intended for use by other modules importing this file.

## File: src/components/ui/Navbar.jsx

- Purpose: Reusable UI component module used by pages or feature containers.
- Export Surface: Exports: Navbar
- Imports: react, framer-motion, /assets/CitiSentLogo.svg, ../../models/pageModel, ../../models/roleAccessModel
- Functions Declared: 6

### Function: CitiSentLogoIcon({ className = '' })

- Defined At: line 60
- Specific Purpose: Renders a UI section/component and wires props, event handlers, and visual state for the current view context.
- Inputs: Accepts: { className = '' }
- Output: Returns JSX elements (React render output) for the component subtree.
- Side Effects: Drives navigation or view transition state.
- Key Dependencies: react, framer-motion, /assets/CitiSentLogo.svg, ../../models/pageModel, ../../models/roleAccessModel
- Usage Scope: Internal helper; intended to be used only within this module.

### Function: NavOption({ item, activePage, onNavigate, expanded, index })

- Defined At: line 64
- Specific Purpose: Renders a UI section/component and wires props, event handlers, and visual state for the current view context.
- Inputs: Accepts: { item, activePage, onNavigate, expanded, index }
- Output: Returns JSX elements (React render output) for the component subtree.
- Side Effects: Updates React/application state via setter calls. Drives navigation or view transition state.
- Key Dependencies: react, framer-motion, /assets/CitiSentLogo.svg, ../../models/pageModel, ../../models/roleAccessModel
- Usage Scope: Internal helper; intended to be used only within this module.

### Function: handleClick()

- Defined At: line 71
- Specific Purpose: Handles an interaction/event branch and coordinates the feature-specific logic path for this module.
- Inputs: No explicit parameters; relies on closure/module context and imported dependencies.
- Output: Returns a module-specific value based on current parameters and internal logic.
- Side Effects: Updates React/application state via setter calls. Drives navigation or view transition state.
- Key Dependencies: react, framer-motion, /assets/CitiSentLogo.svg, ../../models/pageModel, ../../models/roleAccessModel
- Usage Scope: Internal helper; intended to be used only within this module.

### Function: BrandBlock({ expanded })

- Defined At: line 161
- Specific Purpose: Renders a UI section/component and wires props, event handlers, and visual state for the current view context.
- Inputs: Accepts: { expanded }
- Output: Returns JSX elements (React render output) for the component subtree.
- Side Effects: No direct external side effects detected; behavior appears computation/render focused.
- Key Dependencies: react, framer-motion, /assets/CitiSentLogo.svg, ../../models/pageModel, ../../models/roleAccessModel
- Usage Scope: Internal helper; intended to be used only within this module.

### Function: Navbar({ children, activePage, onNavigate, profileRole, unreadNotifications = 0 })

- Defined At: line 186
- Specific Purpose: Renders a UI section/component and wires props, event handlers, and visual state for the current view context.
- Inputs: Accepts: { children, activePage, onNavigate, profileRole, unreadNotifications = 0 }
- Output: Returns JSX elements (React render output) for the component subtree.
- Side Effects: Updates React/application state via setter calls. Drives navigation or view transition state.
- Key Dependencies: react, framer-motion, /assets/CitiSentLogo.svg, ../../models/pageModel, ../../models/roleAccessModel
- Usage Scope: Exported symbol; intended for use by other modules importing this file.

### Function: handleNavigate(nextPage)

- Defined At: line 199
- Specific Purpose: Handles an interaction/event branch and coordinates the feature-specific logic path for this module.
- Inputs: Accepts: nextPage
- Output: Returns a module-specific value based on current parameters and internal logic.
- Side Effects: Updates React/application state via setter calls. Drives navigation or view transition state.
- Key Dependencies: react, framer-motion, /assets/CitiSentLogo.svg, ../../models/pageModel, ../../models/roleAccessModel
- Usage Scope: Internal helper; intended to be used only within this module.

## File: src/components/ui/PageSkeleton.jsx

- Purpose: Reusable UI component module used by pages or feature containers.
- Export Surface: Exports: PageSkeleton
- Imports: framer-motion, ../../models/pageModel
- Functions Declared: 2

### Function: SkeletonBlock({ className })

- Defined At: line 5
- Specific Purpose: Renders a UI section/component and wires props, event handlers, and visual state for the current view context.
- Inputs: Accepts: { className }
- Output: Returns JSX elements (React render output) for the component subtree.
- Side Effects: Drives navigation or view transition state.
- Key Dependencies: framer-motion, ../../models/pageModel
- Usage Scope: Internal helper; intended to be used only within this module.

### Function: PageSkeleton({ pageKey })

- Defined At: line 11
- Specific Purpose: Renders a UI section/component and wires props, event handlers, and visual state for the current view context.
- Inputs: Accepts: { pageKey }
- Output: Returns JSX elements (React render output) for the component subtree.
- Side Effects: Drives navigation or view transition state.
- Key Dependencies: framer-motion, ../../models/pageModel
- Usage Scope: Exported symbol; intended for use by other modules importing this file.

## File: src/components/ui/Pagination.jsx

- Purpose: Reusable UI component module used by pages or feature containers.
- Export Surface: Exports: Pagination
- Imports: No explicit imports detected.
- Functions Declared: 1

### Function: Pagination({

  currentPage,
  totalPages,
  visiblePages,
  onPageChange,
  onNext,
  onPrevious,
  className = "",
})

- Defined At: line 1
- Specific Purpose: Renders a UI section/component and wires props, event handlers, and visual state for the current view context.
- Inputs: Accepts: {
  currentPage, totalPages, visiblePages, onPageChange, onNext, onPrevious, className = "", }
- Output: Returns JSX elements (React render output) for the component subtree.
- Side Effects: No direct external side effects detected; behavior appears computation/render focused.
- Key Dependencies: This function primarily relies on in-file logic and standard language/runtime features.
- Usage Scope: Exported symbol; intended for use by other modules importing this file.

## File: src/components/ui/Toasters.jsx

- Purpose: Reusable UI component module used by pages or feature containers.
- Export Surface: Exports: Toasters
- Imports: react, react-hot-toast
- Functions Declared: 1

### Function: Toasters()

- Defined At: line 8
- Specific Purpose: Renders a UI section/component and wires props, event handlers, and visual state for the current view context.
- Inputs: No explicit parameters; relies on closure/module context and imported dependencies.
- Output: Returns JSX elements (React render output) for the component subtree.
- Side Effects: Publishes user-facing toast/notification feedback.
- Key Dependencies: react, react-hot-toast
- Usage Scope: Exported symbol; intended for use by other modules importing this file.

## File: src/components/ui/toastHelpers.js

- Purpose: Reusable UI component module used by pages or feature containers.
- Export Surface: Exports: notifyError, notifySuccess
- Imports: react-hot-toast
- Functions Declared: 2

### Function: notifySuccess(message = 'Action completed successfully.')

- Defined At: line 7
- Specific Purpose: Implements file-specific feature logic that supports this module's behavior and data flow.
- Inputs: Accepts: message = 'Action completed successfully.'
- Output: Primarily performs side-effect-driven logic; return value is not a primary integration contract.
- Side Effects: Publishes user-facing toast/notification feedback.
- Key Dependencies: react-hot-toast
- Usage Scope: Exported symbol; intended for use by other modules importing this file.

### Function: notifyError(message = 'Action failed.'

  guideline = 'Please verify your input, check your connection, and try again.')

- Defined At: line 15
- Specific Purpose: Implements file-specific feature logic that supports this module's behavior and data flow.
- Inputs: Accepts: message = 'Action failed.', guideline = 'Please verify your input, check your connection, and try again.'
- Output: Primarily performs side-effect-driven logic; return value is not a primary integration contract.
- Side Effects: Publishes user-facing toast/notification feedback.
- Key Dependencies: react-hot-toast
- Usage Scope: Exported symbol; intended for use by other modules importing this file.

## File: src/components/ui/UnderConstruction.jsx

- Purpose: Reusable UI component module used by pages or feature containers.
- Export Surface: Exports: UnderConstruction
- Imports: framer-motion, react-icons/fi
- Functions Declared: 1

### Function: UnderConstruction({ pageName })

- Defined At: line 5
- Specific Purpose: Renders a UI section/component and wires props, event handlers, and visual state for the current view context.
- Inputs: Accepts: { pageName }
- Output: Returns JSX elements (React render output) for the component subtree.
- Side Effects: No direct external side effects detected; behavior appears computation/render focused.
- Key Dependencies: framer-motion, react-icons/fi
- Usage Scope: Exported symbol; intended for use by other modules importing this file.

## File: src/components/Users-Ui/AddUserFormModal.jsx

- Purpose: Reusable UI component module used by pages or feature containers.
- Export Surface: Exports: AddUserFormModal
- Imports: react, ../../hooks/useModalAccessibility
- Functions Declared: 4

### Function: AddUserFormModal({ isOpen, onClose, onSubmit })

- Defined At: line 10
- Specific Purpose: Renders a UI section/component and wires props, event handlers, and visual state for the current view context.
- Inputs: Accepts: { isOpen, onClose, onSubmit }
- Output: Returns JSX elements (React render output) for the component subtree.
- Side Effects: Updates React/application state via setter calls.
- Key Dependencies: react, ../../hooks/useModalAccessibility
- Usage Scope: Exported symbol; intended for use by other modules importing this file.

### Function: updateField(field, value)

- Defined At: line 24
- Specific Purpose: Applies state/data mutation logic for this feature and returns the updated value where appropriate.
- Inputs: Accepts: field, value
- Output: Returns updated state/data or completion status after applying mutation logic.
- Side Effects: Updates React/application state via setter calls.
- Key Dependencies: react, ../../hooks/useModalAccessibility
- Usage Scope: Internal helper; intended to be used only within this module.

### Function: handleSubmit(event)

- Defined At: line 28
- Specific Purpose: Handles an interaction/event branch and coordinates the feature-specific logic path for this module.
- Inputs: Accepts: event
- Output: Returns a module-specific value based on current parameters and internal logic.
- Side Effects: Updates React/application state via setter calls.
- Key Dependencies: react, ../../hooks/useModalAccessibility
- Usage Scope: Internal helper; intended to be used only within this module.

### Function: handleClose()

- Defined At: line 34
- Specific Purpose: Handles an interaction/event branch and coordinates the feature-specific logic path for this module.
- Inputs: No explicit parameters; relies on closure/module context and imported dependencies.
- Output: Returns a module-specific value based on current parameters and internal logic.
- Side Effects: Updates React/application state via setter calls.
- Key Dependencies: react, ../../hooks/useModalAccessibility
- Usage Scope: Internal helper; intended to be used only within this module.

## File: src/components/Users-Ui/EditUserFormModal.jsx

- Purpose: Reusable UI component module used by pages or feature containers.
- Export Surface: Exports: EditUserFormModal
- Imports: react, ../../hooks/useModalAccessibility
- Functions Declared: 3

### Function: EditUserFormModal({ user, isOpen, onClose, onSubmit })

- Defined At: line 3
- Specific Purpose: Renders a UI section/component and wires props, event handlers, and visual state for the current view context.
- Inputs: Accepts: { user, isOpen, onClose, onSubmit }
- Output: Returns JSX elements (React render output) for the component subtree.
- Side Effects: Updates React/application state via setter calls.
- Key Dependencies: react, ../../hooks/useModalAccessibility
- Usage Scope: Exported symbol; intended for use by other modules importing this file.

### Function: updateField(field, value)

- Defined At: line 22
- Specific Purpose: Applies state/data mutation logic for this feature and returns the updated value where appropriate.
- Inputs: Accepts: field, value
- Output: Returns updated state/data or completion status after applying mutation logic.
- Side Effects: Updates React/application state via setter calls.
- Key Dependencies: react, ../../hooks/useModalAccessibility
- Usage Scope: Internal helper; intended to be used only within this module.

### Function: handleSubmit(event)

- Defined At: line 26
- Specific Purpose: Handles an interaction/event branch and coordinates the feature-specific logic path for this module.
- Inputs: Accepts: event
- Output: Returns a module-specific value based on current parameters and internal logic.
- Side Effects: Updates React/application state via setter calls.
- Key Dependencies: react, ../../hooks/useModalAccessibility
- Usage Scope: Internal helper; intended to be used only within this module.

## File: src/components/Users-Ui/index.js

- Purpose: Reusable UI component module used by pages or feature containers.
- Export Surface: Exports: AddUserFormModal, EditUserFormModal, UserProfileModal, UsersPagination, UsersTable, UserStatCard, UserStatusPill, UsersToolbar
- Imports: No explicit imports detected.
- Functions: None explicitly declared in this module.

## File: src/components/Users-Ui/UserProfileModal.jsx

- Purpose: Reusable UI component module used by pages or feature containers.
- Export Surface: Exports: UserProfileModal
- Imports: react, ../../hooks/useModalAccessibility
- Functions Declared: 1

### Function: UserProfileModal({ user, isOpen, onClose })

- Defined At: line 3
- Specific Purpose: Renders a UI section/component and wires props, event handlers, and visual state for the current view context.
- Inputs: Accepts: { user, isOpen, onClose }
- Output: Returns JSX elements (React render output) for the component subtree.
- Side Effects: No direct external side effects detected; behavior appears computation/render focused.
- Key Dependencies: react, ../../hooks/useModalAccessibility
- Usage Scope: Exported symbol; intended for use by other modules importing this file.

## File: src/components/Users-Ui/UsersPagination.jsx

- Purpose: Reusable UI component module used by pages or feature containers.
- Export Surface: Exports: UsersPagination
- Imports: ../ui/Pagination
- Functions Declared: 1

### Function: UsersPagination({

  currentPage,
  totalPages,
  visiblePages,
  onPageChange,
  onNextPage,
  onPreviousPage,
})

- Defined At: line 2
- Specific Purpose: Renders a UI section/component and wires props, event handlers, and visual state for the current view context.
- Inputs: Accepts: {
  currentPage, totalPages, visiblePages, onPageChange, onNextPage, onPreviousPage, }
- Output: Returns JSX elements (React render output) for the component subtree.
- Side Effects: No direct external side effects detected; behavior appears computation/render focused.
- Key Dependencies: ../ui/Pagination
- Usage Scope: Exported symbol; intended for use by other modules importing this file.

## File: src/components/Users-Ui/UsersTable.jsx

- Purpose: Reusable UI component module used by pages or feature containers.
- Export Surface: Exports: UsersTable
- Imports: react, react-icons/fi, ./UserStatusPill
- Functions Declared: 5

### Function: UserInitialsAvatar({ name })

- Defined At: line 4
- Specific Purpose: Renders a UI section/component and wires props, event handlers, and visual state for the current view context.
- Inputs: Accepts: { name }
- Output: Returns JSX elements (React render output) for the component subtree.
- Side Effects: No direct external side effects detected; behavior appears computation/render focused.
- Key Dependencies: react, react-icons/fi, ./UserStatusPill
- Usage Scope: Internal helper; intended to be used only within this module.

### Function: UsersTableHeader({ allSelected, onToggleAll })

- Defined At: line 15
- Specific Purpose: Renders a UI section/component and wires props, event handlers, and visual state for the current view context.
- Inputs: Accepts: { allSelected, onToggleAll }
- Output: Returns JSX elements (React render output) for the component subtree.
- Side Effects: No direct external side effects detected; behavior appears computation/render focused.
- Key Dependencies: react, react-icons/fi, ./UserStatusPill
- Usage Scope: Internal helper; intended to be used only within this module.

### Function: UsersTableRow({

  user,
  isSelected,
  onToggleSelected,
  onViewUser,
  onEditUser,
  onBanUser,
})

- Defined At: line 34
- Specific Purpose: Renders a UI section/component and wires props, event handlers, and visual state for the current view context.
- Inputs: Accepts: {
  user, isSelected, onToggleSelected, onViewUser, onEditUser, onBanUser, }
- Output: Returns JSX elements (React render output) for the component subtree.
- Side Effects: Updates React/application state via setter calls.
- Key Dependencies: react, react-icons/fi, ./UserStatusPill
- Usage Scope: Internal helper; intended to be used only within this module.

### Function: handleAction(action)

- Defined At: line 44
- Specific Purpose: Handles an interaction/event branch and coordinates the feature-specific logic path for this module.
- Inputs: Accepts: action
- Output: Returns a module-specific value based on current parameters and internal logic.
- Side Effects: Updates React/application state via setter calls.
- Key Dependencies: react, react-icons/fi, ./UserStatusPill
- Usage Scope: Internal helper; intended to be used only within this module.

### Function: UsersTable({

  users,
  selectedUserIds = [],
  onToggleSelectUser,
  onToggleSelectAllUsers,
  onViewUser,
  onEditUser,
  onBanUser,
})

- Defined At: line 109
- Specific Purpose: Renders a UI section/component and wires props, event handlers, and visual state for the current view context.
- Inputs: Accepts: {
  users, selectedUserIds = [], onToggleSelectUser, onToggleSelectAllUsers, onViewUser, onEditUser, onBanUser, }
- Output: Returns JSX elements (React render output) for the component subtree.
- Side Effects: No direct external side effects detected; behavior appears computation/render focused.
- Key Dependencies: react, react-icons/fi, ./UserStatusPill
- Usage Scope: Exported symbol; intended for use by other modules importing this file.

## File: src/components/Users-Ui/UserStatCard.jsx

- Purpose: Reusable UI component module used by pages or feature containers.
- Export Surface: Exports: UserStatCard
- Imports: react-icons/fi
- Functions Declared: 1

### Function: UserStatCard({ label, value, icon, accent })

- Defined At: line 7
- Specific Purpose: Renders a UI section/component and wires props, event handlers, and visual state for the current view context.
- Inputs: Accepts: { label, value, icon, accent }
- Output: Returns JSX elements (React render output) for the component subtree.
- Side Effects: No direct external side effects detected; behavior appears computation/render focused.
- Key Dependencies: react-icons/fi
- Usage Scope: Exported symbol; intended for use by other modules importing this file.

## File: src/components/Users-Ui/UserStatusPill.jsx

- Purpose: Reusable UI component module used by pages or feature containers.
- Export Surface: Exports: UserStatusPill
- Imports: react-icons/fi
- Functions Declared: 1

### Function: UserStatusPill({ status })

- Defined At: line 8
- Specific Purpose: Renders a UI section/component and wires props, event handlers, and visual state for the current view context.
- Inputs: Accepts: { status }
- Output: Returns JSX elements (React render output) for the component subtree.
- Side Effects: No direct external side effects detected; behavior appears computation/render focused.
- Key Dependencies: react-icons/fi
- Usage Scope: Exported symbol; intended for use by other modules importing this file.

## File: src/components/Users-Ui/UsersToolbar.jsx

- Purpose: Reusable UI component module used by pages or feature containers.
- Export Surface: Exports: UsersToolbar
- Imports: react-icons/fi
- Functions Declared: 2

### Function: ToolbarDropdown({ label, value, options, onChange })

- Defined At: line 2
- Specific Purpose: Renders a UI section/component and wires props, event handlers, and visual state for the current view context.
- Inputs: Accepts: { label, value, options, onChange }
- Output: Returns JSX elements (React render output) for the component subtree.
- Side Effects: No direct external side effects detected; behavior appears computation/render focused.
- Key Dependencies: react-icons/fi
- Usage Scope: Internal helper; intended to be used only within this module.

### Function: UsersToolbar({

  searchPlaceholder,
  primaryAction,
  searchTerm,
  sortBy,
  filterBy,
  sortOptions,
  filterOptions,
  onSearchChange,
  onSortChange,
  onFilterChange,
  onAddUserClick,
})

- Defined At: line 27
- Specific Purpose: Renders a UI section/component and wires props, event handlers, and visual state for the current view context.
- Inputs: Accepts: {
  searchPlaceholder, primaryAction, searchTerm, sortBy, filterBy, sortOptions, filterOptions, onSearchChange, onSortChange, onFilterChange, onAddUserClick, }
- Output: Returns JSX elements (React render output) for the component subtree.
- Side Effects: No direct external side effects detected; behavior appears computation/render focused.
- Key Dependencies: react-icons/fi
- Usage Scope: Exported symbol; intended for use by other modules importing this file.
