import { apiRequest, multipart, type RequestOptions } from "./client";
import type { DatasetInspection, MachineInspection, MachineSeries, PredictionData } from "./types";

export const inspectDataset = (file: File, options?: RequestOptions) => apiRequest<DatasetInspection>("/datasets/inspect", { method: "POST", body: multipart(file) }, options);
export const inspectMachine = (file: File, machineId: string, options?: RequestOptions) => apiRequest<MachineInspection>("/machines/inspect", { method: "POST", body: multipart(file, { machine_id: machineId }) }, options);
export const fetchMachineSeries = (file: File, machineId: string, sensors: string[], options?: RequestOptions) => apiRequest<MachineSeries>("/machines/series", { method: "POST", body: multipart(file, { machine_id: machineId, sensors: sensors.join(","), maximum_points: "500" }) }, options);
export const predictMachine = (file: File, machineId: string, options?: RequestOptions) => apiRequest<PredictionData>("/predictions", { method: "POST", body: multipart(file, { machine_id: machineId }) }, options);
