import { useState } from 'react'
import { Navbar } from './components/Navbar'
import { Dashboard } from './frontend/Dashboard'
import { Users } from './frontend/Users'
import { Reports } from './frontend/Reports/Reports'
import { UpdateNews } from './frontend/UpdateNews'
import { Settings } from './frontend/Settings'

function App() {
    const [activePage, setActivePage] = useState('Dashboard')

    const renderPage = () => {
        switch (activePage) {
            case 'Dashboard':
                return <Dashboard />
            case 'Users':
                return <Users />
            case 'Reports':
                return <Reports section="category" />
            case 'Reports:By Category':
                return <Reports section="category" />
            case 'Reports:By Urgency Levels':
                return <Reports section="urgency" />
            case 'Update News':
                return <UpdateNews />
            case 'Settings':
                return <Settings />
            default:
                return <Dashboard />
        }
    }

    return (
        <Navbar activePage={activePage} onNavigate={setActivePage}>
            {renderPage()}
        </Navbar>
    )
}

export default App
