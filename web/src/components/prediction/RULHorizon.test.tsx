import { render, screen } from "@testing-library/react";
import { RULHorizon } from "./RULHorizon";
import type { PredictionData } from "../../api/types";

const prediction = { machine_id:7,observed_through_cycle:40,predicted_rul:20,rul_unit:"cycles",maintenance_status:"CRITICAL",lower_bound:null,upper_bound:null,warnings:[],important_features:[],recent_changes:[],model_name:"extra_trees",model_version:"1.0.0",demo_only:false } satisfies PredictionData;
test("announces exact RUL and missing range without inventing certainty",()=>{ render(<RULHorizon prediction={prediction} />); expect(screen.getByRole("img")).toHaveAccessibleName(/no complete prediction range available/i); expect(screen.getByText("20.0")).toBeVisible(); expect(screen.getByText("Critical maintenance")).toBeVisible(); expect(screen.queryByText("Prediction range")).not.toBeInTheDocument(); });

test.each([[0,"CRITICAL"],[24.5,"PLAN_MAINTENANCE"],[79.8,"MONITOR"],[180,"HEALTHY"]] as const)("renders RUL %s and status %s at long cycle histories",(rul,status)=>{render(<RULHorizon prediction={{...prediction,observed_through_cycle:4321,predicted_rul:rul,maintenance_status:status,lower_bound:Math.max(0,rul-5),upper_bound:rul+20}}/>);expect(screen.getByText(rul.toFixed(1))).toBeVisible();expect(screen.getByRole("img")).toHaveAccessibleName(new RegExp(`4321.*${rul.toFixed(1)} cycles`,"i"))});
test("orders and clamps a backward negative range",()=>{render(<RULHorizon prediction={{...prediction,lower_bound:40,upper_bound:-10}}/>);expect(screen.getByRole("img")).toHaveAccessibleName(/range from 0.0 to 40.0/i)});
test("treats either missing endpoint as no complete range",()=>{const {rerender}=render(<RULHorizon prediction={{...prediction,lower_bound:10,upper_bound:null}}/>);expect(screen.getByRole("img")).toHaveAccessibleName(/no complete/i);rerender(<RULHorizon prediction={{...prediction,lower_bound:null,upper_bound:40}}/>);expect(screen.getByRole("img")).toHaveAccessibleName(/no complete/i)});
