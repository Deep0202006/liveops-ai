import { analysisReducer, initialAnalysisState } from "./machine";
import type { DatasetInspection, MachineInspection, PredictionData } from "../../api/types";

const file = new File(["x"], "machine.csv", { type: "text/csv" });
const validation = { filename:"machine.csv", validation:{valid:true,machine_count:1,observation_count:5,warnings:[],constant_sensor_columns:[],missing_cycles_by_machine:{}}, machine_ids:[1], row_count:5,column_count:26,dataset_state:"REAL_DATASET_VALIDATED",warnings:[] } satisfies DatasetInspection;
const machine = { machine_id:1,observation_count:5,first_cycle:1,latest_cycle:5,latest_sensor_values:{sensor_1:1},warnings:[],available_sensor_columns:["sensor_1"],recent_changes:[],prediction_ready:true } satisfies MachineInspection;
const prediction = { machine_id:1,observed_through_cycle:5,predicted_rul:40,rul_unit:"cycles",maintenance_status:"PLAN_MAINTENANCE",lower_bound:30,upper_bound:50,warnings:[],important_features:[],recent_changes:[],model_name:"extra_trees",model_version:"1.0.0",demo_only:false } satisfies PredictionData;

test("new files, machines, and failures clear stale predictions", () => {
  let state = analysisReducer(initialAnalysisState,{type:"SELECT_FILE",file});
  state = analysisReducer(state,{type:"VALIDATE"});
  state = analysisReducer(state,{type:"VALIDATED",validation,requestId:"a"});
  state = analysisReducer(state,{type:"SELECT_MACHINE",machineId:"1"});
  state = analysisReducer(state,{type:"INSPECTED",machine});
  state = analysisReducer(state,{type:"PREDICT"});
  state = analysisReducer(state,{type:"PREDICTED",prediction,requestId:"b"});
  expect(state.prediction).toBe(prediction);
  state = analysisReducer(state,{type:"SELECT_MACHINE",machineId:"2"});
  expect(state.prediction).toBeUndefined();
  state = analysisReducer({...state,workflow:"validating",prediction},{type:"FAIL_VALIDATION",error:new Error("bad")});
  expect(state.prediction).toBeUndefined(); expect(state.machine).toBeUndefined();
  state = analysisReducer({...state,prediction},{type:"SELECT_FILE",file:new File(["y"],"new.csv")});
  expect(state.prediction).toBeUndefined(); expect(state.validation).toBeUndefined();
});

test("enforces the authoritative transition sequence and rejects prohibited actions",()=>{
  const idle=initialAnalysisState;expect(analysisReducer(idle,{type:"PREDICT"})).toBe(idle);expect(analysisReducer(idle,{type:"VALIDATED",validation,requestId:"x"})).toBe(idle);
  const selected=analysisReducer(idle,{type:"SELECT_FILE",file});const validating=analysisReducer(selected,{type:"VALIDATE"});expect(validating.workflow).toBe("validating");
  const ready=analysisReducer(validating,{type:"VALIDATED",validation,requestId:"x"});const inspecting=analysisReducer(ready,{type:"SELECT_MACHINE",machineId:"1"});expect(inspecting.prediction).toBeUndefined();
  const inspected=analysisReducer(inspecting,{type:"INSPECTED",machine});const predicting=analysisReducer(inspected,{type:"PREDICT"});const success=analysisReducer(predicting,{type:"PREDICTED",prediction,requestId:"y"});expect(success.workflow).toBe("prediction-success");
  expect(analysisReducer(success,{type:"PREDICTED",prediction,requestId:"late"})).toBe(success);
  expect(analysisReducer(success,{type:"RESET"})).toEqual(initialAnalysisState);
});

test("prediction failure remains recoverable without retaining a stale result",()=>{const state={workflow:"predicting",file,validation,machineId:"1",machine,prediction} as const;const failed=analysisReducer(state,{type:"FAIL_PREDICTION",error:new Error("offline")});expect(failed.workflow).toBe("prediction-error");expect(failed.prediction).toBeUndefined();expect(failed.file).toBe(file);expect(failed.machine).toBe(machine)});
