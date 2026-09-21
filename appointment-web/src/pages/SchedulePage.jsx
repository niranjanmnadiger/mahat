import { useState } from "react";
import BookingForm from "../components/BookingForm";
import DayBoard from "../components/DayBoard";
import ErrorBanner from "../components/ErrorBanner";
import { useAppointments } from "../hooks/useAppointments";
import { endOfDay, formatLongDay, shiftDay, startOfDay, toDateKey } from "../utils/time";

export default function SchedulePage({ directory }) {
  const { customers, providers, services } = directory;
  const [dateKey, setDateKey] = useState(() => toDateKey(new Date()));
  const [prefill, setPrefill] = useState(null);

  const { appointments, loading, error, reload } = useAppointments({
    from: startOfDay(dateKey).toISOString(),
    to: endOfDay(dateKey).toISOString(),
  });

  const cancelledCount = appointments.filter((a) => a.status === "cancelled").length;

  function handleBooked(appointment) {
    const bookedDay = toDateKey(new Date(appointment.startTime));
    if (bookedDay === dateKey) reload();
    else setDateKey(bookedDay); // changing the date refetches on its own
  }

  return (
    <div className="split">
      <BookingForm
        customers={customers}
        providers={providers}
        services={services}
        prefill={prefill}
        onBooked={handleBooked}
      />

      <section aria-labelledby="day-title">
        <div className="day-bar">
          <h2 id="day-title" className="page-title">
            {formatLongDay(startOfDay(dateKey))}
          </h2>
          <div className="day-nav">
            <button type="button" className="button button-quiet" onClick={() => setDateKey(shiftDay(dateKey, -1))}>
              Previous day
            </button>
            <button type="button" className="button button-quiet" onClick={() => setDateKey(toDateKey(new Date()))}>
              Today
            </button>
            <button type="button" className="button button-quiet" onClick={() => setDateKey(shiftDay(dateKey, 1))}>
              Next day
            </button>
            <input
              type="date"
              aria-label="Jump to date"
              value={dateKey}
              onChange={(e) => e.target.value && setDateKey(e.target.value)}
            />
          </div>
        </div>

        <ErrorBanner error={error} onRetry={reload} />

        <p className="day-meta" aria-live="polite">
          {loading
            ? "Loading appointments…"
            : `${appointments.length - cancelledCount} on the board` +
              (cancelledCount ? `, ${cancelledCount} cancelled (hidden, their slots are free)` : "")}
        </p>

        <DayBoard
          dateKey={dateKey}
          providers={providers}
          customers={customers}
          services={services}
          appointments={appointments}
          onPickSlot={(providerId, start) => setPrefill({ providerId, start })}
        />
      </section>
    </div>
  );
}
