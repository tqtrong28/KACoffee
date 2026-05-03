import type { ReactNode } from "react";

export function StatePanel({
  title,
  message,
  tone = "neutral",
  action,
}: {
  title: string;
  message: string;
  tone?: "neutral" | "error" | "loading";
  action?: ReactNode;
}) {
  return (
    <div className={`state-panel ${tone}`}>
      <div className="state-panel-copy">
        <strong>{title}</strong>
        <p>{message}</p>
      </div>
      {action ? <div className="state-panel-action">{action}</div> : null}
    </div>
  );
}
