import { useEffect, useRef, type PointerEvent, type ReactNode } from "react";
import { cn } from "../../lib/cn";

export function FocusLensCard({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const frame = useRef<number>();
  const position = useRef({ x: 0, y: 0 });
  useEffect(() => () => { if (frame.current !== undefined) cancelAnimationFrame(frame.current); }, []);
  const move = (event: PointerEvent<HTMLDivElement>) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect || !ref.current) return;
    position.current = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    if (frame.current !== undefined) return;
    frame.current = requestAnimationFrame(() => { ref.current?.style.setProperty("--lens-x", `${position.current.x}px`); ref.current?.style.setProperty("--lens-y", `${position.current.y}px`); frame.current = undefined; });
  };
  return <div ref={ref} onPointerMove={move} className={cn("focus-lens", className)}>{children}</div>;
}
