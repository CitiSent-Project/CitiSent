# Src Core Entry Files

Scope: files grouped under src-core for CitiSent-Website.

## File: src/App.jsx

- Purpose: Top-level application shell that coordinates auth, navigation, and page rendering.
- Export Surface: No explicit exports (or export detection not applicable).
- Imports: ./components/ui/Navbar, ./components/ui/PageSkeleton, ./components/ui/Toasters, ./controllers/pageRouterController, ./controllers/navigationController, ./hooks/useAppStateOrchestrator
- Functions Declared: 1

### Function: App()

- Defined At: line 7
- Specific Purpose: Implements file-specific feature logic that supports this module's behavior and data flow.
- Inputs: No explicit parameters; relies on closure/module context and imported dependencies.
- Output: Returns JSX elements (React render output) for the component subtree.
- Side Effects: Updates React/application state via setter calls. Publishes user-facing toast/notification feedback.
- Key Dependencies: ./components/ui/Navbar, ./components/ui/PageSkeleton, ./components/ui/Toasters, ./controllers/pageRouterController, ./controllers/navigationController
- Usage Scope: Internal helper; intended to be used only within this module.

## File: src/index.css

- Purpose: Global style layer for shared typography, tokens, and utility styling.
- Export Surface: No explicit exports (or export detection not applicable).
- Functions: Not applicable for this file type.

## File: src/main.jsx

- Purpose: Application bootstrap entry that mounts the root React component.
- Export Surface: No explicit exports (or export detection not applicable).
- Imports: react, react-dom/client, ./App.jsx, ./index.css
- Functions: None explicitly declared in this module.
