# Schema Reference (MongoDB)

Authoritative source: `backend/src/models/*.js`. This document mirrors them for design review.

## users
| field | type | notes |
|---|---|---|
| email | String | unique, lowercase |
| passwordHash | String | argon2id |
| fullName | String | required |
| contactNumber | String | optional |
| affiliation | String | optional |
| role | String enum | `organizer` \| `health` \| `volunteer` \| `donor` |
| emailVerifiedAt | Date | nullable |
| createdAt / updatedAt | Date | auto |

## events
| field | type | notes |
|---|---|---|
| title | String | required |
| description | String | |
| location | String | required |
| eventDate | Date | indexed |
| startTime / endTime | String | "HH:mm" |
| targetChildren | Number | default 0 |
| status | String enum | `draft` \| `published` \| `ongoing` \| `completed` \| `cancelled` |
| createdBy | ObjectId → users | required |

## committees
| field | type | notes |
|---|---|---|
| eventId | ObjectId → events | indexed |
| name | String | required |
| description | String | |
| slotCount | Number | min 1 |
| leadUserId | ObjectId → users | optional |

## volunteer_signups
| field | type | notes |
|---|---|---|
| committeeId | ObjectId → committees | indexed |
| userId | ObjectId → users | indexed |
| status | String enum | `signed_up` \| `cancelled` \| `attended` \| `no_show` |
| signedUpAt / cancelledAt | Date | |

Unique index: `(committeeId, userId)`.

## resource_needs
| field | type | notes |
|---|---|---|
| eventId | ObjectId → events | indexed |
| itemName | String | required |
| category | String enum | food, utensils, art, hygiene, equipment, transport, other |
| quantityNeeded | Number | min 0 |
| unit | String | default `pcs` |
| notes | String | |

## pledges
| field | type | notes |
|---|---|---|
| resourceNeedId | ObjectId → resource_needs | indexed |
| donorUserId | ObjectId → users | optional |
| donorName | String | required |
| donorContact | String | |
| quantity | Number | min 1 |
| status | String enum | `pledged` \| `received` \| `cancelled` |
| receivedAt | Date | nullable |

## child_records (RESTRICTED)
| field | type | notes |
|---|---|---|
| anonCode | String | unique, auto-generated |
| firstName | String | required |
| age | Number | 0–18 |
| sex | String enum | `M` \| `F` \| `X` |
| guardianName | String | required |
| guardianContact | String | |
| consentGiven | Boolean | **must be true** to persist |
| consentDate | Date | auto-set on save |
| notes | String | |
| createdBy | ObjectId → users | required |

## measurements (RESTRICTED)
| field | type | notes |
|---|---|---|
| childId | ObjectId → child_records | indexed |
| eventId | ObjectId → events | indexed |
| heightCm | Number | min 0 |
| weightKg | Number | min 0 |
| status | String enum | `baseline` \| `monitored` \| `improved` \| `no_change` \| `declined` |
| recordedBy | ObjectId → users | required |
| recordedAt | Date | default now |
| notes | String | |

## audit_logs
| field | type | notes |
|---|---|---|
| userId | ObjectId → users | |
| action | String | required |
| entityType | String | required |
| entityId | String | |
| metadata | Mixed | JSON |
| createdAt | Date | indexed desc |
