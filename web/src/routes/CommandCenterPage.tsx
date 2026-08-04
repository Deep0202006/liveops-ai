import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ChevronRight,
  CirclePause,
  CirclePlay,
  Command,
  Expand,
  RotateCcw,
  Search,
  SkipForward,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useSimulation } from "../simulation/controller";
import { nextEvent } from "../simulation/events";
import {
  countActiveAlertFilters,
  filterAlertEvents,
  type AlertSeverity,
} from "../simulation/alertFilters";
import { sortAssets } from "../simulation/selectors";
import type { MaintenanceStatus } from "../simulation/contracts";
import { useSystemStatus } from "../api/queries";
import { usePins } from "../comparison/pins";
import { DataArrivalGlow } from "../effects/DataArrivalGlow";
import { CriticalBeacon } from "../effects/CriticalBeacon";
import {
  AlertRow,
  CompactHorizon,
  CommandPalette,
  FleetTile,
  MaintenanceQueue,
} from "../command-center/OperationalComponents";
import { statusLabel } from "../command-center/operationalUtils";

const TelemetryChart = lazy(
  () => import("../components/command/TelemetryChart"),
);
export default function CommandCenterPage({
  maintenanceOnly = false,
}: {
  maintenanceOnly?: boolean;
}) {
  const simulation = useSimulation();
  const status = useSystemStatus();
  const navigate = useNavigate();
  const params = useParams();
  const { pins, pin, unpin, retainValid } = usePins();
  const [pinNotice, setPinNotice] = useState("");
  const [selected, setSelected] = useState(params.assetId ?? "RT-01");
  const [filter, setFilter] = useState<"ALL" | MaintenanceStatus>("ALL");
  const [sort, setSort] = useState<"rul" | "decline" | "id">("rul");
  const [search, setSearch] = useState("");
  const [windowSize, setWindowSize] = useState(60);
  const [sensors, setSensors] = useState(["sensor_2", "sensor_4", "sensor_11"]);
  const [ack, setAck] = useState(new Set<string>());
  const [reviewed, setReviewed] = useState(new Set<string>());
  const [alertSeverity, setAlertSeverity] = useState<AlertSeverity>("all");
  const [alertAssets, setAlertAssets] = useState(new Set<string>());
  const [alertTypes, setAlertTypes] = useState(new Set<string>());
  const [palette, setPalette] = useState(false);
  const [help, setHelp] = useState(false);
  const paletteTrigger = useRef<HTMLElement | null>(null);
  const snap = simulation.snapshot;
  const scenarioId = snap?.scenario.scenario_id;
  const validAssetIds = useRef<string[]>([]);
  if (snap)
    validAssetIds.current = snap.scenario.asset_manifest.map(
      (item) => item.asset_id,
    );
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLSelectElement ||
        event.target instanceof HTMLTextAreaElement
      )
        return;
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        paletteTrigger.current = document.activeElement as HTMLElement | null;
        setPalette(true);
      } else if (event.key === " ") {
        event.preventDefault();
        if (snap?.playing) simulation.pause();
        else simulation.play();
      } else if (event.key === "ArrowRight") simulation.step();
      else if (event.key === "1") simulation.setSpeed(1);
      else if (event.key === "5") simulation.setSpeed(5);
      else if (event.key === "0") simulation.setSpeed(20);
      else if (event.key.toLowerCase() === "f")
        document.getElementById("selected-asset")?.focus();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [snap?.playing, simulation]);
  useEffect(() => {
    setAck(new Set());
    setReviewed(new Set());
    setAlertSeverity("all");
    setAlertAssets(new Set());
    setAlertTypes(new Set());
    retainValid(validAssetIds.current);
  }, [scenarioId, retainValid]);
  const selectedAsset =
    snap?.assets.find((item) => item.asset.asset_id === selected) ??
    snap?.assets[0];
  const visible = useMemo(
    () =>
      snap
        ? sortAssets(
            snap.assets.filter(
              (item) =>
                (filter === "ALL" ||
                  item.sample.maintenance_status === filter) &&
                item.asset.asset_id
                  .toLowerCase()
                  .includes(search.toLowerCase()),
            ),
            sort,
          )
        : [],
    [snap, filter, search, sort],
  );
  const queue = useMemo(
    () =>
      snap
        ? sortAssets(
            snap.assets.filter(
              (item) => item.sample.maintenance_status !== "HEALTHY",
            ),
            "rul",
          )
        : [],
    [snap],
  );
  const eventTypes = useMemo(
    () =>
      Array.from(
        new Set(snap?.scenario.events.map((event) => event.type) ?? []),
      ).sort(),
    [snap?.scenario],
  );
  const alertFilters = useMemo(
    () => ({
      severity: alertSeverity,
      assetIds: alertAssets,
      eventTypes: alertTypes,
    }),
    [alertSeverity, alertAssets, alertTypes],
  );
  const events = useMemo(
    () => filterAlertEvents(snap?.events.slice().reverse() ?? [], alertFilters),
    [snap?.events, alertFilters],
  );
  const activeAlertFilters = countActiveAlertFilters(alertFilters);
  const clearAlertFilters = () => {
    setAlertSeverity("all");
    setAlertAssets(new Set());
    setAlertTypes(new Set());
  };
  if (simulation.error)
    return (
      <div className="command-center telemetry-field">
        <div className="cc-error" role="alert">
          <AlertTriangle />
          <h1>Simulation unavailable</h1>
          <p>{simulation.error}</p>
        </div>
      </div>
    );
  if (!snap)
    return (
      <div className="command-center telemetry-field">
        <div className="cc-loading" role="status">
          Loading deterministic FD001 fleet…
        </div>
      </div>
    );
  const choose = (id: string) => {
    setSelected(id);
    if (params.assetId) navigate(`/asset/${id}`);
  };
  const jump = (severity?: string) => {
    const event = nextEvent(snap.scenario.events, snap.step, severity);
    if (event) {
      simulation.seek(event.cycle);
      setSelected(event.asset_id);
    }
  };
  const paletteCommands = [
    {
      group: "Simulation",
      label: snap.playing ? "Pause simulation" : "Resume simulation",
      keywords: "play pause",
      run: snap.playing ? simulation.pause : simulation.play,
    },
    {
      group: "Simulation",
      label: "Step one cycle",
      keywords: "advance time",
      run: simulation.step,
    },
    {
      group: "Simulation",
      label: "Reset scenario",
      keywords: "restart",
      run: simulation.reset,
    },
    {
      group: "Navigate",
      label: "Open pinned comparison",
      keywords: "compare",
      run: () => navigate("/compare"),
    },
    {
      group: "Navigate",
      label: "Open maintenance queue",
      keywords: "priority review",
      run: () => navigate("/maintenance"),
    },
    {
      group: "Navigate",
      label: "Open model evidence",
      keywords: "evaluation",
      run: () => navigate("/model"),
    },
    {
      group: "Navigate",
      label: "Open Data Lab",
      keywords: "csv prediction",
      run: () => navigate("/lab"),
    },
    ...snap.assets.map((asset) => ({
      group: "Assets",
      label: `Investigate ${asset.asset.asset_id}`,
      keywords: `${asset.asset.display_name} asset`,
      run: () => choose(asset.asset.asset_id),
    })),
  ];
  const closePalette = () => setPalette(false);
  const openPalette = () => {
    paletteTrigger.current = document.activeElement as HTMLElement | null;
    setPalette(true);
  };
  return (
    <div className="command-center telemetry-field">
      <header className="command-bar">
        <div className="fleet-identity">
          <span className="live-badge">LIVE SIMULATION</span>
          <strong>FD001 Reliability Fleet</strong>
          <small>No physical factory connection</small>
        </div>
        <div className="virtual-time">
          <span>VIRTUAL SHIFT</span>
          <b>T+{String(snap.step).padStart(3, "0")}</b>
        </div>
        <label>
          Scenario
          <select
            value={snap.scenario.slug}
            onChange={(event) => simulation.selectScenario(event.target.value)}
          >
            {simulation.catalog?.scenarios.map((item) => (
              <option value={item.slug} key={item.slug}>
                {item.title}
              </option>
            ))}
          </select>
        </label>
        <div className="command-controls">
          <button
            onClick={snap.playing ? simulation.pause : simulation.play}
            aria-label={snap.playing ? "Pause simulation" : "Play simulation"}
          >
            {snap.playing ? <CirclePause /> : <CirclePlay />}
          </button>
          <button onClick={simulation.step} aria-label="Step one cycle">
            <SkipForward />
          </button>
          <button onClick={simulation.reset} aria-label="Reset scenario">
            <RotateCcw />
          </button>
          <select
            aria-label="Simulation speed"
            value={snap.speed}
            onChange={(event) =>
              simulation.setSpeed(Number(event.target.value))
            }
          >
            {[1, 5, 20].map((speed) => (
              <option value={speed} key={speed}>
                {speed}×
              </option>
            ))}
          </select>
        </div>
        <button className="status-button" aria-label="API and model status">
          <i
            className={
              status.data?.data.prediction_available ? "online" : "offline"
            }
          />
          {status.data?.data.model_state ?? "Checking model"}
        </button>
        <button
          onClick={() => document.documentElement.requestFullscreen?.()}
          aria-label="Enter full screen"
        >
          <Expand />
        </button>
      </header>
      <section
        className="kpi-strip"
        aria-label="Fleet key performance indicators"
      >
        {[
          ["Assets online", snap.assets.length],
          ["Critical", snap.statusCounts.CRITICAL],
          ["Maintenance due", snap.maintenanceDue],
          ["Under watch", snap.statusCounts.MONITOR],
          ["Median RUL", `${snap.medianRul} cyc`],
          ["Active alerts", snap.activeAlerts - ack.size],
        ].map(([label, value]) => (
          <article key={label}>
            <span>{label}</span>
            <strong>
              <DataArrivalGlow>{value}</DataArrivalGlow>
            </strong>
          </article>
        ))}
      </section>
      {maintenanceOnly ? (
        <main className="maintenance-page">
          <header>
            <div>
              <span className="tech-label">MAINTENANCE CONTROL</span>
              <h1>Priority queue</h1>
              <p>
                Deterministic guidance from simulated RUL, status, and decline
                rate.
              </p>
            </div>
            <div className="compare-entry">
              <button
                className="cc-button"
                onClick={() => navigate("/compare")}
              >
                Compare pinned ({pins.length})
              </button>
              <button
                className="cc-button"
                onClick={() => navigate("/command")}
              >
                Return to command center
              </button>
            </div>
          </header>
          <MaintenanceQueue
            queue={queue}
            reviewed={reviewed}
            setReviewed={setReviewed}
            onFocus={(id) => {
              setSelected(id);
              navigate(`/asset/${id}`);
            }}
            expanded
          />
        </main>
      ) : (
        <main className="command-grid">
          <section className="fleet-panel">
            <div className="panel-title">
              <div>
                <span className="tech-label">FLEET HEALTH MATRIX</span>
                <h1>Rotating assets</h1>
              </div>
              <div className="compare-entry">
                <span>
                  {visible.length}/{snap.assets.length}
                </span>
                <button type="button" onClick={() => navigate("/compare")}>
                  Compare pinned ({pins.length})
                </button>
              </div>
            </div>
            <p className="sr-only" role="status" aria-live="polite">
              {pinNotice || `${pins.length} assets pinned for comparison.`}
            </p>
            <div className="fleet-tools">
              <label>
                <Search />
                <input
                  aria-label="Search assets"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Asset ID"
                />
              </label>
              <select
                aria-label="Filter fleet status"
                value={filter}
                onChange={(e) => setFilter(e.target.value as typeof filter)}
              >
                <option>ALL</option>
                {["HEALTHY", "MONITOR", "PLAN_MAINTENANCE", "CRITICAL"].map(
                  (value) => (
                    <option key={value}>{value}</option>
                  ),
                )}
              </select>
              <select
                aria-label="Sort assets"
                value={sort}
                onChange={(e) => setSort(e.target.value as typeof sort)}
              >
                <option value="rul">Lowest RUL</option>
                <option value="decline">Fastest decline</option>
                <option value="id">Asset ID</option>
              </select>
            </div>
            <div className="fleet-matrix">
              {visible.map((item) => (
                <FleetTile
                  key={item.asset.asset_id}
                  item={item}
                  selected={
                    item.asset.asset_id === selectedAsset?.asset.asset_id
                  }
                  onSelect={() => choose(item.asset.asset_id)}
                  pinned={pins.includes(item.asset.asset_id)}
                  onPin={() => {
                    if (pins.includes(item.asset.asset_id)) {
                      unpin(item.asset.asset_id);
                      setPinNotice(
                        `${item.asset.asset_id} removed from comparison.`,
                      );
                    } else {
                      const result = pin(item.asset.asset_id);
                      setPinNotice(
                        result.ok
                          ? `${item.asset.asset_id} pinned for comparison.`
                          : result.reason,
                      );
                    }
                  }}
                />
              ))}
            </div>
          </section>
          {selectedAsset && (
            <section
              className="asset-command"
              id="selected-asset"
              tabIndex={-1}
            >
              <div className="asset-heading">
                <div>
                  <span className="tech-label">
                    SELECTED ASSET COMMAND VIEW
                  </span>
                  <h2>{selectedAsset.asset.display_name}</h2>
                  <p>
                    Source machine {selectedAsset.asset.source_machine_id} ·
                    simulation cycle {snap.step} · FD001 cycle{" "}
                    {selectedAsset.sample.source_cycle}
                  </p>
                </div>
                <div className="asset-status-emphasis">
                  {selectedAsset.sample.maintenance_status === "CRITICAL" && (
                    <CriticalBeacon />
                  )}
                  <span
                    className={`status large status-${selectedAsset.sample.maintenance_status.toLowerCase()}`}
                  >
                    {statusLabel(selectedAsset.sample.maintenance_status)}
                  </span>
                </div>
              </div>
              <CompactHorizon asset={selectedAsset} />
              <div className="asset-metrics">
                <span>
                  <small>10-cycle change</small>
                  <b>
                    {(
                      selectedAsset.sample.predicted_rul -
                      (selectedAsset.history.at(-11)?.predicted_rul ??
                        selectedAsset.sample.predicted_rul)
                    ).toFixed(1)}
                  </b>
                </span>
                <span>
                  <small>Current delta</small>
                  <b>{selectedAsset.sample.rul_change.toFixed(1)}</b>
                </span>
                <span>
                  <small>Warnings</small>
                  <b>{selectedAsset.sample.warnings.length}</b>
                </span>
                <span>
                  <small>Model</small>
                  <b>{selectedAsset.sample.model_version}</b>
                </span>
              </div>
              <div className="sensor-controls">
                <span>Telemetry window</span>
                {[30, 60, 120].map((size) => (
                  <button
                    aria-pressed={windowSize === size}
                    onClick={() => setWindowSize(size)}
                    key={size}
                  >
                    {size}
                  </button>
                ))}
                <span>Sensors</span>
                {snap.scenario.sensor_definitions.slice(0, 8).map((sensor) => (
                  <button
                    aria-pressed={sensors.includes(sensor.id)}
                    onClick={() =>
                      setSensors((current) =>
                        current.includes(sensor.id)
                          ? current.filter((id) => id !== sensor.id)
                          : current.length < 4
                            ? [...current, sensor.id]
                            : current,
                      )
                    }
                    key={sensor.id}
                  >
                    {sensor.id.replace("sensor_", "S")}
                  </button>
                ))}
              </div>
              <Suspense
                fallback={
                  <div className="chart-loading">Loading telemetry…</div>
                }
              >
                <TelemetryChart
                  samples={selectedAsset.history.slice(-windowSize)}
                  sensors={sensors}
                />
              </Suspense>
              <div className="asset-evidence">
                <article>
                  <span className="tech-label">IMPORTANT MODEL FEATURES</span>
                  {selectedAsset.sample.important_features.map((feature) => (
                    <code key={feature}>{feature}</code>
                  ))}
                </article>
                <article>
                  <span className="tech-label">CURRENT WARNINGS</span>
                  {selectedAsset.sample.warnings.length ? (
                    selectedAsset.sample.warnings.map((warning) => (
                      <p key={warning}>{warning}</p>
                    ))
                  ) : (
                    <p>No data-quality warning at this cycle.</p>
                  )}
                </article>
              </div>
            </section>
          )}
          <aside className="operations-side">
            <section className="alert-feed">
              <div className="panel-title">
                <div>
                  <span className="tech-label">LIVE ALERT FEED</span>
                  <h2>Events</h2>
                </div>
                <button onClick={() => jump("critical")}>Next critical</button>
              </div>
              <div className="alert-filter-bar" aria-label="Alert feed filters">
                <label>
                  Severity
                  <select
                    aria-label="Alert severity"
                    value={alertSeverity}
                    onChange={(event) =>
                      setAlertSeverity(event.target.value as AlertSeverity)
                    }
                  >
                    <option value="all">All severities</option>
                    <option value="information">Information</option>
                    <option value="warning">Warning</option>
                    <option value="critical">Critical</option>
                  </select>
                </label>
                <label>
                  Asset
                  <input
                    aria-label="Alert asset"
                    list="alert-assets"
                    value={alertAssets.size === 1 ? [...alertAssets][0] : ""}
                    placeholder={
                      alertAssets.size > 1
                        ? `${alertAssets.size} pinned assets`
                        : "All assets"
                    }
                    onChange={(event) =>
                      setAlertAssets(
                        new Set(event.target.value ? [event.target.value] : []),
                      )
                    }
                  />
                  <datalist id="alert-assets">
                    {snap.scenario.asset_manifest.map((asset) => (
                      <option value={asset.asset_id} key={asset.asset_id}>
                        {asset.display_name}
                      </option>
                    ))}
                  </datalist>
                </label>
                <label>
                  Event types
                  <select
                    multiple
                    aria-label="Alert event types"
                    value={[...alertTypes]}
                    onChange={(event) =>
                      setAlertTypes(
                        new Set(
                          Array.from(
                            event.target.selectedOptions,
                            (option) => option.value,
                          ),
                        ),
                      )
                    }
                  >
                    {eventTypes.map((type) => (
                      <option value={type} key={type}>
                        {type.replaceAll("_", " ")}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="alert-filter-actions">
                  <button
                    type="button"
                    onClick={() =>
                      selectedAsset &&
                      setAlertAssets(new Set([selectedAsset.asset.asset_id]))
                    }
                  >
                    Selected
                  </button>
                  <button
                    type="button"
                    disabled={!pins.length}
                    onClick={() => setAlertAssets(new Set(pins))}
                  >
                    Pinned
                  </button>
                  <button
                    type="button"
                    disabled={!activeAlertFilters}
                    onClick={clearAlertFilters}
                  >
                    Clear filters
                  </button>
                  <span
                    aria-label={`${activeAlertFilters} active alert filters`}
                  >
                    {activeAlertFilters} active
                  </span>
                </div>
              </div>
              <p className="sr-only" role="status" aria-live="polite">
                {events.length} alert events match {activeAlertFilters} active
                filters.
              </p>
              {events.length ? (
                events.slice(0, 8).map((event) => (
                  <AlertRow
                    event={event}
                    acknowledged={ack.has(event.id)}
                    key={event.id}
                    onAck={() =>
                      setAck((current) => new Set(current).add(event.id))
                    }
                    onFocus={() => {
                      simulation.seek(event.cycle);
                      choose(event.asset_id);
                    }}
                  />
                ))
              ) : snap.events.length ? (
                <div className="alert-filter-empty">
                  <strong>No events match the active filters.</strong>
                  <p>
                    Severity: {alertSeverity}; assets:{" "}
                    {alertAssets.size ? [...alertAssets].join(", ") : "all"};
                    event types:{" "}
                    {alertTypes.size
                      ? [...alertTypes]
                          .map((type) => type.replaceAll("_", " "))
                          .join(", ")
                      : "all"}
                    .
                  </p>
                  <button type="button" onClick={clearAlertFilters}>
                    Reset alert filters
                  </button>
                </div>
              ) : (
                <p className="empty-copy">No threshold event has occurred.</p>
              )}
            </section>
            <MaintenanceQueue
              queue={queue.slice(0, 6)}
              reviewed={reviewed}
              setReviewed={setReviewed}
              onFocus={choose}
            />
          </aside>
        </main>
      )}
      <footer className="time-conductor">
        <div>
          <span className="tech-label">TIME CONDUCTOR</span>
          <b>{snap.scenario.title}</b>
        </div>
        <button
          aria-label={snap.playing ? "Pause simulation" : "Play simulation"}
          onClick={snap.playing ? simulation.pause : simulation.play}
        >
          {snap.playing ? <CirclePause /> : <CirclePlay />}
        </button>
        <button aria-label="Step one cycle" onClick={simulation.step}>
          <SkipForward />
        </button>
        <input
          aria-label="Seek simulation cycle"
          type="range"
          min={snap.scenario.timeline.start}
          max={snap.scenario.timeline.end}
          value={snap.step}
          onChange={(event) => simulation.seek(Number(event.target.value))}
        />
        <span>
          CYCLE {snap.step}/{snap.scenario.timeline.end}
        </span>
        <button onClick={() => jump("warning")}>
          Next warning <ChevronRight />
        </button>
        <button onClick={() => jump("critical")}>
          Next critical <ChevronRight />
        </button>
        <button onClick={openPalette}>
          <Command /> Commands
        </button>
        <button
          aria-label="Open keyboard shortcuts"
          onClick={() => setHelp(true)}
        >
          ?
        </button>
      </footer>
      {palette && (
        <CommandPalette
          commands={paletteCommands}
          onClose={closePalette}
          restoreFocus={paletteTrigger.current}
        />
      )}
      {help && (
        <div className="modal-backdrop" onMouseDown={() => setHelp(false)}>
          <section
            className="shortcuts"
            role="dialog"
            aria-modal="true"
            aria-labelledby="shortcuts-title"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <h2 id="shortcuts-title">Keyboard controls</h2>
            <dl>
              <div>
                <dt>Space</dt>
                <dd>Play / pause</dd>
              </div>
              <div>
                <dt>→</dt>
                <dd>Step</dd>
              </div>
              <div>
                <dt>1 / 5 / 0</dt>
                <dd>Set speed</dd>
              </div>
              <div>
                <dt>Ctrl / Cmd + K</dt>
                <dd>Commands</dd>
              </div>
              <div>
                <dt>F</dt>
                <dd>Focus selected asset</dd>
              </div>
            </dl>
            <button className="cc-button" onClick={() => setHelp(false)}>
              Close
            </button>
          </section>
        </div>
      )}
    </div>
  );
}
