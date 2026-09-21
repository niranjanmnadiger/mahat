# Appointment Booking API

Express + Mongoose REST API for booking appointments against providers and services,
with real time slots, double-booking prevention and Zod request validation.

## Setup

```bash
npm install
cp .env.example .env      # then fill in MONGO_URL
npm run dev               # or: npm start
npm test                  # runs the booking-rule test suite (no DB needed)
```

`GET /health` confirms the server is up.

## Layout

```
index.js                     entry point: env -> db -> server
src/
  app.js                     express app, route mounting, error handling
  config/db.js               mongo connection
  models/                    mongoose schemas
  repositories/              database queries only
  services/                  business rules (this is where conflicts are caught)
  controllers/               request -> service -> response
  routes/                    endpoints + validation middleware
  validations/               zod schemas
  middlewares/               validate + central error handler
  utils/                     ApiError, asyncHandler, pure time helpers
tests/run.js                 27 tests, no external dependencies
```

## Time slots

An appointment occupies a half-open interval `[startTime, endTime)`.

- `startTime` is **required** on every booking.
- `endTime` is **optional** — omit it and the API derives it from the service's
  `durationMinutes`. Send it explicitly when a visit needs a non-standard length.
- `durationMinutes` is snapshotted onto the appointment, so editing a service
  later does not rewrite the history of past bookings.

```jsonc
// endTime derived: 10:00 + 30min service = 10:30
{ "customerId": "...", "providerId": "...", "serviceId": "...",
  "startTime": "2026-09-01T10:00:00.000Z" }

// endTime explicit: a longer 90 minute visit
{ "customerId": "...", "providerId": "...", "serviceId": "...",
  "startTime": "2026-09-01T10:00:00.000Z",
  "endTime":   "2026-09-01T11:30:00.000Z" }
```

## Conflict rules

Two slots overlap when **each one starts before the other ends**:

```
existing.startTime < new.endTime  AND  existing.endTime > new.startTime
```

Because both comparisons are strict, back-to-back bookings are allowed.

| Existing        | Requested       | Result                |
| --------------- | --------------- | --------------------- |
| 10:00 – 10:30   | 10:00 – 10:30   | 409 conflict          |
| 10:00 – 10:30   | 10:15 – 10:45   | 409 conflict          |
| 10:00 – 11:00   | 10:15 – 10:30   | 409 conflict          |
| 10:00 – 10:30   | 10:30 – 11:00   | allowed (back-to-back)|
| 10:00 – 10:30   | 14:00 – 14:30   | allowed               |

Both sides of the booking are checked:

1. **Provider** is not double-booked — one provider cannot serve two customers at once.
2. **Customer** is not double-booked — one customer cannot be in two places at once,
   even across different providers.

Also enforced: the service must belong to the selected provider, the slot cannot
start in the past, and `endTime` must be after `startTime`.

A **cancelled** appointment releases its slot. A **completed** one does not — it
really did occupy that time.

A 409 response names the booking that is in the way:

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

## Validation

Every route runs its request through a Zod schema before the controller is reached
(`src/middlewares/validate.js`). Bodies are `.strict()`, so an unknown key is
rejected rather than silently ignored — a typo like `appointmentDate` fails loudly.

Parsed values replace the raw ones, so controllers receive trimmed strings and real
`Date` objects. Validated query strings are exposed as `req.validatedQuery`
(`req.query` is read-only in newer Express).

Failures return 400 with a flat field list:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    { "field": "body.customerId", "message": "Must be a valid MongoDB ObjectId" },
    { "field": "body.startTime",  "message": "Invalid date" }
  ]
}
```

## Endpoints

| Method | Path                           | Notes                                    |
| ------ | ------------------------------ | ---------------------------------------- |
| GET    | `/health`                      | liveness check                           |
| POST   | `/customers`                   | name, phone, email?                      |
| GET    | `/customers`                   |                                          |
| GET    | `/customers/:id`               |                                          |
| DELETE | `/customers/:id`               | blocked while booked appointments exist  |
| POST   | `/providers`                   | name, type, phone?, email?               |
| GET    | `/providers`                   |                                          |
| GET    | `/providers/:id`               |                                          |
| DELETE | `/providers/:id`               | blocked while booked appointments exist  |
| POST   | `/services`                    | name, price, durationMinutes, providerId |
| GET    | `/services`                    | `?providerId=`                           |
| GET    | `/services/:id`                |                                          |
| DELETE | `/services/:id`                | blocked while booked appointments exist  |
| POST   | `/appointments`                | books a slot, runs conflict checks       |
| GET    | `/appointments`                | `?providerId= &customerId= &status= &from= &to=` |
| GET    | `/appointments/:id`            |                                          |
| PATCH  | `/appointments/:id/reschedule` | new `startTime` (+ optional `endTime`)   |
| PATCH  | `/appointments/:id/status`     | `booked` → `completed` \| `cancelled`    |
| DELETE | `/appointments/:id`            |                                          |

Status codes: `201` created, `200` ok, `400` validation/business rule,
`404` not found, `409` conflict (double booking, duplicate phone), `500` unexpected.

## Notes

- **Breaking change from the previous version:** `appointmentDate` is gone,
  replaced by `startTime` + `endTime`. Existing documents need migrating (set
  `startTime = appointmentDate`, then derive `endTime` and `durationMinutes`).
- **Concurrency:** the conflict check is read-then-write, so two identical requests
  arriving in the same few milliseconds could both pass. For a single-process API
  this is very unlikely; to close it fully, wrap the check and insert in a
  MongoDB transaction, or add a Redis lock keyed on `providerId:startTime`.
- Rotate the credentials in `.env` before this goes anywhere public — the file was
  committed previously and `.gitignore` now excludes it.
