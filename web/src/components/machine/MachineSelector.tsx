import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import type { DatasetInspection, MachineInspection } from "../../api/types";

export function MachineSelector({ validation, selected, inspection, onSelect, onPredict, busy }: { validation: DatasetInspection; selected?: string; inspection?: MachineInspection; onSelect: (id: string) => void; onPredict: () => void; busy: boolean }) {
  const [search, setSearch] = useState("");
  const ids = useMemo(() => validation.machine_ids.map(String).filter((id) => id.includes(search.trim())), [validation.machine_ids, search]);
  return <section className="machine-selector" aria-labelledby="machine-heading"><div className="section-heading"><span className="eyebrow">Validated input</span><h2 id="machine-heading">Choose a machine</h2><p>{validation.validation.machine_count} machines · {validation.row_count} observations · {validation.column_count} columns</p></div>
    <label className="search-field"><Search /><span className="sr-only">Search machine IDs</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search machine ID" /></label>
    <div className="machine-grid" role="listbox" aria-label="Machines">{ids.map((id) => <button type="button" role="option" aria-selected={selected === id} className={selected === id ? "selected" : ""} key={id} onClick={() => onSelect(id)}><code>M-{id}</code><span>{selected === id && inspection ? `${inspection.observation_count} cycles` : "Inspect trajectory"}</span><i>{selected === id && inspection ? (inspection.prediction_ready ? "Ready" : "Not ready") : "Select"}</i></button>)}</div>
    {inspection && <div className="machine-summary"><div><span>First cycle</span><strong>{inspection.first_cycle}</strong></div><div><span>Latest cycle</span><strong>{inspection.latest_cycle}</strong></div><div><span>Observations</span><strong>{inspection.observation_count}</strong></div><div><span>Prediction</span><strong>{inspection.prediction_ready ? "Ready" : "More history needed"}</strong></div></div>}
    <button className="button primary predict-button" type="button" disabled={!inspection?.prediction_ready || busy} onClick={onPredict}>{busy ? <><span className="spinner" /> Estimating remaining life</> : "Estimate remaining life"}</button>
  </section>;
}
