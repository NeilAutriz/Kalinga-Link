# Database

KalingaLink uses **MongoDB** via Mongoose. Live, runtime schemas are owned by the backend in [`backend/src/models`](../backend/src/models). This folder holds **reference docs**, **indexes**, **seed data**, and any future migration scripts.

## Contents

```
database/
├── README.md           # This file
├── schema-reference.md # Human-readable schema overview
├── indexes.md          # Required indexes per collection
├── seeds/
│   └── sample.json     # Sample documents for manual import
└── migrations/         # Future: change scripts (e.g., migrate-mongo)
```

## Connecting locally

```bash
# Start MongoDB (macOS via Homebrew)
brew services start mongodb-community

# Default URI
mongodb://localhost:27017/kalingalink
```

## Seeding

The backend ships a programmatic seed script:

```bash
cd ../backend
npm run seed
```

This inserts: 1 organizer, 1 volunteer, 1 published event, 5 committees, 5 resource needs.
