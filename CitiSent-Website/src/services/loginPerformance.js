const PERF_FLAG = import.meta.env.VITE_LOGIN_PERF_DEBUG === 'true'

function now() {
  return typeof performance?.now === 'function' ? performance.now() : Date.now()
}

export function createLoginPerformance(onComplete) {
  const startedAt = now()
  const marks = { buttonPressed: startedAt }

  function mark(name) {
    marks[name] = now()
  }

  function finish() {
    mark('finished')
    const duration = (start, end) => Math.max(0, Math.round((marks[end] ?? marks.finished) - (marks[start] ?? startedAt)))
    const result = {
      authDurationMs: duration('requestStarted', 'authenticationCompleted'),
      profileDurationMs: 0,
      permissionsDurationMs: 0,
      notificationDurationMs: 0,
      reportsDurationMs: 0,
      otherApiDurationMs: 0,
      navigationDurationMs: duration('authenticationCompleted', 'navigationCompleted'),
      totalLoginDurationMs: Math.max(0, Math.round(marks.finished - startedAt)),
    }

    if (PERF_FLAG) console.info('[login-performance] website', result)
    onComplete?.(result)
    return result
  }

  return { mark, finish }
}
