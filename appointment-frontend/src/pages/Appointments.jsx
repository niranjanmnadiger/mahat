import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { changeAppointmentStatus, deleteAppointment, getAppointments } from "../api";
import { showDateTime, showTime } from "../helpers";

export default function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [status, setStatus] = useState(""); // "" means every status
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  // `status` is passed straight to the backend as ?status=booked
  async function loadAppointments() {
    setLoading(true);
    try {
      const data = await getAppointments({ status });
      setAppointments(data);
      setError("");
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }

  // Runs on the first render, and again whenever `status` changes.
  useEffect(() => {
    loadAppointments();
  }, [status]);

  async function handleStatusChange(id, newStatus) {
    try {
      await changeAppointmentStatus(id, newStatus);
      setError("");
      loadAppointments();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this appointment?")) return;

    try {
      await deleteAppointment(id);
      loadAppointments();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <h2>Appointments</h2>

      {error && <p className="error">{error}</p>}

      <div className="toolbar">
        <label>
          Status
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All</option>
            <option value="booked">Booked</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </label>

        <Link className="button-link" to="/book">
          Book appointment
        </Link>
      </div>

      {loading && <p>Loading...</p>}

      <table className="table">
        <thead>
          <tr>
            <th>When</th>
            <th>Customer</th>
            <th>Provider</th>
            <th>Service</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {appointments.map((appointment) => (
            <tr key={appointment._id}>
              <td>
                {showDateTime(appointment.startTime)} to {showTime(appointment.endTime)}
              </td>
              {/* The backend sends the full customer, provider and service
                  objects inside the appointment, so read .name from each. */}
              <td>{appointment.customerId.name}</td>
              <td>{appointment.providerId.name}</td>
              <td>{appointment.serviceId.name}</td>
              <td>{appointment.status}</td>
              <td>
                {/* Only a booked appointment can be completed or cancelled. */}
                {appointment.status === "booked" && (
                  <>
                    <button onClick={() => handleStatusChange(appointment._id, "completed")}>
                      Complete
                    </button>
                    <button onClick={() => handleStatusChange(appointment._id, "cancelled")}>
                      Cancel
                    </button>
                  </>
                )}
                <button onClick={() => handleDelete(appointment._id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {!loading && appointments.length === 0 && <p>No appointments found.</p>}
    </div>
  );
}
