import {
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { Check, ChevronRight, Command, Search } from "lucide-react";
import type {
  AssetSnapshot,
  SimulationEvent,
} from "../simulation/contracts";
import { FocusTrace } from "../effects/FocusTrace";
import { statusLabel } from "./operationalUtils";

const maintenanceAction = (asset: AssetSnapshot) =>
  asset.sample.maintenance_status === "CRITICAL"
    ? "Immediate simulated review required"
    : asset.sample.maintenance_status === "PLAN_MAINTENANCE"
      ? "Inspect within the next simulated window"
      : asset.sample.maintenance_status === "MONITOR"
        ? "Increase observation frequency"
        : "Continue monitoring";

export function CompactHorizon({ asset }: { asset: AssetSnapshot }) {
  const value = asset.sample;
  const max = Math.max(125, value.upper_bound ?? 0, value.predicted_rul);
  return (
    <section
      className="cc-horizon"
      aria-label={`${asset.asset.asset_id} predicted remaining useful life ${value.predicted_rul} cycles, status ${statusLabel(value.maintenance_status)}`}
    >
      <header>
        <div>
          <span className="tech-label">RUL HORIZON</span>
          <strong>
            {value.predicted_rul.toFixed(1)} <small>cycles</small>
          </strong>
        </div>
        <span
          className={`status status-${value.maintenance_status.toLowerCase()}`}
        >
          {statusLabel(value.maintenance_status)}
        </span>
      </header>
      <div className="cc-horizon-track">
        <span
          className="threshold critical"
          style={{ left: `${(25 / max) * 100}%` }}
        />
        <span
          className="threshold warning"
          style={{ left: `${(50 / max) * 100}%` }}
        />
        <i
          style={{
            width: `${Math.min(100, (value.predicted_rul / max) * 100)}%`,
          }}
        />
        {value.lower_bound != null && value.upper_bound != null && (
          <b
            style={{
              left: `${(value.lower_bound / max) * 100}%`,
              width: `${((value.upper_bound - value.lower_bound) / max) * 100}%`,
            }}
          />
        )}
      </div>
      <footer>
        <span>0</span>
        <span>
          Range {value.lower_bound?.toFixed(1) ?? "—"}–
          {value.upper_bound?.toFixed(1) ?? "—"}
        </span>
        <span>{max.toFixed(0)} cycles</span>
      </footer>
    </section>
  );
}

export function FleetTile({
  item,
  selected,
  onSelect,
  pinned,
  onPin,
}: {
  item: AssetSnapshot;
  selected: boolean;
  onSelect: () => void;
  pinned: boolean;
  onPin: () => void;
}) {
  const values = item.history
    .slice(-16)
    .map((sample) => sample.sensors.sensor_11 ?? 0);
  const min = Math.min(...values),
    max = Math.max(...values),
    range = max - min || 1;
  const points = values
    .map(
      (value, index) =>
        `${(index / Math.max(1, values.length - 1)) * 100},${26 - ((value - min) / range) * 22}`,
    )
    .join(" ");
  return (
    <article
      className={`fleet-tile ${selected ? "selected" : ""} edge-${item.sample.maintenance_status.toLowerCase()}`}
    >
      {selected && (
        <FocusTrace>
          <span className="sr-only">Selected asset</span>
        </FocusTrace>
      )}
      <button className="fleet-main" onClick={onSelect} aria-pressed={selected}>
        <header>
          <strong>{item.asset.asset_id}</strong>
          <span
            className={`status status-${item.sample.maintenance_status.toLowerCase()}`}
          >
            {statusLabel(item.sample.maintenance_status)}
          </span>
        </header>
        <div className="tile-metric">
          <b>{item.sample.predicted_rul.toFixed(1)}</b>
          <small>cycles RUL</small>
          <em>
            {item.sample.rul_change > 0 ? "+" : ""}
            {item.sample.rul_change.toFixed(1)}
          </em>
        </div>
        <svg
          role="img"
          aria-label={`Recent sensor 11 trace for ${item.asset.asset_id}`}
          viewBox="0 0 100 28"
          preserveAspectRatio="none"
        >
          <polyline points={points} />
        </svg>
        <footer>
          <span>C{item.sample.source_cycle}</span>
          <span>{item.alertCount} alerts</span>
          <span>fresh</span>
        </footer>
      </button>
      <button
        className="pin"
        aria-pressed={pinned}
        onClick={onPin}
        aria-label={`${pinned ? "Unpin" : "Pin"} ${item.asset.asset_id}`}
      >
        ⌖
      </button>
    </article>
  );
}

export function AlertRow({
  event,
  acknowledged,
  onAck,
  onFocus,
}: {
  event: SimulationEvent;
  acknowledged: boolean;
  onAck: () => void;
  onFocus: () => void;
}) {
  return (
    <article className={`alert-row severity-${event.severity}`}>
      <button className="alert-focus" onClick={onFocus}>
        <span>
          {event.asset_id} · C{event.cycle}
        </span>
        <strong>{event.message}</strong>
        <small>{event.type.replaceAll("_", " ")}</small>
      </button>
      <button
        onClick={onAck}
        aria-label={`Acknowledge ${event.id}`}
        disabled={acknowledged}
      >
        {acknowledged ? <Check /> : "Ack"}
      </button>
    </article>
  );
}

export function MaintenanceQueue({
  queue,
  reviewed,
  setReviewed,
  onFocus,
  expanded = false,
}: {
  queue: AssetSnapshot[];
  reviewed: Set<string>;
  setReviewed: Dispatch<SetStateAction<Set<string>>>;
  onFocus: (id: string) => void;
  expanded?: boolean;
}) {
  return (
    <section className={`maintenance-queue ${expanded ? "expanded" : ""}`}>
      <div className="panel-title">
        <div>
          <span className="tech-label">MAINTENANCE PRIORITY</span>
          <h2>Queue</h2>
        </div>
        <span>{queue.length} due</span>
      </div>
      {queue.map((item, index) => (
        <article key={item.asset.asset_id}>
          <b className="queue-rank" aria-label={`Priority ${index + 1}`}>
            {String(index + 1).padStart(2, "0")}
          </b>
          <button onClick={() => onFocus(item.asset.asset_id)}>
            <span className="queue-identity">
              <strong>{item.asset.asset_id}</strong>
              <span
                className={`status status-${item.sample.maintenance_status.toLowerCase()}`}
              >
                {statusLabel(item.sample.maintenance_status)}
              </span>
            </span>
            <span className="queue-metrics">
              <span>
                <small>RUL</small>
                {item.sample.predicted_rul.toFixed(1)} cycles
              </span>
              <span>
                <small>Decline</small>
                {item.sample.rul_change.toFixed(1)} / cycle
              </span>
            </span>
            <small className="queue-reason">{maintenanceAction(item)}</small>
          </button>
          <button
            aria-label={`Mark ${item.asset.asset_id} reviewed`}
            className={reviewed.has(item.asset.asset_id) ? "reviewed" : ""}
            onClick={() =>
              setReviewed((current) =>
                new Set(current).add(item.asset.asset_id),
              )
            }
          >
            {reviewed.has(item.asset.asset_id) ? <Check /> : "Review"}
          </button>
        </article>
      ))}
    </section>
  );
}

export type PaletteCommand = {
  group: string;
  label: string;
  keywords: string;
  run: () => void;
};

export function CommandPalette({
  commands,
  onClose,
  restoreFocus,
}: {
  commands: PaletteCommand[];
  onClose: () => void;
  restoreFocus: HTMLElement | null;
}) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const normalized = query.trim().toLowerCase();
  const filtered = commands.filter((command) =>
    `${command.label} ${command.keywords}`.toLowerCase().includes(normalized),
  );
  useEffect(() => {
    inputRef.current?.focus();
    return () => restoreFocus?.focus();
  }, [restoreFocus]);
  const run = (index: number) => {
    const command = filtered[index];
    if (command) {
      command.run();
      onClose();
    }
  };
  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <section
        className="command-palette"
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        onMouseDown={(event) => event.stopPropagation()}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            onClose();
          } else if (event.key === "ArrowDown") {
            event.preventDefault();
            setActiveIndex((index) => Math.min(filtered.length - 1, index + 1));
          } else if (event.key === "ArrowUp") {
            event.preventDefault();
            setActiveIndex((index) => Math.max(0, index - 1));
          } else if (event.key === "Enter") {
            event.preventDefault();
            run(activeIndex);
          }
        }}
      >
        <header>
          <Command />
          <label>
            <span className="sr-only">Search commands and assets</span>
            <input
              ref={inputRef}
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setActiveIndex(0);
              }}
              placeholder="Search commands or assets…"
              role="combobox"
              aria-expanded="true"
              aria-controls="command-palette-results"
              aria-activedescendant={
                filtered[activeIndex]
                  ? `palette-command-${activeIndex}`
                  : undefined
              }
            />
          </label>
          <kbd>Esc</kbd>
        </header>
        <div
          className="palette-results"
          id="command-palette-results"
          role="listbox"
          aria-label="Available commands"
        >
          {filtered.length ? (
            filtered.map((command, index) => (
              <div
                className="palette-command-wrap"
                key={`${command.group}-${command.label}`}
              >
                {(index === 0 ||
                  filtered[index - 1].group !== command.group) && (
                  <span className="palette-group">{command.group}</span>
                )}
                <button
                  id={`palette-command-${index}`}
                  role="option"
                  aria-selected={activeIndex === index}
                  className={activeIndex === index ? "active" : ""}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => run(index)}
                >
                  <span>{command.label}</span>
                  <ChevronRight />
                </button>
              </div>
            ))
          ) : (
            <div className="palette-empty" role="status">
              <Search />
              <strong>No matching command</strong>
              <p>Try an asset ID, destination, or simulation action.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
