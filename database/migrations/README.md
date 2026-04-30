# Migrations

For MVP, schema changes are managed via Mongoose model edits — MongoDB is schemaless so most additive changes need no migration.

When destructive or transforming changes are needed (rename a field, split a document, backfill defaults), add a numbered script here:

```
migrations/
├── 0001_add_anon_code_to_children.js
└── 0002_backfill_event_status.js
```

Recommended tool when needed: [`migrate-mongo`](https://github.com/seppevs/migrate-mongo).
