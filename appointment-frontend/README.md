# Appointment Booking — Frontend

Plain React with react-router-dom. No state library, no UI kit, no custom hooks.
Each page does its own `useState` + `useEffect` + `fetch`.

## Run it

```bash
# 1. backend first
cd appointment-oop && npm run dev      # http://localhost:3000

# 2. this app
npm install && npm run dev             # http://localhost:5173
```

The browser calls `/api/...`, and Vite forwards it to port 3000 with `/api`
removed (see `vite.config.js`). Same origin, so CORS never comes up in development.

## Files

```
src/
  main.jsx        starts React, wraps the app in <BrowserRouter>
  App.jsx         the nav bar and the list of routes
  api.js          every backend call, in one place
  helpers.js      date formatting helpers
  styles.css      plain CSS
  pages/
    Appointments.jsx     list, status filter, complete / cancel / delete
    BookAppointment.jsx  the booking form
    Customers.jsx        add, list, delete
    Providers.jsx        add, list, delete
    Services.jsx         add, list, delete
```

## Routes

| URL             | Page                  |
| --------------- | --------------------- |
| `/`             | redirects to `/appointments` |
| `/appointments` | list of appointments  |
| `/book`         | booking form          |
| `/customers`    | customers             |
| `/providers`    | providers             |
| `/services`     | services              |

## How a page works

Every page follows the same three steps:

1. `useState` holds the list and the form fields.
2. `useEffect` calls a `load...()` function once when the page appears.
3. After a create or delete succeeds, it calls `load...()` again to refresh.

`api.js` is the only file that knows about `fetch`, URLs, or the backend's
`{ success, data }` envelope. Pages just call `getCustomers()` and get an array.

## Things the backend enforces, and what this app does about them

- **No `endTime` when booking.** The backend works it out from the service's
  duration, and rejects the request if you send one.
- **A service belongs to one provider.** The booking form only shows the chosen
  provider's services, so a mismatched pair can't be submitted.
- **Times need a timezone.** `toApiTime()` converts the `datetime-local` value
  with `toISOString()`, which always includes one.
- **Empty optional fields are left out.** An empty email fails the email check,
  so those fields are only added to the request when filled in.
- **Only a booked appointment can be completed or cancelled**, so those buttons
  only appear on booked rows.
- **Completing an appointment before its start time is refused**, so trying it on
  a future booking shows an error. That is the backend working as designed.
- **`cache: "no-store"`** on every request, so the browser never sends a
  conditional request and gets back a bodiless 304.

## First run with an empty database

The booking form needs data, so create things in this order:
customer, then provider, then a service for that provider, then book.
Or run `npm run seed` in the backend.
