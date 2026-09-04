import { canAccessPage } from '../../models/roleAccessModel'

export function buildPageAccessDecision({ role, requestedPage }) {
  const allowed = canAccessPage({ role, page: requestedPage })

  if (allowed) {
    return { allowed }
  }

  return {
    allowed: false,
    activity: {
      action: 'Access denied',
      detail: `Blocked access to ${requestedPage}`,
    },
    message: 'Your account cannot access this page.',
  }
}
