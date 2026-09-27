/**
 * Dashboard CSV Formatters
 *
 * Privacy-safe formatters that transform dashboard data into { headers, rows, keys, filename }
 * structures ready for csvExportService.exportToCsv().
 *
 * PRIVACY RULE: Only email addresses are used to identify people.
 * Full names (fname, mname, lname, fullName) are NEVER included in any CSV output.
 */

function formatDate(value) {
    if (!value) {
        return 'Not available'
    }

    return new Date(value).toLocaleDateString('en-US', {
        month: 'long',
        day: '2-digit',
        year: 'numeric',
    })
}

/**
 * Reports by Category — Pie Chart data → CSV format.
 * Columns: Category, Report Count
 */
export function formatCategoryCsv(categoryData) {
    return {
        headers: ['Category', 'Report Count'],
        keys: ['category', 'count'],
        rows: (categoryData?.labels || []).map((label, index) => ({
            category: label,
            count: categoryData.values?.[index] ?? 0,
        })),
        filename: 'reports_by_category',
    }
}

/**
 * Report Status Breakdown — Solid Pie Chart data → CSV format.
 * Columns: Status, Report Count
 */
export function formatStatusBreakdownCsv(statusData) {
    return {
        headers: ['Status', 'Report Count'],
        keys: ['status', 'count'],
        rows: (statusData?.labels || []).map((label, index) => ({
            status: label,
            count: statusData.values?.[index] ?? 0,
        })),
        filename: 'report_status_breakdown',
    }
}

/**
 * Weekly Report Trend — Vertical Bar Chart data → CSV format.
 * Columns: Day, Report Count
 */
export function formatWeeklyTrendCsv(weeklyData) {
    return {
        headers: ['Day', 'Report Count'],
        keys: ['day', 'count'],
        rows: (weeklyData?.labels || []).map((label, index) => ({
            day: label,
            count: weeklyData.values?.[index] ?? 0,
        })),
        filename: 'weekly_report_trend',
    }
}

/**
 * Dashboard Summary — Stat Cards → CSV format.
 * Columns: Metric, Value
 */
export function formatSummaryCsv(statCards) {
    return {
        headers: ['Metric', 'Value'],
        keys: ['metric', 'value'],
        rows: (statCards || []).map((card) => ({
            metric: card.label,
            value: card.value,
        })),
        filename: 'dashboard_summary',
    }
}

/**
 * Recent Admins — RAW API payload → CSV format.
 * Uses email only. Names are intentionally excluded for privacy.
 *
 * @param {object[]} adminsRawData - Raw API payload (dashboardQuery.data.admins)
 */
export function formatRecentAdminsCsv(adminsRawData) {
    const rows = Array.isArray(adminsRawData) ? adminsRawData : []

    return {
        headers: ['Email', 'Department Assigned', 'Last Activity'],
        keys: ['email', 'department', 'activity'],
        rows: rows.map((row) => ({
            email: row.email || 'Not available',
            department: row.departmentLabel || 'Unassigned',
            activity: formatDate(row.joinedAt),
        })),
        filename: 'recent_admins',
    }
}

/**
 * Newly Joined Users — RAW API payload → CSV format.
 * Uses email only. Names and usernames are intentionally excluded for privacy.
 *
 * @param {object[]} usersRawData - Raw API payload (dashboardQuery.data.users)
 */
export function formatRecentUsersCsv(usersRawData) {
    const rows = Array.isArray(usersRawData) ? usersRawData : []

    return {
        headers: ['Email', 'Date Joined'],
        keys: ['email', 'joined'],
        rows: rows.map((row) => ({
            email: row.email || 'Unknown',
            joined: formatDate(row.joinedAt),
        })),
        filename: 'newly_joined_users',
    }
}

/**
 * Combined dashboard export — All sections in one CSV.
 * Each section is separated by an empty row and a section header.
 */
export function formatAllDashboardCsv({
    categoryData,
    statusData,
    weeklyData,
    statCards,
    adminsRaw,
    usersRaw,
}) {
    const sections = [
        { label: 'Dashboard Summary', data: formatSummaryCsv(statCards) },
        { label: 'Reports by Category', data: formatCategoryCsv(categoryData) },
        { label: 'Report Status Breakdown', data: formatStatusBreakdownCsv(statusData) },
        { label: 'Weekly Report Trend', data: formatWeeklyTrendCsv(weeklyData) },
        { label: 'Recent Admins', data: formatRecentAdminsCsv(adminsRaw) },
        { label: 'Newly Joined Users', data: formatRecentUsersCsv(usersRaw) },
    ]

    // Build combined rows: section header → column headers → data → blank row
    const allHeaders = ['Section', 'Column 1', 'Column 2', 'Column 3']
    const allRows = []

    for (const section of sections) {
        // Section separator row
        allRows.push({
            section: `--- ${section.label} ---`,
            col1: '',
            col2: '',
            col3: '',
        })

        // Column headers row
        allRows.push({
            section: section.data.headers[0] || '',
            col1: section.data.headers[1] || '',
            col2: section.data.headers[2] || '',
            col3: section.data.headers[3] || '',
        })

        // Data rows
        for (const row of section.data.rows) {
            const values = section.data.keys.map((key) => row[key] ?? '')
            allRows.push({
                section: values[0] ?? '',
                col1: values[1] ?? '',
                col2: values[2] ?? '',
                col3: values[3] ?? '',
            })
        }

        // Blank separator
        allRows.push({ section: '', col1: '', col2: '', col3: '' })
    }

    return {
        headers: allHeaders,
        keys: ['section', 'col1', 'col2', 'col3'],
        rows: allRows,
        filename: 'dashboard_export_all',
    }
}
