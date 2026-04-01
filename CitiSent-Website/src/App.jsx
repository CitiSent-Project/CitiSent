import { Navbar } from './components/ui/Navbar'
import { PageSkeleton } from './components/ui/PageSkeleton'
import Toasters from './components/ui/Toasters'
import { renderActivePage, renderAuthPage } from './controllers/pageRouterController'
import { getLoginAuthPage, getRegisterAuthPage } from './controllers/navigationController'
import { useAppStateOrchestrator } from './hooks/useAppStateOrchestrator'

function App() {
  const {
    appState,
    appActions,
  } = useAppStateOrchestrator()

  if (!appState.authReady) {
    return (
      <>
        <Toasters />
        <PageSkeleton pageKey={appState.activePage} />
      </>
    )
  }

  if (!appState.isAuthenticated) {
    return (
      <>
        <Toasters />
        {renderAuthPage({
          authPage: appState.authPage,
          onRegister: appActions.onRegister,
          onSwitchToLogin: () => appActions.setAuthPage(getLoginAuthPage()),
          onLogin: appActions.onLogin,
          onSwitchToRegister: () => appActions.setAuthPage(getRegisterAuthPage()),
          rememberedEmail: appState.rememberedEmail,
          departmentOptions: appState.departmentOptions,
        })}
      </>
    )
  }

  return (
    <>
      <Toasters />
      <Navbar
        activePage={appState.activePage}
        onNavigate={appActions.onNavigate}
        profileRole={appState.profile.role}
        unreadNotifications={appState.unreadNotifications}
      >
        {appState.isPageLoading ? (
          <PageSkeleton pageKey={appState.activePage} />
        ) : (
          renderActivePage({
            appState,
            appActions: {
              ...appActions,
              onConfirmLogout: appActions.onLogout,
            },
          })
        )}
      </Navbar>
    </>
  )
}

export default App
