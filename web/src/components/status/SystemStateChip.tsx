import { AlertTriangle, CheckCircle2, FlaskConical, ServerOff } from "lucide-react";
import type { StatusData } from "../../api/types";

export function SystemStateChip({ status, unavailable = false }: { status?: StatusData; unavailable?: boolean }) {
  if (unavailable) return <span className="state-chip state-unavailable"><ServerOff /> API unavailable</span>;
  if (!status) return <span className="state-chip"><span className="spinner" /> Checking system</span>;
  if (status.demo_only) return <span className="state-chip state-demo"><FlaskConical /> Demo mode</span>;
  if (!status.prediction_available) return <span className="state-chip state-warning"><AlertTriangle /> Model unavailable</span>;
  if (status.artifact_state === "ARTIFACT_UNAVAILABLE" || status.artifact_state === "ARTIFACT_INVALID") return <span className="state-chip state-warning"><AlertTriangle /> Artifact unavailable</span>;
  return <span className="state-chip state-real"><CheckCircle2 /> Real model ready</span>;
}
