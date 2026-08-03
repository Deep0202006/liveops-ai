import { motion, useReducedMotion } from "motion/react";
import { cn } from "../../lib/cn";

type Variant = "neutral" | "information" | "healthy" | "warning" | "critical";
export function MetricTile({ label, value, detail, variant = "neutral" }: { label: string; value: string; detail?: string; variant?: Variant }) {
  const reduce = useReducedMotion();
  return <motion.div initial={reduce ? false : { y: 6 }} animate={{ y: 0 }} transition={{ duration: 0.22 }} className={cn("metric-tile", `metric-${variant}`)}>
    <span>{label}</span><strong>{value}</strong>{detail && <small>{detail}</small>}
  </motion.div>;
}
