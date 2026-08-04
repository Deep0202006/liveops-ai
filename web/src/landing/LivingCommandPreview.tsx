import { Pause, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { FleetSnapshot, MaintenanceStatus } from "../simulation/contracts";
import { useSimulation } from "../simulation/controller";

const statusLabel: Record<MaintenanceStatus, string> = {
  HEALTHY: "Healthy", MONITOR: "Watch", PLAN_MAINTENANCE: "Plan", CRITICAL: "Critical",
};

function Trace({ snapshot }: { snapshot: FleetSnapshot }) {
  const selected = snapshot.assets[0];
  const sensor = snapshot.scenario.sensor_definitions[0];
  const values = selected?.history.slice(-34).map(sample => sample.sensors[sensor?.id]).filter((value): value is number => Number.isFinite(value)) ?? [];
  const points = (() => {
    if (values.length < 2) return "";
    const min = Math.min(...values), max = Math.max(...values), range = Math.max(max - min, 0.001);
    return values.map((value, index) => `${(index / (values.length - 1) * 100).toFixed(2)},${(34 - ((value - min) / range) * 28).toFixed(2)}`).join(" ");
  })();
  return <figure className="living-trace"><figcaption><span>{sensor?.label ?? "Telemetry"}</span><strong className="alloy-metric">{values.at(-1)?.toFixed(2) ?? "—"} {sensor?.unit}</strong></figcaption><svg viewBox="0 0 100 38" role="img" aria-label={`${sensor?.label ?? "Sensor"} recent telemetry trace for ${selected?.asset.asset_id ?? "the selected asset"}`} preserveAspectRatio="none"><path d="M0 34H100M0 20H100M0 6H100" /><polyline points={points} /></svg></figure>;
}

export default function LivingCommandPreview() {
  const simulation = useSimulation();
  const root = useRef<HTMLDivElement>(null);
  const simulationRef = useRef(simulation);
  const resumeWhenVisible = useRef(false);
  const previewVisible = useRef(false);
  const autoStartPending = useRef(true);
  const [display, setDisplay] = useState(simulation.snapshot);
  const latest = useRef(simulation.snapshot);
  useEffect(() => { latest.current = simulation.snapshot; simulationRef.current = simulation; }, [simulation]);
  useEffect(() => {
    if (!autoStartPending.current || !previewVisible.current || !simulation.snapshot) return;
    autoStartPending.current = false;
    if (!simulation.snapshot.playing) simulation.play();
  }, [simulation]);
  useEffect(() => {
    const timer = window.setInterval(() => setDisplay(latest.current), 1000);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => {
      previewVisible.current = entry.isIntersecting;
      const snapshot = latest.current;
      if (!entry.isIntersecting && snapshot?.playing) { resumeWhenVisible.current = true; simulationRef.current.pause(); }
      else if (entry.isIntersecting && resumeWhenVisible.current && !document.hidden) { resumeWhenVisible.current = false; simulationRef.current.play(); }
    }, { threshold: 0.15 });
    observer.observe(element);
    return () => {
      observer.disconnect();
      if (resumeWhenVisible.current) simulationRef.current.play();
    };
  }, []);

  if (!display) return <div className="living-preview living-preview--loading" ref={root} role="status">Preparing deterministic scenario data…</div>;
  const selected = display.assets[0];
  const alert = display.events.at(-1);
  return <div className="living-preview" ref={root}>
    <header className="living-command-bar"><div><i aria-hidden="true" /><span>Live simulation</span></div><strong>{display.scenario.title}</strong><button type="button" onClick={display.playing ? simulation.pause : simulation.play} aria-label={display.playing ? "Pause hero simulation" : "Play hero simulation"}>{display.playing ? <Pause /> : <Play />}{display.playing ? "Pause" : "Play"}</button></header>
    <div className="living-body">
      <section className="living-fleet" aria-label="Six-asset fleet preview"><div className="living-panel-label"><span>Fleet pulse</span><b>{display.assets.length} online</b></div>{display.assets.slice(0, 6).map((asset, index) => <article className={index === 0 ? "is-selected" : ""} key={asset.asset.asset_id}><div><strong>{asset.asset.asset_id}</strong><span>{statusLabel[asset.sample.maintenance_status]}</span></div><b className="alloy-metric">{asset.sample.predicted_rul.toFixed(0)}<small> RUL</small></b><i className={`preview-status preview-status--${asset.sample.maintenance_status.toLowerCase()}`} /></article>)}</section>
      <section className="living-focus"><div className="living-panel-label"><span>Selected asset</span><b>{selected.asset.display_name}</b></div><div className="living-rul"><span>Predicted remaining life</span><strong className="alloy-metric">{selected.sample.predicted_rul.toFixed(1)}</strong><small>cycles · range {selected.sample.lower_bound?.toFixed(0) ?? "—"}–{selected.sample.upper_bound?.toFixed(0) ?? "—"}</small><div><i style={{ width: `${Math.min(100, selected.sample.predicted_rul / 1.25)}%` }} /></div></div><Trace snapshot={display} /></section>
      <aside className="living-intelligence"><div><span>Simulation cycle</span><strong className="alloy-metric">{display.step}</strong><small>{display.playing ? `${display.speed}× replay` : "Paused"}</small></div><div className="living-alert"><span>Latest event</span><strong>{alert?.type.replaceAll("_", " ") ?? "Awaiting event"}</strong><small>{alert ? `${alert.asset_id} · cycle ${alert.cycle}` : "Deterministic replay ready"}</small></div></aside>
    </div>
  </div>;
}
