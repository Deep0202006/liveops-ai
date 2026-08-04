import { describe,expect,it } from "vitest";
import { countActiveAlertFilters,filterAlertEvents,type AlertFilters } from "../alertFilters";
import type { SimulationEvent } from "../contracts";

const events:SimulationEvent[]=[
  {id:"a",cycle:1,asset_id:"RT-01",type:"ASSET_STARTED",severity:"information",message:"started"},
  {id:"b",cycle:2,asset_id:"RT-02",type:"STATUS_CHANGED",severity:"warning",message:"changed"},
  {id:"c",cycle:3,asset_id:"RT-01",type:"CRITICAL_RISK",severity:"critical",message:"risk"},
  {id:"d",cycle:4,asset_id:"RT-02",type:"CRITICAL_RISK",severity:"critical",message:"risk"},
];
const all=():AlertFilters=>({severity:"all",assetIds:new Set(),eventTypes:new Set()});

describe("alert filtering",()=>{
  it("filters each contract dimension",()=>{
    expect(filterAlertEvents(events,{...all(),severity:"critical"}).map(e=>e.id)).toEqual(["c","d"]);
    expect(filterAlertEvents(events,{...all(),assetIds:new Set(["RT-02"])}).map(e=>e.id)).toEqual(["b","d"]);
    expect(filterAlertEvents(events,{...all(),eventTypes:new Set(["STATUS_CHANGED"])}).map(e=>e.id)).toEqual(["b"]);
  });
  it("combines dimensions without duplicates or source mutation and preserves order",()=>{
    const before=structuredClone(events);const result=filterAlertEvents(events,{severity:"critical",assetIds:new Set(["RT-01","RT-02"]),eventTypes:new Set(["CRITICAL_RISK"])});
    expect(result.map(e=>e.id)).toEqual(["c","d"]);expect(new Set(result.map(e=>e.id)).size).toBe(result.length);expect(events).toEqual(before);
  });
  it("clears to all events and represents an empty result",()=>{
    expect(filterAlertEvents(events,all())).toEqual(events);
    expect(filterAlertEvents(events,{...all(),assetIds:new Set(["unknown"])})).toEqual([]);
    expect(countActiveAlertFilters({severity:"warning",assetIds:new Set(["RT-01"]),eventTypes:new Set(["STATUS_CHANGED"])})).toBe(3);
  });
});
