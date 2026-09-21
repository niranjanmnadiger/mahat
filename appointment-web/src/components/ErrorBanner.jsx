import { formatRange } from "../utils/time";

/**
 * Renders any error from the API client:
 * - the message, always
 * - field-level validation errors ([{ field, message }]) as a list
 * - a clash (409) as the booking that is in the way
 */
export default function ErrorBanner({ error, onDismiss, onRetry }) {
  if (!error) return null;

  const details = error.errors;
  const fieldErrors = Array.isArray(details) ? details : [];
  const conflict = details?.conflictsWith;

  return (
    <div className="banner banner-error" role="alert">
      <div>
        <p className="banner-title">{error.message}</p>

        {fieldErrors.length > 0 && (
          <ul className="banner-list">
            {fieldErrors.map((item, i) => (
              <li key={i}>
                {item.field && <strong>{item.field}: </strong>}
                {item.message}
              </li>
            ))}
          </ul>
        )}

        {conflict && (
          <p>
            Already booked: {conflict.customer ?? "another customer"}
            {conflict.service ? `, ${conflict.service}` : ""}
            {conflict.provider ? ` with ${conflict.provider}` : ""},{" "}
            {formatRange(conflict.startTime, conflict.endTime)}.
          </p>
        )}
      </div>

      <div className="banner-actions">
        {onRetry && (
          <button type="button" className="button button-quiet" onClick={onRetry}>
            Try again
          </button>
        )}
        {onDismiss && (
          <button type="button" className="text-button" onClick={onDismiss}>
            Dismiss
          </button>
        )}
      </div>
    </div>
  );
}
