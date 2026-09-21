import { useEffect, useState } from "react";
import { refId, refName } from "../utils/refs";
import {
  addMinutes,
  formatHour,
  formatRange,
  formatTime,
  MS_PER_MINUTE,
  startOfDay,
  toDateKey,
} from "../utils/time";

const PX_PER_MINUTE = 1.6; // 96px per hour, so a 30 min block fits two lines
const HOUR_PX = 60 * PX_PER_MINUTE;
const DEFAULT_FIRST_HOUR = 8;
const DEFAULT_LAST_HOUR = 20;
const SNAP_MINUTES = 15;

/**
 * One column per provider, one row per hour. Each appointment is a block whose
 * top is its start time and whose height is its duration, so back-to-back
 * bookings touch and a gap is visibly free.
 *
 * Clicking empty space in a column hands (providerId, time) to onPickSlot,
 * which prefills the booking form. Cancelled appointments free their slot, so
 * they are left off the board.
 */
export default function DayBoard({ dateKey, providers, customers, services, appointments, onPickSlot }) {
  const dayStart = startOfDay(dateKey);
  const minutesIntoDay = (value) => (new Date(value) - dayStart) / MS_PER_MINUTE;

  const visible = appointments.filter((a) => a.status !== "cancelled");

  // Widen the default 8:00 to 20:00 window if anything is booked outside it.
  let firstHour = DEFAULT_FIRST_HOUR;
  let lastHour = DEFAULT_LAST_HOUR;
  for (const a of visible) {
    firstHour = Math.min(firstHour, Math.floor(minutesIntoDay(a.startTime) / 60));
    lastHour = Math.max(lastHour, Math.ceil(minutesIntoDay(a.endTime) / 60));
  }
  firstHour = Math.max(0, firstHour);
  lastHour = Math.min(24, lastHour);

  const hours = Array.from({ length: lastHour - firstHour }, (_, i) => firstHour + i);
  const bodyHeight = (lastHour - firstHour) * HOUR_PX;
  const topFor = (minutes) => (minutes - firstHour * 60) * PX_PER_MINUTE;

  // Hover guide: shows the snapped time a click would book.
  const [hover, setHover] = useState(null); // { providerId, minutes }

  // "Now" line, refreshed every minute, only on today's board.
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60 * 1000);
    return () => clearInterval(timer);
  }, []);
  const nowMinutes = toDateKey(now) === dateKey ? minutesIntoDay(now) : null;
  const showNow = nowMinutes !== null && nowMinutes >= firstHour * 60 && nowMinutes <= lastHour * 60;

  function minutesAtPointer(event) {
    const rect = event.currentTarget.getBoundingClientRect();
    const raw = (event.clientY - rect.top) / PX_PER_MINUTE + firstHour * 60;
    return Math.floor(raw / SNAP_MINUTES) * SNAP_MINUTES;
  }

  function handleColumnClick(event, providerId) {
    onPickSlot(providerId, addMinutes(dayStart, minutesAtPointer(event)));
  }

  if (providers.length === 0) {
    return (
      <div className="board-empty">
        <p>No providers yet. Add a provider and their day will appear here.</p>
      </div>
    );
  }

  return (
    <div className="board-scroll">
      <div className="board" style={{ "--cols": providers.length, "--hour-px": `${HOUR_PX}px` }}>
        <div className="board-head">
          <div className="board-corner" />
          {providers.map((p) => (
            <div key={p._id} className="board-provider">
              <span className="board-provider-name">{p.name}</span>
              {p.type && <span className="board-provider-type">{p.type}</span>}
            </div>
          ))}
        </div>

        <div className="board-body">
          <div className="board-gutter" style={{ height: bodyHeight }} aria-hidden="true">
            {hours.map((h) => (
              <span key={h} className="board-hour" style={{ top: (h - firstHour) * HOUR_PX }}>
                {formatHour(new Date(dayStart.getFullYear(), dayStart.getMonth(), dayStart.getDate(), h))}
              </span>
            ))}
          </div>

          {providers.map((p) => (
            <div
              key={p._id}
              className="board-col"
              style={{ height: bodyHeight }}
              title="Click to book this time"
              onClick={(e) => handleColumnClick(e, p._id)}
              onMouseMove={(e) => setHover({ providerId: p._id, minutes: minutesAtPointer(e) })}
              onMouseLeave={() => setHover(null)}
            >
              {hover?.providerId === p._id && (
                <div className="board-guide" style={{ top: topFor(hover.minutes) }}>
                  <span>{formatTime(addMinutes(dayStart, hover.minutes))}</span>
                </div>
              )}

              {visible
                .filter((a) => refId(a.providerId) === p._id)
                .map((a) => {
                  const start = minutesIntoDay(a.startTime);
                  const duration = minutesIntoDay(a.endTime) - start;
                  const height = Math.max(duration * PX_PER_MINUTE - 2, 20);
                  // Short blocks drop to one line; mid-size ones drop the service name.
                  const size = height < 44 ? "block-short" : height < 64 ? "block-medium" : "";
                  return (
                    <div
                      key={a._id}
                      className={`block block-${a.status} ${size}`}
                      style={{ top: topFor(start), height }}
                      onClick={(e) => e.stopPropagation()}
                      onMouseMove={(e) => {
                        e.stopPropagation();
                        setHover(null);
                      }}
                    >
                      <span className="block-time">{formatRange(a.startTime, a.endTime)}</span>
                      <span className="block-who">{refName(a.customerId, customers)}</span>
                      <span className="block-what">{refName(a.serviceId, services)}</span>
                    </div>
                  );
                })}
            </div>
          ))}

          {showNow && <div className="board-now" style={{ top: topFor(nowMinutes) }} />}
        </div>
      </div>
    </div>
  );
}
