/**
 * CSV Export Service
 *
 * Pure utility for building CSV strings and triggering browser downloads.
 * Zero external dependencies — uses native Blob + URL.createObjectURL.
 * UTF-8 BOM prefix ensures Excel opens the file with correct encoding.
 */

const CSV_BOM = '\uFEFF'

/**
 * Escapes a single CSV cell value.
 * Wraps the value in double-quotes if it contains commas, quotes, or newlines.
 * Any internal double-quotes are doubled per RFC 4180.
 */
function escapeCsvCell(value) {
    const stringValue = value == null ? '' : String(value)

    if (
        stringValue.includes(',') ||
        stringValue.includes('"') ||
        stringValue.includes('\n') ||
        stringValue.includes('\r')
    ) {
        return `"${stringValue.replace(/"/g, '""')}"`
    }

    return stringValue
}

/**
 * Builds a CSV string from structured data.
 *
 * @param {string[]} headers - Column headers (first row)
 * @param {object[]} rows    - Array of row objects
 * @param {string[]} keys    - Object keys to extract per row, in column order
 * @returns {string} Complete CSV string with BOM
 */
export function buildCsvString(headers, rows, keys) {
    const headerLine = headers.map(escapeCsvCell).join(',')

    const dataLines = rows.map((row) =>
        keys.map((key) => escapeCsvCell(row[key])).join(',')
    )

    return CSV_BOM + [headerLine, ...dataLines].join('\r\n')
}

/**
 * Triggers a browser download for a CSV file.
 *
 * @param {string} csvContent - The CSV string (including BOM)
 * @param {string} filename   - Desired filename without extension
 */
export function downloadCsv(csvContent, filename) {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)

    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${filename}.csv`
    anchor.style.display = 'none'

    document.body.appendChild(anchor)
    anchor.click()

    // Cleanup after a tick to ensure the download starts
    setTimeout(() => {
        document.body.removeChild(anchor)
        URL.revokeObjectURL(url)
    }, 100)
}

/**
 * One-shot helper: build CSV string and trigger download.
 *
 * @param {object} options
 * @param {string[]} options.headers  - Column headers
 * @param {object[]} options.rows     - Data rows
 * @param {string[]} options.keys     - Object keys to extract, in column order
 * @param {string}   options.filename - Filename without extension
 */
export function exportToCsv({ headers, rows, keys, filename }) {
    const csvContent = buildCsvString(headers, rows, keys)
    downloadCsv(csvContent, filename)
}
