import React from "react";

export default function InlineNotice({ kind = "success", children }) {
  // kind: "success" | "error" | "info"
  const cls =
    "inline-notice " +
    (kind === "error" ? "inline-notice--error" : kind === "info" ? "inline-notice--info" : "inline-notice--ok");

  return <div className={cls}>{children}</div>;
}
