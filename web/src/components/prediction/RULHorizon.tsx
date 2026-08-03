import { motion, useReducedMotion } from "motion/react";
import type { MaintenanceThresholds, PredictionData } from "../../api/types";
import { FocusLensCard } from "../primitives/FocusLensCard";

const statusLabels: Record<string, string> = { HEALTHY: "Healthy horizon", MONITOR: "Monitor closely", PLAN_MAINTENANCE: "Plan maintenance", CRITICAL: "Critical maintenance" };

export function RULHorizon({ prediction, thresholds, compact = false }: { prediction?: PredictionData; thresholds?: MaintenanceThresholds | null; compact?: boolean }) {
  const reduce = useReducedMotion();
  if (!prediction) return <div className="horizon-empty"><div className="horizon-rule"><span /></div><p>RUL Horizon activates after a validated trajectory is analyzed.</p></div>;
  const observed = prediction.observed_through_cycle;
  const hasRange = prediction.lower_bound != null && prediction.upper_bound != null;
  const remainingLower = hasRange ? Math.max(0, Math.min(prediction.lower_bound!, prediction.upper_bound!)) : prediction.predicted_rul;
  const remainingUpper = hasRange ? Math.max(remainingLower, prediction.lower_bound!, prediction.upper_bound!) : prediction.predicted_rul;
  const end = observed + Math.max(remainingUpper, prediction.predicted_rul, thresholds?.monitor_at_or_below ?? 0);
  const pct = (value: number) => `${Math.max(0, Math.min(100, (value / end) * 100))}%`;
  const lower = observed + remainingLower;
  const upper = observed + remainingUpper;
  const estimate = observed + prediction.predicted_rul;
  const summary = `Machine ${prediction.machine_id} observed through cycle ${observed}. Estimated remaining useful life is ${prediction.predicted_rul.toFixed(1)} ${prediction.rul_unit}${hasRange ? `, with a range from ${remainingLower.toFixed(1)} to ${remainingUpper.toFixed(1)}` : ", with no complete prediction range available"}. Status: ${statusLabels[prediction.maintenance_status] ?? prediction.maintenance_status}.`;
  return <FocusLensCard className={compact ? "rul-card compact" : "rul-card"}>
    <div className="rul-header"><div><span className="eyebrow">Remaining useful life</span><div className="rul-value"><strong>{prediction.predicted_rul.toFixed(1)}</strong><span>{prediction.rul_unit}</span></div></div><span className={`maintenance-status status-${prediction.maintenance_status.toLowerCase()}`}>{statusLabels[prediction.maintenance_status] ?? prediction.maintenance_status}</span></div>
    <div className="horizon-plot" role="img" aria-label={summary}>
      <div className="horizon-axis" />
      <motion.div className="observed-region" initial={reduce ? false : { scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.34 }} style={{ width: pct(observed) }} />
      {hasRange && <motion.div className="forecast-range" initial={reduce ? false : { scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.46, delay: 0.24 }} style={{ left: pct(lower), width: pct(upper - lower) }} />}
      <motion.div className="forecast-line" initial={reduce ? false : { scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.52, delay: 0.16 }} style={{ left: pct(observed), width: pct(estimate - observed) }} />
      <div className="horizon-marker current" style={{ left: pct(observed) }}><i /><span>Now · {observed}</span></div>
      <div className="horizon-marker estimate" style={{ left: pct(estimate) }}><i /><span>Estimated horizon · {estimate.toFixed(0)}</span></div>
    </div>
    <div className="horizon-legend"><span><i className="legend-observed" />Observed history</span><span><i className="legend-forecast" />Forecast</span>{hasRange && <span><i className="legend-range" />Prediction range</span>}</div>
    <p className="sr-only">{summary}</p>
  </FocusLensCard>;
}
