import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createAppointment, getCustomers, getProviders, getServices } from "../api";
import { toApiTime } from "../helpers";

export default function BookAppointment() {
  // useNavigate lets the code move to another page after a successful booking.
  const navigate = useNavigate();

  const [customers, setCustomers] = useState([]);
  const [providers, setProviders] = useState([]);
  const [services, setServices] = useState([]);

  const [customerId, setCustomerId] = useState("");
  const [providerId, setProviderId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [startTime, setStartTime] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadLists() {
      try {
        setCustomers(await getCustomers());
        setProviders(await getProviders());
        setServices(await getServices());
      } catch (err) {
        setError(err.message);
      }
    }
    loadLists();
  }, []);

  // Every service belongs to one provider, and the backend refuses a
  // mismatched pair. So only show the chosen provider's services.
  const servicesForProvider = services.filter((service) => {
    const id = typeof service.providerId === "string" ? service.providerId : service.providerId._id;
    return id === providerId;
  });

  // When the provider changes, the old service choice may no longer be valid.
  function handleProviderChange(newProviderId) {
    setProviderId(newProviderId);
    setServiceId("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      const appointment = {
        customerId,
        providerId,
        serviceId,
        // The backend needs a full ISO timestamp, not "2026-09-20T14:30".
        startTime: toApiTime(startTime),
      };
      // Notice there is no endTime. The backend works it out from the
      // service's duration, and rejects the request if you send one.
      if (notes) appointment.notes = notes;

      await createAppointment(appointment);

      // Booking worked, so go to the list.
      navigate("/appointments");
    } catch (err) {
      // A clash (409) lands here, with the conflicting booking in the message.
      setError(err.message);
    }
  }

  return (
    <div>
      <h2>Book an appointment</h2>

      {error && <p className="error">{error}</p>}

      <form className="form" onSubmit={handleSubmit}>
        <label>
          Customer
          <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} required>
            <option value="">Choose a customer</option>
            {customers.map((customer) => (
              <option key={customer._id} value={customer._id}>
                {customer.name} ({customer.phone})
              </option>
            ))}
          </select>
        </label>

        <label>
          Provider
          <select value={providerId} onChange={(e) => handleProviderChange(e.target.value)} required>
            <option value="">Choose a provider</option>
            {providers.map((provider) => (
              <option key={provider._id} value={provider._id}>
                {provider.name} ({provider.type})
              </option>
            ))}
          </select>
        </label>

        <label>
          Service
          <select
            value={serviceId}
            onChange={(e) => setServiceId(e.target.value)}
            disabled={!providerId}
            required
          >
            <option value="">{providerId ? "Choose a service" : "Choose a provider first"}</option>
            {servicesForProvider.map((service) => (
              <option key={service._id} value={service._id}>
                {service.name} ({service.durationMinutes} min)
              </option>
            ))}
          </select>
        </label>

        <label>
          Start time
          <input
            type="datetime-local"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            required
          />
        </label>

        <label>
          Notes (optional)
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows="2" />
        </label>

        <button type="submit">Book</button>
      </form>
    </div>
  );
}
