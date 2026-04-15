import { toast } from 'react-hot-toast'
import { createElement } from 'react'

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
  guideline = 'Please verify your input, check your connection, and try again.'
) => {
  toast.error(`${message}\nWhat to do: ${guideline}`)
}

/**
 * Retry-capable error toast helper.
 * Example: notifyErrorWithRetry('Load failed.', 'Please retry.', () => refetch())
 */
export const notifyErrorWithRetry = (
  message = 'Action failed.',
  guideline = 'Please verify your input, check your connection, and try again.',
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
          `What to do: ${guideline}`
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
