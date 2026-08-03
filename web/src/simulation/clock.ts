export const SNAPSHOT_INTERVAL_MS=500;
export function nextStep(current:number,end:number,speed:number){return Math.min(end,current+Math.max(1,Math.round(speed/5)))}
