import { useEffect, useState } from "react";
import { createCustomer, deleteCustomer, getCustomers } from "../api";

export default function Customers() {
  // The list from the backend.
  const [customers, setCustomers] = useState([]);
  // What is typed in the form right now.
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  // Any error message to show.
  const [error, setError] = useState("");

  // Loads the list from the backend and puts it in state.
  async function loadCustomers() {
    try {
      const data = await getCustomers();
      setCustomers(data);
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }

  // Runs once, when the page first appears.
  useEffect(() => {
    loadCustomers();
  }, []);

  async function handleSubmit(event) {
    event.preventDefault(); // stop the browser from reloading the page

    try {
      // Only send email if it was filled in. The backend rejects an empty one.
      const newCustomer = { name, phone };
      if (email) newCustomer.email = email;

      await createCustomer(newCustomer);

      // Clear the form and show the updated list.
      setName("");
      setPhone("");
      setEmail("");
      setError("");
      loadCustomers();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this customer?")) return;

    try {
      await deleteCustomer(id);
      loadCustomers();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <h2>Customers</h2>

      {error && <p className="error">{error}</p>}

      <form className="form" onSubmit={handleSubmit}>
        <label>
          Name
          <input value={name} onChange={(e) => setName(e.target.value)} required />
        </label>

        <label>
          Phone
          <input value={phone} onChange={(e) => setPhone(e.target.value)} required />
        </label>

        <label>
          Email (optional)
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>

        <button type="submit">Add customer</button>
      </form>

      <table className="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Phone</th>
            <th>Email</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {customers.map((customer) => (
            <tr key={customer._id}>
              <td>{customer.name}</td>
              <td>{customer.phone}</td>
              <td>{customer.email || "-"}</td>
              <td>
                <button onClick={() => handleDelete(customer._id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {customers.length === 0 && <p>No customers yet.</p>}
    </div>
  );
}
