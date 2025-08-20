import { useEffect, useRef, useState } from "react";

/** Inline flash message that auto-clears after `timeoutMs` (default 3500ms). */
export default function useFlashMessage(timeoutMs = 3500) {
  const [text, setText] = useState(null);
  const [kind, setKind] = useState("success"); // "success" | "error" | "info"
  const timerRef = useRef(null);

  const flash = (k, t) => {
    setKind(k);
    setText(t);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setText(null), timeoutMs);
  };

  useEffect(() => () => timerRef.current && clearTimeout(timerRef.current), []);
  return { text, kind, flash, clear: () => setText(null) };
}
