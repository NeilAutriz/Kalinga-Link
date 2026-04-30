# Indexes

Required production indexes. Mongoose creates these automatically when `autoIndex` is on (dev). For production, create explicitly.

```js
// users
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ role: 1 });

// events
db.events.createIndex({ eventDate: 1 });
db.events.createIndex({ status: 1 });

// committees
db.committees.createIndex({ eventId: 1 });

// volunteer_signups
db.volunteer_signups.createIndex({ committeeId: 1, userId: 1 }, { unique: true });
db.volunteer_signups.createIndex({ userId: 1 });

// resource_needs
db.resource_needs.createIndex({ eventId: 1 });

// pledges
db.pledges.createIndex({ resourceNeedId: 1 });
db.pledges.createIndex({ status: 1 });

// child_records
db.child_records.createIndex({ anonCode: 1 }, { unique: true });

// measurements
db.measurements.createIndex({ childId: 1 });
db.measurements.createIndex({ eventId: 1 });

// audit_logs
db.audit_logs.createIndex({ createdAt: -1 });
db.audit_logs.createIndex({ userId: 1, createdAt: -1 });
```
