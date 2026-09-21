import { useCallback, useEffect, useState } from "react";
import { customersApi, providersApi, servicesApi } from "../api/endpoints";

/**
 * Customers, providers and services are small lists that several screens need
 * (dropdowns, name lookups), so App loads them once and passes them down.
 * Call reload() after creating or deleting any of them.
 */
export function useDirectory() {
  const [state, setState] = useState({
    customers: [],
    providers: [],
    services: [],
    loading: true,
    error: null,
  });

  const reload = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const [customers, providers, services] = await Promise.all([
        customersApi.list(),
        providersApi.list(),
        servicesApi.list(),
      ]);
      setState({ customers, providers, services, loading: false, error: null });
    } catch (error) {
      setState((prev) => ({ ...prev, loading: false, error }));
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { ...state, reload };
}
