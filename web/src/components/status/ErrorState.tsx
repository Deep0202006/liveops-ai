import { AlertTriangle } from "lucide-react";
import { errorPresentation } from "../../api/errors";

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const item = errorPresentation(error);
  return <section className="error-state" role="alert" aria-labelledby="error-title"><AlertTriangle /><div><span className="eyebrow">{item.code}</span><h2 id="error-title">{item.title}</h2><p>{item.message} {item.action}</p>{item.requestId && <code>Request {item.requestId}</code>}</div>{onRetry && <button className="button secondary" type="button" onClick={onRetry}>Retry</button>}</section>;
}
