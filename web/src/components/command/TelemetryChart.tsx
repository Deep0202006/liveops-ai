import { useEffect, useRef } from "react";
import uPlot from "uplot";
import "uplot/dist/uPlot.min.css";
import type { SimulationSample } from "../../simulation/contracts";

const colors = ["#72E0C4", "#77B7FF", "#E8B35A", "#9AA7B3"];
export default function TelemetryChart({ samples, sensors }: { samples: SimulationSample[]; sensors: string[] }) {
  const host = useRef<HTMLDivElement>(null); const chart = useRef<uPlot>(); const latestSamples = useRef(samples); latestSamples.current = samples;
  useEffect(() => { if (!host.current) return; const current = latestSamples.current; const data = [current.map((item) => item.source_cycle), ...sensors.map((sensor) => current.map((item) => item.sensors[sensor] ?? 0))] as uPlot.AlignedData; const options: uPlot.Options = { width: Math.max(520, host.current.clientWidth), height: 210, cursor: { show: true }, legend: { show: false }, scales: { x: { time: false } }, axes: [{ stroke: "#687581", grid: { stroke: "rgba(255,255,255,.05)" } }, { stroke: "#687581", grid: { stroke: "rgba(255,255,255,.05)" } }], series: [{}, ...sensors.map((sensor, index) => ({ label: sensor, stroke: colors[index], width: index === 0 ? 2 : 1 }))] }; chart.current = new uPlot(options, data, host.current); const resize = () => chart.current?.setSize({ width: Math.max(520, host.current?.clientWidth ?? 520), height: 210 }); window.addEventListener("resize", resize); return () => { window.removeEventListener("resize", resize); chart.current?.destroy(); chart.current = undefined; }; }, [sensors]);
  useEffect(() => { chart.current?.setData([samples.map((item) => item.source_cycle), ...sensors.map((sensor) => samples.map((item) => item.sensors[sensor] ?? 0))] as uPlot.AlignedData); }, [samples, sensors]);
  return <div className="telemetry-chart" tabIndex={0} aria-label="Scrollable selected asset telemetry chart"><div className="chart-key">{sensors.map((sensor, index) => <span key={sensor}><i style={{ background: colors[index] }} />{sensor.replace("_", " ")}</span>)}</div><div className="uplot-host" ref={host} /><p className="sr-only">Telemetry from cycle {samples[0]?.source_cycle ?? 0} through {samples.at(-1)?.source_cycle ?? 0} for {sensors.join(", ")}. Values are genuine FD001 trajectory readings replayed in simulation.</p></div>;
}
