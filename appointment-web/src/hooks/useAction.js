import { useCallback, useState } from "react";

/**
 * Tracks one-off mutations (create, delete, status change).
 *
 *   const { run, busy, error } = useAction();
 *   const ok = await run("delete:" + id, () => customersApi.remove(id));
 *
 * `busy` holds the key of the running action so a table can disable just the
 * row being worked on. `run` resolves to true on success, false on failure,
 * and the failure lands in `error` for an <ErrorBanner>.
 */
export function useAction() {
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState(null);

  const run = useCallback(async (key, fn) => {
    setBusy(key);
    setError(null);
    try {
      await fn();
      return true;
    } catch (err) {
      setError(err);
      return false;
    } finally {
      setBusy(null);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { run, busy, error, setError, clearError };
}
