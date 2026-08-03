import type { PredictionData } from "../../api/types";
import { FocusLensCard } from "../primitives/FocusLensCard";

export function EvidencePanel({ prediction, requestId }: { prediction: PredictionData; requestId?: string }) {
  return <FocusLensCard className="evidence-panel"><div className="section-heading"><span className="eyebrow">Model evidence</span><h2>What informed this estimate</h2></div><div className="evidence-columns">
    <section><h3>Important features</h3>{prediction.important_features.length ? <ul>{prediction.important_features.map((item) => <li key={item}><code>{item}</code></li>)}</ul> : <p>No important features are available.</p>}</section>
    <section><h3>Recent sensor changes</h3>{prediction.recent_changes.length ? <ul>{prediction.recent_changes.map((item) => <li key={item}>{item}</li>)}</ul> : <p>No recent changes were reported.</p>}</section>
    <section><h3>Model identity</h3><p><code>{prediction.model_name}</code> · version <code>{prediction.model_version}</code></p><p>Explanations indicate model evidence, not physical causation. Estimates are not guarantees.</p>{requestId && <p className="request-id">Request {requestId}</p>}</section>
  </div></FocusLensCard>;
}
