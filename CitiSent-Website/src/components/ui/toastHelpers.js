import { toast } from 'react-hot-toast'

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
