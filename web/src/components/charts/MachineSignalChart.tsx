import { useEffect, useMemo, useRef, useState } from "react";
import uPlot from "uplot";
import "uplot/dist/uPlot.min.css";
import type { MachineSeries } from "../../api/types";
import { ErrorBoundary } from "../status/ErrorBoundary";

const colors = ["#72E0C4", "#77B7FF", "#E8B35A", "#F06E73", "#72D69A", "#C5D2DE", "#9AA7B3", "#D4C38B"];

function MachineSignalChart({ data, available, selected, onChange }: { data: MachineSeries; available: string[]; selected: string[]; onChange: (sensors: string[]) => void }) {
  const host = useRef<HTMLDivElement>(null);
  const chart = useRef<uPlot>();
  const [focused, setFocused] = useState(selected[0]);
  const values = useMemo(() => selected.flatMap((sensor) => data.series[sensor] ?? []), [data.series, selected]);
  const summary = `${data.cycle.length} returned cycle points for ${selected.join(", ")}. Values range from ${Math.min(...values).toFixed(2)} to ${Math.max(...values).toFixed(2)}.`;
  const aligned = useMemo(() => [data.cycle, ...selected.map((sensor) => data.series[sensor] ?? [])] as uPlot.AlignedData, [data, selected]);

  useEffect(() => {
    if (!host.current) return;
    chart.current = new uPlot({
      width: Math.max(720, host.current.clientWidth), height: 340, cursor: { show: true }, legend: { show: true }, scales: { x: { time: false } },
      axes: [{ label: "Machine cycle", stroke: "#9AA7B3", grid: { stroke: "rgba(255,255,255,.055)" } }, { stroke: "#9AA7B3", grid: { stroke: "rgba(255,255,255,.055)" } }],
      series: [{}, ...selected.map((sensor, index) => ({ label: sensor, stroke: colors[index], width: focused === sensor ? 2.5 : 1.5 }))],
    }, aligned, host.current);
    const observer = new ResizeObserver(() => chart.current?.setSize({ width: Math.max(720, host.current?.clientWidth ?? 720), height: 340 }));
    observer.observe(host.current);
    return () => { observer.disconnect(); chart.current?.destroy(); chart.current = undefined; };
  }, [aligned, focused, selected]);

  const toggle = (sensor: string) => { const next = selected.includes(sensor) ? selected.filter((item) => item !== sensor) : [...selected, sensor].slice(-8); if (next.length) onChange(next); };
  return <section className="signal-chart"><div className="section-heading"><span className="eyebrow">Machine signal</span><h2>Historical sensor trajectory</h2><p>{summary}</p></div>
    <div className="sensor-toggles" aria-label="Choose up to eight sensors">{available.map((sensor) => <button type="button" key={sensor} aria-pressed={selected.includes(sensor)} onClick={() => toggle(sensor)} onFocus={() => setFocused(sensor)}>{sensor.replace("sensor_", "S")}</button>)}</div>
    <div className="chart-scroll"><div className="chart-wrap"><div ref={host} role="img" aria-label={summary} /></div></div>
    <p className="chart-note">Straight segments connect measured cycles without smoothing. {data.cycle.length >= 500 ? "Series may be downsampled by the API." : "All returned points are shown."}</p>
  </section>;
}

export default function SafeMachineSignalChart(props: { data: MachineSeries; available: string[]; selected: string[]; onChange: (sensors: string[]) => void }) {
  return <ErrorBoundary area="chart" resetKey={`${props.data.machine_id}:${props.selected.join(",")}`}><MachineSignalChart {...props} /></ErrorBoundary>;
}
