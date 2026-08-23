import { Suspense, useEffect, useMemo, useState } from 'react'
import { useIsFetching, useQueryClient } from '@tanstack/react-query'
import { Navbar } from './components/ui/Navbar'
import { BackendUnavailablePanel } from './components/ui/BackendUnavailablePanel'
import { ErrorBoundary } from './components/ui/ErrorBoundary'
import { PageSkeleton } from './components/ui/PageSkeleton'
import Toasters from './components/ui/Toasters'
import { renderActivePage, renderAuthPage } from './controllers/pageRouterController'
import { getLoginAuthPage } from './controllers/navigationController'
import { useAppStateOrchestrator } from './hooks/useAppStateOrchestrator'
import { SetupPasswordPage } from './frontend/Pages/SetupPassword'

function isBackendUnavailableError(error) {
  const status = Number(error?.status)
  const message = String(error?.message || '').toLowerCase()

  if (Number.isFinite(status) && status >= 500) {
    return true
  }

  return (
    message.includes('unable to reach the api server') ||
    message.includes('request timed out') ||
    message.includes('networkerror') ||
    message.includes('failed to fetch') ||
    message.includes('service unavailable')
  )
}

function resolveConnectionStatus({ sessionBootstrapError, hasBackendQueryError, isFetchingAny }) {
  if (isFetchingAny && (sessionBootstrapError || hasBackendQueryError)) {
    return 'reconnecting'
  }

  if (sessionBootstrapError || hasBackendQueryError) {
    return 'offline'
  }

  if (isFetchingAny) {
    return 'reconnecting'
  }

  return 'connected'
}

function AuthenticatedApp() {
  const queryClient = useQueryClient()
  const activeFetchCount = useIsFetching()
  const [hasBackendQueryError, setHasBackendQueryError] = useState(false)

  const {
    appState,
    appActions,
  } = useAppStateOrchestrator()

  useEffect(() => {
    const queryCache = queryClient.getQueryCache()

    const updateQueryErrorState = () => {
      const hasUnavailableError = queryCache
        .getAll()
        .some((query) => isBackendUnavailableError(query.state.error))

      setTimeout(() => {
        setHasBackendQueryError(hasUnavailableError)
      }, 0)
    }

    updateQueryErrorState()
    const unsubscribe = queryCache.subscribe(updateQueryErrorState)

    return unsubscribe
  }, [queryClient])

  const connectionStatus = useMemo(
    () =>
      resolveConnectionStatus({
        sessionBootstrapError: appState.sessionBootstrapError,
        hasBackendQueryError,
        isFetchingAny: activeFetchCount > 0,
      }),
    [appState.sessionBootstrapError, hasBackendQueryError, activeFetchCount]
  )

  if (!appState.authReady) {
    return (
      <>
        <Toasters />
        <PageSkeleton pageKey={appState.activePage} />
      </>
    )
  }

  if (appState.sessionBootstrapError) {
    return (
      <>
        <Toasters />
        <BackendUnavailablePanel
          title={appState.sessionBootstrapError.title}
          message={appState.sessionBootstrapError.message}
          onRetry={appActions.onRetrySessionBootstrap}
          onSignOut={appActions.onLogout}
        />
      </>
    )
  }

  if (!appState.isAuthenticated) {
    return (
      <>
        <Toasters />
        <ErrorBoundary resetKeys={[appState.authPage]}>
          {renderAuthPage({
            onLogin: appActions.onLogin,
            onForgotPassword: appActions.onForgotPassword,
            rememberedEmail: appState.rememberedEmail,
          })}
        </ErrorBoundary>
      </>
    )
  }

  return (
    <>
      <Toasters />
      <ErrorBoundary resetKeys={[appState.activePage, appState.profile.id]}>
        <Navbar
          activePage={appState.activePage}
          onNavigate={appActions.onNavigate}
          profileRole={appState.profile.role}
          unreadNotifications={appState.unreadNotifications}
          connectionStatus={connectionStatus}
        >
          {appState.isPageLoading ? (
            <PageSkeleton pageKey={appState.activePage} />
          ) : (
            <Suspense fallback={<PageSkeleton pageKey={appState.activePage} />}>
              {renderActivePage({
                appState,
                appActions: {
                  ...appActions,
                  onConfirmLogout: appActions.onLogout,
                },
              })}
            </Suspense>
          )}
        </Navbar>
      </ErrorBoundary>
    </>
  )
}

function App() {
  const isAuthView = ['/setup-password', '/reset-password'].includes(window.location.pathname)

  useEffect(() => {
    if (isAuthView) {
      document.documentElement.dataset.theme = 'light'
    }
  }, [isAuthView])

  if (isAuthView) {
    return (
      <>
        <Toasters />
        <SetupPasswordPage />
      </>
    )
  }

  return <AuthenticatedApp />
}

export default App
