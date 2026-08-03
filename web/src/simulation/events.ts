import type { SimulationEvent } from "./contracts";
export const eventLabel=(event:SimulationEvent)=>event.type.replaceAll("_"," ").toLowerCase();
export const nextEvent=(events:SimulationEvent[],step:number,severity?:string)=>events.find(event=>event.cycle>step&&(!severity||event.severity===severity));
