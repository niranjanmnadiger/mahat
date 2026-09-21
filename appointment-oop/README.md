# appointment-oop

Appointment scheduling API in TypeScript. Layered architecture, every layer a class,
dependencies passed through constructors.

Same routes, same response envelope and same 409 body as the earlier version, so the
React frontend works against it unchanged.

## Run it

```bash
cp .env.example .env        # set MONGO_URI
npm install
npm run seed                # demo data: 3 providers, 4 customers, 10 appointments
npm run dev                 # http://localhost:3000
npm test                    # 19 rule tests, no database needed
npm run typecheck
```

## Routes

| Method | Path                           | Notes                                                        |
| ------ | ------------------------------ | ------------------------------------------------------------ |
| POST   | `/customers`                   | `name`, `phone`, `email?`                                    |
| GET    | `/customers` `/customers/:id`  |                                                              |
| DELETE | `/customers/:id`               | refused while booked appointments reference them             |
| POST   | `/providers`                   | `name`, `type`, `phone?`, `email?`                           |
| GET    | `/providers` `/providers/:id`  |                                                              |
| DELETE | `/providers/:id`               | also deletes their services                                  |
| POST   | `/services`                    | `name`, `price`, `durationMinutes`, `providerId`             |
| GET    | `/services`                    | `?providerId=`                                               |
| DELETE | `/services/:id`                | refused while booked                                         |
| POST   | `/appointments`                | runs both clash checks                                       |
| GET    | `/appointments`                | `?providerId= &customerId= &serviceId= &status= &from= &to=` |
| GET    | `/appointments/:id`            |                                                              |
| PATCH  | `/appointments/:id/reschedule` | `startTime` only                                             |
| PATCH  | `/appointments/:id/status`     | `completed` or `cancelled`                                   |
| DELETE | `/appointments/:id`            |                                                              |

Success: `{ "success": true, "data": ... }`.
Failure: `{ "success": false, "message": "...", "errors"?: ... }`.
Codes: 201 created, 200 ok, 400 validation or business rule, 404 not found, 409 clash or duplicate, 500 unexpected.

## Request flow

```
HTTP request
  └─ App              express.json, cors, logging
      └─ Routes       class per resource, owns one Router
          └─ RequestValidator   Zod parse -> req.validated
              └─ Controller     reads validated input, calls one service method
                  └─ Service    every business rule lives here
                      └─ Repository   the only layer that touches Mongoose
                          └─ Model    schema and indexes
  └─ ErrorHandler     the single place a thrown error becomes a response
```

Each layer may only call the one below it. A controller with a Mongoose query in it,
or a service that touches `res`, is the thing this structure exists to prevent.

## Files

```
src/
  server.ts                    entry point, the only top-level code
  Server.ts                    connect db -> listen -> graceful shutdown
  App.ts                       builds the Express app (no listen)
  Container.ts                 the one place objects are created and wired
  config/Env.ts                validates env vars at boot, throws if missing
  config/Database.ts           owns the Mongoose connection
  utils/ApiError.ts            Error subclass carrying an HTTP status
  utils/TimeSlot.ts            the booking window as a value object
  utils/asyncHandler.ts        forwards async rejections to the error middleware
  models/                      four schemas and their indexes
  repositories/BaseRepository.ts       generic CRUD, abstract
  repositories/AppointmentRepository.ts overlap queries and populated reads
  services/                    all business rules
  controllers/                 validated input in, response out
  routes/                      one Router per resource
  middlewares/                 RequestValidator, ErrorHandler
  validations/                 Zod schemas (all strict)
  seed.ts                      demo data
tests/
  logic.test.ts                19 rule tests
  fakes.ts                     in-memory repositories
```

## Class mechanics worth knowing before you defend this

**Arrow properties on controllers.** Every handler is written
`public readonly create: RequestHandler = asyncHandler(...)`, not `async create()`.
`router.post("/", controller.create)` hands Express the function detached from its
object. With a normal method, `this` is `undefined` when Express calls it, and
`this.customerService` throws. Arrow properties capture `this` when the instance is
built, so detaching them is safe. Same reason `ErrorHandler.handle` is an arrow
property.

**`abstract` on BaseRepository and BaseController.** They cannot be instantiated —
they exist only to be extended. `protected constructor` on BaseRepository means only a
subclass can call `super(Model)`, which is how a repository gets bound to exactly one
collection.

**Access modifiers as boundaries.** `protected readonly model` in BaseRepository lets
subclasses write their own queries while nothing in the service layer can reach a
Mongoose model. In AppointmentService, `assertNoClashes` and `loadAndValidateRefs` are
private, so no caller can book a slot while skipping the clash check.

**Private constructor plus static factory** appears twice. `Env.load()` either returns
a fully valid config or throws. `TimeSlot.fromStart(start, duration)` is the only way
to make a slot, which is why an `endTime` can never come from outside the system.

**Constructor injection and the Container.** No service imports a repository and
builds one; it is handed instances. That is what lets `tests/logic.test.ts` pass in
in-memory fakes and check every scheduling rule with no MongoDB running. `Container.ts`
is the single file that decides what the real objects are.

**`Object.setPrototypeOf` in ApiError.** Subclassing a built-in `Error` breaks the
prototype chain when compiled down, and `err instanceof ApiError` silently becomes
false. That one line keeps the error middleware working.

## Scheduling rules, and why each exists

1. **`endTime` is never accepted.** It is derived from the service's `durationMinutes`
   through `TimeSlot`. Otherwise a client books a 30 minute slot and holds the room for
   three hours.
2. **A provider cannot overlap themselves**, checked across all of their services, not
   just the one being booked.
3. **A customer cannot overlap themselves** either, across providers.
4. **Overlap is half-open**: `start < otherEnd && end > otherStart`. Back-to-back at
   10:30 is allowed; 10:15 is not.
5. **Only `booked` rows block a slot**, so cancelling genuinely frees the time.
6. **A unique partial index** on `{ providerId, startTime }` where `status: "booked"`
   catches the race where two requests pass the application check at the same instant.
   The error handler translates that E11000 into the same 409.
7. **`durationMinutes` is copied onto the appointment.** Editing a service later must
   not rewrite the length of past bookings.
8. **Timestamps need an explicit zone.** `2026-09-15T10:00:00Z` or `+05:30` pass;
   `2026-09-15 10:00` is a 400, because the server and browser would each guess a
   different offset.
9. **No booking in the past**, and **completed cannot be set before the start time**.
10. **Terminal states are terminal.** Nothing leaves `cancelled` or `completed` —
    un-cancelling would silently re-take a slot someone else may now hold. Rebooking
    is a new appointment, which goes through the clash check like any other.
11. **Strict bodies and strict query strings.** `{ "nmae": ... }` is a 400, not a
    nameless record. `?providerid=` is a 400, not "every appointment in the database".

## Connecting the React frontend

`.env` ships with `CORS_ORIGIN=http://localhost:5173`, which the Vite dev server uses.
The frontend proxies `/api/*` to port 3000, so both work out of the box.

Two behaviours the frontend will surface as red banners, both correct:
- **Mark completed** on a future appointment returns 400. The button is shown on every
  booked row, but the rule only allows it once the appointment has started.
- **Booking a time earlier than now** returns 400.
