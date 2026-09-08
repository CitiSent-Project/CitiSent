export const MAX_LOGO_FILE_SIZE_BYTES = 2 * 1024 * 1024
export const ALLOWED_LOGO_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp'])

export function pluralize(value, singular, plural = `${singular}s`) {
    return `${value} ${value === 1 ? singular : plural}`
}

export function formatReferenceBreakdownMessage(referenceBreakdown) {
    if (!referenceBreakdown || typeof referenceBreakdown !== 'object') {
        return ''
    }

    const profiles = Number(referenceBreakdown.profiles || 0)
    const reports = Number(referenceBreakdown.reports || 0)
    const transferRequests = Number(referenceBreakdown.transferRequests || 0)

    const linkedItems = [
        profiles > 0 ? pluralize(profiles, 'user profile') : '',
        reports > 0 ? pluralize(reports, 'report') : '',
        transferRequests > 0 ? pluralize(transferRequests, 'transfer request') : '',
    ].filter(Boolean)

    if (linkedItems.length === 0) {
        return ''
    }

    return `This department is still linked to ${linkedItems.join(', ')}.`
}

export function toSlug(value) {
    return String(value || '')
        .trim()
        .toLowerCase()
        .replace(/[_\s]+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '')
}

export function validateLogoFile(file) {
    if (!file) {
        return 'Please choose a logo image.'
    }

    if (!ALLOWED_LOGO_TYPES.has(file.type)) {
        return 'Use a PNG, JPG, or WebP image.'
    }

    if (file.size > MAX_LOGO_FILE_SIZE_BYTES) {
        return 'Logo image must be 2MB or smaller.'
    }

    return ''
}
