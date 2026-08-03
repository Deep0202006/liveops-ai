import { lazy, Suspense, useEffect, useReducer, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { inspectDataset, inspectMachine, fetchMachineSeries, predictMachine } from "../api/mutations";
import { samplesQuery, useMetadata, useSystemStatus } from "../api/queries";
import type { DemoSample } from "../api/types";
import { analysisReducer, initialAnalysisState } from "../features/analysis/machine";
import { UploadWorkbench } from "../components/upload/UploadWorkbench";
import { MachineSelector } from "../components/machine/MachineSelector";
import { RULHorizon } from "../components/prediction/RULHorizon";
import { EvidencePanel } from "../components/evidence/EvidencePanel";
import { ErrorState } from "../components/status/ErrorState";
import { MetricTile } from "../components/primitives/MetricTile";

const MachineSignalChart = lazy(() => import("../components/charts/MachineSignalChart"));

async function sampleToFile(sample: DemoSample) { const response = await fetch(`/samples/${sample.filename}`); if (!response.ok) throw new Error("Sample unavailable"); return new File([await response.blob()], sample.filename, { type: "text/csv" }); }

export default function WorkspacePage() {
  const [state, dispatch] = useReducer(analysisReducer, initialAnalysisState);
  const status = useSystemStatus(), metadata = useMetadata();
  const samples = useQuery({ ...samplesQuery, enabled: status.data?.data.demo_only === true });
  const controllers = useRef(new Set<AbortController>()); const apiIdentity = status.data ? `${status.data.data.api_version}:${status.data.data.run_mode}` : undefined; const previousIdentity = useRef<string>();
  const requestEpoch = useRef(0); const seriesEpoch = useRef(0); const seriesController = useRef<AbortController>();
  const [sensors, setSensors] = useState(["sensor_2", "sensor_4", "sensor_11"]);
  const predicting = state.workflow === "predicting";
  const abortAll = () => { requestEpoch.current += 1; seriesEpoch.current += 1; seriesController.current?.abort(); controllers.current.forEach((controller) => controller.abort()); controllers.current.clear(); };
  const controller = () => { const value = new AbortController(); controllers.current.add(value); return value; };
  useEffect(() => () => abortAll(), []);
  useEffect(() => { if (!apiIdentity) return; if (previousIdentity.current && previousIdentity.current !== apiIdentity) { abortAll(); dispatch({ type: "RESET" }); } previousIdentity.current = apiIdentity; }, [apiIdentity]);
  const selectFile = (file: File) => { abortAll(); dispatch({ type: "SELECT_FILE", file }); };
  const selectSample = async (sample: DemoSample) => { try { selectFile(await sampleToFile(sample)); } catch (error: unknown) { dispatch({ type: "FAIL_VALIDATION", error }); } };
  const validate = async () => { if (!state.file) return; abortAll(); const epoch = requestEpoch.current; dispatch({ type: "VALIDATE" }); const active = controller(); try { const result = await inspectDataset(state.file, { signal: active.signal }); if (epoch === requestEpoch.current) dispatch({ type: "VALIDATED", validation: result.data, requestId: result.requestId }); } catch (error: unknown) { if (!active.signal.aborted && epoch === requestEpoch.current) dispatch({ type: "FAIL_VALIDATION", error }); } finally { controllers.current.delete(active); } };
  const selectMachine = async (machineId: string) => { if (!state.file) return; abortAll(); const epoch = requestEpoch.current; dispatch({ type: "SELECT_MACHINE", machineId }); const active = controller(); try { const [machine, series] = await Promise.all([inspectMachine(state.file, machineId, { signal: active.signal }), fetchMachineSeries(state.file, machineId, sensors, { signal: active.signal })]); if (epoch === requestEpoch.current) dispatch({ type: "INSPECTED", machine: machine.data, series: series.data }); } catch (error: unknown) { if (!active.signal.aborted && epoch === requestEpoch.current) dispatch({ type: "FAIL_PREDICTION", error }); } finally { controllers.current.delete(active); } };
  const predict = async () => { if (!state.file || !state.machineId || predicting) return; abortAll(); const epoch = requestEpoch.current; dispatch({ type: "PREDICT" }); const active = controller(); try { const result = await predictMachine(state.file, state.machineId, { signal: active.signal }); if (epoch === requestEpoch.current) { dispatch({ type: "PREDICTED", prediction: result.data, requestId: result.requestId }); requestAnimationFrame(() => document.getElementById("prediction-result")?.focus()); } } catch (error: unknown) { if (!active.signal.aborted && epoch === requestEpoch.current) dispatch({ type: "FAIL_PREDICTION", error }); } finally { controllers.current.delete(active); } };
  const changeSensors = async (next: string[]) => { setSensors(next); if (!state.file || !state.machineId || !state.machine) return; seriesController.current?.abort(); const active = new AbortController(); seriesController.current = active; const epoch = ++seriesEpoch.current; try { const result = await fetchMachineSeries(state.file, state.machineId, next, { signal: active.signal }); if (epoch === seriesEpoch.current) dispatch({ type: "INSPECTED", machine: state.machine, series: result.data }); } catch { /* Keep the last verified series; a later selection or retry can replace it. */ } finally { if (seriesController.current === active) seriesController.current = undefined; } };
  const reset = () => { abortAll(); dispatch({ type: "RESET" }); };
  const validating = state.workflow === "validating";
  return <div className="workspace-page"><header className="workspace-header"><div><span className="eyebrow">Analysis workspace</span><h1>Machine remaining useful life</h1><p>Validate a sensor trajectory, inspect one machine, then request an FD001 model estimate.</p></div>{state.file && <button className="button ghost" type="button" onClick={reset}><RotateCcw /> New analysis</button>}</header>
    <div className={`demo-banner ${status.data?.data.demo_only === false ? "real-banner" : ""}`} role="status">{!status.data ? <><strong>Checking model mode.</strong> Confirming API and artifact availability.</> : status.data.data.demo_only ? <><strong>Demo mode is active.</strong> Predictions use synthetic software-verification data and are not publishable model accuracy claims.</> : <><strong>Real model mode is active.</strong> Predictions use the verified FD001 artifact and remain estimates, not guarantees.</>}</div>
    <div className="workspace-grid"><div className="workspace-primary">
      <UploadWorkbench file={state.file} busy={validating} samples={samples.data?.data} demoMode={status.data?.data.demo_only === true} modeKnown={Boolean(status.data)} onSelect={selectFile} onSample={selectSample} onValidate={validate} onReset={reset} />
      {state.workflow === "validation-error" && <ErrorState error={state.error} onRetry={validate} />}
      {state.validation && <MachineSelector validation={state.validation} selected={state.machineId} inspection={state.machine} onSelect={selectMachine} onPredict={predict} busy={state.workflow === "inspecting-machine" || predicting} />}
    </div><aside className="workspace-context"><span className="eyebrow">Workflow state</span><ol>{["Input selected","Structure validated","Machine inspected","Prediction complete"].map((step, index) => <li className={(state.file ? 0 : -1) >= index || (state.validation ? 1 : -1) >= index || (state.machine ? 2 : -1) >= index || (state.prediction ? 3 : -1) >= index ? "complete" : ""} key={step}><span>{index + 1}</span>{step}</li>)}</ol><p>Files remain in this browser session and are resent to the stateless API. No analysis history is stored.</p></aside></div>
    {state.workflow === "prediction-error" && <ErrorState error={state.error} onRetry={predict} />}
    {state.prediction && <section id="prediction-result" tabIndex={-1} className="prediction-result" aria-live="polite"><div className="result-heading"><span className="eyebrow">Prediction complete</span><h2>Machine M-{state.prediction.machine_id}</h2><p>The model estimates remaining cycles from the latest validated observation.</p></div><RULHorizon prediction={state.prediction} thresholds={metadata.data?.data.maintenance_thresholds} /><div className="result-metrics"><MetricTile label="Observed through" value={`Cycle ${state.prediction.observed_through_cycle}`} /><MetricTile label="Lower bound" value={state.prediction.lower_bound != null ? `${state.prediction.lower_bound.toFixed(1)} cycles` : "Not available"} variant="information" /><MetricTile label="Upper bound" value={state.prediction.upper_bound != null ? `${state.prediction.upper_bound.toFixed(1)} cycles` : "Not available"} variant="information" /><MetricTile label="Model" value={state.prediction.model_name} detail={`version ${state.prediction.model_version}`} /></div>
      {state.series && state.machine && <Suspense fallback={<div className="panel-loading"><span className="spinner" /> Loading signal chart</div>}><MachineSignalChart data={state.series} available={state.machine.available_sensor_columns} selected={sensors} onChange={changeSensors} /></Suspense>}
      <EvidencePanel prediction={state.prediction} requestId={state.requestId} />{state.prediction.warnings.length > 0 && <div className="warning-panel"><h3>Data warnings</h3><ul>{state.prediction.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul></div>}
    </section>}
  </div>;
}
