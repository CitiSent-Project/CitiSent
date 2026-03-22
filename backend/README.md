# CitiSent Backend

Express.js + Supabase backend scaffolded with clean architecture principles and secure defaults.

## Current Folder Structure

```text
backend/
  src/
    app.js
    server.js
    config/
      env.js
      logger.js
      supabase.js
    middlewares/
      auth.js
      errorHandler.js
      notFound.js
      requestContext.js
      validateRequest.js
    routes/
      index.js
    modules/
      health/
        health.controller.js
        health.route.js
      reports/
        reports.controller.js
        reports.mapper.js
        reports.repository.js
        reports.route.js
        reports.schema.js
        reports.service.js
    shared/
      errors/
        appError.js
      utils/
        asyncHandler.js
```

## Architectural Rules

- `routes`: endpoint composition only.
- `controller`: HTTP request/response mapping only.
- `service`: use-case and business logic.
- `repository`: Supabase queries and persistence logic.
- `schema`: request validation contracts with Zod.
- `middlewares`: cross-cutting concerns (auth, validation, errors, request context).
- `shared`: generic reusable utilities and error primitives.

## Scalable Target Structure (Recommended)

```text
backend/
  database/
    migrations/
    seeds/
  src/
    app.js
    server.js
    config/
      env.js
      logger.js
      supabase.js
    middlewares/
      auth.js
      errorHandler.js
      notFound.js
      requestContext.js
      validateRequest.js
    routes/
      index.js
    modules/
      <feature>/
        <feature>.controller.js
        <feature>.service.js
        <feature>.repository.js
        <feature>.route.js
        <feature>.schema.js
        <feature>.mapper.js
        README.md
    shared/
      errors/
        appError.js
      utils/
        asyncHandler.js
```

Use this as your baseline whenever you add new domains like `notifications`, `users`, `analytics`, and `sentiment`.

## Naming Conventions

- JavaScript files: `camelCase` (example: `requestContext.js`, `validateRequest.js`).
- React component files (`.jsx`): `PascalCase` (example: `ReportCard.jsx`).
- Feature module files: `<feature>.<layer>.js` for consistency (`reports.service.js`).
- Avoid duplicate config files; keep one source of truth per concern.

## Security Baseline

- `helmet` for secure headers.
- `cors` allowlist from environment config.
- `express-rate-limit` for abuse protection.
- `hpp` for HTTP parameter pollution prevention.
- JSON body size limit (`1mb`) to reduce payload abuse.
- Auth middleware validates Supabase JWT (`Bearer <token>`).

## Caching

- `GET /api/v1/reports` responses are cached by user + query filters (`limit`, `offset`, `status`).
- TTL is controlled by `CACHE_TTL_SECONDS` (default: `60`).
- `POST /api/v1/reports` invalidates the cached report-list entries for that user.
- Cache driver selection:
  - `CACHE_DRIVER=auto` (default): uses Redis if `REDIS_URL` is set, otherwise in-memory cache.
  - `CACHE_DRIVER=redis`: forces Redis usage (falls back to memory if Redis is unavailable).
  - `CACHE_DRIVER=memory`: uses in-memory cache only.

## Setup

1. Copy `.env.example` to `.env` and fill your Supabase values.
2. Install dependencies:
   - `npm install`
3. Start server:
   - `npm run dev`
4. Base URL:
   - `http://localhost:4000`

## API Endpoints

- `GET /` health banner
- `GET /api/v1/health` runtime health
- `GET /api/v1/health/supabase` Supabase connectivity and readiness health
- Auth:
  - `POST /api/v1/auth/register`
  - `POST /api/v1/auth/login`
  - `POST /api/v1/auth/forgot-password`
  - `GET /api/v1/auth/me` (authenticated)
  - `POST /api/v1/auth/logout`
- Users:
  - `GET /api/v1/users/me` (authenticated)
  - `PATCH /api/v1/users/me` (authenticated)
- Reports:
  - `GET /api/v1/reports` authenticated list of user reports
  - `POST /api/v1/reports` authenticated report creation
  - `GET /api/v1/reports/:reportId` authenticated report detail
  - `PATCH /api/v1/reports/:reportId` authenticated report update
  - `DELETE /api/v1/reports/:reportId` authenticated report delete

## Extending the Codebase

To add a new feature (example: notifications), create a new folder under `src/modules/notifications` with:

- `notifications.route.js`
- `notifications.controller.js`
- `notifications.service.js`
- `notifications.repository.js`
- `notifications.schema.js`

Then register it in `src/routes/index.js`.
