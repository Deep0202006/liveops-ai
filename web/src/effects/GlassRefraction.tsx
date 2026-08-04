import type { ReactNode } from "react";

export function GlassRefraction({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`glass-refraction ${className}`.trim()}>{children}</div>;
}
