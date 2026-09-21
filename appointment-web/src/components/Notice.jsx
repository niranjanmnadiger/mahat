export default function Notice({ children, onDismiss }) {
  if (!children) return null;
  return (
    <div className="banner banner-ok" role="status">
      <p>{children}</p>
      {onDismiss && (
        <button type="button" className="text-button" onClick={onDismiss}>
          Dismiss
        </button>
      )}
    </div>
  );
}
