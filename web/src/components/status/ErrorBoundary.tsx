import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

type Props = { children: ReactNode; area: "route" | "workspace" | "chart"; resetKey?: string };
type State = { failed: boolean };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { failed: false };
  static getDerivedStateFromError(): State { return { failed: true }; }
  componentDidCatch(error: Error, info: ErrorInfo) { if (import.meta.env.DEV) console.error(`LiveOps ${this.props.area} render failure`, error, info); }
  componentDidUpdate(previous: Props) { if (this.state.failed && previous.resetKey !== this.props.resetKey) this.setState({ failed: false }); }
  render() {
    if (!this.state.failed) return this.props.children;
    return <section className="error-state boundary-error" role="alert"><AlertTriangle /><div><span className="eyebrow">RENDER_FAILURE</span><h2>{this.props.area === "chart" ? "Sensor chart could not render" : "This view could not render"}</h2><p>The rest of LiveOps AI remains safe. Retry this view; no uploaded trajectory was persisted.</p></div><button className="button secondary" type="button" onClick={() => this.setState({ failed: false })}>Retry view</button></section>;
  }
}
