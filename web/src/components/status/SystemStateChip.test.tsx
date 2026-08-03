import { render, screen } from "@testing-library/react";
import { SystemStateChip } from "./SystemStateChip";
import type { StatusData } from "../../api/types";
const status = {product_name:"LiveOps AI",api_version:"1.0",backend_contract_version:"1.0",run_mode:"demo",backend_state:"SOFTWARE_READY",dataset_state:"SYNTHETIC_DEMO_DATA",model_state:"DEMO_MODEL_TRAINED",artifact_state:"DEMO_ARTIFACT_AVAILABLE",metrics_state:"DEMO_METRICS_NOT_PUBLISHABLE",prediction_available:true,demo_only:true} satisfies StatusData;
test("demo mode is explicit text",()=>{render(<SystemStateChip status={status}/>);expect(screen.getByText("Demo mode")).toBeVisible()});
