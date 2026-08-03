import type { components } from "./generated/openapi";

export type StatusData = components["schemas"]["StatusData"];
export type MetadataData = components["schemas"]["ModelMetadataData"];
export type EvaluationData = components["schemas"]["EvaluationData"];
export type DemoSample = components["schemas"]["DemoSampleData"];
export type DatasetInspection = components["schemas"]["DatasetInspectionData"];
export type MachineInspection = components["schemas"]["MachineInspectionData"];
export type MachineSeries = components["schemas"]["MachineSeriesData"];
export type PredictionData = components["schemas"]["PredictionData"];
export type MaintenanceThresholds = components["schemas"]["MaintenanceThresholds"];
export type EvaluationMetric = components["schemas"]["EvaluationMetricData"];

export type FrontendEnvelope =
  | components["schemas"]["ApiEnvelope_StatusData_"]
  | components["schemas"]["ApiEnvelope_ModelMetadataData_"]
  | components["schemas"]["ApiEnvelope_EvaluationData_"]
  | components["schemas"]["ApiEnvelope_list_DemoSampleData__"]
  | components["schemas"]["ApiEnvelope_DatasetInspectionData_"]
  | components["schemas"]["ApiEnvelope_MachineInspectionData_"]
  | components["schemas"]["ApiEnvelope_MachineSeriesData_"]
  | components["schemas"]["ApiEnvelope_PredictionData_"];
