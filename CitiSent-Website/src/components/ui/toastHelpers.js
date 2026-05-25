import { toast } from 'react-hot-toast'
import { createElement } from 'react'

const DEFAULT_ERROR_GUIDANCE = 'Please verify your input, check your connection, and try again.'

const FRIENDLY_FIELD_LABELS = {
  barangay: 'barangay',
  city: 'city',
  province: 'province',
  departmentId: 'department',
  email: 'email address',
  fname: 'first name',
  mname: 'middle name',
  lname: 'last name',
  fullName: 'full name',
  password: 'password',
  phone: 'phone number',
  phoneNumber: 'phone number',
  requestedDepartmentId: 'requested department',
  currentDepartmentId: 'current department',
  reportId: 'report ID',
  status: 'status',
}

const TECHNICAL_MESSAGE_PATTERNS = [
  /request validation failed/i,
  /request failed \(\d+\)/i,
  /body\./i,
  /query\./i,
  /params\./i,
  /path\./i,
  /failed to fetch/i,
  /networkerror/i,
  /err_connection_refused/i,
  /unable to reach the api server/i,
  /timed out after/i,
]

function extractMessageValue(value) {
  if (typeof value === 'string') {
    return value.trim()
  }

  if (value && typeof value === 'object') {
    const candidate = value.userMessage || value.message || ''
    return String(candidate).trim()
  }

  return ''
}

function humanizeFieldLabel(field) {
  const normalized = String(field || '')
    .replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim()

  if (!normalized) {
    return ''
  }

  const lowerCased = normalized.toLowerCase()
  return FRIENDLY_FIELD_LABELS[normalized] || FRIENDLY_FIELD_LABELS[lowerCased] || lowerCased
}

function extractValidationFields(value, rawMessage) {
  const fields = new Set()

  if (value && typeof value === 'object' && Array.isArray(value.details)) {
    value.details.forEach((detail) => {
      const path = String(detail?.path || '').trim()
      if (!path) {
        return
      }

      const parts = path.split('.')
      const field = parts[parts.length - 1]
      const humanized = humanizeFieldLabel(field)
      if (humanized) {
        fields.add(humanized)
      }
    })
  }

  const technicalMessage = rawMessage || extractMessageValue(value)
  if (!technicalMessage) {
    return Array.from(fields)
  }

  const bracketMatch = technicalMessage.match(/request validation failed \(([^)]+)\)/i)
  if (bracketMatch?.[1]) {
    bracketMatch[1].split(',').forEach((field) => {
      const humanized = humanizeFieldLabel(field)
      if (humanized) {
        fields.add(humanized)
      }
    })
  }

  const pathMatches = technicalMessage.matchAll(/(?:body|query|params|path)\.([a-zA-Z0-9_]+)/g)
  for (const match of pathMatches) {
    const humanized = humanizeFieldLabel(match[1])
    if (humanized) {
      fields.add(humanized)
    }
  }

  return Array.from(fields)
}

function formatFriendlyFieldList(fields) {
  if (fields.length === 0) {
    return ''
  }

  if (fields.length === 1) {
    return fields[0]
  }

  if (fields.length === 2) {
    return `${fields[0]} and ${fields[1]}`
  }

  return `${fields.slice(0, -1).join(', ')}, and ${fields[fields.length - 1]}`
}

function isTechnicalMessage(message) {
  return TECHNICAL_MESSAGE_PATTERNS.some((pattern) => pattern.test(message))
}

export const getFriendlyErrorGuidance = (value, fallback = DEFAULT_ERROR_GUIDANCE) => {
  const rawMessage = extractMessageValue(value)

  if (!rawMessage) {
    return fallback
  }

  if (value && typeof value === 'object' && value.userMessage) {
    const userMessage = String(value.userMessage).trim()
    if (userMessage) {
      return userMessage
    }
  }

  const validationFields = extractValidationFields(value, rawMessage)
  if (validationFields.length > 0) {
    const formattedFields = formatFriendlyFieldList(validationFields)
    return validationFields.length === 1
      ? `Please check the ${formattedFields} and try again.`
      : `Please review the ${formattedFields} fields and try again.`
  }

  if (isTechnicalMessage(rawMessage)) {
    return fallback
  }

  return rawMessage
}

/**
 * Success toast helper.
 * Example: notifySuccess('Login successful.');
 */
export const notifySuccess = (message = 'Action completed successfully.') => {
  toast.success(message)
}

/**
 * Error toast helper with guidance.
 * Example: notifyError('Login failed.', 'Check your email/password and try again.');
 */
export const notifyError = (
  message = 'Action failed.',
  guideline = DEFAULT_ERROR_GUIDANCE
) => {
  toast.error(`${message}\nWhat to do: ${getFriendlyErrorGuidance(guideline)}`)
}

/**
 * Retry-capable error toast helper.
 * Example: notifyErrorWithRetry('Load failed.', 'Please retry.', () => refetch())
 */
export const notifyErrorWithRetry = (
  message = 'Action failed.',
  guideline = DEFAULT_ERROR_GUIDANCE,
  onRetry,
  retryLabel = 'Retry'
) => {
  if (typeof onRetry !== 'function') {
    notifyError(message, guideline)
    return
  }

  toast.custom(
    (toastRef) =>
      createElement(
        'div',
        {
          style: {
            maxWidth: '420px',
            borderRadius: '10px',
            background: '#1f2937',
            border: '1px solid #ef4444',
            color: '#fff',
            boxShadow: '0 10px 28px rgba(15, 23, 42, 0.35)',
            padding: '12px 14px',
          },
        },
        createElement(
          'p',
          {
            style: { margin: 0, fontSize: '14px', fontWeight: 600, lineHeight: 1.4 },
          },
          message
        ),
        createElement(
          'p',
          {
            style: { margin: '6px 0 10px 0', fontSize: '12px', opacity: 0.95, lineHeight: 1.4 },
          },
          `What to do: ${getFriendlyErrorGuidance(guideline)}`
        ),
        createElement(
          'button',
          {
            type: 'button',
            style: {
              border: '1px solid rgba(255,255,255,0.35)',
              borderRadius: '8px',
              background: '#334155',
              color: '#fff',
              fontSize: '12px',
              fontWeight: 600,
              padding: '6px 10px',
              cursor: 'pointer',
            },
            onClick: () => {
              toast.dismiss(toastRef.id)
              onRetry()
            },
          },
          retryLabel
        )
      ),
    {
      duration: 9000,
    }
  )
}
