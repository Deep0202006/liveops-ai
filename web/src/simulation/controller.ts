import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Catalog, FleetSnapshot, WorkerCommand } from "./contracts";
import { loadCatalog, loadScenario } from "./scenario-loader";

function useSimulationController(){const worker=useRef<Worker>();const [catalog,setCatalog]=useState<Catalog>();const [snapshot,setSnapshot]=useState<FleetSnapshot>();const [error,setError]=useState<string>();
  const send=useCallback((command:WorkerCommand)=>worker.current?.postMessage(command),[]);
  const selectScenario=useCallback(async(slug:string)=>{try{setError(undefined);const item=catalog?.scenarios.find(s=>s.slug===slug);if(!item)return;const pack=await loadScenario(item.url);send({type:"LOAD",pack})}catch(value){setError(value instanceof Error?value.message:"Unable to load simulation")}},[catalog,send]);
  useEffect(()=>{const instance=new Worker(new URL("./worker.ts",import.meta.url),{type:"module"});worker.current=instance;instance.onmessage=(event:MessageEvent<{type:"SNAPSHOT";snapshot:FleetSnapshot}>)=>setSnapshot(event.data.snapshot);const visibility=()=>send({type:"VISIBILITY",hidden:document.hidden});document.addEventListener("visibilitychange",visibility);const controller=new AbortController();loadCatalog(controller.signal).then(value=>{setCatalog(value);return loadScenario(value.scenarios[0].url,controller.signal)}).then(pack=>send({type:"LOAD",pack})).catch(value=>setError(value instanceof Error?value.message:"Unable to load simulation"));return()=>{controller.abort();document.removeEventListener("visibilitychange",visibility);instance.terminate();worker.current=undefined}},[send]);
  return useMemo(()=>({catalog,snapshot,error,selectScenario,play:()=>send({type:"PLAY"}),pause:()=>send({type:"PAUSE"}),step:()=>send({type:"STEP"}),reset:()=>send({type:"RESET"}),seek:(step:number)=>send({type:"SEEK",step}),setSpeed:(speed:number)=>send({type:"SPEED",speed})}),[catalog,snapshot,error,selectScenario,send]);}

type SimulationContextValue=ReturnType<typeof useSimulationController>;
const SimulationContext=createContext<SimulationContextValue|null>(null);
export function SimulationProvider({children}:{children:ReactNode}){const simulation=useSimulationController();return createElement(SimulationContext.Provider,{value:simulation},children)}
// Provider and hook intentionally share the controller contract.
export function useSimulation(){const simulation=useContext(SimulationContext);if(!simulation)throw new Error("useSimulation must be used within SimulationProvider");return simulation}
