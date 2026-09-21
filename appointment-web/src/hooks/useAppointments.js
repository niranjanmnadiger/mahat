import { useCallback, useEffect, useRef, useState } from "react";
import { appointmentsApi } from "../api/endpoints";

const byStart = (a, b) => new Date(a.startTime) - new Date(b.startTime);

/**
 * Loads appointments for a filter set and refetches whenever the filters change.
 *
 * Filters are compared by value (JSON), so callers can pass a fresh object each
 * render without triggering a fetch loop. The ticket ref drops responses that
 * arrive after a newer request started, so flipping dates quickly never shows
 * the wrong day.
 */

export function useAppointments(filters) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const latestTicket = useRef(0);
  const filtersKey = JSON.stringify(filters);

  const reload = useCallback(async () => {
    const ticket = ++latestTicket.current;
    setLoading(true);
    setError(null);
    try {
      const list = await appointmentsApi.list(JSON.parse(filtersKey));
      if (ticket === latestTicket.current) setAppointments([...list].sort(byStart));
    } catch (err) {
      if (ticket === latestTicket.current) setError(err);
    } finally {
      if (ticket === latestTicket.current) setLoading(false);
    }
  }, [filtersKey]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { appointments, loading, error, reload };
}

