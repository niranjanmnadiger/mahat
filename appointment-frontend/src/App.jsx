import { NavLink, Navigate, Route, Routes } from "react-router-dom";
import Appointments from "./pages/Appointments";
import BookAppointment from "./pages/BookAppointment";
import Customers from "./pages/Customers";
import Providers from "./pages/Providers";
import Services from "./pages/Services";

export default function App() {
  return (
    <div>
      <header className="header">
        <h1>Appointment Booking</h1>
        <nav className="nav">
          {/* NavLink is like a link, but it knows when it is the active page. */}
          <NavLink to="/appointments">Appointments</NavLink>
          <NavLink to="/book">Book</NavLink>
          <NavLink to="/customers">Customers</NavLink>
          <NavLink to="/providers">Providers</NavLink>
          <NavLink to="/services">Services</NavLink>
        </nav>
      </header>

      <main className="main">
        {/* Each Route says: for this URL, show this page. */}
        <Routes>
          <Route path="/" element={<Navigate to="/appointments" />} />
          <Route path="/appointments" element={<Appointments />} />
          <Route path="/book" element={<BookAppointment />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/providers" element={<Providers />} />
          <Route path="/services" element={<Services />} />
          <Route path="*" element={<p>Page not found.</p>} />
        </Routes>
      </main>
    </div>
  );
}
