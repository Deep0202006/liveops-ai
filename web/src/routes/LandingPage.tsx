import { ArrowRight, ChevronRight, CircleCheck, Gauge, GitCompareArrows, Radar, ScanLine, ShieldCheck, Wrench } from "lucide-react";
import { lazy, Suspense, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useEvaluation, useMetadata } from "../api/queries";
import "../design-system/tokens.css";
import "../design-system/materials.css";
import "../design-system/typography.css";
import { DepthDrift } from "../effects/DepthDrift";
import { GlassRefraction } from "../effects/GlassRefraction";
import { TelemetryAurora } from "../effects/TelemetryAurora";
import "../styles/alloy-landing.css";

const LivingCommandPreview = lazy(() => import("../landing/LivingCommandPreview"));

function LandingNavigation() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => { const update = () => setScrolled(scrollY > 18); update(); addEventListener("scroll", update, { passive: true }); return () => removeEventListener("scroll", update); }, []);
  return <GlassRefraction className={`alloy-nav glass-control--landing${scrolled ? " is-scrolled" : ""}`}><Link className="alloy-brand" to="/"><i />LiveOps AI</Link><nav aria-label="Landing navigation"><Link to="/command">Command Center</Link><a href="#platform">Platform</a><Link to="/model">Model Evidence</Link></nav><div className="alloy-nav-actions"><span><i />Live model-backed simulation</span><Link className="alloy-button alloy-button--dark" to="/command">Open Command Center</Link></div></GlassRefraction>;
}

const capability = [
  [Radar, "Fleet visibility", "Track risk posture, freshness and Remaining Useful Life across the live fleet."],
  [ScanLine, "Asset investigation", "Connect telemetry movement to a model-backed prediction and evidence."],
  [Gauge, "Live alerting", "See threshold, deviation and critical-risk events in deterministic sequence."],
  [Wrench, "Maintenance priority", "Rank attention using RUL, decline and active operational state."],
  [GitCompareArrows, "Asset comparison", "Compare up to three machines on shared RUL and sensor axes."],
  [ShieldCheck, "Time control", "Pause, seek and replay the same scenario without changing its outcome."],
] as const;

export default function LandingPage() {
  const metadata = useMetadata();
  const evaluation = useEvaluation();
  const model = metadata.data?.data;
  const final = evaluation.data?.data.final_test;
  return <main className="alloy-landing">
    <a className="alloy-skip" href="#landing-content">Skip to content</a>
    <LandingNavigation />
    <section className="alloy-hero" id="landing-content"><TelemetryAurora /><div className="alloy-hero-copy"><span className="alloy-label">Reliability intelligence · model-backed simulation</span><h1>See machine risk forming before downtime takes control.</h1><p>A model-backed reliability command center that replays machine telemetry, tracks degradation, predicts Remaining Useful Life, and prioritizes maintenance action.</p><div className="alloy-hero-actions"><Link className="alloy-button alloy-button--dark" to="/command">Open Command Center <ArrowRight /></Link><Link className="alloy-button alloy-button--quiet" to="/model">View Model Evidence <ChevronRight /></Link></div><div className="alloy-trust-labels" aria-label="Product trust statements"><span><CircleCheck />NASA C-MAPSS FD001</span><span><CircleCheck />Real trained RUL model</span><span><CircleCheck />Deterministic live simulation</span><span><CircleCheck />No physical factory connection</span></div></div>
      <DepthDrift className="alloy-preview-frame glass-control--landing"><div className="alloy-preview-top"><span>Command Center / Normal Shift</span><code>{model ? `${model.model_name} · ${model.model_version}` : "Model evidence loading"}</code></div><Suspense fallback={<div className="living-preview living-preview--loading">Loading live command preview…</div>}><LivingCommandPreview /></Suspense></DepthDrift>
    </section>
    <section className="alloy-evidence" aria-label="Verified model evidence"><div><span>Dataset</span><strong>NASA C-MAPSS FD001</strong></div><div><span>Model</span><strong>{model?.model_name ?? "Loading"}</strong></div><div><span>Test machines</span><strong className="alloy-metric">{final?.machine_count ?? "—"}</strong></div><div><span>MAE</span><strong className="alloy-metric">{final ? `${final.mae.toFixed(2)} cycles` : "—"}</strong></div><div><span>Near-failure MAE</span><strong className="alloy-metric">{final?.near_failure_mae != null ? `${final.near_failure_mae.toFixed(2)} cycles` : "—"}</strong></div><div><span>Version</span><strong className="alloy-metric">{model?.model_version ?? "—"}</strong></div></section>
    <section className="alloy-story" id="platform"><header><span className="alloy-label">One connected operational picture</span><h2>Move from telemetry to the next maintenance decision.</h2><p>The command center keeps evidence, time and risk together—so the signal remains understandable as the scenario advances.</p></header><ol>{[["01","Observe","Follow fleet status and raw sensor movement."],["02","Interpret","Read Remaining Useful Life with its prediction range."],["03","Prioritise","Compare declining assets on the same operational scale."],["04","Act","Review the maintenance order and investigate the evidence."]].map(([n,title,copy])=><li key={n}><span>{n}</span><div><h3>{title}</h3><p>{copy}</p></div></li>)}</ol></section>
    <section className="alloy-capabilities"><header><span className="alloy-label">Operational depth</span><h2>Built around the live machine decision.</h2></header><div>{capability.map(([Icon,title,copy])=><article key={title}><Icon /><div><h3>{title}</h3><p>{copy}</p></div></article>)}</div></section>
    <section className="alloy-transparency"><div><span className="alloy-label">Model transparency</span><h2>Evidence first. Certainty never implied.</h2><p>Predictions are engineering evidence derived from the verified FD001 artifact. They are not a physical factory connection or a substitute for qualified review.</p><Link to="/model">Inspect complete model evidence <ArrowRight /></Link></div><dl><div><dt>Dataset</dt><dd>NASA C-MAPSS FD001; one operating condition and fault mode.</dd></div><div><dt>Target</dt><dd>Remaining Useful Life in cycles, capped at 125 during training.</dd></div><div><dt>Model</dt><dd>{model ? `${model.model_name}, version ${model.model_version}.` : "Identity supplied by API metadata."}</dd></div><div><dt>Range</dt><dd>Prediction intervals are derived from validation residuals, not guarantees.</dd></div><div><dt>Simulation</dt><dd>Deterministic, model-backed scenario packs replayed in a browser worker.</dd></div><div><dt>Limitations</dt><dd>Benchmark evidence requires site-specific validation before operational use.</dd></div></dl></section>
    <section className="alloy-final"><span className="alloy-label">Signal to decision</span><h2>Enter the Reliability Command Center.</h2><p>Explore the live fleet, investigate prediction evidence and control the virtual shift.</p><Link className="alloy-button alloy-button--light" to="/command">Open Command Center <ArrowRight /></Link></section>
    <footer className="alloy-footer"><span>LiveOps AI</span><p>Model-backed reliability intelligence · simulation only</p><Link to="/model">Model Evidence</Link></footer>
  </main>;
}
