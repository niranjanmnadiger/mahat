# Appointment Booking API (TypeScript)

Express + Mongoose + Zod REST API for booking appointments against providers and
services, with derived time slots and clash prevention.

## Setup

```bash
npm install
cp .env.example .env      # then fill in MONGO_URL
npm run dev               # tsx watch, no build step
npm test                  # 33 tests, no DB needed
npm run typecheck         # tsc --noEmit
npm run build && npm start
```

`GET /health` confirms the server is up.

## Layout

```
src/
  index.ts                   entry point: env -> db -> server
  app.ts                     express app, route mounting, error handling
  config/db.ts               mongo connection
  types/express.d.ts         Request augmentation (req.validatedQuery)
  models/                    mongoose schemas + the interfaces they are typed by
  repositories/              database queries only
  services/                  business rules (this is where clashes are caught)
  controllers/               request -> service -> response
  routes/                    endpoints + validation middleware
  validations/               zod schemas (also the source of the request types)
  middlewares/               validate + central error handler
  utils/                     ApiError, asyncHandler, pure time helpers
tests/run.ts                 33 tests, no external dependencies
```

Request types are not hand-written twice — they come out of the Zod schemas via
`z.infer`, so schema and type cannot drift apart.

## Time slots

An appointment occupies a half-open interval `[startTime, endTime)`.

**The customer only chooses `startTime`.** `endTime` is always derived from the
booked service's `durationMinutes` and is not accepted from the request. Book a
30 minute consultation at 10:00 and you own 10:00–10:30; there is no way to
stretch that from the client side.

```jsonc
// 30 minute service booked at 10:00 -> slot is 10:00-10:30
{ "customerId": "...", "providerId": "...", "serviceId": "...",
  "startTime": "2026-09-01T10:00:00.000Z" }
```

Sending `endTime` now returns 400 (`Unrecognized key`) rather than being quietly
honoured, because every body is `.strict()`.

`durationMinutes` is snapshotted onto the appointment, so editing a service later
does not rewrite the history of past bookings.

## Clash rules

Two slots overlap when **each one starts before the other ends**:

```
existing.startTime < new.endTime  AND  existing.endTime > new.startTime
```

Both comparisons are strict, so back-to-back bookings are allowed.

| Existing      | Requested     | Result                 |
| ------------- | ------------- | ---------------------- |
| 10:00 – 10:30 | 10:00 – 10:30 | 409 conflict           |
| 10:00 – 10:30 | 10:15 – 10:45 | 409 conflict           |
| 10:00 – 11:00 | 10:15 – 10:30 | 409 conflict           |
| 10:00 – 10:30 | 10:30 – 11:00 | allowed (back-to-back) |
| 10:00 – 10:30 | 14:00 – 14:30 | allowed                |

Both sides of the booking are checked:

1. **Provider** is not double-booked. The query filters on `providerId` only —
   *not* on `serviceId` — so a provider busy with any one of their services is
   busy for all of them.
2. **Customer** is not double-booked, even across different providers.

A **cancelled** appointment releases its slot. A **completed** one does not — it
really did occupy that time.

A 409 names the booking that is in the way:

```json
{
  "success": false,
  "message": "Provider is already booked during this time slot",
  "errors": {
    "conflictsWith": {
      "appointmentId": "66f1...",
      "startTime": "2026-09-01T10:00:00.000Z",
      "endTime": "2026-09-01T10:30:00.000Z",
      "status": "booked",
      "customer": "Gagan",
      "provider": "Dr A",
      "service": "Heart Consultation"
    }
  }
}
```

### Concurrency

The application check is read-then-write, so two requests arriving in the same
few milliseconds can both pass it. A partial unique index closes the common case
at the database level:

```
{ providerId: 1, startTime: 1 }  unique, partialFilterExpression: { status: "booked" }
```

The loser of the race fails at insert time with an E11000, which the error
middleware turns into the same 409. Only `booked` rows are indexed, so
cancelling genuinely frees the slot.

This still does not cover two *overlapping but differently-started* bookings
racing each other (10:00 and 10:15 arriving together). Closing that fully needs
either a MongoDB transaction around check-and-insert (requires a replica set) or
a short-lived lock keyed on `providerId`.

## Validation

Every route runs its request through a Zod schema before the controller is
reached. Bodies and query objects are `.strict()`, so an unknown key is rejected
rather than silently ignored — a typo like `appointmentDate` fails loudly.

| Field                | Rule                                                                     |
| -------------------- | ------------------------------------------------------------------------ |
| any `*Id`            | 24 character hex ObjectId                                                |
| `startTime`, `from`, `to` | strict ISO-8601 date-time (`2026-09-01T10:00:00.000Z` or `+05:30`) |
| `phone`              | exactly 10 digits after normalising `+91` / `91` / `0` and separators; must start 6–9 |
| `email`              | valid address, lowercased                                                |
| `name`               | 2–100 characters, trimmed                                                |
| `price`              | number, not negative                                                     |
| `durationMinutes`    | whole number, 1–1440                                                     |
| `notes`, `description` | max 500 characters                                                     |
| `status`             | `booked` \| `completed` \| `cancelled`                                   |

The parsed body replaces `req.body`, so controllers receive trimmed strings and
real `Date` objects. The parsed query is exposed as `req.validatedQuery` —
`req.query` is a getter on Express 5 and is re-derived per request on Express 4,
so it is never written back over.

Failures return 400 with a flat field list:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    { "field": "body.customerId", "message": "Must be a valid MongoDB ObjectId" },
    { "field": "body.phone", "message": "Phone must be a 10 digit mobile number" }
  ]
}
```

## Endpoints

| Method | Path                           | Notes                                            |
| ------ | ------------------------------ | ------------------------------------------------ |
| GET    | `/health`                      | liveness check                                   |
| POST   | `/customers`                   | name, phone, email?                              |
| GET    | `/customers`                   |                                                  |
| GET    | `/customers/:id`               |                                                  |
| DELETE | `/customers/:id`               | blocked while booked appointments exist          |
| POST   | `/providers`                   | name, type, phone?, email?                       |
| GET    | `/providers`                   |                                                  |
| GET    | `/providers/:id`               |                                                  |
| DELETE | `/providers/:id`               | blocked while booked appointments exist          |
| POST   | `/services`                    | name, price, durationMinutes, providerId         |
| GET    | `/services`                    | `?providerId=`                                   |
| GET    | `/services/:id`                |                                                  |
| DELETE | `/services/:id`                | blocked while booked appointments exist          |
| POST   | `/appointments`                | books a slot, runs the clash checks              |
| GET    | `/appointments`                | `?providerId= &customerId= &serviceId= &status= &from= &to=` |
| GET    | `/appointments/:id`            |                                                  |
| PATCH  | `/appointments/:id/reschedule` | new `startTime` only                             |
| PATCH  | `/appointments/:id/status`     | `booked` → `completed` \| `cancelled`            |
| DELETE | `/appointments/:id`            |                                                  |

Status codes: `201` created, `200` ok, `400` validation/business rule,
`404` not found, `409` conflict (clash, duplicate phone), `500` unexpected.

## Breaking changes from the JavaScript version

- `endTime` is no longer accepted on create or reschedule. Because bodies are
  strict, sending it is a 400.
- `phone` was `[0-9+\-\s()]{10,15}`, which accepted `((((((((((`. It is now
  exactly 10 digits after normalisation.
- Date fields require real ISO-8601. `"tomorrow morning"` and `"2026"` used to
  be coerced (the second into 1 Jan); both are now 400.
- Query strings are strict, so `?providerid=` (wrong case) is a 400 instead of
  being ignored and returning every appointment.
- New index `uniq_provider_start_when_booked`. On an existing collection with
  duplicate booked slots the index build will fail until they are cleaned up.
