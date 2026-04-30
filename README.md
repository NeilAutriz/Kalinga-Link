# 🌱 KalingaLink

> **Tunay na malasakit, sama-sama.**
> A community feeding & development platform for the children of **Los Baños, Laguna** — connecting UPLB students, IRRI staff, parish volunteers, barangay councils, and donors around a single, transparent operations record.

[![MERN](https://img.shields.io/badge/stack-MERN-103713?style=flat-square)](#tech-stack)
[![React 18](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white&style=flat-square)](#tech-stack)
[![Node 20](https://img.shields.io/badge/Node-20-339933?logo=node.js&logoColor=white&style=flat-square)](#tech-stack)
[![MongoDB Atlas](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white&style=flat-square)](#tech-stack)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white&style=flat-square)](#tech-stack)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-06B6D4?logo=tailwindcss&logoColor=white&style=flat-square)](#tech-stack)
[![License: MIT](https://img.shields.io/badge/License-MIT-E2DBD0?style=flat-square)](#license)

---

## ✨ Why KalingaLink

Across Los Baños, dozens of kapwa-driven groups — UPLB student orgs, IRRI staff, parishes, the Rural Health Unit, barangay nutrition workers — already feed, teach, treat, and uplift the children of the bayan. **What's missing is a single, shared operations record.**

KalingaLink replaces the messy patchwork of group chats, paper sign-up sheets, and spreadsheet pledges with one consent-first, role-aware web app where every cycle, every committee slot, every supply pledge, and every measured child outcome is tracked **live** against a real database.

It's built for a HUME 100 community development course at UPLB, but it is engineered as a real product: real auth, real Atlas, real RBAC, real audit trail.

---

## 🧭 Six programs, one community

| Program | What it covers |
|---|---|
| 🍚 **Feeding** | Hot, balanced meals every cycle for partner sitios |
| 🩺 **Health** | Free check-ups, deworming, vitamins, BP screening with the LB RHU |
| 📚 **Learning** | Reading buddies, tutorials, library deliveries with UPLB orgs |
| 🌿 **Environment** | Trail clean-ups, segregation drives, Mt. Makiling stewardship |
| 💼 **Livelihood** | Workshops on gardening, food prep, microenterprise for guardians |
| 🎨 **Youth** | Pahiyas-inspired art days, sportsfests, music nights for kabataan |

Operating across **7 partner barangays** — Batong Malake, Anos, Bambang, Bayog, Maahas, Tadlac, Putho-Tuntungin (incl. Sitio Villegas).

---

## 🧑‍🤝‍🧑 Roles & access (RBAC, scoped front-to-back)

| Role | Can do |
|---|---|
| 👀 **Public** | Browse home, about, events, resources, donate page |
| 🙋 **Volunteer** | + Sign up to event committees, cancel sign-ups, pledge supplies |
| 🎁 **Donor** | + Pledge supplies, cancel own pledges (sign-ups hidden) |
| 🩺 **Health partner** | + Consented child registry, growth measurements, longitudinal trends |
| 🛠️ **Organizer** | + Operations console, child monitoring, event/committee management |

Scoping is enforced **three times** for defence in depth:
1. **Frontend nav** — `lib/nav.ts` is the single source of truth, hiding what each role can't use.
2. **Frontend route guard** — `<ProtectedRoute roles=[...]>` redirects mismatched roles to their canonical home.
3. **Backend middleware** — `requireAuth` + `requireRole` + per-endpoint role checks (e.g. only `volunteer`/`organizer` can take committee slots).

---

## 🏗️ Architecture

```
┌──────────────────────────┐      ┌──────────────────────────┐      ┌──────────────────────┐
│   React 18 + Vite + TS   │ ───▶ │ Express 4 REST API       │ ───▶ │ MongoDB Atlas        │
│   Tailwind · React Query │ ◀─── │ argon2id · JWT cookie    │ ◀─── │ 9 collections, idx'd │
│   Toasts · Modal system  │      │ Zod validation · Audit   │      │ Aggregations for live│
└──────────────────────────┘      └──────────────────────────┘      │ filled & pledged sums│
        port 5174                            port 5050              └──────────────────────┘
```

### Data model (9 collections)
`User`, `Event`, `Committee`, `VolunteerSignup`, `ResourceNeed`, `Pledge`, `ChildRecord`, `Measurement`, `AuditLog`.

Key invariants enforced in the DB layer:
- Unique `(committeeId, userId)` index — **no duplicate signups**.
- Capacity check before signup — **no overfilled committees**.
- `Pledge.donorUserId` linked when authenticated → user dashboards reflect their real history.
- Cancelled rows excluded from aggregations → progress bars stay truthful.

---

## 🛠️ Tech stack

**Frontend** — React 18, TypeScript (strict), Vite, Tailwind CSS, React Router 6, TanStack Query, Axios, lucide-react, custom Toast + Modal systems.

**Backend** — Node 20, Express 4, Mongoose 8, Zod, argon2 (password hashing), jsonwebtoken (httpOnly cookie + bearer), Helmet, CORS, cookie-parser.

**Database** — MongoDB Atlas (M0 free tier OK), seeded via a deterministic Node script.

**Tooling** — ESM throughout, Nodemon, ESLint, Prettier-friendly Tailwind plugin.

---

## 🚀 Getting started

### Prerequisites
- **Node 20+** and **npm 10+**
- A free **MongoDB Atlas** cluster (or local mongod on `:27017`)

### 1. Clone & install
```bash
git clone https://github.com/MNAutriz/Kalinga-Link.git
cd Kalinga-Link

# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

### 2. Configure environment
Create `backend/.env`:
```env
PORT=5050
MONGO_URI=mongodb+srv://<user>:<pass>@<cluster>/kalingalink?retryWrites=true&w=majority
JWT_SECRET=change-me-to-a-32+char-random-string
COOKIE_DOMAIN=localhost
NODE_ENV=development
CORS_ORIGIN=http://localhost:5174
```

Create `frontend/.env`:
```env
VITE_API_URL=http://localhost:5050/api/v1
```

### 3. Seed the database (one-time)
```bash
cd backend
npm run seed
```
Populates **22 users**, **12 events**, **7 barangays**, **51 committees**, **132 sample sign-ups**, **102 resource needs**, **186 pledges**, **18 children**, **54 measurements**.

### 4. Run dev servers
In two terminals:
```bash
# Terminal 1
cd backend && npm run dev      # → http://localhost:5050

# Terminal 2
cd frontend && npm run dev     # → http://localhost:5174
```

---

## 🧪 Demo accounts

All passwords: **`password123`**

| Role | Email | Lands on |
|---|---|---|
| 🛠️ Organizer | `organizer@kalingalink.local` | `/organizer` |
| 🩺 Health partner | `health@kalingalink.local` | `/children` |
| 🙋 Volunteer | `volunteer@kalingalink.local` | `/dashboard` |
| 🎁 Donor | `donor@kalingalink.local` | `/dashboard` |

Try logging in as each role to see the navigation and dashboards adapt automatically.

---

## 🎨 Design language

A locally-inspired palette evoking Mt. Makiling and rice terraces:

| Token | Hex | Use |
|---|---|---|
| **Phthalo Green** | `#103713` | Primary text, buttons, brand |
| **Maximum Green** | `#628B35` | Accent, success, CTAs |
| **Bone** | `#E2DBD0` | Borders, soft surfaces |
| **Milk** | `#FFFDF5` | Page background |

Typography: **Plus Jakarta Sans** for display, **Inter** for body.

Hero imagery from Wikimedia Commons (Los Baños Municipal Hall and Mt. Makiling).

---

## 📁 Repository layout

```
KalingaLink/
├── backend/                # Express + Mongoose API
│   └── src/
│       ├── config/         # env, db connection
│       ├── middleware/     # auth, requireRole, validate, error
│       ├── models/         # 9 Mongoose schemas
│       ├── routes/         # auth, events, committees, resources, children, dashboard, me
│       └── seed/           # deterministic Los Baños seed
├── frontend/               # Vite + React + TS app
│   └── src/
│       ├── components/     # Modal, Toast, Header, Footer, EventCard, CommitteeCard, …
│       ├── contexts/       # AuthContext
│       ├── lib/            # nav, types, useApi, format
│       ├── pages/          # Home, Events, EventDetail, Donate, Dashboards, …
│       ├── services/       # axios api client
│       └── styles/         # Tailwind layer + keyframes
├── database/               # ER diagram + index notes
├── docs/                   # design notes, screenshots
└── mockups/                # original UI mocks
```

---

## 🧠 Engineering highlights

- **Strict, no-mock data plane.** Every list view reads from Atlas via the same `useApi` hook; cancelling a signup or pledge mutates the DB and the UI re-fetches in place.
- **Reusable Modal & ConfirmModal** with variants (`info` / `success` / `danger`), busy-locking, gradient color bars, and animated entry.
- **Toast notification system** with four kinds (success / error / info / loading), auto-dismiss, ARIA-correct roles. Replaced every `alert()` and inline status banner.
- **Aggregations over GET** — committee `filled` and resource `quantityReceived` are computed live via `$lookup`/`$group`, never stored stale.
- **Consent-first child records** — every `ChildRecord` requires guardian consent before measurements can be added.
- **Audit log** for sensitive mutations (role changes, child record edits).

---

## 🗺️ Roadmap

- [ ] SMS reminders for upcoming sign-ups (Twilio / Semaphore)
- [ ] Offline-first mode for field health workers (PWA)
- [ ] Tagalog / English language toggle
- [ ] CSV / printable reports per cycle for barangay councils
- [ ] Photo upload (consent-tagged) for events

---

## 🤝 Acknowledgements

Built for **HUME 100 — Humanities and Society**, UP Los Baños.

Inspired by the real-life kapwa work of UPLB CHE Community Nutrition, UPLB CSS Sociology, IRRI Staff Council, the Los Baños Rural Health Unit, the parish volunteers of St. Therese & San Antonio, the LB Coffee Club community, and the seven partner barangays of Los Baños.

Hero photography: *Los Baños Municipal Hall* and *Mt. Makiling* — Wikimedia Commons.

---

## 📜 License

Released under the **MIT License**. See [LICENSE](LICENSE) for details.

---

<sub>Made with 🌿 in Los Baños · _Tunay na malasakit, sama-sama._</sub>
