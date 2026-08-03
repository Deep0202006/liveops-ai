import { useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { FileCheck2, FileUp, RotateCcw, X } from "lucide-react";
import { FocusLensCard } from "../primitives/FocusLensCard";
import type { DemoSample } from "../../api/types";

export function UploadWorkbench({ file, busy, samples, demoMode, modeKnown = true, onSelect, onSample, onValidate, onReset }: { file?: File; busy: boolean; samples?: DemoSample[]; demoMode: boolean; modeKnown?: boolean; onSelect: (file: File) => void; onSample: (sample: DemoSample) => void; onValidate: () => void; onReset: () => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const pick = (files: FileList | null) => { const next = files?.[0]; if (next) onSelect(next); };
  const drop = (event: DragEvent) => { event.preventDefault(); setDragging(false); pick(event.dataTransfer.files); };
  return <FocusLensCard className="upload-workbench"><div className="section-heading"><span className="eyebrow">Input trajectory</span><h2>Upload sensor history</h2><p>CSV only, up to 4 MiB. Include machine_id, cycle, three operational settings, and sensor_1 through sensor_21.</p></div>
    <div className={`drop-zone ${dragging ? "dragging" : ""}`} onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={drop}>
      <input ref={input} id="trajectory-file" aria-label="Machine trajectory CSV" type="file" accept=".csv,text/csv" onChange={(event: ChangeEvent<HTMLInputElement>) => pick(event.target.files)} />
      {file ? <><FileCheck2 /><strong>{file.name}</strong><span>{(file.size / 1024).toFixed(1)} KiB selected</span></> : <><FileUp /><strong>Drop a machine trajectory here</strong><span>or choose a CSV using the accessible file picker</span></>}
      <button className="button secondary" type="button" onClick={() => input.current?.click()}>{file ? "Replace file" : "Choose CSV"}</button>
    </div>
    <div className="sample-row"><span>{!modeKnown ? "Checking sample availability" : demoMode ? "Official demo samples" : "Use a local compatible trajectory"}</span>{demoMode && samples?.map((sample) => <button type="button" key={sample.sample_id} onClick={() => onSample(sample)}>{sample.display_name}</button>)}</div>
    <div className="workbench-actions">{file && <button className="button ghost" type="button" onClick={onReset}><X /> Clear</button>}<button className="button primary" type="button" disabled={!file || busy} onClick={onValidate}>{busy ? <><span className="spinner" /> Validating structure</> : "Validate trajectory"}</button></div>
    {busy && <div className="stage-progress" role="status" aria-live="polite"><span className="active">Uploading</span><span className="active">Validating structure</span><span>Preparing machine list</span></div>}
    <details><summary>Required schema</summary><p>One row per machine cycle. Machine IDs must be positive whole numbers; cycles must be unique and increasing within each machine. A minimum of five observations is required for prediction.</p></details>
    {!file && <button className="reset-link" type="button" onClick={() => input.current?.click()}><RotateCcw /> Start with a local CSV</button>}
  </FocusLensCard>;
}
