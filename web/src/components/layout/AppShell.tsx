import { Activity, Menu, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Link, NavLink } from "react-router-dom";
import { useSystemStatus } from "../../api/queries";
import { SystemStateChip } from "../status/SystemStateChip";

export function Wordmark() { return <Link className="wordmark" aria-label="LiveOps AI home" to="/"><span><Activity /></span><strong>LiveOps AI</strong></Link>; }

export function AppShell({ children, product = false }: { children: ReactNode; product?: boolean }) {
  const [open, setOpen] = useState(false);
  const status = useSystemStatus();
  return <div className={product ? "product-shell" : "site-shell"}>
    <header className={product ? "app-header" : "site-header"}><Wordmark /><nav aria-label="Primary navigation"><NavLink to="/">Product</NavLink><NavLink to="/app/model">Model evidence</NavLink><NavLink className="nav-cta" to="/app">Open workspace</NavLink></nav><button className="menu-button" aria-label="Open navigation" onClick={() => setOpen(true)}><Menu /></button></header>
    {product && <aside className="app-rail" aria-label="Workspace navigation"><Wordmark /><NavLink aria-label="Analysis workspace" to="/app" end><Activity /><span>Analysis</span></NavLink><NavLink aria-label="Model evidence" to="/app/model"><span className="rail-mark">M</span><span>Model evidence</span></NavLink><button aria-label="System status" type="button" onClick={() => setOpen(true)}><span className="rail-dot" /><span>System status</span></button></aside>}
    {open && <div className="sheet-backdrop" onMouseDown={() => setOpen(false)}><section className="status-sheet" role="dialog" aria-modal="true" aria-labelledby="status-title" onKeyDown={(event) => { if (event.key === "Escape") setOpen(false); if (event.key === "Tab") { const nodes = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button,[href],[tabindex]:not([tabindex="-1"])')); const first = nodes[0], last = nodes.at(-1); if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); } else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); } } }} onMouseDown={(e) => e.stopPropagation()}><button autoFocus className="sheet-close" aria-label="Close status" onClick={() => setOpen(false)}><X /></button><span className="eyebrow">System state</span><h2 id="status-title">LiveOps API</h2><SystemStateChip status={status.data?.data} unavailable={status.isError} /><dl>{status.data?.data && Object.entries(status.data.data).map(([key, value]) => <div key={key}><dt>{key.replaceAll("_", " ")}</dt><dd>{String(value)}</dd></div>)}</dl>{status.data?.requestId && <p className="request-id">Request {status.data.requestId}</p>}</section></div>}
    {product && <div className="product-state"><SystemStateChip status={status.data?.data} unavailable={status.isError} /></div>}
    <main id="main-content">{children}</main>
  </div>;
}
