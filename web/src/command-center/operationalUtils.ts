import type { MaintenanceStatus } from "../simulation/contracts";

export const statusLabel = (status: MaintenanceStatus) =>
  status.replace("PLAN_MAINTENANCE", "PLAN MAINTENANCE");
