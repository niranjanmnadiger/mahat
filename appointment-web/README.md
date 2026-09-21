# appointment-web

Plain React (Vite, no router, no state library) front desk for the `appointment-ts` API.

## Run it

```bash
# terminal 1: the API
cd appointment-ts && npm run dev        # http://localhost:3000

# terminal 2: this app
cd appointment-web && npm install && npm run dev   # http://localhost:5173
```

The browser calls `/api/...` on the Vite server, and Vite proxies it to
`localhost:3000` with `/api` stripped (see `vite.config.js`). Same origin, so the
API needs no CORS changes in dev. If the API runs on another port, change `target`.

## Screens

| Tab          | What it does                                                   | API calls                                          |
| ------------ | -------------------------------------------------------------- | -------------------------------------------------- |
| Schedule     | Day board (one column per provider) + booking form. Click free space on a column to prefill provider and time. | `GET /appointments?from&to`, `POST /appointments` |
| Appointments | Filterable list. Reschedule, mark completed, cancel, delete.  | `GET /appointments?…`, `PATCH …/reschedule`, `PATCH …/status`, `DELETE` |
| Customers    | Add, list, delete                                              | `/customers`                                       |
| Providers    | Add, list, delete                                              | `/providers`                                       |
| Services     | Add (tied to a provider), list, filter, delete                 | `/services`                                        |

## Layout

```
src/
  api/client.js          fetch wrapper: unwraps { success, data }, throws ApiRequestError
  api/endpoints.js       one object per resource, bodies match the Zod schemas exactly
  hooks/useDirectory.js  customers + providers + services, loaded once in App
  hooks/useAppointments.js  list by filters, refetch on change, drops stale responses
  hooks/useAction.js     busy/error state for create/delete/patch buttons
  utils/time.js          local <-> ISO conversion, formatting
  utils/refs.js          read populated refs or bare ids the same way
  components/            BookingForm, DayBoard, ErrorBanner, StatusPill, Field, Notice
  pages/                 one file per tab
```

## Rules the frontend follows because the API enforces them

- `endTime` is never sent. The form only previews it from the service duration.
- Times are sent as `date.toISOString()` (UTC, with `Z`), which passes the strict ISO check.
  `datetime-local` values are read as local time first.
- Empty optional fields are dropped (`compact()`), since strict bodies reject `email: ""`.
- Query keys are exact (`providerId`, not `providerid`) and empty filters are omitted.
- A 409 clash renders `errors.conflictsWith` as the booking in the way.
- Services shown in the booking form are only the selected provider's, so the
  provider/service mismatch can't be submitted.

## Deploying (Vercel + Render)

The dev proxy doesn't exist in a production build. Set `VITE_API_URL` to the API's
public URL at build time, and allow the frontend origin on the API:

```ts
// appointment-ts: src/app.ts
import cors from "cors";
app.use(cors({ origin: process.env.CORS_ORIGIN })); // e.g. https://appointment-web.vercel.app
```
