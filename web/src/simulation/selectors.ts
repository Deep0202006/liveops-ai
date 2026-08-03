import type { AssetSnapshot, FleetSnapshot, MaintenanceStatus, ScenarioPack } from "./contracts";

export function calculateSnapshot(scenario:ScenarioPack, step:number, playing:boolean, speed:number):FleetSnapshot {
  const bounded=Math.max(scenario.timeline.start,Math.min(scenario.timeline.end,step));
  const events=scenario.events.filter(event=>event.cycle<=bounded);
  const assets:AssetSnapshot[]=scenario.assets.map(asset=>{const sample=asset.samples[bounded]??asset.samples.at(-1)!;return {asset,sample,history:asset.samples.slice(Math.max(0,bounded-119),bounded+1),alertCount:events.filter(event=>event.asset_id===asset.asset_id&&event.severity!=="information").length}});
  const statuses:MaintenanceStatus[]=["HEALTHY","MONITOR","PLAN_MAINTENANCE","CRITICAL"];
  const statusCounts=Object.fromEntries(statuses.map(status=>[status,assets.filter(item=>item.sample.maintenance_status===status).length])) as Record<MaintenanceStatus,number>;
  const sorted=assets.map(item=>item.sample.predicted_rul).sort((a,b)=>a-b); const medianRul=sorted.length%2?sorted[(sorted.length-1)/2]:(sorted[sorted.length/2-1]+sorted[sorted.length/2])/2;
  return {scenario,step:bounded,playing,speed,assets,events,statusCounts,medianRul:Math.round(medianRul*10)/10,maintenanceDue:statusCounts.PLAN_MAINTENANCE+statusCounts.CRITICAL,activeAlerts:events.filter(event=>event.severity!=="information").length,complete:bounded>=scenario.timeline.end};
}

export function sortAssets(assets:AssetSnapshot[],sort:"rul"|"decline"|"id"){return [...assets].sort((a,b)=>sort==="rul"?a.sample.predicted_rul-b.sample.predicted_rul:sort==="decline"?a.sample.rul_change-b.sample.rul_change:a.asset.asset_id.localeCompare(b.asset.asset_id))}
