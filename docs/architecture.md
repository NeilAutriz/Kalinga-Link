# KalingaLink — Architecture

## 1. High-Level Diagram

```
                           ┌──────────────────────────┐
                           │   Browser (React PWA)    │
                           │  - Volunteers / Donors   │
                           │  - Organizers / Health   │
                           └─────────────┬────────────┘
                                         │ HTTPS / JSON
                                         ▼
                           ┌──────────────────────────┐
                           │   Express REST API       │
                           │   /api/v1/*              │
                           │   - Auth (JWT cookies)   │
                           │   - RBAC middleware      │
                           │   - Zod validation       │
                           │   - Audit logging        │
                           └─────────────┬────────────┘
                                         │ Mongoose ODM
                                         ▼
                           ┌──────────────────────────┐
                           │   MongoDB                │
                           │   - users, events,       │
                           │     committees, signups, │
                           │     resources, pledges,  │
                           │     children (restricted),│
                           │     measurements,        │
                           │     audit_logs           │
                           └──────────────────────────┘
                                         │
                                         ▼
                           ┌──────────────────────────┐
                           │  Email Provider (Resend) │
                           └──────────────────────────┘
```

## 2. Layered Backend (Scalable)

```
backend/src/
├── config/         # env, db connection, logger
├── models/         # Mongoose schemas (one file per entity)
├── validators/     # Zod input schemas (per route)
├── middleware/     # auth, rbac, error, rate-limit, audit
├── controllers/    # HTTP handlers — thin
├── services/       # business logic — testable, no req/res
├── routes/         # Express routers, grouped per resource
├── utils/          # helpers (tokens, mailer, csv)
└── index.js        # app bootstrap
```

**Why this layout scales**

- **Controllers stay thin**; logic is in `services/` so it can be reused (e.g., CLI scripts, scheduled jobs).
- **Validators are isolated** so request shape errors fail fast at the boundary.
- **RBAC is middleware**, applied per route — easy to audit.
- **Models are single-purpose files**, simple to add indexes and hooks per entity.
- **Audit logging is a service**, called from any sensitive handler (child data, exports).

## 3. Frontend Structure

```
frontend/src/
├── components/     # Reusable UI primitives (Button, Card, Modal, ...)
├── features/       # Feature-scoped modules (events, volunteers, children, ...)
│   └── events/
│       ├── api.ts      # TanStack Query hooks
│       ├── components/ # Feature-specific components
│       └── pages/      # Route-level pages
├── pages/          # Top-level routed pages (Home, Login, Dashboard)
├── hooks/          # Generic hooks
├── contexts/       # Auth, Theme
├── services/       # axios client, env
├── routes/         # Route definitions, guards
├── styles/         # Tailwind base, globals
└── main.tsx
```

**Why this scales**

- **Feature folders** keep related code colocated; new features don't bloat shared dirs.
- **TanStack Query** centralizes server state, cache, retries.
- **Route guards** enforce role-based access on the client (server still enforces truth).

## 4. Data Flow Example — Volunteer Signup

1. Volunteer clicks "Sign Up" on a committee card.
2. Frontend calls `POST /api/v1/committees/:id/signups` (TanStack mutation).
3. Express runs: `requireAuth` → `requireRole('volunteer')` → `validate(signupSchema)` → `signupController.create`.
4. Controller delegates to `signupService.create`, which:
   - Checks slot availability (atomic update).
   - Creates `volunteer_signups` doc.
   - Enqueues a confirmation email.
5. Response returns updated committee state; client invalidates the committee query and re-renders.

## 5. Security Summary

- HTTPS only in prod, HSTS enabled.
- Passwords: argon2id.
- Auth: JWT in HTTP-only `Secure` `SameSite=Lax` cookie.
- CSRF: double-submit token for state-changing routes.
- Rate limiting on `/auth/*`.
- Helmet + CORS allowlist.
- Mongoose strict schemas + Zod input validation.
- Child data: role-gated, consent flag enforced in pre-save hook, every read/write written to `audit_logs`.
- Secrets only via env; `.env` never committed.

## 6. Deployment Topology (MVP)

- **Frontend** → static host (Vercel / Netlify / Render Static).
- **Backend** → Render / Railway / Fly.io (single web service).
- **Database** → MongoDB Atlas free tier.
- **Email** → Resend / SendGrid free tier.
- **CI** → GitHub Actions: lint + test on PR; deploy on merge to `main`.

## 7. Scalability Notes

- Stateless API → horizontal scaling behind a load balancer when needed.
- Mongo indexes on hot fields: `events.event_date`, `volunteer_signups (committee_id, user_id)` unique, `measurements.child_id`, `audit_logs.created_at`.
- TanStack Query reduces redundant requests on the client.
- Services are pure functions of inputs → easy to extract into workers later (e.g., email queue, CSV export).
- PWA + IndexedDB drafts allow degraded operation under poor connectivity.
