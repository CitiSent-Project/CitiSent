# Admin Module

This module owns backend authorization-aware admin workflows:

- scoped report review
- office-admin department assignment
- department transfer request submission and review

Route-level role checks happen in middleware. Resource-level scope checks stay in the service/repository layers.
