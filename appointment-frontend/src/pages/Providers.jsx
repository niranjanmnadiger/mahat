import { useEffect, useState } from "react";
import { createProvider, deleteProvider, getProviders } from "../api";

export default function Providers() {
  const [providers, setProviders] = useState([]);
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");

  async function loadProviders() {
    try {
      const data = await getProviders();
      setProviders(data);
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    loadProviders();
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      const newProvider = { name, type };
      if (phone) newProvider.phone = phone;

      await createProvider(newProvider);

      setName("");
      setType("");
      setPhone("");
      setError("");
      loadProviders();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this provider? Their services will be deleted too.")) return;

    try {
      await deleteProvider(id);
      loadProviders();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <h2>Providers</h2>

      {error && <p className="error">{error}</p>}

      <form className="form" onSubmit={handleSubmit}>
        <label>
          Name
          <input value={name} onChange={(e) => setName(e.target.value)} required />
        </label>

        <label>
          Type
          <input
            value={type}
            onChange={(e) => setType(e.target.value)}
            placeholder="cardio, dermatology..."
            required
          />
        </label>

        <label>
          Phone (optional)
          <input value={phone} onChange={(e) => setPhone(e.target.value)} />
        </label>

        <button type="submit">Add provider</button>
      </form>

      <table className="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Phone</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {providers.map((provider) => (
            <tr key={provider._id}>
              <td>{provider.name}</td>
              <td>{provider.type}</td>
              <td>{provider.phone || "-"}</td>
              <td>
                <button onClick={() => handleDelete(provider._id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {providers.length === 0 && <p>No providers yet.</p>}
    </div>
  );
}
