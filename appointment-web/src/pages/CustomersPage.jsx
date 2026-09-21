import { useState } from "react";
import { customersApi } from "../api/endpoints";
import ErrorBanner from "../components/ErrorBanner";
import Field from "../components/Field";
import { useAction } from "../hooks/useAction";

const EMPTY = { name: "", phone: "", email: "" };

export default function CustomersPage({ directory }) {
  const { customers, reload } = directory;
  const [form, setForm] = useState(EMPTY);
  const { run, busy, error, clearError } = useAction();

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  async function handleSubmit(event) {
    event.preventDefault();
    const ok = await run("create", () => customersApi.create(form));
    if (ok) {
      setForm(EMPTY);
      reload();
    }
  }

  async function handleDelete(customer) {
    if (!window.confirm(`Delete ${customer.name}? This can't be undone.`)) return;
    if (await run(`delete:${customer._id}`, () => customersApi.remove(customer._id))) reload();
  }

  return (
    <div className="split">
      <form className="panel" onSubmit={handleSubmit}>
        <h2 className="panel-title">Add a customer</h2>
        <Field label="Name">
          <input required value={form.name} onChange={(e) => update("name", e.target.value)} />
        </Field>
        <Field label="Phone" hint="10-digit mobile. +91 and spaces are fine.">
          <input
            required
            type="tel"
            inputMode="tel"
            value={form.phone}
            onChange={(e) => update("phone", e.target.value)}
          />
        </Field>
        <Field label="Email (optional)">
          <input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} />
        </Field>
        <button type="submit" className="button" disabled={busy === "create"}>
          {busy === "create" ? "Adding…" : "Add customer"}
        </button>
      </form>

      <section aria-labelledby="customers-title">
        <h2 id="customers-title" className="page-title">Customers</h2>
        <ErrorBanner error={error} onDismiss={clearError} />
        {customers.length === 0 ? (
          <p className="empty">No customers yet. Add the first one with the form.</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col">Phone</th>
                  <th scope="col">Email</th>
                  <th scope="col"><span className="visually-hidden">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c._id}>
                    <td className="cell-strong">{c.name}</td>
                    <td className="tabular">{c.phone}</td>
                    <td>{c.email ?? <span className="cell-soft">None</span>}</td>
                    <td className="row-actions">
                      <button
                        type="button"
                        className="text-button text-danger"
                        disabled={busy === `delete:${c._id}`}
                        onClick={() => handleDelete(c)}
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
