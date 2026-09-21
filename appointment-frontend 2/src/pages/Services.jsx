import { useEffect, useState } from "react";
import { createService, deleteService, getProviders, getServices } from "../api";

export default function Services() {
  const [services, setServices] = useState([]);
  const [providers, setProviders] = useState([]);

  const [name, setName] = useState("");
  const [providerId, setProviderId] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("30");
  const [price, setPrice] = useState("");
  const [error, setError] = useState("");

  // Needs both lists: services to show, providers to pick from in the form.
  async function loadEverything() {
    try {
      const serviceList = await getServices();
      const providerList = await getProviders();
      setServices(serviceList);
      setProviders(providerList);
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    loadEverything();
  }, []);

  // A service stores providerId. When the backend sends the list back it may
  // be a plain id string, or an object with the provider inside. This finds
  // the provider's name either way.
  function providerName(service) {
    const id = typeof service.providerId === "string" ? service.providerId : service.providerId._id;
    const provider = providers.find((p) => p._id === id);
    return provider ? provider.name : "Unknown";
  }

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      await createService({
        name,
        providerId,
        // The inputs give strings, and the backend expects numbers.
        durationMinutes: Number(durationMinutes),
        price: Number(price),
      });

      setName("");
      setPrice("");
      setDurationMinutes("30");
      setError("");
      loadEverything();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this service?")) return;

    try {
      await deleteService(id);
      loadEverything();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <h2>Services</h2>

      {error && <p className="error">{error}</p>}

      <form className="form" onSubmit={handleSubmit}>
        <label>
          Name
          <input value={name} onChange={(e) => setName(e.target.value)} required />
        </label>

        <label>
          Provider
          <select value={providerId} onChange={(e) => setProviderId(e.target.value)} required>
            <option value="">Choose a provider</option>
            {providers.map((provider) => (
              <option key={provider._id} value={provider._id}>
                {provider.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Duration (minutes)
          <input
            type="number"
            min="5"
            step="5"
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(e.target.value)}
            required
          />
        </label>

        <label>
          Price
          <input
            type="number"
            min="0"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
          />
        </label>

        <button type="submit">Add service</button>
      </form>

      <table className="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Provider</th>
            <th>Duration</th>
            <th>Price</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {services.map((service) => (
            <tr key={service._id}>
              <td>{service.name}</td>
              <td>{providerName(service)}</td>
              <td>{service.durationMinutes} min</td>
              <td>{service.price}</td>
              <td>
                <button onClick={() => handleDelete(service._id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {services.length === 0 && <p>No services yet. A provider needs one before they can be booked.</p>}
    </div>
  );
}
