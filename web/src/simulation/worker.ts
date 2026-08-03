/// <reference lib="webworker" />
import type { ScenarioPack, WorkerCommand } from "./contracts";
import { SNAPSHOT_INTERVAL_MS, nextStep } from "./clock";
import { calculateSnapshot } from "./selectors";

let pack:ScenarioPack|undefined;let step=0;let playing=false;let speed=1;let hidden=false;let timer:number|undefined;
function emit(){if(pack)self.postMessage({type:"SNAPSHOT",snapshot:calculateSnapshot(pack,step,playing,speed)})}
function stop(){if(timer!==undefined){clearInterval(timer);timer=undefined}}
function schedule(){stop();if(!playing||hidden||!pack)return;timer=self.setInterval(()=>{if(!pack)return;step=nextStep(step,pack.timeline.end,speed);if(step>=pack.timeline.end){playing=false;stop()}emit()},SNAPSHOT_INTERVAL_MS)}
self.onmessage=(message:MessageEvent<WorkerCommand>)=>{const command=message.data;switch(command.type){case"LOAD":pack=command.pack;step=pack.timeline.default_start;playing=false;speed=1;stop();emit();break;case"PLAY":playing=true;schedule();emit();break;case"PAUSE":playing=false;stop();emit();break;case"STEP":if(pack){playing=false;stop();step=Math.min(pack.timeline.end,step+1);emit()}break;case"RESET":if(pack){playing=false;stop();step=pack.timeline.default_start;emit()}break;case"SEEK":if(pack){step=Math.max(pack.timeline.start,Math.min(pack.timeline.end,command.step));emit()}break;case"SPEED":speed=[1,5,20].includes(command.speed)?command.speed:1;schedule();emit();break;case"VISIBILITY":hidden=command.hidden;schedule();break;case"SNAPSHOT":emit();break;}}
