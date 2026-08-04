import type { SimulationEvent } from "./contracts";

export type AlertSeverity = SimulationEvent["severity"] | "all";
export interface AlertFilters { severity:AlertSeverity; assetIds:ReadonlySet<string>; eventTypes:ReadonlySet<string> }

/** Returns a new array while retaining the source stream's deterministic order. */
export function filterAlertEvents(events:readonly SimulationEvent[],filters:AlertFilters):SimulationEvent[]{
  return events.filter(event=>(filters.severity==="all"||event.severity===filters.severity)
    &&(filters.assetIds.size===0||filters.assetIds.has(event.asset_id))
    &&(filters.eventTypes.size===0||filters.eventTypes.has(event.type)));
}

export function countActiveAlertFilters(filters:AlertFilters):number{
  return Number(filters.severity!=="all")+Number(filters.assetIds.size>0)+Number(filters.eventTypes.size>0);
}
