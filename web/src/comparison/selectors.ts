import type { AssetSnapshot, MaintenanceStatus, SimulationEvent } from "../simulation/contracts";

const severityRank = { information: 0, warning: 1, critical: 2 } as const;
const statusRank: Record<MaintenanceStatus, number> = { HEALTHY: 0, MONITOR: 1, PLAN_MAINTENANCE: 2, CRITICAL: 3 };
export type ComparedAsset = AssetSnapshot & { events: SimulationEvent[]; declineRate: number };

export function buildComparedAssets(assets: AssetSnapshot[], events: SimulationEvent[], pins: string[]): ComparedAsset[] {
  return pins.flatMap((id) => {
    const item = assets.find((asset) => asset.asset.asset_id === id);
    if (!item) return [];
    const history = item.history.slice(-10);
    const declineRate = history.length > 1 ? (history.at(-1)!.predicted_rul - history[0].predicted_rul) / (history.length - 1) : item.sample.rul_change;
    return [{ ...item, events: events.filter((event) => event.asset_id === id && event.severity !== "information"), declineRate }];
  });
}

export function comparisonDecision(items: ComparedAsset[]) {
  const byPriority = [...items].sort((a, b) => statusRank[b.sample.maintenance_status] - statusRank[a.sample.maintenance_status] || a.sample.predicted_rul - b.sample.predicted_rul || a.declineRate - b.declineRate || a.asset.asset_id.localeCompare(b.asset.asset_id));
  const lowest = [...items].sort((a, b) => a.sample.predicted_rul - b.sample.predicted_rul || a.asset.asset_id.localeCompare(b.asset.asset_id))[0];
  const fastest = [...items].sort((a, b) => a.declineRate - b.declineRate || a.asset.asset_id.localeCompare(b.asset.asset_id))[0];
  const alert = [...items].sort((a, b) => Math.max(-1, ...b.events.map((event) => severityRank[event.severity])) - Math.max(-1, ...a.events.map((event) => severityRank[event.severity])) || a.asset.asset_id.localeCompare(b.asset.asset_id))[0];
  return { highestPriority: byPriority[0], lowest, fastest, alert, reviewOrder: byPriority };
}

export function sharedRulMaximum(items: ComparedAsset[]) {
  return Math.max(100, ...items.flatMap((item) => [item.sample.predicted_rul, item.sample.upper_bound ?? 0]), 50) * 1.05;
}
