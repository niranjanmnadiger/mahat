import { useState } from "react";
import { appointmentsApi } from "../api/endpoints";
import ErrorBanner from "../components/ErrorBanner";
import StatusPill from "../components/StatusPill";
import { useAction } from "../hooks/useAction";
import { useAppointments } from "../hooks/useAppointments";
import { refName } from "../utils/refs";
import {
  endOfDay,
  formatDay,
  formatRange,
  fromLocalInputValue,
  startOfDay,
  toLocalInputValue,
} from "../utils/time";

const NO_FILTERS = { providerId: "", customerId: "", status: "", fromDay: "", toDay: "" };

export default function AppointmentsPage({ directory }) {
  const { customers, providers, services } = directory;
  const [filters, setFilters] = useState(NO_FILTERS);
  const [editing, setEditing] = useState(null); // { id, value } while rescheduling a row

  // The API's query schema is strict: exact key names, ISO dates. Empty values
  // are dropped by the client before the request goes out.
  const { appointments, loading, error, reload } = useAppointments({
    providerId: filters.providerId,
    customerId: filters.customerId,
    status: filters.status,
    from: filters.fromDay ? startOfDay(filters.fromDay).toISOString() : "",
    to: filters.toDay ? endOfDay(filters.toDay).toISOString() : "",
  });

  const { run, busy, error: actionError, clearError } = useAction();

  const setFilter = (key, value) => setFilters((prev) => ({ ...prev, [key]: value }));

  async function act(key, fn) {
    const ok = await run(key, fn);
    if (ok) {
      setEditing(null);
      reload();
    }
  }

  function saveReschedule(id) {
    const date = fromLocalInputValue(editing.value);
    if (!date) return;
    act(`reschedule:${id}`, () => appointmentsApi.reschedule(id, date.toISOString()));
  }

  function cancelAppointment(a) {
    if (!window.confirm(`Cancel ${refName(a.customerId, customers)}'s appointment? The slot becomes free again.`)) return;
    act(`status:${a._id}`, () => appointmentsApi.setStatus(a._id, "cancelled"));
  }

  function deleteAppointment(a) {
    if (!window.confirm("Delete this appointment permanently? This can't be undone.")) return;
    act(`delete:${a._id}`, () => appointmentsApi.remove(a._id));
  }

  return (
    <section aria-labelledby="appointments-title">
      <h2 id="appointments-title" className="page-title">Appointments</h2>

      <div className="filters">
        <label className="field">
          <span className="field-label">Provider</span>
          <select value={filters.providerId} onChange={(e) => setFilter("providerId", e.target.value)}>
            <option value="">All providers</option>
            {providers.map((p) => (
              <option key={p._id} value={p._id}>{p.name}</option>
            ))}
          </select>
        </label>
        <label className="field">
          <span className="field-label">Customer</span>
          <select value={filters.customerId} onChange={(e) => setFilter("customerId", e.target.value)}>
            <option value="">All customers</option>
            {customers.map((c) => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>
        </label>
        <label className="field">
          <span className="field-label">Status</span>
          <select value={filters.status} onChange={(e) => setFilter("status", e.target.value)}>
            <option value="">Any status</option>
            <option value="booked">Booked</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </label>
        <label className="field">
          <span className="field-label">From</span>
          <input type="date" value={filters.fromDay} onChange={(e) => setFilter("fromDay", e.target.value)} />
        </label>
        <label className="field">
          <span className="field-label">To</span>
          <input type="date" value={filters.toDay} onChange={(e) => setFilter("toDay", e.target.value)} />
        </label>
        <button type="button" className="text-button filters-reset" onClick={() => setFilters(NO_FILTERS)}>
          Clear filters
        </button>
      </div>

      <ErrorBanner error={error} onRetry={reload} />
      <ErrorBanner error={actionError} onDismiss={clearError} />

      <p className="day-meta" aria-live="polite">
        {loading ? "Loading appointments…" : `${appointments.length} appointment${appointments.length === 1 ? "" : "s"}`}
      </p>

      {!loading && appointments.length === 0 ? (
        <p className="empty">No appointments match these filters. Book one from the Schedule tab.</p>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">When</th>
                <th scope="col">Customer</th>
                <th scope="col">Provider</th>
                <th scope="col">Service</th>
                <th scope="col">Status</th>
                <th scope="col"><span className="visually-hidden">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {console.log("APPOINTMENTS IN UI:", appointments)}
              {appointments.map((a) => {
                const rowBusy = typeof busy === "string" && busy.endsWith(a._id);
                const isEditing = editing?.id === a._id;
                return (
                  <tr key={a._id}>
                    <td className="nowrap">
                      <div className="cell-strong">{formatDay(a.startTime)}</div>
                      <div className="cell-soft tabular">{formatRange(a.startTime, a.endTime)}</div>
                    </td>
                    <td>{refName(a.customerId, customers)}</td>
                    <td>{refName(a.providerId, providers)}</td>
                    <td>
                      {refName(a.serviceId, services)}
                      {a.notes && <div className="cell-soft">{a.notes}</div>}
                    </td>
                    <td><StatusPill status={a.status} /></td>
                    <td className="row-actions">
                      {isEditing ? (
                        <div className="inline-edit">
                          <input
                            type="datetime-local"
                            aria-label="New start time"
                            step={300}
                            value={editing.value}
                            onChange={(e) => setEditing({ id: a._id, value: e.target.value })}
                          />
                          <button type="button" className="button" disabled={rowBusy} onClick={() => saveReschedule(a._id)}>
                            Save time
                          </button>
                          <button type="button" className="text-button" onClick={() => setEditing(null)}>
                            Keep current
                          </button>
                        </div>
                      ) : a.status === "booked" ? (
                        <>
                          <button
                            type="button"
                            className="text-button"
                            disabled={rowBusy}
                            onClick={() => setEditing({ id: a._id, value: toLocalInputValue(new Date(a.startTime)) })}
                          >
                            Reschedule
                          </button>
                          <button
                            type="button"
                            className="text-button"
                            disabled={rowBusy}
                            onClick={() => act(`status:${a._id}`, () => appointmentsApi.setStatus(a._id, "completed"))}
                          >
                            Mark completed
                          </button>
                          <button type="button" className="text-button" disabled={rowBusy} onClick={() => cancelAppointment(a)}>
                            Cancel
                          </button>
                        </>
                      ) : null}
                      {!isEditing && (
                        <button
                          type="button"
                          className="text-button text-danger"
                          disabled={rowBusy}
                          onClick={() => deleteAppointment(a)}
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
