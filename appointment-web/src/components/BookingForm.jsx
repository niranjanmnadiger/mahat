import { useEffect, useState } from "react";
import { appointmentsApi } from "../api/endpoints";
import { useAction } from "../hooks/useAction";
import { refId } from "../utils/refs";
import {
  addMinutes,
  formatDay,
  formatPrice,
  formatTime,
  fromLocalInputValue,
  toLocalInputValue,
} from "../utils/time";
import ErrorBanner from "./ErrorBanner";
import Field from "./Field";
import Notice from "./Notice";

const EMPTY = { customerId: "", providerId: "", serviceId: "", start: "", notes: "" };

/**
 * A service belongs to one provider, and the API rejects a mismatched pair.
 * When the provider changes: keep the chosen service if it still fits,
 * auto-pick when the provider offers exactly one, otherwise clear it.
 */
function serviceFor(providerId, currentServiceId, services) {
  const offered = services.filter((s) => refId(s.providerId) === providerId);
  if (offered.some((s) => s._id === currentServiceId)) return currentServiceId;
  return offered.length === 1 ? offered[0]._id : "";
}

export default function BookingForm({ customers, providers, services, prefill, onBooked }) {
  const [form, setForm] = useState(EMPTY);
  const [notice, setNotice] = useState("");
  const { run, busy, error, setError, clearError } = useAction();

  // Clicking an empty spot on the day board sends a provider + start time here.
  useEffect(() => {
    if (!prefill) return;
    setForm((prev) => ({
      ...prev,
      providerId: prefill.providerId,
      serviceId: serviceFor(prefill.providerId, prev.serviceId, services),
      start: toLocalInputValue(prefill.start),
    }));
    setNotice("");
    clearError();
    // Runs only when a new pick arrives. Re-running on `services` changes would
    // overwrite whatever the user typed after clicking the board.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefill]);

  const offered = services.filter((s) => refId(s.providerId) === form.providerId);
  const service = offered.find((s) => s._id === form.serviceId);
  const startDate = fromLocalInputValue(form.start);
  // Preview only. The API computes the real endTime from the same duration.
  const endDate = service && startDate ? addMinutes(startDate, service.durationMinutes) : null;

  function update(field, value) {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "providerId") next.serviceId = serviceFor(value, prev.serviceId, services);
      return next;
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setNotice("");
    if (!startDate) {
      setError(new Error("Choose a start time."));
      return;
    }

    let created;
    const ok = await run("book", async () => {
      created = await appointmentsApi.create({
        customerId: form.customerId,
        providerId: form.providerId,
        serviceId: form.serviceId,
        startTime: startDate.toISOString(),
        notes: form.notes.trim(),
      });
    });
    if (!ok) return;

    const providerName = providers.find((p) => p._id === form.providerId)?.name;
    const bookedAt = created?.startTime ?? startDate;
    setNotice(
      `Booked ${service.name} with ${providerName} on ${formatDay(bookedAt)} at ${formatTime(bookedAt)}.`
    );
    setForm((prev) => ({ ...prev, start: "", notes: "" }));
    onBooked?.(created ?? { startTime: bookedAt.toISOString() });
  }

  const submitting = busy === "book";

  return (
    <form className="panel" onSubmit={handleSubmit}>
      <h2 className="panel-title">Book an appointment</h2>

      <ErrorBanner error={error} onDismiss={clearError} />
      <Notice onDismiss={() => setNotice("")}>{notice}</Notice>

      <Field
        label="Customer"
        hint={customers.length === 0 ? "No customers yet. Add one on the Customers tab." : null}
      >
        <select
          required
          value={form.customerId}
          onChange={(e) => update("customerId", e.target.value)}
        >
          <option value="">Choose a customer</option>
          {customers.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name} ({c.phone})
            </option>
          ))}
        </select>
      </Field>

      <Field label="Provider">
        <select
          required
          value={form.providerId}
          onChange={(e) => update("providerId", e.target.value)}
        >
          <option value="">Choose a provider</option>
          {providers.map((p) => (
            <option key={p._id} value={p._id}>
              {p.name}
              {p.type ? `, ${p.type}` : ""}
            </option>
          ))}
        </select>
      </Field>

      <Field
        label="Service"
        hint={
          form.providerId && offered.length === 0
            ? "This provider has no services yet. Add one on the Services tab."
            : null
        }
      >
        <select
          required
          disabled={!form.providerId || offered.length === 0}
          value={form.serviceId}
          onChange={(e) => update("serviceId", e.target.value)}
        >
          <option value="">{form.providerId ? "Choose a service" : "Choose a provider first"}</option>
          {offered.map((s) => (
            <option key={s._id} value={s._id}>
              {s.name}, {s.durationMinutes} min, {formatPrice(s.price)}
            </option>
          ))}
        </select>
      </Field>

      <Field
        label="Starts at"
        hint={endDate ? `Runs until ${formatTime(endDate)} (${service.durationMinutes} min)` : "Or click a free spot on the day board."}
      >
        <input
          type="datetime-local"
          required
          step={300}
          value={form.start}
          onChange={(e) => update("start", e.target.value)}
        />
      </Field>

      <Field label="Notes (optional)">
        <textarea
          rows={2}
          maxLength={500}
          value={form.notes}
          onChange={(e) => update("notes", e.target.value)}
        />
      </Field>

      <button type="submit" className="button" disabled={submitting}>
        {submitting ? "Booking…" : "Book appointment"}
      </button>
    </form>
  );
}
