import { AxisBottom, AxisLeft } from "@visx/axis";
import { scaleLinear } from "@visx/scale";
import { LinePath } from "@visx/shape";
import { useTooltip, TooltipWithBounds } from "@visx/tooltip";
import { localPoint } from "@visx/event";
import { useMemo, useState } from "react";
import type { MachineSeries } from "../../api/types";
import { ErrorBoundary } from "../status/ErrorBoundary";

const colors = ["#72E0C4", "#77B7FF", "#E8B35A", "#F06E73", "#72D69A", "#C5D2DE", "#9AA7B3", "#D4C38B"];

function MachineSignalChart({ data, available, selected, onChange }: { data: MachineSeries; available: string[]; selected: string[]; onChange: (sensors: string[]) => void }) {
  const width = 900, height = 340, margin = { top: 20, right: 24, bottom: 42, left: 58 };
  const [focused, setFocused] = useState(selected[0]);
  const values = useMemo(() => Object.values(data.series).flat(), [data.series]);
  const x = scaleLinear({ domain: [Math.min(...data.cycle), Math.max(...data.cycle)], range: [margin.left, width - margin.right] });
  const y = scaleLinear({ domain: [Math.min(...values), Math.max(...values)], range: [height - margin.bottom, margin.top], nice: true });
  const { tooltipData, tooltipLeft, tooltipTop, showTooltip, hideTooltip } = useTooltip<{ cycle: number; values: Record<string, number> }>();
  const toggle = (sensor: string) => { const next = selected.includes(sensor) ? selected.filter((item) => item !== sensor) : [...selected, sensor].slice(-8); if (next.length) onChange(next); };
  const summary = `${data.cycle.length} returned cycle points for ${selected.join(", ")}. Values range from ${Math.min(...values).toFixed(2)} to ${Math.max(...values).toFixed(2)}.`;
  return <section className="signal-chart"><div className="section-heading"><span className="eyebrow">Machine signal</span><h2>Historical sensor trajectory</h2><p>{summary}</p></div>
    <div className="sensor-toggles" aria-label="Choose up to eight sensors">{available.map((sensor) => <button type="button" key={sensor} aria-pressed={selected.includes(sensor)} onClick={() => toggle(sensor)} onFocus={() => setFocused(sensor)}>{sensor.replace("sensor_", "S")}</button>)}</div>
    <div className="chart-scroll"><div className="chart-wrap"><svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={summary} onPointerLeave={hideTooltip} onPointerMove={(event) => { const point = localPoint(event); if (!point) return; const cycle = Math.round(x.invert(point.x)); const index = data.cycle.reduce((best, current, currentIndex) => Math.abs(current - cycle) < Math.abs(data.cycle[best] - cycle) ? currentIndex : best, 0); const vals = Object.fromEntries(selected.map((sensor) => [sensor, data.series[sensor]?.[index] ?? 0])); showTooltip({ tooltipData: { cycle: data.cycle[index], values: vals }, tooltipLeft: x(data.cycle[index]), tooltipTop: point.y }); }}>
      <AxisBottom top={height - margin.bottom} scale={x} numTicks={7} stroke="#34414d" tickStroke="#34414d" tickLabelProps={{ fill: "#9AA7B3", fontSize: 11, textAnchor: "middle" }} label="Machine cycle" labelProps={{ fill: "#9AA7B3", fontSize: 12, textAnchor: "middle" }} />
      <AxisLeft left={margin.left} scale={y} numTicks={5} stroke="#34414d" tickStroke="#34414d" tickLabelProps={{ fill: "#9AA7B3", fontSize: 11, textAnchor: "end", dx: -5, dy: 3 }} />
      {selected.map((sensor, lineIndex) => <LinePath key={sensor} data={data.cycle} x={(cycle) => x(cycle)} y={(_, index) => y(data.series[sensor]?.[index] ?? 0)} stroke={colors[lineIndex]} strokeWidth={focused === sensor ? 2.5 : 1.5} />)}
      {tooltipData && <line x1={tooltipLeft} x2={tooltipLeft} y1={margin.top} y2={height - margin.bottom} stroke="#F2F5F7" strokeDasharray="3 4" opacity=".5" />}
    </svg>{tooltipData && <TooltipWithBounds left={tooltipLeft} top={tooltipTop} className="chart-tooltip"><strong>Cycle {tooltipData.cycle}</strong>{Object.entries(tooltipData.values).map(([key, value]) => <span key={key}>{key}: {value.toFixed(3)}</span>)}</TooltipWithBounds>}</div></div>
    <p className="chart-note">Straight segments connect measured cycles without smoothing. {data.cycle.length >= 500 ? "Series may be downsampled by the API." : "All returned points are shown."}</p>
  </section>;
}

export default function SafeMachineSignalChart(props: { data: MachineSeries; available: string[]; selected: string[]; onChange: (sensors: string[]) => void }) {
  return <ErrorBoundary area="chart" resetKey={`${props.data.machine_id}:${props.selected.join(",")}`}><MachineSignalChart {...props} /></ErrorBoundary>;
}
