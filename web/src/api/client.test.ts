import { apiRequest } from "./client";
import { LiveOpsApiError, errorPresentation } from "./errors";

const ok = { success:true, data:{ value:1 }, error:null, meta:{ api_version:"1.0", request_id:"req-1" } };
afterEach(()=>{vi.restoreAllMocks();vi.useRealTimers()});

test("accepts a verified envelope and preserves request metadata",async()=>{vi.stubGlobal("fetch",vi.fn().mockResolvedValue(new Response(JSON.stringify(ok),{status:200,headers:{"Content-Type":"application/json"}})));const result=await apiRequest<{value:number}>("/status");expect(result).toEqual({data:{value:1},requestId:"req-1",apiVersion:"1.0"})});
test("rejects malformed envelopes without exposing response text",async()=>{vi.stubGlobal("fetch",vi.fn().mockResolvedValue(new Response(JSON.stringify({data:{secret:"raw"}}),{status:200})));await expect(apiRequest("/status")).rejects.toMatchObject({code:"INVALID_RESPONSE"})});
test("preserves typed API errors and request IDs",async()=>{const body={success:false,data:null,error:{code:"INVALID_SCHEMA",message:"Required column is missing.",recoverable:true,details:{}},meta:{api_version:"1.0",request_id:"req-bad"}};vi.stubGlobal("fetch",vi.fn().mockResolvedValue(new Response(JSON.stringify(body),{status:422})));await expect(apiRequest("/datasets/inspect")).rejects.toMatchObject({code:"INVALID_SCHEMA",requestId:"req-bad",status:422})});
test("distinguishes timeout, caller abort, network failure, and safe server errors",async()=>{
  vi.useFakeTimers();vi.stubGlobal("fetch",vi.fn((_url,_init)=>new Promise((_resolve,reject)=>{(_init as RequestInit).signal?.addEventListener("abort",()=>reject(new DOMException("aborted","AbortError")))})));const pending=apiRequest("/status",{}, {timeoutMs:10});const timedOut=expect(pending).rejects.toMatchObject({code:"REQUEST_TIMEOUT"});await vi.advanceTimersByTimeAsync(11);await timedOut;
  vi.useRealTimers();const controller=new AbortController();vi.stubGlobal("fetch",vi.fn((_url,_init)=>new Promise((_resolve,reject)=>{(_init as RequestInit).signal?.addEventListener("abort",()=>reject(new DOMException("aborted","AbortError")))})));const aborted=apiRequest("/status",{}, {signal:controller.signal});controller.abort();await expect(aborted).rejects.toMatchObject({name:"AbortError"});
  vi.stubGlobal("fetch",vi.fn().mockRejectedValue(new TypeError("offline")));await expect(apiRequest("/status")).rejects.toMatchObject({code:"API_UNAVAILABLE"});
  const server={success:false,data:null,error:{code:"INTERNAL_ERROR",message:"Safe failure.",recoverable:false,details:{}},meta:{api_version:"1.0",request_id:"req-500"}};vi.stubGlobal("fetch",vi.fn().mockResolvedValue(new Response(JSON.stringify(server),{status:500})));await expect(apiRequest("/status")).rejects.toMatchObject({code:"INTERNAL_ERROR",requestId:"req-500"});
});
test("maps corrective actions without raw data",()=>{const view=errorPresentation(new LiveOpsApiError({code:"REQUEST_TIMEOUT",message:"Timed out.",recoverable:true,details:{}},408,"req-time"));expect(view).toMatchObject({title:"Request timed out",requestId:"req-time"});expect(view.action).toMatch(/Retry/)});
