# CitiSent Website

Admin website for CitiSent, built with React + Vite.

## Documentation Hub

Comprehensive file/function documentation is available in:

- [docs/reference/index.md](docs/reference/index.md)

The reference set documents:

- Every in-scope file in CitiSent-Website
- Each declared function/method in JS/JSX modules
- Purpose, inputs, outputs, side effects, dependencies, and usage scope per function
- DB wiring fast paths (API client, auth flow, reports flow, access control, persistence)

## Per-Folder Reference Files

- [docs/reference/root-and-public.md](docs/reference/root-and-public.md)
- [docs/reference/src-core.md](docs/reference/src-core.md)
- [docs/reference/src-components.md](docs/reference/src-components.md)
- [docs/reference/src-controllers.md](docs/reference/src-controllers.md)
- [docs/reference/src-frontend.md](docs/reference/src-frontend.md)
- [docs/reference/src-hooks.md](docs/reference/src-hooks.md)
- [docs/reference/src-models.md](docs/reference/src-models.md)
- [docs/reference/src-services.md](docs/reference/src-services.md)
- [docs/reference/project-tooling.md](docs/reference/project-tooling.md)

Coverage manifest:

- [docs/reference/_coverage-manifest.json](docs/reference/_coverage-manifest.json)

## Regenerate Documentation

When files/functions are added or refactored, regenerate docs with:

```powershell
./scripts/generate-documentation.ps1
```

## Development Commands

Install dependencies:

```powershell
npm install
```

Run web + backend together (recommended for local development):

```powershell
npm run dev
```

Run only the website:

```powershell
 npm run dev:web
```

Run only the backend from this folder:

```powershell
npm run dev:backend
```

Build for production:

```powershell
npm run build
```

Run lint:

```powershell
npm run lint
```
