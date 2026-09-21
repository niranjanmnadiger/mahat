import { useState } from "react";
import ErrorBanner from "./components/ErrorBanner";
import { useDirectory } from "./hooks/useDirectory";
import AppointmentsPage from "./pages/AppointmentsPage";
import CustomersPage from "./pages/CustomersPage";
import ProvidersPage from "./pages/ProvidersPage";
import SchedulePage from "./pages/SchedulePage";
import ServicesPage from "./pages/ServicesPage";

// No router: five screens and one piece of state are enough.
const TABS = [
  { id: "schedule", label: "Schedule", Page: SchedulePage },
  { id: "appointments", label: "Appointments", Page: AppointmentsPage },
  { id: "customers", label: "Customers", Page: CustomersPage, count: "customers" },
  { id: "providers", label: "Providers", Page: ProvidersPage, count: "providers" },
  { id: "services", label: "Services", Page: ServicesPage, count: "services" },
];

export default function App() {
  const [tabId, setTabId] = useState("schedule");
  const directory = useDirectory();
  const { Page } = TABS.find((t) => t.id === tabId);

  return (
    <div className="app">
      <header className="topbar">
        <h1 className="brand">Front desk</h1>
        <nav className="tabs" aria-label="Sections">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              className="tab"
              aria-current={t.id === tabId ? "page" : undefined}
              onClick={() => setTabId(t.id)}
            >
              {t.label}
              {t.count && !directory.loading && (
                <span className="tab-count">{directory[t.count].length}</span>
              )}
            </button>
          ))}
        </nav>
      </header>

      <main className="main">
        <ErrorBanner error={directory.error} onRetry={directory.reload} />
        <Page directory={directory} />
      </main>
    </div>
  );
}
