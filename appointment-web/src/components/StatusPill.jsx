const LABELS = { booked: "Booked", completed: "Completed", cancelled: "Cancelled" };

export default function StatusPill({ status }) {
  return <span className={`pill pill-${status}`}>{LABELS[status] ?? status}</span>;
}
