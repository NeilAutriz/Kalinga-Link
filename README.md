# 🌱 KalingaLink

> **Tunay na malasakit, sama-sama.**
> A volunteer & resource coordination platform for the long-running monthly feeding & development program at **Sitio Villegas** — a small upland community of ~18 households at the foot of Mt. Makiling, Brgy. Putho-Tuntungin, Los Baños, Laguna.

[![Stack](https://img.shields.io/badge/stack-MERN-009688?style=flat-square)](#stack)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node](https://img.shields.io/badge/Node-20-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://www.mongodb.com/atlas)
[![Tailwind](https://img.shields.io/badge/Tailwind-3-38BDF8?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-15414b?style=flat-square)](LICENSE)

---

## 🪷 Why KalingaLink

For three years, a rotating circle of UPLB student volunteers, parish helpers, IRRI staff, and the barangay's own health workers have visited **Sitio Villegas every month** — to cook, tutor, weigh, vaccinate, and play with the children.

The work itself was already happening. What kept slowing things down was the *coordination*: scattered chat threads, paper sign-up sheets, duplicate donations, and the difficulty of telling — month over month — whether the children were actually getting healthier.

KalingaLink replaces that friction with one shared, **consent-first** record. Built as an HUME 100 community project at UP Los Baños, engineered as a real product.

### Why this sitio, specifically?

Larger municipal nutrition programs in Los Baños often miss the smallest upland sitios because they fall outside formal sitio-level statistics. Villegas is **close enough to UPLB to be reachable** for student volunteers, but **far enough up the road** that municipal feeding cycles rarely include it. Filling exactly that gap — in one place, consistently — is the program's whole reason for being.

| Sitio at a glance |  |
| --- | --- |
| Location | Sitio Villegas, Brgy. Putho-Tuntungin, Los Baños, Laguna 4031 |
| Setting | Upland, adjacent to the Makiling Forest Reserve buffer zone |
| Households | ~18 (caretakers, drivers, sari-sari owners, informal farmers) |
| Population | ~90 residents |
| Children in program | 30+, ages 3–12 |
| Access | ~25-min jeepney + 15-min uphill walk from UPLB main gate |
| Water | Single shared spring-fed reservoir |

---

## ✨ What it does

| Program | What KalingaLink coordinates for it |
| --- | --- |
| 🍲 **Feeding** | Monthly hot meals (lugaw, arroz caldo, ulam-rice) for the 30+ registered children. |
| 🩺 **Health** | Quarterly deworming, Vitamin A, BP screening with the Putho-Tuntungin BHS midwife. |
| 📚 **Learning** | Saturday tutorials & a small lending library run by UPLB student orgs. |
| 🌿 **Environment** | Sitio access-trail clean-ups, segregation drives, native-tree planting. |
| 🧰 **Livelihood** | Workshops on home gardening, food prep, and microenterprise for the nanays. |
| 🎨 **Youth & arts** | Pahiyas-themed art days, sportsfests, and music nights for the kabataan. |

---

## 👥 Five user roles, enforced front-to-back

| Role | Can do |
| --- | --- |
| **Public** | Browse upcoming visits, the about page, the resource needs list. |
| **Volunteer** | Sign up to a committee for a specific visit; cancel before the date. |
| **Donor** | Pledge a specific item (rice, vitamins, art supplies); track pledge status. |
| **Health partner** | Record consented child measurements; access child registry. |
| **Organizer** | Plan visits, post supply needs, manage committees, view all dashboards. |

RBAC is enforced **three times** — at the navigation layer, at the route guard, and again in Express middleware before any database write.

---

## 🏗️ Architecture

```
                     ┌──────────────────────────────────┐
   Browser  ◄────────┤  React 18 + Vite + Tailwind      │
   (any role)        │  React Query · Axios · Toast/Modal│
                     └──────────────┬───────────────────┘
                                    │  HTTPS · JSON
                                    ▼
                     ┌──────────────────────────────────┐
                     │  Express 4 API  (port 5050)      │
                     │  Helmet · CORS · Zod · argon2id  │
                     │  JWT (cookie + bearer)           │
                     └──────────────┬───────────────────┘
                                    │  Mongoose ODM
                                    ▼
                     ┌──────────────────────────────────┐
                     │  MongoDB Atlas — db: kalingalink │
                     │  9 collections, indexed for RBAC │
                     └──────────────────────────────────┘
```

### Data model (9 collections)

`User` · `Event` · `Committee` · `VolunteerSignup` · `ResourceNeed` · `Pledge` · `ChildRecord` · `Measurement` · `AuditLog`

Live aggregations power the dashboards:
- **Committee fill rate** — `count(signups WHERE status IN ('signed_up','attended')) / slotCount`
- **Resource progress** — `sum(pledges.quantity WHERE status='received') / quantityNeeded`
- **Child outcomes** — last measurement vs. baseline (improved / no_change / declined)

---

## 🧰 Stack

| Layer | Tech |
| --- | --- |
| Frontend | React 18 · TypeScript (strict) · Vite · Tailwind CSS · React Query · Axios · lucide-react |
| Backend | Node 20 · Express 4 · Mongoose 8 · Zod · argon2id · jsonwebtoken · Helmet · CORS · cookie-parser |
| Database | MongoDB Atlas (free tier; db: `kalingalink`) |
| Tooling | ESLint · nodemon · dotenv · concurrently |

---

## 🚀 Getting started

### Prerequisites
- Node.js **20+**
- A MongoDB Atlas cluster (free tier is enough) **or** a local MongoDB

### 1. Clone & install
```bash
git clone https://github.com/MNAutriz/Kalinga-Link.git
cd Kalinga-Link
(cd backend  && npm install)
(cd frontend && npm install)
```

### 2. Configure environment
Copy the example env files and fill in your values:
```bash
cp backend/.env.example  backend/.env
cp frontend/.env.example frontend/.env
```

`backend/.env` minimum:
```
PORT=5050
MONGO_URI=mongodb+srv://<user>:<pass>@<cluster>/kalingalink
JWT_SECRET=replace-with-a-long-random-string
CORS_ORIGIN=http://localhost:5174
```

### 3. Seed the database
```bash
cd backend
npm run seed
```
This wipes the DB and creates a realistic Sitio Villegas dataset:
**22 users · 12 visits · ~60 committees · ~120 signups · 132 resource needs · ~250 pledges · 18 child records · 54 measurements**.

### 4. Run both servers
From the project root:
```bash
npm run dev      # uses concurrently to start backend (5050) + frontend (5174)
```
Or separately:
```bash
(cd backend  && npm run dev)
(cd frontend && npm run dev)
```

Open <http://localhost:5174>.

### 🔐 Demo accounts (password: `password123`)

| Role | Email |
| --- | --- |
| Organizer | `organizer@kalingalink.local` |
| Organizer (UPLB CSS) | `mark@kalingalink.local` |
| Health partner | `health@kalingalink.local` |
| Volunteer | `volunteer@kalingalink.local` |
| Donor | `irri@kalingalink.local` |

---

## 🎨 Design system

Calm, paper-like UI inspired by community bulletin boards. Built on Tailwind with a custom palette:

| Token | Hex | Use |
| --- | --- | --- |
| `phthalo` | `#15414b` | Primary text, headers, dark surfaces |
| `maximum` | `#f4ad24` | Accent, calls-to-action, highlights |
| `bone` | `#e9e1d4` | Section backgrounds, soft borders |
| `milk` | `#fbf7f1` | Page background, card surfaces |

Plus a custom Toast system (`success / error / info / loading`) and Modal system (`default / danger / success / info`) with a `ConfirmModal` helper used across cancellations.

---

## 📁 Repository layout

```
KalingaLink/
├── backend/
│   ├── src/
│   │   ├── config/         # env, db connection
│   │   ├── controllers/    # auth controller
│   │   ├── middleware/     # auth, optionalAuth, validate, error
│   │   ├── models/         # 9 Mongoose models
│   │   ├── routes/         # auth, events, committees, resources,
│   │   │                   # children, dashboard, me
│   │   ├── scripts/seed.js # deterministic Sitio Villegas seed
│   │   └── index.js
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/     # Header, Footer, Modal, Toast, EventCard,
│   │   │                   # CommitteeCard, ProtectedRoute, ...
│   │   ├── pages/          # Home, About, Events, EventDetail,
│   │   │                   # Donate, Resources, Login, Register,
│   │   │                   # VolunteerDashboard, OrganizerDashboard,
│   │   │                   # ChildMonitoring
│   │   ├── lib/            # types, useApi, nav, format
│   │   └── styles/index.css
│   └── .env.example
├── docs/
├── mockups/                # static HTML mockups (early design phase)
├── LICENSE
└── README.md
```

---

## 🛠️ Engineering highlights

- **Strict TypeScript** across the frontend; zero `any` in the app code.
- **Zod validation** at every API boundary; bad input never reaches Mongoose.
- **argon2id** password hashing (memory-hard, KDF best-practice).
- **JWT in HttpOnly cookie** + Authorization-header fallback for API tooling.
- **`optionalAuth` middleware** lets pledges work for both anonymous donors *and* logged-in donor accounts (auto-links `donorUserId`).
- **Capacity & duplicate handling** for committee signups — server checks `slotCount` and a unique `(committeeId, userId)` index; reactivates cancelled signups instead of throwing.
- **Consent-first child registry** — every `ChildRecord` requires a guardian consent flag and date; only health/organizer roles can read or write.
- **No leaked secrets, no `node_modules`** — verified `.gitignore` keeps the repo clean.

---

## 🗺️ Roadmap

- [ ] SMS reminders for guardians the day before a visit
- [ ] Offline-first measurement entry (PWA + IndexedDB) for spotty signal in the upper houses
- [ ] Per-child growth-curve visualisation (WHO z-scores)
- [ ] Donor receipts (PDF) + monthly transparency report auto-generation
- [ ] Tagalog UI translation toggle

---

## 🙏 Acknowledgements

This platform exists because of the people who keep showing up at Sitio Villegas:

- The families of Sitio Villegas, especially **Ate Kristine** and the host households
- **Brgy. Putho-Tuntungin Council** and the **Putho-Tuntungin Brgy. Health Station** midwives
- **UPLB CSS · Sociology** and the HUME 100 teaching team
- **UPLB CHE · Community Nutrition** student orgs
- **UPLB Mountaineers**, our trail partners
- **IRRI Staff Council** medical & food volunteers
- **Parish of San Antonio de Padua, Bayog**

---

## 📜 License

MIT — see [LICENSE](LICENSE).

---

<sub>Built in Los Baños, Laguna · 🌾 An HUME 100 community project at UPLB.</sub>
