import { useState } from "react";
import { providersApi } from "../api/endpoints";
import ErrorBanner from "../components/ErrorBanner";
import Field from "../components/Field";
import { useAction } from "../hooks/useAction";
import { refId } from "../utils/refs";

const EMPTY = { name: "", type: "", phone: "", email: "" };

export default function ProvidersPage({ directory }) {
  const { providers, services, reload } = directory;
  const [form, setForm] = useState(EMPTY);
  const { run, busy, error, clearError } = useAction();

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  const serviceCount = (providerId) => services.filter((s) => refId(s.providerId) === providerId).length;

  async function handleSubmit(event) {
    event.preventDefault();
    const ok = await run("create", () => providersApi.create(form));
    if (ok) {
      setForm(EMPTY);
      reload();
    }
  }

  async function handleDelete(provider) {
    if (!window.confirm(`Delete ${provider.name}? This can't be undone.`)) return;
    if (await run(`delete:${provider._id}`, () => providersApi.remove(provider._id))) reload();
  }

  return (
    <div className="split">
      <form className="panel" onSubmit={handleSubmit}>
        <h2 className="panel-title">Add a provider</h2>
        <Field label="Name">
          <input required value={form.name} onChange={(e) => update("name", e.target.value)} />
        </Field>
        <Field label="Specialty" hint="For example: cardio, dermatology, physiotherapy.">
          <input required value={form.type} onChange={(e) => update("type", e.target.value)} />
        </Field>
        <Field label="Phone (optional)">
          <input type="tel" inputMode="tel" value={form.phone} onChange={(e) => update("phone", e.target.value)} />
        </Field>
        <Field label="Email (optional)">
          <input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} />
        </Field>
        <button type="submit" className="button" disabled={busy === "create"}>
          {busy === "create" ? "Adding…" : "Add provider"}
        </button>
      </form>

      <section aria-labelledby="providers-title">
        <h2 id="providers-title" className="page-title">Providers</h2>
        <ErrorBanner error={error} onDismiss={clearError} />
        {providers.length === 0 ? (
          <p className="empty">No providers yet. Add one, then give them a service to make them bookable.</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col">Specialty</th>
                  <th scope="col">Contact</th>
                  <th scope="col">Services</th>
                  <th scope="col"><span className="visually-hidden">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {providers.map((p) => (
                  <tr key={p._id}>
                    <td className="cell-strong">{p.name}</td>
                    <td>{p.type}</td>
                    <td>
                      {p.phone && <div className="tabular">{p.phone}</div>}
                      {p.email && <div className="cell-soft">{p.email}</div>}
                      {!p.phone && !p.email && <span className="cell-soft">None</span>}
                    </td>
                    <td className="tabular">{serviceCount(p._id)}</td>
                    <td className="row-actions">
                      <button
                        type="button"
                        className="text-button text-danger"
                        disabled={busy === `delete:${p._id}`}
                        onClick={() => handleDelete(p)}
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
