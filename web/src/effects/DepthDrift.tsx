import { useEffect, useRef, type ReactNode } from "react";

export function DepthDrift({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = ref.current;
    if (!element || matchMedia("(prefers-reduced-motion: reduce)").matches || matchMedia("(pointer: coarse)").matches || innerWidth < 1024) return;
    let frame = 0;
    const update = (event: PointerEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (document.hidden) return;
        const box = element.getBoundingClientRect();
        const x = Math.max(-1, Math.min(1, (event.clientX - box.left) / box.width * 2 - 1));
        const y = Math.max(-1, Math.min(1, (event.clientY - box.top) / box.height * 2 - 1));
        element.style.transform = `translate3d(${(x * 4).toFixed(2)}px, ${(y * 4).toFixed(2)}px, 0) rotateX(${(-y * .4).toFixed(2)}deg) rotateY(${(x * .4).toFixed(2)}deg) scale(1.004)`;
      });
    };
    const reset = () => { element.style.transform = ""; };
    element.addEventListener("pointermove", update);
    element.addEventListener("pointerleave", reset);
    return () => { cancelAnimationFrame(frame); element.removeEventListener("pointermove", update); element.removeEventListener("pointerleave", reset); element.style.transform = ""; };
  }, []);
  return <div className={className} ref={ref}>{children}</div>;
}
