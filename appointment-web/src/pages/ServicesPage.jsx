import { useState } from "react";
import { servicesApi } from "../api/endpoints";
import ErrorBanner from "../components/ErrorBanner";
import Field from "../components/Field";
import { useAction } from "../hooks/useAction";
import { refId, refName } from "../utils/refs";
import { formatPrice } from "../utils/time";

const EMPTY = { name: "", providerId: "", durationMinutes: "30", price: "", description: "" };

export default function ServicesPage({ directory }) {
  const { providers, services, reload } = directory;
  const [form, setForm] = useState(EMPTY);
  const [providerFilter, setProviderFilter] = useState("");
  const { run, busy, error, clearError } = useAction();

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  const shown = providerFilter ? services.filter((s) => refId(s.providerId) === providerFilter) : services;

  async function handleSubmit(event) {
    event.preventDefault();
    const ok = await run("create", () => servicesApi.create(form));
    if (ok) {
      setForm((prev) => ({ ...EMPTY, providerId: prev.providerId })); // keep provider for the next one
      reload();
    }
  }

  async function handleDelete(service) {
    if (!window.confirm(`Delete ${service.name}? This can't be undone.`)) return;
    if (await run(`delete:${service._id}`, () => servicesApi.remove(service._id))) reload();
  }

  return (
    <div className="split">
      <form className="panel" onSubmit={handleSubmit}>
        <h2 className="panel-title">Add a service</h2>
        <Field label="Name">
          <input required value={form.name} onChange={(e) => update("name", e.target.value)} />
        </Field>
        <Field
          label="Provider"
          hint={providers.length === 0 ? "Add a provider first. Every service belongs to one." : null}
        >
          <select required value={form.providerId} onChange={(e) => update("providerId", e.target.value)}>
            <option value="">Choose a provider</option>
            {providers.map((p) => (
              <option key={p._id} value={p._id}>{p.name}</option>
            ))}
          </select>
        </Field>
        <div className="field-row">
          <Field label="Duration (min)" hint="Sets how long every booking lasts.">
            <input
              required
              type="number"
              min={5}
              step={5}
              value={form.durationMinutes}
              onChange={(e) => update("durationMinutes", e.target.value)}
            />
          </Field>
          <Field label="Price (₹)">
            <input
              required
              type="number"
              min={0}
              value={form.price}
              onChange={(e) => update("price", e.target.value)}
            />
          </Field>
        </div>
        <Field label="Description (optional)">
          <textarea rows={2} value={form.description} onChange={(e) => update("description", e.target.value)} />
        </Field>
        <button type="submit" className="button" disabled={busy === "create"}>
          {busy === "create" ? "Adding…" : "Add service"}
        </button>
      </form>

      <section aria-labelledby="services-title">
        <div className="section-head">
          <h2 id="services-title" className="page-title">Services</h2>
          <select
            aria-label="Show services for"
            value={providerFilter}
            onChange={(e) => setProviderFilter(e.target.value)}
          >
            <option value="">All providers</option>
            {providers.map((p) => (
              <option key={p._id} value={p._id}>{p.name}</option>
            ))}
          </select>
        </div>
        <ErrorBanner error={error} onDismiss={clearError} />
        {shown.length === 0 ? (
          <p className="empty">No services here yet. A provider needs at least one before they can be booked.</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Service</th>
                  <th scope="col">Provider</th>
                  <th scope="col" className="num">Duration</th>
                  <th scope="col" className="num">Price</th>
                  <th scope="col"><span className="visually-hidden">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {shown.map((s) => (
                  <tr key={s._id}>
                    <td>
                      <div className="cell-strong">{s.name}</div>
                      {s.description && <div className="cell-soft">{s.description}</div>}
                    </td>
                    <td>{refName(s.providerId, providers)}</td>
                    <td className="num tabular">{s.durationMinutes} min</td>
                    <td className="num tabular">{formatPrice(s.price)}</td>
                    <td className="row-actions">
                      <button
                        type="button"
                        className="text-button text-danger"
                        disabled={busy === `delete:${s._id}`}
                        onClick={() => handleDelete(s)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
