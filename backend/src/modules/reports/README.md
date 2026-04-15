# Reports Module

This module follows layered boundaries:

- `reports.route.js`: route definitions + middleware chain
- `reports.controller.js`: transport layer (HTTP)
- `reports.service.js`: business use-cases
- `reports.repository.js`: Supabase persistence
- `reports.mapper.js`: DB-to-API response shape mapping
- `reports.schema.js`: validation contract
- `reports.sentiment.js`: AI sidecar adapter + urgency normalization

Keep these boundaries strict for long-term maintainability.
