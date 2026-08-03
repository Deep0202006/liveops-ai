import type { DatasetInspection, MachineInspection, MachineSeries, PredictionData } from "../../api/types";

export type WorkflowState = "idle" | "selecting-input" | "validating" | "validation-error" | "machine-selection" | "inspecting-machine" | "predicting" | "prediction-success" | "prediction-error";
export type AnalysisState = { workflow: WorkflowState; file?: File; validation?: DatasetInspection; machineId?: string; machine?: MachineInspection; series?: MachineSeries; prediction?: PredictionData; requestId?: string; error?: unknown };
export type AnalysisAction =
  | { type: "SELECT_FILE"; file: File }
  | { type: "VALIDATE" }
  | { type: "VALIDATED"; validation: DatasetInspection; requestId: string }
  | { type: "FAIL_VALIDATION"; error: unknown }
  | { type: "SELECT_MACHINE"; machineId: string }
  | { type: "INSPECTED"; machine: MachineInspection; series?: MachineSeries }
  | { type: "PREDICT" }
  | { type: "PREDICTED"; prediction: PredictionData; requestId: string }
  | { type: "FAIL_PREDICTION"; error: unknown }
  | { type: "RESET" };

export const initialAnalysisState: AnalysisState = { workflow: "idle" };

const allowed: Record<AnalysisAction["type"], WorkflowState[]> = {
  SELECT_FILE: ["idle", "selecting-input", "validating", "validation-error", "machine-selection", "inspecting-machine", "predicting", "prediction-success", "prediction-error"],
  VALIDATE: ["selecting-input", "validation-error", "machine-selection", "prediction-success", "prediction-error"],
  VALIDATED: ["validating"], FAIL_VALIDATION: ["idle", "validating", "selecting-input"],
  SELECT_MACHINE: ["machine-selection", "inspecting-machine", "predicting", "prediction-success", "prediction-error"],
  INSPECTED: ["inspecting-machine", "machine-selection", "prediction-success"],
  PREDICT: ["machine-selection", "prediction-error", "prediction-success"],
  PREDICTED: ["predicting"], FAIL_PREDICTION: ["predicting", "inspecting-machine"],
  RESET: ["idle", "selecting-input", "validating", "validation-error", "machine-selection", "inspecting-machine", "predicting", "prediction-success", "prediction-error"],
};

export function analysisReducer(state: AnalysisState, action: AnalysisAction): AnalysisState {
  if (!allowed[action.type].includes(state.workflow)) return state;
  switch (action.type) {
    case "SELECT_FILE": return { workflow: "selecting-input", file: action.file };
    case "VALIDATE": return state.file ? { workflow: "validating", file: state.file } : state;
    case "VALIDATED": return { workflow: "machine-selection", file: state.file, validation: action.validation, requestId: action.requestId };
    case "FAIL_VALIDATION": return { workflow: "validation-error", file: state.file, error: action.error };
    case "SELECT_MACHINE": return { workflow: "inspecting-machine", file: state.file, validation: state.validation, machineId: action.machineId };
    case "INSPECTED": return { ...state, workflow: state.workflow === "prediction-success" ? "prediction-success" : "machine-selection", machine: action.machine, series: action.series };
    case "PREDICT": return state.machineId ? { ...state, workflow: "predicting", prediction: undefined, error: undefined } : state;
    case "PREDICTED": return { ...state, workflow: "prediction-success", prediction: action.prediction, requestId: action.requestId };
    case "FAIL_PREDICTION": return { ...state, workflow: "prediction-error", prediction: undefined, error: action.error };
    case "RESET": return initialAnalysisState;
  }
}
